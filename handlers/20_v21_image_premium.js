'use strict';

const CARD = "https://files.catbox.moe/hjdxgx.jpg";

module.exports = function register(ctx) {
  const { bot } = ctx;

  const premiumMessage = `<blockquote expandable='true'>
⭐ <b>ᴍɪss ᴀʀɪᴀ ᴘʀᴇᴍɪᴜᴍ</b>

ᴜɴʟᴏᴄᴋ ᴍᴏʀᴇ ᴛʜᴀɴ ᴛʜᴇ ғʀᴇᴇ ᴘʟᴀɴ.

🎨 ᴜɴʟɪᴍɪᴛᴇᴅ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ
🧠 ᴘʀᴇᴍɪᴜᴍ ᴀɪ ᴀᴄᴄᴇss
💻 ᴘʀᴇᴍɪᴜᴍ ᴄᴏᴅɪɴɢ
🔎 ʀᴇsᴇᴀʀᴄʜ & ᴀᴅᴠᴀɴᴄᴇᴅ ᴛᴏᴏʟs
📁 ғɪʟᴇ ᴀɪ
🎙️ ᴠᴏɪᴄᴇ & ᴍᴇᴅɪᴀ ғᴇᴀᴛᴜʀᴇs

⭐ ᴘʀᴇᴍɪᴜᴍ ɪs ᴀᴄᴛɪᴠᴀᴛᴇᴅ ɪᴍᴍᴇᴅɪᴀᴛᴇʟʏ ᴡʜᴇɴ ᴛʜᴇ ᴏᴡɴᴇʀ ɢɪᴠᴇs ɪᴛ ᴛᴏ ʏᴏᴜ.
</blockquote>`;

  const ownerMessage = `<blockquote expandable='true'>
👑 <b>ᴍɪss ᴀʀɪᴀ ᴏᴡɴᴇʀ</b>

ᴛᴏ ɢᴇᴛ ᴘʀᴇᴍɪᴜᴍ, ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴏᴡɴᴇʀ.

👑 <b>ᴏᴡɴᴇʀ:</b> @devdavex

ᴍᴇɴᴛɪᴏɴ ᴛʜᴀᴛ ʏᴏᴜ ᴡᴀɴᴛ ᴍɪss ᴀʀɪᴀ ᴘʀᴇᴍɪᴜᴍ.
</blockquote>`;

  const sendCard = (chatId, text, markup) =>
    bot.sendPhoto(chatId, CARD, {
      caption: text,
      parse_mode: "HTML",
      reply_markup: markup
    }).catch(() => bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: markup
    }));

  bot.on("callback_query", async (q) => {
    const data = String(q.data || "");
    if (data !== "aria_premium_info" && data !== "aria_owner_info") return;

    try { await bot.answerCallbackQuery(q.id); } catch {}

    if (data === "aria_premium_info") {
      return sendCard(q.message.chat.id, premiumMessage, {
        inline_keyboard: [
          [{ text: "👑 ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ", url: "https://t.me/devdavex", style: "success" }],
          [{ text: "‹ ʙᴀᴄᴋ", callback_data: "main_menu", style: "primary" }]
        ]
      });
    }

    return sendCard(q.message.chat.id, ownerMessage, {
      inline_keyboard: [
        [{ text: "⭐ ᴘʀᴇᴍɪᴜᴍ", callback_data: "aria_premium_info", style: "success" }],
        [{ text: "‹ ʙᴀᴄᴋ", callback_data: "main_menu", style: "primary" }]
      ]
    });
  });
};
