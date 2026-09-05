// utils/infoCard.js
//
// Generates the "rich table card" style shown in the reference screenshot
// (title bar + a bordered Field/Value table) as an actual PNG image, since
// Telegram's Bot API has no native way to render a bordered table in text —
// only a real image can look like that. Sent with bot.sendPhoto().
//
// Usage:
//   const { generateInfoCard } = require("./utils/infoCard");
//   const buffer = await generateInfoCard({
//     title: "Miss Aria — Bot Info",
//     subtitle: "v10.0.0",
//     rows: [
//       { icon: "👑", label: "Owner", value: "Dave Tech" },
//       { icon: "💌", label: "Telegram", value: "t.me/F3BAN" },
//     ],
//     footer: "Thanks for using Miss Aria 🌸",
//     heroImage: "./menu.jpg", // optional, path or Buffer
//   });
//   await bot.sendPhoto(chatId, buffer, { caption: "..." , parse_mode: "HTML" });

const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");

// ---- brand palette (matches Miss Aria's pink/dark theme) ----
const PALETTE = {
  bg: "#160f1c",
  card: "#1f1526",
  cardAlt: "#241a2c",
  border: "#ff6fae",
  accentFrom: "#ff2f92",
  accentTo: "#ff8fc4",
  headerText: "#ffe3f2",
  labelText: "#ffb3d9",
  valueText: "#ffffff",
  dim: "#c9a8bd",
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

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} [opts.subtitle]
 * @param {Array<{icon?:string, label:string, value:string}>} opts.rows
 * @param {string} [opts.footer]
 * @param {string|Buffer} [opts.heroImage] - optional top banner image (path or buffer)
 * @param {number} [opts.width=760]
 * @returns {Promise<Buffer>} PNG buffer
 */
async function generateInfoCard(opts) {
  const {
    title,
    subtitle = "",
    rows = [],
    footer = "",
    heroImage = null,
    width = 760,
  } = opts;

  const padding = 36;
  const heroHeight = heroImage ? 260 : 0;
  const headerHeight = 108;
  const rowHeight = 64;
  const tableHeaderHeight = 48;
  const footerHeight = footer ? 56 : 24;

  const tableHeight = tableHeaderHeight + rows.length * rowHeight;
  const height =
    heroHeight + headerHeight + tableHeight + footerHeight + padding * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, width, height);

  let cursorY = 0;

  // ---- hero image banner ----
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

      // gradient fade into the card below
      const fade = ctx.createLinearGradient(0, heroHeight - 90, 0, heroHeight);
      fade.addColorStop(0, "rgba(22,15,28,0)");
      fade.addColorStop(1, PALETTE.bg);
      ctx.fillStyle = fade;
      ctx.fillRect(0, heroHeight - 90, width, 90);
    } catch (e) {
      // if the hero image can't load, just skip it rather than fail the card
    }
    cursorY = heroHeight;
  }

  // ---- header ----
  const headerY = cursorY + padding * 0.6;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PALETTE.headerText;
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(title, padding, headerY + 40);

  if (subtitle) {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = "20px sans-serif";
    ctx.fillText(subtitle, padding, headerY + 70);
  }

  // accent underline
  const underlineY = cursorY + headerHeight - 6;
  const grad = ctx.createLinearGradient(padding, 0, width - padding, 0);
  grad.addColorStop(0, PALETTE.accentFrom);
  grad.addColorStop(1, PALETTE.accentTo);
  ctx.fillStyle = grad;
  ctx.fillRect(padding, underlineY, width - padding * 2, 4);

  // ---- table container ----
  const tableX = padding;
  const tableY = cursorY + headerHeight + 8;
  const tableW = width - padding * 2;

  ctx.save();
  drawRoundedRect(ctx, tableX, tableY, tableW, tableHeight, 18);
  ctx.fillStyle = PALETTE.card;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.border;
  ctx.stroke();
  ctx.clip();

  // table header row
  ctx.fillStyle = "rgba(255,111,174,0.14)";
  ctx.fillRect(tableX, tableY, tableW, tableHeaderHeight);
  ctx.fillStyle = PALETTE.labelText;
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("FIELD", tableX + 24, tableY + tableHeaderHeight / 2 + 6);
  ctx.fillText("VALUE", tableX + tableW * 0.42, tableY + tableHeaderHeight / 2 + 6);

  // divider between header and body
  ctx.strokeStyle = "rgba(255,111,174,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tableX, tableY + tableHeaderHeight);
  ctx.lineTo(tableX + tableW, tableY + tableHeaderHeight);
  ctx.stroke();

  // rows
  rows.forEach((row, i) => {
    const rY = tableY + tableHeaderHeight + i * rowHeight;

    if (i % 2 === 1) {
      ctx.fillStyle = PALETTE.cardAlt;
      ctx.fillRect(tableX, rY, tableW, rowHeight);
    }

    // label column (icon + label)
    ctx.fillStyle = PALETTE.valueText;
    ctx.font = "20px sans-serif";
    const iconPrefix = row.icon ? `${row.icon} ` : "";
    ctx.fillText(`${iconPrefix}${row.label}`, tableX + 24, rY + rowHeight / 2 + 7);

    // value column
    ctx.fillStyle = PALETTE.labelText;
    ctx.font = "bold 20px sans-serif";
    const valueX = tableX + tableW * 0.42;
    const maxValueWidth = tableW * 0.55;
    const valLines = wrapText(ctx, String(row.value), maxValueWidth);
    if (valLines.length === 1) {
      ctx.fillText(valLines[0], valueX, rY + rowHeight / 2 + 7);
    } else {
      ctx.font = "18px sans-serif";
      const startY = rY + rowHeight / 2 - ((valLines.length - 1) * 11) + 7;
      valLines.slice(0, 2).forEach((l, li) => {
        ctx.fillText(l, valueX, startY + li * 22);
      });
    }

    // row divider
    if (i < rows.length - 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.moveTo(tableX, rY + rowHeight);
      ctx.lineTo(tableX + tableW, rY + rowHeight);
      ctx.stroke();
    }
  });

  ctx.restore();

  // ---- footer ----
  if (footer) {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = "italic 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(footer, width / 2, tableY + tableHeight + 34);
    ctx.textAlign = "left";
  }

  return canvas.toBuffer("image/png");
}

module.exports = { generateInfoCard };
