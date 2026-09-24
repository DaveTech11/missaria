'use strict';
const axios=require('axios');
const music=require('../services/musicService');
const animation=require('../services/musicAnimation');
const last=new Map();
function resultsKb(results){return {inline_keyboard:results.map(x=>[{text:`🎵 ${x.title.slice(0,30)}${x.title.length>30?'…':''} — ${x.artist.slice(0,18)}`,callback_data:`music:${x.id}`,style:'primary'}]).concat([[{text:'🏠 ᴍᴀɪɴ ᴍᴇɴᴜ',callback_data:'main_menu',style:'success'}]])};}
function detailKb(t){return {inline_keyboard:[[{text:'🎧 ᴘʟᴀʏ ᴘʀᴇᴠɪᴇᴡ',callback_data:`music_preview:${t.id}`,style:'success'},{text:'⬇️ ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴜsɪᴄ',callback_data:`music_dl:${t.id}`,style:'primary'}],[{text:'🔗 ᴏғғɪᴄɪᴀʟ sᴏᴜʀᴄᴇ',url:t.storeUrl||'https://music.apple.com',style:'primary'}],[{text:'🔎 sᴇᴀʀᴄ ᴀɢᴀɪɴ',callback_data:'music_search',style:'primary'},{text:'🏠 ᴍᴀɪɴ ᴍᴇɴᴜ',callback_data:'main_menu',style:'success'}]]};}
async function show(bot,chatId,t){last.set(String(t.id),t);const caption=music.format(t);if(t.artwork)return bot.sendPhoto(chatId,music.artworkLarge(t.artwork),{caption,parse_mode:'HTML',reply_markup:detailKb(t)});return bot.sendMessage(chatId,caption,{parse_mode:'HTML',reply_markup:detailKb(t)});}
async function sendPreview(bot,chatId,t){if(!t?.previewUrl)return bot.sendMessage(chatId,'<blockquote>❌ ɴᴏ ᴘʀᴇᴠɪᴇᴡ ɪs ᴀᴠᴀɪʟᴀʙʟᴇ ғᴏʀ ᴛʜɪs ᴛʀᴀᴄᴋ.</blockquote>',{parse_mode:'HTML'});const r=await axios.get(t.previewUrl,{responseType:'arraybuffer',timeout:30000});return bot.sendAudio(chatId,Buffer.from(r.data),{caption:`🎵 ${t.title} — ${t.artist}\n\nᴇxᴄᴇʀᴘᴛ / ᴘʀᴇᴠɪᴇᴡ`,title:t.title,performer:t.artist});}
// Full-track download — backed by the David Cyril song API, gives the real MP3
// instead of the old 30-second-only preview.
async function sendFullTrack(bot,chatId,t){
 const full=await music.fetchFullTrack(`${t.title} ${t.artist}`);
 if(!full||!full.audioUrl)return bot.sendMessage(chatId,'<blockquote>❌ ᴄᴏᴜʟᴅɴ\'ᴛ ғɪɴᴅ ᴀ ᴅᴏᴡɴʟᴏᴀᴅᴀʙʟᴇ ᴠᴇʀsɪᴏɴ ᴏғ ᴛʜɪs ᴛʀᴀᴄᴋ.</blockquote>',{parse_mode:'HTML'});
 // Pull the actual bytes down ourselves and upload the buffer — passing a raw
 // URL to sendAudio leaves it to Telegram's own fetcher, which some hosts
 // (or redirects) reject, and it can silently degrade to a plain link instead
 // of a real playable audio message. Downloading first guarantees a file.
 const safeName=String(full.title||'track').replace(/[\\/:*?"<>|]/g,'').slice(0,60)||'track';
 const r=await axios.get(full.audioUrl,{responseType:'arraybuffer',timeout:120000,maxRedirects:5});
 const buffer=Buffer.from(r.data);
 if(!buffer.length)throw new Error('Downloaded 0 bytes from the audio source.');
 return bot.sendAudio(chatId,buffer,{caption:`🎵 <b>${full.title}</b>\n\n⏱️ ${full.duration||'—'}\n✅ ᴅᴏᴡɴʟᴏᴀᴅ ᴄᴏᴍᴘʟᴇᴛᴇ`,parse_mode:'HTML',title:full.title,performer:t.artist},{filename:`${safeName}.mp3`,contentType:'audio/mpeg'});
}
function registerMusic(bot){
 bot.onText(/^\/(?:music|song)(?:@\w+)?(?:\s+(.+))?$/i,async(msg,match)=>{const q=match?.[1]?.trim();if(!q)return bot.sendMessage(msg.chat.id,'<blockquote><b>🎵 ᴀʀɪᴀ ᴍᴜsɪᴄ sᴛᴜᴅɪᴏ</b>\n\nᴜsᴇ <code>/music burna boy</code> ᴛᴏ sᴇᴀʀᴄʜ.\n\n✦ sᴏɴɢ & ᴀʀᴛɪsᴛ sᴇᴀʀᴄʜ\n✦ ᴀʟʙᴜᴍ ᴀʀᴛᴡᴏʀᴋ\n✦ 30-sᴇᴄᴏɴᴅ ᴘʀᴇᴠɪᴇᴡs\n✦ ғᴜʟʟ ᴍᴘ3 ᴅᴏᴡɴʟᴏᴀᴅs</blockquote>',{parse_mode:'HTML'});try{const results=await animation.start(bot,msg.chat.id,q,()=>music.searchMusic(q));if(!results.length)return bot.sendMessage(msg.chat.id,'<blockquote>🎵 ɴᴏ ᴛʀᴀᴄᴋs ғᴏᴜɴᴅ.</blockquote>',{parse_mode:'HTML'});if(results.length===1)return show(bot,msg.chat.id,results[0]);return bot.sendMessage(msg.chat.id,'<blockquote><b>🎵 ᴍᴜsɪᴄ ʀᴇsᴜʟᴛs</b>\n\nᴄʜᴏᴏsᴇ ᴀ ᴛʀᴀᴄᴋ:</blockquote>',{parse_mode:'HTML',reply_markup:resultsKb(results)});}catch(e){console.error('[MUSIC]',e);return bot.sendMessage(msg.chat.id,'<blockquote>❌ ᴍᴜsɪᴄ sᴇᴀʀᴄʜ ғᴀɪʟᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.</blockquote>',{parse_mode:'HTML'});}});
 bot.on('callback_query',async q=>{const d=q.data||'';try{
  if(d==='music_search'){return bot.answerCallbackQuery(q.id,{text:'ᴜsᴇ /music <song> ᴛᴏ sᴇᴀʀᴄʜ.'});}
  if(d.startsWith('music:')){await bot.answerCallbackQuery(q.id,{text:'🎵 ʟᴏᴀᴅɪɴɢ...'});const id=d.slice(6),t=last.get(id);if(t)return show(bot,q.message.chat.id,t);const results=await music.searchMusic(id);const found=results.find(x=>String(x.id)===id);return found?show(bot,q.message.chat.id,found):bot.sendMessage(q.message.chat.id,'<blockquote>❌ ᴛʀᴀᴄᴋ ɴᴏ ʟᴏɴɢᴇʀ ᴀᴠᴀɪʟᴀʙʟᴇ.</blockquote>',{parse_mode:'HTML'});}
  if(d.startsWith('music_preview:')){const id=d.split(':')[1],t=last.get(id);if(!t)return bot.answerCallbackQuery(q.id,{text:'sᴇᴀʀᴄʜ ᴛʜᴇ sᴏɴɢ ᴀɢᴀɪɴ.',show_alert:true});await bot.answerCallbackQuery(q.id,{text:'🎧 ʟᴏᴀᴅɪɴɢ ᴘʀᴇᴠɪᴇᴡ...'});try{return await sendPreview(bot,q.message.chat.id,t);}catch(e){console.error('[MUSIC PREVIEW]',e);return bot.sendMessage(q.message.chat.id,'<blockquote>❌ ᴘʀᴇᴠɪᴇᴡ ғᴀɪʟᴇᴅ.</blockquote>',{parse_mode:'HTML'});}}
  if(d.startsWith('music_dl:')){const id=d.split(':')[1],t=last.get(id);if(!t)return bot.answerCallbackQuery(q.id,{text:'sᴇᴀʀᴄʜ ᴛʜᴇ sᴏɴɢ ᴀɢᴀɪɴ.',show_alert:true});await bot.answerCallbackQuery(q.id,{text:'⬇️ ᴘʀᴇᴘᴀʀɪɴɢ ᴅᴏᴡɴʟᴏᴀᴅ...'});try{return await sendFullTrack(bot,q.message.chat.id,t);}catch(e){console.error('[MUSIC DOWNLOAD]',e);return bot.sendMessage(q.message.chat.id,'<blockquote>❌ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ.</blockquote>',{parse_mode:'HTML'});}}
  if(d==='main_menu')return bot.answerCallbackQuery(q.id);
 }catch(e){console.error('[MUSIC CALLBACK]',e);return bot.answerCallbackQuery(q.id,{text:'❌ ᴍᴜsɪᴄ ᴏᴘᴇʀᴀᴛɪᴏɴ ғᴀɪʟᴇᴅ.',show_alert:true}).catch(()=>{});}});
}
module.exports=registerMusic;
