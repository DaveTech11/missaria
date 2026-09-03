// src/ai/tools/calls.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");
const localStore = require("../../owner/localStore");

/**
 * Real Baileys call — sock.rejectCall(callId, callFrom) sends the actual
 * WhatsApp call-reject signal. Needs both the call's ID and the caller's
 * JID (from the 'call' event payload), not just one — same reasoning as
 * deleteMessage/pinMessage needing a full key rather than a bare ID.
 */
define("rejectCall", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { callId, callFrom }) {
    if (!callId || !callFrom) return fail("INVALID_CALL", "Need both the call ID and the caller's JID to reject a call.");
    try {
      await sock.rejectCall(callId, callFrom);
      return ok({ callId, callFrom, rejected: true });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * DND is bot-local state, not a WhatsApp server setting — WhatsApp has no
 * "do not disturb, auto-reject calls" API. What's real: this flag is read
 * by the 'call' event listener wired into attachAutoReply
 * (services/whatsappService.js), which calls the real rejectCall above
 * for every incoming call while DND is on. The setting itself is stored
 * state; the enforcement of it is a real, live WhatsApp action.
 */
define("setDoNotDisturb", {
  permission: PERMISSION.OWNER,
  async run(_ctx, { enabled }) {
    localStore.setDnd(!!enabled);
    return ok({ dnd: !!enabled });
  },
});

define("getDoNotDisturb", {
  permission: PERMISSION.OWNER,
  async run() {
    return ok({ dnd: localStore.isDndEnabled() });
  },
});

module.exports = {};
