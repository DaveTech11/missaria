"use strict";
const fs=require("fs"),path=require("path");
const store=require("../services/ariaV16Store");
const prefs=require("../services/ariaPreferences");
const stats=require("../services/ariaUserStats");
const saved=require("../services/ariaSavedResponses");
const chats=require("../services/ariaChatStore");
const CARD="https://files.catbox.moe/hjdxgx.jpg";
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const card=(bot,id,text,reply_markup)=>bot.sendPhoto(id,CARD,{caption:text,parse_mode:"HTML",reply_markup}).catch(()=>bot.sendMessage(id,text,{parse_mode:"HTML",reply_markup}));
const home=()=>({inline_keyboard:[
 [{text:"💬 ᴄʜᴀᴛ",callback_data:"aria16_chat",style:"success"},{text:"🤖 ᴀɢᴇɴᴛ",callback_data:"aria16_agent",style:"primary"},{text:"🔎 ʀᴇsᴇᴀʀᴄʜ",callback_data:"aria16_research",style:"primary"}],
 [{text:"💻 ᴄᴏᴅɪɴɢ",callback_data:"aria16_coding",style:"primary"},{text:"🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ",callback_data:"aria16_images",style:"success"},{text:"📁 ғɪʟᴇ ᴀɪ",callback_data:"aria16_files",style:"primary"}],
 [{text:"🎵 ᴍᴜsɪᴄ",callback_data:"hub_music",style:"primary"},{text:"🎬 ᴍᴇᴅɪᴀ",callback_data:"hub_media",style:"primary"},{text:"🎮 ɢᴀᴍᴇs",callback_data:"hub_games",style:"primary"}],
 [{text:"🎙️ ᴠᴏɪᴄᴇ",callback_data:"aria16_voice",style:"primary"},{text:"💾 ғᴀᴠᴏʀɪᴛᴇs",callback_data:"aria16_favorites",style:"primary"},{text:"🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs",callback_data:"aria16_achievements",style:"primary"}],
 [{text:"🛡️ ᴘʀɪᴠᴀᴄʏ",callback_data:"aria16_privacy",style:"primary"},{text:"👤 ᴘʀᴏғɪʟᴇ",callback_data:"aria15_profile",style:"primary"},{text:"⚙️ sᴇᴛᴛɪɴɢs",callback_data:"aria_settings_open",style:"primary"}],
 [{text:"🏠 ʜᴏᴍᴇ",callback_data:"main_menu",style:"success"}]
]});
function isAdmin(ctx,id){try{return !!ctx.isOwner?.(id)||!!ctx.isBotAdmin?.(id)}catch{return false}}
function dashboardText(){return `<blockquote><b>🌸 ᴍɪss ᴀʀɪᴀ ᴠ16</b>
━━━━━━━━━━━━━━━━━━━━

🧠 ᴀᴅᴠᴀɴᴄᴇᴅ ᴀɪ ᴡᴏʀᴋsᴘᴀᴄᴇ
🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ
📁 ғɪʟᴇ ᴀɪ
🎙️ ᴠᴏɪᴄᴇ ᴀɪ
🔎 ʀᴇsᴇᴀʀᴄʜ
💻 ᴄᴏᴅɪɴɢ ᴡᴏʀᴋsᴘᴀᴄᴇ
🎵 ᴍᴜsɪᴄ • 🎬 ᴍᴇᴅɪᴀ • 🎮 ɢᴀᴍᴇs
💾 ғᴀᴠᴏʀɪᴛᴇs • 🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs
🛡️ ᴘʀɪᴠᴀᴄʏ • 🚫 ʙʟᴏᴄᴋ • 🚩 ʀᴇᴘᴏʀᴛ

✨ ɴᴏ sɪɢɴᴜᴘ ʀᴇǫᴜɪʀᴇᴅ.</blockquote>`}
function achievementText(id){const u=stats.get(id),a=[];if((u.messages||0)>=1)a.push("🌱 ᴍʏ ғɪʀsᴛ ᴄʜᴀᴛ");if((u.messages||0)>=25)a.push("💬 ᴄʜᴀᴛ ᴇɴᴛʜᴜsɪᴀsᴛ");if((u.messages||0)>=100)a.push("🔥 ᴄᴏɴᴠᴇʀsᴀᴛɪᴏɴ ᴘʀᴏ");if(chats.list(id).length>=5)a.push("🗂️ ᴄʜᴀᴛ ᴄᴜʀᴀᴛᴏʀ");if(saved.list(id).length>=5)a.push("💾 ʀᴇsᴘᴏɴsᴇ ᴄᴏʟʟᴇᴄᴛᴏʀ");if(stats.streak(id)>=7)a.push("🔥 7-ᴅᴀʏ sᴛʀᴇᴀᴋ");return a.length?a.map(x=>`• ${x}`).join("\n"):"• 🌱 ᴋᴇᴇᴘ ᴄʜᴀᴛᴛɪɴɢ ᴛᴏ ᴜɴʟᴏᴄᴋ ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs."}
module.exports=function(ctx){const {bot}=ctx;
 bot.onText(/^\/(?:v16|studio|ariastudio|commandcenter2)(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,dashboardText(),home()));
 bot.onText(/^\/(?:research|deepresearch)(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,"<blockquote><b>🔎 ᴅᴇᴇᴘ ʀᴇsᴇᴀʀᴄʜ</b>\n\nᴛᴇʟʟ ᴀʀɪᴀ ᴡʜᴀᴛ ʏᴏᴜ ᴡᴀɴᴛ ʀᴇsᴇᴀʀᴄʜᴇᴅ. ᴀᴜᴛᴏ ᴍᴏᴅᴇ ᴡɪʟʟ ʀᴏᴜᴛᴇ ʀᴇsᴇᴀʀᴄʜ ʀᴇǫᴜᴇsᴛs ᴡʜᴇɴ ᴘᴏssɪʙʟᴇ.</blockquote>",home()));
 bot.onText(/^\/(?:coding|codeworkspace)(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,"<blockquote><b>💻 ᴄᴏᴅɪɴɢ ᴡᴏʀᴋsᴘᴀᴄᴇ</b>\n\nᴀsᴋ ᴀʀɪᴀ ᴛᴏ ᴇxᴘʟᴀɪɴ, ᴅᴇʙᴜɢ, ʀᴇғᴀᴄᴛᴏʀ, ᴏᴘᴛɪᴍɪᴢᴇ ᴏʀ ɢᴇɴᴇʀᴀᴛᴇ ᴄᴏᴅᴇ.</blockquote>",home()));
 bot.onText(/^\/(?:privacy|myprivacy)(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,`<blockquote><b>🛡️ ᴘʀɪᴠᴀᴄʏ & ᴅᴀᴛᴀ</b>\n━━━━━━━━━━━━━━━━━━\n\n🧠 ᴍᴇᴍᴏʀʏ: <b>${prefs.memoryEnabled(msg.from.id)?"ᴏɴ":"ᴏғғ"}</b>\n💾 sᴀᴠᴇᴅ ʀᴇsᴘᴏɴsᴇs: <b>${saved.list(msg.from.id).length}</b>\n💬 ᴄʜᴀᴛ ᴀʀᴄʜɪᴠᴇs: <b>${chats.list(msg.from.id).length}</b>\n\nᴜsᴇ /memory ᴛᴏ ᴛᴏɢɢʟᴇ ᴍᴇᴍᴏʀʏ ᴀɴᴅ /clear ᴛᴏ ᴄʟᴇᴀʀ ᴛʜᴇ ᴀᴄᴛɪᴠᴇ ᴄᴏɴᴠᴇʀsᴀᴛɪᴏɴ.</blockquote>`,home()));
 bot.onText(/^\/block(?:@\w+)?\s+(\d+)$/i,msg=>{const t=msg.text.match(/^\/block(?:@\w+)?\s+(\d+)$/i)[1];store.addBlock(msg.from.id,t);return bot.sendMessage(msg.chat.id,`🛡️ ʙʟᴏᴄᴋᴇᴅ <code>${t}</code>.`,{parse_mode:"HTML"})});
 bot.onText(/^\/unblock(?:@\w+)?\s+(\d+)$/i,msg=>{const t=msg.text.match(/^\/unblock(?:@\w+)?\s+(\d+)$/i)[1];store.removeBlock(msg.from.id,t);return bot.sendMessage(msg.chat.id,`🛡️ ᴜɴʙʟᴏᴄᴋᴇᴅ <code>${t}</code>.`,{parse_mode:"HTML"})});
 bot.onText(/^\/report(?:@\w+)?\s+(\d+)(?:\s+(.+))?$/i,msg=>{const m=msg.text.match(/^\/report(?:@\w+)?\s+(\d+)(?:\s+(.+))?$/i);store.report(msg.from.id,m[1],m[2]||"not specified");return bot.sendMessage(msg.chat.id,"🚩 ʀᴇᴘᴏʀᴛ ʀᴇᴄᴇɪᴠᴇᴅ. ᴛʜᴀɴᴋ ʏᴏᴜ.",{parse_mode:"HTML"})});
 bot.onText(/^\/(?:achievements|badges)(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,`<blockquote><b>🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs</b>\n━━━━━━━━━━━━━━━━━━\n\n${achievementText(msg.from.id)}\n\n🔥 sᴛʀᴇᴀᴋ: <b>${stats.streak(msg.from.id)} ᴅᴀʏs</b></blockquote>`,home()));
 bot.onText(/^\/(?:favorites|favs)(?:@\w+)?$/i,msg=>{const f=store.favorites(msg.from.id);return card(bot,msg.chat.id,`<blockquote><b>💾 ғᴀᴠᴏʀɪᴛᴇs</b>\n━━━━━━━━━━━━━━━━━━\n\n${f.length?f.slice(0,10).map((x,i)=>`${i+1}. <b>${esc(x.type)}</b> — <code>${esc(x.id)}</code>\n${esc(x.value).slice(0,180)}`).join("\n\n"):"ɴᴏ ғᴀᴠᴏʀɪᴛᴇs ʏᴇᴛ."}</blockquote>`,home())});
 bot.onText(/^\/premium(?:@\w+)?$/i,msg=>card(bot,msg.chat.id,"<blockquote><b>⭐ ᴘʀᴇᴍɪᴜᴍ</b>\n\nᴘʀᴇᴍɪᴜᴍ ғᴇᴀᴛᴜʀᴇs ᴄᴀɴ ʙᴇ ᴍᴀɴᴀɢᴇᴅ ᴛʜʀᴏᴜɢʜ ᴛʜᴇ ᴇxɪsᴛɪɴɢ ᴘʀᴇᴍɪᴜᴍ sʏsᴛᴇᴍ.</blockquote>",home()));
 bot.onText(/^\/admincenter(?:@\w+)?$/i,msg=>{if(!isAdmin(ctx,msg.from.id))return bot.sendMessage(msg.chat.id,"⛔ ᴀᴅᴍɪɴs ᴏɴʟʏ.");const files=fs.existsSync(path.join(process.cwd(),"data"))?fs.readdirSync(path.join(process.cwd(),"data")).length:0;return card(bot,msg.chat.id,`<blockquote><b>👑 ᴀᴅᴠᴀɴᴄᴇᴅ ᴀᴅᴍɪɴ ᴄᴇɴᴛᴇʀ</b>\n━━━━━━━━━━━━━━━━━━\n\n👥 ᴛʀᴀᴄᴋᴇᴅ ᴜsᴇʀ ᴅᴀᴛᴀ: <b>${files}</b> sᴛᴏʀᴇs\n⏱️ ᴜᴘᴛɪᴍᴇ: <b>${Math.floor(process.uptime()/3600)}ʜ ${Math.floor(process.uptime()/60)%60}ᴍ</b>\n\n📢 ʙʀᴏᴀᴅᴄᴀsᴛ • 🛡️ ʀᴇᴘᴏʀᴛs • 🚫 ʙᴀɴs • ⭐ ᴘʀᴇᴍɪᴜᴍ</blockquote>`,home())});
 bot.on("callback_query",async q=>{const d=String(q.data||"");if(!d.startsWith("aria16_"))return;try{await bot.answerCallbackQuery(q.id)}catch{}const id=q.from.id,cid=q.message?.chat?.id;const mode={aria16_chat:"chat",aria16_agent:"chat",aria16_research:"research",aria16_coding:"coding"};if(mode[d]){prefs.setMode(id,mode[d]);return card(bot,cid,`<blockquote>✨ ᴀʀɪᴀ ᴍᴏᴅᴇ: <b>${mode[d]}</b></blockquote>`,home())}if(d==="aria16_images")return card(bot,cid,"<blockquote><b>🎨 ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ</b>\n\nᴜsᴇ /image ᴏʀ ᴏᴘᴇɴ ᴛʜᴇ ᴇxɪsᴛɪɴɢ ɪᴍᴀɢᴇ sᴛᴜᴅɪᴏ.</blockquote>",home());if(d==="aria16_files")return card(bot,cid,"<blockquote><b>📁 ғɪʟᴇ ᴀɪ</b>\n\nᴜsᴇ /fileai ᴛʜᴇɴ sᴇɴᴅ ᴀ sᴜᴘᴘᴏʀᴛᴇᴅ ғɪʟᴇ.</blockquote>",home());if(d==="aria16_voice")return card(bot,cid,"<blockquote><b>🎙️ ᴠᴏɪᴄᴇ ᴀɪ</b>\n\nᴠᴏɪᴄᴇ ᴘʀᴏᴄᴇssɪɴɢ ɪs ʀᴇᴀᴅʏ ᴡʜᴇɴ ᴀ sᴜᴘᴘᴏʀᴛᴇᴅ ᴠᴏɪᴄᴇ ʀᴇǫᴜᴇsᴛ ɪs sᴇɴᴛ.</blockquote>",home());if(d==="aria16_favorites")return bot.emit("text",Object.assign({},q.message,{text:"/favorites",from:q.from,chat:q.message.chat}));if(d==="aria16_achievements")return bot.emit("text",Object.assign({},q.message,{text:"/achievements",from:q.from,chat:q.message.chat}));if(d==="aria16_privacy")return bot.emit("text",Object.assign({},q.message,{text:"/privacy",from:q.from,chat:q.message.chat}));});
};
