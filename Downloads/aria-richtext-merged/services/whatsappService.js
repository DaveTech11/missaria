// services/whatsappService.js
//
// Owner-only multi-agent WhatsApp bridge built on Baileys (unofficial WA
// library — using it puts each paired number at some risk of a WhatsApp
// ban, since it's against WhatsApp's ToS; that's a tradeoff the owner
// accepts by running /pair).
//
// An "agent" = one paired WhatsApp number. Multiple agents can be ACTIVE
// (connected + auto-replying) at the same time — the owner controls this
// per-agent with /setagent (turn on) and /agentoff (turn off), and only
// the owner can do either.
//
// Auto-reply only fires in 1:1 DMs to the paired number, never in groups,
// and only replies to messages sent TO the paired account — it does not
// read or export the account's existing chat history to anyone.

const fs = require("fs");
const path = require("path");
const waIdentity = require("./waIdentity");

const AGENTS_DIR = path.join(__dirname, "..", "data", "whatsapp_agents");
const REGISTRY_PATH = path.join(AGENTS_DIR, "registry.json");

if (!fs.existsSync(AGENTS_DIR)) fs.mkdirSync(AGENTS_DIR, { recursive: true });

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { agents: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    if (!parsed.agents) parsed.agents = {};
    return parsed;
  } catch {
    return { agents: {} };
  }
}

function saveRegistry(reg) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2));
}

let registry = loadRegistry();

// agentId -> live Baileys socket. An agent only appears here while
// actually connected and auto-replying.
const liveSockets = new Map();
let baileysLib = null;

function getBaileys() {
  if (!baileysLib) {
    // Lazy require so the bot still boots if the dependency isn't
    // installed yet (npm install needed once, see package.json).
    baileysLib = require("@whiskeysockets/baileys");
  }
  return baileysLib;
}

function sessionDir(agentId) {
  return path.join(AGENTS_DIR, agentId);
}

function listAgents() {
  return Object.values(registry.agents);
}

function getActiveAgentIds() {
  return Array.from(liveSockets.keys());
}

// Backward-compat single-id accessor (returns the first active agent, if any).
function getActiveAgentId() {
  const ids = getActiveAgentIds();
  return ids.length ? ids[0] : null;
}

/**
 * Direct socket lookup by agent id, for callers outside this file that
 * need a live socket to send through — currently just the scheduler
 * (src/automation/scheduler.js), which needs to send a scheduled message
 * through the same agent connection that originally scheduled it.
 */
function getSocketByAgentId(agentId) {
  return liveSockets.get(agentId) || null;
}

function ensureAgentRecord(agentId, digits) {
  if (!registry.agents[agentId]) {
    registry.agents[agentId] = {
      id: agentId,
      number: digits,
      pairedAt: Date.now(),
      label: `+${digits}`,
      ultraPower: false,
      persona: waIdentity.DEFAULT_PERSONA_IDENTITY_NOTE,
      awayMode: { enabled: false, startHour: 9, endHour: 18 },
      stats: { total: 0, daily: {} },
    };
  }
  // Backfill fields for agents paired before these features existed.
  const a = registry.agents[agentId];
  if (!a.awayMode) a.awayMode = { enabled: false, startHour: 9, endHour: 18 };
  if (!a.stats) a.stats = { total: 0, daily: {} };
  if (typeof a.persona !== "string") a.persona = "";
  return a;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function recordReply(agentId) {
  const a = registry.agents[agentId];
  if (!a) return;
  a.stats.total = (a.stats.total || 0) + 1;
  const key = todayKey();
  a.stats.daily[key] = (a.stats.daily[key] || 0) + 1;
  // Keep only the last 30 days of daily buckets.
  const keys = Object.keys(a.stats.daily).sort();
  if (keys.length > 30) {
    for (const k of keys.slice(0, keys.length - 30)) delete a.stats.daily[k];
  }
  saveRegistry(registry);
}

function getAgentStats(agentId) {
  const a = registry.agents[agentId];
  if (!a) throw new Error("No such agent.");
  return { total: a.stats.total || 0, today: a.stats.daily[todayKey()] || 0, daily: a.stats.daily };
}

/**
 * Is the given agent currently within its configured "auto-reply" window?
 * awayMode.startHour/endHour define the owner's AVAILABLE hours (local
 * server time) — auto-reply only fires OUTSIDE that window. If away mode
 * isn't enabled, the agent always auto-replies.
 */
function isWithinAutoReplyWindow(agent) {
  const cfg = agent.awayMode;
  if (!cfg || !cfg.enabled) return true;
  const hour = new Date().getHours();
  const { startHour, endHour } = cfg;
  const inAvailableWindow =
    startHour <= endHour
      ? hour >= startHour && hour < endHour
      : hour >= startHour || hour < endHour; // wraps past midnight
  return !inAvailableWindow;
}

function setPersona(agentId, personaText) {
  const a = registry.agents[agentId];
  if (!a) throw new Error("No such agent.");
  a.persona = String(personaText || "").slice(0, 2000);
  saveRegistry(registry);
}

/**
 * Register the owner's own WhatsApp number so agents can recognize when
 * the owner themself is the one messaging (as opposed to a stranger DMing
 * the paired account). Stored globally, not per-agent, since it's the
 * same person regardless of which agent they text.
 */
function setOwnerNumber(number) {
  const digits = String(number || "").replace(/[^\d]/g, "");
  registry.ownerNumber = digits || null;
  saveRegistry(registry);
  return registry.ownerNumber;
}

function getOwnerNumber() {
  return registry.ownerNumber || null;
}

function isOwnerJid(jid) {
  const ownerNumber = getOwnerNumber();
  if (!ownerNumber || !jid) return false;
  return jid.startsWith(ownerNumber + "@") || jid.startsWith(ownerNumber + ":");
}

function setAwayMode(agentId, { enabled, startHour, endHour }) {
  const a = registry.agents[agentId];
  if (!a) throw new Error("No such agent.");
  a.awayMode = {
    enabled: !!enabled,
    startHour: Number.isFinite(startHour) ? startHour : a.awayMode.startHour,
    endHour: Number.isFinite(endHour) ? endHour : a.awayMode.endHour,
  };
  saveRegistry(registry);
  return a.awayMode;
}

/**
 * Start pairing a new WhatsApp number. Returns the pairing code the owner
 * types into WhatsApp > Linked Devices > Link with phone number instead.
 *
 * @param {string} number E.164-ish digits only, e.g. "15551234567"
 * @param {function} onReplyGenerate async (incomingText, jid, persona) => replyText
 */
async function pairNumber(number, onReplyGenerate, options = {}) {
    const {
        default: makeWASocket,
        useMultiFileAuthState
    } = getBaileys();

    const digits = String(number).replace(/[^\d]/g, "");

    if (!digits || digits.length < 8) {
        throw new Error(
            "Enter the number in international format, digits only."
        );
    }

    const agentId = digits;
    const dir = sessionDir(agentId);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(dir);

    let sock;

    function createSocket() {
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        sock.ev.on("creds.update", saveCreds);

        return sock;
    }

    sock = createSocket();

    return new Promise((resolve, reject) => {
        let settled = false;
        let pairingCodeSent = false;
        let pairingCode = null;

        const handleConnection = async (update) => {
            const {
                connection,
                lastDisconnect
            } = update;

            // ==============================
            // CONNECTED
            // ==============================

            if (connection === "open") {
                console.log(
                    `✅ WhatsApp connected: ${agentId}`
                );

                if (settled) return;

                settled = true;

                const agent =
                    ensureAgentRecord(
                        agentId,
                        digits
                    );

                agent.ultraPower =
                    !!options.ultraPower;

                saveRegistry(registry);

                liveSockets.set(
                    agentId,
                    sock
                );

                attachAutoReply(
                    agentId,
                    sock,
                    onReplyGenerate
                );

                // Spec §25: if a restart was owner-requested, let them know
                // we're back. Reads-and-clears, so this only ever fires once
                // per restart, and never fires on an ordinary reconnect that
                // wasn't preceded by a restartBot() call.
                try {
                    const { takePendingRestartNotice } = require("../src/owner/restartRequest");
                    const notice = takePendingRestartNotice();
                    if (notice?.chatJid) {
                        await sock.sendMessage(notice.chatJid, { text: "🌸 Back online." });
                    }
                } catch (err) {
                    console.error("whatsappService: restart-notice check failed:", err.message);
                }

                try {
                    if (options.ultraPower) {

                        if (
                            options.imagePath ||
                            options.bio
                        ) {
                            await updateAgentProfile(
                                agentId,
                                {
                                    imagePath:
                                        options.imagePath,
                                    bio:
                                        options.bio
                                }
                            );
                        }

                        if (
                            typeof options.onUltraReady ===
                            "function"
                        ) {
                            await options.onUltraReady(
                                agentId
                            );
                        }
                    }
                } catch (err) {
                    console.error(
                        "ultraPower setup failed:",
                        err.message
                    );
                }

                resolve({
                    agentId,
                    status: "connected",
                    pairingCode
                });

                return;
            }

            // ==============================
            // CLOSED
            // ==============================

            if (connection === "close") {

                const statusCode =
                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode;

                console.log(
                    `⚠️ WhatsApp closed: ${statusCode || "unknown"}`
                );

                // 515 means restart required
                if (statusCode === 515) {

                    console.log(
                        "🔄 Restarting Baileys socket..."
                    );

                    try {
                        sock.ev.off(
                            "connection.update",
                            handleConnection
                        );
                    } catch {}

                    setTimeout(() => {
                        sock = createSocket();

                        sock.ev.on(
                            "connection.update",
                            handleConnection
                        );
                    }, 1000);

                    return;
                }

                if (!settled) {

                    settled = true;

                    const error =
                        lastDisconnect?.error;

                    reject(
                        new Error(
                            "WhatsApp connection closed: " +
                            (
                                error?.message ||
                                "unknown error"
                            )
                        )
                    );
                }
            }
        };

        sock.ev.on(
            "connection.update",
            handleConnection
        );

        // ==============================
        // PAIRING CODE
        // ==============================

        setTimeout(async () => {

            try {

                if (
                    !sock.authState.creds.registered &&
                    !pairingCodeSent
                ) {

                    pairingCodeSent = true;

                    pairingCode =
                        await sock.requestPairingCode(
                            digits
                        );

                    console.log(
                        `📱 Pairing code: ${pairingCode}`
                    );

                    if (
                        typeof options.onPairingCode ===
                        "function"
                    ) {
                        await options.onPairingCode(
                            pairingCode
                        );
                    }
                }

            } catch (error) {

                console.error(
                    "❌ Pairing code error:",
                    error.message
                );

                if (!settled) {
                    settled = true;
                    reject(error);
                }
            }

        }, 1500);
    });
}
function attachAutoReply(agentId, sock, onReplyGenerate) {
  const groupMgr = require("./waGroupManager");
  const waMemory = require("./waMemory");
  const waImageGen = require("./waImageGen");
  const waVoice = require("./waVoice");
  const router = require("./waCommandRouter");
  const waFun = require("./waFunCommands"); // registers .ping/.8ball/.afk/.marry/.focus/... as a side effect
  const waGames = require("./waGames"); // registers .games/.play/.endgame as a side effect
  require("./waImageFun"); // registers .wanted/.wasted as a side effect
  require("./waMediaCommands"); // registers .pinterest/.art/.spongebob/.facebook as a side effect
  require("./waTelegramSticker"); // registers .tgsticker as a side effect
  require("./waUpdateCommand"); // registers .update as a side effect
  const adminPanel = require("./waAdminPanel"); // registers .panel/.antispam/.moderation/.flag as a side effect

  // Owner-agent layer (natural-language groups/moderation/scheduling/etc.).
  // Idempotent to call on every attachAutoReply (one per agent connect) —
  // scheduler.start() no-ops if its tick is already running, and
  // setSockProvider just reassigns a closure, so re-running this on a
  // reconnect is harmless.
  //
  // ⚠️ REQUIRE-ORDER WARNING — do not move these two requires to the top
  // of this file. There's a require cycle on paper: whatsappService.js ->
  // ownerRouter.js -> ownerAuth.js -> whatsappService.js (ownerAuth calls
  // whatsappService.isOwnerJid). It only works because these requires are
  // LAZY — they run inside attachAutoReply(), which only ever executes at
  // connection time (pairNumber / setActiveAgent), by which point Node has
  // already finished loading this file and cached its full module.exports
  // (isOwnerJid included). If either require below is hoisted to the top
  // of the file, ownerAuth.js would receive this module's exports object
  // mid-construction — before isOwnerJid is attached — and every owner
  // check would silently break. Keep the require here, not at the top.
  const ownerRouter = require("../src/owner/ownerRouter");
  const scheduler = require("../src/automation/scheduler");
  scheduler.setSockProvider((task) => {
    const agentSock = task.payload?._agentId ? liveSockets.get(task.payload._agentId) : null;
    return agentSock || liveSockets.get(getActiveAgentId()) || null; // same "first active agent" fallback used elsewhere in this file
  });
  scheduler.start();

  // ---- join flow: broadcast + menu image, and a sweep of inactive
  // members when an admin is the one who added the bot. Also
  // re-enforces bans: if someone on this group's ban list rejoins
  // (e.g. via an invite link), they're removed again immediately. ----
  // ---- Incoming calls: auto-reject while the owner's DND toggle is on.
  // Real Baileys 'call' event + real sock.rejectCall — the toggle itself
  // is bot-local state (src/owner/localStore.js), the rejection is not.
  // Fires for every offer in the call event array, not just the first,
  // since Baileys can report multiple call legs in one event.
  sock.ev.on("call", async (calls) => {
    try {
      const localStore = require("../src/owner/localStore");
      if (!localStore.isDndEnabled()) return;
      for (const call of calls) {
        if (call.status !== "offer") continue;
        try {
          await sock.rejectCall(call.id, call.from);
        } catch (err) {
          console.error("whatsappService: auto-reject call failed:", err.message);
        }
      }
    } catch (err) {
      console.error("whatsappService: call handler error:", err.message);
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { id: groupJid, participants, action, author } = update;
      const botId = groupMgr.normalizeJid(sock.user?.id);
      const botWasAdded = action === "add" && participants.some((p) => groupMgr.normalizeJid(p) === botId);

      if (action === "add" && !botWasAdded && (await groupMgr.isBotGroupAdmin(sock, groupJid))) {
        const banned = participants.filter((p) => groupMgr.isBanned(groupJid, groupMgr.normalizeJid(p)));
        if (banned.length) {
          try {
            await sock.groupParticipantsUpdate(groupJid, banned, "remove");
          } catch (err) {
            console.error("whatsappService: re-ban kick failed:", err.message);
          }
        }
      }

      if (!botWasAdded) return;

      await groupMgr.sendJoinBroadcast(sock, groupJid);

      const addedByAdmin = author && (await groupMgr.isSenderGroupAdmin(sock, groupJid, author));
      if (addedByAdmin) {
        const result = await groupMgr.scanAndKickInactive(sock, groupJid);
        if (result.removed) {
          await sock.sendMessage(groupJid, {
            text: `🧹 Cleaned up — removed ${result.removed} inactive member(s) with no message history in this group.`,
          });
        }
      }
    } catch (err) {
      console.error("whatsappService group-join handler error:", err.message);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    const agent = registry.agents[agentId];
    if (agent && !isWithinAutoReplyWindow(agent)) return; // owner's available hours — stay quiet

    for (const m of messages) {
      try {
        if (!m.message || m.key.fromMe) continue;
        // Baileys can redeliver the same message on reconnect — without
        // this, a command could fire twice (or a game move get applied
        // twice) from a single tap.
        if (router.alreadyHandled(m.key.id)) continue;

        const jid = m.key.remoteJid || "";
        const isGroup = jid.endsWith("@g.us");
        const senderJid = isGroup ? m.key.participant : jid;

        if (isGroup) {
          groupMgr.recordActivity(jid, groupMgr.normalizeJid(senderJid));
          // Owner-agent needs a real, full message key to pin/star/delete
          // "the last message" when asked from a private DM, where no
          // quoted-message context exists. Track it here, not there —
          // this fires for every real group message regardless of
          // whether the owner ever asks about it.
          try {
            require("../src/owner/lastMessageStore").recordMessage(
              jid,
              m.key,
              m.message.conversation || m.message.extendedTextMessage?.text || "",
              senderJid
            );
          } catch (err) {
            console.error("whatsappService: lastMessageStore.recordMessage failed:", err.message);
          }
        }

        const text =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          "";

        const ctx = { sock, jid, isGroup, senderJid, m, agent, isOwner: isOwnerJid(jid) };

        adminPanel.trackGlobalMessage(senderJid); // bot-wide counters for .panel

        // ---------------- GROUPS ----------------
        if (isGroup) {
          // A muted member's messages get silently deleted (requires the
          // bot to be a group admin — same precondition as antilink).
          if (groupMgr.isMuted(jid, groupMgr.normalizeJid(senderJid)) && (await groupMgr.isBotGroupAdmin(sock, jid))) {
            try {
              await sock.sendMessage(jid, { delete: m.key });
            } catch {}
            continue;
          }

          // Admin-only, no-prefix moderation commands.
          const cmd = groupMgr.matchAdminCommand(text);
          if (cmd) {
            const senderIsAdmin = await groupMgr.isSenderGroupAdmin(sock, jid, senderJid);
            if (!senderIsAdmin) continue; // group-management never obeys non-admins
            await handleAdminCommand(sock, groupMgr, jid, senderJid, cmd, m);
            continue;
          }

          // Auto-delete WhatsApp group invite links (only when the bot
          // itself is an admin, so it actually has permission to).
          const antilinkOn = antilinkState[jid] !== false; // on by default
          if (text && antilinkOn && groupMgr.containsGroupInviteLink(text) && (await groupMgr.isBotGroupAdmin(sock, jid))) {
            const senderIsAdmin = await groupMgr.isSenderGroupAdmin(sock, jid, senderJid);
            if (!senderIsAdmin) {
              try {
                await sock.sendMessage(jid, { delete: m.key });
              } catch {}
              continue;
            }
          }

          if (!text) continue;

          // Anti-spam / suspicious-conversation scoring — passive, never
          // blocks the message from reaching command handling below, and
          // never auto-deletes or auto-kicks (see waAdminPanel header).
          adminPanel.checkMessageForSpam({ sock, jid, senderJid, text });

          // '.'-prefixed commands (games, fun, utilities) — everyone,
          // not just admins.
          if (await router.tryHandle(text, ctx)) continue;

          // AFK welcome-back / "they're AFK" notices apply to every
          // group message, not just commands.
          await waFun.checkAfk({ sock, jid, senderJid, m, text });

          // An active game session takes priority over normal chat.
          if (await waGames.continueIfPlaying({ sock, jid, senderJid, text })) continue;

          if (!groupMgr.isMentionTriggered(text, m, sock.user?.id)) continue; // only reply in groups when mentioned

          // "who made you / who is your owner" etc. — answered directly,
          // correctly, every time, instead of leaving it to the external
          // AI model to improvise.
          if (await waIdentity.tryHandleIdentityQuestion({ sock, jid, text })) {
            recordReply(agentId);
            continue;
          }

          const reply = await onReplyGenerate(
            text.replace(/\b(aria|miss\s*aria|agent)\b/gi, "").trim() || text,
            jid,
            agent ? agent.persona : "",
            false
          );
          if (reply) {
            await sock.sendMessage(jid, { text: reply });
            recordReply(agentId);
          }
          continue;
        }

        // ---------------- DMs ----------------
        if (text) {
          // '.'-prefixed commands work in DMs too.
          if (await router.tryHandle(text, ctx)) continue;

          // Natural-language owner-agent commands (groups, moderation,
          // scheduling, diagnostics, etc.) — only for a private DM from the
          // confirmed owner (ctx.isOwner here means isOwnerJid(jid), and
          // jid IS the sender in a DM). Returns false for anything it
          // doesn't recognize, which falls through to normal AFK/games/AI
          // reply exactly as before — the owner can still just talk to
          // Miss Aria normally for anything that isn't a command.
          if (ctx.isOwner && (await ownerRouter.tryHandle({ sock, chatJid: jid, senderJid: jid, text, agentId, msg: m }))) {
            continue;
          }

          await waFun.checkAfk({ sock, jid, senderJid, m, text });

          if (await waGames.continueIfPlaying({ sock, jid, senderJid, text })) continue;
        }

        if (!text) {
          // Voice notes: transcribe, then reply in the same language.
          if (m.message.audioMessage) {
            const { transcript } = await waVoice.transcribeVoiceNote(m, getBaileys);
            if (transcript) {
              waMemory.appendTurn(jid, "user", transcript);
              const reply = await waVoice.replyMatchingLanguage(transcript, agent ? agent.persona : "");
              if (reply) {
                waMemory.appendTurn(jid, "assistant", reply);
                await sock.sendMessage(jid, { text: reply });
                recordReply(agentId);
              }
            }
          }
          continue;
        }

        if (waMemory.isClearMemoryRequest(text)) {
          waMemory.clearHistory(jid);
          await sock.sendMessage(jid, { text: "🧠 ∂σηє — ι’νє ¢ℓєαяє∂ єνєяутнιηg ι яємємвєяє∂ αвσυт συя ¢нαт." });
          continue;
        }

        // Image generation, with an animated "generating…" placeholder.
        const imgReq = waImageGen.detectImageRequest(text);
        if (imgReq.isImageRequest) {
          if (!imgReq.prompt) {
            await sock.sendMessage(jid, { text: "🎨 ѕυяє — ωнαт ωσυℓ∂ уσυ ℓιкє мє тσ gєηєяαтє?" });
            continue;
          }
          await handleImageGenRequest(sock, waImageGen, jid, imgReq.prompt);
          recordReply(agentId);
          continue;
        }

        waMemory.appendTurn(jid, "user", text);

        // "who made you / who is your owner" etc. — same deterministic
        // answer as in groups, checked before the external AI call.
        if (await waIdentity.tryHandleIdentityQuestion({ sock, jid, text })) {
          waMemory.appendTurn(jid, "assistant", waIdentity.IDENTITY_ANSWER);
          recordReply(agentId);
          continue;
        }

        const reply = await onReplyGenerate(text, jid, agent ? agent.persona : "", isOwnerJid(jid));
        if (reply) {
          waMemory.appendTurn(jid, "assistant", reply);
          await sock.sendMessage(jid, { text: reply });
          recordReply(agentId);
        }
      } catch (err) {
        console.error("whatsappService auto-reply error:", err.message);
      }
    }
  });
}

// Sends an animated "🎨 Generating…" placeholder (edited a few times so
// it feels alive), then swaps it for the finished image once ready.
async function handleImageGenRequest(sock, waImageGen, jid, prompt) {
 const frames = [
  "🎨 *gєηєяαтιηg уσυя ιмαgє…*",
  "🖌️ *ѕкєт¢нιηg ιт συт…*",
  "✨ *α∂∂ιηg тнє fιηαℓ ∂єтαιℓѕ…*",
];

  const placeholder = await sock.sendMessage(jid, { text: frames[0] });
  let frame = 1;
  const timer = setInterval(() => {
    if (frame >= frames.length) return;
    sock.sendMessage(jid, { text: frames[frame], edit: placeholder.key }).catch(() => {});
    frame++;
  }, 2500);

  try {
    const result = await waImageGen.generateImage(prompt);
    clearInterval(timer);

    if (!result.success) {
      await sock.sendMessage(jid, { text: "❌ ¢συℓ∂η’т gєηєяαтє тнαт ιмαgє — тяу αgαιη ιη α мσмєηт.", edit: placeholder.key });
      return;
    }

    await sock.sendMessage(jid, { image: result.image, caption: `🌸 "${prompt}"` });
    try {
      await sock.sendMessage(jid, { delete: placeholder.key });
    } catch {}
  } catch (err) {
    clearInterval(timer);
    console.error("handleImageGenRequest error:", err.message);
    try {
      await sock.sendMessage(jid, { text: "❌ ѕσмєтнιηg ωєηт ωяσηg gєηєяαтιηg тнαт ιмαgє.", edit: placeholder.key });
    } catch {}
  }
}

// Runs one of the no-prefix, admin-only group commands. Caller has
// already verified the sender is an admin.
async function handleAdminCommand(sock, groupMgr, groupJid, senderJid, cmd, m) {
  try {
    if (!(await groupMgr.isBotGroupAdmin(sock, groupJid)) && cmd !== "scan") {
      await sock.sendMessage(groupJid, { text: "⚠️ ι ηєє∂ тσ вє α gяσυρ α∂мιη тσ ∂σ тнαт." });
      return;
    }

   switch (cmd) {

  case "kick": {

    const target = groupMgr.getCommandTargetJid(m);

    if (!target) return sock.sendMessage(groupJid, { text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт яємσνє∂." });

    await sock.groupParticipantsUpdate(groupJid, [target], "remove");

    await sock.sendMessage(groupJid, { text: "✅ яємσνє∂." });

    return;

  }

  case "promote": {

    const target = groupMgr.getCommandTargetJid(m);

    if (!target) return sock.sendMessage(groupJid, { text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт ρяσмσтє∂." });

    await sock.groupParticipantsUpdate(groupJid, [target], "promote");

    await sock.sendMessage(groupJid, { text: "✅ ρяσмσтє∂ тσ α∂мιη." });

    return;

  }

  case "demote": {

    const target = groupMgr.getCommandTargetJid(m);

    if (!target) return sock.sendMessage(groupJid, { text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт ∂ємσтє∂." });

    await sock.groupParticipantsUpdate(groupJid, [target], "demote");

    await sock.sendMessage(groupJid, { text: "✅ ∂ємσтє∂." });

    return;

  }

  case "antilinkOn":
    setAntilink(groupJid, true);
    await sock.sendMessage(groupJid, { text: "🔗🚫 αηтι-ℓιηк ιѕ ησω ση — ιηνιтє ℓιηкѕ fяσм ηση-α∂мιηѕ gєт ∂єℓєтє∂." });
    return;

      case "antilinkOff":
  setAntilink(groupJid, false);
  await sock.sendMessage(groupJid, { text: "🔗 αηтι-ℓιηк ιѕ ησω σff." });
  return;

case "scan": {
  const result = await groupMgr.scanAndKickInactive(sock, groupJid);
  await sock.sendMessage(groupJid, {
    text: result.error
      ? `❌ ѕ¢αη fαιℓє∂: ${result.error}`
      : `🧹 яємσνє∂ ${result.removed} ιηα¢тινє мємвєя(ѕ).`,
  });
  return;
}

case "setpp": {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imgMsg = quoted?.imageMessage || m.message?.imageMessage;

  if (!imgMsg)
    return sock.sendMessage(groupJid, {
      text: "ѕєη∂/яєρℓу тσ αη ιмαgє ωιтн 'ѕєтρρ' тσ υѕє ιт αѕ тнє gяσυρ ρι¢тυяє.",
    });

  const { downloadContentFromMessage } = getBaileys();
  const stream = await downloadContentFromMessage(imgMsg, "image");
  const chunks = [];

  for await (const chunk of stream) chunks.push(chunk);

  await sock.updateProfilePicture(groupJid, Buffer.concat(chunks));
  await sock.sendMessage(groupJid, { text: "✅ gяσυρ ρι¢тυяє υρ∂αтє∂." });
  return;
}

// ---- moderation, added this round ----

case "mute": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт тσ мυтє. σρтισηαℓℓу α∂∂ α ∂υяαтιση: мυтє @υѕєя 10м",
    });

  const durationText =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    "";

  const durationMatch = /mute\s*\S*\s*(\d+[mhd])/i.exec(durationText);
  const durationMs = durationMatch
    ? groupMgr.parseDuration(durationMatch[1])
    : null;

  groupMgr.muteUser(
    groupJid,
    groupMgr.normalizeJid(target),
    durationMs
  );

  await sock.sendMessage(groupJid, {
    text: `🔇 мυтє∂${durationMs ? ` fσя ${durationMatch[1]}` : " υηтιℓ мαηυαℓℓу υηмυтє∂"}. тнєιя мєѕѕαgєѕ ωιℓℓ вє ∂єℓєтє∂.`,
  });
  return;
}

case "unmute": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт тσ υηмυтє.",
    });

  groupMgr.unmuteUser(
    groupJid,
    groupMgr.normalizeJid(target)
  );

  await sock.sendMessage(groupJid, { text: "🔊 υηмυтє∂." });
  return;
}

case "warn": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт тσ ωαяη.",
    });

  const normalized = groupMgr.normalizeJid(target);
  const count = groupMgr.addWarn(groupJid, normalized);

  if (count >= groupMgr.WARN_LIMIT) {
    try {
      await sock.groupParticipantsUpdate(groupJid, [target], "remove");
      groupMgr.resetWarns(groupJid, normalized);

      await sock.sendMessage(groupJid, {
        text: `⚠️ яєα¢нє∂ ${groupMgr.WARN_LIMIT} ωαяηѕ — яємσνє∂.`,
      });
    } catch (err) {
      await sock.sendMessage(groupJid, {
        text: `⚠️ ωαяη ${count}/${groupMgr.WARN_LIMIT} (αυтσ-кι¢к fαιℓє∂: ${err.message})`,
      });
    }
  } else {
    await sock.sendMessage(groupJid, {
      text: `⚠️ ωαяη ${count}/${groupMgr.WARN_LIMIT}.`,
    });
  }

  return;
}

case "warns": {
  const target =
    groupMgr.getCommandTargetJid(m) || senderJid;

  const count = groupMgr.getWarns(
    groupJid,
    groupMgr.normalizeJid(target)
  );

  await sock.sendMessage(groupJid, {
    text: `⚠️ ${count}/${groupMgr.WARN_LIMIT} ωαяηѕ.`,
  });

  return;
}

case "unwarn": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт тσ яємσνє σηє ωαяη fяσм.",
    });

  groupMgr.clearWarn(
    groupJid,
    groupMgr.normalizeJid(target)
  );

  await sock.sendMessage(groupJid, {
    text: "✅ яємσνє∂ σηє ωαяη.",
  });

  return;
}

case "resetwarns": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя ωнσѕє ωαяηѕ уσυ ωαηт тσ яєѕєт.",
    });

  groupMgr.resetWarns(
    groupJid,
    groupMgr.normalizeJid(target)
  );

  await sock.sendMessage(groupJid, {
    text: "✅ ωαяηѕ яєѕєт.",
  });

  return;
}

case "lock": {
  await groupMgr.setGroupLocked(sock, groupJid, true);

  await sock.sendMessage(groupJid, {
    text: "🔒 ℓσ¢кє∂ — σηℓу α∂мιηѕ ¢αη ѕєη∂ мєѕѕαgєѕ ησω.",
  });

  return;
}

case "unlock": {
  await groupMgr.setGroupLocked(sock, groupJid, false);

  await sock.sendMessage(groupJid, {
    text: "🔓 υηℓσ¢кє∂ — єνєяуσηє ¢αη ѕєη∂ мєѕѕαgєѕ αgαιη.",
  });

  return;
}

case "tag": {
  const meta = await groupMgr.getGroupMetadata(sock, groupJid);

  if (!meta)
    return sock.sendMessage(groupJid, {
      text: "❌ ¢συℓ∂η’т яєα∂ gяσυρ мємвєяѕ.",
    });

  const text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    "";

  const message =
    text.replace(/^tag\s*/i, "").trim() || "📢";

  const ids = meta.participants.map((p) => p.id);

  await sock.sendMessage(groupJid, {
    text: `${message}\n\n${ids
      .map((j) => "@" + j.split("@")[0])
      .join(" ")}`,
    mentions: ids,
  });

  return;
}

case "untag": {
  await sock.sendMessage(groupJid, {
    text: "✅ ∂σηє.",
  });

  return;
}

case "ban": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт тσ вαη.",
    });

  groupMgr.banUser(
    groupJid,
    groupMgr.normalizeJid(target)
  );

  try {
    await sock.groupParticipantsUpdate(
      groupJid,
      [target],
      "remove"
    );
  } catch {}

  await sock.sendMessage(groupJid, {
    text: "🚫 вαηηє∂ — яємσνє∂, αη∂ вℓσ¢кє∂ fяσм яєנσιηιηg νια ιηνιтє ℓιηк.",
  });

  return;
}

case "unban": {
  const target = groupMgr.getCommandTargetJid(m);

  if (!target)
    return sock.sendMessage(groupJid, {
      text: "тαg σя яєρℓу тσ тнє мємвєя уσυ ωαηт тσ υηвαη (тнєу'ℓℓ ѕтιℓℓ ηєє∂ α fяєѕн ιηνιтє).",
    });

  groupMgr.unbanUser(
    groupJid,
    groupMgr.normalizeJid(target)
  );

  await sock.sendMessage(groupJid, {
    text: "✅ υηвαηηє∂ — тнєу ¢αη яєנσιη ησω.",
  });

  return;
}

case "setgroupname": {
  const text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    "";

  const name =
    text.replace(/^setgroupname\s+/i, "").trim();

  if (!name)
    return sock.sendMessage(groupJid, {
      text: "👉 υѕαgє: ѕєтgяσυρηαмє <ηєω ηαмє>",
    });

  try {
    await sock.groupUpdateSubject(groupJid, name);

    await sock.sendMessage(groupJid, {
      text: "✅ gяσυρ ηαмє υρ∂αтє∂.",
    });
  } catch (err) {
    await sock.sendMessage(groupJid, {
      text: `❌ ¢συℓ∂η’т ѕєт тнє ηαмє: ${err.message}`,
    });
  }

  return;
}

case "setgroupdesc": {
  const text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    "";

  const desc =
    text.replace(/^setgroupdesc\s+/i, "").trim();

  if (!desc)
    return sock.sendMessage(groupJid, {
      text: "👉 υѕαgє: ѕєтgяσυρ∂єѕ¢ <ηєω ∂єѕ¢яιρтιση>",
    });

  try {
    await sock.groupUpdateDescription(groupJid, desc);

    await sock.sendMessage(groupJid, {
      text: "✅ gяσυρ ∂єѕ¢яιρтιση υρ∂αтє∂.",
    });
  } catch (err) {
    await sock.sendMessage(groupJid, {
      text: `❌ ¢συℓ∂η’т ѕєт тнє ∂єѕ¢яιρтιση: ${err.message}`,
    });
  }

  return;
}

case "link": {
  try {
    const code = await sock.groupInviteCode(groupJid);

    await sock.sendMessage(groupJid, {
      text: `🔗 ιηνιтє ℓιηк: https://chat.whatsapp.com/${code}`,
    });
  } catch (err) {
    await sock.sendMessage(groupJid, {
      text: `❌ ¢συℓ∂η’т gєт αη ιηνιтє ℓιηк: ${err.message}`,
    });
  }

  return;
}
      case "adminlist": {
        const meta = await groupMgr.getGroupMetadata(sock, groupJid);
        if (!meta) return sock.sendMessage(groupJid, { text: "❌ ¢συℓ∂η’т яєα∂ gяσυρ мємвєяѕ." });
        const admins = meta.participants.filter((p) => p.admin);
        if (!admins.length) return sock.sendMessage(groupJid, { text: "ησ α∂мιηѕ fσυη∂." });
        const ids = admins.map((a) => a.id);
        await sock.sendMessage(groupJid, {
          text: "👑 α∂мιηѕ:\n" + admins.map((a) => `- @${a.id.split("@")[0]}${a.admin === "superadmin" ? " (σωηєя)" : ""}`).join("\n"),
          mentions: ids,
        });
        return;
      }
      case "del": {
        const quotedKey = m.message?.extendedTextMessage?.contextInfo;
        if (!quotedKey?.stanzaId) return sock.sendMessage(groupJid, { text: "👉 яєρℓу тσ тнє мєѕѕαgє уσυ ωαηт ∂єℓєтє∂ ωιтн '∂єℓ'." });
        try {
          await sock.sendMessage(groupJid, {
            delete: {
              remoteJid: groupJid,
              id: quotedKey.stanzaId,
              participant: quotedKey.participant,
              fromMe: false,
            },
          });
        } catch (err) {
          await sock.sendMessage(groupJid, { text: `❌ ¢συℓ∂η’т ∂єℓєтє: ${err.message}` });
        }
        return;
      }
    }
  } catch (err) {
    console.error("handleAdminCommand error:", err.message);
    await sock.sendMessage(groupJid, { text: `❌ ${err.message}` }).catch(() => {});
  }
}

// ---- anti-link on/off state, per group ----
const antilinkFile = path.join(AGENTS_DIR, "..", "antilink.json");
function loadAntilink() {
  if (!fs.existsSync(antilinkFile)) return {};
  try { return JSON.parse(fs.readFileSync(antilinkFile, "utf8")); } catch { return {}; }
}
const antilinkState = loadAntilink();
function setAntilink(groupJid, on) {
  antilinkState[groupJid] = on;
  fs.writeFileSync(antilinkFile, JSON.stringify(antilinkState, null, 2));
}

// Matches the "on by default" convention already used at the antilink
// enforcement call site above (`antilinkState[jid] !== false`) — added so
// the new moderation-status tool can read the same state without
// duplicating that convention.
function isAntilinkEnabled(groupJid) {
  return antilinkState[groupJid] !== false;
}

/**
 * Update a live agent's WhatsApp profile picture and/or bio/status.
 * Only works while that agent is connected.
 */
async function updateAgentProfile(agentId, { imagePath, bio } = {}) {
  const sock = liveSockets.get(agentId);
  if (!sock) {
    throw new Error(`Agent ${agentId} isn't connected right now, so its profile can't be updated.`);
  }
  if (imagePath) {
    await sock.updateProfilePicture(sock.user.id, { url: imagePath });
  }
  if (bio) {
    await sock.updateProfileStatus(bio);
  }
}

/**
 * Activate (connect + start auto-replying) a paired agent. Other active
 * agents are left running — several agents can be active in parallel.
 */
async function setActiveAgent(agentId, onReplyGenerate) {

  const { default: makeWASocket, useMultiFileAuthState } = getBaileys();

  if (!registry.agents[agentId]) {

    throw new Error("ησ ѕυ¢н αgєηт. υѕє /αgєηтѕ тσ ѕєє ραιяє∂ ηυмвєяѕ.");

  }

  if (liveSockets.has(agentId)) {

    return { agentId, status: "already-active" };

  }

  const dir = sessionDir(agentId);

  const { state, saveCreds } = await useMultiFileAuthState(dir);

  const sock = makeWASocket({ auth: state, printQRInTerminal: false });

  sock.ev.on("creds.update", saveCreds);

  attachAutoReply(agentId, sock, onReplyGenerate);

  liveSockets.set(agentId, sock);

  return { agentId, status: "activated" };

}
/**
 * Turn a single agent off without unpairing it — its session stays saved
 * and can be reactivated later with setActiveAgent. Other active agents
 * (if any) keep running.
 */
function deactivateAgent(agentId) {
  const sock = liveSockets.get(agentId);
  if (!sock) {
    throw new Error(`Agent ${agentId} isn't active.`);
  }
  try {
    sock.end();
  } catch {}
  liveSockets.delete(agentId);
  return { agentId, status: "deactivated" };
}

function unpairAgent(agentId) {
  if (!registry.agents[agentId]) {
    throw new Error("No such agent.");
  }
  const sock = liveSockets.get(agentId);
  if (sock) {
    try {
      sock.logout();
    } catch {}
    liveSockets.delete(agentId);
  }
  delete registry.agents[agentId];
  saveRegistry(registry);

  const dir = sessionDir(agentId);
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = {
  pairNumber,
  setActiveAgent,
  deactivateAgent,
  unpairAgent,
  listAgents,
  getActiveAgentId,
  getActiveAgentIds,
  updateAgentProfile,
  setPersona,
  setAwayMode,
  getAgentStats,
  setOwnerNumber,
  getOwnerNumber,
  isOwnerJid,
  isAntilinkEnabled,
  setAntilink,
  getSocketByAgentId,
};
