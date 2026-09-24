// ============================================================
// socialDownloader.js
//
// Wraps api-rebix.vercel.app endpoints for pulling media from
// social links.
//
// CONFIRMED working endpoints (given by you):
//   Twitter/X:    /api/xdl?url=...
//   Facebook:     /api/facebook?url=...
//   Apple Music:  /api/applemusic?q=...
//
// UNCONFIRMED (Spotify/YouTube/TikTok/Instagram/SoundCloud):
// I don't have documented endpoints for these on api-rebix, so
// they're wired using the same naming convention as the confirmed
// ones as a best guess. They may 404 or return a different shape
// until you confirm the real paths — if one fails, tell me the
// working endpoint/response shape and I'll fix just that one.
// ============================================================

const axios = require("axios");

const BASE = "https://api-rebix.vercel.app/api";

async function callApi(path, params) {
    const res = await axios.get(`${BASE}/${path}`, { params, timeout: 30000 });
    return res.data;
}

// ---- Confirmed ----

async function downloadTwitter(url) {
    return callApi("xdl", { url });
}

async function downloadFacebook(url) {
    return callApi("facebook", { url });
}

async function downloadAppleMusic(query) {
    return callApi("applemusic", { q: query });
}

// ---- Unconfirmed (same naming convention, best guess) ----

async function downloadSpotify(query) {
    return callApi("spotify", { q: query });
}

async function downloadYouTube(url) {
    return callApi("youtube", { url });
}

async function downloadTikTok(url) {
    return callApi("tiktok", { url });
}

async function downloadInstagram(url) {
    return callApi("instagram", { url });
}

async function downloadSoundCloud(url) {
    return callApi("soundcloud", { url });
}

// ---- Direct media link: just hand back the URL info, bot.js sends it directly ----

function isDirectMediaUrl(url) {
    return /\.(mp3|mp4|wav|m4a|mov|webm|ogg|jpg|jpeg|png|gif)(\?.*)?$/i.test(url);
}

const PLATFORMS = {
    spotify: { label: "Spotify", fn: downloadSpotify, inputType: "query", confirmed: false },
    youtube: { label: "YouTube", fn: downloadYouTube, inputType: "url", confirmed: false },
    tiktok: { label: "TikTok", fn: downloadTikTok, inputType: "url", confirmed: false },
    instagram: { label: "Instagram", fn: downloadInstagram, inputType: "url", confirmed: false },
    facebook: { label: "Facebook", fn: downloadFacebook, inputType: "url", confirmed: true },
    twitter: { label: "X (Twitter)", fn: downloadTwitter, inputType: "url", confirmed: true },
    soundcloud: { label: "SoundCloud", fn: downloadSoundCloud, inputType: "url", confirmed: false },
    applemusic: { label: "Apple Music", fn: downloadAppleMusic, inputType: "query", confirmed: true }
};

// Try to pull a usable media URL out of whatever shape the API returns —
// these third-party wrapper APIs aren't consistently documented, so this
// checks the common field names.
function extractMediaUrl(data) {
    if (!data) return null;
    if (typeof data === "string") return data;

    const candidates = [
        data.url, data.download, data.downloadUrl, data.result,
        data.link, data.media, data.audio, data.video
    ];
    for (const c of candidates) {
        if (typeof c === "string" && c.startsWith("http")) return c;
        if (c && typeof c === "object") {
            const nested = extractMediaUrl(c);
            if (nested) return nested;
        }
    }
    if (Array.isArray(data) && data.length) return extractMediaUrl(data[0]);
    return null;
}

module.exports = {
    PLATFORMS,
    isDirectMediaUrl,
    extractMediaUrl,
    downloadTwitter,
    downloadFacebook,
    downloadAppleMusic,
    downloadSpotify,
    downloadYouTube,
    downloadTikTok,
    downloadInstagram,
    downloadSoundCloud
};
