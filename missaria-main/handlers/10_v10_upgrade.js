'use strict';
const path=require('path');
const upgrade=require('../services/v10Upgrade');
const economy=require('../services/economyService');
const codingAccess=require('../services/codingAccess');

function register(ctx){
  const {bot}=ctx;
  const reply=(chatId,text,keyboard)=>bot.sendMessage(chatId,text,{parse_mode:'HTML',reply_markup:keyboard});
  const edit=async(q,text,keyboard)=>{const o={chat_id:q.message.chat.id,message_id:q.message.message_id,parse_mode:'HTML',reply_markup:keyboard};try{return await bot.editMessageCaption(text,o)}catch{try{return await bot.editMessageText(text,o)}catch{return reply(q.message.chat.id,text,keyboard)}}};
  const userMenu=(id)=>ctx.mainMenuKeyboard(id,1);
  const adminOnly=(id)=>ctx.isBotAdmin(id);
  const ownerOnly=(id)=>ctx.isOwner(id);
  const back={inline_keyboard:[[{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_back',style:'primary'}]]};

  const cards={
    v10_profile:'',
    v10_chat:'💬 <b>ᴀʀɪᴀ ᴄʜᴀᴛ</b>\n\n━━━━━━━━━━━━━━━━━━\n\n💗 sᴇɴᴅ ᴀʀɪᴀ ᴀɴʏ ǫᴜᴇsᴛɪᴏɴ.\n🧠 ᴜsᴇ <code>/aria</code> ғᴏʀ ᴇxᴛᴇɴᴅᴇᴅ ᴀɢᴇɴᴛ ᴛᴀsᴋs.\n📚 ᴍᴇᴍᴏʀʏ ᴀɴᴅ sᴋɪʟʟs ᴀʀᴇ ᴀᴠᴀɪʟᴀʙʟᴇ.\n\n━━━━━━━━━━━━━━━━━━',
    v10_agent:'🧠 <b>ᴀɪ ᴀɢᴇɴᴛ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴍᴜʟᴛɪ-sᴛᴇᴘ ᴘʟᴀɴɴɪɴɢ • ᴛᴏᴏʟs • ᴍᴇᴍᴏʀʏ • sᴋɪʟʟs • ᴛᴀsᴋs • ᴄᴏɴғɪʀᴍᴀᴛɪᴏɴs\n\nᴜsᴇ <code>/agent</code> ᴛᴏ sᴛᴀʀᴛ.\n\n━━━━━━━━━━━━━━━━━━',
    v10_coding:'💻 <b>ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ</b>\n\n━━━━━━━━━━━━━━━━━━\n\n🧹 ɪᴍᴘʀᴏᴠᴇ • 📖 ᴇxᴘʟᴀɪɴ • 🧪 ᴛᴇsᴛ • 🔐 sᴇᴄᴜʀɪᴛʏ • ⚡ ᴏᴘᴛɪᴍɪᴢᴇ • 📦 sᴛʀᴜᴄᴛᴜʀᴇ\n\n⭐ ᴘʀᴇᴍɪᴜᴍ: ᴜɴʟɪᴍɪᴛᴇᴅ\n💎 ғʀᴇᴇ: 100 ᴘᴏɪɴᴛs → 5 ʜᴏᴜʀs\n\n━━━━━━━━━━━━━━━━━━',
    v10_movies:'🎬 <b>ᴍᴏᴠɪᴇ sᴛʀᴇᴀᴍ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇ <code>/movie ᴀᴠᴀᴛᴀʀ</code> ᴛᴏ ғɪɴᴅ ᴍᴏᴠɪᴇs.\n✦ ᴛʀᴀɪʟᴇʀs\n✦ ʀᴀᴛɪɴɢs & ᴅᴇᴛᴀɪʟs\n✦ ᴀᴜᴛʜᴏʀɪᴢᴇᴅ ᴡᴀᴛᴄʜ ᴏᴘᴛɪᴏɴs\n\n━━━━━━━━━━━━━━━━━━',
    v10_music:'🎵 <b>ᴍᴜsɪᴄ sᴛᴜᴅɪᴏ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇ <code>/music ʙᴜʀɴᴀ ʙᴏʏ</code> ᴛᴏ sᴇᴀʀᴄʜ ғᴏʀ ᴛʀᴀᴄᴋs.\n✦ sᴏɴɢ & ᴀʀᴛɪsᴛ sᴇᴀʀᴄʜ\n✦ ᴀʟʙᴜᴍ ᴀʀᴛᴡᴏʀᴋ\n✦ 30-sᴇᴄᴏɴᴅ ᴘʀᴇᴠɪᴇᴡs\n✦ ᴀᴜᴛʜᴏʀɪᴢᴇᴅ sᴏᴜʀᴄᴇs\n\n━━━━━━━━━━━━━━━━━━',
    v10_image:'🎨 <b>ɪᴍᴀɢᴇ ɢᴇɴ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴛʏᴘᴇ <code>/image anime ᴀ ᴄɪɴᴇᴍᴀᴛɪᴄ ʟᴀɢᴏs sᴋʏʟɪɴᴇ</code> ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ.\n\n🆓 ғʀᴇᴇ: sɪɢɴᴜᴘ ʀᴇǫᴜɪʀᴇᴅ\n⭐ ᴘʀᴇᴍɪᴜᴍ: ɴᴏ sɪɢɴᴜᴘ ʀᴇǫᴜɪʀᴇᴅ\n\n━━━━━━━━━━━━━━━━━━',
    v10_research:'🔎 <b>ᴡᴇʙ ʀᴇsᴇᴀʀᴄʜ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇ <code>/search your topic</code> ᴏʀ ᴀsᴋ ᴀʀɪᴀ ᴛᴏ ʀᴇsᴇᴀʀᴄʜ ᴀ ᴛᴏᴘɪᴄ.\nᴡʜᴇɴ ᴛᴀᴠɪʟʏ ɪs ᴄᴏɴғɪɢᴜʀᴇᴅ, ᴀʀɪᴀ ᴄᴀɴ ʀᴇᴛʀɪᴇᴠᴇ ᴘᴜʙʟɪᴄ ᴡᴇʙ ʀᴇsᴜʟᴛs.\n\n━━━━━━━━━━━━━━━━━━',
    v10_files:'📁 <b>ғɪʟᴇ ᴛᴏᴏʟs</b>\n\n━━━━━━━━━━━━━━━━━━\n\n📥 ᴜᴘʟᴏᴀᴅ ғɪʟᴇs • 🔍 ɪɴsᴘᴇᴄᴛ • 🧩 ᴄᴏɴᴛᴇxᴛ • 🛡️ sᴀғᴇ ᴡᴏʀᴋsᴘᴀᴄᴇ\n\nᴀʀɪᴀ ᴅᴏᴇs ɴᴏᴛ ᴄʟᴀɪᴍ ᴛᴏ ᴇᴅɪᴛ ᴀ ғɪʟᴇ ᴜɴʟᴇss ᴛʜᴇ ᴛᴏᴏʟ ʀᴇᴘᴏʀᴛs sᴜᴄᴄᴇss.\n\n━━━━━━━━━━━━━━━━━━',
    v10_browser:'🌐 <b>ʙʀᴏᴡsᴇʀ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴘᴜʙʟɪᴄ ᴡᴇʙ ɴᴀᴠɪɢᴀᴛɪᴏɴ ᴀɴᴅ ᴇxᴛʀᴀᴄᴛɪᴏɴ ᴀʀᴇ ᴀᴠᴀɪʟᴀʙʟᴇ ᴡʜᴇɴ ᴛʜᴇ ᴀᴅᴠᴀɴᴄᴇᴅ ᴛᴏᴏʟs ᴀʀᴇ ᴇɴᴀʙʟᴇᴅ.\n\n━━━━━━━━━━━━━━━━━━',
    v10_voice:'🎙️ <b>ᴠᴏɪᴄᴇ ᴀɪ</b>\n\n━━━━━━━━━━━━━━━━━━\n\n🎤 sᴛᴛ ᴄᴀɴ ᴄᴏɴᴠᴇʀᴛ ᴠᴏɪᴄᴇ ᴛᴏ ᴛᴇxᴛ.\n🔊 ᴛᴛs ᴄᴀɴ ʀᴇᴛᴜʀɴ ᴠᴏɪᴄᴇ ᴡʜᴇɴ ᴛʜᴇ ᴘʀᴏᴠɪᴅᴇʀ ɪs ᴄᴏɴғɪɢᴜʀᴇᴅ.\n\n━━━━━━━━━━━━━━━━━━',
    v10_skills:'📚 <b>sᴋɪʟʟs</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴀʀɪᴀ ᴜsᴇs ᴍᴏᴅᴜʟᴀʀᴇ ᴍᴀʀᴋᴅᴏᴡɴ sᴋɪʟʟs ᴛᴏ ᴋᴇᴇᴘ ᴄᴏᴍᴘʟᴇx ᴛᴀsᴋs ᴏʀɢᴀɴɪᴢᴇᴅ.\n\nᴜsᴇ <code>/agent skills</code>.\n\n━━━━━━━━━━━━━━━━━━',
    v10_jobs:'⏰ <b>ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇ <code>/remind 30m your message</code> ғᴏʀ ᴏɴᴇ-sʜᴏᴛ ʀᴇᴍɪɴᴅᴇʀs.\nᴘᴇʀsɪsᴛᴇɴᴛ sᴄʜᴇᴅᴜʟᴇʀ ᴛᴏᴏʟs ᴀʀᴇ ᴀᴠᴀɪʟᴀʙʟᴇ ғᴏʀ ᴏᴡɴᴇʀ ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ.\n\n━━━━━━━━━━━━━━━━━━',
    v10_history:'🕘 <b>ʜɪsᴛᴏʀʏ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇ <code>/agent tasks</code> ᴛᴏ sᴇᴇ ʀᴇᴄᴇɴᴛ ᴀɢᴇɴᴛ ᴛᴀsᴋs.\nᴜsᴇ <code>/agent clear</code> ᴛᴏ ᴄʟᴇᴀʀ ʏᴏᴜʀ ᴀɢᴇɴᴛ ᴍᴇᴍᴏʀʏ ᴀɴᴅ ᴄᴏɴᴠᴇʀsᴀᴛɪᴏɴ.\n\n━━━━━━━━━━━━━━━━━━',
    v10_tools:'🧰 <b>ᴀɪ ᴛᴏᴏʟs</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴡᴇʙ • ᴛᴇʀᴍɪɴᴀʟ • ʙʀᴏᴡsᴇʀ • ɢɪᴛ • ᴍᴇᴍᴏʀʏ • ᴛᴏᴅᴏ • ᴄʜᴇᴄᴋᴘᴏɪɴᴛs • ᴅᴇʟᴇɢᴀᴛɪᴏɴ • ᴍᴄᴘ ʀᴇᴀᴅɪɴᴇss • ᴍᴇᴅɪᴀ\n\nᴜsᴇ <code>/agent tools</code>.\n\n━━━━━━━━━━━━━━━━━━',
  };

  for(const key of Object.keys(cards)) bot.on('callback_query',async q=>{
    if(q.data!==key) return;
    try{await bot.answerCallbackQuery(q.id);}catch{}
    let text=cards[key];
    if(key==='v10_profile') text=upgrade.userProfile(ctx,q.from.id);
    const kb={inline_keyboard:[
      ...(key==='v10_coding' ? [[{text:'💻 ᴄᴏᴅɪɴɢ sᴛᴀᴛᴜs',callback_data:'v10_coding_status',style:'primary'},{text:'🔓 ᴜɴʟᴏᴄᴋ 5ʜ',callback_data:'v10_coding_unlock',style:'success'},{text:'🧹 ᴄʟᴇᴀʀ',callback_data:'v10_clear_code',style:'primary'}]]:[]),
      [{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_back',style:'primary'},{text:'ɴᴇxᴛ ›',callback_data:'menu_page_2',style:'success'}]
    ]};
    return edit(q,text,kb);
  });

  bot.on('callback_query',async q=>{
    if(q.data==='open_media_hub'){try{await bot.answerCallbackQuery(q.id)}catch{};return bot.sendMessage(q.message.chat.id,'<blockquote><b>🌸 ᴀʀɪᴀ ᴍᴇᴅɪᴀ & ᴀɪ ʜᴜʙ</b>\n\nᴜsᴇ <code>/hub</code> ᴛᴏ ᴏᴘᴇɴ ᴛʜᴇ ᴜɴɪғɪᴇᴅ ᴅᴀsʜʙᴏᴀʀᴅ.</blockquote>',{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:'🚀 ᴏᴘᴇɴ ᴀʀɪᴀ ʜᴜʙ',callback_data:'hub_home',style:'success'}]]}})}
    const d=q.data,id=q.from.id;
    if(d==='v10_coding_status'){
      const premium=ctx.isPremiumActive(id); const rem=codingAccess.getRemainingMs(id);
      return bot.answerCallbackQuery(q.id,{text:premium?'ᴘʀᴇᴍɪᴜᴍ ᴄᴏᴅɪɴɢ ɪs ᴀᴄᴛɪᴠᴇ.':rem>0?`ᴜɴʟᴏᴄᴋᴇᴅ ғᴏʀ ${Math.ceil(rem/60000)}ᴍ.`:`ᴄᴏᴅɪɴɢ ɪs ʟᴏᴄᴋᴇᴅ.`,show_alert:true});
    }
    if(d==='v10_coding_unlock'){
      if(ctx.isPremiumActive(id)) return bot.answerCallbackQuery(q.id,{text:'ᴘʀᴇᴍɪᴜᴍ ᴀʟʀᴇᴀᴅʏ ɪɴᴄʟᴜᴅᴇs ᴄᴏᴅɪɴɢ.',show_alert:true});
      const r=codingAccess.unlockCoding(id,economy.spendPoints);
      return bot.answerCallbackQuery(q.id,{text:r.ok?'💻 ᴄᴏᴅɪɴɢ ᴜɴʟᴏᴄᴋᴇᴅ ғᴏʀ 5ʜ.':'🔒 '+r.reason,show_alert:true});
    }
    if(d==='v10_clear_code') return bot.answerCallbackQuery(q.id,{text:'ᴜsᴇ /agent clear ᴛᴏ ᴄʟᴇᴀʀ ᴀɢᴇɴᴛ ʜɪsᴛᴏʀʏ.',show_alert:true});
    if(d==='v10_admin_stats'||d==='v10_admin_system'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      const text=d==='v10_admin_system'?upgrade.systemStatus(ctx):`📊 <b>ᴀᴅᴍɪɴ sᴛᴀᴛɪsᴛɪᴄs</b>\n\n━━━━━━━━━━━━━━━━━━\n\n👥 ᴛᴏᴛᴀʟ ᴜsᴇʀs: <b>${upgrade.countUsers(ctx.users)}</b>\n⭐ ᴘʀᴇᴍɪᴜᴍ: <b>${upgrade.countPremium(ctx.users,ctx.isPremiumActive)}</b>\n📨 ᴍᴇssᴀɢᴇs: <b>${ctx.statsTracker?.getSummary?.().totalMessages||0}</b>\n🔥 ᴀᴄᴛɪᴠᴇ ᴛᴏᴅᴀʏ: <b>${ctx.statsTracker?.getSummary?.().activeToday||0}</b>\n⏱️ ᴜᴘᴛɪᴍᴇ: <b>${upgrade.formatUptime(process.uptime())}</b>\n\n━━━━━━━━━━━━━━━━━━`;
      return edit(q,text,{inline_keyboard:[[{text:'🔄 ʀᴇғʀᴇsʜ',callback_data:d,style:'success'},{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_admin',style:'primary'}]]});
    }
    if(d==='v10_admin_users'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      return edit(q,`👥 <b>ᴜsᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴛᴏᴛᴀʟ: <b>${upgrade.countUsers(ctx.users)}</b>\n\nᴜsᴇ /ban, /unban, /mute, /unmute, /addprem ᴏʀ /removeprem ᴡɪᴛʜ ᴀ ᴜsᴇʀ ɪᴅ.\n\n━━━━━━━━━━━━━━━━━━`,{inline_keyboard:[[{text:'🚫 ʙᴀɴ',callback_data:'v10_admin_ban',style:'danger'},{text:'🔇 ᴍᴜᴛᴇ',callback_data:'v10_admin_mute',style:'primary'},{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_admin',style:'primary'}]]});
    }
    if(d==='v10_admin_ban'||d==='v10_admin_mute'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      const cmd=d==='v10_admin_ban'?'/ban USER_ID':'/mute USER_ID 1h';
      return bot.answerCallbackQuery(q.id,{text:`ᴜsᴇ ${cmd} ᴛᴏ ʀᴜɴ ᴛʜɪs ᴀᴄᴛɪᴏɴ.`,show_alert:true});
    }
    if(d==='v10_admin_logs'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      const rows=upgrade.recentAudit(10); const text=`📝 <b>ᴀᴜᴅɪᴛ ʟᴏɢs</b>\n\n━━━━━━━━━━━━━━━━━━\n\n${rows.length?rows.map(r=>`• ${new Date(r.at).toLocaleString()} — <b>${upgrade.escape(r.action)}</b> — ${upgrade.escape(r.detail)}`).join('\n'):'• ɴᴏ ᴀᴜᴅɪᴛ ᴇᴠᴇɴᴛs ʏᴇᴛ.'}\n\n━━━━━━━━━━━━━━━━━━`;
      return edit(q,text,{inline_keyboard:[[{text:'🔄 ʀᴇғʀᴇsʜ',callback_data:'v10_admin_logs',style:'success'},{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_admin',style:'primary'}]]});
    }
    if(d==='v10_admin_ai'||d==='v10_admin_integrations'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      return edit(q,upgrade.integrationStatus(),{inline_keyboard:[[{text:'🔄 ʀᴇғʀᴇsʜ',callback_data:d,style:'success'},{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_admin',style:'primary'}]]});
    }
    if(d==='v10_admin_coding'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      return edit(q,`💻 <b>ᴄᴏᴅɪɴɢ ᴜsᴀɢᴇ</b>\n\n━━━━━━━━━━━━━━━━━━\n\n⭐ ᴘʀᴇᴍɪᴜᴍ ᴄᴏᴅɪɴɢ: ᴜɴʟɪᴍɪᴛᴇᴅ\n💎 ғʀᴇᴇ ᴜɴʟᴏᴄᴋ: ${codingAccess.CODING_UNLOCK_POINTS} ᴘᴏɪɴᴛs → 5ʜ\n\n━━━━━━━━━━━━━━━━━━`,{inline_keyboard:[[{text:'‹ ʙᴀᴄᴋ',callback_data:'admin_page3',style:'primary'}]]});
    }
    if(d==='v10_admin_memory'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      return edit(q,'🧠 <b>ᴍᴇᴍᴏʀʏ</b>\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇʀ ᴍᴇᴍᴏʀʏ ɪs sᴛᴏʀᴇᴅ ᴘᴇʀ ᴜsᴇʀ. ᴀʀɪᴀ ᴅᴏᴇs ɴᴏᴛ sʜᴏᴡ ᴘʀɪᴠᴀᴛᴇ ᴍᴇᴍᴏʀʏ ᴛᴏ ᴏᴛʜᴇʀ ᴜsᴇʀs.\n\nᴜsᴇ <code>/agent memory</code> ᴏʀ <code>/agent clear</code> ɪɴ ᴀ ᴜsᴇʀ ᴄʜᴀᴛ.\n\n━━━━━━━━━━━━━━━━━━',{inline_keyboard:[[{text:'‹ ʙᴀᴄᴋ',callback_data:'admin_page3',style:'primary'}]]});
    }
    if(d==='v10_admin_jobs'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      return edit(q,'⏰ <b>ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ ᴊᴏʙs</b>\n\n━━━━━━━━━━━━━━━━━━\n\n🟢 ᴘᴇʀsɪsᴛᴇɴᴛ sᴄʜᴇᴅᴜʟᴇʀ ɪs ʟᴏᴀᴅᴇᴅ.\n📝 ᴜsᴇ ɴᴀᴛᴜʀᴀʟ ʟᴀɴɢᴜᴀɢᴇ ᴡɪᴛʜ ᴀʀɪᴀ ғᴏʀ ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ ᴡʜᴇɴ ᴇɴᴀʙʟᴇᴅ.\n⏰ /remind 30m ʏᴏᴜʀ ᴍᴇssᴀɢᴇ\n\n━━━━━━━━━━━━━━━━━━',{inline_keyboard:[[{text:'‹ ʙᴀᴄᴋ',callback_data:'admin_page3',style:'primary'}]]});
    }
    if(d==='v10_admin_backup'){
      if(!ownerOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴏᴡɴᴇʀ ᴏɴʟʏ.',show_alert:true});
      try{const file=upgrade.backupData(); upgrade.audit(id,'backup',path.basename(file)); await bot.sendDocument(q.message.chat.id,file,{caption:'💾 <b>ᴠ10 ʙᴀᴄᴋᴜᴘ ᴄʀᴇᴀᴛᴇᴅ</b>',parse_mode:'HTML'}); return bot.answerCallbackQuery(q.id,{text:'ʙᴀᴄᴋᴜᴘ ᴄʀᴇᴀᴛᴇᴅ.'});}catch(e){return bot.answerCallbackQuery(q.id,{text:'ʙᴀᴄᴋᴜᴘ ғᴀɪʟᴇᴅ.',show_alert:true});}
    }
    if(d==='v10_admin_cache'){
      if(!ownerOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴏᴡɴᴇʀ ᴏɴʟʏ.',show_alert:true});
      upgrade.audit(id,'clear_cache','requested'); return bot.answerCallbackQuery(q.id,{text:'ᴄʟᴇᴀʀ ᴄᴀᴄʜᴇ ʀᴇǫᴜᴇsᴛ ʀᴇᴄᴏʀᴅᴇᴅ. ᴛʜᴇ ʙᴏᴛ ᴜsᴇs ᴍᴏᴅᴜʟᴇ-ʟᴇᴠᴇʟ ᴄᴀᴄʜᴇs.',show_alert:true});
    }
    if(d==='v10_admin_restart'){
      if(!ownerOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴏᴡɴᴇʀ ᴏɴʟʏ.',show_alert:true});
      return edit(q,'🔄 <b>ʀᴇsᴛᴀʀᴛ ᴍɪss ᴀʀɪᴀ?</b>\n\nᴛʜɪs ᴡɪʟʟ sᴛᴏᴘ ᴛʜᴇ ᴄᴜʀʀᴇɴᴛ ᴘʀᴏᴄᴇss. ʀᴇɴᴅᴇʀ/ʀᴀɪʟᴡᴀʏ/ᴘᴍ2 ᴄᴀɴ ʀᴇsᴛᴀʀᴛ ɪᴛ.\n\n⚠️ ᴄᴏɴғɪʀᴍ ᴛᴏ ᴄᴏɴᴛɪɴᴜᴇ.',{inline_keyboard:[[{text:'✅ ᴄᴏɴғɪʀᴍ',callback_data:'v10_admin_restart_confirm',style:'danger'},{text:'❌ ᴄᴀɴᴄᴇʟ',callback_data:'admin_page3',style:'primary'}]]});
    }
    if(d==='v10_admin_restart_confirm'){
      if(!ownerOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴏᴡɴᴇʀ ᴏɴʟʏ.',show_alert:true});
      upgrade.audit(id,'restart','confirmed'); await bot.answerCallbackQuery(q.id,{text:'ʀᴇsᴛᴀʀᴛɪɴɢ…'}); setTimeout(()=>process.exit(0),500); return;
    }
    if(d==='v10_admin_admins'){
      if(!adminOnly(id)) return bot.answerCallbackQuery(q.id,{text:'ᴀᴅᴍɪɴs ᴏɴʟʏ.',show_alert:true});
      const admins=ctx.listAdmins?.()||[]; return edit(q,`👑 <b>ᴀᴅᴍɪɴ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ</b>\n\n━━━━━━━━━━━━━━━━━━\n\n${admins.length?admins.map(a=>`• <code>${upgrade.escape(a.id||a.userId||a)}</code>`).join('\n'):'• ɴᴏ ᴀᴅᴍɪɴs ʟɪsᴛᴇᴅ.'}\n\n━━━━━━━━━━━━━━━━━━\n\nᴜsᴇ /addadmin ᴏʀ /deladmin ғᴏʀ ᴄʜᴀɴɢᴇs.`,{inline_keyboard:[[{text:'‹ ʙᴀᴄᴋ',callback_data:'admin_page2',style:'primary'}]]});
    }
  });

  bot.onText(/^\/v10(?:\s+help)?$/i,async msg=>{
    if(!adminOnly(msg.from.id)) return;
    await reply(msg.chat.id,'🛠️ <b>ᴠ10 ᴜᴘɢʀᴀᴅᴇ</b>\n\nᴜɴɪғɪᴇᴅ ᴀɪ ᴀɢᴇɴᴛ • ᴘʀᴏғɪʟᴇ • ᴄᴏᴅɪɴɢ • ᴍᴇᴍᴏʀʏ • ᴡᴇʙ • ᴍᴇᴅɪᴀ • ᴀᴜᴛᴏᴍᴀᴛɪᴏɴ • ᴀᴜᴅɪᴛ • ʙᴀᴄᴋᴜᴘ • ʀɪsᴋ ᴄᴏɴғɪʀᴍᴀᴛɪᴏɴs.');
  });

  bot.on('message',msg=>{if(msg.from&&msg.text&&!msg.text.startsWith('/')) upgrade.audit(msg.from.id,'message','');});
}
module.exports=register;
