'use strict';
const axios = require('axios');

async function searchMusic(query, limit = 8) {
  const q = String(query || '').trim();
  if (!q) return [];
  const { data } = await axios.get('https://itunes.apple.com/search', {
    params: { term: q, media: 'music', entity: 'song', limit },
    timeout: 15000,
  });
  return (data.results || []).map(x => ({
    id: x.trackId,
    title: x.trackName || 'Unknown track',
    artist: x.artistName || 'Unknown artist',
    album: x.collectionName || 'Unknown album',
    artwork: x.artworkUrl100 || x.artworkUrl60 || null,
    previewUrl: x.previewUrl || null,
    storeUrl: x.trackViewUrl || x.collectionViewUrl || null,
    genre: x.primaryGenreName || 'Music',
    releaseDate: x.releaseDate || null,
    duration: x.trackTimeMillis || null,
  }));
}

// Full-track download via David Cyril's song API — returns title, duration,
// thumbnail and a direct MP3 download_url so the bot can send the actual
// song, not just a 30-second preview clip.
async function fetchFullTrack(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const { data } = await axios.get('https://apis.davidcyril.name.ng/song', {
    params: { query: q },
    timeout: 30000,
  });
  if (!data || data.status === false || !data.result) return null;
  const r = data.result;
  return {
    title: r.title || q,
    videoUrl: r.video_url || null,
    thumbnail: r.thumbnail || null,
    duration: r.duration || null,
    views: r.views || null,
    published: r.published || null,
    audioUrl: r.audio?.download_url || null,
    audioFormat: r.audio?.format || 'MP3',
    videoDownloadUrl: r.video?.download_url || null,
  };
}

function artworkLarge(url) {
  return url ? url.replace(/100x100|60x60/g, '600x600') : null;
}

function format(track) {
  const year = track.releaseDate ? new Date(track.releaseDate).getFullYear() : '—';
  const mins = track.duration ? `${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}` : '—';
  return `<blockquote><b>🎵 ${escapeHtml(track.title)}</b>\n\n🎤 <b>ᴀʀᴛɪsᴛ:</b> ${escapeHtml(track.artist)}\n💿 <b>ᴀʟʙᴜᴍ:</b> ${escapeHtml(track.album)}\n🎭 <b>ɢᴇɴʀᴇ:</b> ${escapeHtml(track.genre)}\n📅 <b>ʏᴇᴀʀ:</b> ${year}\n⏱️ <b>ᴅᴜʀᴀᴛɪᴏɴ:</b> ${mins}\n\n🎧 30-sᴇᴄᴏɴᴅ ᴘʀᴇᴠɪᴇᴡ ᴀᴠᴀɪʟᴀʙʟᴇ.\n⬇️ ғᴜʟʟ ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅ ᴀᴠᴀɪʟᴀʙʟᴇ ʙᴇʟᴏᴡ.</blockquote>`;
}
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
module.exports = { searchMusic, fetchFullTrack, artworkLarge, format };
