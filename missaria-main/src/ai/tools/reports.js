// src/ai/tools/reports.js
'use strict';

// A single "give me a report on X group" tool. Composes real data this
// codebase already computes elsewhere (getModerationStatus's fields +
// group metadata) into one payload, rather than inventing new metrics.
// GROUP_ADMIN, not OWNER — toolExecutor re-checks isSenderGroupAdmin for
// the specific groupJid passed in, live, every time this runs.

const { ok, fail, groupMgr, PERMISSION, define } = require("./_shared");

define("getGroupReport", {
  permission: PERMISSION.GROUP_ADMIN,
  async run({ sock }, { groupJid }) {
    const meta = await groupMgr.getGroupMetadata(sock, groupJid);
    if (!meta) return fail("GROUP_NOT_FOUND", "Couldn't find that group.");

    const isBotAdmin = await groupMgr.isBotGroupAdmin(sock, groupJid);
    const admins = meta.participants.filter((p) => p.admin === "admin" || p.admin === "superadmin");
    const warns = groupMgr.listWarns(groupJid);
    const totalWarnings = Object.values(warns).reduce((sum, n) => sum + n, 0);
    const warnedCount = Object.keys(warns).length;

    let antiLink = false;
    try {
      antiLink = require("../../../services/whatsappService").isAntilinkEnabled(groupJid);
    } catch (err) {
      // If antilink status can't be read for some reason, report it as
      // unknown-false rather than failing the whole report over it.
    }

    return ok({
      groupJid,
      subject: meta.subject,
      participantCount: meta.participants.length,
      adminCount: admins.length,
      botIsAdmin: isBotAdmin,
      antiLink,
      messagingRestricted: !!meta.announce,
      editInfoRestricted: !!meta.restrict,
      totalWarnings,
      warnedCount,
    });
  },
});
