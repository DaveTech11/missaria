// services/waTelegramSticker.js
//
// .tgsticker <t.me/addstickers/pack link> [index]
//
// Pulls a sticker from a Telegram sticker pack and sends it to WhatsApp
// as an actual sticker (not just an image). Uses the Telegram Bot API
// directly (same TELEGRAM_BOT_TOKEN bot.js already uses) — this does
// NOT touch bot.js's own polling TelegramBot instance, since running a
// second one against the same token would fight it for updates. This
// file only makes plain getStickerSet / getFile HTTP calls, which is
// safe to do from a second process/module.
//
// Handles all three Telegram sticker types:
//   - static (.webp)   -> sent as-is
//   - video  (.webm)   -> converted to animated .webp via ffmpeg
//                         (ffmpeg is already a system dependency of
//                         this project — see services/talkingAvatar.js)
//   - animated (.tgs, gzipped Lottie JSON) -> rendered frame-by-frame
//                         with puppeteer + lottie-web, then stitched
//                         into an animated .webp with ffmpeg. This is
//                         the heaviest path: it needs the "puppeteer"
//                         package and a Chromium-capable host. If
//                         either isn't available, it throws a clear,
//                         specific error that the caller reports in
//                         chat — it never crashes the bot.

const axios = require("axios");
const router = require("./waCommandRouter");

const TG_LINK_RE = /t\.me\/addstickers\/([A-Za-z0-9_]+)/i;

function getToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

async function tgApi(method, params) {
  const token = getToken();
  const res = await axios.get(`https://api.telegram.org/bot${token}/${method}`, {
    params,
    timeout: 20000,
    validateStatus: () => true,
  });
  return res.data;
}

router.register(
  "tgsticker",
  async (ctx) => {
    const token = getToken();
    if (!token) {
      return router.safeSend(ctx, "❌ TELEGRAM_BOT_TOKEN isn't set in .env, so I can't reach Telegram's sticker API.");
    }

    const parts = ctx.args.trim().split(/\s+/);
    const link = parts[0] || "";
    const index = parts[1] ? parseInt(parts[1], 10) : 1;

    const match = TG_LINK_RE.exec(link);
    if (!match) {
      return router.safeSend(
        ctx,
        "👉 Usage: .tgsticker <t.me/addstickers/pack link> [number]\nExample: .tgsticker https://t.me/addstickers/AnimeStickers 3\n(number picks which sticker in the pack — defaults to the 1st)"
      );
    }
    const packName = match[1];

    let setData;
    try {
      setData = await tgApi("getStickerSet", { name: packName });
    } catch (err) {
      console.error("waTelegramSticker getStickerSet error:", err.message);
      return router.safeSend(ctx, "❌ Couldn't reach Telegram to look up that pack — try again in a moment.");
    }

    if (!setData?.ok) {
      return router.safeSend(ctx, `❌ Couldn't find a sticker pack at that link (${setData?.description || "not found"}).`);
    }

    const stickers = setData.result?.stickers || [];
    if (!stickers.length) {
      return router.safeSend(ctx, "❌ That pack has no stickers in it.");
    }
    if (!Number.isInteger(index) || index < 1 || index > stickers.length) {
      return router.safeSend(ctx, `👉 That pack has ${stickers.length} stickers — give a number from 1 to ${stickers.length}.`);
    }

    const sticker = stickers[index - 1];
    const isAnimated = Boolean(setData.result.is_animated || sticker.is_animated);
    const isVideo = Boolean(setData.result.is_video || sticker.is_video);

    let fileData;
    try {
      fileData = await tgApi("getFile", { file_id: sticker.file_id });
    } catch (err) {
      console.error("waTelegramSticker getFile error:", err.message);
      return router.safeSend(ctx, "❌ Couldn't fetch that sticker's file from Telegram.");
    }
    if (!fileData?.ok || !fileData.result?.file_path) {
      return router.safeSend(ctx, "❌ Couldn't fetch that sticker's file from Telegram.");
    }
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;

    try {
      let webpBuffer;
      if (isVideo) {
        webpBuffer = await convertVideoStickerToWebp(fileUrl);
      } else if (isAnimated) {
        webpBuffer = await convertLottieStickerToWebp(fileUrl);
      } else {
        const fileRes = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 30000 });
        webpBuffer = Buffer.from(fileRes.data);
      }
      await ctx.sock.sendMessage(ctx.jid, { sticker: webpBuffer });
    } catch (err) {
      console.error("waTelegramSticker convert/send error:", err.message);
      await router.safeSend(
        ctx,
        `❌ Couldn't convert/send that sticker (${isAnimated ? "animated" : isVideo ? "video" : "static"}) — ${err.message.slice(0, 150)}`
      );
    }
  },
  { aliases: ["tgsticker2wa", "tsticker"] }
);

// ============================================================
// VIDEO STICKER (.webm) -> animated .webp, via ffmpeg
// ============================================================

async function convertVideoStickerToWebp(fileUrl) {
  const { execFile } = require("child_process");
  const fs = require("fs");
  const path = require("path");
  const os = require("os");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tgsticker-"));
  const inPath = path.join(tmpDir, "in.webm");
  const outPath = path.join(tmpDir, "out.webp");

  try {
    const res = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 30000 });
    fs.writeFileSync(inPath, Buffer.from(res.data));

    // Cap to 3s / 15fps / 512px so the output stays small enough for
    // WhatsApp's sticker size limit, same way Telegram's own stickers
    // are already capped.
    await new Promise((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-y", "-i", inPath,
          "-t", "3",
          "-vf", "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=00000000",
          "-vcodec", "libwebp",
          "-loop", "0",
          "-an",
          "-vsync", "0",
          "-pix_fmt", "yuva420p",
          outPath,
        ],
        { timeout: 30000 },
        (err) => (err ? reject(err) : resolve())
      );
    });

    return fs.readFileSync(outPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ============================================================
// ANIMATED STICKER (.tgs, gzipped Lottie JSON) -> animated .webp
//
// .tgs has no video/audio track ffmpeg can decode — it's a vector
// animation description. The only correct way to convert it is to
// actually RENDER the Lottie animation frame-by-frame, then stitch
// those frames into a .webp. This uses a headless browser (puppeteer)
// + lottie-web to do that rendering, then ffmpeg to stitch the PNG
// frames into an animated webp.
//
// Requires the "puppeteer" package (not in package.json by default —
// added below) and a Chromium-capable host. If puppeteer/Chromium
// isn't available in your deploy environment, this throws a clear
// error and the caller reports it in-chat — it never crashes the bot.
// ============================================================

async function convertLottieStickerToWebp(fileUrl) {
  const zlib = require("zlib");
  const fs = require("fs");
  const path = require("path");
  const os = require("os");
  const { execFile } = require("child_process");

  const res = await axios.get(fileUrl, { responseType: "arraybuffer", timeout: 30000 });
  const lottieJson = JSON.parse(zlib.gunzipSync(Buffer.from(res.data)).toString("utf8"));

  const fr = lottieJson.fr || 30; // frame rate
  const ip = lottieJson.ip || 0; // in-point frame
  const op = lottieJson.op || fr; // out-point frame
  const totalFrames = Math.max(1, Math.round(op - ip));
  // Cap render length/frame count so this stays fast and the output
  // stays under WhatsApp's sticker size limit — same idea as the
  // video-sticker cap above.
  const maxFrames = 60;
  const frameStep = Math.max(1, Math.ceil(totalFrames / maxFrames));
  const framesToRender = [];
  for (let f = ip; f < op; f += frameStep) framesToRender.push(f);

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    throw new Error("puppeteer isn't installed — run: npm install puppeteer");
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tgtgs-"));
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">
      <div id="anim" style="width:512px;height:512px"></div>
      <script src="https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js"></script>
    </body></html>`);
    await page.waitForFunction(() => typeof window.lottie !== "undefined", { timeout: 15000 });

    await page.evaluate((data) => {
      window.__anim = window.lottie.loadAnimation({
        container: document.getElementById("anim"),
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: data,
      });
    }, lottieJson);

    for (let i = 0; i < framesToRender.length; i++) {
      const frame = framesToRender[i];
      await page.evaluate((f) => window.__anim.goToAndStop(f, true), frame);
      const framePath = path.join(tmpDir, `frame_${String(i).padStart(4, "0")}.png`);
      await page.screenshot({ path: framePath, omitBackground: true });
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  const outPath = path.join(tmpDir, "out.webp");
  const outFps = Math.max(1, Math.round(fr / frameStep));
  try {
    await new Promise((resolve, reject) => {
      execFile(
        "ffmpeg",
        [
          "-y", "-framerate", String(outFps),
          "-i", path.join(tmpDir, "frame_%04d.png"),
          "-vcodec", "libwebp",
          "-loop", "0",
          "-an",
          "-vsync", "0",
          "-pix_fmt", "yuva420p",
          outPath,
        ],
        { timeout: 30000 },
        (err) => (err ? reject(err) : resolve())
      );
    });
    return fs.readFileSync(outPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = {};
