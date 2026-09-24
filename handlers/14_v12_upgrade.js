"use strict";

/* V12 compatibility card: a single place for the new companion dashboard. */
module.exports = function register(ctx) {
  const { bot } = ctx;
  bot.onText(/^\/(?:features|companion)(?:@\w+)?$/i, async (msg) => {
    const text = `<blockquote><b>🌸 ᴍɪss ᴀʀɪᴀ — ғᴇᴀᴛᴜʀᴇs</b>\n━━━━━━━━━━━━━━━━━━━━\n\n🧠 sᴍᴀʀᴛ ᴀɪ & ᴀᴜᴛᴏ ᴍᴏᴅᴇs\n💬 ɴᴏ sɪɢɴᴜᴘ\n🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ\n💻 ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ\n🔎 ʀᴇsᴇᴀʀᴄʜ\n📚 ᴛᴜᴛᴏʀ\n🧠 ᴍᴇᴍᴏʀʏ\n🔄 ʀᴇɢᴇɴᴇʀᴀᴛᴇ\n✨ ɪᴍᴘʀᴏᴠᴇ\n🧠 ᴄᴏɴᴛɪɴᴜᴇ\n📊 ᴜsᴀɢᴇ & ʟɪᴍɪᴛs\n🎮 ɢᴀᴍᴇs\n🎵 ᴍᴜsɪᴄ & 🎬 ᴍᴏᴠɪᴇs\n📁 ғɪʟᴇ ɪɴᴛᴇʟʟɪɢᴇɴᴄᴇ\n━━━━━━━━━━━━━━━━━━━━</blockquote>`;
    return bot.sendPhoto(msg.chat.id, "https://files.catbox.moe/hjdxgx.jpg", {
      caption: text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [
        [{ text: "🧠 ᴀɪ ᴍᴏᴅᴇs", callback_data: "aria_mode_open", style: "success" }, { text: "🧠 ᴍᴇᴍᴏʀʏ", callback_data: "aria_memory_open", style: "primary" }, { text: "📊 ᴜsᴀɢᴇ", callback_data: "aria_usage", style: "primary" }],
        [{ text: "🎨 ɪᴍᴀɢᴇs", callback_data: "hub_images", style: "success" }, { text: "💻 ᴄᴏᴅɪɴɢ", callback_data: "hub_code", style: "primary" }, { text: "🔎 ʀᴇsᴇᴀʀᴄʜ", callback_data: "hub_web", style: "primary" }],
        [{ text: "🏠 ʜᴏᴍᴇ", callback_data: "main_menu", style: "success" }]
      ] }
    }).catch(() => bot.sendMessage(msg.chat.id, text, { parse_mode: "HTML" }));
  });
};
