'use strict';

// 👩‍💻 ᴍɪss ᴀʀɪᴀ — ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ ᴜx
// Edits one Telegram message while a debug/generate/optimize/etc request runs.

const active = new Map();

const TITLES = {
    debug: '🐞 ᴅᴇʙᴜɢɢɪɴɢ ʏᴏᴜʀ ᴄᴏᴅᴇ',
    generate: '💻 ɢᴇɴᴇʀᴀᴛɪɴɢ ʏᴏᴜʀ ᴄᴏᴅᴇ',
    explain: '📖 ʀᴇᴀᴅɪɴɢ ʏᴏᴜʀ ᴄᴏᴅᴇ',
    optimize: '⚡ ᴏᴘᴛɪᴍɪᴢɪɴɢ ʏᴏᴜʀ ᴄᴏᴅᴇ',
    tests: '🧪 ᴡʀɪᴛɪɴɢ ᴛᴇsᴛs',
    convert: '🔄 ᴄᴏɴᴠᴇʀᴛɪɴɢ ʏᴏᴜʀ ᴄᴏᴅᴇ',
    docs: '📄 ᴅᴏᴄᴜᴍᴇɴᴛɪɴɢ ʏᴏᴜʀ ᴄᴏᴅᴇ'
};

const STAGES = [
    ['📥 ʀᴇᴀᴅɪɴɢ sᴏᴜʀᴄᴇ', 12],
    ['🔎 sᴄᴀɴɴɪɴɢ ғᴏʀ ɪssᴜᴇs', 30],
    ['🧠 ᴛʜɪɴᴋɪɴɢ ɪᴛ ᴛʜʀᴏᴜɢʜ', 48],
    ['🛠️ ᴡʀɪᴛɪɴɢ ᴛʜᴇ ғɪx', 66],
    ['🧹 ᴄʟᴇᴀɴɪɴɢ ᴜᴘ ᴏᴜᴛᴘᴜᴛ', 82],
    ['📦 ᴘᴀᴄᴋᴀɢɪɴɢ ʀᴇsᴜʟᴛ', 93]
];

const SPINNERS = ['◐', '◓', '◑', '◒'];
const BAR_SIZE = 24;

function bar(percent) {
    const filled = Math.max(0, Math.min(BAR_SIZE, Math.round((percent / 100) * BAR_SIZE)));
    return '█'.repeat(filled) + '░'.repeat(BAR_SIZE - filled);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function text(mode, stage, percent, spinnerIndex) {
    const spinner = SPINNERS[spinnerIndex % SPINNERS.length];
    return [
        '<b>👩‍💻 ᴍɪss ᴀʀɪᴀ • ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ</b>',
        '━━━━━━━━━━━━━━━━━━',
        '',
        `<b>${spinner} ${TITLES[mode] || 'ᴡᴏʀᴋɪɴɢ ᴏɴ ʏᴏᴜʀ ᴄᴏᴅᴇ'}...</b>`,
        `<code>${bar(percent)}</code> <b>${percent}%</b>`,
        '',
        `<b>${stage}</b>`,
        '',
        '━━━━━━━━━━━━━━━━━━'
    ].join('\n');
}

function finalText(mode, hasZip) {
    return [
        '<b>👩‍💻 ᴍɪss ᴀʀɪᴀ • ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ</b>',
        '━━━━━━━━━━━━━━━━━━',
        '',
        `✅ <b>${TITLES[mode] || 'ᴄᴏᴅᴇ ᴡᴏʀᴋ'} — ᴅᴏɴᴇ</b>`,
        `<code>${bar(100)}</code> <b>100%</b>`,
        '',
        hasZip ? '📦 sᴇɴᴅɪɴɢ ᴛʜᴇ ғɪxᴇᴅ ғɪʟᴇs ᴀs ᴀ .zip ʙᴇʟᴏᴡ...' : '📝 sᴇɴᴅɪɴɢ ᴛʜᴇ ʙʀᴇᴀᴋᴅᴏᴡɴ ʙᴇʟᴏᴡ...',
        '',
        '━━━━━━━━━━━━━━━━━━'
    ].join('\n');
}

function errorText(mode) {
    return [
        '<b>👩‍💻 ᴍɪss ᴀʀɪᴀ • ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ</b>',
        '━━━━━━━━━━━━━━━━━━',
        '',
        `❌ <b>${TITLES[mode] || 'ᴄᴏᴅᴇ ᴡᴏʀᴋ'} ғᴀɪʟᴇᴅ</b>`,
        '',
        'sᴏᴍᴇᴛʜɪɴɢ ᴡᴇɴᴛ ᴡʀᴏɴɢ ᴏɴ ᴍʏ ᴇɴᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ᴀ ᴍᴏᴍᴇɴᴛ.',
        '',
        '━━━━━━━━━━━━━━━━━━'
    ].join('\n');
}

/**
 * Runs `run()` while editing one Telegram message with progress, then
 * edits it one last time to a "done" state before returning.
 *
 * @returns {Promise<{message, result}>}
 */
async function start(bot, chatId, userId, mode, run, options = {}) {
    const key = `${chatId}:${userId}`;
    const previous = active.get(key);
    if (previous) previous.cancelled = true;

    const state = { cancelled: false, timer: null };
    active.set(key, state);

    const message = await bot.sendMessage(
        chatId,
        text(mode, STAGES[0][0], STAGES[0][1], 0),
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
        await bot.editMessageText(text(mode, stage, percent, spinnerIndex), {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML'
        }).catch(() => {});
    };

    state.timer = setInterval(tick, options.interval || 1100);

    try {
        const result = await run();
        finished = true;
        clearInterval(state.timer);
        active.delete(key);

        await bot.editMessageText(finalText(mode, Boolean(result && result.hasZip)), {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML'
        }).catch(() => {});

        return { message, result };
    } catch (error) {
        finished = true;
        clearInterval(state.timer);
        active.delete(key);
        await bot.editMessageText(errorText(mode), {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML'
        }).catch(() => {});
        throw error;
    }
}

module.exports = { start };
