// src/owner/ownerRouter.js
//
// Owner-only natural-language front door (spec sections 1, 5, 6, 8, 16).
// This does NOT replace services/waCommandRouter.js's prefixed "." commands
// — those keep working exactly as before for everything already ported
// from Telegram. This module is additive: it only runs for messages sent
// privately by the confirmed owner (isOwner(senderJid) === true), and only
// recognizes the owner-agent vocabulary below. Anything it doesn't
// recognize falls through untouched to whatever already handles the
// message (waCommandRouter / conversational AI reply).
//
// INTEGRATION POINT (not wired automatically — see the summary message for
// why): call `ownerRouter.tryHandle({ sock, msg, text })` from inside
// services/whatsappService.js's attachAutoReply, in the branch that already
// knows `isOwner` and the message is a private DM (not a group message).
// If it returns true, the message was handled; stop further processing —
// exactly the same convention waCommandRouter.tryHandle already uses.

const { isOwner } = require("./ownerAuth");
const { resolveGroup, listGroups } = require("./groupResolver");
const confirm = require("./confirmationManager");
const toolExecutor = require("../ai/toolExecutor");
const scheduler = require("../automation/scheduler");
const { parseReminderRequest } = require("../automation/scheduleParser");
const { buildReportText } = require("../ai/reportFormatter");
const { findMediaMessage, downloadAttachedMedia } = require("./mediaExtractor");
const { getQuotedMessageKey } = require("./replyContext");
const { checkAndRecord } = require("./rateLimiter");
const bulk = require("./bulkOperations");
const knowledgeStore = require("./knowledgeStore");
const usageAnalytics = require("./usageAnalytics");
const ownerContextStore = require("./ownerContext");

function setContext(ownerJid, groupJid, groupSubject) {
  ownerContextStore.setGroupContext(ownerJid, groupJid, groupSubject);
}
function getContextGroup(ownerJid) {
  return ownerContextStore.getGroupContext(ownerJid);
}

function strip(text, ...res) {
  let out = text;
  for (const re of res) out = out.replace(re, " ");
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Extracts a group-name phrase from things like "in Zuno", "to Zuno",
 * "for Zuno", "the Zuno group", or a trailing "in <thatgroup>" — falling
 * back to short-term context ("that group" / no group mentioned at all).
 */
function extractGroupQuery(text) {
  const lower = text.toLowerCase();
  if (/\bthis group\b|\bthat group\b|\bthere\b/.test(lower)) return { useContext: true };
  const m = text.match(/\b(?:in|to|for|from|of)\s+(?:the\s+)?([a-z0-9][\w .'-]{1,40}?)(?:\s+group)?\s*$/i)
    || text.match(/\b(?:in|to|for|from|of)\s+(?:the\s+)?([a-z0-9][\w .'-]{1,40})/i);
  if (m) return { query: m[1].trim() };
  return null;
}

async function resolveGroupOrAsk(sock, chatJid, ownerJid, text) {
  const extracted = extractGroupQuery(text);
  if (extracted?.useContext) {
    const ctx = getContextGroup(ownerJid);
    if (ctx) return { jid: ctx.groupJid, subject: ctx.groupSubject };
    await sock.sendMessage(chatJid, { text: "Which group do you mean? I don't have one in context yet." });
    return null;
  }
  if (!extracted) {
    const ctx = getContextGroup(ownerJid);
    if (ctx) return { jid: ctx.groupJid, subject: ctx.groupSubject };
    await sock.sendMessage(chatJid, { text: "Which group? Tell me its name, e.g. \"in Zuno\"." });
    return null;
  }
  const result = await resolveGroup(sock, extracted.query);
  if (result.status === "found") {
    setContext(ownerJid, result.group.jid, result.group.subject);
    return { jid: result.group.jid, subject: result.group.subject };
  }
  if (result.status === "ambiguous") {
    const list = result.matches.map((g, i) => `${i + 1}. ${g.subject}`).join("\n");
    await sock.sendMessage(chatJid, { text: `I found ${result.matches.length} groups matching "${extracted.query}":\n${list}\n\nWhich one should I use?` });
    return null;
  }
  await sock.sendMessage(chatJid, { text: `❌ I couldn't find a group matching "${extracted.query}".` });
  return null;
}

function findParticipantByNameOrNumber(participants, query) {
  const digits = query.replace(/[^0-9]/g, "");
  if (digits.length >= 8 && digits === query.replace(/[+\s]/g, "")) {
    const jid = digits + "@s.whatsapp.net";
    return participants.filter((p) => p.id.startsWith(digits));
  }
  const q = query.toLowerCase();
  return participants.filter((p) => (p.name || p.notify || "").toLowerCase().includes(q));
}

const COMPOUND_SPLIT_RE = /\s*,\s*(?:and\s+)?|\s+and\s+/i;

/**
 * Classifies one clause of a compound instruction into a recognized
 * action, or null if it's not one of the four supported types. A single
 * null anywhere in a message's clauses means the WHOLE message is treated
 * as not-compound (see tryHandleCompound) — never silently drops or
 * guesses at a clause that isn't confidently understood.
 */
function classifyClause(clause) {
  const lower = clause.toLowerCase().trim();
  if (!lower) return null;

  if (/\b(find|open)\b/.test(lower)) {
    const query = clause.replace(/\b(find|open)\b/i, "").replace(/\bgroup\b/i, "").trim();
    return query ? { type: "findGroup", query } : null;
  }

  const antilinkMatch = lower.match(/\banti-?link\b\s*(on|off)?/);
  if (antilinkMatch) return { type: "antilink", enabled: antilinkMatch[1] !== "off" };

  if (/\block\b/.test(lower) && !/\bunlock\b/.test(lower)) return { type: "lock", locked: true };
  if (/\bunlock\b/.test(lower)) return { type: "lock", locked: false };

  const messageMatch = clause.match(/\b(?:tell|message|send)\b\s+(?:the\s+)?(?:admins?|group|them)\b\s*(?:that\s+|saying\s+|:\s*)?(.+)/i);
  if (messageMatch && messageMatch[1].trim()) {
    return { type: "message", toAdmins: /\badmins?\b/i.test(clause), body: messageMatch[1].trim() };
  }

  return null;
}

/**
 * Spec §9: multi-step compound requests. Deliberately scoped — see the
 * comment at this function's call site in tryHandle for why only these
 * four clause types are supported. Returns true if it handled the message
 * as a compound instruction (including asking for clarification), false
 * if the message isn't a recognized compound instruction at all (falls
 * through to the normal single-command sections, unaffected).
 */
async function tryHandleCompound({ sock, chatJid, senderJid, text }) {
  const rawClauses = text.split(COMPOUND_SPLIT_RE).map((c) => c.trim()).filter(Boolean);
  if (rawClauses.length < 2) return false; // just one instruction — not compound

  const classified = rawClauses.map(classifyClause);
  if (classified.some((c) => c === null)) return false; // a clause I can't confidently parse — don't guess, let normal flow try the whole message as one instruction (which will likely just go unrecognized, which is the honest outcome)

  // Resolve the group: an explicit "find X" clause, or fall back to
  // short-term context from an earlier message.
  let group = null;
  const findClause = classified.find((c) => c.type === "findGroup");
  if (findClause) {
    const resolved = await resolveGroup(sock, findClause.query);
    if (resolved.status === "found") {
      setContext(senderJid, resolved.group.jid, resolved.group.subject);
      group = { jid: resolved.group.jid, subject: resolved.group.subject };
    } else if (resolved.status === "ambiguous") {
      const list = resolved.matches.map((g, i) => `${i + 1}. ${g.subject}`).join("\n");
      await sock.sendMessage(chatJid, { text: `I found ${resolved.matches.length} groups matching "${findClause.query}":\n${list}\n\nWhich one should I use?` });
      return true;
    } else {
      await sock.sendMessage(chatJid, { text: `❌ I couldn't find a group matching "${findClause.query}".` });
      return true;
    }
  } else {
    const ctx = getContextGroup(senderJid);
    if (ctx) group = { jid: ctx.groupJid, subject: ctx.groupSubject };
  }

  if (!group) {
    await sock.sendMessage(chatJid, { text: 'Which group are these steps for? Start with something like "find Zuno".' });
    return true;
  }

  const botOwnJid = sock?.user?.id ? String(sock.user.id).replace(/:\d+@/, "@") : null;
  const stepResults = [];

  for (const clause of classified) {
    if (clause.type === "findGroup") continue; // context-setting, not a separate reportable operation

    if (clause.type === "antilink") {
      const result = await toolExecutor.execute("setAntiLink", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid, enabled: clause.enabled });
      stepResults.push({ label: `Anti-link ${clause.enabled ? "enabled" : "disabled"}`, success: result.success, error: result.error });
      continue;
    }

    if (clause.type === "lock") {
      const result = await toolExecutor.execute("setGroupLocked", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid, locked: clause.locked });
      stepResults.push({ label: `Group ${clause.locked ? "locked" : "unlocked"}`, success: result.success, error: result.error });
      continue;
    }

    if (clause.type === "message") {
      if (!clause.toAdmins) {
        const result = await toolExecutor.execute("sendMessage", { sock, senderJid, groupJid: group.jid }, { jid: group.jid, text: clause.body });
        stepResults.push({ label: "Message sent to the group", success: result.success, error: result.error });
        continue;
      }
      // "message the admins" — DMs each admin individually, since that's
      // the literal ask (distinct from messaging the group itself, which
      // the non-admin branch above already covers).
      const adminsResult = await toolExecutor.execute("getGroupAdmins", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid });
      if (!adminsResult.success || adminsResult.data.length === 0) {
        stepResults.push({ label: "Notify admins", success: false, error: { message: "couldn't retrieve the group's admin list" } });
        continue;
      }
      const adminJids = adminsResult.data.map((p) => p.id).filter((id) => id !== botOwnJid);
      let sentCount = 0;
      for (const adminJid of adminJids) {
        const r = await toolExecutor.execute("sendMessage", { sock, senderJid, groupJid: group.jid }, { jid: adminJid, text: clause.body });
        if (r.success) sentCount++;
      }
      stepResults.push({
        label: `Notified ${sentCount}/${adminJids.length} admin(s)`,
        success: adminJids.length > 0 && sentCount === adminJids.length,
        error: sentCount < adminJids.length ? { message: "one or more admins couldn't be reached" } : null,
      });
    }
  }

  if (stepResults.length === 0) {
    await sock.sendMessage(chatJid, { text: `Found ${group.subject}.` });
    return true;
  }

  const successCount = stepResults.filter((s) => s.success).length;
  const lines = [`Completed ${successCount}/${stepResults.length} operations.`];
  for (const s of stepResults) {
    if (s.success) {
      lines.push(`✅ ${s.label}.`);
    } else {
      const errMsg = (s.error?.message || "").replace(/\.$/, "");
      lines.push(`❌ ${s.label} failed${errMsg ? ": " + errMsg : ""}.`);
    }
  }
  await sock.sendMessage(chatJid, { text: lines.join("\n") });
  return true;
}

/**
 * Public entry point — wraps the real logic (tryHandleImpl) so usage gets
 * recorded exactly once per message regardless of which of tryHandleImpl's
 * many return points fired, without threading analytics through every
 * one of them individually.
 */
async function tryHandle(params) {
  const handled = await tryHandleImpl(params);
  try {
    usageAnalytics.recordCommand({ senderJid: params.senderJid, text: params.text, handled });
  } catch (err) {
    console.error("usageAnalytics.recordCommand failed:", err.message);
  }
  return handled;
}

/**
 * Main entry point. Returns true if the message was handled as an owner
 * command (whether it succeeded, failed, or is now awaiting confirmation).
 * Returns false if it wasn't recognized, so the caller can fall through.
 */
async function tryHandleImpl({ sock, chatJid, senderJid, text, agentId, msg }) {
  if (!isOwner(senderJid)) return false; // hard stop — never trust anything else
  const t = String(text || "").trim();
  if (!t) return false;

  // Rate limit: caps distinct owner-agent commands per owner, independent
  // of the message-redelivery dedup whatsappService.js already applies
  // before this function is ever reached. 20/minute is generous for real
  // usage but stops a loop/bug/flood from hammering WhatsApp's API.
  const RATE_LIMIT_MAX = 20;
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const rateCheck = checkAndRecord(senderJid, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rateCheck.allowed) {
    const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
    await sock.sendMessage(chatJid, { text: `⏳ Slow down a bit — try again in ${retrySeconds}s.` });
    return true;
  }

  // 1. Resolve any pending confirmation first.
  const pending = confirm.getPending(senderJid);
  if (pending) {
    if (confirm.isAffirmative(t)) {
      confirm.clear(senderJid);
      if (pending.action === "bulkSetAntiLink") {
        const results = await bulk.applyToGroups({
          sock, senderJid,
          groups: pending.payload.groups,
          toolName: "setAntiLink",
          buildArgs: (g) => ({ groupJid: g.jid, enabled: pending.payload.enabled }),
        });
        await sock.sendMessage(chatJid, { text: bulk.summarizeResults(results) });
        return true;
      }
      const result = await toolExecutor.execute(pending.action, { sock, senderJid, groupJid: pending.payload.groupJid }, pending.payload);
      await sock.sendMessage(chatJid, { text: formatResult(pending.action, result, pending.targetLabel) });
      return true;
    }
    if (confirm.isNegative(t)) {
      confirm.clear(senderJid);
      await sock.sendMessage(chatJid, { text: "Okay, cancelled." });
      return true;
    }
    // else: fall through, a new command overrides the stale pending one
  }

  // 1b. Multi-step compound commands — spec §9. Deliberately SCOPED, not
  // general: only recognizes chains of (find/open a group) + (anti-link
  // on/off) + (lock/unlock) + (message the group/admins), which covers the
  // spec's own example exactly. A clause that doesn't match one of these
  // four patterns makes the whole message NOT compound (falls through
  // untouched to the normal single-command sections below) rather than
  // silently dropping or misinterpreting a clause I can't confidently
  // parse. All four actions here are already LOW-risk standalone (no
  // confirmation needed even outside a compound chain), so this doesn't
  // introduce a way to skip confirmation on something risky.
  const compoundResult = await tryHandleCompound({ sock, chatJid, senderJid, text: t });
  if (compoundResult) return true;

  const lower = t.toLowerCase();

  // 1c. Knowledge base — "remember that X" / "forget X" / "what have you
  // learned". This is the real mechanism behind commands/whatsapp.js's
  // replyFromAI() actually changing behavior over time — not cosmetic.
  const rememberMatch = t.match(/\b(?:remember|learn|note)\s+(?:that\s+)?(.+)/i);
  if (rememberMatch && rememberMatch[1].trim()) {
    const result = knowledgeStore.addEntry(senderJid, rememberMatch[1].trim());
    await sock.sendMessage(chatJid, {
      text: result.success ? "🧠 Got it, I'll remember that." : `❌ ${result.error}`,
    });
    return true;
  }

  if (/\b(what have you learned|what do you know|show what i'?ve taught you|what have i taught you)\b/.test(lower)) {
    const entries = knowledgeStore.listEntries(senderJid);
    if (entries.length === 0) {
      await sock.sendMessage(chatJid, { text: 'Nothing yet. Say "remember that <fact>" to teach me something.' });
    } else {
      const list = entries.map((e, i) => `${i + 1}. ${e.text}`).join("\n");
      await sock.sendMessage(chatJid, { text: `🧠 What I've learned:\n${list}` });
    }
    return true;
  }

  const forgetMatch = t.match(/\bforget\s+(?:that\s+)?(.+)/i);
  if (forgetMatch && forgetMatch[1].trim()) {
    const query = forgetMatch[1].trim();
    const entries = knowledgeStore.listEntries(senderJid);
    // Accept either a number (matching the list shown above) or enough of
    // the actual text to uniquely identify one entry — never guesses
    // between multiple partial-text matches.
    let target = /^\d+$/.test(query) ? query : null;
    if (!target) {
      const matches = entries.filter((e) => e.text.toLowerCase().includes(query.toLowerCase()));
      if (matches.length === 1) target = matches[0].id;
      else if (matches.length > 1) {
        await sock.sendMessage(chatJid, { text: `Multiple learned facts match "${query}" — say "what have you learned" and forget by number instead.` });
        return true;
      }
    }
    const result = target ? knowledgeStore.removeEntry(senderJid, target) : { success: false };
    await sock.sendMessage(chatJid, { text: result.success ? "🧠 Forgotten." : `Couldn't find anything matching "${query}".` });
    return true;
  }

  // 1d. Usage analytics — real counts, not a decorative "learning" meter.
  if (/\b(usage (stats|analytics)|what commands (do people|are people) (try|using))\b/.test(lower)) {
    const stats = usageAnalytics.getStats();
    const lines = [
      "📊 Usage analytics",
      `Commands handled: ${stats.handledCommands}/${stats.totalCommands}`,
      `AI replies — owner: ${stats.aiRepliesOwner}, others: ${stats.aiRepliesOther}`,
    ];
    if (stats.recentUnhandled.length > 0) {
      lines.push("", "Recent unrecognized attempts:");
      lines.push(...stats.recentUnhandled.slice(-10).map((u) => `- "${u.text}"`));
    }
    await sock.sendMessage(chatJid, { text: lines.join("\n") });
    return true;
  }

  // 2. Moderation status — checked before the generic "status" word below,
  // since "moderation status" would otherwise match that first.
  if (/\bmoderation status\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("getModerationStatus", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid });
    await sock.sendMessage(chatJid, { text: formatResult("getModerationStatus", result, group.subject) });
    return true;
  }

  // 2c. Diagnostics / status
  if (/\b(status|are you online|diagnostics|run diagnostics)\b/.test(lower)) {
    const result = await toolExecutor.execute("getBotStatus", { sock, senderJid });
    await sock.sendMessage(chatJid, { text: formatResult("getBotStatus", result) });
    return true;
  }

  // 2b. Restart
  if (/\brestart\b/.test(lower) && !/\bdon'?t\b/.test(lower)) {
    return proposeOrRun(sock, chatJid, senderJid, "restartBot", { chatJid }, "Restart Miss Aria?", "Miss Aria");
  }

  // 3. List groups
  if (/\b(list|show|my)\b.*\bgroups\b/.test(lower) || /\bwhich groups\b/.test(lower)) {
    const result = await toolExecutor.execute("getGroups", { sock, senderJid });
    await sock.sendMessage(chatJid, { text: formatResult("getGroups", result) });
    return true;
  }

  // 4. Group admins — excludes promote/demote (separate handler), "edit
  // group info" phrasing, and bulk anti-link phrasing (handled in 4b),
  // all of which mention "admin(s)" but mean a different tool.
  if (
    /\badmins?\b/.test(lower) &&
    !/\bpromote|demote\b/.test(lower) &&
    !/\bedit(?:ing)?\s+(?:the\s+)?group info\b/.test(lower) &&
    !/\banti-?link\b/.test(lower)
  ) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("getGroupAdmins", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid });
    await sock.sendMessage(chatJid, { text: formatResult("getGroupAdmins", result, group.subject) });
    return true;
  }

  // 4b. Bulk anti-link — "turn on anti-link in all groups where I'm admin",
  // "enable anti-link in every group I'm admin in". Checked BEFORE the
  // single-group anti-link toggle below, since it requires "all"/"every" +
  // "admin" together — specific enough not to misfire on an ordinary
  // single-group request.
  if (/\banti-?link\b/.test(lower) && /\b(all|every)\b/.test(lower) && /\bgroups?\b/.test(lower) && /\badmin\b/.test(lower)) {
    const enabled = !/\boff\b|\bdisable\b/.test(lower);
    const adminGroups = await bulk.listAdminGroups(sock);
    if (adminGroups.length === 0) {
      await sock.sendMessage(chatJid, { text: "I'm not an admin in any groups right now." });
      return true;
    }
    confirm.propose(
      senderJid,
      "bulkSetAntiLink",
      `${adminGroups.length} groups`,
      { groups: adminGroups, enabled },
      `${enabled ? "Enable" : "Disable"} anti-link in ${adminGroups.length} group(s)?`
    );
    const list = adminGroups.map((g, i) => `${i + 1}. ${g.subject}`).join("\n");
    await sock.sendMessage(chatJid, {
      text: `⚠️ ${enabled ? "Enable" : "Disable"} anti-link in ${adminGroups.length} group(s) where I'm admin:\n${list}\n\nReply "yes" to confirm, or "no" to cancel.`,
    });
    return true;
  }

  // 5. Anti-link on/off
  const antilinkMatch = lower.match(/\banti-?link\b\s*(on|off)?/);
  if (antilinkMatch) {
    const enabled = antilinkMatch[1] !== "off";
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("setAntiLink", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid, enabled });
    await sock.sendMessage(chatJid, { text: formatResult("setAntiLink", result, group.subject) });
    return true;
  }

  // 5c. Rename group — "rename Zuno to Zuno AI Community", "set Zuno's group name to X"
  const renameMatch = t.match(/\b(?:rename|set(?:'s)?\s+(?:the\s+)?group name (?:of|for)?)\b\s+(?:the\s+)?(.+?)\s+(?:to|as)\s+(.+)/i)
    || t.match(/\bset\s+(.+?)'s\s+group name to\s+(.+)/i);
  if (renameMatch) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${renameMatch[1]}`);
    if (!group) return true;
    const result = await toolExecutor.execute("updateGroupSubject", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid, subject: renameMatch[2].trim() });
    await sock.sendMessage(chatJid, { text: formatResult("updateGroupSubject", result, group.subject) });
    return true;
  }

  // 5d. Group description — group name is extracted directly from between
  // "description of/for" and "to", rather than handed to the generic
  // resolveGroupOrAsk parser, which would otherwise latch onto the new
  // description text after "to" as if IT were the group name.
  const setDescMatch = t.match(/\bdescription\s+(?:of|for)\s+(.+?)\s+to\s+(.+)/i);
  if (setDescMatch) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${setDescMatch[1]}`);
    if (!group) return true;
    const result = await toolExecutor.execute("updateGroupDescription", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid, description: setDescMatch[2].trim() });
    await sock.sendMessage(chatJid, { text: formatResult("updateGroupDescription", result, group.subject) });
    return true;
  }
  if (/\bdescription\b/.test(lower) && /\bwhat('?s| is)\b|\bshow\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("getGroupMetadata", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid });
    await sock.sendMessage(chatJid, {
      text: result.success ? `📝 ${group.subject}: ${result.data.desc || "(no description set)"}` : `❌ ${result.error.message}`,
    });
    return true;
  }

  // 5e. Group invite — "show me the group invite", "revoke the current invite"
  if (/\binvite\b/.test(lower) && /\brevoke\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("revokeGroupInvite", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid });
    await sock.sendMessage(chatJid, { text: formatResult("revokeGroupInvite", result, group.subject) });
    return true;
  }
  if (/\binvite\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("getGroupInviteCode", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid });
    await sock.sendMessage(chatJid, { text: formatResult("getGroupInviteCode", result, group.subject) });
    return true;
  }

  // 5f. Edit-info permission — distinct from message-lock (#6 below). Checked
  // before #4's admins lookup would otherwise intercept "admins" in this phrasing.
  if (/\bedit(?:ing)?\s+(?:the\s+)?group info\b/.test(lower)) {
    const restricted = /\bonly admins\b/.test(lower) || !/\ballow everyone\b|\banyone can\b/.test(lower);
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    return proposeOrRun(
      sock, chatJid, senderJid, "setEditInfoRestricted",
      { groupJid: group.jid, restricted },
      `${restricted ? "Restrict" : "Allow everyone"} editing ${group.subject}'s group info?`,
      group.subject
    );
  }

  // 6. Lock / unlock group. Accepts both "lock Zuno" (bare) and "lock in Zuno"
  // / "lock the Zuno group" — extractGroupQuery only recognizes prepositional
  // phrases, so a bare "lock <name>" is rewritten to "in <name>" first.
  if (/\block\b/.test(lower) && !/unlock/.test(lower)) {
    const bare = strip(t, /\block\b/i, /\bgroup\b/i, /\bthe\b/i);
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, /\b(in|to|for|from)\b/i.test(t) ? t : `in ${bare}`);
    if (!group) return true;
    return proposeOrRun(sock, chatJid, senderJid, "setGroupLocked", { groupJid: group.jid, locked: true }, `Lock ${group.subject}?`, group.subject);
  }
  if (/\bunlock\b/.test(lower)) {
    const bare = strip(t, /\bunlock\b/i, /\bgroup\b/i, /\bthe\b/i);
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, /\b(in|to|for|from)\b/i.test(t) ? t : `in ${bare}`);
    if (!group) return true;
    return proposeOrRun(sock, chatJid, senderJid, "setGroupLocked", { groupJid: group.jid, locked: false }, `Unlock ${group.subject}?`, group.subject);
  }

  // 7. Remove / promote / demote participant — "remove John from Zuno", "promote Sarah in Zuno"
  const participantAction = lower.match(/\b(remove|kick|promote|demote)\b\s+([a-z0-9 .'-]+?)\s*(?:from|in)\s+/i);
  if (participantAction) {
    const action = { remove: "removeParticipant", kick: "removeParticipant", promote: "promoteParticipant", demote: "demoteParticipant" }[participantAction[1].toLowerCase()];
    const nameQuery = participantAction[2].trim();
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const meta = await sock.groupMetadata(group.jid);
    const matches = findParticipantByNameOrNumber(meta.participants, nameQuery);
    if (matches.length === 0) {
      await sock.sendMessage(chatJid, { text: `Couldn't find "${nameQuery}" in ${group.subject}.` });
      return true;
    }
    if (matches.length > 1) {
      await sock.sendMessage(chatJid, { text: `Multiple matches for "${nameQuery}" in ${group.subject}. Use the number directly.` });
      return true;
    }
    const label = `${nameQuery} (${matches[0].id.split("@")[0]}) in ${group.subject}`;
    return proposeOrRun(sock, chatJid, senderJid, action, { groupJid: group.jid, participantJid: matches[0].id }, `${participantAction[1][0].toUpperCase()}${participantAction[1].slice(1)} ${label}?`, label);
  }

  // 7b. Blocklist — "show me who is blocked", "show my blocked contacts", "is 1555... blocked"
  if (/\bblocklist\b|\bblocked contacts?\b|\bwho('?s| is)\s+blocked\b/.test(lower)) {
    const result = await toolExecutor.execute("getBlocklist", { sock, senderJid }, {});
    if (!result.success) {
      await sock.sendMessage(chatJid, { text: `❌ ${friendlyError(result.error)}` });
      return true;
    }
    const list = result.data;
    await sock.sendMessage(chatJid, {
      text: list.length === 0 ? "No one is currently blocked." : `🔒 ${list.length} blocked:\n` + list.map((j) => `• ${j.split("@")[0]}`).join("\n"),
    });
    return true;
  }
  const isBlockedMatch = lower.match(/\bis\s+(.+?)\s+blocked\b/);
  if (isBlockedMatch) {
    const digits = isBlockedMatch[1].replace(/[^0-9]/g, "");
    if (digits.length < 8) {
      await sock.sendMessage(chatJid, { text: "Give me the number to check, e.g. \"is 15551234567 blocked\"." });
      return true;
    }
    const result = await toolExecutor.execute("isBlocked", { sock, senderJid }, { jid: digits + "@s.whatsapp.net" });
    await sock.sendMessage(chatJid, {
      text: result.success ? `${result.data.jid.split("@")[0]} is ${result.data.blocked ? "🔒 blocked" : "not blocked"}.` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }

  // 8. Block / unblock — number or a name found among the current group's participants
  const blockMatch = lower.match(/\b(block|unblock)\b\s+(.+)/);
  if (blockMatch) {
    const action = blockMatch[1] === "block" ? "blockUser" : "unblockUser";
    const query = strip(blockMatch[2], /\bcontact\b/gi, /\bthis\b/gi, /\bperson\b/gi);
    let targetJid = null;
    let label = query;
    const digits = query.replace(/[^0-9]/g, "");
    if (digits.length >= 8) {
      targetJid = digits + "@s.whatsapp.net";
    } else {
      const ctx = getContextGroup(senderJid);
      if (ctx) {
        const meta = await sock.groupMetadata(ctx.groupJid);
        const matches = findParticipantByNameOrNumber(meta.participants, query);
        if (matches.length === 1) {
          targetJid = matches[0].id;
          label = `${query} (${matches[0].id.split("@")[0]})`;
        } else if (matches.length > 1) {
          await sock.sendMessage(chatJid, { text: `Multiple matches for "${query}" — give me the number directly.` });
          return true;
        }
      }
    }
    if (!targetJid) {
      await sock.sendMessage(chatJid, {
        text: `Couldn't resolve "${query}" to a number. Give me the number directly, or mention a group first so I can search its members.`,
      });
      return true;
    }
    if (blockMatch[1] === "block") {
      return proposeOrRun(sock, chatJid, senderJid, action, { jid: targetJid }, `Block ${label}?`, label);
    }
    // unblock is low-risk (reversible, restores access) — run immediately
    const result = await toolExecutor.execute(action, { sock, senderJid }, { jid: targetJid });
    await sock.sendMessage(chatJid, { text: formatResult(action, result, label) });
    return true;
  }

  // 9. Send a message to a group — "tell the Zuno group I'm running late", "send Zuno: hello"
  const sendMatch = t.match(/\b(?:tell|message|send)\b\s+(?:the\s+)?(.+?)\s+(?:group\s+)?(?:that\s+|saying\s+|:\s*)(.+)/i);
  if (sendMatch) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${sendMatch[1]}`);
    if (!group) return true;
    const result = await toolExecutor.execute("sendMessage", { sock, senderJid, groupJid: group.jid }, { jid: group.jid, text: sendMatch[2].trim() });
    await sock.sendMessage(chatJid, { text: formatResult("sendMessage", result, group.subject) });
    return true;
  }

  // 10. Scheduled reminders — "remind Zuno tomorrow at 9am saying the meeting
  // starts at 10", "send good morning to the team every monday at 8".
  // Checked AFTER #9's plain send, since reminder phrasing ("remind ...
  // saying/that ...") is a strict superset of what parseReminderRequest
  // requires (a schedule phrase) — a plain "tell Zuno that ..." with no
  // schedule phrase never matches here, so ordering relative to #9 doesn't
  // actually create ambiguity, but checking after is the safer choice.
  const reminderRequest = parseReminderRequest(t);
  if (reminderRequest) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${reminderRequest.groupQuery}`);
    if (!group) return true;
    const result = scheduler.createTask({
      ownerJid: senderJid,
      targetJid: group.jid,
      action: "sendMessage",
      payload: { jid: group.jid, text: reminderRequest.message, _agentId: agentId || null },
      schedule: reminderRequest.schedule,
    });
    if (!result.success) {
      await sock.sendMessage(chatJid, { text: `❌ ${friendlyError(result.error)}` });
      return true;
    }
    await sock.sendMessage(chatJid, { text: `⏰ Scheduled.\n${describeSchedule(result.data.schedule)}\nTarget: ${group.subject}\nMessage: "${reminderRequest.message}"` });
    return true;
  }

  // 10b. List scheduled tasks — "show my scheduled tasks", "show my reminders"
  if (/\b(scheduled tasks|my reminders|show my schedule)\b/.test(lower) || (/\btasks\b/.test(lower) && /\bshow|list|my\b/.test(lower))) {
    const tasks = scheduler.listTasks(senderJid);
    if (tasks.length === 0) {
      await sock.sendMessage(chatJid, { text: "No scheduled tasks right now." });
      return true;
    }
    const list = tasks
      .map((task, i) => `${i + 1}. [${task.id}] ${describeSchedule(task.schedule)} — "${task.payload.text || task.action}"`)
      .join("\n");
    await sock.sendMessage(chatJid, { text: `⏰ Scheduled tasks:\n${list}\n\nSay "cancel reminder <number>" to cancel one.` });
    return true;
  }

  // 10c. Cancel a scheduled task — "cancel reminder 4", "cancel task <id>"
  const cancelMatch = lower.match(/\bcancel\b.*?\b(?:reminder|task)\b\s*#?([a-z0-9]+)/);
  if (cancelMatch) {
    const tasks = scheduler.listTasks(senderJid);
    const idxOrId = cancelMatch[1];
    let target = tasks.find((task) => task.id === idxOrId);
    if (!target && /^\d+$/.test(idxOrId)) {
      target = tasks[parseInt(idxOrId, 10) - 1]; // 1-based index, matching the list shown above
    }
    if (!target) {
      await sock.sendMessage(chatJid, {
        text: `Couldn't find a scheduled task matching "${idxOrId}". Say "show my scheduled tasks" to see the list.`,
      });
      return true;
    }
    const result = scheduler.cancelTask(target.id, senderJid);
    await sock.sendMessage(chatJid, { text: result.success ? "✅ Cancelled." : `❌ ${friendlyError(result.error)}` });
    return true;
  }

  // 10d. Email report — "email me a report", "send a report to me@example.com".
  // Triggers on the word "report" plus either "email" or an actual email
  // address in the text — the address alone is a strong enough signal even
  // without the word "email" ("send a report to x@y.com").
  // Deliberately requires an explicit email address in the message; never
  // asks for or accepts a password here (see sendEmailReport tool comment —
  // credentials come from server-side EMAIL_USER/EMAIL_PASS only).
  const reportEmailMatch = t.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (/\breport\b/.test(lower) && (/\bemail\b/.test(lower) || reportEmailMatch)) {
    if (!reportEmailMatch) {
      await sock.sendMessage(chatJid, { text: "What email address should I send the report to?" });
      return true;
    }
    const [diagnostics, groupsResult] = await Promise.all([
      toolExecutor.execute("runDiagnostics", { sock, senderJid }, {}),
      toolExecutor.execute("getGroups", { sock, senderJid }, {}),
    ]);
    const reportText = buildReportText({
      diagnostics: diagnostics.success ? diagnostics.data : null,
      groups: groupsResult.success ? groupsResult.data : [],
    });
    const result = await toolExecutor.execute(
      "sendEmailReport",
      { sock, senderJid },
      { to: reportEmailMatch[0], subject: "Miss Aria Status Report", body: reportText }
    );
    await sock.sendMessage(chatJid, {
      text: result.success ? `📧 Report sent to ${reportEmailMatch[0]}.` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }

  // 11. Pin / unpin a message — "pin this message in Zuno", "pin the last
  // message in Zuno". Since this is said in a private DM (not by replying
  // to the message directly inside the group), there's no quoted-message
  // context to pull a key from — resolves via lastMessageStore instead,
  // which only ever knows the most recent message the bot itself has seen
  // in that group. Checked before the generic "pin"-as-chat handler below,
  // since "pin this message" is more specific than a bare "pin Zuno".
  if (/\bpin\b/.test(lower) && /\bmessage\b/.test(lower) && !/\bunpin\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const lastMsg = await toolExecutor.execute("getLastGroupMessage", { sock, senderJid }, { groupJid: group.jid });
    if (!lastMsg.success) {
      await sock.sendMessage(chatJid, { text: `❌ ${friendlyError(lastMsg.error)}` });
      return true;
    }
    const durationMatch = lower.match(/\b(day|week|month)\b/);
    const durationSeconds = { day: 86400, week: 604800, month: 2592000 }[durationMatch?.[1]];
    return proposeOrRun(
      sock, chatJid, senderJid, "pinMessage",
      { groupJid: group.jid, key: lastMsg.data.key, durationSeconds },
      `Pin "${lastMsg.data.preview || "(media)"}" in ${group.subject}?`,
      group.subject
    );
  }
  if (/\bunpin\b/.test(lower) && /\bmessage\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const lastMsg = await toolExecutor.execute("getLastGroupMessage", { sock, senderJid }, { groupJid: group.jid });
    if (!lastMsg.success) {
      await sock.sendMessage(chatJid, { text: `❌ ${friendlyError(lastMsg.error)}` });
      return true;
    }
    const result = await toolExecutor.execute("unpinMessage", { sock, senderJid, groupJid: group.jid }, { key: lastMsg.data.key });
    await sock.sendMessage(chatJid, { text: formatResult("unpinMessage", result, group.subject) });
    return true;
  }

  // 11b. Pin / unpin, archive / unarchive, mute / unmute the CHAT itself
  // (distinct from pinning a message above) — "pin the Zuno chat",
  // "archive Zuno", "mute Zuno for a day".
  if (/\bpin\b/.test(lower) && !/\bunpin\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("pinChat", { sock, senderJid }, { jid: group.jid, pin: true });
    await sock.sendMessage(chatJid, { text: formatResult("pinChat", result, group.subject) });
    return true;
  }
  if (/\bunpin\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("pinChat", { sock, senderJid }, { jid: group.jid, pin: false });
    await sock.sendMessage(chatJid, { text: formatResult("pinChat", result, group.subject) });
    return true;
  }
  if (/\barchive\b/.test(lower) && !/\bunarchive\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("archiveChat", { sock, senderJid }, { jid: group.jid, archive: true });
    await sock.sendMessage(chatJid, { text: formatResult("archiveChat", result, group.subject) });
    return true;
  }
  if (/\bunarchive\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("archiveChat", { sock, senderJid }, { jid: group.jid, archive: false });
    await sock.sendMessage(chatJid, { text: formatResult("archiveChat", result, group.subject) });
    return true;
  }
  if (/\bmute\b/.test(lower) && /\bchat\b|\bgroup\b|\bnotifications?\b/.test(lower) && !/\bunmute\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const durationMatch = lower.match(/\bfor\s+(\d+)\s*(hour|day|week)/);
    const unitMs = { hour: 3600000, day: 86400000, week: 604800000 };
    const durationMs = durationMatch ? parseInt(durationMatch[1], 10) * unitMs[durationMatch[2]] : null;
    const result = await toolExecutor.execute("muteChat", { sock, senderJid }, { jid: group.jid, durationMs });
    await sock.sendMessage(chatJid, { text: formatResult("muteChat", result, group.subject) });
    return true;
  }
  if (/\bunmute\b/.test(lower) && /\bchat\b|\bgroup\b|\bnotifications?\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("unmuteChat", { sock, senderJid }, { jid: group.jid });
    await sock.sendMessage(chatJid, { text: formatResult("unmuteChat", result, group.subject) });
    return true;
  }

  // 12. Profile — "set my name to X", "set my status to X" / "set my about to X"
  const nameMatch = t.match(/\bset\s+my\s+name\s+to\s+(.+)/i);
  if (nameMatch) {
    const result = await toolExecutor.execute("updateProfileName", { sock, senderJid }, { name: nameMatch[1].trim() });
    await sock.sendMessage(chatJid, { text: formatResult("updateProfileName", result) });
    return true;
  }
  const statusMatch = t.match(/\bset\s+my\s+(?:status|about)\s+to\s+(.+)/i);
  if (statusMatch) {
    const result = await toolExecutor.execute("updateProfileStatus", { sock, senderJid }, { status: statusMatch[1].trim() });
    await sock.sendMessage(chatJid, { text: formatResult("updateProfileStatus", result) });
    return true;
  }
  if (/\bremove\b.*\bprofile picture\b/.test(lower)) {
    return proposeOrRun(sock, chatJid, senderJid, "removeBotProfilePicture", {}, "Remove your profile picture?", "your profile");
  }

  // 13. Post a status/story — "post a status saying X", "update my status: X"
  const postStatusMatch = t.match(/\bpost\s+(?:a\s+)?status\s+(?:saying|that says|:)\s*(.+)/i);
  if (postStatusMatch) {
    return proposeOrRun(sock, chatJid, senderJid, "postStatusUpdate", { text: postStatusMatch[1].trim() }, `Post this as your status: "${postStatusMatch[1].trim()}"?`, "your status");
  }

  // 14. Contacts — "does 1555... have whatsapp", "business profile of 1555...",
  // "about of 1555...", "call 1555... John" / "save 1555... as John"
  const hasWaMatch = t.match(/\bdoes\s+(.+?)\s+have\s+whatsapp\b/i);
  if (hasWaMatch) {
    const result = await toolExecutor.execute("checkHasWhatsApp", { sock, senderJid }, { number: hasWaMatch[1] });
    await sock.sendMessage(chatJid, {
      text: result.success
        ? (result.data.hasWhatsApp ? `✅ ${result.data.number} is on WhatsApp.` : `❌ ${result.data.number} is not on WhatsApp.`)
        : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }
  const bizMatch = t.match(/\bbusiness profile\s+(?:of|for)\s+(.+)/i);
  if (bizMatch) {
    const result = await toolExecutor.execute("getBusinessProfile", { sock, senderJid }, { number: bizMatch[1] });
    await sock.sendMessage(chatJid, {
      text: result.success ? `🏢 ${JSON.stringify(result.data)}` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }
  const aboutMatch = t.match(/\babout\s+(?:of|for)\s+(.+)/i);
  if (aboutMatch) {
    const result = await toolExecutor.execute("getContactAbout", { sock, senderJid }, { number: aboutMatch[1] });
    await sock.sendMessage(chatJid, {
      text: result.success ? `📝 ${result.data.about || "(no about text set)"}` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }
  const saveAliasMatch = t.match(/\bsave\s+(.+?)\s+as\s+(.+)/i);
  if (saveAliasMatch) {
    const result = await toolExecutor.execute("setContactAlias", { sock, senderJid }, { number: saveAliasMatch[1], alias: saveAliasMatch[2].trim() });
    await sock.sendMessage(chatJid, {
      text: result.success ? `✅ Saved ${result.data.jid.split("@")[0]} as "${result.data.alias}".` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }

  // 15. Calls — "reject calls" / "do not disturb on/off"
  if (/\b(dnd|do not disturb)\b/.test(lower)) {
    const enabled = !/\boff\b/.test(lower);
    const result = await toolExecutor.execute("setDoNotDisturb", { sock, senderJid }, { enabled });
    await sock.sendMessage(chatJid, { text: result.success ? `✅ Do-not-disturb (auto-reject calls) is now ${enabled ? "ON" : "OFF"}.` : `❌ ${friendlyError(result.error)}` });
    return true;
  }

  // 16. Group lifecycle — "join <invite link>", "leave <group>", "create a group called X with 1555.., 1555.."
  if (/\bjoin\b/.test(lower) && /chat\.whatsapp\.com/.test(t)) {
    const result = await toolExecutor.execute("joinGroupByInvite", { sock, senderJid }, { inviteLink: t });
    await sock.sendMessage(chatJid, { text: result.success ? `✅ Joined. (${result.data.groupJid})` : `❌ ${friendlyError(result.error)}` });
    return true;
  }
  if (/\bleave\b/.test(lower)) {
    const bare = strip(t, /\bleave\b/i, /\bgroup\b/i, /\bthe\b/i);
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, /\b(in|to|for|from)\b/i.test(t) ? t : `in ${bare}`);
    if (!group) return true;
    return proposeOrRun(sock, chatJid, senderJid, "leaveGroup", { groupJid: group.jid }, `Leave ${group.subject}? I won't be able to manage it anymore.`, group.subject);
  }
  const createGroupMatch = t.match(/\bcreate\s+a\s+group\s+(?:called|named)\s+(.+?)\s+with\s+(.+)/i);
  if (createGroupMatch) {
    const participants = createGroupMatch[2].split(/,|\band\b/i).map((s) => s.trim()).filter(Boolean);
    return proposeOrRun(
      sock, chatJid, senderJid, "createGroup",
      { subject: createGroupMatch[1].trim(), participants },
      `Create a group called "${createGroupMatch[1].trim()}" with ${participants.length} member(s)?`,
      createGroupMatch[1].trim()
    );
  }

  // 17. Disappearing messages — "turn on disappearing messages in Zuno for a week"
  if (/\bdisappearing messages?\b/.test(lower)) {
    const durationWord = lower.match(/\b(off|day|24\s*hours?|week|7\s*days?|90\s*days?)\b/);
    let duration = "day";
    if (durationWord) {
      const w = durationWord[1];
      if (/off/.test(w)) duration = "off";
      else if (/week|7/.test(w)) duration = "week";
      else if (/90/.test(w)) duration = "90days";
      else duration = "day";
    }
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const result = await toolExecutor.execute("setDisappearingMessages", { sock, senderJid, groupJid: group.jid }, { groupJid: group.jid, duration });
    await sock.sendMessage(chatJid, {
      text: result.success ? `✅ Disappearing messages in ${group.subject}: ${duration === "off" ? "OFF" : duration}.` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }

  // 18. Poll / location — "send a poll to Zuno asking pizza or tacos with options pizza, tacos"
  const pollMatch = t.match(/\bpoll\b.*?\b(?:in|to|for)\s+(.+?)\s+asking\s+(.+?)\s+(?:with\s+options|options)\s+(.+)/i);
  if (pollMatch) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${pollMatch[1]}`);
    if (!group) return true;
    const options = pollMatch[3].split(",").map((s) => s.trim()).filter(Boolean);
    const result = await toolExecutor.execute("sendPoll", { sock, senderJid, groupJid: group.jid }, { jid: group.jid, question: pollMatch[2].trim(), options });
    await sock.sendMessage(chatJid, { text: result.success ? `📊 Poll sent to ${group.subject}.` : `❌ ${friendlyError(result.error)}` });
    return true;
  }

  // 19. Delete a message. Checked in priority order:
  //   a) The owner's message is itself a REPLY — delete exactly that
  //      message, extracted via real Baileys contextInfo, not a guess at
  //      "the last one in the group".
  //   b) Otherwise fall back to the existing "delete the last message in
  //      Zuno" behavior (via getLastGroupMessage), or whole-chat deletion.
  if (/\bdelete\b/.test(lower) && /\b(that|this|it)\b/.test(lower) && !/\bchat\b/.test(lower)) {
    const quotedKey = msg ? getQuotedMessageKey(msg, sock?.user?.id) : null;
    if (quotedKey) {
      const targetLabel = quotedKey.remoteJid.endsWith("@g.us") ? "that message" : "that message in this chat";
      return proposeOrRun(
        sock, chatJid, senderJid, "deleteMessage",
        { key: quotedKey },
        `Delete ${targetLabel}? This deletes it for everyone.`,
        targetLabel
      );
    }
    await sock.sendMessage(chatJid, { text: 'Reply to the message you want deleted, then say "delete that".' });
    return true;
  }

  // 10h. Send attached/quoted media to a resolved chat — "send this image
  // to Zuno". Real media extraction (mediaExtractor.js); the actual
  // Baileys download call is only as verified as this fork's
  // downloadMediaMessage export (see mediaExtractor.js's own note).
  const sendMediaMatch = t.match(/\bsend\s+(?:this|that|it)\b(?:\s+(?:image|photo|picture|video|document|file|audio|voice\s*note))?\s+to\s+(?:the\s+)?(.+)/i);
  if (sendMediaMatch && msg && findMediaMessage(msg)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${sendMediaMatch[1]}`);
    if (!group) return true;
    const media = await downloadAttachedMedia(sock, msg);
    if (!media.success) {
      await sock.sendMessage(chatJid, { text: `❌ ${friendlyError(media.error)}` });
      return true;
    }
    const toolByType = { image: "sendImage", video: "sendVideo", document: "sendDocument", audio: "sendAudio" };
    const toolName = toolByType[media.type];
    const args = { jid: group.jid, buffer: media.buffer.toString("base64"), caption: media.caption || undefined };
    if (media.type === "document") {
      args.filename = media.fileName || "file";
      args.mimetype = media.mimetype || "application/octet-stream";
    }
    if (media.type === "audio") args.mimetype = media.mimetype || "audio/mp4";
    const result = await toolExecutor.execute(toolName, { sock, senderJid, groupJid: group.jid }, args);
    await sock.sendMessage(chatJid, {
      text: result.success ? `✅ Sent the ${media.type} to ${group.subject}.` : `❌ ${friendlyError(result.error)}`,
    });
    return true;
  }

  // 19b. Fallback: "delete the last message in Zuno" (no reply involved).
  if (/\bdelete\b/.test(lower) && /\bmessage\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    const lastMsg = await toolExecutor.execute("getLastGroupMessage", { sock, senderJid }, { groupJid: group.jid });
    if (!lastMsg.success) {
      await sock.sendMessage(chatJid, { text: `❌ ${friendlyError(lastMsg.error)}` });
      return true;
    }
    return proposeOrRun(
      sock, chatJid, senderJid, "deleteMessage",
      { key: lastMsg.data.key },
      `Delete "${lastMsg.data.preview || "(media)"}" in ${group.subject}? This deletes it for everyone.`,
      group.subject
    );
  }
  if ((/\bdelete\b/.test(lower) || /\bclear\b/.test(lower)) && /\bchat\b/.test(lower)) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, t);
    if (!group) return true;
    return proposeOrRun(sock, chatJid, senderJid, "deleteChat", { jid: group.jid }, `Delete all chat history with ${group.subject} on this account? This can't be undone.`, group.subject);
  }

  // 20. Voice note — "send a voice note <url> to Zuno"
  const voiceMatch = t.match(/\bvoice note\s+(\S+)\s+(?:to|in)\s+(.+)/i);
  if (voiceMatch) {
    const group = await resolveGroupOrAsk(sock, chatJid, senderJid, `in ${voiceMatch[2]}`);
    if (!group) return true;
    const result = await toolExecutor.execute("sendVoiceNote", { sock, senderJid, groupJid: group.jid }, { jid: group.jid, url: voiceMatch[1] });
    await sock.sendMessage(chatJid, { text: result.success ? `🎤 Voice note sent to ${group.subject}.` : `❌ ${friendlyError(result.error)}` });
    return true;
  }

  return false; // not recognized — let the existing router/AI reply handle it
}

async function proposeOrRun(sock, chatJid, ownerJid, action, payload, promptText, label) {
  const risk = confirm.riskOf(action);
  if (risk === confirm.RISK.LOW) {
    const result = await toolExecutor.execute(action, { sock, senderJid: ownerJid, groupJid: payload.groupJid }, payload);
    await sock.sendMessage(chatJid, { text: formatResult(action, result, label) });
    return true;
  }
  confirm.propose(ownerJid, action, label, payload, promptText);
  await sock.sendMessage(chatJid, { text: `⚠️ ${promptText} Reply "yes" to confirm, or "no" to cancel.` });
  return true;
}

function formatResult(action, result, label) {
  if (!result.success) {
    return `❌ ${friendlyError(result.error)}`;
  }
  switch (action) {
    case "getBotStatus": {
      const d = result.data;
      return `🤖 Miss Aria diagnostics\n\nWhatsApp: ${d.connected ? "🟢 Connected" : "🔴 Disconnected"}\nGroups: ${d.groupCount}\nAdmin groups: ${d.adminGroupCount}\nUptime: ${Math.floor(d.uptimeSeconds / 60)}m`;
    }
    case "getGroups": {
      if (result.data.length === 0) return "No groups found.";
      return `👥 ${result.data.length} groups:\n` + result.data.map((g) => `• ${g.subject} (${g.participantCount} members)`).join("\n");
    }
    case "getGroupAdmins": {
      if (result.data.length === 0) return `No admins found in ${label}.`;
      return `🛡 Admins in ${label}:\n` + result.data.map((p) => `• ${p.id.split("@")[0]}`).join("\n");
    }
    case "setAntiLink":
      return `✅ Anti-link ${result.data.antiLink ? "enabled" : "disabled"} in ${label}.`;
    case "setGroupLocked":
      return `✅ ${label} is now ${result.data.locked ? "locked (admins only)" : "unlocked"}.`;
    case "removeParticipant":
      return `✅ Removed ${label}.`;
    case "promoteParticipant":
      return `✅ Promoted ${label}.`;
    case "demoteParticipant":
      return `✅ Demoted ${label}.`;
    case "blockUser":
      return `🔒 Blocked ${label}.`;
    case "unblockUser":
      return `🔓 Unblocked ${label}.`;
    case "sendMessage":
      return `✅ Sent to ${label}.`;
    case "updateGroupSubject":
      return `✅ Renamed group to "${result.data.subject}".`;
    case "updateGroupDescription":
      return `✅ Updated ${label}'s description.`;
    case "getGroupInviteCode":
      return `🔗 ${label} invite link:\n${result.data.inviteLink}`;
    case "revokeGroupInvite":
      return `✅ Revoked the old invite. New link for ${label}:\n${result.data.newInviteLink}`;
    case "setEditInfoRestricted":
      return `✅ ${label}: editing group info is now ${result.data.restricted ? "admins-only" : "open to everyone"}.`;
    case "getModerationStatus": {
      const d = result.data;
      return [
        `🛡 ${label} Moderation`,
        ``,
        `Anti-Link: ${d.antiLink ? "🟢 ON" : "🔴 OFF"}`,
        `Messaging restricted to admins: ${d.messagingRestricted ? "🟢 YES" : "🔴 NO"}`,
        `Edit-info restricted to admins: ${d.editInfoRestricted ? "🟢 YES" : "🔴 NO"}`,
        `Warnings on record: ${d.totalWarnings}`,
        `Bot Admin: ${d.botIsAdmin ? "🟢 YES" : "🔴 NO"}`,
      ].join("\n");
    }
    case "restartBot":
      return "🔄 Restarting now — back shortly.";
    case "pinMessage":
      return `📌 Pinned in ${label}.`;
    case "unpinMessage":
      return `✅ Unpinned in ${label}.`;
    case "pinChat":
      return result.data.pinned ? `📌 Pinned ${label} to the top.` : `✅ Unpinned ${label}.`;
    case "archiveChat":
      return result.data.archived ? `🗄 Archived ${label}.` : `✅ Unarchived ${label}.`;
    case "muteChat":
      return result.data.muteUntil
        ? `🔇 Muted ${label} until ${new Date(result.data.muteUntil).toLocaleString()}.`
        : `🔇 Muted ${label} indefinitely.`;
    case "unmuteChat":
      return `🔊 Unmuted ${label}.`;
    case "updateProfileName":
      return `✅ Name updated to "${result.data.name}".`;
    case "updateProfileStatus":
      return `✅ Status/about updated.`;
    case "removeBotProfilePicture":
      return `✅ Profile picture removed.`;
    case "postStatusUpdate":
      return `✅ Status posted.`;
    case "leaveGroup":
      return `✅ Left ${label}.`;
    case "createGroup":
      return `✅ Created "${result.data.subject}".`;
    case "deleteMessage":
      // Two different label shapes flow through here: a group/chat name
      // (old "delete the last message in Zuno" path) vs. a description of
      // the message itself (new reply-based "delete that" path) — phrased
      // differently so neither reads awkwardly ("Deleted in that message").
      return /message/i.test(label) ? `🗑 Deleted ${label}.` : `🗑 Deleted the message in ${label}.`;
    case "deleteChat":
      return `🗑 Chat history with ${label} cleared.`;
    default:
      return "✅ Done.";
  }
}

function describeSchedule(schedule) {
  if (schedule.type === "once") {
    const d = new Date(schedule.runAt);
    return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  const time = `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`;
  if (schedule.type === "daily") return `Every day at ${time}`;
  if (schedule.type === "weekly") {
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][schedule.dayOfWeek];
    return `Every ${day} at ${time}`;
  }
  return "Unknown schedule";
}

function friendlyError(error) {
  switch (error?.code) {
    case "Admin_needed":
      return "I can't do that because I don't have admin permissions in this group.";
    case "GROUP_NOT_FOUND":
      return "I couldn't find that group.";
    case "UNAUTHORIZED":
      return "That operation is restricted to the owner.";
    case "SEND_UNVERIFIED":
      return "I couldn't confirm that message actually sent.";
    case "RESTART_FAILED":
      return "Restart didn't go through — check the logs.";
    case "TASK_NOT_FOUND":
      return "No task with that ID.";
    case "EMAIL_NOT_CONFIGURED":
      return "Email isn't configured on this bot yet.";
    case "EMAIL_SEND_FAILED":
      return "The email didn't go through — check the SMTP settings.";
    case "MISSING_FIELDS":
      return "I'm missing something needed to send that.";
    case "NO_TRACKED_MESSAGE":
      return "I haven't seen a message in that group since I've been online, so there's nothing to pin/unpin yet.";
    case "INVALID_MESSAGE_KEY":
      return "I don't have enough information about that message to act on it.";
    case "NO_MEDIA_SOURCE":
      return "I need an image to do that — a link or a file.";
    case "INVALID_PRESENCE_TYPE":
      return "That's not a presence state I recognize.";
    case "INVALID_NUMBER":
      return "That doesn't look like a valid number.";
    case "INVALID_CALL":
      return "I don't have enough information about that call to reject it.";
    case "NOT_A_BUSINESS_ACCOUNT":
      return "That's not available — the account isn't set up as a WhatsApp Business account.";
    case "INVALID_DURATION":
    case "INVALID_VALUE":
      return "That's not a value WhatsApp supports for this setting.";
    default:
      return error?.message || "Something went wrong.";
  }
}

module.exports = { tryHandle };
