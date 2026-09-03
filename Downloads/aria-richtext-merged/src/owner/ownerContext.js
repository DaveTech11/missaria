// src/owner/ownerContext.js
//
// Short-term conversational memory (spec §7): "the group" / "that group"
// resolves to whatever the owner last mentioned. Extracted out of
// ownerRouter.js into its own module (matching the file layout the spec
// asked for in §27) so the memory/ tool category can read/clear this same
// live state for real, instead of a tool that reports on a disconnected
// copy of it.

const CONTEXT_TTL_MS = 10 * 60 * 1000;

/** ownerJid -> { groupJid, groupSubject, expiresAt } */
const contextByOwner = new Map();

function setGroupContext(ownerJid, groupJid, groupSubject, ttlMs = CONTEXT_TTL_MS) {
  contextByOwner.set(ownerJid, { groupJid, groupSubject, expiresAt: Date.now() + ttlMs });
}

function getGroupContext(ownerJid) {
  const c = contextByOwner.get(ownerJid);
  if (!c || c.expiresAt <= Date.now()) {
    if (c) contextByOwner.delete(ownerJid); // expired — clean it up rather than leaving a stale entry
    return null;
  }
  return c;
}

function clearContext(ownerJid) {
  contextByOwner.delete(ownerJid);
}

module.exports = { setGroupContext, getGroupContext, clearContext };
