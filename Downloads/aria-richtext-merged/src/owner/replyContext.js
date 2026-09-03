// src/owner/replyContext.js
'use strict';

function normalizeJid(jid) {
  return jid ? String(jid).replace(/:\d+@/, "@") : jid;
}

/**
 * Extracts a real, Baileys-shaped message key for whatever the owner's
 * current message is quoting (replying to). Returns null if the current
 * message isn't a reply at all.
 *
 * fromMe/participant is well-defined for GROUP chats — Baileys'
 * contextInfo.participant identifies who actually sent the quoted message
 * within the group, compared against the bot's own (device-suffix-
 * normalized) jid. For 1:1 DMs it's less certain: some Baileys forks omit
 * `participant` entirely on a quoted message in a direct chat. Handled
 * with a reasonable fallback below, flagged rather than silently assumed.
 */
function getQuotedMessageKey(msg, botJid) {
  const ctxInfo =
    msg?.message?.extendedTextMessage?.contextInfo ||
    msg?.message?.imageMessage?.contextInfo ||
    msg?.message?.videoMessage?.contextInfo;
  if (!ctxInfo?.stanzaId) return null;

  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid?.endsWith("@g.us");
  const normalizedBotJid = normalizeJid(botJid);
  const normalizedParticipant = normalizeJid(ctxInfo.participant);

  if (isGroup) {
    const fromMe = normalizedParticipant === normalizedBotJid;
    const key = { id: ctxInfo.stanzaId, remoteJid, fromMe };
    if (!fromMe) key.participant = ctxInfo.participant;
    return key;
  }

  // 1:1 DM — no participant field needed on the delete key itself; fromMe
  // reflects whether the quoted message originally came from the bot.
  const fromMe = !ctxInfo.participant || normalizedParticipant === normalizedBotJid;
  return { id: ctxInfo.stanzaId, remoteJid, fromMe };
}

module.exports = { getQuotedMessageKey, normalizeJid };
