// services/waGroupManager.js
//
// Everything group-related for the WhatsApp agent:
//  - admin checks (bot-is-admin, sender-is-admin)
//  - reply-to-mention trigger ("aria" / "miss aria" / "agent") for the
//    conversational side, so the bot doesn't talk over every message
//  - admin-only moderation commands (kick/promote/demote/setpp/antilink/scan)
//    — these work with NO prefix, e.g. just "kick" while replying/tagging
//  - join flow: broadcast + menu image the moment the bot is added,
//    and (if an admin added it) an inactive-member sweep
//  - a lightweight per-group activity log, used to tell "inactive" from
//    "active" members for the sweep
//
// Group-management commands are gated to group ADMINS only. Everyone
// else in the group still gets normal (non-group-management) replies —
// that gating happens in whatsappService, this module just answers
// "is this person allowed to do this."

const fs = require("fs");
const path = require("path");
const { restyle } = require("../utils/fancyFont");

const DATA_DIR = path.join(__dirname, "..", "data");
const ACTIVITY_FILE = path.join(DATA_DIR, "groupActivity.json");
const MENU_IMAGE_PATH = path.join(__dirname, "..", "menu.jpg");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------- activity log (who has said something, per group) ----------

function loadActivity() {
  if (!fs.existsSync(ACTIVITY_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, "utf8"));
  } catch {
    return {};
  }
}

let activity = loadActivity();
let saveTimer = null;

function saveActivitySoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activity, null, 2));
    } catch (err) {
      console.error("waGroupManager: failed saving activity log:", err.message);
    }
  }, 2000);
}

function recordActivity(groupJid, participantJid) {
  if (!activity[groupJid]) activity[groupJid] = {};
  activity[groupJid][participantJid] = Date.now();
  saveActivitySoon();
}

function hasActivity(groupJid, participantJid) {
  return Boolean(activity[groupJid] && activity[groupJid][participantJid]);
}

// ---------- admin checks ----------

function normalizeJid(jid) {
  return String(jid || "").split(":")[0].split("@")[0] + "@s.whatsapp.net";
}

async function getGroupMetadata(sock, groupJid) {
  try {
    return await sock.groupMetadata(groupJid);
  } catch (err) {
    console.error("waGroupManager: groupMetadata failed:", err.message);
    return null;
  }
}

async function isBotGroupAdmin(sock, groupJid) {
  const meta = await getGroupMetadata(sock, groupJid);
  if (!meta) return false;
  const botId = normalizeJid(sock.user?.id);
  const me = meta.participants.find((p) => normalizeJid(p.id) === botId);
  return Boolean(me && (me.admin === "admin" || me.admin === "superadmin"));
}

async function isSenderGroupAdmin(sock, groupJid, senderJid) {
  const meta = await getGroupMetadata(sock, groupJid);
  if (!meta) return false;
  const target = normalizeJid(senderJid);
  const p = meta.participants.find((p) => normalizeJid(p.id) === target);
  return Boolean(p && (p.admin === "admin" || p.admin === "superadmin"));
}

// ---------- mention trigger (conversational reply gate in groups) ----------

const MENTION_TRIGGER_RE = /\b(aria|miss\s*aria|agent)\b/i;

function isMentionTriggered(text, msg, botJid) {
  if (MENTION_TRIGGER_RE.test(String(text || ""))) return true;
  // Also counts if they @-tagged the bot's own WhatsApp number.
  if (!botJid) return false;
  const mentioned = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const botId = normalizeJid(botJid);
  return mentioned.some((j) => normalizeJid(j) === botId);
}

// ---------- anti-link ----------

const WA_GROUP_LINK_RE = /chat\.whatsapp\.com\/[A-Za-z0-9]+/i;

function containsGroupInviteLink(text) {
  return WA_GROUP_LINK_RE.test(String(text || ""));
}

// ---------- join flow ----------

async function sendJoinBroadcast(sock, groupJid) {
  const caption =
    `🌸 *${restyle("Miss Aria is here!")}*\n\n` +
    "Mention *aria* (or *miss aria* / *agent*) any time you want me to jump into the conversation.\n" +
    "Group admins get access to moderation commands — send *menu* to see everything I can do here.";

  try {
    if (fs.existsSync(MENU_IMAGE_PATH)) {
      await sock.sendMessage(groupJid, {
        image: fs.readFileSync(MENU_IMAGE_PATH),
        caption,
      });
    } else {
      await sock.sendMessage(groupJid, { text: caption });
    }
  } catch (err) {
    console.error("waGroupManager: join broadcast failed:", err.message);
  }
}

async function sendMenuImage(sock, jid, caption) {
  try {
    if (fs.existsSync(MENU_IMAGE_PATH)) {
      await sock.sendMessage(jid, { image: fs.readFileSync(MENU_IMAGE_PATH), caption });
    } else {
      await sock.sendMessage(jid, { text: caption });
    }
  } catch (err) {
    console.error("waGroupManager: sendMenuImage failed:", err.message);
  }
}

// ---------- inactive-member sweep ----------

// "Inactive" = no message from that participant has ever been recorded
// in this group's activity log. Admins and the bot itself are always
// left alone.
async function scanAndKickInactive(sock, groupJid) {
  const meta = await getGroupMetadata(sock, groupJid);
  if (!meta) return { removed: 0, error: "could not read group metadata" };

  const botId = normalizeJid(sock.user?.id);
  const toRemove = meta.participants
    .filter((p) => {
      const jid = normalizeJid(p.id);
      if (jid === botId) return false;
      if (p.admin === "admin" || p.admin === "superadmin") return false;
      return !hasActivity(groupJid, jid);
    })
    .map((p) => p.id);

  if (!toRemove.length) return { removed: 0 };

  try {
    await sock.groupParticipantsUpdate(groupJid, toRemove, "remove");
    return { removed: toRemove.length };
  } catch (err) {
    console.error("waGroupManager: kick sweep failed:", err.message);
    return { removed: 0, error: err.message };
  }
}

// ---------- warns / mutes / bans (persisted, per-group) ----------

const WARNS_FILE = path.join(DATA_DIR, "groupWarns.json");
const MUTES_FILE = path.join(DATA_DIR, "groupMutes.json");
const BANS_FILE = path.join(DATA_DIR, "groupBans.json");
const WARN_LIMIT = 3; // auto-kick once a member hits this many warns

function loadJsonFile(file) {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}
function saveJsonFile(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("waGroupManager: failed saving", file, err.message);
  }
}

let warnsStore = loadJsonFile(WARNS_FILE); // { groupJid: { userJid: count } }
let mutesStore = loadJsonFile(MUTES_FILE); // { groupJid: { userJid: expiresAtOrNull } }
let bansStore = loadJsonFile(BANS_FILE); // { groupJid: { userJid: true } }

function addWarn(groupJid, userJid) {
  if (!warnsStore[groupJid]) warnsStore[groupJid] = {};
  const count = (warnsStore[groupJid][userJid] || 0) + 1;
  warnsStore[groupJid][userJid] = count;
  saveJsonFile(WARNS_FILE, warnsStore);
  return count;
}
function getWarns(groupJid, userJid) {
  return (warnsStore[groupJid] && warnsStore[groupJid][userJid]) || 0;
}
function clearWarn(groupJid, userJid) {
  if (warnsStore[groupJid]) {
    warnsStore[groupJid][userJid] = Math.max(0, (warnsStore[groupJid][userJid] || 0) - 1);
    saveJsonFile(WARNS_FILE, warnsStore);
  }
}
function resetWarns(groupJid, userJid) {
  if (warnsStore[groupJid]) {
    delete warnsStore[groupJid][userJid];
    saveJsonFile(WARNS_FILE, warnsStore);
  }
}
function listWarns(groupJid) {
  return warnsStore[groupJid] || {};
}

// Parses a duration like "10m" / "2h" / "1d" -> milliseconds, or null for
// "until manually unmuted".
function parseDuration(text) {
  const match = /^(\d+)\s*(m|h|d)$/i.exec(String(text || "").trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const mult = unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000;
  return n * mult;
}

function muteUser(groupJid, userJid, durationMs) {
  if (!mutesStore[groupJid]) mutesStore[groupJid] = {};
  mutesStore[groupJid][userJid] = durationMs ? Date.now() + durationMs : null;
  saveJsonFile(MUTES_FILE, mutesStore);
}
function unmuteUser(groupJid, userJid) {
  if (mutesStore[groupJid]) {
    delete mutesStore[groupJid][userJid];
    saveJsonFile(MUTES_FILE, mutesStore);
  }
}
function isMuted(groupJid, userJid) {
  const expires = mutesStore[groupJid] && mutesStore[groupJid][userJid];
  if (expires === undefined) return false;
  if (expires === null) return true; // muted indefinitely
  if (Date.now() > expires) {
    unmuteUser(groupJid, userJid);
    return false;
  }
  return true;
}

function banUser(groupJid, userJid) {
  if (!bansStore[groupJid]) bansStore[groupJid] = {};
  bansStore[groupJid][userJid] = true;
  saveJsonFile(BANS_FILE, bansStore);
}
function unbanUser(groupJid, userJid) {
  if (bansStore[groupJid]) {
    delete bansStore[groupJid][userJid];
    saveJsonFile(BANS_FILE, bansStore);
  }
}
function isBanned(groupJid, userJid) {
  return Boolean(bansStore[groupJid] && bansStore[groupJid][userJid]);
}

// ---------- lock / unlock (maps to WhatsApp's real "announcement" group
// setting — only admins can send. WhatsApp has no native per-content-type
// lock, so locktext/lockmedia/etc. from the Telegram side are NOT faked
// here; /lock and /unlock toggle the one lock WhatsApp actually has.) ----------

async function setGroupLocked(sock, groupJid, locked) {
  await sock.groupSettingUpdate(groupJid, locked ? "announcement" : "not_announcement");
}

// ---------- admin command parsing ----------

// No prefix needed — just the bare word, optionally with a tag/reply.
const ADMIN_COMMANDS = {
  kick: /^(kick|remove)\b/i,
  promote: /^promote\b/i,
  demote: /^demote\b/i,
  antilinkOn: /^antilink\s+on\b/i,
  antilinkOff: /^antilink\s+off\b/i,
  scan: /^(scan|cleanup|removeinactive)\b/i,
  setpp: /^(setpp|setgrouppic|setgroupicon)\b/i,
  // ---- moderation, added this round ----
  mute: /^mute\b/i,
  unmute: /^unmute\b/i,
  warn: /^warn\b/i,
  warns: /^warns\b/i,
  unwarn: /^unwarn\b/i,
  resetwarns: /^resetwarns\b/i,
  lock: /^lock\b/i,
  unlock: /^unlock\b/i,
  tag: /^tag\b/i,
  untag: /^untag\b/i,
  ban: /^ban\b/i,
  unban: /^unban\b/i,
  setgroupname: /^setgroupname\s+/i,
  setgroupdesc: /^setgroupdesc\s+/i,
  link: /^(link|linkgc|gclink)\b/i,
  adminlist: /^(adminlist|admins)\b/i,
  del: /^del\b/i,
};

function matchAdminCommand(text) {
  const t = String(text || "").trim();
  for (const [name, re] of Object.entries(ADMIN_COMMANDS)) {
    if (re.test(t)) return name;
  }
  return null;
}

// Figures out which participant a kick/promote/demote command targets:
// an @-mention in the text, or whoever's message is being replied to.
function getCommandTargetJid(msg) {
  const ctx = msg?.message?.extendedTextMessage?.contextInfo;
  const mentioned = ctx?.mentionedJid || [];
  if (mentioned.length) return mentioned[0];
  if (ctx?.participant) return ctx.participant;
  return null;
}

module.exports = {
  recordActivity,
  hasActivity,
  isBotGroupAdmin,
  isSenderGroupAdmin,
  isMentionTriggered,
  containsGroupInviteLink,
  sendJoinBroadcast,
  sendMenuImage,
  scanAndKickInactive,
  matchAdminCommand,
  getCommandTargetJid,
  normalizeJid,
  getGroupMetadata,
  // moderation additions
  WARN_LIMIT,
  addWarn,
  getWarns,
  clearWarn,
  resetWarns,
  listWarns,
  parseDuration,
  muteUser,
  unmuteUser,
  isMuted,
  banUser,
  unbanUser,
  isBanned,
  setGroupLocked,
};
