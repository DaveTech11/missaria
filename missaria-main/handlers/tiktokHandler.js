"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");

const tiktokAuth = require("../services/tiktokAuth");
const tiktokUpload = require("../services/tiktokUpload");
const tiktokTokens = require("../memory/tiktokTokens");

const TMP_ROOT = path.join(os.tmpdir(), "aria-tiktok-uploads");
const MAX_DOWNLOAD_BYTES = 45 * 1024 * 1024; // Telegram Bot API's own getFile cap is ~20MB unless a local Bot API server raises it; leaving headroom here rather than hard-coding one number

function progressText(stage) {
    return [
        "<b>🎵 ᴍɪss ᴀʀɪᴀ • ᴛɪᴋᴛᴏᴋ ᴜᴘʟᴏᴀᴅ</b>",
        "━━━━━━━━━━━━━━━━━━",
        "",
        `${stage}`,
        "",
        "━━━━━━━━━━━━━━━━━━"
    ].join("\n");
}

async function downloadTelegramVideo(bot, fileId, destPath) {
    const link = await bot.getFileLink(fileId);
    const response = await axios.get(link, { responseType: "arraybuffer", timeout: 120000, maxContentLength: Infinity, maxBodyLength: Infinity });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, response.data);
    return destPath;
}

function extractVideoRef(message) {
    if (!message) return null;
    if (message.video) return { fileId: message.video.file_id, fileSize: message.video.file_size };
    if (message.document && (message.document.mime_type || "").startsWith("video/")) {
        return { fileId: message.document.file_id, fileSize: message.document.file_size };
    }
    return null;
}

module.exports = (bot) => {
    tiktokAuth.attachBot(bot);

    // ------------------------------------------------------------
    // /linktiktok — start the OAuth (PKCE) flow for this user
    // ------------------------------------------------------------
    bot.onText(/^\/linktiktok(@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id;

        if (!tiktokAuth.isConfigured()) {
            await bot.sendMessage(chatId, "⚠️ TikTok isn't configured on this bot yet (missing TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET). Ask the bot owner to set those up.");
            return;
        }

        const url = tiktokAuth.buildAuthorizeUrl(msg.from.id, chatId);
        await bot.sendMessage(chatId,
            "🎵 <b>ᴄᴏɴɴᴇᴄᴛ ʏᴏᴜʀ ᴛɪᴋᴛᴏᴋ ᴀᴄᴄᴏᴜɴᴛ</b>\n\nTap below, log in, and approve access. This link is single-use and expires in 10 minutes.",
            { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🔗 Connect TikTok", url }]] } }
        );
    });

    // ------------------------------------------------------------
    // /unlinktiktok — forget this user's tokens
    // ------------------------------------------------------------
    bot.onText(/^\/unlinktiktok(@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id;
        if (!tiktokTokens.has(msg.from.id)) {
            await bot.sendMessage(chatId, "You don't have a TikTok account connected.");
            return;
        }
        tiktokTokens.delete(msg.from.id);
        await bot.sendMessage(chatId, "✅ TikTok account disconnected.");
    });

    // ------------------------------------------------------------
    // /tiktok — reply to a video (or send one with this as the caption)
    // to post it to the connected TikTok account. Anything after the
    // command becomes the TikTok title/caption.
    // ------------------------------------------------------------
    async function handleTiktokPost(msg, videoRef, caption) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        if (!videoRef) {
            await bot.sendMessage(chatId,
                "🎵 Reply to a video with <code>/tiktok</code> to post it to your TikTok — or send a video with <code>/tiktok</code> as its caption.\n\nNot connected yet? Run /linktiktok first.",
                { parse_mode: "HTML" }
            );
            return;
        }

        if (!tiktokAuth.isConfigured()) {
            await bot.sendMessage(chatId, "⚠️ TikTok isn't configured on this bot yet. Ask the bot owner to set TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET.");
            return;
        }

        if (!tiktokTokens.has(userId)) {
            await bot.sendMessage(chatId, "You haven't connected a TikTok account yet — run /linktiktok first, then try again.");
            return;
        }

        if (videoRef.fileSize && videoRef.fileSize > MAX_DOWNLOAD_BYTES) {
            await bot.sendMessage(chatId, `⚠️ That video is too large for me to pull from Telegram (${(videoRef.fileSize / 1024 / 1024).toFixed(1)}MB). Try a shorter/smaller clip.`);
            return;
        }

        const statusMsg = await bot.sendMessage(chatId, progressText("⬇️ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴠɪᴅᴇᴏ ꜰʀᴏᴍ ᴛᴇʟᴇɢʀᴀᴍ..."), { parse_mode: "HTML" });
        const edit = (stage) => bot.editMessageText(progressText(stage), { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: "HTML" }).catch(() => {});

        const localPath = path.join(TMP_ROOT, String(userId), `${Date.now()}.mp4`);

        try {
            await downloadTelegramVideo(bot, videoRef.fileId, localPath);

            edit("🔐 ᴄʜᴇᴄᴋɪɴɢ ʏᴏᴜʀ ᴛɪᴋᴛᴏᴋ ᴄᴏɴɴᴇᴄᴛɪᴏɴ...");
            const accessToken = await tiktokAuth.getValidAccessToken(userId);
            if (!accessToken) {
                await edit("❌ ʏᴏᴜʀ ᴛɪᴋᴛᴏᴋ ᴄᴏɴɴᴇᴄᴛɪᴏɴ ᴇxᴘɪʀᴇᴅ.");
                await bot.sendMessage(chatId, "Your TikTok connection expired or was revoked. Run /linktiktok to reconnect.");
                return;
            }

            edit("📤 ᴜᴘʟᴏᴀᴅɪɴɢ ᴛᴏ ᴛɪᴋᴛᴏᴋ...");
            const videoBuffer = fs.readFileSync(localPath);
            const result = await tiktokUpload.postVideo(accessToken, videoBuffer, { title: caption || "" });

            if (!result.success) {
                await edit("❌ ᴛɪᴋᴛᴏᴋ ᴄᴏᴜʟᴅɴ'ᴛ ᴘʀᴏᴄᴇss ᴛʜᴇ ᴠɪᴅᴇᴏ.");
                await bot.sendMessage(chatId, `⚠️ TikTok rejected the upload: ${result.error || "unknown error"}`);
                return;
            }

            await edit("✅ ᴘᴏsᴛᴇᴅ!");
            const privacyNote = result.privacyLevel === "SELF_ONLY"
                ? "\n\n⚠️ Posted as <b>private</b> (visible only to you) — TikTok forces this for apps that haven't passed their review yet."
                : "";
            await bot.sendMessage(chatId, `✅ <b>ᴜᴘʟᴏᴀᴅᴇᴅ ᴛᴏ ᴛɪᴋᴛᴏᴋ</b>${privacyNote}\n\nOpen the TikTok app to check on it.`, { parse_mode: "HTML" });

        } catch (err) {
            console.error("tiktokHandler upload error:", err.response?.data || err.message);
            await edit("❌ sᴏᴍᴇᴛʜɪɴɢ ᴡᴇɴᴛ ᴡʀᴏɴɢ.");
            await bot.sendMessage(chatId, "⚠️ Something went wrong posting that to TikTok. Please try again in a moment.");
        } finally {
            fs.rm(path.dirname(localPath), { recursive: true, force: true }, () => {});
        }
    }

    // Trigger 1: reply to an existing video with /tiktok
    bot.onText(/^\/tik(?:tok|to)(@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, match) => {
        if (!msg.reply_to_message) return handleTiktokPost(msg, null, null); // shows usage instructions
        const videoRef = extractVideoRef(msg.reply_to_message);
        const caption = (match && match[2]) ? match[2].trim() : (msg.reply_to_message.caption || "");
        await handleTiktokPost(msg, videoRef, caption);
    });

    // Trigger 2: send a video with "/tiktok" (optionally + text) as its caption
    bot.on("video", async (msg) => {
        const caption = String(msg.caption || "");
        const m = caption.match(/^\/tik(?:tok|to)(@\w+)?(?:\s+([\s\S]+))?$/i);
        if (!m) return;
        const videoRef = extractVideoRef(msg);
        await handleTiktokPost(msg, videoRef, m[2] ? m[2].trim() : "");
    });
};
