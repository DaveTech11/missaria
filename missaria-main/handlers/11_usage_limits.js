const limits=require('../services/usageLimits');
module.exports=function register(ctx){
 const {bot}=ctx;
 bot.onText(/\/usage(?:@\w+)?$/,async msg=>{
  const s=limits.status(ctx,msg.from.id);
  const caption=`<blockquote expandable='true'>
🌸 <b>ᴍɪss ᴀʀɪᴀ</b> 🌸
<i>ᴜsᴀɢᴇ & ʟɪᴍɪᴛs</i>

━━━━━━━━━━━━━━━━━━

💎 <b>ᴘʟᴀɴ:</b> ${s.premium?'⭐ ᴘʀᴇᴍɪᴜᴍ':'🆓 ғʀᴇᴇ'}

📨 <b>ᴍᴇssᴀɢᴇs:</b> ${s.used.messages}/${s.limits.messages}
🤖 <b>ᴀɢᴇɴᴛ:</b> ${s.used.agent}/${s.limits.agent}
🎨 <b>ɪᴍᴀɢᴇs:</b> ${s.used.images}/${s.limits.images}
💻 <b>ᴄᴏᴅɪɴɢ:</b> ${s.used.coding}/${s.limits.coding}

━━━━━━━━━━━━━━━━━━

⭐ <i>ᴘʀᴇᴍɪᴜᴍ ᴜɴʟᴏᴄᴋs ᴛʜᴇ ᴘʀᴇᴍɪᴜᴍ ʟɪᴍɪᴛs.</i>
</blockquote>`;
  return bot.sendPhoto(msg.chat.id,'https://files.catbox.moe/hjdxgx.jpg',{caption,parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:'⭐ ɢᴇᴛ ᴘʀᴇᴍɪᴜᴍ',callback_data:'menu_premium',style:'success'},{text:'‹ ʙᴀᴄᴋ',callback_data:'menu_back',style:'primary'}]],},reply_to_message_id:msg.message_id});
 });
 ctx.usageLimits=limits;
};
