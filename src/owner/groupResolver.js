// src/owner/groupResolver.js
//
// Section 6: smart group resolution. "Zuno" -> exact group JID, or a
// disambiguation list if more than one group matches, or a clear
// not-found message. Never silently picks between multiple matches.
//
// Uses sock.groupFetchAllParticipating() — the standard Baileys call that
// returns every group the connected account is currently in, keyed by JID,
// each with a `.subject` (group name). This only sees groups the PAIRED
// agent is actually a member of, which is the only set of groups it could
// ever act on anyway.

// Short-lived cache for groupFetchAllParticipating(). That call fetches
// full metadata (including every participant) for every group the bot is
// in, which used to be safe to call once per owner command. Now that
// non-owner group-admins can also reach this module from a DM (see
// listControllableGroups below), the same lookup can run once per
// incoming message, so a few seconds of caching avoids hammering Baileys
// on a burst of messages without meaningfully staling out group state.
const GROUP_CACHE_TTL_MS = 15 * 1000;
let groupCache = { at: 0, map: null };

async function fetchAllGroups(sock) {
  if (groupCache.map && Date.now() - groupCache.at < GROUP_CACHE_TTL_MS) {
    return groupCache.map;
  }
  const map = await sock.groupFetchAllParticipating();
  groupCache = { at: Date.now(), map };
  return map;
}

function normalizeJid(jid) {
  return String(jid || "").split(":")[0].split("@")[0] + "@s.whatsapp.net";
}

async function listGroups(sock) {
  const map = await fetchAllGroups(sock);
  return Object.values(map).map((g) => ({
    jid: g.id,
    subject: g.subject,
    participantCount: g.participants?.length ?? 0,
    isAnnounce: !!g.announce,
  }));
}

/**
 * Groups a given sender can actually be handed control of from a DM: the
 * bot must be an admin there (or it can't enforce anything anyway) AND the
 * sender must themselves be an admin there. Both checks are done directly
 * off the participants array groupFetchAllParticipating already returns —
 * no extra per-group fetches — but this is only ever used to decide
 * whether to even ATTEMPT natural-language handling for a non-owner
 * sender. It is never treated as the authorization for a specific action:
 * toolExecutor re-derives isSenderGroupAdmin against live group state,
 * for that exact group, right before every tool actually runs.
 */
async function listControllableGroups(sock, senderJid) {
  const map = await fetchAllGroups(sock);
  const botId = normalizeJid(sock?.user?.id);
  const target = normalizeJid(senderJid);
  const out = [];
  for (const g of Object.values(map)) {
    const participants = g.participants || [];
    const bot = participants.find((p) => normalizeJid(p.id) === botId);
    const sender = participants.find((p) => normalizeJid(p.id) === target);
    const botIsAdmin = Boolean(bot && (bot.admin === "admin" || bot.admin === "superadmin"));
    const senderIsAdmin = Boolean(sender && (sender.admin === "admin" || sender.admin === "superadmin"));
    if (botIsAdmin && senderIsAdmin) {
      out.push({ jid: g.id, subject: g.subject, participantCount: participants.length, isAnnounce: !!g.announce });
    }
  }
  return out;
}

/**
 * Resolves a free-text group name to one of:
 *  - { status: "found", group }
 *  - { status: "ambiguous", matches: [...] }
 *  - { status: "not_found" }
 */
async function resolveGroup(sock, query, candidateGroups) {
  const q = String(query || "").trim().toLowerCase();
  const groups = candidateGroups || (await listGroups(sock));

  if (!q) return { status: "not_found", groups: [] };

  // Exact match wins outright even if a looser substring also matches
  // something else (e.g. "Zuno" exactly matching "Zuno" over "Zuno Team").
  const exact = groups.filter((g) => g.subject?.toLowerCase() === q);
  if (exact.length === 1) return { status: "found", group: exact[0] };

  const partial = groups.filter((g) => g.subject?.toLowerCase().includes(q));
  if (partial.length === 1) return { status: "found", group: partial[0] };
  if (partial.length > 1) return { status: "ambiguous", matches: partial };
  if (exact.length > 1) return { status: "ambiguous", matches: exact };

  return { status: "not_found", groups: [] };
}

module.exports = { listGroups, resolveGroup, listControllableGroups };
