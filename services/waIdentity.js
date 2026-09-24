// services/waIdentity.js
//
// Handles "who made you / who is your owner / who is Dave Tech"
// style questions with a fixed, correct answer instead of leaving it
// to the external AI model to improvise (onReplyGenerate — the actual
// LLM call and its system prompt — lives outside this codebase, in
// whatever server wires attachAutoReply up, so it isn't something
// this update can directly edit). This intercept runs BEFORE that
// call, so the answer is always right regardless of what that model
// does or doesn't know.
//
// The facts here match what's already canon on the Telegram side of
// this same bot (bot.js: BOT_INFO.owner = "Dave TecH", ownerRole =
// "Owner & Creator", coPartner = "Sukuna", the Davetechdmbot contact
// link, and the "© Dave Tech" footer) — nothing here is invented,
// it's the existing bio ported to WhatsApp for consistency.

const IDENTITY_RE = /\b(who\s+(made|created|built|developed|owns|is\s+your\s+owner)|your\s+(owner|creator|developer)|who'?s?\s+your\s+(owner|creator|developer)|are\s+you\s+(my\s+)?(owner|dave\s*tech)|is\s+dave\s*tech\s+(your|ur)\s+owner|who\s+is\s+dave\s*tech)\b/i;

const IDENTITY_ANSWER = `🌸 ᴀʙᴏᴜᴛ ᴍɪss ᴀʀɪᴀ
✨ ɪ’ᴍ ᴍɪss ᴀʀɪᴀ — ᴀɴ ᴀᴅᴠᴀɴᴄᴇᴅ ᴀɪ-ᴘᴏᴡᴇʀᴇᴅ ᴀssɪsᴛᴀɴᴛ ᴄʀᴇᴀᴛᴇᴅ, ᴅᴇᴠᴇʟᴏᴘᴇᴅ, ᴀɴᴅ ᴘʀᴏᴜᴅʟʏ ᴏᴡɴᴇᴅ ʙʏ ᴅᴀᴠᴇ ᴛᴇᴄʜ 👑
🛠️ ᴅᴇᴠᴇʟᴏᴘᴇʀ & ᴏᴡɴᴇʀ: ᴅᴀᴠᴇ ᴛᴇᴄʜ
🤝 ᴄᴏ-ᴘᴀʀᴛɴᴇʀ: sᴜᴋᴜɴᴀ
ғʀᴏᴍ ᴛᴇʟᴇɢʀᴀᴍ ᴛᴏ ᴡʜᴀᴛsᴀᴘᴘ, ᴍɪss ᴀʀɪᴀ ɪs ʙᴜɪʟᴛ ᴀɴᴅ ᴍᴀɪɴᴛᴀɪɴᴇᴅ ᴀs ᴏɴᴇ ᴜɴɪғɪᴇᴅ ᴘʀᴏᴊᴇᴄᴛ.
🤖 ᴀɪ ᴛᴏᴏʟs
🎮 ɢᴀᴍᴇs
👥 ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ
🖼️ ɪᴍᴀɢᴇ & ᴀɪ ᴛᴏᴏʟs
⚡ ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ
✨ ᴀɴᴅ ᴍᴜᴄʜ ᴍᴏʀᴇ
🚀 ʙᴜɪʟᴛ ᴡɪᴛʜ ᴠɪsɪᴏɴ. ᴍᴀɪɴᴛᴀɪɴᴇᴅ ᴡɪᴛʜ ᴘᴀssɪᴏɴ. ᴄᴏɴsᴛᴀɴᴛʟʏ ᴜᴘɢʀᴀᴅᴇᴅ.
👑 ᴅᴇᴠᴇʟᴏᴘᴇʀ ᴄᴏɴᴛᴀᴄᴛ: https://t.me/F3BAN
© ᴅᴀᴠᴇ ᴛᴇᴄʜ — ᴀʟʟ ʀɪɢʜᴛs ʀᴇsᴇʀᴠᴇᴅ.
🌸 ᴍɪss ᴀʀɪᴀ • sᴍᴀʀᴛᴇʀ. ғᴀsᴛᴇʀ. ᴍᴏʀᴇ ᴘᴏᴡᴇʀғᴜʟ.`;

function isIdentityQuestion(text) {
  return IDENTITY_RE.test(String(text || ""));
}

/**
 * Checks the message and, if it's an identity/ownership question,
 * replies directly and returns true. Returns false otherwise so the
 * caller falls through to normal AI-generated conversation.
 */
async function tryHandleIdentityQuestion({ sock, jid, text }) {
  if (!isIdentityQuestion(text)) return false;
  try {
    await sock.sendMessage(jid, { text: IDENTITY_ANSWER });
  } catch (err) {
    console.error("waIdentity: send failed:", err.message);
  }
  return true;
}

// Baked into any agent that doesn't already have a custom persona set,
// so even if attachAutoReply's caller feeds agent.persona into the
// external model's system prompt, that model is primed with the same
// facts as a backup to the hard intercept above.
const DEFAULT_PERSONA_IDENTITY_NOTE =
  "You are Miss Aria, created and owned by Dave Tech (Owner & Creator), with Sukuna as Co-Partner. " +
  "If asked who made you, who your owner/creator is, or about Dave Tech, answer with exactly that — never claim to be made by Anthropic, OpenAI, or any other company.";

module.exports = {
  isIdentityQuestion,
  tryHandleIdentityQuestion,
  DEFAULT_PERSONA_IDENTITY_NOTE,
  IDENTITY_ANSWER,
};
