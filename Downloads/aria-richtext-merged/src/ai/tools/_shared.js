// src/ai/tools/_shared.js
'use strict';

function ok(data) {
  return { success: true, data, error: null };
}
function fail(code, message) {
  return { success: false, data: null, error: { code, message } };
}

const groupMgr = require("../../../services/waGroupManager");
const { PERMISSION } = require("../../owner/ownerAuth");
const { define } = require("../toolRegistry");

async function requireBotAdmin(sock, groupJid, actionDescription) {
  const isBotAdmin = await groupMgr.isBotGroupAdmin(sock, groupJid);
  if (!isBotAdmin) return fail("BOT_NOT_ADMIN", `I'm not an admin in that group, so I can't ${actionDescription}.`);
  return null; // null = the check passed
}

module.exports = { ok, fail, groupMgr, PERMISSION, define, requireBotAdmin };
