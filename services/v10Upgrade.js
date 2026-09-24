'use strict';
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const DATA = path.join(process.cwd(), 'data');
const AUDIT = path.join(DATA, 'v10-audit.json');

function loadAudit(){ try { return JSON.parse(fs.readFileSync(AUDIT,'utf8')); } catch { return []; } }
function audit(actor, action, detail=''){
  try {
    fs.mkdirSync(DATA,{recursive:true});
    const rows=loadAudit(); rows.push({at:Date.now(),actor:String(actor),action:String(action),detail:String(detail).slice(0,500)});
    fs.writeFileSync(AUDIT,JSON.stringify(rows.slice(-500),null,2));
  } catch {}
}
function recentAudit(limit=12){ return loadAudit().slice(-Math.max(1,Math.min(50,Number(limit)||12))).reverse(); }
function countUsers(users){ return Object.keys(users||{}).length; }
function countPremium(users,isPremium){ return Object.keys(users||{}).filter(id=>{try{return !!isPremium(id)}catch{return false}}).length; }
function formatUptime(sec){ sec=Math.floor(Number(sec)||0); const d=Math.floor(sec/86400); sec%=86400; const h=Math.floor(sec/3600); sec%=3600; const m=Math.floor(sec/60); const s=sec%60; return `${d}d ${h}h ${m}m ${s}s`; }
function escape(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function userProfile(ctx,userId){
  const u=ctx.getUser(userId)||{};
  const plan=ctx.isPremiumActive(userId)?'ᴘʀᴇᴍɪᴜᴍ':'ғʀᴇᴇ';
  let points=0; try { points=require('./economyService').getPoints(userId); } catch {}
  return `🌸 <b>ᴍɪss ᴀʀɪᴀ · ᴘʀᴏғɪʟᴇ</b>\n\n━━━━━━━━━━━━━━━━━━\n\n👤 ᴜsᴇʀ: <a href="tg://user?id=${userId}">${escape(u.username?'@'+u.username:String(userId))}</a>\n🆔 ɪᴅ: <code>${escape(userId)}</code>\n⭐ ᴘʟᴀɴ: <b>${plan}</b>\n💎 ᴘᴏɪɴᴛs: <b>${points.toLocaleString()}</b>\n🟢 sᴛᴀᴛᴜs: <b>${u.started?'ᴀᴄᴛɪᴠᴇ':'ɴᴏᴛ sᴛᴀʀᴛᴇᴅ'}</b>\n\n━━━━━━━━━━━━━━━━━━\n\n✨ ᴜsᴇ ᴛʜᴇ ᴍᴇɴᴜ ᴛᴏ ᴇxᴘʟᴏʀᴇ ᴀʀɪᴀ.`;
}
function systemStatus(ctx){
  const sum=ctx.statsTracker?.getSummary?.()||{};
  return `⚙️ <b>ᴀʀɪᴀ sʏsᴛᴇᴍ sᴛᴀᴛᴜs</b>\n\n━━━━━━━━━━━━━━━━━━\n\n🟢 ʙᴏᴛ: <b>ᴏɴʟɪɴᴇ</b>\n⏱️ ᴜᴘᴛɪᴍᴇ: <b>${formatUptime(process.uptime())}</b>\n👥 ᴜsᴇʀs: <b>${sum.totalUniqueUsers||0}</b>\n🔥 ᴀᴄᴛɪᴠᴇ ᴛᴏᴅᴀʏ: <b>${sum.activeToday||0}</b>\n📨 ᴍᴇssᴀɢᴇs: <b>${sum.totalMessages||0}</b>\n🧠 ᴀɢᴇɴᴛ: <b>${ctx.agent?'ʀᴇᴀᴅʏ':'ᴏғғ'}</b>\n\n━━━━━━━━━━━━━━━━━━`;
}
function integrationStatus(){
  const checks=[
    ['ᴛᴀᴠɪʟʏ ᴡᴇʙ',process.env.TAVILY_API_KEY],['ᴏᴘᴇɴᴀɪ',process.env.OPENAI_API_KEY],['ᴏᴘᴇɴʀᴏᴜᴛᴇʀ',process.env.OPENROUTER_API_KEY],['ᴅᴇᴇᴘsᴇᴇᴋ',process.env.DEEPSEEK_API_KEY],['ᴘɪxᴀᴢᴏ',process.env.PIXAZO_API_KEY],['sᴛᴛ',process.env.STT_API_URL],['ᴛᴛs',process.env.TTS_API_URL],['ʀᴇɴᴅᴇʀ',process.env.RENDER_API_KEY],['ʀᴀɪʟᴡᴀʏ',process.env.RAILWAY_API_TOKEN]
  ];
  return `🔌 <b>ɪɴᴛᴇɢʀᴀᴛɪᴏɴs</b>\n\n━━━━━━━━━━━━━━━━━━\n\n${checks.map(([n,v])=>`${v?'🟢':'⚪'} ${n}: <b>${v?'ᴄᴏɴɴᴇᴄᴛᴇᴅ':'ɴᴏᴛ sᴇᴛ'}</b>`).join('\n')}\n\n━━━━━━━━━━━━━━━━━━\n\n🔐 ᴋᴇʏs ᴀʀᴇ ɴᴇᴠᴇʀ sʜᴏᴡɴ.`;
}
function backupData(){
  fs.mkdirSync(DATA,{recursive:true});
  const zip=new AdmZip();
  if(fs.existsSync(DATA)) zip.addLocalFolder(DATA,'data');
  const out=path.join(DATA,`aria-v10-backup-${Date.now()}.zip`); zip.writeZip(out); return out;
}
module.exports={audit,recentAudit,countUsers,countPremium,formatUptime,escape,userProfile,systemStatus,integrationStatus,backupData};
