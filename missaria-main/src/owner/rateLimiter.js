// src/owner/rateLimiter.js
//
// Spec §22: "owner operation rate limits... prevent AI loops, duplicate
// messages, infinite retries, accidental broadcasts." Message-REDELIVERY
// dedup already exists at the whatsappService.js level (router.
// alreadyHandled(m.key.id), checked before ownerRouter is ever reached) —
// this is a different concern: capping how many DISTINCT commands one
// owner can fire in a short window, regardless of message id, so a bug,
// loop, or accidental paste-flood can't hammer WhatsApp's API.

/** key -> array of timestamps (ms) of recent hits within the window */
const hits = new Map();

/**
 * Pure-ish (only side effect is recording the hit) sliding-window check.
 * Returns { allowed, retryAfterMs }.
 */
function checkAndRecord(key, maxPerWindow, windowMs, now = Date.now()) {
  const existing = (hits.get(key) || []).filter((t) => now - t < windowMs);

  if (existing.length >= maxPerWindow) {
    const oldest = existing[0];
    const retryAfterMs = windowMs - (now - oldest);
    hits.set(key, existing); // keep pruned list even when rejecting
    return { allowed: false, retryAfterMs };
  }

  existing.push(now);
  hits.set(key, existing);
  return { allowed: true, retryAfterMs: 0 };
}

function reset(key) {
  hits.delete(key);
}

module.exports = { checkAndRecord, reset };
