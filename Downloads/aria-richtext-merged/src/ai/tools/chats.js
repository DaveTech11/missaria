// src/ai/tools/chats.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");

/**
 * Baileys' documented shape for the in-chat "pin message" feature (distinct
 * from pinning a whole CHAT to the top of the chat list — see pinChat
 * below). Requires the full message key, same as deleteMessage in
 * moderation.js — there is no "pin by ID alone" call, WhatsApp's protocol
 * needs remoteJid/participant/fromMe too.
 *
 * `durationSeconds` maps to WhatsApp's three real pin durations: 24 hours
 * (86400), 7 days (604800), or 30 days (2592000). Defaults to 24h if
 * omitted or not one of the three, since sending an arbitrary duration
 * WhatsApp doesn't support would silently fail.
 */
const PIN_DURATIONS = { day: 86400, week: 604800, month: 2592000 };

define("pinMessage", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { key, durationSeconds }) {
    if (!key?.id || !key?.remoteJid) {
      return fail("INVALID_MESSAGE_KEY", "Need the full message key (id, remoteJid, fromMe, participant) to pin a message.");
    }
    const time = Object.values(PIN_DURATIONS).includes(durationSeconds) ? durationSeconds : PIN_DURATIONS.day;
    try {
      await sock.sendMessage(key.remoteJid, { pin: key, type: 1, time });
      return ok({ pinned: true, key, durationSeconds: time });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("unpinMessage", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { key }) {
    if (!key?.id || !key?.remoteJid) {
      return fail("INVALID_MESSAGE_KEY", "Need the full message key to unpin a message.");
    }
    try {
      await sock.sendMessage(key.remoteJid, { pin: key, type: 0 });
      return ok({ pinned: false, key });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Stars/unstars a single message for the bot's own account (WhatsApp
 * stars are per-account, not shared across a chat) — real chatModify call.
 */
define("starMessage", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { key, star }) {
    if (!key?.id || !key?.remoteJid) {
      return fail("INVALID_MESSAGE_KEY", "Need the full message key to star a message.");
    }
    try {
      await sock.chatModify(
        { star: { messages: [{ id: key.id, fromMe: !!key.fromMe }], star: star !== false } },
        key.remoteJid
      );
      return ok({ key, starred: star !== false });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/** Reacts to a message with an emoji — real Baileys reaction message. Pass an empty string to remove a reaction. */
define("sendReaction", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { key, emoji }) {
    if (!key?.id || !key?.remoteJid) {
      return fail("INVALID_MESSAGE_KEY", "Need the full message key to react to a message.");
    }
    try {
      await sock.sendMessage(key.remoteJid, { react: { text: emoji || "", key } });
      return ok({ key, emoji: emoji || null });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

// ---- Whole-chat actions (pin chat to top / archive / mute / read state) ----
// All real chatModify calls — this is the chat-list-level sibling of the
// message-level pin above, not a duplicate of it.

define("pinChat", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, pin }) {
    try {
      await sock.chatModify({ pin: pin !== false }, jid);
      return ok({ jid, pinned: pin !== false });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("archiveChat", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, archive }) {
    try {
      await sock.chatModify({ archive: archive !== false, lastMessages: [] }, jid);
      return ok({ jid, archived: archive !== false });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * durationMs omitted/null = mute "always" (Baileys' documented convention:
 * pass a fixed future timestamp in ms for a timed mute, or null to mute
 * indefinitely). unmute is always `{ mute: null }`.
 */
define("muteChat", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, durationMs }) {
    try {
      const muteUntil = durationMs ? Date.now() + durationMs : null;
      await sock.chatModify({ mute: muteUntil }, jid);
      return ok({ jid, muted: true, muteUntil });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("unmuteChat", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid }) {
    try {
      await sock.chatModify({ mute: null }, jid);
      return ok({ jid, muted: false });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("markChatRead", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid }) {
    try {
      await sock.chatModify({ markRead: true, lastMessages: [] }, jid);
      return ok({ jid, read: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("markChatUnread", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid }) {
    try {
      await sock.chatModify({ markRead: false, lastMessages: [] }, jid);
      return ok({ jid, read: false });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Resolves "the last message in <group>" to a real, full message key using
 * src/owner/lastMessageStore.js — the only honest way to get a key for a
 * message the owner references from a private DM rather than by directly
 * replying to it inside the group.
 */
define("getLastGroupMessage", {
  permission: PERMISSION.OWNER,
  async run(_ctx, { groupJid }) {
    const { getLastMessage } = require("../../owner/lastMessageStore");
    const entry = getLastMessage(groupJid);
    if (!entry) return fail("NO_TRACKED_MESSAGE", "I haven't seen a message in that group since I've been online.");
    return ok(entry);
  },
});

/**
 * Real sock.chatModify({ delete: true, lastMessages: [...] }, jid) —
 * clears the chat's history on this account. This does NOT delete
 * messages for the other side, same as WhatsApp's own "delete chat" UI
 * button — it's a local clear, not a remote takeback (that's
 * deleteMessage in moderation.js, message-by-message, "for everyone").
 * Marked HIGH risk since it's not meaningfully undoable.
 */
define("deleteChat", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { jid }) {
    if (!jid) return fail("MISSING_FIELDS", "Need a chat to delete.");
    try {
      await sock.chatModify({ delete: true, lastMessages: [] }, jid);
      return ok({ jid, deleted: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

module.exports = {};
