// src/ai/tools/memory.js
'use strict';

const { ok, PERMISSION, define } = require("./_shared");
const ownerContextStore = require("../../owner/ownerContext");

define("getOwnerContext", {
  permission: PERMISSION.OWNER,
  async run({ senderJid }) {
    const ctx = ownerContextStore.getGroupContext(senderJid);
    return ok(ctx ? { groupJid: ctx.groupJid, groupSubject: ctx.groupSubject, expiresAt: ctx.expiresAt } : null);
  },
});

define("clearOwnerContext", {
  permission: PERMISSION.OWNER,
  async run({ senderJid }) {
    ownerContextStore.clearContext(senderJid);
    return ok({ cleared: true });
  },
});
