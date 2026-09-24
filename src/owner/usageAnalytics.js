// src/owner/usageAnalytics.js
//
// Real counters, persisted to disk — not a cosmetic "learning" indicator.
// The actual value here: recentUnhandled gives a genuine list of phrasings
// the owner tried that ownerRouter didn't recognize, which is the honest
// starting point for improving intent matching — a human (owner or a
// future dev session) reads these and decides whether to add a pattern.
// This does NOT automatically rewrite ownerRouter's patterns itself —
// that would be exactly the kind of unverified "self-improvement" claim
// this whole feature request started by rejecting.

const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "..", "..", "data", "usage_analytics.json");
const MAX_RECENT_UNHANDLED = 50;

function load() {
  if (!fs.existsSync(FILE_PATH)) {
    return { totalCommands: 0, handledCommands: 0, unhandledCommands: 0, aiRepliesOwner: 0, aiRepliesOther: 0, recentUnhandled: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch {
    return { totalCommands: 0, handledCommands: 0, unhandledCommands: 0, aiRepliesOwner: 0, aiRepliesOther: 0, recentUnhandled: [] };
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

function recordCommand({ senderJid, text, handled }) {
  const data = load();
  data.totalCommands++;
  if (handled) {
    data.handledCommands++;
  } else {
    data.unhandledCommands++;
    data.recentUnhandled.push({ text: String(text || "").slice(0, 200), at: Date.now() });
    if (data.recentUnhandled.length > MAX_RECENT_UNHANDLED) {
      data.recentUnhandled = data.recentUnhandled.slice(-MAX_RECENT_UNHANDLED);
    }
  }
  save(data);
}

function recordAiReply({ isOwnerMessage }) {
  const data = load();
  if (isOwnerMessage) data.aiRepliesOwner++;
  else data.aiRepliesOther++;
  save(data);
}

function getStats() {
  return load();
}

module.exports = { recordCommand, recordAiReply, getStats };
