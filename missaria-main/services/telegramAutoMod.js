'use strict';

const URL_RE = /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/)[^\s]+/i;

function setup({ bot, state, saveStore, ownerId, audit, accessControl }) {
  state.ariaAutoMod = state.ariaAutoMod || {};
  const cooldown = new Map();
  const flood = new Map();
  const joins = new Map();
  const raidTimers = new Map();
  const owner = id => !!ownerId && String(id) === String(ownerId);
  const adminStatus = s => ['creator','administrator'].includes(s);

  function settings(chatId) {
    const key = String(chatId);
    state.ariaAutoMod[key] = state.ariaAutoMod[key] || {
      enabled: false, links: true, blacklist: true, caps: false, flood: false,
      raid: false, raidJoinThreshold: 8, raidMessageThreshold: 18, raidWindowMs: 15000,
      raidLockMs: 10 * 60 * 1000, action: 'delete_warn'
    };
    const s = state.ariaAutoMod[key];
    if (s.raid === undefined) s.raid = false;
    if (!s.raidJoinThreshold) s.raidJoinThreshold = 8;
    if (!s.raidMessageThreshold) s.raidMessageThreshold = 18;
    if (!s.raidWindowMs) s.raidWindowMs = 15000;
    if (!s.raidLockMs) s.raidLockMs = 10 * 60 * 1000;
    return s;
  }

  async function configure(userId, chatId, patch) {
    if (!owner(userId)) { const access = accessControl ? await accessControl.canControl(userId, chatId) : { ok:false, message:'Owner access only.' }; if (!access.ok) return { success:false, error:access.message }; }
    const s = settings(chatId);
    for (const key of ['enabled','links','blacklist','caps','flood','raid']) if (patch[key] !== undefined) s[key] = !!patch[key];
    if (patch.action && ['delete','delete_warn','mute'].includes(patch.action)) s.action = patch.action;
    saveStore();
    return { success:true, settings:s };
  }

  async function isAdmin(chatId, userId) {
    const m = await bot.getChatMember(chatId, userId).catch(() => null);
    return !!m && adminStatus(m.status);
  }

  async function activateRaid(chatId, reason) {
    const key = String(chatId);
    if (raidTimers.has(key)) return;
    const s = settings(chatId);
    try {
      const me = await bot.getMe();
      const bm = await bot.getChatMember(chatId, me.id).catch(()=>null);
      if (!bm || !adminStatus(bm.status)) return;
      await bot.setChatPermissions(chatId, { can_send_messages:false });
      state.ariaAudit = state.ariaAudit || [];
      state.ariaAudit.push({at:new Date().toISOString(),action:'raidLockdown',target:key,detail:reason});
      if (state.ariaAudit.length > 500) state.ariaAudit = state.ariaAudit.slice(-500);
      state.ariaIncidents = state.ariaIncidents || [];
      state.ariaIncidents.push({id:`raid_${Date.now().toString(36)}`,at:new Date().toISOString(),type:'raid',target:key,detail:reason});
      state.ariaIncidents = state.ariaIncidents.slice(-300);
      await bot.sendMessage(chatId, `🚨 <b>Raid protection activated</b>\n${reason}\n\n🔒 Group temporarily locked for ${Math.round(s.raidLockMs/60000)} minutes.`, {parse_mode:'HTML'}).catch(()=>{});
      saveStore();
      const timer = setTimeout(async()=>{
        raidTimers.delete(key);
        try {
          await bot.setChatPermissions(chatId, {can_send_messages:true,can_send_audios:true,can_send_documents:true,can_send_photos:true,can_send_videos:true,can_send_video_notes:true,can_send_voice_notes:true,can_send_polls:true,can_send_other_messages:true,can_add_web_page_previews:true});
          await bot.sendMessage(chatId,'🔓 <b>Raid protection lock expired.</b> Normal group messaging restored.',{parse_mode:'HTML'}).catch(()=>{});
          audit({action:'raidUnlock',target:key,detail:'Automatic raid lock expired'});
        } catch(e) { audit({action:'raidUnlockFailed',target:key,detail:e.message}); }
      }, Math.max(30_000, Number(s.raidLockMs)||600000));
      raidTimers.set(key,timer);
    } catch (e) { audit({action:'raidProtectionFailed',target:key,detail:e.message}); }
  }

  async function onMessage(msg) {
    if (!msg?.chat || !['group','supergroup'].includes(msg.chat.type) || !msg.from || msg.from.is_bot) return;
    const s = settings(msg.chat.id);
    const chatId = String(msg.chat.id);

    if (Array.isArray(msg.new_chat_members) && msg.new_chat_members.length && s.raid) {
      const now = Date.now();
      const arr = (joins.get(chatId)||[]).filter(t=>now-t < s.raidWindowMs);
      for (let i=0;i<msg.new_chat_members.length;i++) arr.push(now);
      joins.set(chatId,arr);
      if (arr.length >= Number(s.raidJoinThreshold||8)) await activateRaid(msg.chat.id, `${arr.length} new members joined within ${Math.round(s.raidWindowMs/1000)}s.`);
      return;
    }

    if (s.raid) {
      const now = Date.now();
      const key = `${chatId}:${msg.from.id}`;
      const arr = (flood.get(key)||[]).filter(t=>now-t< s.raidWindowMs); arr.push(now); flood.set(key,arr);
      const all = [...flood.entries()].filter(([k])=>k.startsWith(chatId+':')).reduce((n,[,v])=>n+v.length,0);
      if (all >= Number(s.raidMessageThreshold||18)) await activateRaid(msg.chat.id, `${all} messages detected across users within ${Math.round(s.raidWindowMs/1000)}s.`);
    }

    const member = await bot.getChatMember(msg.chat.id, msg.from.id).catch(()=>null);
    if (member && adminStatus(member.status)) return;
    if (!s.enabled) return;
    const text = String(msg.text || msg.caption || '');
    if (!text) return;
    const blacklist = state.chatSettings?.[chatId]?.blacklist || [];
    let reason = null;
    if (s.links && URL_RE.test(text)) reason = 'link';
    if (!reason && s.blacklist && blacklist.some(w => w && text.toLowerCase().includes(String(w).toLowerCase()))) reason = 'blacklist';
    if (!reason && s.caps) { const letters=text.replace(/[^A-Za-z]/g,''); const upper=text.replace(/[^A-Z]/g,'').length; if(letters.length>=12&&upper/letters.length>=0.85) reason='excessive caps'; }
    if (!reason && s.flood && !s.raid) { const k=`${chatId}:${msg.from.id}`,now=Date.now(); const arr=(flood.get(k)||[]).filter(t=>now-t<5000);arr.push(now);flood.set(k,arr);if(arr.length>=6)reason='flood'; }
    if (!reason) return;
    const k=`${chatId}:${msg.from.id}`; if(cooldown.has(k))return; cooldown.set(k,Date.now()); setTimeout(()=>cooldown.delete(k),3000);
    try{await bot.deleteMessage(msg.chat.id,msg.message_id)}catch{}
    if(s.action==='delete_warn'){
      state.chatSettings=state.chatSettings||{};const cs=state.chatSettings[chatId]=state.chatSettings[chatId]||{};cs.warns=cs.warns||{};const uid=String(msg.from.id);cs.warns[uid]=(cs.warns[uid]||0)+1;
      await bot.sendMessage(msg.chat.id,`⚠️ <b>${reason}</b> detected. Warning ${cs.warns[uid]}/3 for ${msg.from.first_name||msg.from.id}.`,{parse_mode:'HTML'}).catch(()=>{});
      if(cs.warns[uid]>=3)try{await bot.banChatMember(msg.chat.id,msg.from.id);cs.warns[uid]=0}catch{}
    } else if(s.action==='mute') try{await bot.restrictChatMember(msg.chat.id,msg.from.id,{permissions:{can_send_messages:false},until_date:Math.floor((Date.now()+10*60*1000)/1000)})}catch{}
    saveStore(); audit({action:'automod',target:chatId,detail:reason,user:String(msg.from.id)});
  }

  return { settings, configure, onMessage, activateRaid };
}
module.exports={setup};
