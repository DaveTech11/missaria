// src/ai/tools/contacts.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");
const localStore = require("../../owner/localStore");

function toJid(numberOrJid) {
  if (!numberOrJid) return null;
  if (numberOrJid.includes("@")) return numberOrJid;
  const digits = numberOrJid.replace(/[^0-9]/g, "");
  return digits.length >= 8 ? `${digits}@s.whatsapp.net` : null;
}

/**
 * Real Baileys call — sock.onWhatsApp(number) queries WhatsApp's own
 * server to check registration, it doesn't guess from JID shape. Returns
 * an array because Baileys' own API does (a single number in, a single
 * or empty array out), so this is a thin pass-through, not a redesign.
 */
define("checkHasWhatsApp", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { number }) {
    const digits = String(number || "").replace(/[^0-9]/g, "");
    if (digits.length < 8) return fail("INVALID_NUMBER", "Give me a full number, e.g. 15551234567.");
    try {
      const result = await sock.onWhatsApp(digits);
      const match = Array.isArray(result) ? result[0] : result;
      if (!match?.exists) return ok({ number: digits, hasWhatsApp: false, jid: null });
      return ok({ number: digits, hasWhatsApp: true, jid: match.jid });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Real sock.getBusinessProfile(jid) — only returns data for accounts that
 * are actually registered as WhatsApp Business. A regular personal
 * account returns null/undefined from Baileys itself; this tool reports
 * that honestly rather than fabricating an empty-but-present profile.
 */
define("getBusinessProfile", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, number }) {
    const target = toJid(jid || number);
    if (!target) return fail("INVALID_NUMBER", "Need a valid number or JID.");
    try {
      const profile = await sock.getBusinessProfile(target);
      if (!profile) return fail("NOT_A_BUSINESS_ACCOUNT", "That number isn't a WhatsApp Business account, or has no public profile.");
      return ok(profile);
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/** Real sock.fetchStatus(jid) — the contact's "about" text, not a status/story. */
define("getContactAbout", {
  permission: PERMISSION.OWNER,
  async run({ sock }, { jid, number }) {
    const target = toJid(jid || number);
    if (!target) return fail("INVALID_NUMBER", "Need a valid number or JID.");
    try {
      const status = await sock.fetchStatus(target);
      return ok({ jid: target, about: status?.status || null, setAt: status?.setAt || null });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Bot-local alias only — see src/owner/localStore.js for why this can't
 * be a real WhatsApp API call. Honest about that in what it returns too:
 * the tool name says "Alias", not "updateContactName", so nothing calling
 * it can mistake this for changing anything on WhatsApp's side.
 */
define("setContactAlias", {
  permission: PERMISSION.OWNER,
  async run(_ctx, { jid, number, alias }) {
    const target = toJid(jid || number);
    if (!target) return fail("INVALID_NUMBER", "Need a valid number or JID.");
    if (!alias || !alias.trim()) return fail("MISSING_FIELDS", "Need an alias to set.");
    localStore.setContactAlias(target, alias.trim());
    return ok({ jid: target, alias: alias.trim() });
  },
});

define("getContactAlias", {
  permission: PERMISSION.OWNER,
  async run(_ctx, { jid, number }) {
    const target = toJid(jid || number);
    if (!target) return fail("INVALID_NUMBER", "Need a valid number or JID.");
    return ok({ jid: target, alias: localStore.getContactAlias(target) });
  },
});

module.exports = {};
