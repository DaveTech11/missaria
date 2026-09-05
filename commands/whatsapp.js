// commands/whatsapp.js
// Owner-only commands to pair, list, activate/deactivate, and remove
// WhatsApp agents — several can run in parallel. Requires bot.js to pass
// in { isOwner } so this stays consistent with the existing admin system
// instead of re-implementing owner checks.

const whatsappService = require("../services/whatsappService");
const { restyle } = require("../utils/fancyFont");
const { generateText } = require("../services/aiService");
const knowledgeStore = require("../src/owner/knowledgeStore");
const usageAnalytics = require("../src/owner/usageAnalytics");

module.exports = function registerWhatsapp(bot, { isOwner, state, sleep }) {
  async function replyFromAI(incomingText, jid, persona, isOwnerMessage) {
    try {
      const basePersona =
        persona && persona.trim()
          ? persona.trim()
          : "You are replying to a WhatsApp DM as the account owner's personal AI assistant.";

      const ownerNote = isOwnerMessage
        ? " The person messaging you right now is Dave Tech, your owner and creator — you answer to them. " +
          "Address them with real respect and warmth (not stiff or robotic), prioritize whatever they're asking, " +
          "and never brush them off or treat them like a random contact."
        : "";

      // Real learning mechanism: anything the owner has told Aria to
      // remember (via "remember that ..." in the owner-agent router)
      // actually gets included here, so it genuinely changes what the AI
      // says — not a cosmetic "I'm learning!" indicator with no effect.
      // Only injected for the owner's own conversation; a random contact
      // never sees or benefits from the owner's private taught facts.
      const ownerJid = whatsappService.getOwnerNumber ? whatsappService.getOwnerNumber() : null;
      const learnedNote = isOwnerMessage && ownerJid ? knowledgeStore.getInjectedKnowledgeText(ownerJid + "@s.whatsapp.net") : "";

      const text = await generateText({
        prompt: incomingText,
        system: basePersona + ownerNote + learnedNote + " Keep replies short, natural, and casual — like a real text message, not an email.",
        maxTokens: 300,
      });
      if (usageAnalytics?.recordAiReply) usageAnalytics.recordAiReply({ isOwnerMessage });
      return text;
    } catch (err) {
      console.error("WA auto-reply generation failed:", err.message);
      return null;
    }
  }

  // Announce to every Telegram user who has started the bot. Reuses the
  // same started-users list and rate-limit pacing as /broadcast.
  async function broadcastToBotUsers(text) {
    if (!state || !state.users) return { sent: 0, failed: 0 };
    const recipients = Object.entries(state.users).filter(([, u]) => u.started);
    let sent = 0;
    let failed = 0;
    for (const [uid] of recipients) {
      try {
        await bot.sendMessage(uid, text, { parse_mode: "Markdown" });
        sent++;
      } catch {
        failed++;
      }
      await sleep(40);
    }
    return { sent, failed };
  }

  bot.onText(
    /^\/pair(?:@\w+)?(?:\s+(\S+))?(?:\s+(ultra))?$/i,
    async (msg, match) => {

        const userId = msg.from.id;
        const chatId = msg.chat.id;

        if (!isOwner(userId)) {
            return bot.sendMessage(
                chatId,
                "⛔ Only the bot owner can pair WhatsApp numbers."
            );
        }

        const number = (match[1] || "").trim();
        const isUltra = !!match[2];

        if (!number) {
            return bot.sendMessage(
                chatId,
                "Usage: /pair <number> [ultra]\n" +
                "Example: /pair 15551234567 ultra"
            );
        }

        const waitMsg = await bot.sendMessage(
            chatId,
            isUltra
                ? "📲 Requesting pairing code for ⚡ ultra agent…"
                : "📲 Requesting pairing code…"
        );

        try {

            const result = await whatsappService.pairNumber(
                number,
                replyFromAI,
                {
                    ultraPower: isUltra,

                    imagePath: isUltra
                        ? "https://files.catbox.moe/e5gc4f.jpg"
                        : undefined,

                    bio: isUltra
                        ? "⚡ Ultra Agent — powered by Miss Aria"
                        : undefined,

                    // ==================================
                    // SEND PAIRING CODE TO TELEGRAM
                    // ==================================

                    onPairingCode: async (code) => {

                        await bot.editMessageText(
                            `📲 <b>ᴡʜᴀᴛꜱᴀᴘᴘ ᴘᴀɪʀɪɴɢ</b>${isUltra ? " — ⚡ <b>ᴜʟᴛʀᴀ</b>" : ""}

<b>1.</b> Open WhatsApp on <code>+${number}</code>

<b>2.</b> Go to:
Settings → Linked Devices

<b>3.</b> Tap:
<b>Link a Device</b>

<b>4.</b> Select:
<b>Link with phone number instead</b>

🔐 <b>Pairing Code:</b>

<code>${code}</code>

⚠️ Enter this code on the WhatsApp account you are pairing.

⏳ Waiting for WhatsApp connection...`,
                            {
                                chat_id: chatId,
                                message_id: waitMsg.message_id,
                                parse_mode: "HTML"
                            }
                        );
                    },

                    onUltraReady: async (agentId) => {

                        const {
                            sent,
                            failed
                        } = await broadcastToBotUsers(
                            `⚡ *${restyle("New Ultra Agent Live")}*\n\n` +
                            `Agent \`${agentId}\` just connected, ` +
                            `with a refreshed profile and status.`
                        );

                        console.log(
                            `Ultra agent announce: sent ${sent}, failed ${failed}`
                        );
                    }
                }
            );

            // ==================================
            // CONNECTED
            // ==================================

            if (result.status === "connected") {

                await bot.editMessageText(
                    `✅ <b>ᴡʜᴀᴛꜱᴀᴘᴘ ᴀɢᴇɴᴛ ᴄᴏɴɴᴇᴄᴛᴇᴅ</b>

🤖 Agent:
<code>${result.agentId}</code>

${isUltra
    ? "⚡ Ultra mode is active."
    : "🟢 Auto-reply is active."}`,
                    {
                        chat_id: chatId,
                        message_id: waitMsg.message_id,
                        parse_mode: "HTML"
                    }
                );
            }

        } catch (err) {

            console.error(
                "❌ Pairing command error:",
                err
            );

            try {

                await bot.editMessageText(
                    `❌ <b>Pairing failed</b>

<code>${err.message}</code>`,
                    {
                        chat_id: chatId,
                        message_id: waitMsg.message_id,
                        parse_mode: "HTML"
                    }
                );

            } catch (editError) {

                console.error(
                    "Failed to update Telegram message:",
                    editError.message
                );

            }
        }
    }
);
  // /setownerwa <number> — register the owner's own WhatsApp number so
  // every agent recognizes when it's the owner texting them, not a
  // stranger, and replies with real deference instead of generic tone.
  bot.onText(/^\/setownerwa(?:@\w+)?(?:\s+(\S+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can set this.");
    }

    const number = (match[1] || "").trim();
    if (!number) {
      const current = whatsappService.getOwnerNumber();
      return bot.sendMessage(
        chatId,
        current
          ? `Currently set: \`+${current}\`\nUsage: /setownerwa <number> to change it.`
          : "Usage: /setownerwa <number>\nExample: /setownerwa 15551234567 (your own WhatsApp number, digits only)."
      );
    }

    const saved = whatsappService.setOwnerNumber(number);
    await bot.sendMessage(
      chatId,
      `✅ All agents will now recognize \`+${saved}\` as you and reply with respect and priority.`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/^\/agents(?:@\w+)?$/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can view agents.");
    }

    const agents = whatsappService.listAgents();
    const activeIds = new Set(whatsappService.getActiveAgentIds());

    if (agents.length === 0) {
      return bot.sendMessage(chatId, "No WhatsApp agents paired yet. Use /pair <number> to add one.");
    }

    const lines = agents.map((a) => {
      const live = activeIds.has(a.id) ? "🟢 active" : "⚪ idle";
      const away = a.awayMode?.enabled ? ` 🌙 away-mode ${a.awayMode.startHour}-${a.awayMode.endHour}h` : "";
      return `• ${a.label} — \`${a.id}\` — ${live}${a.ultraPower ? " ⚡" : ""}${away}`;
    });

    await bot.sendMessage(
      chatId,
      `📋 *${restyle("WhatsApp Agents")}* (${activeIds.size} active of ${agents.length})\n\n${lines.join("\n")}`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/^\/setagent(?:@\w+)?(?:\s+(\S+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can activate agents.");
    }

    const agentId = (match[1] || "").trim();
    if (!agentId) {
      return bot.sendMessage(chatId, "Usage: /setagent <id>\nSee /agents for ids. Other active agents stay running.");
    }

    const waitMsg = await bot.sendMessage(chatId, "🔄 Activating agent…");

    try {
      const result = await whatsappService.setActiveAgent(agentId, replyFromAI);
      const already = result.status === "already-active";
      await bot.editMessageText(
        already
          ? `ℹ️ Agent \`${agentId}\` was already active.`
          : `✅ Agent \`${agentId}\` is now active and auto-replying (alongside any other active agents).`,
        { chat_id: chatId, message_id: waitMsg.message_id, parse_mode: "Markdown" }
      );
    } catch (err) {
      await bot.editMessageText(`❌ ${err.message}`, {
        chat_id: chatId,
        message_id: waitMsg.message_id,
      });
    }
  });

  bot.onText(/^\/agentoff(?:@\w+)?(?:\s+(\S+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can turn an agent off.");
    }

    const agentId = (match[1] || "").trim();
    if (!agentId) {
      return bot.sendMessage(chatId, "Usage: /agentoff <id>\nSee /agents for which ones are active.");
    }

    try {
      const result = whatsappService.deactivateAgent(agentId);
      await bot.sendMessage(
        chatId,
        `🔴 Agent \`${result.agentId}\` is now off. Still paired — /setagent to bring it back, /agents to see all.`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      await bot.sendMessage(chatId, `❌ ${err.message}`);
    }
  });

  bot.onText(/^\/unpair(?:@\w+)?(?:\s+(\S+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can unpair agents.");
    }

    const agentId = (match[1] || "").trim();
    if (!agentId) {
      return bot.sendMessage(chatId, "Usage: /unpair <id>\nSee /agents for ids.");
    }

    try {
      whatsappService.unpairAgent(agentId);
      await bot.sendMessage(chatId, `🗑️ Agent \`${agentId}\` removed.`, { parse_mode: "Markdown" });
    } catch (err) {
      await bot.sendMessage(chatId, `❌ ${err.message}`);
    }
  });

  // /agentpersona <id> <text> — per-agent auto-reply tone/persona.
  // /agentpersona <id> reset clears it back to the default.
  bot.onText(/^\/agentpersona(?:@\w+)?(?:\s+(\S+))?(?:\s+([\s\S]+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can set an agent's persona.");
    }

    const agentId = (match[1] || "").trim();
    const text = (match[2] || "").trim();

    if (!agentId || !text) {
      return bot.sendMessage(
        chatId,
        "Usage: /agentpersona <id> <how this agent should talk>\nOr /agentpersona <id> reset for the default tone."
      );
    }

    try {
      whatsappService.setPersona(agentId, text.toLowerCase() === "reset" ? "" : text);
      await bot.sendMessage(
        chatId,
        text.toLowerCase() === "reset"
          ? `✅ Agent \`${agentId}\` reset to the default reply persona.`
          : `✅ Agent \`${agentId}\`'s persona updated.`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      await bot.sendMessage(chatId, `❌ ${err.message}`);
    }
  });

  // /awaymode <id> <startHour> <endHour> — auto-reply fires only OUTSIDE
  // this window (i.e. this is when the owner is normally available).
  // /awaymode <id> off disables it (agent always auto-replies).
  bot.onText(/^\/awaymode(?:@\w+)?(?:\s+(\S+))?(?:\s+(\S+))?(?:\s+(\S+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can set away mode.");
    }

    const agentId = (match[1] || "").trim();
    const arg2 = (match[2] || "").trim();
    const arg3 = (match[3] || "").trim();

    if (!agentId || !arg2) {
      return bot.sendMessage(
        chatId,
        "Usage: /awaymode <id> <availableStartHour> <availableEndHour>\n" +
          "Example: /awaymode 15551234567 9 18 — auto-replies only outside 9am-6pm (server time).\n" +
          "Or: /awaymode <id> off — always auto-reply."
      );
    }

    try {
      if (arg2.toLowerCase() === "off") {
        whatsappService.setAwayMode(agentId, { enabled: false });
        return bot.sendMessage(chatId, `✅ Away mode off for \`${agentId}\` — it will always auto-reply.`, { parse_mode: "Markdown" });
      }

      const startHour = parseInt(arg2, 10);
      const endHour = parseInt(arg3, 10);
      if (!Number.isFinite(startHour) || !Number.isFinite(endHour) || startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        return bot.sendMessage(chatId, "Hours must be 0-23. Example: /awaymode 15551234567 9 18");
      }

      whatsappService.setAwayMode(agentId, { enabled: true, startHour, endHour });
      await bot.sendMessage(
        chatId,
        `✅ Agent \`${agentId}\` set: available ${startHour}:00–${endHour}:00 (server time), auto-replies only outside that window.`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      await bot.sendMessage(chatId, `❌ ${err.message}`);
    }
  });

  // /agentstats [id] — replies sent today/total. Omit id to see a summary
  // across every paired agent.
  bot.onText(/^\/agentstats(?:@\w+)?(?:\s+(\S+))?$/, async (msg, match) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    if (!isOwner(userId)) {
      return bot.sendMessage(chatId, "⛔ Only the bot owner can view agent stats.");
    }

    const agentId = (match[1] || "").trim();

    try {
      if (agentId) {
        const stats = whatsappService.getAgentStats(agentId);
        return bot.sendMessage(
          chatId,
          `📊 *Agent \`${agentId}\`*\n\nReplied today: ${stats.today}\nReplied all-time: ${stats.total}`,
          { parse_mode: "Markdown" }
        );
      }

      const agents = whatsappService.listAgents();
      if (agents.length === 0) {
        return bot.sendMessage(chatId, "No agents paired yet.");
      }
      const lines = agents.map((a) => {
        const stats = whatsappService.getAgentStats(a.id);
        return `• ${a.label} — today: ${stats.today}, total: ${stats.total}`;
      });
      await bot.sendMessage(chatId, `📊 *${restyle("Agent Reply Stats")}*\n\n${lines.join("\n")}`, { parse_mode: "Markdown" });
    } catch (err) {
      await bot.sendMessage(chatId, `❌ ${err.message}`);
    }
  });
};
