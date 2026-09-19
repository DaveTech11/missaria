"use strict";

/**
 * Shared Miss Aria command-card UI.
 * Keeps command responses visually consistent with /start:
 * image -> structured caption -> inline buttons (up to 3 per row).
 */
const DEFAULT_IMAGE = "https://files.catbox.moe/hjdxgx.jpg";

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowify(buttons = [], width = 3) {
  const rows = [];
  for (let i = 0; i < buttons.length; i += width) rows.push(buttons.slice(i, i + width));
  return rows;
}

function caption({ title, subtitle, rows = [], bullets = [], footer = "Miss Aria • AI Companion" }) {
  const lines = [
    "<blockquote expandable='true'>",
    `🌸 <b>${esc(title || "Miss Aria")}</b>`,
    subtitle ? `<i>${esc(subtitle)}</i>` : "",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
  ];

  for (const row of rows) {
    lines.push(`${row.icon || "•"} <b>${esc(row.label || "")}</b>  ${esc(row.value || "")}`);
  }

  if (rows.length && bullets.length) lines.push("");
  for (const item of bullets) lines.push(`• ${esc(item)}`);

  lines.push("", "━━━━━━━━━━━━━━━━━━", "", `<i>${esc(footer)}</i>`, "</blockquote>");
  return lines.filter((x) => x !== null && x !== undefined).join("\n");
}

async function sendCard(bot, chatId, options = {}) {
  const image = options.image || DEFAULT_IMAGE;
  const text = options.caption || caption(options);
  const extra = {
    parse_mode: "HTML",
    ...(options.reply_to_message_id ? { reply_to_message_id: options.reply_to_message_id } : {}),
    ...(options.reply_markup ? { reply_markup: options.reply_markup } : {}),
  };
  try {
    return await bot.sendPhoto(chatId, image, { caption: text, ...extra });
  } catch (err) {
    console.error("[ARIA CARD] sendPhoto failed:", err.message);
    return bot.sendMessage(chatId, text, extra);
  }
}

module.exports = { DEFAULT_IMAGE, esc, rowify, caption, sendCard };
