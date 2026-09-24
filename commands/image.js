'use strict';

const axios = require('axios');
const animation = require('../services/imageGenerationAnimation');
const studio = require('../services/imageStudio');

const API_BASE = 'https://prexzyapis.com';
const IMAGE_MODELS = [
  ['3ᴅ ʀᴇɴᴅᴇʀ','3d-render'],['ᴀʙsᴛʀᴀᴄᴛ','abstract'],['ᴀɴɪᴍᴇ','anime'],['ᴀʀᴛ ᴅᴇᴄᴏ','art-deco'],['ᴀʀᴛ ɴᴏᴜᴠᴇᴀᴜ','art-nouveau'],['ʙᴀʀᴏǫᴜᴇ','baroque'],['ʙʟᴜᴇᴘʀɪɴᴛ','blueprint'],['ᴄᴀʀᴛᴏᴏɴ','cartoon'],['ᴄʜᴀʀᴄᴏᴀʟ','charcoal'],['ᴄʟᴀʏᴍᴀᴛɪᴏɴ','claymation'],['ᴄᴏᴍɪᴄ ʙᴏᴏᴋ','comic-book'],['ᴄʏʙᴇʀᴘᴜɴᴋ','cyberpunk'],['ᴇᴍʙʀᴏɪᴅᴇʀʏ','embroidery'],['ғᴀɴᴛᴀsʏ','fantasy'],['ɢᴏᴛʜɪᴄ','gothic'],['ɢʀᴀғғɪᴛɪ','graffiti'],['ʜᴏʀʀᴏʀ','horror'],['ɪᴍᴘʀᴇssɪᴏɴɪsᴛ','impressionist'],['ɪɴᴋ ᴡᴀsʜ','ink-wash'],['ɪsᴏᴍᴇᴛʀɪᴄ','isometric'],['ʟɪɴᴇ ᴀʀᴛ','line-art'],['ʟᴏᴡ ᴘᴏʟʏ','low-poly'],['ᴍᴀᴄʀᴏ ᴘʜᴏᴛᴏ','macro-photo'],['ᴍɪɴɪᴍᴀʟɪsᴛ','minimalist'],['ɴᴇᴏ ɴᴏɪʀ','neo-noir'],['ᴏɪʟ ᴘᴀɪɴᴛɪɴɢ','oil-painting'],['ᴘɪxᴇʟ ᴀʀᴛ','pixel-art'],['ᴘᴏᴘ ᴀʀᴛ','pop-art'],['ʀᴇᴀʟɪsᴛɪᴄ','realistic'],['sᴄɪ-ғɪ','sci-fi'],['sᴋᴇᴛᴄʜ','sketch'],['sᴛᴇᴀᴍᴘᴜɴᴋ','steampunk'],['sᴜʀʀᴇᴀʟ','surreal'],['sʏɴᴛʜᴡᴀᴠᴇ','synthwave'],['ᴠɪɴᴛᴀɢᴇ','vintage'],['ᴡᴀᴛᴇʀᴄᴏʟᴏʀ','watercolor']
];
const IMAGE_CREATORS = [['ᴛᴇxᴛ ᴛᴏ ɢɪғ','gif'],['ᴛᴇxᴛ ᴛᴏ ᴍᴘ4','mp4'],['ᴍᴇᴍᴇ','meme'],['ᴛᴛᴘ','ttp']];
const imagePending = new Map();

function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function menuText(page=0){const total=Math.ceil(IMAGE_MODELS.length/10);return `<blockquote><b>🎨 ᴀʀɪᴀ ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ 2.0</b>\n\n✦ sᴛʏʟᴇs • ᴠᴀʀɪᴀᴛɪᴏɴs • ʜᴅ • ᴀsᴘᴇᴄᴛs\n✦ ᴘʀᴏᴍᴘᴛ ᴇɴʜᴀɴᴄᴇʀ • ɴᴇɢᴀᴛɪᴠᴇ ᴘʀᴏᴍᴘᴛs\n✦ ʜɪsᴛᴏʀʏ • ғᴀᴠᴏʀɪᴛᴇs • ʀᴇɢᴇɴᴇʀᴀᴛᴇ\n\n<b>ᴘᴀɢᴇ ${page+1}/${total}</b>\n\nᴜsᴇ <code>/image your prompt</code> ᴛᴏ sᴛᴀʀᴛ.</blockquote>`;}
function keyboard(page=0){const per=10,total=Math.ceil(IMAGE_MODELS.length/per),items=IMAGE_MODELS.slice(page*per,page*per+per),rows=[];for(let i=0;i<items.length;i+=2)rows.push(items.slice(i,i+2).map(x=>({text:`🎨 ${x[0]}`,callback_data:`imgstyle:${x[1]}`})));const nav=[];if(page)nav.push({text:'⬅️ ᴘʀᴇᴠ',callback_data:`imgpage:${page-1}`});if(page<total-1)nav.push({text:'ɴᴇxᴛ ➡️',callback_data:`imgpage:${page+1}`});if(nav.length)rows.push(nav);rows.push([{text:'🧰 sᴛᴜᴅɪ ᴏᴘᴛɪᴏɴs',callback_data:'imgstudio'},{text:'📚 ʜɪsᴛᴏʀʏ',callback_data:'imghistory'}]);rows.push([{text:'🏠 ᴍᴀɪɴ ᴍᴇɴᴜ',callback_data:'main_menu'}]);return {inline_keyboard:rows};}
function optionsKeyboard(){return {inline_keyboard:[[{text:'✨ ᴇɴʜᴀɴᴄᴇ',callback_data:'imgopt:enhance'},{text:'📐 ᴀsᴘᴇᴄᴛ',callback_data:'imgopt:aspect'}],[{text:'💎 ǫᴜᴀʟɪᴛʏ',callback_data:'imgopt:quality'},{text:'🔢 ᴠᴀʀɪᴀᴛɪᴇs',callback_data:'imgopt:variations'}],[{text:'🚫 ɴᴇɢᴀᴛɪᴠᴇ',callback_data:'imgopt:negative'},{text:'🎨 ɢᴇɴᴇʀᴀᴛᴇ',callback_data:'imgrun'}],[{text:'❌ ᴄᴀɴᴄᴇʟ',callback_data:'imgcancel'}]]};}
function optionsText(s){return `<blockquote><b>🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ — sᴇᴛᴜᴘ</b>\n━━━━━━━━━━━━━━━━━━\n✦ sᴛʏʟᴇ: <b>${esc(s.style)}</b>\n✦ ᴀsᴘᴇᴄᴛ: <b>${esc(s.aspect)}</b>\n✦ ǫᴜᴀʟɪᴛʏ: <b>${esc(s.quality)}</b>\n✦ ᴠᴀʀɪᴀᴛɪᴏɴs: <b>${s.variations}</b>\n✦ ᴘʀᴏᴍᴘᴛ ᴇɴʜᴀɴᴄᴇʀ: <b>${s.enhanced?'ᴏɴ':'ᴏғғ'}</b>\n✦ ɴᴇɢᴀᴛɪᴠᴇ: <b>${esc(s.negative||'ɴᴏɴᴇ')}</b>\n━━━━━━━━━━━━━━━━━━\n✦ <code>${esc(s.prompt)}</code></blockquote>`;}

async function fetchStyle(prompt,style){const r=await axios.get(`${API_BASE}/ai/${style}`,{params:{prompt},responseType:'arraybuffer',timeout:120000,validateStatus:()=>true});const b=Buffer.from(r.data||[]);const ct=String(r.headers['content-type']||'');if(r.status<200||r.status>=300||!b.length||!ct.startsWith('image/'))throw new Error(`provider returned ${r.status} ${ct||'invalid data'}`);return {image:b,engine:`Prexzy ${style}`};}

async function sendImageLimitNotice(bot,chatId){
  const text=`<blockquote expandable='true'>
🎨 <b>ɪᴍᴀɢᴇ ʟɪᴍɪᴛ ʀᴇᴀᴄʜᴇᴅ</b>

ʏᴏᴜ ʜᴀᴠᴇ ᴜsᴇᴅ ʏᴏᴜʀ <b>3 ғʀᴇᴇ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴs</b> ғᴏʀ ᴛᴏᴅᴀʏ.

⭐ ᴜᴘɢʀᴀᴅᴇ ᴛᴏ ᴘʀᴇᴍɪᴜᴍ ᴛᴏ ᴜɴʟᴏᴄᴋ ᴍᴏʀᴇ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴs.
</blockquote>`;
  return bot.sendMessage(chatId,text,{parse_mode:'HTML',reply_markup:{inline_keyboard:[
    [{text:'⭐ ᴘʀᴇᴍɪᴜᴍ',callback_data:'aria_premium_info',style:'success'},{text:'👑 ᴏᴡɴᴇʀ',callback_data:'aria_owner_info',style:'primary'}]
  ]}});
}
async function run(bot,query){const userId=query.from.id,chatId=query.message.chat.id,s=studio.state(userId);if(!s.prompt)return bot.answerCallbackQuery(query.id,{text:'❌ ᴘʀᴏᴍᴘᴛ ɪs ᴍɪssɪɴɢ.'});await bot.answerCallbackQuery(query.id,{text:'🎨 sᴛᴀʀᴛɪɴɢ ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ...'});const requestedCount=Math.max(1,Math.min(4,Number(s.variations)||1));
const quota=imageUsage.status(bot.__missAriaCtx,userId);
if(!quota.premium && quota.remaining<=0){
  return sendImageLimitNotice(bot,chatId);
}
const count=quota.premium ? requestedCount : Math.min(requestedCount,quota.remaining);
const control={cancelled:false};studio.setRunning(userId,control);for(let i=0;i<count;i++){
if(control.cancelled)break;
const reservation=imageUsage.consume(bot.__missAriaCtx,userId);
if(!reservation.allowed)break;
const final=await animation.start(bot,chatId,userId,()=>fetchStyle(studio.makePrompt(s),s.style),{subtitle:`✦ ᴠᴀʀɪᴀᴛɪᴏɴ ${i+1}/${count}`});if(control.cancelled)break;const result=final.result;const item=studio.addHistory(userId,{prompt:s.prompt,style:s.style,aspect:s.aspect,quality:s.quality,engine:result.engine,image:result.image});const caption=`<blockquote><b>🎨 ᴠᴀʀɪᴀᴛɪᴏɴ ${i+1}/${count}</b>\n\n✦ ${esc(s.prompt)}\n✦ ${esc(s.style)} • ${esc(s.aspect)} • ${esc(s.quality)}\n\n⚡ ${esc(result.engine)}</blockquote>`;await bot.sendPhoto(chatId,result.image,{caption,parse_mode:'HTML',reply_markup:{inline_keyboard:[[ {text:'❤️ ғᴀᴠᴏʀɪᴛᴇ',callback_data:`imgfav:${item.id}`,style:'success'},{text:'🔄 ʀᴇɢᴇɴᴇʀᴀᴛᴇ',callback_data:'img_regen',style:'primary'}],[{text:'✏️ ᴄʜᴀɴɢᴇ ᴘʀᴏᴍᴘᴛ',callback_data:'img_change',style:'primary'},{text:'🧰 sᴛᴜᴅɪ',callback_data:'imgstudio',style:'primary'}],[{text:'📚 ʜɪsᴛᴏʀʏ',callback_data:'imghistory'}]]}});}
studio.setRunning(userId,null);
const after=imageUsage.status(bot.__missAriaCtx,userId);
if(!after.premium && after.remaining<=0) await sendImageLimitNotice(bot,chatId);
}

async function imageCommand(bot,msg,match){const prompt=Array.isArray(match)?match.slice(1).join(' ').trim():String(match||'').trim();if(!prompt)return bot.sendMessage(msg.chat.id,menuText(),{parse_mode:'HTML',reply_markup:keyboard(0)});const s=studio.save(msg.from.id,{...studio.state(msg.from.id),prompt});return bot.sendMessage(msg.chat.id,optionsText(s),{parse_mode:'HTML',reply_markup:optionsKeyboard()});}

function registerImageCallbacks(bot){ bot.__missAriaCtx = bot.__missAriaCtx || null;bot.on('callback_query',async q=>{const d=q.data||'';try{if(d==='main_menu')return bot.answerCallbackQuery(q.id).then(()=>bot.sendMessage(q.message.chat.id,'🏠 ᴍᴀɪɴ ᴍᴇɴᴜ'));if(d.startsWith('imgpage:')){const p=Math.max(0,Number(d.split(':')[1])||0);await bot.answerCallbackQuery(q.id);return bot.editMessageText(menuText(p),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:keyboard(p)});}if(d.startsWith('imgstyle:')){const style=d.slice(8);studio.save(q.from.id,{style});await bot.answerCallbackQuery(q.id,{text:`🎨 ${style}`});return bot.editMessageText(optionsText(studio.state(q.from.id)),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:optionsKeyboard()});}if(d==='imgstudio'){await bot.answerCallbackQuery(q.id);return bot.editMessageText(optionsText(studio.state(q.from.id)),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:optionsKeyboard()});}if(d==='imgopt:enhance'){const s=studio.state(q.from.id);studio.save(q.from.id,{enhanced:!s.enhanced});return bot.editMessageText(optionsText(studio.state(q.from.id)),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:optionsKeyboard()});}if(d==='imgopt:aspect'){const s=studio.state(q.from.id);const i=studio.ASPECTS.indexOf(s.aspect);studio.save(q.from.id,{aspect:studio.ASPECTS[(i+1)%studio.ASPECTS.length]});return bot.editMessageText(optionsText(studio.state(q.from.id)),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:optionsKeyboard()});}if(d==='imgopt:quality'){const s=studio.state(q.from.id);const i=studio.QUALITIES.indexOf(s.quality);studio.save(q.from.id,{quality:studio.QUALITIES[(i+1)%studio.QUALITIES.length]});return bot.editMessageText(optionsText(studio.state(q.from.id)),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:optionsKeyboard()});}if(d==='imgopt:variations'){const s=studio.state(q.from.id);studio.save(q.from.id,{variations:s.variations>=4?1:s.variations+1});return bot.editMessageText(optionsText(studio.state(q.from.id)),{chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:optionsKeyboard()});}if(d==='imgopt:negative'){return bot.answerCallbackQuery(q.id,{text:'ᴜsᴇ /image negative:... ɪɴ ᴀ ᴘʀᴏᴍᴘᴛ ᴛᴏ sᴇᴛ ɪᴛ.'});}if(d==='imgrun')return run(bot,q);if(d==='imgcancel'){studio.cancel(q.from.id);return bot.answerCallbackQuery(q.id,{text:'🛑 ɢᴇɴᴇʀᴀᴛɪᴏɴ ᴄᴀɴᴄᴇʟʟᴇᴅ.'});}if(d==='img_regen')return run(bot,q);if(d==='img_change'||d==='img_new')return bot.answerCallbackQuery(q.id,{text:'✏️ ᴜsᴇ /image <prompt> ᴛᴏ ᴄʜᴀɴɢᴇ ɪᴛ.'});if(d==='imghistory'){const h=studio.getHistory(q.from.id);await bot.answerCallbackQuery(q.id);return bot.sendMessage(q.message.chat.id,h.length?'<blockquote><b>📚 ʏᴏᴜʀ ɪᴍᴀɢᴇ ʜɪsᴛᴏʀʏ</b>\n\n'+h.slice(0,10).map((x,i)=>`${i+1}. ${esc(x.prompt)} — ${esc(x.style)}`).join('\n')+'</blockquote>':'<blockquote>📚 ʏᴏᴜʀ ʜɪsᴛᴏʀʏ ɪs ᴇᴍᴘᴛʏ.</blockquote>',{parse_mode:'HTML'});}if(d.startsWith('imgfav:')){const id=d.slice(7),item=studio.getHistory(q.from.id).find(x=>x.id===id);if(item)studio.addFavorite(q.from.id,item);return bot.answerCallbackQuery(q.id,{text:'❤️ sᴀᴠᴇᴅ ᴛᴏ ғᴀᴠᴏʀɪᴛᴇs.'});}}catch(e){console.error('[IMAGE STUDIO]',e);await bot.answerCallbackQuery(q.id,{text:'❌ ᴛʜᴇʀᴇ ᴡᴀs ᴀ ᴘʀᴏʙʟᴇᴍ.'}).catch(()=>{});}});}
function registerImageTextHandler(bot){bot.onText(/^\/image(?:@\w+)?(?:\s+(.+))?$/i,async(msg,match)=>{try{await imageCommand(bot,msg,match);}catch(e){console.error('[IMAGE COMMAND]',e);await bot.sendMessage(msg.chat.id,'❌ ɪᴍᴀɢᴇ ᴄᴏᴍᴍᴀɴᴅ ғᴀɪʟᴇᴅ.');}});}
module.exports={imageCommand,registerImageCallbacks,registerImageTextHandler,imageKeyboard:keyboard,IMAGE_MODELS,IMAGE_CREATORS,imagePending};
