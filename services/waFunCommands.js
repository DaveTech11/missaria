// services/waFunCommands.js
//
// The simple, stateless-ish fun/utility commands ported over from the
// Telegram side (features.js / features2.js / funcommand.js). Every one
// of these uses the '.' prefix and is registered on waCommandRouter.
//
// Deliberately left OUT of this batch (ported separately, or deferred —
// see README-CHANGES.md):
//   - games                -> services/waGames.js
//   - wanted / wasted       -> services/waImageFun.js (needs canvas +
//                              the target's WhatsApp profile picture)
//   - the economy/wallet system (aura, coins, /profile, /store, etc.)
//     -> not ported this round, it's a large standalone system built
//        around Telegram numeric user ids; porting it deserves its own
//        pass rather than a rushed, half-working version here.
//   - /translate — the Telegram version calls into aiService/deepseek;
//     left as a follow-up so it can be wired to whatever AI call you
//     want it to use here.

const fs = require("fs");
const path = require("path");
const router = require("./waCommandRouter");
const { restyle } = require("../utils/fancyFont");

const startedAt = Date.now();

const DATA_DIR = path.join(__dirname, "..", "data");
const AFK_FILE = path.join(DATA_DIR, "waAfk.json");
const MARRY_FILE = path.join(DATA_DIR, "waMarry.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("waFunCommands: failed saving", file, err.message);
  }
}

// ---------- AFK ----------
let afk = loadJson(AFK_FILE, {}); // jid -> { reason, since }

function setAfk(jid, reason) {
  afk[jid] = { reason: reason || "AFK", since: Date.now() };
  saveJson(AFK_FILE, afk);
}
function clearAfk(jid) {
  if (afk[jid]) {
    delete afk[jid];
    saveJson(AFK_FILE, afk);
    return true;
  }
  return false;
}
function getAfk(jid) {
  return afk[jid] || null;
}

// ---------- marriage ----------
let marriages = loadJson(MARRY_FILE, {}); // jid -> spouseJid
const pendingProposals = new Map(); // targetJid -> { proposerJid, chatJid, time }

function isMarried(jid) {
  return Boolean(marriages[jid]);
}
function marry(jidA, jidB) {
  marriages[jidA] = jidB;
  marriages[jidB] = jidA;
  saveJson(MARRY_FILE, marriages);
}
function getSpouse(jid) {
  return marriages[jid] || null;
}
function divorceJid(jid) {
  const spouse = marriages[jid];
  delete marriages[jid];
  if (spouse) delete marriages[spouse];
  saveJson(MARRY_FILE, marriages);
  return spouse || null;
}

// ---------- helpers ----------

function getMentionedJid(m) {
  const ctx = m?.message?.extendedTextMessage?.contextInfo;
  const mentioned = ctx?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];
  if (ctx?.participant) return ctx.participant;
  return null;
}

function displayName(jid) {
  return "@" + String(jid || "").split("@")[0];
}

async function reply(ctx, text, extra = {}) {
  await ctx.sock.sendMessage(ctx.jid, { text, mentions: extra.mentions || [] });
}

// ============================================================
// PING / UPTIME / INFO
// ============================================================

router.register("ping", async (ctx) => {
  const t0 = Date.now();
  const sent = await ctx.sock.sendMessage(ctx.jid, { text: "🏓 Checking ping..." });
  const ms = Date.now() - t0;
  await ctx.sock.sendMessage(ctx.jid, { text: `🏓 Pong! ${ms}ms` });
});

router.register("uptime", async (ctx) => {
  const s = Math.floor((Date.now() - startedAt) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  await reply(ctx, `⏱️ Miss Aria uptime\n⏳ ${h}h ${m}m ${sec}s`);
}, { aliases: ["up"] });

router.register("whoami", async (ctx) => {
  await reply(ctx, `👤 Your WhatsApp ID: ${displayName(ctx.senderJid)}`, { mentions: [ctx.senderJid] });
});

router.register("chatinfo", async (ctx) => {
  if (!ctx.isGroup) {
    await reply(ctx, `💬 This is a 1:1 DM.`);
    return;
  }
  try {
    const meta = await ctx.sock.groupMetadata(ctx.jid);
    await reply(
      ctx,
      `💬 *${meta.subject}*\n👥 ${meta.participants.length} members\n🆔 ${ctx.jid}`
    );
  } catch {
    await reply(ctx, "❌ Couldn't read group info.");
  }
});

router.register("menu", async (ctx) => {
  const waGames = require("./waGames");
  const cmds = router.listCommands().filter((c) => c !== "menu" && c !== "help");
  const gameNames = waGames.getAllGamesMeta().map((g) => g.name);

  const caption =
    `🌸 *${restyle("Miss Aria — WhatsApp Command Menu")}*\n\n` +
    `*${restyle("No prefix (group admins only)")}:*\n` +
    `kick, promote, demote, antilink on/off, scan/cleanup, setpp, mute, warn, warns, unwarn, resetwarns, lock, unlock, tag, untag, ban, unban\n\n` +
    `*${restyle('Prefix "." (everyone)')}:*\n` +
    cmds.map((c) => `.${c}`).join(", ") +
    `\n\n*${restyle("Games")}* — send *.games* for the full list (${gameNames.length} available), then *.play <name>* to start one.\n\n` +
    `Mention *aria* / *miss aria* / *agent* any time to just talk to me.`;

  await sendMenuWithImage(ctx, caption);
}, { aliases: ["help"] });

async function sendMenuWithImage(ctx, caption) {
  const menuImagePath = path.join(__dirname, "..", "menu.jpg");
  try {
    if (fs.existsSync(menuImagePath)) {
      await ctx.sock.sendMessage(ctx.jid, { image: fs.readFileSync(menuImagePath), caption });
      return;
    }
  } catch {}
  await ctx.sock.sendMessage(ctx.jid, { text: caption });
}

// ============================================================
// RANDOM / GAMES-OF-CHANCE UTILITIES
// ============================================================

router.register("8ball", async (ctx) => {
  const answers = [
    "Yes ✨", "No ❌", "Definitely 💫", "Ask again later 🔮",
    "Unlikely 🌙", "Absolutely ⭐", "It is decided ⚡", "Very doubtful 💭",
  ];
  if (!ctx.args) {
    await reply(ctx, "🎱 Ask me something: .8ball will I win?");
    return;
  }
  await reply(ctx, `🎱 ${answers[Math.floor(Math.random() * answers.length)]}`);
});

router.register("roll", async (ctx) => {
  const sides = Math.max(2, Math.min(1000, parseInt(ctx.args || "6", 10) || 6));
  const result = 1 + Math.floor(Math.random() * sides);
  await reply(ctx, `🎲 Rolling d${sides}... *${result}*`);
});

router.register("coinflip", async (ctx) => {
  const result = Math.random() < 0.5 ? "Heads" : "Tails";
  await reply(ctx, `🪙 ${result}!`);
}, { aliases: ["flip"] });

router.register("random", async (ctx) => {
  const parts = ctx.args.split(/\s+/).filter(Boolean);
  const min = parts[0] ? parseInt(parts[0], 10) : 1;
  const max = parts[1] ? parseInt(parts[1], 10) : 100;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    await reply(ctx, "👉 Usage: .random <min> <max>");
    return;
  }
  const result = min + Math.floor(Math.random() * (max - min + 1));
  await reply(ctx, `🔢 ${result}`);
});

router.register("choose", async (ctx) => {
  const opts = ctx.args.split(",").map((s) => s.trim()).filter(Boolean);
  if (opts.length < 2) {
    await reply(ctx, "👉 Give at least 2 options.\nExample: .choose pizza, burger");
    return;
  }
  await reply(ctx, `🎯 I choose: *${opts[Math.floor(Math.random() * opts.length)]}*`);
});

// ============================================================
// TEXT UTILITIES
// ============================================================

router.register("calc", async (ctx) => {
  const expr = ctx.args;
  if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) {
    await reply(ctx, "❌ Invalid expression. Only numbers and + - * / ( ) allowed.\nExample: .calc (4+5)*2");
    return;
  }
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict";return (${expr})`)();
    await reply(ctx, `🧮 ${expr} = ${result}`);
  } catch {
    await reply(ctx, "❌ Couldn't evaluate that expression.");
  }
});

router.register("reverse", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .reverse <text>");
  await reply(ctx, ctx.args.split("").reverse().join(""));
});

router.register("count", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .count <text>");
  const words = ctx.args.trim().split(/\s+/).length;
  await reply(ctx, `📝 ${words} words, ${ctx.args.length} characters`);
});

router.register("suggest", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .suggest <idea>");
  await reply(ctx, `💡 Suggestion recorded: "${ctx.args}"\nThanks, ${displayName(ctx.senderJid)}!`, { mentions: [ctx.senderJid] });
});

router.register("qr", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .qr <text or link>");
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ctx.args)}`;
  try {
    await ctx.sock.sendMessage(ctx.jid, { image: { url }, caption: "📷 Your QR code" });
  } catch {
    await reply(ctx, "❌ Couldn't generate QR code.");
  }
});

// ============================================================
// AFK
// ============================================================

router.register("afk", async (ctx) => {
  setAfk(ctx.senderJid, ctx.args || "AFK");
  await reply(ctx, `😴 ${displayName(ctx.senderJid)} is now AFK${ctx.args ? `: ${ctx.args}` : ""}.`, { mentions: [ctx.senderJid] });
});

// Called from whatsappService for EVERY incoming message (not just
// commands) so an AFK user gets welcomed back, and anyone who @-mentions
// them gets told they're away. Kept here so all the AFK state lives in
// one file.
async function checkAfk({ sock, jid, senderJid, m, text }) {
  try {
    if (getAfk(senderJid)) {
      const info = getAfk(senderJid);
      clearAfk(senderJid);
      const mins = Math.max(0, Math.round((Date.now() - info.since) / 60000));
      await sock.sendMessage(jid, { text: `👋 Welcome back ${displayName(senderJid)}, you were AFK for ${mins}m.`, mentions: [senderJid] });
    }
    const mentioned = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const target of mentioned) {
      const info = getAfk(target);
      if (info) {
        await sock.sendMessage(jid, { text: `💤 ${displayName(target)} is AFK: ${info.reason}`, mentions: [target] });
      }
    }
  } catch (err) {
    console.error("waFunCommands.checkAfk error:", err.message);
  }
}

// ============================================================
// MARRIAGE
// ============================================================

router.register("marry", async (ctx) => {
  if (!ctx.isGroup) return reply(ctx, "💍 .marry only works in a group — tag who you're proposing to.");
  const target = getMentionedJid(ctx.m);
  if (!target) return reply(ctx, "💍 Tag (@mention) or reply to who you want to marry.");
  if (target === ctx.senderJid) return reply(ctx, "🙄 You can't marry yourself.");
  if (isMarried(ctx.senderJid)) return reply(ctx, "💔 You're already married.");
  if (isMarried(target)) return reply(ctx, "💔 They're already married.");

  pendingProposals.set(target, { proposerJid: ctx.senderJid, chatJid: ctx.jid, time: Date.now() });
  await reply(
    ctx,
    `💍 ${displayName(ctx.senderJid)} proposed to ${displayName(target)}!\n${displayName(target)}, reply *.accept* or *.decline* within 2 minutes.`,
    { mentions: [ctx.senderJid, target] }
  );
  setTimeout(() => {
    const p = pendingProposals.get(target);
    if (p && p.time === p.time) pendingProposals.delete(target);
  }, 120000);
});

router.register("divorce", async (ctx) => {
  const spouse = divorceJid(ctx.senderJid);
  if (!spouse) return reply(ctx, "🙄 You're not married.");
  await reply(ctx, `💔 ${displayName(ctx.senderJid)} and ${displayName(spouse)} are now divorced.`, { mentions: [ctx.senderJid, spouse] });
});

router.register("spouse", async (ctx) => {
  const spouse = getSpouse(ctx.senderJid);
  if (!spouse) return reply(ctx, "You're not married yet — try .marry (tag someone, in a group).");
  await reply(ctx, `💍 You're married to ${displayName(spouse)}.`, { mentions: [spouse] });
});

router.register("accept", async (ctx) => {
  const p = pendingProposals.get(ctx.senderJid);
  if (!p || p.chatJid !== ctx.jid) return reply(ctx, "💭 No pending proposal for you here.");
  pendingProposals.delete(ctx.senderJid);
  marry(p.proposerJid, ctx.senderJid);
  await reply(ctx, `💒 ${displayName(p.proposerJid)} and ${displayName(ctx.senderJid)} are now married! 🎉`, {
    mentions: [p.proposerJid, ctx.senderJid],
  });
});

router.register("decline", async (ctx) => {
  const p = pendingProposals.get(ctx.senderJid);
  if (!p || p.chatJid !== ctx.jid) return reply(ctx, "💭 No pending proposal for you here.");
  pendingProposals.delete(ctx.senderJid);
  await reply(ctx, `💔 ${displayName(ctx.senderJid)} declined the proposal.`, { mentions: [ctx.senderJid] });
});

// ============================================================
// MSG (send a tagged message to someone else in the group)
// ============================================================

router.register("msg", async (ctx) => {
  if (!ctx.isGroup) return reply(ctx, "✉️ .msg only works in a group.");
  const target = getMentionedJid(ctx.m);
  if (!target) return reply(ctx, "👉 Usage: .msg @user <message>");
  const text = ctx.args.replace(/@\d+/g, "").trim();
  if (!text) return reply(ctx, "👉 Usage: .msg @user <message>");
  await reply(ctx, `✉️ ${displayName(ctx.senderJid)} → ${displayName(target)}:\n${text}`, {
    mentions: [ctx.senderJid, target],
  });
});

// ============================================================
// FOCUS (pomodoro-style timer) — ported from features2.js
// ============================================================

const focusSessions = new Map(); // senderJid -> { timeout }

router.register("focus", async (ctx) => {
  if (/^reset$/i.test(ctx.args.trim())) {
    const s = focusSessions.get(ctx.senderJid);
    if (s) clearTimeout(s.timeout);
    focusSessions.delete(ctx.senderJid);
    return reply(ctx, "🧘 Focus session stopped and reset.");
  }

  const minutes = ctx.args ? parseInt(ctx.args, 10) : 25;
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) {
    return reply(ctx, "👉 Usage: .focus [minutes] (default 25) or .focus reset");
  }
  if (focusSessions.has(ctx.senderJid)) {
    return reply(ctx, "You already have a focus session running. .focus reset to stop it.");
  }

  await reply(ctx, `🧘 Focus session started: ${minutes} min. I'll ping you when it's done.`);
  const timeout = setTimeout(async () => {
    focusSessions.delete(ctx.senderJid);
    try {
      await ctx.sock.sendMessage(ctx.jid, { text: `⏰ Focus session complete! Take a break.` });
    } catch {}
  }, minutes * 60000);
  focusSessions.set(ctx.senderJid, { timeout });
});

// ============================================================
// REMEMBER / MEMORIES / FORGET — a simple per-user note list.
// (Separate from the conversational memory in waMemory.js, which
// already covers "remember our chat / forget our chat"; this is an
// explicit user-managed list, ported 1:1 from /remember /memories
// /forget /forgetall.)
// ============================================================

const NOTES_FILE = path.join(DATA_DIR, "waNotes.json");
let notes = loadJson(NOTES_FILE, {}); // jid -> string[]

router.register("remember", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .remember <note>");
  if (!notes[ctx.senderJid]) notes[ctx.senderJid] = [];
  notes[ctx.senderJid].push(ctx.args);
  saveJson(NOTES_FILE, notes);
  await reply(ctx, `🧠 Noted (#${notes[ctx.senderJid].length}).`);
});

router.register("memories", async (ctx) => {
  const list = notes[ctx.senderJid] || [];
  if (!list.length) return reply(ctx, "🧠 You haven't asked me to remember anything yet.");
  await reply(ctx, "🧠 Your notes:\n" + list.map((n, i) => `${i + 1}. ${n}`).join("\n"));
});

router.register("forget", async (ctx) => {
  const n = parseInt(ctx.args, 10);
  const list = notes[ctx.senderJid] || [];
  if (!Number.isInteger(n) || n < 1 || n > list.length) {
    return reply(ctx, "👉 Usage: .forget <number> — see .memories for the numbers.");
  }
  list.splice(n - 1, 1);
  saveJson(NOTES_FILE, notes);
  await reply(ctx, `🧠 Forgot note #${n}.`);
});

router.register("forgetall", async (ctx) => {
  delete notes[ctx.senderJid];
  saveJson(NOTES_FILE, notes);
  await reply(ctx, "🧠 All notes cleared.");
});

module.exports = {
  checkAfk,
  getAfk,
};

// ============================================================
// MORE SELF-CONTAINED UTILITIES (no external API needed)
// ============================================================

router.register("time", async (ctx) => {
  await reply(ctx, `🕒 ${new Date().toLocaleTimeString("en-US", { timeZone: "UTC" })} UTC`);
});

router.register("date", async (ctx) => {
  await reply(ctx, `📅 ${new Date().toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", year: "numeric", month: "long", day: "numeric" })} (UTC)`);
});

router.register("rps", async (ctx) => {
  const choice = ctx.args.trim().toLowerCase();
  const options = ["rock", "paper", "scissors"];
  if (!options.includes(choice)) return reply(ctx, "👉 Usage: .rps rock|paper|scissors");
  const bot = options[Math.floor(Math.random() * 3)];
  let outcome;
  if (bot === choice) outcome = "It's a tie!";
  else if (
    (choice === "rock" && bot === "scissors") ||
    (choice === "paper" && bot === "rock") ||
    (choice === "scissors" && bot === "paper")
  )
    outcome = "You win! 🎉";
  else outcome = "I win! 😏";
  await reply(ctx, `✊✋✌️ You: ${choice} | Me: ${bot}\n${outcome}`);
}, { aliases: ["rockpaperscissors"] });

router.register("ship", async (ctx) => {
  if (!ctx.args.includes(",")) return reply(ctx, "👉 Usage: .ship name1, name2");
  const [a, b] = ctx.args.split(",").map((s) => s.trim()).filter(Boolean);
  if (!a || !b) return reply(ctx, "👉 Usage: .ship name1, name2");
  let hash = 0;
  const combined = a.toLowerCase() + b.toLowerCase();
  for (let i = 0; i < combined.length; i++) hash = (hash * 31 + combined.charCodeAt(i)) >>> 0;
  const pct = hash % 101;
  const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
  await reply(ctx, `💘 ${a} + ${b} = ${pct}%\n${bar}`);
});

router.register("clap", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .clap <text>");
  await reply(ctx, ctx.args.trim().split(/\s+/).join(" 👏 "));
});

router.register("mock", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .mock <text>");
  let out = "";
  let upper = false;
  for (const ch of ctx.args) {
    if (/[a-z]/i.test(ch)) {
      out += upper ? ch.toUpperCase() : ch.toLowerCase();
      upper = !upper;
    } else out += ch;
  }
  await reply(ctx, out);
}, { aliases: ["spongebobcase", "sarcasm"] });

router.register("binary", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .binary <text>");
  const bin = ctx.args.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
  await reply(ctx, bin);
});

router.register("unbinary", async (ctx) => {
  const clean = ctx.args.trim().split(/\s+/);
  if (!clean.length || clean.some((b) => !/^[01]{1,8}$/.test(b))) return reply(ctx, "👉 Usage: .unbinary <space-separated 8-bit binary>");
  try {
    const text = clean.map((b) => String.fromCharCode(parseInt(b, 2))).join("");
    await reply(ctx, text);
  } catch {
    await reply(ctx, "❌ Couldn't decode that.");
  }
});

router.register("base64", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .base64 <text>");
  await reply(ctx, Buffer.from(ctx.args, "utf8").toString("base64"));
});

router.register("unbase64", async (ctx) => {
  if (!ctx.args) return reply(ctx, "👉 Usage: .unbase64 <base64 text>");
  try {
    await reply(ctx, Buffer.from(ctx.args.trim(), "base64").toString("utf8"));
  } catch {
    await reply(ctx, "❌ That doesn't look like valid base64.");
  }
});

const FACTS = [
  "Honey never spoils — archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible.",
  "Octopuses have three hearts and blue blood.",
  "Bananas are berries, but strawberries aren't.",
  "A day on Venus is longer than a year on Venus.",
  "Wombat poop is cube-shaped.",
  "The Eiffel Tower can grow taller in summer due to heat expansion.",
  "Sharks existed before trees.",
  "There are more possible chess games than atoms in the observable universe.",
];
router.register("fact", async (ctx) => {
  await reply(ctx, `🧠 ${FACTS[Math.floor(Math.random() * FACTS.length)]}`);
});

const QUOTES = [
  "\"The only way to do great work is to love what you do.\" — Steve Jobs",
  "\"In the middle of difficulty lies opportunity.\" — Albert Einstein",
  "\"It does not matter how slowly you go as long as you do not stop.\" — Confucius",
  "\"What we think, we become.\" — Buddha",
  "\"The best time to plant a tree was 20 years ago. The second best time is now.\" — Chinese Proverb",
];
router.register("quote", async (ctx) => {
  await reply(ctx, `💭 ${QUOTES[Math.floor(Math.random() * QUOTES.length)]}`);
});
