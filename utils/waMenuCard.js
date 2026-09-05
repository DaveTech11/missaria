// utils/waMenuCard.js
//
// Generates the "hero image + title + grouped pill-button columns" card
// style from the WhatsApp screenshot, themed in Miss Aria's pink/dark
// palette. Used for the WhatsApp admin control center.
//
// IMPORTANT — same caveat as the reference bot's actual behavior: those
// pill "buttons" are NOT live tappable WhatsApp buttons. WhatsApp/Baileys
// doesn't reliably support real interactive buttons anymore, and the
// screenshot's two-column grid of bordered boxes isn't something any
// native WhatsApp message type renders — it's a generated image, same as
// this. The labels are visual only; the admin still types the command
// (".antispam", ".moderation", etc.) same as every other command in this
// bot. The card's caption says as much so it isn't confusing.
//
// Usage:
//   const { generateRichMenuCard } = require("./waMenuCard");
//   const buffer = await generateRichMenuCard({
//     title: "Admin Control Center",
//     subtitle: "Miss Aria • owner only",
//     heroImage: "../menu.jpg", // optional, path or Buffer
//     sections: [
//       { name: "Overview", items: ["Online", "1.2k msgs", "340 contacts"] },
//       { name: "Moderation", items: [".antispam", ".moderation", ".flag"] },
//     ],
//     footer: "Type a command below — these aren't tappable buttons.",
//   });
//   await sock.sendMessage(jid, { image: buffer, caption: "..." });

const { createCanvas, loadImage } = require("canvas");

const PALETTE = {
  bg: "#160f1c",
  headerText: "#ffe3f2",
  dim: "#c9a8bd",
  accentFrom: "#ff2f92",
  accentTo: "#ff8fc4",
  sectionBorder: "rgba(255,111,174,0.45)",
  sectionBg: "rgba(255,255,255,0.03)",
  pillBg: "#241a2c",
  pillBorder: "rgba(255,255,255,0.08)",
  pillText: "#ffffff",
  sectionTitle: "#ffb3d9",
};

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, startPx, minPx = 13) {
  let px = startPx;
  ctx.font = `bold ${px}px sans-serif`;
  while (ctx.measureText(text).width > maxWidth && px > minPx) {
    px -= 1;
    ctx.font = `bold ${px}px sans-serif`;
  }
  return px;
}

/**
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.subtitle]
 * @param {string|Buffer} [opts.heroImage]
 * @param {Array<{name:string, items:string[]}>} opts.sections
 * @param {string} [opts.footer]
 * @param {number} [opts.width=760]
 * @returns {Promise<Buffer>} PNG buffer
 */
async function generateRichMenuCard(opts) {
  const {
    title,
    subtitle = "",
    heroImage = null,
    sections = [],
    footer = "",
    width = 760,
  } = opts;

  const padding = 32;
  const heroHeight = heroImage ? 300 : 0;
  const headerHeight = 96;
  const pillHeight = 52;
  const pillGap = 14;
  const sectionTitleHeight = 44;
  const sectionPad = 16;
  const columnGap = 20;

  const maxItems = Math.max(1, ...sections.map((s) => s.items.length));
  const sectionBodyHeight = sectionTitleHeight + maxItems * (pillHeight + pillGap) - pillGap + sectionPad * 2;
  const footerHeight = footer ? 70 : 24;

  const height =
    heroHeight + headerHeight + sectionBodyHeight + footerHeight + padding * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, width, height);

  let cursorY = 0;

  // ---- hero banner ----
  if (heroImage) {
    try {
      const img = await loadImage(heroImage);
      ctx.save();
      drawRoundedRect(ctx, 0, 0, width, heroHeight, 0);
      ctx.clip();
      const scale = Math.max(width / img.width, heroHeight / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (width - dw) / 2, (heroHeight - dh) / 2, dw, dh);
      ctx.restore();

      const fade = ctx.createLinearGradient(0, heroHeight - 100, 0, heroHeight);
      fade.addColorStop(0, "rgba(22,15,28,0)");
      fade.addColorStop(1, PALETTE.bg);
      ctx.fillStyle = fade;
      ctx.fillRect(0, heroHeight - 100, width, 100);
    } catch (e) {
      // skip hero silently, card still renders without it
    }
    cursorY = heroHeight;
  }

  // ---- header ----
  const headerY = cursorY + padding * 0.5;
  ctx.fillStyle = PALETTE.headerText;
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(title, padding, headerY + 38);

  if (subtitle) {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = "19px sans-serif";
    ctx.fillText(subtitle, padding, headerY + 66);
  }

  const underlineY = cursorY + headerHeight - 4;
  const grad = ctx.createLinearGradient(padding, 0, width - padding, 0);
  grad.addColorStop(0, PALETTE.accentFrom);
  grad.addColorStop(1, PALETTE.accentTo);
  ctx.fillStyle = grad;
  ctx.fillRect(padding, underlineY, width - padding * 2, 4);

  // ---- section columns ----
  const sectionsY = cursorY + headerHeight + 10;
  const totalGap = columnGap * Math.max(0, sections.length - 1);
  const colWidth = (width - padding * 2 - totalGap) / Math.max(1, sections.length);

  sections.forEach((section, colIdx) => {
    const colX = padding + colIdx * (colWidth + columnGap);

    // section container
    drawRoundedRect(ctx, colX, sectionsY, colWidth, sectionBodyHeight, 16);
    ctx.fillStyle = PALETTE.sectionBg;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = PALETTE.sectionBorder;
    ctx.stroke();

    // section title
    ctx.fillStyle = PALETTE.sectionTitle;
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(section.name, colX + sectionPad, sectionsY + sectionPad + 20);

    // pills
    section.items.forEach((item, rowIdx) => {
      const pillY = sectionsY + sectionTitleHeight + sectionPad + rowIdx * (pillHeight + pillGap);
      const pillW = colWidth - sectionPad * 2;
      const pillX = colX + sectionPad;

      drawRoundedRect(ctx, pillX, pillY, pillW, pillHeight, pillHeight / 2);
      ctx.fillStyle = PALETTE.pillBg;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = PALETTE.pillBorder;
      ctx.stroke();

      ctx.fillStyle = PALETTE.pillText;
      ctx.textAlign = "center";
      const fitPx = fitText(ctx, item, pillW - 24, 18);
      ctx.font = `bold ${fitPx}px sans-serif`;
      ctx.fillText(item, pillX + pillW / 2, pillY + pillHeight / 2 + fitPx * 0.35);
      ctx.textAlign = "left";
    });
  });

  // ---- footer ----
  if (footer) {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = "italic 16px sans-serif";
    ctx.textAlign = "center";
    const footerY = sectionsY + sectionBodyHeight + 34;
    const words = footer.split(" ");
    let line = "";
    const lines = [];
    const maxW = width - padding * 2;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, width / 2, footerY + i * 22));
    ctx.textAlign = "left";
  }

  return canvas.toBuffer("image/png");
}

module.exports = { generateRichMenuCard };
