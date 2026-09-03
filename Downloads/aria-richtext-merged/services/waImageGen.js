// services/waImageGen.js
//
// WhatsApp DM image generation:
//  1. detectImageRequest(text) — figure out if a plain-English message is
//     asking for an image, and pull out the description if one is present
//     in the same message ("generate an image of a red sports car").
//  2. generateImage(prompt) — actually produce the image (Buffer).
//
// Mirrors the two-provider pattern already used for anime images in
// bot.js (Prexzy first, Pollinations as a no-key fallback that basically
// never fails), just generalized to any subject.

const axios = require("axios");

const TRIGGER_RE =
  /\b(generate|create|make|draw|design)\b[\s\S]{0,25}\b(images?|pictures?|pics?|photos?|arts?|drawings?|artworks?)\b/i;

const NOUN_SPLIT_RE = /\b(images?|pictures?|pics?|photos?|arts?|drawings?|artworks?)\b/i;

// Filler that can sit between the image-noun and the actual description,
// e.g. "...a picture FOR ME OF a dragon" -> strip "for me" then "of".
const FILLER_RE = /^(for me|for us|please|pls|now|for|of|about|showing)\b[\s,]*/i;

// Pulls the description out when it's in the same message as the trigger,
// e.g. "generate an image of a cat riding a skateboard" -> "a cat riding a skateboard"
function extractPrompt(text) {
  const m = text.match(NOUN_SPLIT_RE);
  if (!m) return "";
  let rest = text.slice(m.index + m[0].length).trim();
  let changed = true;
  while (changed) {
    changed = false;
    const f = rest.match(FILLER_RE);
    if (f) {
      rest = rest.slice(f[0].length).trim();
      changed = true;
    }
  }
  return rest.replace(/[.!]+$/, "").trim();
}

function detectImageRequest(text) {
  const clean = String(text || "").trim();
  if (!clean) return { isImageRequest: false };
  if (!TRIGGER_RE.test(clean)) return { isImageRequest: false };

  return { isImageRequest: true, prompt: extractPrompt(clean) };
}

async function generateImage(prompt) {
  const cleanPrompt = String(prompt || "").trim();
  if (!cleanPrompt) {
    return { success: false, error: "empty prompt" };
  }

  // ---------- Try Prexzy first ----------
  try {
    const url = `https://prexzyapis.com/ai/text2img?prompt=${encodeURIComponent(cleanPrompt)}`;
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      validateStatus: () => true,
      timeout: 45000,
    });

    const type = response.headers["content-type"] || "";
    if (!type.includes("application/json") && response.data && response.data.length > 500) {
      return { success: true, source: "Prexzy", image: Buffer.from(response.data) };
    }
  } catch (err) {
    console.log("waImageGen Prexzy error:", err.message);
  }

  // ---------- Pollinations fallback (no key needed, very reliable) ----------
  try {
    const seed = Math.floor(Math.random() * 1e9);
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanPrompt
    )}?seed=${seed}&nologo=true`;

    const response = await axios.get(pollUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    return { success: true, source: "Pollinations", image: Buffer.from(response.data) };
  } catch (err) {
    console.log("waImageGen Pollinations error:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { detectImageRequest, generateImage };
