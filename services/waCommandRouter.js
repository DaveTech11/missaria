// services/waCommandRouter.js
//
// Single dispatcher for every WhatsApp text command that ISN'T one of the
// existing no-prefix group-admin commands (kick/promote/demote/antilink/
// scan/setpp — those still live in waGroupManager + attachAutoReply, and
// keep working exactly as before).
//
// Design goals (this is the "don't let it be unstable" part):
//   1. ONE place decides what a message means. Nothing else in the codebase
//      should independently guess "is this a command."
//   2. Every handler runs inside its own try/catch. A bug or a thrown
//      error in one command sends the user a "something went wrong"
//      reply instead of ever crashing the socket or blocking the next
//      message.
//   3. Duplicate delivery protection. Baileys can redeliver the same
//      message on reconnect; we dedupe by message id (small ring buffer)
//      so a command never fires twice for one tap.
//   4. Explicit, data-driven registry (name -> handler) instead of a long
//      if/else chain, so adding a command later is a one-line addition
//      and can't accidentally shadow another command.
//
// Two calling conventions, matching what you asked for:
//   - PREFIXED  (".something args"): everything ported from the Telegram
//     side — games, fun commands, utilities, menu — lives here.
//   - BARE-WORD, no prefix: reserved for the admin group-moderation set
//     (kick/promote/demote/antilink/scan/setpp/mute/warn/lock/tag/ban),
//     which is intentionally handled by waGroupManager instead of this
//     router, since those are gated on "is the sender a group admin",
//     not on prefix.

const PREFIX = ".";

// name -> { handler, adminOnly, groupOnly, dmOnly }
const registry = new Map();
const aliases = new Map(); // alias -> canonical name

function register(name, handler, opts = {}) {
  registry.set(name, { handler, ...opts });
  for (const a of opts.aliases || []) aliases.set(a, name);
}

function resolve(name) {
  const canonical = aliases.get(name) || name;
  return registry.get(canonical) || null;
}

function listCommands() {
  const out = [];
  for (const [name, entry] of registry.entries()) {
    if (entry.hidden) continue;
    out.push(name);
  }
  return out.sort();
}

// ---------- dedupe (protects against Baileys redelivering on reconnect) ----------

const seenIds = new Set();
const seenOrder = [];
const SEEN_CAP = 500;

function alreadyHandled(msgId) {
  if (!msgId) return false;
  if (seenIds.has(msgId)) return true;
  seenIds.add(msgId);
  seenOrder.push(msgId);
  if (seenOrder.length > SEEN_CAP) {
    const old = seenOrder.shift();
    seenIds.delete(old);
  }
  return false;
}

// ---------- parsing ----------

/**
 * @returns {null | { name: string, args: string, raw: string }}
 */
function parsePrefixed(text) {
  const t = String(text || "").trim();
  if (!t.startsWith(PREFIX)) return null;
  const withoutPrefix = t.slice(PREFIX.length);
  const spaceIdx = withoutPrefix.search(/\s/);
  const name = (spaceIdx === -1 ? withoutPrefix : withoutPrefix.slice(0, spaceIdx)).toLowerCase();
  const args = spaceIdx === -1 ? "" : withoutPrefix.slice(spaceIdx + 1).trim();
  if (!name) return null;
  return { name, args, raw: t };
}

/**
 * Runs a prefixed command if the text matches one. Returns true if a
 * command was found AND handled (whether it succeeded or errored) — the
 * caller should stop processing the message either way. Returns false if
 * the text wasn't a recognized command at all, so the caller can fall
 * through to normal conversational handling.
 *
 * ctx is passed straight through to the handler and should contain
 * whatever the handler might need: { sock, jid, isGroup, senderJid, m,
 * agent, isOwner, ... }. Handlers decide for themselves what they need.
 */
async function tryHandle(text, ctx) {
  const parsed = parsePrefixed(text);
  if (!parsed) return false;

  const entry = resolve(parsed.name);
  if (!entry) {
    // Unknown ".something" — say so once, don't stay silent (silence
    // reads as "the bot is broken"), but don't spam group chats with
    // unknown-command noise from every stray message starting with ".".
    if (parsed.name.length >= 2) {
      await safeSend(ctx, `
❓ υηкησωη ¢σммαη∂
───────────────
❌ .${parsed.name} ∂σєѕη'т єχιѕт.
💡 ѕєη∂ .мєηυ тσ ѕєє єνєяутнιηg ι ¢αη ∂σ.`);
    }
    return true;
  }
if (entry.groupOnly && !ctx.isGroup) {
  await safeSend(
    ctx,
    `👥 gяσυρ σηℓу!\n\n❌ тнιѕ ¢σммαη∂ σηℓу ωσякѕ ιη gяσυρѕ.`
  );
  return true;
}

if (entry.dmOnly && ctx.isGroup) {
  await safeSend(
    ctx,
    `💬 ∂м σηℓу!\n\n❌ тнιѕ ¢σммαη∂ σηℓу ωσякѕ ιη α ∂м ωιтн мє.`
  );
  return true;
}

try {
  await entry.handler({ ...ctx, args: parsed.args });
} catch (err) {
  console.error(
    `waCommandRouter: ".${parsed.name}" failed:`,
    err && err.message
  );

  await safeSend(
    ctx,
    `╭━━━〔 ⚠️ єяяσя 〕━━━╮
│
│ ❌ *.${parsed.name}* нιт α ѕηαg.
│
│ 🙂 ∂ση'т ωσяяу — тяу αgαιη
│    ιη α мσмєηт.
│
╰━━━━━━━━━━━━━━━━━━━━━━╯`
  );
}

return true;
}

async function safeSend(ctx, text) {
  try {
    await ctx.sock.sendMessage(ctx.jid, { text });
  } catch (err) {
    console.error(
      "waCommandRouter: reply send failed:",
      err && err.message
    );
  }
}

module.exports = {
  PREFIX,
  register,
  resolve,
  listCommands,
  parsePrefixed,
  tryHandle,
  alreadyHandled,
  safeSend,
};
