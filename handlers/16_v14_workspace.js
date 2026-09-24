"use strict";
const chats=require("../services/ariaChatStore");
const prefs=require("../services/ariaPreferences");
const CARD="https://files.catbox.moe/hjdxgx.jpg";
const fileModeUsers=new Set();
function card(bot,chatId,text,reply_markup){return bot.sendPhoto(chatId,CARD,{caption:text,parse_mode:"HTML",reply_markup}).catch(()=>bot.sendMessage(chatId,text,{parse_mode:"HTML",reply_markup}));}
function home(){return {inline_keyboard:[
 [{text:"💬 ᴍʏ ᴄʜᴀᴛs",callback_data:"aria14_chats",style:"success"},{text:"🧠 ᴀᴜᴛᴏ ᴀɪ",callback_data:"aria14_auto",style:"primary"},{text:"⚙️ sᴇᴛᴛɪɴɢs",callback_data:"aria14_settings",style:"primary"}],
 [{text:"📁 ғɪʟᴇ ᴀɪ",callback_data:"aria14_file",style:"success"},{text:"📊 ᴀᴅᴍɪ sᴛᴀᴛs",callback_data:"aria14_admin",style:"primary"}],
 [{text:"🏠 ʜᴏᴍᴇ",callback_data:"main_menu",style:"success"}]
]};}
function isAdmin(ctx,id){try{return !!ctx.isOwner?.(id)||!!ctx.isBotAdmin?.(id)}catch{return false}}
function chatListText(id){const items=chats.list(id);if(!items.length)return "<blockquote><b>💬 ᴍʏ ᴄʜᴀᴛs</b>\n\nɴᴏ ᴀʀᴄʜɪᴠᴇᴅ ᴄʜᴀᴛs ʏᴇᴛ.\n\nᴜsᴇ /savechat ᴛᴏ sᴀᴠᴇ ᴛʜᴇ ᴄᴜʀʀᴇɴᴛ ᴄʜᴀᴛ.</blockquote>";return `<blockquote><b>💬 ᴍʏ ᴄʜᴀᴛs</b>\n━━━━━━━━━━━━━━━━━━\n\n${items.slice(0,10).map((x,i)=>`${i+1}. <b>${esc(x.title)}</b>\n   <code>${x.id}</code>`).join("\n\n")}\n\nᴜsᴇ /switchchat &lt;ɪᴅ&gt; ᴛᴏ ᴏᴘᴇɴ ᴏɴᴇ.</blockquote>`}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
module.exports=function register(ctx){const {bot,userHistory}=ctx;
 bot.onText(/^\/savechat(?:@\w+)?(?:\s+(.+))?$/i,async msg=>{const title=(msg.text.match(/^\/savechat(?:@\w+)?(?:\s+(.+))?$/i)||[])[1]||`ᴄʜᴀᴛ ${new Date().toLocaleDateString()}`;const item=chats.create(msg.from.id,title,userHistory?.get?.(msg.from.id)||[]);return card(bot,msg.chat.id,`<blockquote><b>💾 ᴄʜᴀᴛ sᴀᴠᴇᴅ</b>\n\n<b>${esc(item.title)}</b>\n\nɪᴅ: <code>${item.id}</code></blockquote>`,home())});
 bot.onText(/^\/chats(?:@\w+)?$/i,async msg=>card(bot,msg.chat.id,chatListText(msg.from.id),home()));
 bot.onText(/^\/switchchat(?:@\w+)?\s+(.+)$/i,async msg=>{const id=(msg.text.match(/^\/switchchat(?:@\w+)?\s+(.+)$/i)||[])[1]?.trim();const item=chats.get(msg.from.id,id);if(!item)return card(bot,msg.chat.id,"<blockquote>❌ ᴄʜᴀᴛ ɴᴏᴛ ғᴏᴜɴᴅ.</blockquote>",home());userHistory?.set?.(msg.from.id,Array.isArray(item.history)?item.history:[]);return card(bot,msg.chat.id,`<blockquote><b>🔀 ᴄʜᴀᴛ sᴡɪᴛᴄʜᴇᴅ</b>\n\n${esc(item.title)} ɪs ɴᴏᴡ ᴀᴄᴛɪᴠᴇ.</blockquote>`,home())});
 bot.onText(/^\/deletechat(?:@\w+)?\s+(.+)$/i,async msg=>{const id=(msg.text.match(/^\/deletechat(?:@\w+)?\s+(.+)$/i)||[])[1]?.trim();chats.remove(msg.from.id,id);return card(bot,msg.chat.id,"<blockquote>🗑️ ᴄʜᴀᴛ ᴀʀᴄʜɪᴠᴇ ᴜᴘᴅᴀᴛᴇᴅ.</blockquote>",home())});
 bot.onText(/^\/fileai(?:@\w+)?$/i,async msg=>{fileModeUsers.add(String(msg.from.id));return card(bot,msg.chat.id,"<blockquote><b>📁 ғɪʟᴇ ᴀɪ</b>\n\nꜱᴇɴᴅ ᴀ ᴛᴇxᴛ, ᴍᴀʀᴋᴅᴏᴡɴ, ᴊs, ᴛs, ᴘʏ, ᴊsᴏɴ, ᴄsᴠ ᴏʀ ᴛxᴛ ғɪʟᴇ ɴᴇxᴛ.\n\nᴀʀɪᴀ ᴡɪʟʟ ʀᴇᴀᴅ ᴛʜᴇ ᴄᴏɴᴛᴇɴᴛ ᴀɴᴅ ᴇxᴘʟᴀɪɴ ɪᴛ.</blockquote>",home())});
 bot.onText(/^\/aria14(?:@\w+)?$/i,async msg=>card(bot,msg.chat.id,"<blockquote><b>🌸 ᴍɪss ᴀʀɪᴀ ᴠ14</b>\n\n💬 ᴍᴜʟᴛɪᴘʟᴇ ᴄʜᴀᴛ ᴀʀᴄʜɪᴠᴇs\n🧠 ᴀᴜᴛᴏ ᴀɪ ᴄᴏɴᴛʀᴏʟs\n📁 ғɪʟᴇ ᴀɪ\n🛡️ ᴍᴏʀᴇ ʀᴇʟɪᴀʙʟᴇ ᴇʀʀᴏʀ ʜᴀɴᴅʟɪɴɢ\n👑 ᴀᴅᴍɪɴ ᴡᴏʀᴋsᴘᴀᴄᴇ</blockquote>",home()));
 bot.on("document",async msg=>{if(!fileModeUsers.has(String(msg.from?.id)))return;fileModeUsers.delete(String(msg.from.id));const name=msg.document?.file_name||"file";const ext=(name.split(".").pop()||"").toLowerCase();if(!["txt","md","js","ts","jsx","tsx","py","json","csv","html","css","xml","yml","yaml"].includes(ext))return;const chatId=msg.chat.id,id=msg.from.id;try{await bot.sendChatAction(chatId,"typing");const buf=await ctx.downloadFileToBuffer(msg.document.file_id);let text=Buffer.from(buf).toString("utf8");if(text.length>18000)text=text.slice(0,18000)+"\n\n... [truncated]";const result=await ctx.processWithFailover(id,`Analyze this uploaded ${ext.toUpperCase()} file named ${name}. Explain what it does, identify important issues, and suggest useful improvements.\n\nFILE CONTENT:\n${text}`,prefs.memoryEnabled(id)?(userHistory?.get?.(id)||[]):[],{msg:{chat:{id:chatId,type:msg.chat.type},from:msg}});if(!result?.success)return bot.sendMessage(chatId,"❌ ғɪʟᴇ ᴀɴᴀʟʏsɪ ғᴀɪʟᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ.");return bot.sendMessage(chatId,ctx.formatAiReplyForTelegram?ctx.formatAiReplyForTelegram(result.response):String(result.response),{parse_mode:"HTML",reply_to_message_id:msg.message_id});}catch(err){console.error("[ARIA V14 FILE AI]",err?.stack||err);return bot.sendMessage(chatId,"❌ ᴀʀɪᴀ ᴄᴏᴜʟᴅɴ'ᴛ ʀᴇᴀᴅ ᴛʜᴀᴛ ғɪʟᴇ.");}});
 bot.on("callback_query", async (q) => {
   const d=String(q.data||"");
   if(!d.startsWith("aria14_")) return;
   try { await bot.answerCallbackQuery(q.id); } catch {}
   const id=q.from.id, chatId=q.message?.chat?.id;
   if(d==="aria14_chats") return card(bot,chatId,chatListText(id),home());
   if(d==="aria14_auto") {
     prefs.setMode(id,"chat");
     return card(bot,chatId,"<blockquote><b>🧠 ᴀᴜᴛᴏ ᴀɪ ᴄᴏɴᴛʀᴏʟ</b>\n\nᴀʀɪᴀ ɪs ʀᴇᴀᴅʏ ғᴏʀ ɴᴀᴛᴜʀᴀʟ ᴄʜᴀᴛ. ᴜsᴇ /ai ᴛᴏ ᴄʜᴏᴏsᴇ ᴀ sᴘᴇᴄɪғɪᴄ ᴍᴏᴅᴇ.</blockquote>",home());
   }
   if(d==="aria14_file") return card(bot,chatId,"<blockquote><b>📁 ғɪʟᴇ ᴀɪ</b>\n\nᴜsᴇ /fileai ᴛʜᴇɴ sᴇɴᴅ ᴀ sᴜᴘᴘᴏʀᴛᴇᴅ ғɪʟᴇ.</blockquote>",home());
   if(d==="aria14_settings") return card(bot,chatId,`<blockquote><b>⚙️ ᴠ14 sᴇᴛᴛɪɴɢs</b>\n\n🧠 ᴍᴇᴍᴏʀʏ: <b>${prefs.memoryEnabled(id)?"ᴏɴ":"ᴏғғ"}</b>\n🧠 ᴀɪ ᴍᴏᴅᴇ: <b>${esc(prefs.getMode(id))}</b>\n\nᴜsᴇ /memory ᴀɴᴅ /ai ᴛᴏ ᴍᴀɴᴀɢᴇ ᴛʜᴇsᴇ.</blockquote>`,home());
   if(d==="aria14_admin") {
     if(!isAdmin(ctx,id)) return bot.answerCallbackQuery(q.id,{text:"⛔ ᴀᴅᴍɪɴs ᴏɴʟʏ",show_alert:true}).catch(()=>{});
     const users=Object.keys(ctx.state?.users||{}).length;
     const chatsCount=Object.keys(ctx.state?.chatStats||{}).length;
     const history=ctx.userHistory?.size||0;
     return card(bot,chatId,`<blockquote><b>👑 ᴀᴅᴍɪɴ sᴛᴀᴛs</b>\n\n👥 ᴜsᴇʀs: <b>${users}</b>\n💬 ɢʀᴏᴜᴘs: <b>${chatsCount}</b>\n🧠 ᴀᴄᴛɪᴠᴇ ᴍᴇᴍᴏʀɪᴇs: <b>${history}</b>\n🕐 ᴜᴘᴛɪᴍᴇ: <b>${Math.floor(process.uptime()/3600)}ʜ ${Math.floor(process.uptime()/60)%60}ᴍ</b></blockquote>`,home());
   }
 });
};
