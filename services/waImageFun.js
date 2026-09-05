// services/waImageFun.js
//
// .wanted and .wasted — same canvas compositing as the Telegram version
// (funcommand.js), swapped to pull the target's WhatsApp profile picture
// instead of downloading a Telegram file. Requires the "canvas" package
// (already in package.json) and assets/wanted.png + assets/wasted.png.

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const router = require("./waCommandRouter");

let Canvas = null;
function getCanvas() {
  if (!Canvas) Canvas = require("canvas"); // lazy — don't crash boot if native build is missing
  return Canvas;
}

const ASSETS_DIR = path.join(__dirname, "..", "assets");
const TEMP_DIR = path.join(__dirname, "..", "temp");
const COOLDOWN_MS = 5 * 60 * 1000;

const wastedCooldown = new Map();
const wantedCooldown = new Map();

function getMentionedJid(m) {
  const ctx = m?.message?.extendedTextMessage?.contextInfo;
  const mentioned = ctx?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];
  if (ctx?.participant) return ctx.participant;
  return null;
}

async function downloadProfilePic(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, "image");
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    const file = path.join(TEMP_DIR, `${jid.split("@")[0]}.jpg`);
    fs.writeFileSync(file, res.data);
    return file;
  } catch {
    return null; // no profile picture, or private
  }
}

async function createWasted(photoPath, tag) {
  const { createCanvas, loadImage } = getCanvas();
  const canvas = createCanvas(700, 700);
  const ctx = canvas.getContext("2d");

  const avatar = await loadImage(photoPath);
  ctx.drawImage(avatar, 0, 0, 700, 700);

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, 700, 700);
  ctx.fillStyle = "rgba(180,0,0,0.18)";
  ctx.fillRect(0, 0, 700, 700);

  const overlayPath = path.join(ASSETS_DIR, "wasted.png");
  if (fs.existsSync(overlayPath)) {
    const overlay = await loadImage(overlayPath);
    ctx.drawImage(overlay, 0, 0, 700, 700);
  }

  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(180,0,0,${Math.random() * 0.4})`;
    ctx.arc(Math.random() * 700, Math.random() * 700, Math.random() * 15 + 5, 0, Math.PI * 2);
    ctx.fill();
  }

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const output = path.join(TEMP_DIR, `wasted_${tag}.png`);
  fs.writeFileSync(output, canvas.toBuffer("image/png"));
  return output;
}

async function createWanted(photoPath, tag) {
  const { createCanvas, loadImage } = getCanvas();
  const canvas = createCanvas(700, 900);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#e8d5a8";
  ctx.fillRect(0, 0, 700, 900);

  const avatar = await loadImage(photoPath);
  ctx.drawImage(avatar, 75, 150, 550, 550);

  const overlayPath = path.join(ASSETS_DIR, "wanted.png");
  if (fs.existsSync(overlayPath)) {
    const overlay = await loadImage(overlayPath);
    ctx.drawImage(overlay, 0, 0, 700, 900);
  }

  ctx.fillStyle = "#3a2a1a";
  ctx.font = "bold 60px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WANTED", 350, 90);

  const bounty = (Math.floor(Math.random() * 9000) + 1000) * 10;
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(`$${bounty.toLocaleString()}`, 350, 850);

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const output = path.join(TEMP_DIR, `wanted_${tag}.png`);
  fs.writeFileSync(output, canvas.toBuffer("image/png"));
  return { output, bounty };
}

router.register("wasted", async (ctx) => {
  const cd = wastedCooldown.get(ctx.senderJid);
  if (cd && Date.now() - cd < COOLDOWN_MS) {
    const left = Math.ceil((COOLDOWN_MS - (Date.now() - cd)) / 1000);
    return router.safeSend(ctx, `⏳ Wait ${left}s before using .wasted again.`);
  }

  const target = getMentionedJid(ctx.m);
  if (!target) return router.safeSend(ctx, "💀 Tag (@mention) or reply to the person you want to waste.");
  if (target === ctx.senderJid) return router.safeSend(ctx, "🙄 You can't waste yourself.");

  const photo = await downloadProfilePic(ctx.sock, target);
  if (!photo) return router.safeSend(ctx, "❌ Couldn't get that person's profile picture (or they don't have one).");

  try {
    const image = await createWasted(photo, target.split("@")[0]);
    wastedCooldown.set(ctx.senderJid, Date.now());
    await ctx.sock.sendMessage(ctx.jid, { image: fs.readFileSync(image), caption: "💀 WASTED", mentions: [target] });
  } catch (err) {
    console.error("waImageFun wasted error:", err.message);
    await router.safeSend(ctx, "❌ Couldn't generate that image (canvas may not be installed — run npm install).");
  }
});

router.register("wanted", async (ctx) => {
  const cd = wantedCooldown.get(ctx.senderJid);
  if (cd && Date.now() - cd < COOLDOWN_MS) {
    const left = Math.ceil((COOLDOWN_MS - (Date.now() - cd)) / 1000);
    return router.safeSend(ctx, `⏳ Wait ${left}s before using .wanted again.`);
  }

  const target = getMentionedJid(ctx.m) || ctx.senderJid;
  const photo = await downloadProfilePic(ctx.sock, target);
  if (!photo) return router.safeSend(ctx, "❌ Couldn't get that person's profile picture (or they don't have one).");

  try {
    const { output, bounty } = await createWanted(photo, target.split("@")[0]);
    wantedCooldown.set(ctx.senderJid, Date.now());
    await ctx.sock.sendMessage(ctx.jid, {
      image: fs.readFileSync(output),
      caption: `🤠 WANTED — bounty $${bounty.toLocaleString()}`,
      mentions: [target],
    });
  } catch (err) {
    console.error("waImageFun wanted error:", err.message);
    await router.safeSend(ctx, "❌ Couldn't generate that image (canvas may not be installed — run npm install).");
  }
});

module.exports = {};
