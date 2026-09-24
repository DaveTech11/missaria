/**
 * Telegram Rich Message compatibility layer for Miss Aria.
 *
 * Adapted from the Bloom Petal rich-message implementation:
 * - uses Telegram's sendRichMessage API
 * - keeps reply_markup OUTSIDE rich_message
 * - falls back cleanly when a client/API deployment does not support rich messages
 *
 * Extra Telegram presentation:
 * - image/header/divider cards
 * - semantic feature tables
 * - rich AI paragraphs
 * - inline keyboards on rich messages
 */

const DEFAULT_HEADER = process.env.RICH_HEADER || "🌸 Miss Aria";

function clampHeadingSize(size) {
  const n = Number(size);
  return Number.isFinite(n) ? Math.min(6, Math.max(1, Math.trunc(n))) : 3;
}

function safeText(value) {
  return String(value == null ? "" : value);
}

function richPhoto(url) {
  return {
    type: "photo",
    photo: { type: "photo", media: safeText(url) }
  };
}

function richHeader(text, size = 3) {
  return {
    type: "heading",
    text: safeText(text),
    size: clampHeadingSize(size)
  };
}

function richText(text) {
  return {
    type: "paragraph",
    text: safeText(text)
  };
}

function richDivider() {
  return { type: "divider" };
}

function richTable(headers = [], rows = [], options = {}) {
  const headerRow = Array.isArray(headers) ? headers.slice(0, 20) : [];
  const bodyRows = Array.isArray(rows) ? rows : [];
  const columnCount = headerRow.length || Math.min(
    20,
    bodyRows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0)
  );

  const cell = (value, isHeader = false) => ({
    text: safeText(value),
    align: isHeader ? "center" : "left",
    valign: "middle",
    ...(isHeader ? { is_header: true } : {})
  });

  const cells = [];
  if (headerRow.length) {
    cells.push(Array.from({ length: columnCount }, (_, i) => cell(headerRow[i] ?? "", true)));
  }
  for (const row of bodyRows) {
    if (!Array.isArray(row)) continue;
    cells.push(Array.from({ length: columnCount }, (_, i) => cell(row[i] ?? "")));
  }

  return {
    type: "table",
    cells,
    ...(options.bordered !== false ? { is_bordered: true } : {}),
    ...(options.striped ? { is_striped: true } : {}),
    ...(options.caption ? { caption: safeText(options.caption) } : {})
  };
}

function richButtons(replyMarkup) {
  const rows = replyMarkup?.inline_keyboard || [];
  return {
    inline_keyboard: rows
      .filter(Array.isArray)
      .map(row => row.slice(0, 8).map(button => ({ ...button })))
  };
}

function normalizeBlocks(blocks, { addHeader = true, header = DEFAULT_HEADER } = {}) {
  const safe = Array.isArray(blocks)
    ? blocks.flat(Infinity).filter(
        block => block && typeof block === "object" && !Array.isArray(block)
      )
    : [];

  // `thinking` is only valid for sendRichMessageDraft.
  const withoutThinking = safe.filter(block => block.type !== "thinking");

  if (!addHeader || withoutThinking.some(block => block.type === "heading")) {
    return withoutThinking;
  }

  return [richHeader(header, 3), richDivider(), ...withoutThinking];
}

/**
 * Send a Telegram Rich Message. Returns null on API incompatibility so
 * callers can immediately use the normal Bot API fallback.
 */
async function sendRichMessage(bot, chatId, richMessage, options = {}) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN ||
    "";

  if (!token) throw new Error("Telegram bot token is missing");

  const { reply_markup, ...rest } = richMessage || {};
  const payload = {
    chat_id: chatId,
    rich_message: {
      ...rest,
      blocks: normalizeBlocks(rest.blocks, options)
    }
  };

  if (reply_markup) payload.reply_markup = richButtons(reply_markup);
  if (options.reply_to_message_id) {
    payload.reply_to_message_id = options.reply_to_message_id;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendRichMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    const error = new Error(
      data.description || `Telegram Rich Message API failed (${response.status})`
    );
    error.response = {
      statusCode: response.status,
      error_code: data.error_code
    };
    throw error;
  }

  return data.result;
}

async function trySendRichCard(bot, chatId, {
  imageUrl,
  title = "🌸 Miss Aria",
  text = "",
  replyMarkup,
  table,
  replyToMessageId
} = {}) {
  const blocks = [];
  if (imageUrl) blocks.push(richPhoto(imageUrl));
  blocks.push(richHeader(title, 3), richDivider());

  if (text) blocks.push(richText(text));

  if (table?.headers || table?.rows) {
    blocks.push(
      richDivider(),
      richTable(table.headers || [], table.rows || [], table.options || {})
    );
  }

  try {
    return await sendRichMessage(
      bot,
      chatId,
      { blocks, reply_markup: replyMarkup },
      { addHeader: false, reply_to_message_id: replyToMessageId }
    );
  } catch (error) {
    // Rich messages are an enhancement, never a hard dependency.
    console.warn("[ARIA RICH] Rich message unavailable; using normal Telegram message:", error?.message || error);
    return null;
  }
}

function textToRichBlocks(text, maxParagraphs = 12) {
  const raw = safeText(text).trim();
  if (!raw) return [richText("")];

  const lines = raw.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push(richText(paragraph.join("\n").trim()));
      paragraph = [];
    }
  };

  for (const line of lines) {
    const value = line.trim();

    if (!value) {
      flush();
      continue;
    }

    // Markdown-style headings become semantic Telegram headings.
    const heading = value.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flush();
      blocks.push(richHeader(heading[1].replace(/\*+/g, ""), 4));
      continue;
    }

    // Preserve simple quote-style AI output as a real rich paragraph.
    if (/^>\s?/.test(value)) {
      flush();
      blocks.push({
        type: "block_quotation",
        text: value.replace(/^>\s?/, "")
      });
      continue;
    }

    paragraph.push(line);
    if (blocks.filter(b => b.type === "paragraph").length >= maxParagraphs) break;
  }

  flush();
  return blocks.length ? blocks : [richText(raw)];
}

module.exports = {
  richPhoto,
  richHeader,
  richText,
  richDivider,
  richTable,
  richButtons,
  normalizeBlocks,
  sendRichMessage,
  trySendRichCard,
  textToRichBlocks
};
