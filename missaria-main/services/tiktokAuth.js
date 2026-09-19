"use strict";

// TikTok Login Kit (v2, PKCE) — connects a Telegram user's TikTok account so
// handlers/tiktokHandler.js can post video on their behalf via the Content
// Posting API (services/tiktokUpload.js).
//
// Docs referenced: developers.tiktok.com — oauth-user-access-token-management,
// login-kit-desktop (PKCE parameters).
//
// Required env vars:
//   TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET   — from the TikTok developer portal
//   TIKTOK_REDIRECT_URI (optional)            — overrides the auto-detected callback URL;
//                                                must exactly match what's registered in
//                                                the portal, protocol + host + path.
//
// NOTE: until this app passes TikTok's audit, every video it posts is forced
// into private/self-only visibility by TikTok itself, regardless of what
// privacy_level is requested — that's a TikTok-side restriction, not a bug
// here. handlers/tiktokHandler.js tells the user this up front.

const axios = require("axios");
const crypto = require("crypto");
const { URLSearchParams } = require("url");
const tokens = require("../memory/tiktokTokens");

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const SCOPES = "user.info.basic,video.publish,video.upload";

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";

// state -> { userId, chatId, codeVerifier, createdAt }
const pending = new Map();
const PENDING_TTL_MS = 10 * 60 * 1000; // a login link is only good for 10 minutes

let botRef = null;
function attachBot(bot) { botRef = bot; }

function base64url(buf) {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makePkcePair() {
    const codeVerifier = base64url(crypto.randomBytes(48));
    const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
    return { codeVerifier, codeChallenge };
}

function isConfigured() {
    return Boolean(CLIENT_KEY && CLIENT_SECRET);
}

function redirectUri() {
    if (process.env.TIKTOK_REDIRECT_URI) return process.env.TIKTOK_REDIRECT_URI;
    const base = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 10000}`;
    return base.replace(/\/+$/, "") + "/tiktok/callback";
}

function cleanupExpiredPending() {
    const now = Date.now();
    for (const [state, entry] of pending) {
        if (now - entry.createdAt > PENDING_TTL_MS) pending.delete(state);
    }
}

/**
 * Build the TikTok authorize URL for this Telegram user and stash the PKCE
 * verifier + where to reply, keyed by a random `state`.
 */
function buildAuthorizeUrl(userId, chatId) {
    cleanupExpiredPending();
    const state = base64url(crypto.randomBytes(24));
    const { codeVerifier, codeChallenge } = makePkcePair();
    pending.set(state, { userId: String(userId), chatId, codeVerifier, createdAt: Date.now() });

    const params = new URLSearchParams({
        client_key: CLIENT_KEY,
        response_type: "code",
        scope: SCOPES,
        redirect_uri: redirectUri(),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
    });

    return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code, codeVerifier) {
    const body = new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(),
        code_verifier: codeVerifier
    });
    const { data } = await axios.post(TOKEN_URL, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000
    });
    return data; // { access_token, expires_in, refresh_token, refresh_expires_in, open_id, scope, token_type }
}

async function refreshAccessToken(refreshToken) {
    const body = new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken
    });
    const { data } = await axios.post(TOKEN_URL, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20000
    });
    return data;
}

/**
 * Returns a currently-valid access token for this user, refreshing first if
 * it's within 2 minutes of expiry. Returns null if the user has never linked
 * (or their refresh token itself has expired and they need to /linktiktok again).
 */
async function getValidAccessToken(userId) {
    const record = tokens.get(userId);
    if (!record) return null;

    const stillFresh = record.expiresAt && Date.now() < record.expiresAt - 2 * 60 * 1000;
    if (stillFresh) return record.accessToken;

    if (!record.refreshToken) return null;

    try {
        const refreshed = await refreshAccessToken(record.refreshToken);
        tokens.set(userId, {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || record.refreshToken,
            openId: refreshed.open_id || record.openId,
            expiresAt: Date.now() + (refreshed.expires_in || 0) * 1000
        });
        return refreshed.access_token;
    } catch (err) {
        console.error("tiktokAuth refresh error:", err.response?.data || err.message);
        tokens.delete(userId); // refresh token is dead — force a clean re-link
        return null;
    }
}

function pageHtml(title, message) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070707;color:#eee;font:16px system-ui;padding:24px;text-align:center}
main{max-width:420px}h1{font-size:22px}p{color:#aaa}</style></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;
}

/**
 * HTTP handler for GET /tiktok/callback?code=...&state=...
 * Wired into server/ariaDashboard.js. `parsedUrl` is the already-parsed
 * WHATWG URL of the incoming request.
 */
async function handleCallbackRequest(req, res, parsedUrl) {
    const code = parsedUrl.searchParams.get("code");
    const state = parsedUrl.searchParams.get("state");
    const error = parsedUrl.searchParams.get("error");

    const entry = state ? pending.get(state) : null;
    if (state) pending.delete(state); // one-time use either way

    if (error || !code || !entry) {
        res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
        res.end(pageHtml("❌ TikTok connection failed", error ? "TikTok reported: " + error : "This login link is invalid or has expired — go back to Telegram and run /linktiktok again."));
        return;
    }

    try {
        const result = await exchangeCodeForToken(code, entry.codeVerifier);
        tokens.set(entry.userId, {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            openId: result.open_id,
            expiresAt: Date.now() + (result.expires_in || 0) * 1000
        });

        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(pageHtml("✅ TikTok connected", "You can close this tab and go back to Telegram."));

        if (botRef && entry.chatId) {
            await botRef.sendMessage(
                entry.chatId,
                "✅ <b>ᴛɪᴋᴛᴏᴋ ᴄᴏɴɴᴇᴄᴛᴇᴅ</b>\n\nReply to any video with <code>/tiktok</code> to post it to your account.\n\n⚠️ Until this app passes TikTok's review, everything it posts is forced private (visible only to you) — that's a TikTok-side restriction on unaudited apps, not something this bot controls.",
                { parse_mode: "HTML" }
            ).catch(() => {});
        }
    } catch (err) {
        console.error("tiktokAuth callback error:", err.response?.data || err.message);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(pageHtml("❌ TikTok connection failed", "Something went wrong finishing the connection. Go back to Telegram and try /linktiktok again."));
        if (botRef && entry.chatId) {
            await botRef.sendMessage(entry.chatId, "❌ TikTok connection failed. Please try /linktiktok again.").catch(() => {});
        }
    }
}

module.exports = {
    attachBot,
    isConfigured,
    buildAuthorizeUrl,
    getValidAccessToken,
    handleCallbackRequest
};
