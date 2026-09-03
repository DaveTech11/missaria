// services/waAdminPanel.js
//
// Adds three screens to the WhatsApp agent, all admin-facing:
//
//   .panel / .adminpanel / .dashboard   — bot-wide control panel
//                                          (owner-only, DM-only)
//   .antispam                           — per-group anti-spam settings
//                                          (group admins only)
//   .moderation                         — per-group flagged/blocked/
//                                          reports dashboard
//                                          (group admins only)
//   .flag view|block|report|ignore <id> — act on a flagged entry
//                                          (group admins only)
//
// Plus a passive hook, checkMessageForSpam(), meant to be called from
// whatsappService's per-message loop for every group text message. It
// scores the message, and if it crosses the threshold, logs it as
// "flagged" and — if this group's adminAlertsOn setting is on — posts
// a "suspicious conversation" card into the group.
//
// IMPORTANT — this does NOT auto-delete or auto-kick anyone. WhatsApp
// gives no reliable way to show a card only to admins (there's no
// admin-only channel in a normal group), and a false-positive auto-kick
// on a real member is worse than a missed flag. So the default behavior
// is: alert + let a group admin decide via ".flag block/report/ignore".
// That also matches "🔔 admin alerts: ON" in the mockup being its own
// toggle, separate from any auto-action.
//
// Also, real tappable buttons ([👁 View Chat] [🚫 Block] etc. in the
// mockup) aren't something Baileys/WhatsApp can render reliably —
// WhatsApp deprecated most of the old button message types. So those
// become plain reply commands instead (".flag block 7"), same
// convention as every other command in this file.

const fs = require("fs");
const path = require("path");
const router = require("./waCommandRouter");
const groupMgr = require("./waGroupManager");
const { toFancy } = require("../utils/fancyFont");
const { generateRichMenuCard } = require("../utils/waMenuCard");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SETTINGS_FILE = path.join(DATA_DIR, "antiSpamSettings.json");
const LOG_FILE = path.join(DATA_DIR, "moderationLog.json");
const GLOBAL_STATS_FILE = path.join(DATA_DIR, "waGlobalStats.json");

const MAX_LOG_PER_GROUP = 200; // per category (flagged/blocked/reports), oldest trimmed first

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
    console.error("waAdminPanel: failed saving", file, err.message);
  }
}

// ---------- anti-spam settings (per group) ----------

const DEFAULT_SETTINGS = {
  maxMessagesPerMin: 10,
  linkSpamOn: true,
  repeatedMessagesOn: true,
  botDetectionOn: true,
  adminAlertsOn: true,
};

let settingsStore = loadJson(SETTINGS_FILE, {}); // { groupJid: {...DEFAULT_SETTINGS} }

function getSettings(groupJid) {
  return { ...DEFAULT_SETTINGS, ...(settingsStore[groupJid] || {}) };
}
function setSetting(groupJid, key, value) {
  if (!settingsStore[groupJid]) settingsStore[groupJid] = { ...DEFAULT_SETTINGS };
  settingsStore[groupJid][key] = value;
  saveJson(SETTINGS_FILE, settingsStore);
}
function resetSettings(groupJid) {
  delete settingsStore[groupJid];
  saveJson(SETTINGS_FILE, settingsStore);
}

// ---------- moderation log (per group) ----------

let logStore = loadJson(LOG_FILE, {}); // { groupJid: { flagged: [], blocked: [], reports: [], nextId: 1 } }

function groupLog(groupJid) {
  if (!logStore[groupJid]) logStore[groupJid] = { flagged: [], blocked: [], reports: [], nextId: 1 };
  return logStore[groupJid];
}

function pushLog(groupJid, category, entry) {
  const log = groupLog(groupJid);
  entry.id = log.nextId++;
  log[category].push(entry);
  if (log[category].length > MAX_LOG_PER_GROUP) {
    log[category] = log[category].slice(-MAX_LOG_PER_GROUP);
  }
  saveJson(LOG_FILE, logStore);
  return entry;
}

function findFlagged(groupJid, id) {
  const log = groupLog(groupJid);
  return log.flagged.find((e) => e.id === Number(id));
}

function removeFlagged(groupJid, id) {
  const log = groupLog(groupJid);
  log.flagged = log.flagged.filter((e) => e.id !== Number(id));
  saveJson(LOG_FILE, logStore);
}

// ---------- global (bot-wide) stats, for the owner's panel ----------

let globalStats = loadJson(GLOBAL_STATS_FILE, { totalMessages: 0, contacts: {} });
let statsDirty = false;
let statsSaveTimer = null;

function scheduleStatsSave() {
  statsDirty = true;
  if (statsSaveTimer) return;
  statsSaveTimer = setTimeout(() => {
    statsSaveTimer = null;
    if (!statsDirty) return;
    statsDirty = false;
    saveJson(GLOBAL_STATS_FILE, globalStats);
  }, 3000);
}

/** Call once per incoming WhatsApp message (DM or group), any sender. */
function trackGlobalMessage(senderJid) {
  globalStats.totalMessages += 1;
  const key = groupMgr.normalizeJid(senderJid);
  if (key) globalStats.contacts[key] = Date.now();
  scheduleStatsSave();
}

function getGlobalStats() {
  return {
    totalMessages: globalStats.totalMessages,
    totalContacts: Object.keys(globalStats.contacts).length,
  };
}

function totalFlagged() {
  return Object.values(logStore).reduce((sum, g) => sum + g.flagged.length, 0);
}
function totalBlocked() {
  return Object.values(logStore).reduce((sum, g) => sum + g.blocked.length, 0);
}

// ---------- spam scoring (in-memory, per group+sender — no need to persist) ----------

const recentBySender = new Map(); // "groupJid|senderJid" -> [{ text, ts }]
const RECENT_WINDOW_MS = 60 * 1000;

const SCAM_KEYWORDS = [
  "click here", "act now", "investment opportunity", "forex", "guaranteed profit",
  "you have won", "congratulations you", "claim your prize", "bitcoin", "crypto giveaway",
  "loan approved", "work from home", "double your money", "send otp", "verify your account",
];

const GENERIC_URL_RE = /https?:\/\/[^\s]+/i;

function textSimilarity(a, b) {
  // Cheap near-duplicate check: same text, or one is a short prefix/suffix of the other.
  if (!a || !b) return 0;
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (!shorter.length) return 0;
  return longer.includes(shorter) ? shorter.length / longer.length : 0;
}

/**
 * Scores one message from `senderJid` in `groupJid`. Returns
 * { score, tags } — score is 0-100, tags explain what fired.
 * Also updates the sender's short-term history used for flood /
 * repeated-message detection.
 */
function scoreMessage(groupJid, senderJid, text, { isNewMember } = {}) {
  const settings = getSettings(groupJid);
  const key = `${groupJid}|${senderJid}`;
  const now = Date.now();
  const history = (recentBySender.get(key) || []).filter((e) => now - e.ts < RECENT_WINDOW_MS);

  let score = 0;
  const tags = [];

  if (settings.linkSpamOn && GENERIC_URL_RE.test(text)) {
    score += 35;
    tags.push("link");
    if (isNewMember) {
      score += 15;
      tags.push("new-member-link");
    }
  }

  if (settings.repeatedMessagesOn) {
    const dup = history.find((e) => textSimilarity(e.text, text) > 0.85);
    if (dup) {
      score += 25;
      tags.push("repeated");
    }
  }

  if (history.length + 1 > settings.maxMessagesPerMin) {
    score += 25;
    tags.push("flood");
  }

  const lower = text.toLowerCase();
  if (SCAM_KEYWORDS.some((kw) => lower.includes(kw))) {
    score += 25;
    tags.push("scam-keywords");
  }

  if (settings.botDetectionOn && /^[a-z0-9]{20,}$/i.test(text.replace(/\s+/g, ""))) {
    // long, spaceless, low-entropy blob — typical of bot-generated spam payloads
    score += 15;
    tags.push("bot-like");
  }

  history.push({ text, ts: now });
  recentBySender.set(key, history);

  return { score: Math.min(100, score), tags: [...new Set(tags)] };
}

const FLAG_THRESHOLD = 60;

function maskNumber(jid) {
  const digits = String(jid || "").split("@")[0].replace(/[^0-9]/g, "");
  if (digits.length < 6) return "+•••••••••";
  return `+${digits.slice(0, 3)}••••••${digits.slice(-2)}`;
}

/**
 * Called from whatsappService for every group text message. Scores it,
 * and if it crosses the flag threshold, logs it and — if adminAlertsOn
 * — posts the suspicious-conversation card into the group.
 * Fire-and-forget from the caller's point of view; never throws.
 */
async function checkMessageForSpam({ sock, jid: groupJid, senderJid, text }) {
  try {
    if (!text) return;
    const isNewMember = !groupMgr.hasActivity(groupJid, groupMgr.normalizeJid(senderJid));
    const { score, tags } = scoreMessage(groupJid, senderJid, text, { isNewMember });
    if (score < FLAG_THRESHOLD) return;

    const entry = pushLog(groupJid, "flagged", {
      senderJid: groupMgr.normalizeJid(senderJid),
      preview: text.slice(0, 120),
      score,
      tags,
      ts: Date.now(),
    });

    const settings = getSettings(groupJid);
    if (settings.adminAlertsOn) {
      await sock.sendMessage(groupJid, { text: renderSuspiciousCard(entry) });
    }
  } catch (err) {
    console.error("waAdminPanel: checkMessageForSpam failed:", err.message);
  }
}

// ---------- screen renderers ----------

function box(title) {
  const top = "╭" + "─".repeat(28) + "╮";
  const bot = "╰" + "─".repeat(28) + "╯";
  return `${top}\n│ ${title}\n${bot}`;
}

function renderSuspiciousCard(entry) {
  return (
    `🚨 ${toFancy("suspicious conversation")}\n\n` +
    `👤 ${toFancy("contact")}: ${maskNumber(entry.senderJid)}\n` +
    `💬 "${entry.preview}${entry.preview.length >= 120 ? "…" : ""}"\n\n` +
    `⚠️ ${toFancy("risk score")}: ${entry.score}/100\n` +
    `🏷 ${toFancy("tags")}: ${entry.tags.map(toFancy).join(" • ") || toFancy("none")}\n\n` +
    `.flag view ${entry.id}    .flag block ${entry.id}\n` +
    `.flag report ${entry.id}    .flag ignore ${entry.id}`
  );
}

function renderAntiSpamSettings(groupJid) {
  const s = getSettings(groupJid);
  const onOff = (v) => (v ? "ON" : "OFF");
  return (
    `🛡 ${toFancy("anti-spam settings")}\n\n` +
    `📊 ${toFancy("max messages")}: ${s.maxMessagesPerMin}/min\n` +
    `🔗 ${toFancy("link spam")}: ${onOff(s.linkSpamOn)}\n` +
    `📢 ${toFancy("repeated messages")}: ${onOff(s.repeatedMessagesOn)}\n` +
    `🤖 ${toFancy("bot detection")}: ${onOff(s.botDetectionOn)}\n` +
    `🔔 ${toFancy("admin alerts")}: ${onOff(s.adminAlertsOn)}\n\n` +
    `⚙️ *.antispam set <maxmessages|linkspam|repeated|botdetection|alerts> <on|off|number>*\n` +
    `🔄 *.antispam reset*`
  );
}

function renderModerationDashboard(groupJid) {
  const log = groupLog(groupJid);
  return (
    `🚨 ${toFancy("moderation")}\n\n` +
    `⚠️ ${log.flagged.length} ${toFancy("flagged")}\n` +
    `🚫 ${log.blocked.length} ${toFancy("blocked")}\n` +
    `📢 ${log.reports.length} ${toFancy("reports")}\n\n` +
    `*.moderation flagged*    *.moderation blocked*    *.moderation reports*`
  );
}

function renderList(title, entries) {
  if (!entries.length) return `${title}\n\n(${toFancy("nothing here yet")})`;
  const lines = entries
    .slice(-15)
    .reverse()
    .map((e) => `#${e.id} · ${maskNumber(e.senderJid)} · ${e.score !== undefined ? e.score + "/100" : ""} · "${e.preview}"`);
  return `${title}\n\n${lines.join("\n")}`;
}

async function renderPanel() {
  const global = getGlobalStats();
  return (
    box(`🛡 ${toFancy("admin control")}`) +
    `\n\n` +
    `📱 ${toFancy("whatsapp")}: 🟢 ${toFancy("online")}\n` +
    `📩 ${toFancy("messages")}: ${global.totalMessages.toLocaleString()}\n` +
    `👥 ${toFancy("contacts")}: ${global.totalContacts.toLocaleString()}\n` +
    `🚨 ${toFancy("flagged")}: ${totalFlagged()}\n` +
    `🚫 ${toFancy("blocked")}: ${totalBlocked()}\n\n` +
    `*.antispam* — anti-spam settings (run inside a group)\n` +
    `*.moderation* — flagged / blocked / reports (run inside a group)\n` +
    `*.menu* — full command list`
  );
}

async function renderPanelCard() {
  const global = getGlobalStats();
  const HERO_IMAGE = path.join(__dirname, "..", "menu.jpg");

  return generateRichMenuCard({
    title: "Admin Control Center",
    subtitle: "Miss Aria • owner only",
    heroImage: fs.existsSync(HERO_IMAGE) ? HERO_IMAGE : null,
    sections: [
      {
        name: "Overview",
        items: [
          "🟢 Online",
          `📩 ${global.totalMessages.toLocaleString()} msgs`,
          `👥 ${global.totalContacts.toLocaleString()} contacts`,
        ],
      },
      {
        name: "Moderation",
        items: [`⚠️ ${totalFlagged()} flagged`, `🚫 ${totalBlocked()} blocked`, ".moderation"],
      },
      {
        name: "Settings",
        items: [".antispam", ".menu", ".panel"],
      },
    ],
    footer: "Type a command below — these are labels, not tappable buttons.",
  });
}

// ---------- command registrations ----------

router.register(
  "panel",
  async (ctx) => {
    // Owner-only. This was previously just dmOnly — any DM sender could
    // see bot-wide stats. That's fixed here: dmOnly stays (so it can never
    // fire in a group), but now it also silently ignores anyone who isn't
    // the confirmed bot owner (ctx.isOwner, set in whatsappService from
    // isOwnerJid(jid)), same convention as the no-prefix admin commands —
    // no error message for a non-owner, so it doesn't advertise that a
    // hidden command exists.
    if (!ctx.isOwner) return;

    try {
      const card = await renderPanelCard();
      await ctx.sock.sendMessage(ctx.jid, {
        image: card,
        caption: await renderPanel(),
      });
    } catch (err) {
      console.error("waAdminPanel: panel card render failed, falling back to text:", err.message);
      await ctx.sock.sendMessage(ctx.jid, { text: await renderPanel() });
    }
  },
  { dmOnly: true, aliases: ["adminpanel", "dashboard"] }
);

router.register(
  "antispam",
  async (ctx) => {
    if (!ctx.isGroup) {
      await ctx.sock.sendMessage(ctx.jid, { text: "That only works inside a group." });
      return;
    }
    const isAdmin = await groupMgr.isSenderGroupAdmin(ctx.sock, ctx.jid, ctx.senderJid);
    if (!isAdmin) return; // silent, same convention as the bare-word admin commands

    const args = String(ctx.args || "").trim();
    if (!args) {
      await ctx.sock.sendMessage(ctx.jid, { text: renderAntiSpamSettings(ctx.jid) });
      return;
    }

    if (/^reset$/i.test(args)) {
      resetSettings(ctx.jid);
      await ctx.sock.sendMessage(ctx.jid, { text: "🔄 Anti-spam settings reset to defaults.\n\n" + renderAntiSpamSettings(ctx.jid) });
      return;
    }

    const m = /^set\s+(\S+)\s+(.+)$/i.exec(args);
    if (!m) {
      await ctx.sock.sendMessage(ctx.jid, { text: "Usage: *.antispam set <key> <value>* or *.antispam reset*" });
      return;
    }
    const [, rawKey, rawValue] = m;
    const key = rawKey.toLowerCase();
    const KEY_MAP = {
      maxmessages: "maxMessagesPerMin",
      linkspam: "linkSpamOn",
      repeated: "repeatedMessagesOn",
      botdetection: "botDetectionOn",
      alerts: "adminAlertsOn",
    };
    const settingKey = KEY_MAP[key];
    if (!settingKey) {
      await ctx.sock.sendMessage(ctx.jid, { text: `Unknown setting *${rawKey}*. Options: maxmessages, linkspam, repeated, botdetection, alerts.` });
      return;
    }

    let value;
    if (settingKey === "maxMessagesPerMin") {
      value = parseInt(rawValue, 10);
      if (!Number.isFinite(value) || value <= 0) {
        await ctx.sock.sendMessage(ctx.jid, { text: "Give a positive number, e.g. *.antispam set maxmessages 10*" });
        return;
      }
    } else {
      if (!/^(on|off)$/i.test(rawValue.trim())) {
        await ctx.sock.sendMessage(ctx.jid, { text: "Value must be *on* or *off*." });
        return;
      }
      value = /^on$/i.test(rawValue.trim());
    }

    setSetting(ctx.jid, settingKey, value);
    await ctx.sock.sendMessage(ctx.jid, { text: renderAntiSpamSettings(ctx.jid) });
  },
  { groupOnly: true }
);

router.register(
  "moderation",
  async (ctx) => {
    const isAdmin = await groupMgr.isSenderGroupAdmin(ctx.sock, ctx.jid, ctx.senderJid);
    if (!isAdmin) return;

    const sub = String(ctx.args || "").trim().toLowerCase();
    const log = groupLog(ctx.jid);

    if (sub === "flagged") {
      await ctx.sock.sendMessage(ctx.jid, { text: renderList(`⚠️ ${toFancy("flagged")}`, log.flagged) });
      return;
    }
    if (sub === "blocked") {
      await ctx.sock.sendMessage(ctx.jid, { text: renderList(`🚫 ${toFancy("blocked")}`, log.blocked) });
      return;
    }
    if (sub === "reports") {
      await ctx.sock.sendMessage(ctx.jid, { text: renderList(`📢 ${toFancy("reports")}`, log.reports) });
      return;
    }
    await ctx.sock.sendMessage(ctx.jid, { text: renderModerationDashboard(ctx.jid) });
  },
  { groupOnly: true }
);

router.register(
  "flag",
  async (ctx) => {
    const isAdmin = await groupMgr.isSenderGroupAdmin(ctx.sock, ctx.jid, ctx.senderJid);
    if (!isAdmin) return;

    const m = /^(view|block|report|ignore)\s+(\d+)$/i.exec(String(ctx.args || "").trim());
    if (!m) {
      await ctx.sock.sendMessage(ctx.jid, { text: "Usage: *.flag view|block|report|ignore <id>*" });
      return;
    }
    const [, action, idStr] = m;
    const id = Number(idStr);
    const entry = findFlagged(ctx.jid, id);
    if (!entry) {
      await ctx.sock.sendMessage(ctx.jid, { text: `No flagged entry #${id} (it may have already been handled).` });
      return;
    }

    if (action.toLowerCase() === "view") {
      await ctx.sock.sendMessage(ctx.jid, {
        text: `👁 #${entry.id} · ${maskNumber(entry.senderJid)}\n"${entry.preview}"\n${toFancy("risk score")}: ${entry.score}/100\n${toFancy("tags")}: ${entry.tags.join(", ")}`,
      });
      return;
    }

    if (action.toLowerCase() === "ignore") {
      removeFlagged(ctx.jid, id);
      await ctx.sock.sendMessage(ctx.jid, { text: `✅ #${entry.id} ignored.` });
      return;
    }

    if (action.toLowerCase() === "report") {
      removeFlagged(ctx.jid, id);
      pushLog(ctx.jid, "reports", { senderJid: entry.senderJid, preview: entry.preview, score: entry.score, tags: entry.tags, ts: Date.now() });
      await ctx.sock.sendMessage(ctx.jid, { text: `📢 #${entry.id} recorded as a report.` });
      return;
    }

    if (action.toLowerCase() === "block") {
      removeFlagged(ctx.jid, id);
      pushLog(ctx.jid, "blocked", { senderJid: entry.senderJid, preview: entry.preview, score: entry.score, tags: entry.tags, ts: Date.now() });
      groupMgr.banUser(ctx.jid, entry.senderJid);
      const botIsAdmin = await groupMgr.isBotGroupAdmin(ctx.sock, ctx.jid);
      if (botIsAdmin) {
        try {
          await ctx.sock.groupParticipantsUpdate(ctx.jid, [entry.senderJid], "remove");
        } catch (err) {
          console.error("waAdminPanel: block-remove failed:", err.message);
        }
      }
      await ctx.sock.sendMessage(ctx.jid, {
        text: `🚫 #${entry.id} blocked${botIsAdmin ? " and removed from the group" : " (bot isn't a group admin, so they weren't removed — future messages from them are still banned from re-adding via me)"}.`,
      });
      return;
    }
  },
  { groupOnly: true }
);

module.exports = {
  trackGlobalMessage,
  checkMessageForSpam,
  getSettings,
  renderPanel,
  renderPanelCard,
  renderAntiSpamSettings,
  renderModerationDashboard,
};
