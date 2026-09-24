// services/waMediaCommands.js
//
// Three commands that call external image APIs and send the result
// straight back into whichever chat (DM or group) the command came
// from. All three follow the same pattern: fetch, check it's actually
// an image before sending, and fail cleanly with a chat message instead
// of throwing — a flaky third-party API should never take the bot down
// or leave the user with silence.

const axios = require("axios");
const router = require("./waCommandRouter");

const UA = { "User-Agent": "Mozilla/5.0 (Miss Aria WhatsApp bot)" };

// ============================================================
// .pinterest <query OR pin link>
//   - a search term  -> keyword search (api-rebix), sends a batch
//     of image results, as before
//   - a Pinterest link (pinterest.com/pin/... or pin.it/...) ->
//     pinterestV2 downloader: sends the VIDEO if that pin has one,
//     falling back to the image otherwise
// ============================================================

const PIN_URL_RE = /^https?:\/\/(www\.|[a-z]{2}\.)?(pinterest\.[a-z.]+\/pin\/\S+|pin\.it\/\S+)/i;

// These wrapper APIs aren't consistently documented, so pull the
// video/image links out defensively by checking the common field
// names rather than assuming one exact shape.
function extractPinMedia(data) {
  if (!data) return { video: null, image: null };
  const root = data.data || data.result || data;

  const videoCandidates = [
    root.video, root.video_url, root.videoUrl, root.hd, root.sd,
    root.downloads?.video, root.media?.video, root.result?.video,
  ];
  const imageCandidates = [
    root.image, root.image_url, root.imageUrl, root.thumbnail,
    root.downloads?.image, root.media?.image, root.url,
  ];

  const video = videoCandidates.find((c) => typeof c === "string" && c.startsWith("http")) || null;
  const image = imageCandidates.find((c) => typeof c === "string" && c.startsWith("http")) || null;
  return { video, image };
}

router.register(
  "pinterest",
  async (ctx) => {
    const input = ctx.args.trim();
    if (!input) return router.safeSend(ctx, "👉 Usage: .pinterest <search> OR .pinterest <pin link>\nExamples:\n.pinterest anime\n.pinterest https://pinterest.com/pin/1234567890");

    // ---- direct pin link: download via pinterestV2 (video, image fallback) ----
    if (PIN_URL_RE.test(input)) {
      try {
        const res = await axios.get("https://prexzyapis.com/download/pinterestV2", {
          params: { url: input },
          headers: UA,
          timeout: 30000,
        });
        const { video, image } = extractPinMedia(res.data);

        if (video) {
          await ctx.sock.sendMessage(ctx.jid, { video: { url: video }, caption: "📌 Pinterest video" });
        } else if (image) {
          await ctx.sock.sendMessage(ctx.jid, { image: { url: image }, caption: "📌 Pinterest image" });
        } else {
          console.error("waMediaCommands pinterestV2: no media in response", JSON.stringify(res.data).slice(0, 300));
          await router.safeSend(ctx, "❌ Couldn't find a video or image for that pin.");
        }
      } catch (err) {
        console.error("waMediaCommands pinterestV2 error:", err.message);
        await router.safeSend(ctx, "❌ Couldn't download that pin — try again in a moment.");
      }
      return;
    }

    // ---- keyword search ----
    let data;
    try {
      const res = await axios.get("https://api-rebix.zone.id/api/pinterest", {
        params: { q: input },
        headers: UA,
        timeout: 20000,
      });
      data = res.data;
    } catch (err) {
      console.error("waMediaCommands pinterest fetch error:", err.message);
      return router.safeSend(ctx, "❌ Pinterest search failed — try again in a moment.");
    }

    const results = Array.isArray(data?.data) ? data.data : [];
    if (!data?.status || !results.length) {
      return router.safeSend(ctx, `❌ No Pinterest results for "${input}".`);
    }

    const batch = results.slice(0, 5);
    for (const pin of batch) {
      if (!pin.image) continue;
      try {
        await ctx.sock.sendMessage(ctx.jid, {
          image: { url: pin.image },
          caption: pin.title && pin.title !== "No title" ? `📌 ${pin.title}` : "📌 Pinterest",
        });
      } catch (err) {
        console.error("waMediaCommands pinterest send error:", err.message);
        // one bad image link shouldn't stop the rest of the batch
      }
    }
  },
  { aliases: ["pin"] }
);

// ============================================================
// .art <prompt> [--neg <negative prompt>] [--ratio <aspect ratio>]
//   AI art / anime image generation
// ============================================================

function parseArtArgs(raw) {
  let text = raw;
  let negative = "";
  let ratio = "";

  const negMatch = /--neg\s+([\s\S]+?)(?=\s+--ratio\b|$)/i.exec(text);
  if (negMatch) {
    negative = negMatch[1].trim();
    text = text.replace(negMatch[0], "").trim();
  }
  const ratioMatch = /--ratio\s+(\S+)/i.exec(text);
  if (ratioMatch) {
    ratio = ratioMatch[1].trim();
    text = text.replace(ratioMatch[0], "").trim();
  }
  return { prompt: text.trim(), negative, ratio };
}

router.register(
  "art",
  async (ctx) => {
    if (!ctx.args.trim()) {
      return router.safeSend(
        ctx,
        "👉 Usage: .art <prompt> [--neg <negative prompt>] [--ratio <e.g. 1:1>]\nExample: .art anime girl in the rain --neg blurry, extra fingers --ratio 9:16"
      );
    }
    const { prompt, negative, ratio } = parseArtArgs(ctx.args);
    if (!prompt) return router.safeSend(ctx, "👉 Give me a prompt: .art <prompt>");

    const placeholder = await ctx.sock.sendMessage(ctx.jid, { text: "🎨 Generating your image..." }).catch(() => null);

    try {
      const res = await axios.get("https://prexzyapis.com/ai/art-nouveau", {
        params: {
          prompt,
          negative_prompt: negative || undefined,
          aspect_ratio: ratio || undefined,
        },
        headers: UA,
        timeout: 60000,
        responseType: "arraybuffer",
        validateStatus: () => true,
      });

      const contentType = String(res.headers?.["content-type"] || "");
      if (res.status !== 200 || !contentType.startsWith("image/")) {
        console.error("waMediaCommands art bad response:", res.status, contentType);
        return router.safeSend(ctx, "❌ Couldn't generate that image — try a different prompt.");
      }

      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(res.data), caption: `🎨 "${prompt}"` });
      if (placeholder) {
        try {
          await ctx.sock.sendMessage(ctx.jid, { delete: placeholder.key });
        } catch {}
      }
    } catch (err) {
      console.error("waMediaCommands art error:", err.message);
      await router.safeSend(ctx, "❌ Image generation failed — try again in a moment.");
    }
  },
  { aliases: ["generate", "animeart"] }
);

// ============================================================
// .spongebob <text>  — "how are y brat" style meme generator
// ============================================================

router.register(
  "spongebob",
  async (ctx) => {
    const text = ctx.args.trim();
    if (!text) return router.safeSend(ctx, "👉 Usage: .spongebob <text>\nExample: .spongebob how are y brat");

    try {
      const res = await axios.get("https://prexzyapis.com/imagecreator/SpongeBob", {
        params: { text },
        headers: UA,
        timeout: 30000,
        responseType: "arraybuffer",
        validateStatus: () => true,
      });

      const contentType = String(res.headers?.["content-type"] || "");
      if (res.status !== 200 || !contentType.startsWith("image/")) {
        console.error("waMediaCommands spongebob bad response:", res.status, contentType);
        return router.safeSend(ctx, "❌ Couldn't make that meme — try again in a moment.");
      }

      await ctx.sock.sendMessage(ctx.jid, { image: Buffer.from(res.data), caption: "🧽 SpongeBob meme" });
    } catch (err) {
      console.error("waMediaCommands spongebob error:", err.message);
      await router.safeSend(ctx, "❌ Meme generation failed — try again in a moment.");
    }
  },
  { aliases: ["spongebobmeme"] }
);

module.exports = {};

// ============================================================
// .facebook <url>  — video downloader
//   Reuses services/socialDownloader.js, which already has a
//   CONFIRMED-working Facebook endpoint + a shape-agnostic
//   extractor (these wrapper APIs don't always return the same
//   field names, so extractMediaUrl() checks the common ones).
// ============================================================

const social = require("./socialDownloader");

const FB_URL_RE = /(https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch)\/\S+)/i;

router.register(
  "facebook",
  async (ctx) => {
    const match = FB_URL_RE.exec(ctx.args);
    if (!match) {
      return router.safeSend(ctx, "👉 Usage: .facebook <video link>\nExample: .facebook https://www.facebook.com/watch/?v=...");
    }
    const url = match[1];

    const placeholder = await ctx.sock.sendMessage(ctx.jid, { text: "📥 Fetching that Facebook video..." }).catch(() => null);

    try {
      const data = await social.downloadFacebook(url);
      const mediaUrl = social.extractMediaUrl(data);
      if (!mediaUrl) {
        console.error("waMediaCommands facebook: no media url in response", JSON.stringify(data).slice(0, 300));
        return router.safeSend(ctx, "❌ Couldn't get a downloadable link for that video — it may be private or the link is wrong.");
      }

      await ctx.sock.sendMessage(ctx.jid, { video: { url: mediaUrl }, caption: "📹 Facebook video" });
      if (placeholder) {
        try {
          await ctx.sock.sendMessage(ctx.jid, { delete: placeholder.key });
        } catch {}
      }
    } catch (err) {
      console.error("waMediaCommands facebook error:", err.message);
      await router.safeSend(ctx, "❌ Couldn't download that video — try again in a moment.");
    }
  },
  { aliases: ["fb", "fbdl"] }
);
