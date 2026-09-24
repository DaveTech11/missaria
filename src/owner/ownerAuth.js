// src/owner/ownerAuth.js
//
// Section 2 of the agent spec: owner authentication.
//
// IMPORTANT: this does NOT reimplement owner identity. That already lives
// in services/whatsappService.js as isOwnerJid()/getOwnerNumber()/
// setOwnerNumber(), backed by registry.json (set once via the existing
// /setowner-style flow — check whatsappService for how that's currently
// triggered before adding a new one). This file exists so every tool in
// src/ai/toolRegistry.js has ONE place to import "is this sender allowed"
// from, instead of each tool re-deriving it — and so nothing here ever
// trusts a claim made inside a message ("I am the owner") or a display name.

const whatsappService = require("../../services/whatsappService");

function normalizeJid(jid) {
  if (!jid) return null;
  // Baileys JIDs sometimes carry a ":device" suffix (e.g. "123:4@s.whatsapp.net").
  // Strip it so comparisons are stable across a sender's multiple linked devices.
  return String(jid).replace(/:\d+@/, "@");
}

/**
 * The only function anything should call to decide "is this the owner".
 * Backed entirely by services/whatsappService.isOwnerJid, which compares
 * against the configured OWNER_JID/owner number — never a display name,
 * never a self-declared claim inside the message text.
 */
function isOwner(jid) {
  return whatsappService.isOwnerJid(normalizeJid(jid));
}

/**
 * Permission levels per section 14/45 of the spec. Group-admin status is
 * NOT determined here — it's per-group and already computed correctly by
 * waGroupManager.isSenderGroupAdmin(sock, groupJid, senderJid), because
 * "admin" only makes sense in the context of one specific group. Callers
 * that need GROUP_ADMIN should check that directly for the group in
 * question rather than asking this module, which only knows OWNER vs USER.
 */
const PERMISSION = Object.freeze({
  OWNER: "OWNER",
  GROUP_ADMIN: "GROUP_ADMIN",
  USER: "USER",
});

function ownerLevel(jid) {
  return isOwner(jid) ? PERMISSION.OWNER : PERMISSION.USER;
}

module.exports = { isOwner, normalizeJid, PERMISSION, ownerLevel };
