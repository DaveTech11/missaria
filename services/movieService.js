'use strict';
const axios = require('axios');

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w780';

function key(){ return String(process.env.TMDB_API_KEY || '').trim(); }
function esc(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function requireKey(){ if(!key()) throw new Error('TMDB_API_KEY is not configured.'); }

async function tmdb(path, params={}){
  requireKey();
  const r = await axios.get(`${BASE}${path}`, { params:{ api_key:key(), language:'en-US', ...params }, timeout:20000 });
  return r.data;
}

async function searchMovies(query, page=1){
  const data = await tmdb('/search/movie', { query, page, include_adult:false });
  return (data.results||[]).filter(x=>x.id).slice(0,8);
}

async function movieDetails(id){
  const [movie, providers, videos] = await Promise.all([
    tmdb(`/movie/${id}`),
    tmdb(`/movie/${id}/watch/providers`, {}),
    tmdb(`/movie/${id}/videos`, { language:'en-US' })
  ]);
  return { movie, providers: providers.results?.NG || providers.results?.US || {}, videos: videos.results||[] };
}

function trailer(details){
  const v = details.videos.find(x=>x.site==='YouTube' && x.type==='Trailer') || details.videos.find(x=>x.site==='YouTube');
  return v ? `https://www.youtube.com/watch?v=${v.key}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${details.movie.title} official trailer`)}`;
}
function providerNames(p){
  const all=[...(p.flatrate||[]),...(p.free||[]),...(p.ads||[]),...(p.rent||[]),...(p.buy||[])];
  return [...new Set(all.map(x=>x.provider_name).filter(Boolean))].slice(0,8);
}
function watchUrl(details){ return details.providers.link || `https://www.themoviedb.org/movie/${details.movie.id}/watch`; }

function format(details){
  const m=details.movie;
  const genres=(m.genres||[]).map(x=>x.name).join(' • ') || 'ᴜɴᴋɴᴏᴡɴ';
  const providers=providerNames(details.providers);
  return `<blockquote><b>🎬 ${esc(m.title)}</b>
━━━━━━━━━━━━━━━━━━
📅 ${esc((m.release_date||'—').slice(0,4))}   ⭐ ${Number(m.vote_average||0).toFixed(1)}/10
🎭 ${esc(genres)}
⏱️ ${m.runtime?`${m.runtime} ᴍɪɴ`:'—'}

${esc(m.overview||'ɴᴏ sʏɴᴏᴘsɪs ᴀᴠᴀɪʟᴀʙʟᴇ.')}

${providers.length?`📺 <b>ᴀᴜᴛʜᴏʀɪᴢᴇᴅ ᴏᴘᴛɪᴏɴs:</b> ${esc(providers.join(', '))}`:'📺 ɴᴏ ᴡᴀᴛᴄʜ ᴘʀᴏᴠɪᴅᴇʀ ᴡᴀs ʟɪsᴛᴇᴅ ғᴏʀ ᴛʜɪs ʀᴇɢɪᴏɴ.'}
━━━━━━━━━━━━━━━━━━
ᴍᴏᴠɪᴇ ᴅᴀᴛᴀ: TMDB</blockquote>`;
}

module.exports={searchMovies,movieDetails,format,trailer,watchUrl,esc,IMG,key};
