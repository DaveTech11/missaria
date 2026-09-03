// utils/telegramRichText.js
//
// Converts the AI's raw (markdown-ish) reply text into real Telegram
// HTML formatting (bold / italic / inline code / code blocks / links /
// bullet lists), safely HTML-escapes everything else, and can chunk
// long replies for Telegram's 4096-char limit without ever splitting
// inside a tag or leaving a tag unclosed.
//
// Design notes:
// - Code spans/blocks are pulled out FIRST and replaced with placeholders,
//   so nothing inside them is touched by markdown or small-caps
//   conversion (code must stay literal).
// - Small-caps styling (via applySmallCaps) is applied only to plain
//   prose text, never to code, link URLs, or already-placed HTML tags.
// - splitTelegramHtml tracks which formatting tags are open at each
//   point and, if forced to cut inside one, closes it at the end of a
//   chunk and reopens it at the start of the next — so every chunk sent
//   to Telegram is independently valid HTML.

const CODE_BLOCK_RE = /```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`\n]+)`/g;

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------- small caps ----------------
const SMALLCAPS_MAP = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ",
  i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
  q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
  y: "ʏ", z: "ᴢ",
};
function applySmallCaps(str) {
  return String(str == null ? "" : str).replace(/[a-zA-Z]/g, (ch) => {
    const lower = ch.toLowerCase();
    return SMALLCAPS_MAP[lower] || ch;
  });
}

// ---------------- markdown -> Telegram HTML ----------------
// smallCaps: whether to stylize plain prose text (default true — code,
// links, and already-escaped HTML entities are never touched).
function mdToTelegramHtml(raw, { smallCaps = true } = {}) {
  const text = String(raw == null ? "" : raw);

  // 1. Pull out code blocks/spans into placeholders so nothing later
  //    touches their contents.
  const placeholders = [];
  function stash(html) {
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(html);
    return token;
  }

  let working = text.replace(CODE_BLOCK_RE, (_, _lang, code) => {
    return stash(`<pre>${escapeHtml(code.replace(/\n$/, ""))}</pre>`);
  });
  working = working.replace(INLINE_CODE_RE, (_, code) => {
    return stash(`<code>${escapeHtml(code)}</code>`);
  });

  // 2. Links: [label](url) -> placeholder BEFORE escaping/bold-italic,
  //    since the label may itself contain other markdown.
  working = working.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    const inner = mdToTelegramHtml(label, { smallCaps }); // recurse for nested emphasis
    return stash(`<a href="${escapeHtml(url)}">${inner}</a>`);
  });

  // 2b. Bare URLs (not wrapped in markdown [label](url)) must also be
  //     protected from small-caps — capitalization changes break the
  //     actual link. Leave them as literal escaped text (Telegram
  //     auto-links plain http(s) text on its own).
  working = working.replace(/https?:\/\/[^\s<>")]+/g, (url) => stash(escapeHtml(url)));

  // 3. Small-caps the raw prose NOW, before escaping — smallcaps only
  //    matches [a-zA-Z] so it can't touch punctuation, and running it
  //    before escapeHtml avoids mangling "&" into "&ᴀᴍᴘ;" (escaping
  //    first, then small-capsing, would corrupt the entity's letters).
  //    Placeholders (\u0000N\u0000) contain no a-z letters either way.
  if (smallCaps) working = applySmallCaps(working);

  // 4. Escape everything that's left (plain prose + markdown markers).
  working = escapeHtml(working);

  // 5. Headers (# / ## / ###) -> bold line
  working = working.replace(/^#{1,6}\s+(.+)$/gm, (_, h) => `<b>${h}</b>`);

  // 6. Bold / italic / strikethrough
  working = working
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<b><i>$1</i></b>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<i>$2</i>")
    .replace(/__([^_]+)__/g, "<b>$1</b>")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<i>$2</i>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>");

  // 7. Bullet lists: leading "- " / "* " -> "• "
  working = working.replace(/^[ \t]*[-*][ \t]+/gm, "• ");

  // 8. Restore code/link placeholders.
  working = working.replace(/\u0000(\d+)\u0000/g, (_, i) => placeholders[Number(i)]);

  return working.trim();
}

// ---------------- safe chunking for Telegram's 4096-char limit ----------------
// Token-based: the html is split into a flat list of {tag} and {text}
// tokens up front. Every token — tag OR text-word — is budget-checked
// BEFORE being appended, so a chunk can never end mid-tag (the previous
// bug: a tag's opening characters could land in one chunk while a
// same-token whitespace-break truncated them back out, leaving a
// dangling closing tag with no matching open).
const TRACKED_TAGS = ["b", "i", "s", "u", "code", "pre"]; // tg-spoiler omitted: rare in AI prose
const TAG_RE = /<\/?([a-zA-Z0-9]+)[^>]*>/g;

function closeAll(stack) {
  return stack.slice().reverse().map((t) => `</${t}>`).join("");
}
function openAll(stack) {
  return stack.map((t) => `<${t}>`).join("");
}

function tokenize(html) {
  const tokens = [];
  let last = 0;
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(html))) {
    if (m.index > last) tokens.push({ type: "text", value: html.slice(last, m.index) });
    tokens.push({
      type: "tag",
      value: m[0],
      name: m[1].toLowerCase(),
      closing: m[0][1] === "/",
      selfClosing: m[0].endsWith("/>"),
    });
    last = TAG_RE.lastIndex;
  }
  if (last < html.length) tokens.push({ type: "text", value: html.slice(last) });
  return tokens;
}

function splitTelegramHtml(html, maxLength = 4096) {
  if (html.length <= maxLength) return [html];

  const tokens = tokenize(html);
  const chunks = [];
  let stack = [];
  let buf = "";

  function flush() {
    if (buf.length > openAll(stack).length) chunks.push(buf + closeAll(stack));
    buf = openAll(stack);
  }
  // Ensures `piece` (a tag or a single space-terminated word) fits in the
  // current buf given what closing tags would be owed; flushes first if not.
  function place(piece, stackAfter) {
    const need = piece.length + closeAll(stackAfter).length;
    if (buf.length + need > maxLength && buf.length > openAll(stack).length) {
      flush();
    }
    buf += piece;
  }

  for (const tok of tokens) {
    if (tok.type === "tag") {
      let stackAfter = stack;
      if (TRACKED_TAGS.includes(tok.name)) {
        if (tok.closing) {
          stackAfter = stack.slice();
          const idx = stackAfter.lastIndexOf(tok.name);
          if (idx !== -1) stackAfter.splice(idx, 1);
        } else if (!tok.selfClosing) {
          stackAfter = stack.concat([tok.name]);
        }
      }
      place(tok.value, stackAfter);
      stack = stackAfter;
    } else {
      // Text token: break into space-terminated words so we can wrap
      // at whitespace instead of mid-word.
      const words = tok.value.match(/\S*\s*/g) || [];
      for (const w of words) {
        if (!w) continue;
        if (w.length + closeAll(stack).length > maxLength) {
          // Pathological case: single "word" longer than the whole
          // budget (e.g. a huge no-space code line). Hard-slice it.
          let remaining = w;
          while (remaining.length) {
            const room = maxLength - buf.length - closeAll(stack).length;
            if (room <= 0) { flush(); continue; }
            const take = Math.min(room, remaining.length);
            buf += remaining.slice(0, take);
            remaining = remaining.slice(take);
          }
        } else {
          place(w, stack);
        }
      }
    }
  }

  flush();
  return chunks.filter((c) => c.trim().length > 0);
}

// Convenience: markdown -> array of Telegram-ready HTML chunks, ready
// to send with { parse_mode: "HTML" }.
function formatAiReplyForTelegram(raw, opts) {
  const html = mdToTelegramHtml(raw, opts);
  return splitTelegramHtml(html, 4096);
}

module.exports = {
  escapeHtml,
  applySmallCaps,
  mdToTelegramHtml,
  splitTelegramHtml,
  formatAiReplyForTelegram,
};
