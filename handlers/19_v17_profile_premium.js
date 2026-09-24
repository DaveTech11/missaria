"use strict";
const stats=require("../services/ariaUserStats");
const prefs=require("../services/ariaPreferences");
const saved=require("../services/ariaSavedResponses");
const chats=require("../services/ariaChatStore");
const CARD="https://files.catbox.moe/hjdxgx.jpg";
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const card=(bot,id,text,reply_markup)=>bot.sendPhoto(id,CARD,{caption:text,parse_mode:"HTML",reply_markup}).catch(()=>bot.sendMessage(id,text,{parse_mode:"HTML",reply_markup}));
function kb(){return {inline_keyboard:[[{text:"🧠 ᴍᴏᴅᴇ",callback_data:"aria17_mode",style:"primary"},{text:"🧠 ᴍᴇᴍᴏʀʏ",callback_data:"aria17_memory",style:"primary"},{text:"💾 sᴀᴠᴇᴅ",callback_data:"aria17_saved",style:"success"}],[{text:"🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs",callback_data:"aria17_ach",style:"primary"},{text:"💬 ᴄʜᴀᴛs",callback_data:"aria17_chats",style:"primary"}],[{text:"🏠 ʜᴏᴍᴇ",callback_data:"main_menu",style:"success"}]]}}
module.exports=function(ctx){const {bot}=ctx;
bot.onText(/^\/(?:account|myaccount)(?:@\w+)?$/i,msg=>{const id=msg.from.id,u=stats.get(id);return card(bot,msg.chat.id,`<blockquote><b>👤 ᴍʏ ᴀʀɪᴀ ᴀᴄᴄᴏᴜɴᴛ</b>\n━━━━━━━━━━━━━━━━━━\n\n👤 <b>${esc(msg.from.first_name||"ᴜsᴇʀ")}</b>\n🆔 <code>${id}</code>\n🧠 ᴍᴏᴅᴇ: <b>${esc(prefs.getMode(id))}</b>\n💬 ᴍᴇssᴀɢᴇs: <b>${u.messages||0}</b>\n💾 sᴀᴠᴇᴅ: <b>${saved.list(id).length}</b>\n🗂️ ᴄʜᴀᴛs: <b>${chats.list(id).length}</b>\n🔥 sᴛʀᴇᴀᴋ: <b>${stats.streak(id)} ᴅᴀʏs</b></blockquote>`,kb())});
bot.onText(/^\/(?:v17|ariahub)(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,"<blockquote><b>🌸 ᴍɪss ᴀʀɪᴀ ᴠ17</b>\n\n👤 ᴘʀᴏғɪʟᴇ • 🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs\n💾 sᴀᴠᴇᴅ • 💬 ᴄʜᴀᴛs\n🧠 ᴍᴇᴍᴏʀʏ • ⚙️ ᴘʀᴇғᴇʀᴇɴᴄᴇs\n⭐ ᴘʀᴇᴍɪᴜᴍ ʀᴇᴀᴅʏ\n\n✨ ɴᴏ sɪɢɴᴜᴘ ʀᴇǫᴜɪʀᴇᴅ.</blockquote>",kb()));
bot.on("callback_query",async q=>{const d=String(q.data||"");if(!d.startsWith("aria17_"))return;try{await bot.answerCallbackQuery(q.id)}catch{}const id=q.from.id,cid=q.message?.chat?.id;if(d==="aria17_mode")return card(bot,cid,`<blockquote>🧠 ᴄᴜʀʀᴇɴᴛ ᴍᴏᴅᴇ: <b>${esc(prefs.getMode(id))}</b>\n\nᴜsᴇ /ai ᴛᴏ ᴄʜᴏᴏsᴇ ᴀɴᴏᴛʜᴇʀ ᴍᴏᴅᴇ.</blockquote>`,kb());if(d==="aria17_memory")return card(bot,cid,`<blockquote>🧠 ᴍᴇᴍᴏʀʏ ɪs <b>${prefs.memoryEnabled(id)?"ᴏɴ":"ᴏғғ"}</b>.\n\nᴜsᴇ /memory ᴛᴏ ᴛᴏɢɢʟᴇ.</blockquote>`,kb());if(d==="aria17_saved")return card(bot,cid,`<blockquote>💾 sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs: <b>${saved.list(id).length}</b>\n\nᴜsᴇ /saved ᴛᴏ ᴏᴘᴇɴ ᴛʜᴇᴍ.</blockquote>`,kb());if(d==="aria17_ach")return card(bot,cid,`<blockquote>🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs\n\n💬 ${stats.get(id).messages||0} ᴍᴇssᴀɢᴇs\n🔥 ${stats.streak(id)} ᴅᴀʏ sᴛʀᴇᴀᴋ</blockquote>`,kb());if(d==="aria17_chats")return card(bot,cid,`<blockquote>💬 ᴀʀᴄʜɪᴠᴇᴅ ᴄʜᴀᴛs: <b>${chats.list(id).length}</b>\n\nᴜsᴇ /chats ᴛᴏ ᴍᴀɴᴀɢᴇ ᴛʜᴇᴍ.</blockquote>`,kb())});
};
