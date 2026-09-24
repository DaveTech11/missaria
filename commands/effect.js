'use strict';
const axios = require('axios');

const API_BASE = 'https://apis.davidcyril.name.ng';

// Curated starting set of ephoto text-effect IDs, grouped into categories.
// Only "3d-text-effect" is confirmed directly from the API docs — the rest
// follow the same naming convention and are common ephoto360 effects, but
// if a button ever 404s, "✏️ ᴄᴜsᴛᴏᴍ ɪᴅ" lets you type any effect id by hand.
const CATEGORIES = [
  ['3ᴅ & ᴍᴇᴛᴀʟ', '3d', [
    ['3ᴅ ᴛᴇxᴛ', '3d-text-effect'],
    ['ɢᴏʟᴅ ᴛᴇxᴛ', 'gold-text-effect'],
    ['sɪʟᴠᴇʀ ᴛᴇxᴛ', 'silver-text-effect'],
    ['ᴍᴇᴛᴀʟ ᴛᴇxᴛ', 'metal-text-effect'],
  ]],
  ['ɴᴇᴏɴ & ɢʟᴏᴡ', 'neon', [
    ['ɴᴇᴏɴ ʟɪɢʜᴛ', 'neon-light-text-effect'],
    ['ɴᴇᴏɴ ᴛᴇxᴛ', 'neon-text-effect'],
    ['ɢʟᴏᴡ ᴛᴇxᴛ', 'glow-text-effect'],
  ]],
  ['ғɪʀᴇ & ɪᴄᴇ', 'elements', [
    ['ғɪʀᴇ ᴛᴇxᴛ', 'fire-text-effect'],
    ['ɪᴄᴇ ᴛᴇxᴛ', 'ice-text-effect'],
    ['ᴡᴀᴛᴇʀ ᴛᴇxᴛ', 'water-text-effect'],
  ]],
  ['ɢʟɪᴛᴄʜ & ғᴜᴛᴜʀᴇ', 'glitch', [
    ['ɢʟɪᴛᴄʜ ᴛᴇxᴛ', 'glitch-text-effect'],
    ['ᴄʏʙᴇʀᴘᴜɴᴋ ᴛᴇxᴛ', 'cyberpunk-text-effect'],
    ['ʜᴏʟᴏɢʀᴀᴍ ᴛᴇxᴛ', 'holographic-text-effect'],
  ]],
  ['ʟᴏᴠᴇ & ғᴜɴ', 'fun', [
    ['ʟᴏᴠᴇ ᴛᴇxᴛ', 'love-text-effect'],
    ['ʀᴀɪɴʙᴏᴡ ᴛᴇxᴛ', 'rainbow-text-effect'],
    ['ɢʀᴀғғɪᴛɪ ᴛᴇxᴛ', 'graffiti-text-effect'],
  ]],
];

const pending = new Map(); // userId -> { type: 'effect'|'custom', effectId?, label? }

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function categoryMenuKb() {
  const rows = CATEGORIES.map(([label, key]) => [{ text: `🎨 ${label}`, callback_data: `effect_cat:${key}`, style: 'primary' }]);
  rows.push([{ text: '✏️ ᴄᴜsᴛᴏᴍ ɪᴅ', callback_data: 'effect_custom', style: 'success' }]);
  rows.push([{ text: '🏠 ᴍᴀɪɴ ᴍᴇɴᴜ', callback_data: 'main_menu', style: 'primary' }]);
  return { inline_keyboard: rows };
}

function effectListKb(catKey) {
  const cat = CATEGORIES.find(c => c[1] === catKey);
  const rows = [];
  if (cat) {
    const effects = cat[2];
    for (let i = 0; i < effects.length; i += 2) {
      rows.push(effects.slice(i, i + 2).map(([label, id]) => ({ text: `✨ ${label}`, callback_data: `effect_pick:${id}:${esc(label)}`, style: 'primary' })));
    }
  }
  rows.push([{ text: '✏️ ᴄᴜsᴛᴏᴍ ɪᴅ', callback_data: 'effect_custom', style: 'success' }]);
  rows.push([{ text: '‹ ᴄᴀᴛᴇɢᴏʀɪᴇs', callback_data: 'effect_menu', style: 'primary' }]);
  return { inline_keyboard: rows };
}

function menuText() {
  return `<blockquote><b>🖼️ ᴀʀɪᴀ ᴛᴇxᴛ ᴀʀᴛ / ᴇғғᴇᴄᴛ sᴛᴜᴅɪᴏ</b>\n\nᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ ʙᴇʟᴏᴡ, ᴏʀ ᴜsᴇ <b>✏️ ᴄᴜsᴛᴏᴍ ɪᴅ</b> ᴛᴏ ᴜsᴇ ᴀɴʏ ᴇғғᴇᴄᴛ ɪᴅ.\n\nᴏʀ sᴋɪᴘ ᴛʜᴇ ᴍᴇɴᴜ: <code>/effect 3d-text-effect Aria</code></blockquote>`;
}

async function renderEffect(effectId, text) {
  const url = `${API_BASE}/api/ephoto/${encodeURIComponent(effectId)}`;
  const res = await axios.get(url, { params: { text }, timeout: 60000, responseType: 'arraybuffer', validateStatus: () => true });
  const ct = String(res.headers['content-type'] || '');
  const buf = Buffer.from(res.data || []);

  if (res.status >= 200 && res.status < 300 && ct.startsWith('image/') && buf.length) {
    return buf;
  }

  // Some deployments wrap the image in JSON instead of streaming it directly.
  let json = null;
  try { json = JSON.parse(buf.toString('utf8')); } catch { /* not JSON */ }
  const link = json && (json.result?.url || json.result?.image || json.url || json.image || json.download_url || (typeof json.result === 'string' ? json.result : null));
  if (link && typeof link === 'string' && link.startsWith('http')) {
    const r2 = await axios.get(link, { responseType: 'arraybuffer', timeout: 60000 });
    return Buffer.from(r2.data);
  }

  throw new Error(`"${effectId}" isn't a valid effect id right now (${res.status}). Try ✏️ Custom ID with a different one.`);
}

async function generateAndSend(bot, chatId, effectId, text, label) {
  const loading = await bot.sendMessage(chatId, `<blockquote>🖼️ ʀᴇɴᴅᴇʀɪɴɢ <b>${esc(label || effectId)}</b>...</blockquote>`, { parse_mode: 'HTML' });
  try {
    const image = await renderEffect(effectId, text);
    await bot.deleteMessage(chatId, loading.message_id).catch(() => {});
    await bot.sendPhoto(chatId, image, {
      caption: `<blockquote>🖼️ <b>${esc(label || effectId)}</b>\n✦ <code>${esc(text)}</code></blockquote>`,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '🎨 ᴍᴏʀᴇ ᴇғғᴇᴄᴛs', callback_data: 'effect_menu', style: 'success' }]] }
    });
  } catch (err) {
    await bot.editMessageText(`<blockquote>❌ ${esc(err.message || 'Effect generation failed.')}</blockquote>`, {
      chat_id: chatId,
      message_id: loading.message_id,
      parse_mode: 'HTML'
    }).catch(() => {});
  }
}

function registerEffect(bot) {
  bot.onText(/^\/effect(?:@\w+)?(?:\s+(\S+)\s+([\s\S]+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const effectId = match?.[1];
    const text = match?.[2];

    if (!effectId || !text) {
      return bot.sendMessage(chatId, menuText(), { parse_mode: 'HTML', reply_markup: categoryMenuKb() });
    }

    await generateAndSend(bot, chatId, effectId, text.trim());
  });

  bot.on('callback_query', async (q) => {
    const d = q.data || '';
    const userId = q.from.id;
    const chatId = q.message.chat.id;

    try {
      if (d === 'effect_menu') {
        await bot.answerCallbackQuery(q.id);
        return bot.editMessageText(menuText(), { chat_id: chatId, message_id: q.message.message_id, parse_mode: 'HTML', reply_markup: categoryMenuKb() }).catch(() => bot.sendMessage(chatId, menuText(), { parse_mode: 'HTML', reply_markup: categoryMenuKb() }));
      }

      if (d.startsWith('effect_cat:')) {
        const key = d.slice('effect_cat:'.length);
        const cat = CATEGORIES.find(c => c[1] === key);
        await bot.answerCallbackQuery(q.id);
        return bot.editMessageText(`<blockquote><b>🎨 ${esc(cat ? cat[0] : 'Effects')}</b>\n\nᴘɪᴄᴋ ᴀɴ ᴇғғᴇᴄᴛ:</blockquote>`, { chat_id: chatId, message_id: q.message.message_id, parse_mode: 'HTML', reply_markup: effectListKb(key) }).catch(() => bot.sendMessage(chatId, 'Pick an effect:', { reply_markup: effectListKb(key) }));
      }

      if (d.startsWith('effect_pick:')) {
        const [, effectId, label] = d.split(':');
        pending.set(userId, { type: 'effect', effectId, label });
        await bot.answerCallbackQuery(q.id, { text: `✨ ${label}` });
        return bot.sendMessage(chatId, `<blockquote>✏️ sᴇɴᴅ ᴛʜᴇ ᴛᴇxᴛ ʏᴏᴜ ᴡᴀɴᴛ ʀᴇɴᴅᴇʀᴇᴅ ɪɴ <b>${esc(label)}</b>.</blockquote>`, { parse_mode: 'HTML' });
      }

      if (d === 'effect_custom') {
        pending.set(userId, { type: 'custom' });
        await bot.answerCallbackQuery(q.id);
        return bot.sendMessage(chatId, `<blockquote>✏️ ᴄᴜsᴛᴏᴍ ᴇғғᴇᴄᴛ\n\nsᴇɴᴅ: <code>effect_id your text</code>\nᴇxᴀᴍᴘʟᴇ: <code>3d-text-effect Aria</code></blockquote>`, { parse_mode: 'HTML' });
      }
    } catch (e) {
      console.error('[EFFECT CALLBACK]', e);
      await bot.answerCallbackQuery(q.id, { text: '❌ Something went wrong.', show_alert: true }).catch(() => {});
    }
  });

  // Follow-up text messages for the pending "send text" / "send id + text" flows.
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    if (msg.chat.type !== 'private') return;

    const state = pending.get(msg.from.id);
    if (!state) return;
    pending.delete(msg.from.id);

    if (state.type === 'effect') {
      return generateAndSend(bot, msg.chat.id, state.effectId, msg.text.trim(), state.label);
    }

    if (state.type === 'custom') {
      const parts = msg.text.trim().split(/\s+/);
      const effectId = parts.shift();
      const text = parts.join(' ');
      if (!effectId || !text) {
        return bot.sendMessage(msg.chat.id, '<blockquote>❌ ᴜsᴇ: <code>effect_id your text</code></blockquote>', { parse_mode: 'HTML' });
      }
      return generateAndSend(bot, msg.chat.id, effectId, text);
    }
  });
}

module.exports = registerEffect;
