// src/ai/tools/privacy.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");

// WhatsApp's real accepted values differ slightly per setting — checked
// per-tool below rather than one shared list, so an invalid value for a
// given setting is caught before it's sent, not left for WhatsApp to
// reject.
const VISIBILITY = new Set(["all", "contacts", "contact_blacklist", "none"]);

function checkVisibility(value) {
  return VISIBILITY.has(value) ? null : fail("INVALID_VALUE", `value must be one of: ${Array.from(VISIBILITY).join(", ")}`);
}

define("updateLastSeenPrivacy", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { value }) {
    const invalid = checkVisibility(value);
    if (invalid) return invalid;
    try {
      await sock.updateLastSeenPrivacy(value);
      return ok({ setting: "lastSeen", value });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateOnlinePrivacy", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { value }) {
    // WhatsApp only supports "all" or "match_last_seen" for online status —
    // a narrower set than the other privacy fields.
    if (!["all", "match_last_seen"].includes(value)) {
      return fail("INVALID_VALUE", "value must be 'all' or 'match_last_seen'.");
    }
    try {
      await sock.updateOnlinePrivacy(value);
      return ok({ setting: "online", value });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateProfilePicturePrivacy", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { value }) {
    const invalid = checkVisibility(value);
    if (invalid) return invalid;
    try {
      await sock.updateProfilePicturePrivacy(value);
      return ok({ setting: "profilePicture", value });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateStatusPrivacy", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { value }) {
    const invalid = checkVisibility(value);
    if (invalid) return invalid;
    try {
      await sock.updateStatusPrivacy(value);
      return ok({ setting: "status", value });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateReadReceiptsPrivacy", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { value }) {
    // Read receipts (blue ticks) are only ever on or off account-wide —
    // WhatsApp doesn't offer a "contacts only" tier for this one.
    if (!["all", "none"].includes(value)) {
      return fail("INVALID_VALUE", "value must be 'all' (show read receipts) or 'none' (hide them).");
    }
    try {
      await sock.updateReadReceiptsPrivacy(value);
      return ok({ setting: "readReceipts", value });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateGroupsAddPrivacy", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { value }) {
    // Who can add this account to a group without an invite prompt first —
    // "contact_blacklist" isn't offered here by WhatsApp for this setting.
    if (!["all", "contacts"].includes(value)) {
      return fail("INVALID_VALUE", "value must be 'all' or 'contacts'.");
    }
    try {
      await sock.updateGroupsAddPrivacy(value);
      return ok({ setting: "groupsAdd", value });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

module.exports = {};
