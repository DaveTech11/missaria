'use strict';

function setup({ bot, state, saveStore, accessControl, audit }) {
  state.ariaSecurityProfiles = state.ariaSecurityProfiles || {};
  state.ariaSecurityIncidents = state.ariaSecurityIncidents || [];
  const windows = new Map();
  const joins = new Map();
  const notifyCooldown = new Map();
  state.ariaSpamScores = state.ariaSpamScores || {};

  const admin = s => ['administrator','creator'].includes(s);
  const settings = id => {
    const k=String(id); state.ariaSecurityProfiles[k]=state.ariaSecurityProfiles[k]||{
      mode:'balanced', alerts:true, escalation:true, threshold:70,
      alertChatId:null, createdAt:new Date().toISOString()
    }; return state.ariaSecurityProfiles[k];
  };
  async function can(userId, chatId){
    if(!accessControl) return {ok:false,message:'Access control unavailable.'};
    return accessControl.canControl(userId, chatId);
  }
  function push(chatId, type, score, detail, meta={}){
    const row={id:`sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`,at:new Date().toISOString(),chatId:String(chatId),type,score,detail,...meta};
    state.ariaSecurityIncidents.push(row); state.ariaSecurityIncidents=state.ariaSecurityIncidents.slice(-500); return row;
  }
  async function alert(chatId, row){
    const s=settings(chatId); if(!s.alerts)return;
    const key=String(chatId); if(notifyCooldown.has(key))return;
    notifyCooldown.set(key,Date.now()); setTimeout(()=>notifyCooldown.delete(key),60000);
    const text=`🚨 <b>Aria Security Alert</b>\n\nRisk score: <b>${row.score}/100</b>\nType: <b>${row.type}</b>\n${row.detail}\n\nUse <code>Aria, health ${String(chatId)}</code> for a live check.`;
    await bot.sendMessage(chatId,text,{parse_mode:'HTML'}).catch(()=>{});
  }
  async function analyze(msg){
    if(!msg?.chat||!['group','supergroup'].includes(msg.chat.type)||!msg.from||msg.from.is_bot)return null;
    const id=String(msg.chat.id), s=settings(id), now=Date.now();
    const w=(windows.get(id)||[]).filter(x=>now-x.at<30000); w.push({at:now,user:String(msg.from.id),text:String(msg.text||msg.caption||'')}); windows.set(id,w);
    let score=0, reasons=[]; const text=w[w.length-1].text;
    const unique=new Set(w.map(x=>x.user)).size;
    if(w.length>=25){score+=45;reasons.push(`${w.length} messages in 30s`)} else if(w.length>=15){score+=25;reasons.push(`${w.length} messages in 30s`)}
    if(unique>=10){score+=35;reasons.push(`${unique} active senders`)} else if(unique>=6){score+=20;reasons.push(`${unique} active senders`)}
    const links=(text.match(/(?:https?:\/\/|www\.|t\.me\/)/gi)||[]).length; if(links>=2){score+=20;reasons.push('multiple links')}
    if(/free\s+(money|gift|crypto)|claim\s+now|verify\s+account|urgent\s+click/i.test(text)){score+=30;reasons.push('scam-like wording')}
    const repeated=w.slice(-12).filter(x=>x.text&&x.text===text).length; if(repeated>=4){score+=25;reasons.push('repeated message pattern')}
    score=Math.min(100,score);

    // Keep a rolling, per-user spam score so Aria can answer read-only
    // questions such as "who is causing the most spam in Zack?" using
    // messages the bot actually observed. This does not expose or invent
    // participants that Telegram has not delivered to the bot.
    const userId=String(msg.from.id);
    state.ariaSpamScores[id]=state.ariaSpamScores[id]||{};
    const rowScore = Math.max(score, reasons.length ? Math.min(60, reasons.length * 15) : 0);
    const bucket=state.ariaSpamScores[id][userId]||{userId,messages:0,spamScore:0,spamMessages:0,lastSeen:0,username:msg.from.username||null,name:[msg.from.first_name,msg.from.last_name].filter(Boolean).join(' ')};
    bucket.messages++; bucket.lastSeen=now; bucket.username=msg.from.username||bucket.username; bucket.name=[msg.from.first_name,msg.from.last_name].filter(Boolean).join(' ')||bucket.name;
    if(rowScore>0){bucket.spamMessages++; bucket.spamScore+=rowScore;}
    // Decay old evidence so a user is not permanently labeled from one event.
    bucket.spamScore=Math.min(bucket.spamScore,500); state.ariaSpamScores[id][userId]=bucket;
    saveStore();
    if(score<s.threshold)return {score,reasons};
    const row=push(id, score>=90?'critical':score>=75?'high':'elevated', score, reasons.join('; '));
    audit?.({action:'securityAlert',target:id,detail:row.detail});
    await alert(id,row); saveStore(); return {score,reasons,row};
  }
  async function profile(userId, chatId, patch={}){
    const a=await can(userId,chatId); if(!a.ok)return {success:false,error:a.message};
    const s=settings(chatId); for(const k of ['mode','alerts','escalation','threshold']) if(patch[k]!==undefined)s[k]=patch[k];
    if(!['balanced','strict','relaxed'].includes(s.mode))s.mode='balanced'; saveStore(); return {success:true,data:s};
  }
  async function health(userId, chatId){
    const a=await can(userId,chatId); if(!a.ok)return {success:false,error:a.message};
    const rows=state.ariaSecurityIncidents.filter(x=>x.chatId===String(chatId)).slice(-30);
    const risk=Math.min(100,rows.reduce((n,x)=>n+Math.max(5,Math.round(x.score/4)),0));
    return {success:true,data:{risk,level:risk>=70?'HIGH':risk>=35?'MEDIUM':'LOW',incidents:rows.length,latest:rows.at(-1)||null,profile:settings(chatId)}};
  }
  async function incidents(userId,chatId,limit=15){
    const a=await can(userId,chatId); if(!a.ok)return {success:false,error:a.message};
    return {success:true,data:state.ariaSecurityIncidents.filter(x=>x.chatId===String(chatId)).slice(-limit).reverse()};
  }
  async function topSpam(userId,chatId,limit=10){
    const a=await can(userId,chatId); if(!a.ok)return {success:false,error:a.message};
    const rows=Object.values(state.ariaSpamScores[String(chatId)]||{})
      .filter(x=>x.spamScore>0)
      .sort((x,y)=>y.spamScore-x.spamScore)
      .slice(0,limit);
    return {success:true,data:rows};
  }
  return { analyze, profile, health, incidents, topSpam, settings };
}
module.exports={setup};
