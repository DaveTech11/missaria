// src/owner/confirmationManager.js
//
// Section 8: centralized confirmation engine for medium/high-risk tools.
// A pending confirmation is bound to (ownerJid, action, target) and expires;
// a stray "yes" can never confirm a DIFFERENT pending action than the one
// most recently proposed to that specific owner.

const DEFAULT_TTL_MS = 60 * 1000;

/** ownerJid -> { action, target, payload, resolve, expiresAt } */
const pending = new Map();

/**
 * Risk classification per section 8. Tools consult this to decide whether
 * to route through requestConfirmation() before executing.
 */
const RISK = Object.freeze({ LOW: "LOW", HIGH: "HIGH" });

const HIGH_RISK_ACTIONS = new Set([
  "removeParticipant",
  "banParticipant",
  "promoteParticipant",
  "demoteParticipant",
  "blockUser",
  "updateGroupSettings",
  "setGroupLocked",
  "setEditInfoRestricted",
  "restartBot",
  "bulkOperation",
  "updateBotProfilePicture",
  "updateGroupPicture",
  "postStatusUpdate", // public — visible to the whole status audience, not reversible once seen
  "leaveGroup", // irreversible without a new invite
  "createGroup", // creates something real and visible to other people immediately
  "deleteChat", // clears history, not meaningfully undoable
  "deleteMessage", // deletes for everyone, not just locally — pre-existing tool, never wired into this set until now
]);

function riskOf(action) {
  return HIGH_RISK_ACTIONS.has(action) ? RISK.HIGH : RISK.LOW;
}

/**
 * Registers a pending confirmation for one owner. Returns the prompt text
 * to send them. `payload` is whatever the eventual executor needs — the
 * caller (ownerRouter) supplies a `run()` closure via `execute` below.
 */
function propose(ownerJid, action, targetLabel, payload, promptText, ttlMs = DEFAULT_TTL_MS) {
  pending.set(ownerJid, {
    action,
    targetLabel,
    payload,
    expiresAt: Date.now() + ttlMs,
  });
  return promptText;
}

function getPending(ownerJid) {
  const p = pending.get(ownerJid);
  if (!p) return null;
  if (p.expiresAt <= Date.now()) {
    pending.delete(ownerJid);
    return null;
  }
  return p;
}

function clear(ownerJid) {
  pending.delete(ownerJid);
}

function isAffirmative(text) {
  return /^\s*(yes|y|confirm|do it|go ahead)\s*$/i.test(String(text || ""));
}

function isNegative(text) {
  return /^\s*(no|n|cancel|nevermind|never mind|stop)\s*$/i.test(String(text || ""));
}

module.exports = { RISK, riskOf, propose, getPending, clear, isAffirmative, isNegative };
