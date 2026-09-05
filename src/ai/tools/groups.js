// src/ai/tools/groups.js
'use strict';

const { ok, fail, groupMgr, PERMISSION, define, requireBotAdmin } = require("./_shared");

define("getGroups", {
  permission: PERMISSION.OWNER,
  async run({ sock }) {
    try {
      const { listGroups } = require("../../owner/groupResolver");
      return ok(await listGroups(sock));
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("getGroupMetadata", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const meta = await groupMgr.getGroupMetadata(sock, groupJid);
    if (!meta) return fail("GROUP_NOT_FOUND", "Couldn't find that group.");
    return ok(meta);
  },
});

define("getGroupAdmins", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const meta = await groupMgr.getGroupMetadata(sock, groupJid);
    if (!meta) return fail("GROUP_NOT_FOUND", "Couldn't find that group.");
    return ok(meta.participants.filter((p) => p.admin === "admin" || p.admin === "superadmin"));
  },
});

define("getGroupParticipants", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const meta = await groupMgr.getGroupMetadata(sock, groupJid);
    if (!meta) return fail("GROUP_NOT_FOUND", "Couldn't find that group.");
    return ok(meta.participants);
  },
});

define("updateGroupSubject", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid, subject }) {
    const denied = await requireBotAdmin(sock, groupJid, "rename it");
    if (denied) return denied;
    try {
      await sock.groupUpdateSubject(groupJid, subject);
      return ok({ groupJid, subject });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("updateGroupDescription", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid, description }) {
    const denied = await requireBotAdmin(sock, groupJid, "change the description");
    if (denied) return denied;
    try {
      await sock.groupUpdateDescription(groupJid, description);
      return ok({ groupJid, description });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("getGroupInviteCode", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const denied = await requireBotAdmin(sock, groupJid, "fetch the invite");
    if (denied) return denied;
    try {
      const code = await sock.groupInviteCode(groupJid);
      return ok({ groupJid, inviteLink: `https://chat.whatsapp.com/${code}` });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

// Spec §35 lists getGroupInviteCode and getGroupInviteInfo as separate
// tools. This codebase's Baileys fork only exposes one real way to learn a
// group's own invite (groupInviteCode) — there's no separate "info about
// our own invite" call distinct from the code itself. Rather than invent a
// second tool that does nothing new, this is a thin, honest alias over the
// same real call, kept only so the spec's tool name resolves to something.
define("getGroupInviteInfo", {
  permission: PERMISSION.OWNER,
  async run(ctx, args) {
    const inviteCodeTool = require("../toolRegistry").get("getGroupInviteCode");
    return inviteCodeTool.run(ctx, args);
  },
});

define("revokeGroupInvite", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const denied = await requireBotAdmin(sock, groupJid, "revoke the invite");
    if (denied) return denied;
    try {
      const code = await sock.groupRevokeInvite(groupJid);
      return ok({ groupJid, newInviteLink: `https://chat.whatsapp.com/${code}` });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real, both fields backed directly by what Baileys' groupMetadata actually
 * returns (`.announce` = who can send messages, `.restrict` = who can edit
 * group info) — nothing here is inferred or guessed.
 */
define("getGroupSettings", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid }) {
    const meta = await groupMgr.getGroupMetadata(sock, groupJid);
    if (!meta) return fail("GROUP_NOT_FOUND", "Couldn't find that group.");
    return ok({
      groupJid,
      messagingRestrictedToAdmins: !!meta.announce,
      editInfoRestrictedToAdmins: !!meta.restrict,
    });
  },
});

/**
 * Real sock.groupCreate(subject, participants). `participants` is an
 * array of JIDs or bare numbers (normalized to JIDs below) — WhatsApp
 * requires at least one other participant to create a group at all, a
 * group of just the creator isn't a real WhatsApp state.
 */
define("createGroup", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { subject, participants }) {
    if (!subject || !subject.trim()) return fail("MISSING_FIELDS", "Need a group name.");
    const jids = (participants || [])
      .map((p) => (String(p).includes("@") ? p : `${String(p).replace(/[^0-9]/g, "")}@s.whatsapp.net`))
      .filter((jid) => jid.split("@")[0].length >= 8);
    if (jids.length === 0) return fail("MISSING_FIELDS", "Need at least one other participant's number to create a group.");
    try {
      const result = await sock.groupCreate(subject.trim(), jids);
      return ok({ groupJid: result.id, subject: subject.trim(), participants: jids });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real sock.groupAcceptInvite(code) — accepts an invite code (the part
 * after chat.whatsapp.com/ in a real invite link), not a group name or
 * JID. The tool extracts the code itself if handed a full URL, so a
 * caller doesn't have to pre-parse it.
 */
define("joinGroupByInvite", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { inviteLink }) {
    if (!inviteLink) return fail("MISSING_FIELDS", "Need an invite link or code.");
    const codeMatch = String(inviteLink).match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    const code = codeMatch ? codeMatch[1] : String(inviteLink).trim();
    try {
      const groupJid = await sock.groupAcceptInvite(code);
      return ok({ groupJid });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

define("leaveGroup", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { groupJid }) {
    try {
      await sock.groupLeave(groupJid);
      return ok({ groupJid, left: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real sock.groupToggleEphemeral(jid, seconds) — WhatsApp only accepts
 * four real values: 0 (off), 86400 (24h), 604800 (7d), 7776000 (90d).
 * Anything else is rejected up front rather than sent and silently
 * ignored by WhatsApp's server.
 */
const EPHEMERAL_DURATIONS = { off: 0, day: 86400, week: 604800, "90days": 7776000 };

define("setDisappearingMessages", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid, duration }) {
    const denied = await requireBotAdmin(sock, groupJid, "change disappearing messages");
    if (denied) return denied;
    const seconds = EPHEMERAL_DURATIONS[duration];
    if (seconds === undefined) return fail("INVALID_DURATION", `duration must be one of: ${Object.keys(EPHEMERAL_DURATIONS).join(", ")}`);
    try {
      await sock.groupToggleEphemeral(groupJid, seconds);
      return ok({ groupJid, duration, seconds });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Composes the two real per-group settings this library actually exposes
 * (see setGroupLocked / setEditInfoRestricted in moderation.js) into one
 * call, for when an owner wants to change both at once. Only touches a
 * setting if it's explicitly present in `settings` — omitted fields are
 * left alone rather than reset to a default.
 */
define("updateGroupSettings", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { groupJid, settings }) {
    const denied = await requireBotAdmin(sock, groupJid, "change group settings");
    if (denied) return denied;
    const applied = {};
    try {
      if (typeof settings.messagingRestrictedToAdmins === "boolean") {
        await groupMgr.setGroupLocked(sock, groupJid, settings.messagingRestrictedToAdmins);
        applied.messagingRestrictedToAdmins = settings.messagingRestrictedToAdmins;
      }
      if (typeof settings.editInfoRestrictedToAdmins === "boolean") {
        await sock.groupSettingUpdate(groupJid, settings.editInfoRestrictedToAdmins ? "locked" : "unlocked");
        applied.editInfoRestrictedToAdmins = settings.editInfoRestrictedToAdmins;
      }
      return ok({ groupJid, applied });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});
