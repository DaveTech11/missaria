'use strict';

// 🌸 ᴍɪss ᴀʀɪᴀ — ʙɪɢ sᴛʀᴇᴀᴍ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ ᴜx
// Edits one Telegram message while the real provider request is running.

const active = new Map();
const lastJobs = new Map();

const STAGES = [
  ['🧠 ᴜɴᴅᴇʀsᴛᴀɴᴅɪɴɢ ʏᴏᴜʀ ɪᴅᴇᴀ', 8],
  ['📝 ᴇɴʜᴀɴᴄɪɴɢ ᴛʜᴇ ᴘʀᴏᴍᴘᴛ', 18],
  ['🎨 ᴘʟᴀɴɴɪɴɢ ᴄᴏᴍᴘᴏsɪᴛɪᴏɴ', 31],
  ['🧩 ʟᴀʏᴇʀɪɴɢ ᴅᴇᴛᴀɪʟs', 45],
  ['✨ ʀᴇɴᴅᴇʀɪɴɢ ᴠɪsᴜᴀʟs', 61],
  ['🌈 ʙᴀʟᴀɴᴄɪɴɢ ʟɪɢʜᴛ & ᴄᴏʟᴏʀ', 74],
  ['🔍 ʀᴇғɪɴɪɴɢ ғɪɴᴀʟ ᴅᴇᴛᴀɪʟs', 86],
  ['🪄 ᴘᴏʟɪsʜɪɴɢ ʏᴏᴜʀ ɪᴍᴀɢᴇ', 94]
];

const SPINNERS = ['◐', '◓', '◑', '◒'];
const BAR_SIZE = 24;

function bar(percent) {
  const filled = Math.max(0, Math.min(BAR_SIZE, Math.round((percent / 100) * BAR_SIZE)));
  return '█'.repeat(filled) + '░'.repeat(BAR_SIZE - filled);
}

function text(stage, percent, spinnerIndex = 0, extra = '') {
  const spinner = SPINNERS[spinnerIndex % SPINNERS.length];
  return [
    '<b>🎨 ᴀʀɪᴀ ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ</b>',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `<b>${spinner} ɢᴇɴᴇʀᴀᴛɪɴɢ ʏᴏᴜʀ ɪᴍᴀɢᴇ...</b>`,
    `<code>${bar(percent)}</code> <b>${percent}%</b>`,
    '',
    `<b>${stage}</b>`,
    '',
    '▰ ᴘʀᴏᴍᴘᴛ ᴘʀᴏᴄᴇssɪɴɢ',
    '▰ ᴠɪsᴜᴀʟ ᴄᴏᴍᴘᴏsɪᴛɪᴏɴ',
    '▰ ᴀɪ ʀᴇɴᴅᴇʀ ᴘɪᴘᴇʟɪɴᴇ',
    '▰ ғɪɴᴀʟ ǫᴜᴀʟɪᴛʏ ᴘᴀss',
    extra ? `\n${extra}` : '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '🌸 <b>ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍɪss ᴀʀɪᴀ</b>'
  ].filter(Boolean).join('\n');
}

function finalText(engine) {
  return [
    '<b>🎨 ᴀʀɪᴀ ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ</b>',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '✅ <b>ɪᴍᴀɢᴇ ʀᴇɴᴅᴇʀᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ</b>',
    '<code>████████████████████████</code> <b>100%</b>',
    '',
    `⚡ ᴇɴɢɪɴᴇ: <b>${escapeHtml(engine || 'AI')}</b>`,
    '🌸 ᴍɪss ᴀʀɪᴀ ᴇɴᴛᴇʀᴘʀɪsᴇ ɪᴍᴀɢᴇ ᴇɴɢɪɴᴇ',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');
}

function errorText() {
  return [
    '<b>🎨 ᴀʀɪᴀ ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ</b>',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '❌ <b>ɢᴇɴᴇʀᴀᴛɪᴏɴ ғᴀɪʟᴇᴅ</b>',
    '',
    'ᴛʜᴇ ɪᴍᴀɢᴇ ᴘʀᴏᴠɪᴅᴇʀ ᴅɪᴅɴ’ᴛ ʀᴇᴛᴜʀɴ ᴀ ᴠᴀʟɪᴅ ɪᴍᴀɢᴇ.',
    'ᴛʀʏ ʀᴇɢᴇɴᴇʀᴀᴛɪɴɢ ᴛʜᴇ sᴀᴍᴇ ᴘʀᴏᴍᴘᴛ.',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '🌸 <b>ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍɪss ᴀʀɪᴀ</b>'
  ].join('\n');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function remember(userId, job) {
  lastJobs.set(String(userId), { ...job, createdAt: Date.now() });
}

function getLast(userId) {
  return lastJobs.get(String(userId)) || null;
}

async function start(bot, chatId, userId, run, options = {}) {
  const key = `${chatId}:${userId}`;
  const previous = active.get(key);
  if (previous) previous.cancelled = true;

  const state = { cancelled: false, timer: null };
  active.set(key, state);

  const message = await bot.sendMessage(
    chatId,
    text(STAGES[0][0], STAGES[0][1], 0, options.subtitle || ''),
    { parse_mode: 'HTML', ...(options.reply_to_message_id ? { reply_to_message_id: options.reply_to_message_id } : {}) }
  );

  let stageIndex = 0;
  let spinnerIndex = 0;
  let finished = false;

  const tick = async () => {
    if (finished || state.cancelled) return;
    stageIndex = Math.min(stageIndex + 1, STAGES.length - 1);
    spinnerIndex++;
    const [stage, percent] = STAGES[stageIndex];
    await bot.editMessageText(text(stage, percent, spinnerIndex), {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: 'HTML'
    }).catch(() => {});
  };

  state.timer = setInterval(tick, options.interval || 900);

  try {
    const result = await run();
    finished = true;
    clearInterval(state.timer);
    active.delete(key);

    await bot.editMessageText(finalText(result && result.engine), {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: 'HTML'
    }).catch(() => {});

    return { message, result };
  } catch (error) {
    finished = true;
    clearInterval(state.timer);
    active.delete(key);
    await bot.editMessageText(errorText(), {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[
        { text: '🔄 ʀᴇɢᴇɴᴇʀᴀᴛᴇ', callback_data: 'img_regen', style: 'success' },
        { text: '✏️ ᴄʜᴀɴɢᴇ ᴘʀᴏᴍᴘᴛ', callback_data: 'img_change', style: 'primary' }
      ]] }
    }).catch(() => {});
    throw error;
  }
}

module.exports = { start, remember, getLast, text, finalText };
