// src/ai/tools/account.js
'use strict';

const { ok, fail, PERMISSION, define, requireBotAdmin } = require("./_shared");

const sharp = require("sharp");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

async function validateImageBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return fail("INVALID_IMAGE", "The supplied image is empty or invalid.");
  if (buffer.length > MAX_IMAGE_BYTES) return fail("IMAGE_TOO_LARGE", "The image must be 10 MB or smaller.");
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.format || !["jpeg", "jpg", "png", "webp"].includes(meta.format.toLowerCase())) return fail("UNSUPPORTED_IMAGE", "Unsupported image format.");
    return null;
  } catch {
    return fail("CORRUPT_IMAGE", "The image could not be decoded and appears to be corrupted.");
  }
}

/**
 * Reuses the exact same url/buffer resolution messaging.js's sendImage
 * already relies on, rather than a second copy of that logic.
 */
function resolveMediaSource({ url, buffer }) {
  if (url) return { url };
  if (buffer) return { url: undefined, buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, "base64") };
  return null;
}

// ---- Presence (typing / recording / online / offline) ----
// Real sock.sendPresenceUpdate — this is the same call WhatsApp Web itself
// uses to show "typing..." / "online" to a chat. `type` must be one of
// Baileys' own accepted values; anything else is rejected up front instead
// of being sent blind and failing silently downstream.
const PRESENCE_TYPES = new Set(["available", "unavailable", "composing", "recording", "paused"]);

define("setPresence", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, type }) {
    if (!PRESENCE_TYPES.has(type)) {
      return fail("INVALID_PRESENCE_TYPE", `type must be one of: ${Array.from(PRESENCE_TYPES).join(", ")}`);
    }
    try {
      // A jid is only required for the per-chat states (composing/
      // recording/paused) — "available"/"unavailable" are account-wide and
      // Baileys accepts them with no jid.
      if (jid) await sock.sendPresenceUpdate(type, jid);
      else await sock.sendPresenceUpdate(type);
      return ok({ jid: jid || null, type });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

// ---- Bot's own profile (name / about / picture) ----

define("updateProfileName", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { name }) {
    if (!name || !name.trim()) return fail("MISSING_FIELDS", "Need a name to set.");
    try {
      await sock.updateProfileName(name.trim());
      return ok({ name: name.trim() });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateProfileStatus", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { status }) {
    if (typeof status !== "string") return fail("MISSING_FIELDS", "Need an about/status text to set.");
    try {
      await sock.updateProfileStatus(status);
      return ok({ status });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Reserved as a HIGH_RISK action already (see
 * src/owner/confirmationManager.js's HIGH_RISK_ACTIONS — "
 * updateBotProfilePicture" was already listed there from the previous
 * round, before this tool existed to back it) — every account sees this
 * picture, so it goes through confirmation same as any other
 * account-wide, hard-to-quietly-undo change.
 *
 * Takes a url or buffer, exactly like sendImage — does not download or
 * invent media itself. "Use the photo the owner just sent" still isn't
 * wired (same documented gap as sendImage/sendDocument: extracting
 * attached media from the owner's own message needs
 * downloadMediaMessage, unverified against this Baileys fork).
 */
define("updateBotProfilePicture", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { url, buffer }) {
    const source = resolveMediaSource({ url, buffer });
    if (!source) return fail("NO_MEDIA_SOURCE", "No image url or buffer was provided.");
    if (source.buffer) { const invalid = await validateImageBuffer(source.buffer); if (invalid) return invalid; }
    try {
      await sock.updateProfilePicture(sock.user.id, source.buffer || { url: source.url });
      return ok({ updated: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("removeBotProfilePicture", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }) {
    try {
      await sock.removeProfilePicture(sock.user.id);
      return ok({ removed: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

// ---- Group picture — same media pattern, but group-scoped and requires
// the bot to actually be a group admin (Baileys/WhatsApp both enforce
// this server-side too; requireBotAdmin just gives a friendly message
// instead of a raw WhatsApp error). ----

define("updateGroupPicture", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { groupJid, url, buffer }) {
    const denied = await requireBotAdmin(sock, groupJid, "change the group picture");
    if (denied) return denied;
    const source = resolveMediaSource({ url, buffer });
    if (!source) return fail("NO_MEDIA_SOURCE", "No image url or buffer was provided.");
    if (source.buffer) { const invalid = await validateImageBuffer(source.buffer); if (invalid) return invalid; }
    try {
      await sock.updateProfilePicture(groupJid, source.buffer || { url: source.url });
      return ok({ groupJid, updated: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("removeGroupPicture", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const denied = await requireBotAdmin(sock, groupJid, "remove the group picture");
    if (denied) return denied;
    try {
      await sock.removeProfilePicture(groupJid);
      return ok({ groupJid, removed: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Posts a text or image status update ("story"). Real Baileys call —
 * status updates are just a message sent to the special broadcast jid
 * "status@broadcast", which is standard, documented Baileys/WhatsApp-Web
 * behavior, not something invented for this pass. `statusJidList`
 * (who's allowed to see it) is optional — omitted, it follows the
 * account's existing default status-privacy audience rather than this
 * tool guessing or overriding it.
 */
define("postStatusUpdate", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { text, url, buffer, caption, statusJidList }) {
    const source = resolveMediaSource({ url, buffer });
    const content = source
      ? { image: source.buffer || { url: source.url }, caption: caption || text || "" }
      : { text: text || "" };
    if (!source && !text) return fail("MISSING_FIELDS", "Need text or an image to post as a status.");
    try {
      const opts = statusJidList ? { statusJidList, broadcast: true } : { broadcast: true };
      const result = await sock.sendMessage("status@broadcast", content, opts);
      if (!result?.key?.id) return fail("SEND_UNVERIFIED", "WhatsApp did not confirm the status was posted.");
      return ok({ messageId: result.key.id });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

module.exports = {};
