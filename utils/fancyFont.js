// utils/fancyFont.js
//
// One consistent "fancy font" renderer for the admin-facing screens
// added this round (admin panel / anti-spam settings / moderation
// dashboard / suspicious-conversation alerts).
//
// The mockups you sent mixed a couple of different font-generator
// styles in the same paste (compare "🛡 α∂мιη ρσηтяσℓ" against
// "📱 ᴡʜᴀᴛsᴀᴘᴘ: 🟢 ᴏɴʟɪɴᴇ" — those are two different generators).
// Rather than guess screen-by-screen which one you meant where, this
// standardizes on ONE style everywhere in the new screens (the
// Greek/Cyrillic look-alike one, since it's the one that shows up
// most across your paste) so the whole thing reads as one consistent
// "font" like you asked, instead of a patchwork.
//
// Only letters a-z/A-Z are remapped. Digits, emoji, spaces, and
// punctuation (including the box-drawing characters) pass through
// untouched — swapping those would make the borders/numbers unreadable.

const MAP = {
  a: "α", b: "в", c: "¢", d: "∂", e: "є", f: "ƒ", g: "g", h: "н",
  i: "ι", j: "j", k: "к", l: "ℓ", m: "м", n: "η", o: "σ", p: "ρ",
  q: "q", r: "я", s: "ѕ", t: "т", u: "υ", v: "ν", w: "ω", x: "x",
  y: "у", z: "z",
};

/**
 * Renders `str` in the stylized font. Case-insensitive on input (the
 * font itself doesn't have a separate uppercase form), everything
 * else passed through as-is.
 */
function toFancy(str) {
  return String(str || "")
    .split("")
    .map((ch) => {
      const lower = ch.toLowerCase();
      return Object.prototype.hasOwnProperty.call(MAP, lower) ? MAP[lower] : ch;
    })
    .join("");
}

module.exports = { toFancy };

// ---- normalization, so re-styling doesn't leave a mix of fonts ----
//
// Parts of the existing codebase already used a *different* fancy font
// (small-caps Unicode, e.g. "ᴀɪ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛᴏʀ") alongside plain ASCII
// text. toNormalized() maps that small-caps set (plus this module's own
// MAP, so re-running it is a no-op) back to plain ascii letters, so any
// starting style converges to the same output through toFancy().
const REVERSE = {
  "ᴀ": "a", "ʙ": "b", "ᴄ": "c", "ᴅ": "d", "ᴇ": "e", "ꜰ": "f", "ɢ": "g", "ʜ": "h",
  "ɪ": "i", "ᴊ": "j", "ᴋ": "k", "ʟ": "l", "ᴍ": "m", "ɴ": "n", "ᴏ": "o", "ᴘ": "p",
  "ǫ": "q", "ʀ": "r", "ᴛ": "t", "ᴜ": "u", "ᴠ": "v", "ᴡ": "w", "ʏ": "y", "ᴢ": "z",
  "в": "b", "¢": "c", "∂": "d", "є": "e", "ƒ": "f", "н": "h", "ι": "i", "к": "k",
  "ℓ": "l", "м": "m", "η": "n", "σ": "o", "ρ": "p", "я": "r", "ѕ": "s", "т": "t",
  "υ": "u", "ν": "v", "ω": "w", "у": "y",
};

function toNormalized(str) {
  return String(str || "")
    .split("")
    .map((ch) => REVERSE[ch] || REVERSE[ch.toLowerCase()] || ch)
    .join("");
}

/** Re-styles text regardless of which font (if any) it's already in. */
function restyle(str) {
  return toFancy(toNormalized(str));
}

module.exports.toNormalized = toNormalized;
module.exports.restyle = restyle;
