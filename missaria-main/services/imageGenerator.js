// services/imageGenerator.js
// Natural-language image generation for Miss Aria.
// Uses the existing Prexzy image endpoint first, then Pollinations as fallback.

const axios = require("axios");

const PREXZY_URL = "https://prexzyapis.com/ai/text2img";
const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";
const PIXAZO_URL = "https://gateway.pixazo.ai/flux-1-schnell/v1/getData";
const PIXAZO_KEY = String(process.env.PIXAZO_API_KEY || process.env.PIXAZO_API_KEY_FLUX || "").trim();

function cleanPrompt(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/, "");
}

function extractNaturalImagePrompt(text) {
  const input = String(text || "").trim();
  if (!input) return "";

  // Match natural requests such as:
  // "can you generate an image of a cyberpunk city"
  // "make me a picture of a cat"
  // "please create an image for me showing a red car"
  const trigger = /\b(?:can\s+you|can\s+u|could\s+you|would\s+you|please|pls)?\s*(?:generate|create|make|draw|design|render)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|pic|photo|artwork|art|drawing)\b/i;
  const match = input.match(trigger);
  if (!match) return "";

  let rest = input.slice(match.index + match[0].length).trim();

  // Remove conversational filler after "image".
  rest = rest
    .replace(/^(?:for\s+me|for\s+us|for\s+you|please|pls)\b[\s,]*/i, "")
    .replace(/^(?:of|showing|about|with|that\s+shows)\b[\s:,-]*/i, "")
    .trim();

  return cleanPrompt(rest);
}


function isNaturalImageQuestion(text) {
  const input = String(text || "").trim();
  return /^(?:@?aria[\s,;:.-]*)?(?:please\s+)?(?:can|could|would)\s+(?:you|u)\s+(?:please\s+)?(?:generate|create|make|draw|design|render)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|pic|photo|artwork|art|drawing)\b.*\?*$/i.test(input);
}

function detectNaturalImageRequest(text) {
  const prompt = extractNaturalImagePrompt(text);
  return {
    isImageRequest: Boolean(prompt),
    prompt
  };
}

async function requestImage(url, params, timeout) {
  const response = await axios.get(url, {
    params,
    responseType: "arraybuffer",
    validateStatus: () => true,
    timeout
  });

  const contentType = String(response.headers["content-type"] || "").toLowerCase();
  const buffer = Buffer.from(response.data || []);

  if (!contentType.startsWith("image/") || buffer.length < 500) {
    throw new Error(`image provider returned invalid data (${response.status}, ${contentType || "unknown"})`);
  }

  return buffer;
}

async function generateImage(prompt) {
  const clean = cleanPrompt(prompt);
  if (!clean) throw new Error("Please tell me what you want me to generate.");

  const errors = [];

  // Pixazo FLUX 1 Schnell is the primary API when a key is configured.
  // It returns a generated image URL directly and is documented as free during preview.
  if (PIXAZO_KEY) {
    try {
      const response = await axios.post(PIXAZO_URL, {
        prompt: clean,
        num_steps: 4,
        seed: Math.floor(Math.random() * 2147483647),
        height: 1024,
        width: 1024
      }, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Ocp-Apim-Subscription-Key": PIXAZO_KEY
        },
        timeout: 120000,
        validateStatus: () => true
      });

      const data = response.data || {};
      const imageUrl = data.output || data.image_url || data.url || data.media_url?.[0];
      if (response.status >= 200 && response.status < 300 && imageUrl) {
        const image = await requestImage(String(imageUrl), {}, 120000);
        return { image, engine: "Pixazo FLUX 1 Schnell" };
      }

      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    } catch (err) {
      errors.push(`Pixazo FLUX: ${err.message}`);
      console.error("[IMAGE] Pixazo FLUX failed:", err.message);
    }
  }

  try {
    const image = await requestImage(
      PREXZY_URL,
      { prompt: clean },
      60000
    );
    return { image, engine: "Prexzy" };
  } catch (err) {
    errors.push(`Prexzy: ${err.message}`);
    console.error("[IMAGE] Prexzy failed:", err.message);
  }

  try {
    const seed = Math.floor(Math.random() * 1000000000);
    const url = `${POLLINATIONS_URL}/${encodeURIComponent(clean)}`;
    const image = await requestImage(
      url,
      { seed, nologo: "true", width: 1024, height: 1024 },
      120000
    );
    return { image, engine: "Pollinations" };
  } catch (err) {
    errors.push(`Pollinations: ${err.message}`);
    console.error("[IMAGE] Pollinations failed:", err.message);
  }

  const error = new Error("All image generation providers failed.");
  error.providerErrors = errors;
  throw error;
}

module.exports = {
  detectNaturalImageRequest,
  isNaturalImageQuestion,
  extractNaturalImagePrompt,
  generateImage
};
