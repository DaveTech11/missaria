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

async function listGroups(sock) {
  const map = await sock.groupFetchAllParticipating();
  return Object.values(map).map((g) => ({
    jid: g.id,
    subject: g.subject,
    participantCount: g.participants?.length ?? 0,
    isAnnounce: !!g.announce,
  }));
}

/**
 * Resolves a free-text group name to one of:
 *  - { status: "found", group }
 *  - { status: "ambiguous", matches: [...] }
 *  - { status: "not_found" }
 */
async function resolveGroup(sock, query) {
  const q = String(query || "").trim().toLowerCase();
  const groups = await listGroups(sock);

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

module.exports = { listGroups, resolveGroup };
