'use strict';
const hub=require('../services/mediaHub');
function register(ctx){
 const {bot}=ctx;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const kb={inline_keyboard:[
  [{text:'🤖 ᴀɪ ᴀɢᴇɴᴛ',callback_data:'hub_agent',style:'success'},{text:'🎨 ɪᴍᴀɢᴇs',callback_data:'hub_images',style:'primary'},{text:'🎬 ᴍᴏᴠɪᴇs',callback_data:'hub_movies',style:'primary'}],
  [{text:'🎵 ᴍᴜsɪᴄ',callback_data:'hub_music',style:'success'},{text:'🔎 ᴡᴇʙ',callback_data:'hub_web',style:'primary'},{text:'💻 ᴄᴏᴅɪɴɢ',callback_data:'hub_code',style:'primary'}],
  [{text:'📚 sᴋɪʟʟs',callback_data:'hub_skills',style:'primary'},{text:'⏰ ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ',callback_data:'hub_jobs',style:'success'},{text:'📁 ғɪʟᴇs',callback_data:'hub_files',style:'primary'}],
  [{text:'❤️ ғᴀᴠᴏʀɪᴛᴇs',callback_data:'hub_favs',style:'danger'},{text:'🕘 ʜɪsᴛᴏʀʏ',callback_data:'hub_history',style:'primary'},{text:'🎧 ǫᴜᴇᴜᴇ',callback_data:'hub_queue',style:'success'}],
  [{text:'🏠 ᴍᴀɪɴ ᴍᴇɴᴜ',callback_data:'main_menu',style:'success'}]
 ]};
 const send=(chat,text,markup=kb)=>bot.sendPhoto(chat,'https://files.catbox.moe/hjdxgx.jpg',{caption:text,parse_mode:'HTML',reply_markup:markup});
 bot.onText(/^\/(?:hub|media)(?:@\w+)?$/i,msg=>send(msg.chat.id,'<blockquote><b>🌸 ᴀʀɪᴀ ᴍᴇᴅɪᴀ & ᴀɪ ʜᴜʙ</b>\n━━━━━━━━━━━━━━━━━━━━\n\n🤖 ᴀɪ ᴀɢᴇɴᴛ\n🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ\n🎬 ᴍᴏᴠɪᴇ sᴛʀᴇᴀᴍ\n🎵 ᴍᴜsɪᴄ sᴛᴜᴅɪᴏ\n🔎 ᴡᴇʙ ʀᴇsᴇᴀʀᴄʜ\n💻 ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ\n⏰ ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ\n📁 ғɪʟᴇ ᴛᴏᴏʟs\n\n❤️ ғᴀᴠᴏʀɪᴛs • 🕘 ʜɪsᴛᴏʀʏ • 🎧 ǫᴜᴇᴜᴇ\n━━━━━━━━━━━━━━━━━━━━</blockquote>'));
 bot.on('callback_query',async q=>{const d=q.data||'',id=q.from.id;if(!d.startsWith('hub_'))return;try{await bot.answerCallbackQuery(q.id);}catch{};
  const map={hub_agent:['🧠 ᴀɪ ᴀɢᴇɴᴛ','/agent'],hub_images:['🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ','/image <prompt>'],hub_movies:['🎬 ᴍᴏᴠɪᴇ sᴛʀᴇᴀᴍ','/movie <title>'],hub_music:['🎵 ᴍᴜsɪᴄ sᴛᴜᴅɪᴏ','/music <song>'],hub_web:['🔎 ᴡᴇʙ ʀᴇsᴇᴀʀᴄʜ','/search <topic>'],hub_code:['💻 ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ','/code <task>'],hub_skills:['📚 sᴋɪʟʟs','/agent skills'],hub_jobs:['⏰ ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ','/remind 30m <message>'],hub_files:['📁 ғɪʟᴇ ᴛᴏᴏʟs','sᴇɴᴅ ᴀ ғɪʟᴇ ᴛᴏ ᴀʀɪᴀ']};
  if(map[d]) return send(q.message.chat.id,`<blockquote><b>${map[d][0]}</b>\n\nᴜsᴇ <code>${esc(map[d][1])}</code> ᴛᴏ sᴛᴀʀᴛ.\n\n‹ ᴛʜɪs ʜᴜʙ ɪs ᴛʜᴇ ᴄᴇɴᴛʀᴀʟ ᴇɴᴛʀʏ ᴘᴏɪɴᴛ ғᴏʀ ᴀʀɪᴀ's ᴛᴏᴏʟs.</blockquote>`,kb);
  if(d==='hub_favs'||d==='hub_history'||d==='hub_queue'){const fn=d==='hub_favs'?hub.favorites:d==='hub_history'?hub.history:hub.queue;const rows=fn(id);const title=d==='hub_favs'?'❤️ ғᴀᴠᴏʀɪᴛᴇs':d==='hub_history'?'🕘 ʜɪsᴛᴏʀʏ':'🎧 ǫᴜᴇᴜᴇ';const body=rows.length?rows.slice(0,12).map((x,i)=>`${i+1}. ${esc(x.title||x.name||x.key)}`).join('\n'):'• ɴᴏ ɪᴛᴇᴍs ʏᴇᴛ.';return send(q.message.chat.id,`<blockquote><b>${title}</b>\n━━━━━━━━━━━━━━━━━━━━\n${body}\n━━━━━━━━━━━━━━━━━━━━</blockquote>`,{inline_keyboard:[[d==='hub_history'?{text:'🗑️ ᴄʟᴇᴀʀ ʜɪsᴛᴏʀʏ',callback_data:'hub_clear_history',style:'danger'}:{text:'🔄 ʀᴇғʀᴇsʜ',callback_data:d,style:'success'}],[{text:'‹ ʜᴜʙ',callback_data:'hub_home',style:'primary'}]]});}
  if(d==='hub_clear_history'){hub.clearHistory(id);return send(q.message.chat.id,'<blockquote>🗑️ ʜɪsᴛᴏʀʏ ᴄʟᴇᴀʀᴇᴅ.</blockquote>',kb)}
  if(d==='hub_home')return send(q.message.chat.id,'<blockquote>🌸 ᴀʀɪᴀ ᴍᴇᴅɪᴀ & ᴀɪ ʜᴜʙ</blockquote>',kb);
 });
}
module.exports=register;
