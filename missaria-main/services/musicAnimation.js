'use strict';
const FRAMES=['▱','▰'];
const STAGES=[['🔎','sᴇᴀʀᴄʜɪɴɢ ᴛʀᴀᴄᴋs',18],['🎤','ғɪɴᴅɪɴɢ ᴀʀᴛɪsᴛ & ᴀʟʙᴜᴍ',34],['💿','ʟᴏᴀᴅɪɴɢ ᴀʀᴛᴡᴏʀᴋ',52],['🎧','ᴄʜᴇᴄᴋɪɴɢ ᴘʀᴇᴠɪᴇᴡ',70],['🛡️','ᴄʜᴇᴄᴋɪɴɢ ᴀᴜᴛʜᴏʀɪᴢᴇᴅ sᴏᴜʀᴄᴇs',86],['✨','ғɪɴᴀʟɪᴢɪɴɢ ʀᴇsᴜʟᴛs',96]];
function bar(p){const n=24,filled=Math.round(n*p/100);return '█'.repeat(filled)+'░'.repeat(n-filled);}
function text(stage,p,frame){return `<blockquote><b>🎵 ᴍᴜsɪᴄ sᴛᴜᴅɪᴏ</b>\n━━━━━━━━━━━━━━━━━━━━━━━━\n${FRAMES[frame%2]} ${stage[0]} <b>${stage[1]}</b>\n\n<code>${bar(p)}</code> <b>${p}%</b>\n\n⚡ ᴘʀᴇᴘᴀʀɪɴɢ ʏᴏᴜʀ ᴍᴜsɪᴄ ʀᴇsᴜʟᴛ...</blockquote>`;}
async function start(bot,chatId,query,work){
 const m=await bot.sendMessage(chatId,text(STAGES[0],8,0),{parse_mode:'HTML'});
 let timer, i=0;
 try {
   timer=setInterval(()=>{i++;const stage=STAGES[Math.min(Math.floor(i/2),STAGES.length-1)];const p=Math.min(stage[2],8+i*8);bot.editMessageText(text(stage,p,i),{chat_id:chatId,message_id:m.message_id,parse_mode:'HTML'}).catch(()=>{});},850);
   const result=await work();
   clearInterval(timer);
   await bot.editMessageText(text(['✅','ʀᴇsᴜʟᴛs ʀᴇᴀᴅʏ',100],100,i),{chat_id:chatId,message_id:m.message_id,parse_mode:'HTML'}).catch(()=>{});
   return result;
 } catch(e){clearInterval(timer);throw e;}
}
module.exports={start};
