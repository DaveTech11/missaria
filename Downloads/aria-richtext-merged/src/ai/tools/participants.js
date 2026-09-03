// src/ai/tools/participants.js
'use strict';

const { ok, fail, PERMISSION, define, requireBotAdmin } = require("./_shared");

async function updateParticipant(sock, groupJid, participantJid, action) {
  const denied = await requireBotAdmin(sock, groupJid, "do that");
  if (denied) return denied;
  try {
    const result = await sock.groupParticipantsUpdate(groupJid, [participantJid], action);
    const entry = Array.isArray(result) ? result[0] : result;
    if (entry && entry.status && entry.status !== "200") {
      return fail("WHATSAPP_REJECTED", `WhatsApp rejected the operation (status ${entry.status}).`);
    }
    return ok({ groupJid, participantJid, action });
  } catch (err) {
    return fail("WHATSAPP_ERROR", err.message);
  }
}

define("removeParticipant", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { groupJid, participantJid }) {
    return updateParticipant(sock, groupJid, participantJid, "remove");
  },
});

define("promoteParticipant", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { groupJid, participantJid }) {
    return updateParticipant(sock, groupJid, participantJid, "promote");
  },
});

define("demoteParticipant", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ sock }, { groupJid, participantJid }) {
    return updateParticipant(sock, groupJid, participantJid, "demote");
  },
});

define("addParticipant", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { groupJid, participantJid }) {
    return updateParticipant(sock, groupJid, participantJid, "add");
  },
});

module.exports = { updateParticipant };
