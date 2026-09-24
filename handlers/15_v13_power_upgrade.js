"use strict";
const saved = require("../services/ariaSavedResponses");

const CARD = "https://files.catbox.moe/hjdxgx.jpg";
function sendCard(bot, chatId, text, reply_markup){
  return bot.sendPhoto(chatId, CARD, {caption:text,parse_mode:"HTML",reply_markup}).catch(()=>bot.sendMessage(chatId,text,{parse_mode:"HTML",reply_markup}));
}
function home(){return {inline_keyboard:[
  [{text:"🧠 ᴀɪ ᴍᴏᴅᴇs",callback_data:"aria_mode_open",style:"success"},{text:"🧠 ᴍᴇᴍᴏʀʏ",callback_data:"aria_memory_open",style:"primary"},{text:"📊 ᴜsᴀɢᴇ",callback_data:"aria_usage",style:"primary"}],
  [{text:"💬 ɴᴇᴡ ᴄʜᴀᴛ",callback_data:"aria_new_chat",style:"success"},{text:"💾 sᴀᴠᴇᴅ",callback_data:"aria_saved_open",style:"primary"},{text:"⚙️ sᴇᴛᴛɪɴɢs",callback_data:"aria_settings_open",style:"primary"}],
  [{text:"🏠 ʜᴏᴍᴇ",callback_data:"main_menu",style:"success"}]
]};}
module.exports=function register(ctx){
 const {bot,userHistory}=ctx;
 bot.onText(/^\/(?:newchat|new)(?:@\w+)?$/i,async msg=>{
   if(userHistory?.delete) userHistory.delete(msg.from.id);
   return sendCard(bot,msg.chat.id,"<blockquote><b>✨ ɴᴇᴡ ᴄʜᴀᴛ sᴛᴀʀᴛᴇᴅ</b>\n\nᴛʜᴇ ᴄᴜʀʀᴇɴᴛ ᴄᴏɴᴠᴇʀsᴀᴛɪᴏɴ ᴡᴀs ᴄʟᴇᴀʀᴇᴅ.\n\n🌸 sᴇɴᴅ ʏᴏᴜʀ ɴᴇxᴛ ᴍᴇssᴀɢᴇ ᴛᴏ sᴛᴀʀᴛ ғʀᴇsʜ.</blockquote>",home());
 });
 bot.onText(/^\/(?:saved|savedresponses)(?:@\w+)?$/i,async msg=>{
   const items=saved.list(msg.from.id);
   if(!items.length)return sendCard(bot,msg.chat.id,"<blockquote><b>💾 sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs</b>\n\nɴᴏ sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs ʏᴇᴛ.\n\nᴛᴀᴘ 💾 sᴀᴠᴇ ᴜɴᴅᴇʀ ᴀɴ ᴀɪ ʀᴇsᴘᴏɴsᴇ ᴛᴏ sᴀᴠᴇ ɪᴛ.</blockquote>",home());
   const lines=items.slice(0,10).map((x,i)=>`${i+1}. ${String(x.text).replace(/\n/g," ").slice(0,120)}`);
   return sendCard(bot,msg.chat.id,`<blockquote><b>💾 sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs</b>\n━━━━━━━━━━━━━━━━━━━━\n\n${lines.join("\n\n")}\n\nᴜsᴇ /saved ᴀɢᴀɪɴ ᴀɴʏᴛɪᴍᴇ ᴛᴏ ᴠɪᴇᴡ ᴛʜᴇᴍ.</blockquote>`,home());
 });
 bot.onText(/^\/(?:settings|preferences)(?:@\w+)?$/i,async msg=>sendCard(bot,msg.chat.id,"<blockquote><b>⚙️ ᴀʀɪᴀ sᴇᴛᴛɪɴɢs</b>\n━━━━━━━━━━━━━━━━━━━━\n\n🧠 ᴀɪ ᴍᴏᴅᴇ\n🧠 ᴍᴇᴍᴏʀʏ\n🌐 ʟᴀɴɢᴜᴀɢᴇ\n📊 ᴜsᴀɢᴇ\n💾 sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs\n🧹 ɴᴇᴡ ᴄʜᴀᴛ</blockquote>",home()));
 bot.on("callback_query",async q=>{
   const d=String(q.data||""),id=q.from.id,chatId=q.message?.chat?.id;
   // Exact allowlist, not a blanket "aria_" prefix — other modules (the AI
   // companion's regenerate/improve/continue buttons, mode menus, etc.)
   // share that same prefix, and a broad startsWith() here would silently
   // swallow taps meant for them.
   if(!["aria_save_response","aria_delete_response","aria_saved_open","aria_settings_open","aria_new_chat"].includes(d))return;
   if(d==="aria_save_response"){
     const text=ctx.ariaAiCompanion?.getLastResponse(id)||"";
     if(!text)return bot.answerCallbackQuery(q.id,{text:"ɴᴏ ʀᴇsᴘᴏɴsᴇ ᴛᴏ sᴀᴠᴇ.",show_alert:true}).catch(()=>{});
     saved.add(id,text);return bot.answerCallbackQuery(q.id,{text:"💾 ʀᴇsᴘᴏɴsᴇ sᴀᴠᴇᴅ.",show_alert:false}).catch(()=>{});
   }
   if(d==="aria_delete_response"){
     await ctx.ariaAiCompanion?.deletePreviousResponseMessages?.(chatId,id);
     return bot.answerCallbackQuery(q.id,{text:"🗑️ ʀᴇsᴘᴏɴsᴇ ᴅᴇʟᴇᴛᴇᴅ.",show_alert:false}).catch(()=>{});
   }
   if(d==="aria_saved_open")return bot.sendMessage(chatId,"💾 ᴜsᴇ /saved ᴛᴏ ᴠɪᴇᴡ ʏᴏᴜʀ sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs.").catch(()=>{});
   if(d==="aria_settings_open")return sendCard(bot,chatId,"<blockquote><b>⚙️ ᴀʀɪᴀ sᴇᴛᴛɪɴɢs</b>\n\nᴄʜᴏᴏsᴇ ᴀ sᴇᴛᴛɪɴɢ ᴛᴏ ᴍᴀɴᴀɢᴇ.</blockquote>",home());
   if(d==="aria_new_chat"){
     if(userHistory?.delete)userHistory.delete(id);
     return sendCard(bot,chatId,"<blockquote><b>✨ ɴᴇᴡ ᴄʜᴀᴛ sᴛᴀʀᴛᴇᴅ</b>\n\nᴛʜᴇ ᴄᴜʀʀᴇɴᴛ ᴄᴏɴᴛᴇxᴛ ʜᴀs ʙᴇᴇɴ ᴄʟᴇᴀʀᴇᴅ.</blockquote>",home());
   }
 });
};
