// ============================================================
// 🌺 ᴍɪss ᴀʀɪᴀ — ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
// ᴛɪᴋᴛᴏᴋ • ɪɴsᴛᴀɢʀᴀᴍ • ᴛᴡɪᴛᴛᴇʀ/𝕏 • ꜰᴀᴄᴇʙᴏᴏᴋ • ᴘɪɴᴛᴇʀᴇsᴛ
//
// Rewritten to run on node-telegram-bot-api (the rest of this bot's
// framework) — the previous version used Telegraf's ctx.reply/bot.action
// API, which doesn't exist here, so it never actually worked and wasn't
// wired up anywhere. This version also switches to the davidcyril aiov3
// endpoint and auto-detects supported links pasted anywhere, not just
// via the /aio command.
// ============================================================

const axios = require('axios');

const API_BASE = 'https://apis.davidcyril.name.ng';
const aioPending = new Map();
const ytPending = new Map(); // userId -> { url, createdAt }

// Domains this auto-detects a download link for, so a bare paste (no /aio
// prefix needed) kicks off the download automatically.
const LINK_PATTERN = /https?:\/\/(?:www\.|vm\.|vt\.|m\.)?(?:tiktok\.com|facebook\.com|fb\.watch|instagram\.com|twitter\.com|x\.com|pinterest\.com|pin\.it)\/\S+/i;
const YOUTUBE_PATTERN = /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com\/\S+|youtu\.be\/\S+)/i;

function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// 🌐 ᴅᴀᴠɪᴅᴄʏʀɪʟ ᴀɪᴏᴠ3
// ============================================================

async function fetchAio(url) {
  const apiUrl = `${API_BASE}/download/aiov3`;
  const res = await axios.get(apiUrl, { params: { url }, timeout: 60000, validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`AIO API returned HTTP ${res.status}`);
  }
  return res.data;
}

// ============================================================
// 🌐 ᴅᴀᴠɪᴅᴄʏʀɪʟ sᴀᴠᴇᴛᴜʙᴇ (ʏᴏᴜᴛᴜʙᴇ)
// ============================================================

async function fetchSavetube(url, format) {
  const apiUrl = `${API_BASE}/download/savetube`;
  const params = { url };
  if (format) params.format = format;
  const res = await axios.get(apiUrl, { params, timeout: 90000, validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`SaveTube API returned HTTP ${res.status}`);
  }
  return res.data;
}

const YT_AUDIO_FORMATS = new Set(['mp3', 'm4a']);
const YT_FORMAT_BUTTONS = [
  ['🎵 MP3', 'mp3'],
  ['🎬 360p', '360'],
  ['🎬 480p', '480'],
  ['🎬 720p', '720'],
  ['🎬 1080p', '1080'],
];

function ytKeyboard() {
  const rows = [];
  for (let i = 0; i < YT_FORMAT_BUTTONS.length; i += 2) {
    rows.push(YT_FORMAT_BUTTONS.slice(i, i + 2).map(([label, fmt]) => ({ text: label, callback_data: `yt_fmt:${fmt}`, style: fmt === 'mp3' ? 'success' : 'primary' })));
  }
  rows.push([{ text: '🏠 ᴍᴀɪɴ ᴍᴇɴᴜ', callback_data: 'main_menu', style: 'success' }]);
  return { inline_keyboard: rows };
}

async function sendYoutubeFormat(bot, chatId, url, format, { asPreview } = {}) {
  const data = await fetchSavetube(url, format);
  const title = data?.title || data?.result?.title || data?.data?.title || 'YouTube';
  const isAudio = YT_AUDIO_FORMATS.has(format);
  const fileUrl = findMediaUrl(data, isAudio ? 'audio' : 'video') ||
    data?.download_url || data?.result?.download_url || data?.data?.download_url ||
    data?.url || data?.result?.url || data?.data?.url;

  if (!fileUrl) throw new Error(`No ${format} file was returned for this video.`);

  const caption = `<blockquote>${isAudio ? '🎵' : '🎬'} <b>${esc(String(title).slice(0, 250))}</b>\n\n✦ ${esc(format)}${asPreview ? '\n\n➤ ᴍᴏʀᴇ ꜰᴏʀᴍᴀᴛs ʙᴇʟᴏᴡ.' : ''}</blockquote>`;
  const reply_markup = asPreview ? ytKeyboard() : undefined;

  try {
    if (isAudio) {
      await bot.sendAudio(chatId, fileUrl, { caption, parse_mode: 'HTML', reply_markup, title });
    } else {
      await bot.sendVideo(chatId, fileUrl, { caption, parse_mode: 'HTML', reply_markup, supports_streaming: true });
    }
  } catch (err) {
    // Fall back to downloading the bytes ourselves if the host rejects
    // Telegram's own fetcher (same pattern as the AIO video fallback below).
    const r = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 120000, maxRedirects: 5 });
    const buffer = Buffer.from(r.data);
    if (!buffer.length) throw err;
    if (isAudio) {
      await bot.sendAudio(chatId, buffer, { caption, parse_mode: 'HTML', reply_markup, title }, { filename: `audio.${format === 'mp3' ? 'mp3' : format}`, contentType: 'audio/mpeg' });
    } else {
      await bot.sendVideo(chatId, buffer, { caption, parse_mode: 'HTML', reply_markup, supports_streaming: true }, { filename: 'video.mp4', contentType: 'video/mp4' });
    }
  }
}

async function runYoutube(bot, chatId, userId, url) {
  const waitMsg = await bot.sendMessage(chatId, '<blockquote>⏳ <b>ꜰᴇᴛᴄʜɪɴɢ ꜰʀᴏᴍ ʏᴏᴜᴛᴜʙᴇ...</b></blockquote>', { parse_mode: 'HTML' });
  ytPending.set(userId, { url, createdAt: Date.now() });
  try {
    await sendYoutubeFormat(bot, chatId, url, '360', { asPreview: true });
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
  } catch (error) {
    console.error('YOUTUBE ERROR:', error.response?.data || error.message || error);
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, '<blockquote>❌ <b>ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ</b>\n\nᴛʀʏ ᴀɢᴀɪɴ ᴏʀ ᴡɪᴛʜ ᴀ ᴅɪꜰꜰᴇʀᴇɴᴛ ʟɪɴᴋ.</blockquote>', { parse_mode: 'HTML' });
  }
}

// ============================================================
// 🔎 ᴄᴏʟʟᴇᴄᴛ / ᴅᴇᴛᴇᴄᴛ ᴍᴇᴅɪᴀ ᴜʀʟs (framework-agnostic — kept as-is)
// ============================================================

function collectUrls(value, path = '', results = []) {
  if (!value) return results;
  if (typeof value === 'string') {
    const matches = value.match(/https?:\/\/[^\s"'<>]+/gi);
    if (matches) {
      for (const url of matches) results.push({ url: url.replace(/[),]+$/, ''), path: path.toLowerCase() });
    }
    return results;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUrls(item, `${path}[${index}]`, results));
    return results;
  }
  if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value)) collectUrls(val, path ? `${path}.${key}` : key, results);
  }
  return results;
}

function findMediaUrl(data, type) {
  const urls = collectUrls(data);
  const patterns = {
    audio: ['audio', 'music', 'mp3', 'm4a', 'aac', 'ogg', 'wav', 'sound', 'song'],
    image: ['image', 'images', 'photo', 'photos', 'picture', 'pictures', 'thumbnail', 'cover'],
    video: ['video', 'videos', 'mp4', 'mov', 'webm', 'mkv', 'download', 'play', 'nowatermark', 'no_watermark'],
  };
  const keywords = patterns[type] || [];
  const scored = urls.map((item) => {
    let score = 0;
    const path = item.path.toLowerCase();
    const url = item.url.toLowerCase();
    for (const keyword of keywords) if (path.includes(keyword)) score += 10;
    if (type === 'audio' && /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(url)) score += 30;
    if (type === 'image' && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) score += 30;
    if (type === 'video' && /\.(mp4|mov|webm|mkv)(\?|$)/i.test(url)) score += 30;
    return { ...item, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].url : null;
}

function findImageUrls(data) {
  const urls = collectUrls(data);
  const images = urls.filter((item) => {
    const path = item.path.toLowerCase();
    const url = item.url.toLowerCase();
    return path.includes('image') || path.includes('images') || path.includes('photo') || path.includes('photos') ||
      path.includes('picture') || path.includes('pictures') || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
  });
  return [...new Map(images.map((item) => [item.url, item.url])).values()];
}

function aioKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🎵 ᴀᴜᴅɪᴏ', callback_data: 'aio_audio', style: 'success' }, { text: '🖼️ ɪᴍᴀɢᴇ', callback_data: 'aio_image', style: 'primary' }],
      [{ text: '🎬 ᴠɪᴅᴇᴏ / ᴍᴘ4', callback_data: 'aio_video', style: 'primary' }, { text: '🖼️ ᴄᴀʀᴏᴜsᴇʟ', callback_data: 'aio_carousel', style: 'primary' }],
      [{ text: '🏠 ᴍᴀɪɴ ᴍᴇɴᴜ', callback_data: 'main_menu', style: 'success' }],
    ],
  };
}

// ============================================================
// 📥 ᴄᴏʀᴇ ʜᴀɴᴅʟᴇʀ — sʜᴀʀᴇᴅ ʙʏ /ᴀɪᴏ ᴀɴᴅ ᴀᴜᴛᴏ-ᴅᴇᴛᴇᴄᴛ
// ============================================================

async function runAio(bot, chatId, userId, url) {
  const waitMsg = await bot.sendMessage(
    chatId,
    '<blockquote>⏳ <b>ᴘʀᴏᴄᴇssɪɴɢ ʟɪɴᴋ...</b>\n\n🌺 ᴍɪss ᴀʀɪᴀ ɪs ᴄʜᴇᴄᴋɪɴɢ ᴛʜᴇ ᴍᴇᴅɪᴀ...</blockquote>',
    { parse_mode: 'HTML' }
  );

  try {
    const data = await fetchAio(url);

    const title = data?.title || data?.result?.title || data?.data?.title || data?.result?.caption || data?.data?.caption || 'ᴠɪʀᴀʟ ᴍᴇᴅɪᴀ';
    const videoUrl = findMediaUrl(data, 'video');
    const thumbnail = data?.thumbnail || data?.cover || data?.coverUrl || data?.result?.thumbnail || data?.result?.cover || data?.data?.thumbnail || data?.data?.cover || null;

    aioPending.set(userId, { url, data, title, thumbnail, createdAt: Date.now() });

    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});

    const caption = `<blockquote><b>『 ✧ 🌐 ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ✧ 』</b>\n\n📝 <b>${esc(String(title).slice(0, 250))}</b>\n\n➤ ᴍᴏʀᴇ ꜰᴏʀᴍᴀᴛs ʙᴇʟᴏᴡ.</blockquote>`;

    // Send an actual playable video preview when one was found — this is
    // the main upgrade over the old thumbnail-only flow.
    if (videoUrl) {
      try {
        await bot.sendVideo(chatId, videoUrl, { caption, parse_mode: 'HTML', reply_markup: aioKeyboard(), supports_streaming: true });
        return;
      } catch (err) {
        // Some hosts reject Telegram's own fetcher — fall back to downloading
        // the bytes ourselves and uploading the buffer instead.
        try {
          const r = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000, maxRedirects: 5 });
          const buffer = Buffer.from(r.data);
          if (buffer.length) {
            await bot.sendVideo(chatId, buffer, { caption, parse_mode: 'HTML', reply_markup: aioKeyboard(), supports_streaming: true }, { filename: 'video.mp4', contentType: 'video/mp4' });
            return;
          }
        } catch (err2) {
          console.error('[AIO VIDEO FALLBACK]', err2.message);
        }
      }
    }

    // No video found (audio-only source, image carousel, etc.) — fall back
    // to a thumbnail + format-choice menu like before.
    if (thumbnail) {
      await bot.sendPhoto(chatId, thumbnail, { caption, parse_mode: 'HTML', reply_markup: aioKeyboard() });
    } else {
      await bot.sendMessage(chatId, caption, { parse_mode: 'HTML', reply_markup: aioKeyboard() });
    }
  } catch (error) {
    console.error('AIO ERROR:', error.response?.data || error.message || error);
    await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {});
    await bot.sendMessage(chatId, '<blockquote>❌ <b>ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ</b>\n\n✧ ᴛʜᴇ ʟɪɴᴋ ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴇ ᴘʀᴏᴄᴇssᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.</blockquote>', { parse_mode: 'HTML' });
  }
}

// ============================================================
// 🔧 ʀᴇɢɪsᴛᴇʀ
// ============================================================

function registerAio(bot) {
  // Note: only /aio — "/download" is already the bot-data Download Center
  // (handlers/08_channels_downloads.js) and reusing it here would duplicate
  // that command's replies.
  bot.onText(/^\/aio(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const url = match?.[1]?.trim();

    if (!url) {
      return bot.sendMessage(
        chatId,
        `<blockquote><b>『 🌐 ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 』</b>\n\n✧ sᴇɴᴅ ᴀ sᴏᴄɪᴀʟ ᴍᴇᴅɪᴀ ᴏʀ ʏᴏᴜᴛᴜʙᴇ ʟɪɴᴋ — ᴏʀ ᴊᴜsᴛ ᴘᴀsᴛᴇ ᴏɴᴇ ᴀɴʏᴡʜᴇʀᴇ, ɪᴛ's ᴀᴜᴛᴏ-ᴅᴇᴛᴇᴄᴛᴇᴅ.\n\n<b>ᴜsᴀɢᴇ:</b>\n<code>/aio https://example.com/...</code>\n\n<b>sᴜᴘᴘᴏʀᴛᴇᴅ:</b>\n🎵 ᴛɪᴋᴛᴏᴋ\n📸 ɪɴsᴛᴀɢʀᴀᴍ\n🐦 ᴛᴡɪᴛᴛᴇʀ / 𝕏\n📘 ꜰᴀᴄᴇʙᴏᴏᴋ\n📌 ᴘɪɴᴛᴇʀᴇsᴛ\n▶️ ʏᴏᴜᴛᴜʙᴇ (ᴍᴘ3/ᴍᴘ4/144–1080ᴘ)</blockquote>`,
        { parse_mode: 'HTML' }
      );
    }

    if (!/^https?:\/\/\S+$/i.test(url)) {
      return bot.sendMessage(chatId, '❌ ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ᴠᴀʟɪᴅ ʟɪɴᴋ.');
    }

    if (YOUTUBE_PATTERN.test(url)) {
      return runYoutube(bot, chatId, msg.from.id, url);
    }

    await runAio(bot, chatId, msg.from.id, url);
  });

  // Auto-detect: a TikTok/Facebook/Instagram/YouTube/etc. link pasted
  // anywhere (no /aio prefix needed) triggers the same downloader.
  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const yt = msg.text.match(YOUTUBE_PATTERN);
    if (yt) return runYoutube(bot, msg.chat.id, msg.from.id, yt[0]);

    const found = msg.text.match(LINK_PATTERN);
    if (!found) return;
    await runAio(bot, msg.chat.id, msg.from.id, found[0]);
  });

  bot.on('callback_query', async (q) => {
    const d = q.data || '';

    if (d.startsWith('yt_fmt:')) {
      const chatId = q.message.chat.id;
      const pending = ytPending.get(q.from.id);
      if (!pending) {
        await bot.answerCallbackQuery(q.id, { text: '❌ ᴛʜɪs ᴅᴏᴡɴʟᴏᴀᴅ ʜᴀs ᴇxᴘɪʀᴇᴅ.', show_alert: true });
        return;
      }
      const format = d.split(':')[1];
      await bot.answerCallbackQuery(q.id, { text: `⬇️ ᴘʀᴇᴘᴀʀɪɴɢ ${format}...` });
      try {
        await sendYoutubeFormat(bot, chatId, pending.url, format, { asPreview: false });
      } catch (error) {
        console.error('YOUTUBE FORMAT ERROR:', error.message);
        await bot.sendMessage(chatId, `<blockquote>❌ ᴄᴏᴜʟᴅɴ'ᴛ ɢᴇᴛ ᴛʜᴀᴛ ꜰᴏʀᴍᴀᴛ. ᴛʀʏ ᴀɴᴏᴛʜᴇʀ ᴏɴᴇ.</blockquote>`, { parse_mode: 'HTML' });
      }
      return;
    }

    if (!d.startsWith('aio_') || d === 'aio_again') return;

    const chatId = q.message.chat.id;
    const pending = aioPending.get(q.from.id);

    if (!pending) {
      await bot.answerCallbackQuery(q.id, { text: '❌ ᴛʜɪs ᴅᴏᴡɴʟᴏᴀᴅ ʜᴀs ᴇxᴘɪʀᴇᴅ.', show_alert: true });
      return;
    }

    try {
      if (d === 'aio_audio') {
        await bot.answerCallbackQuery(q.id, { text: '🎵 ᴘʀᴏᴄᴇssɪɴɢ ᴀᴜᴅɪᴏ...' });
        const audioUrl = findMediaUrl(pending.data, 'audio');
        if (!audioUrl) return bot.sendMessage(chatId, '❌ ɴᴏ ᴀᴜᴅɪᴏ ꜰɪʟᴇ ᴡᴀs ꜰᴏᴜɴᴅ.');
        return bot.sendAudio(chatId, audioUrl, { caption: '🎵 <b>ᴀᴜᴅɪᴏ ʀᴇᴀᴅʏ</b>', parse_mode: 'HTML' });
      }

      if (d === 'aio_image') {
        await bot.answerCallbackQuery(q.id, { text: '🖼️ ᴘʀᴏᴄᴇssɪɴɢ ɪᴍᴀɢᴇ...' });
        const imageUrl = findMediaUrl(pending.data, 'image');
        if (!imageUrl) return bot.sendMessage(chatId, '❌ ɴᴏ ɪᴍᴀɢᴇ ꜰɪʟᴇ ᴡᴀs ꜰᴏᴜɴᴅ.');
        return bot.sendPhoto(chatId, imageUrl, { caption: '🖼️ <b>ɪᴍᴀɢᴇ ʀᴇᴀᴅʏ</b>', parse_mode: 'HTML' });
      }

      if (d === 'aio_video') {
        await bot.answerCallbackQuery(q.id, { text: '🎬 ᴘʀᴏᴄᴇssɪɴɢ ᴠɪᴅᴇᴏ...' });
        const videoUrl = findMediaUrl(pending.data, 'video');
        if (!videoUrl) return bot.sendMessage(chatId, '❌ ɴᴏ ᴠɪᴅᴇᴏ ꜰɪʟᴇ ᴡᴀs ꜰᴏᴜɴᴅ.');
        return bot.sendVideo(chatId, videoUrl, { caption: '🎬 <b>ᴠɪᴅᴇᴏ / ᴍᴘ4 ʀᴇᴀᴅʏ</b>', parse_mode: 'HTML', supports_streaming: true });
      }

      if (d === 'aio_carousel') {
        await bot.answerCallbackQuery(q.id, { text: '🖼️ ʟᴏᴀᴅɪɴɢ ᴄᴀʀᴏᴜsᴇʟ...' });
        const images = findImageUrls(pending.data);
        if (!images.length) return bot.sendMessage(chatId, '❌ ɴᴏ ᴄᴀʀᴏᴜsᴇʟ ɪᴍᴀɢᴇs ᴡᴇʀᴇ ꜰᴏᴜɴᴅ.');
        const selected = images.slice(0, 10);
        const media = selected.map((url, index) => ({ type: 'photo', media: url, ...(index === 0 ? { caption: '🖼️ <b>ᴄᴀʀᴏᴜsᴇʟ ʀᴇᴀᴅʏ</b>', parse_mode: 'HTML' } : {}) }));
        return bot.sendMediaGroup(chatId, media);
      }
    } catch (error) {
      console.error('AIO CALLBACK ERROR:', error.message);
      await bot.answerCallbackQuery(q.id, { text: '❌ Something went wrong.', show_alert: true }).catch(() => {});
    }
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, item] of aioPending.entries()) {
    if (!item.createdAt || now - item.createdAt > 10 * 60 * 1000) aioPending.delete(userId);
  }
  for (const [userId, item] of ytPending.entries()) {
    if (!item.createdAt || now - item.createdAt > 10 * 60 * 1000) ytPending.delete(userId);
  }
}, 60 * 1000);

module.exports = registerAio;
