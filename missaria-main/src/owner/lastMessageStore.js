// src/owner/lastMessageStore.js
//
// Why this exists: several owner-agent actions (pin/star/delete a
// "message") need a FULL Baileys message key — {id, remoteJid, fromMe,
// participant} — not just a group name. When the owner asks for this from
// a private DM with the bot (not by replying to the message directly
// inside the group), there is no quoted-message context to extract a key
// from at all. Rather than fabricate a key or silently do nothing, this
// module tracks the most recent real (non-bot) message seen in each
// group, so "pin that in Zuno" / "pin the last message in Zuno" can
// resolve to a real key — the same one WhatsApp itself would use.
//
// This is a deliberate, honest scope limit: it can only ever act on the
// LAST message the bot itself observed passing through — never an
// arbitrary older message, and never one from before the bot was online
// in that group. That's the real capability; nothing here pretends to see
// further back than that.

const MAX_TRACKED_GROUPS = 500; // simple bound so this can't grow unbounded across many groups

/** groupJid -> { key, preview, senderJid, timestamp } */
const lastByGroup = new Map();

/**
 * Records the most recent message seen in a group. Called from the main
 * message-upsert loop in whatsappService.js for every group message,
 * BEFORE any bot-authored message would land here (m.key.fromMe messages
 * are already filtered out upstream, so this never tracks the bot's own
 * replies as "the last message").
 */
function recordMessage(groupJid, key, preview, senderJid) {
  if (!groupJid || !key?.id) return;
  if (lastByGroup.size >= MAX_TRACKED_GROUPS && !lastByGroup.has(groupJid)) {
    // Evict the oldest entry rather than growing forever — a bot in many
    // groups only needs "pin the last message" to work for recently-active
    // ones anyway.
    const oldestKey = lastByGroup.keys().next().value;
    if (oldestKey) lastByGroup.delete(oldestKey);
  }
  lastByGroup.set(groupJid, { key, preview: String(preview || "").slice(0, 80), senderJid, timestamp: Date.now() });
}

function getLastMessage(groupJid) {
  return lastByGroup.get(groupJid) || null;
}

module.exports = { recordMessage, getLastMessage };
