'use strict';

function setup({ state, saveStore, ownerId, knownGroups, registry, accessControl }) {
  async function canUse(userId, chatId) {
    if (own(userId)) return {ok:true};
    if (!accessControl || !chatId) return {ok:false,message:'Group-admin access only.'};
    return accessControl.canControl(userId, chatId);
  }
  state.ariaIncidents = state.ariaIncidents || [];
  const own = id => String(id) === String(ownerId);
  const pushIncident = (entry) => {
    state.ariaIncidents.push({ id:`inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`, at:new Date().toISOString(), ...entry });
    state.ariaIncidents = state.ariaIncidents.slice(-300);
    saveStore();
  };
  async function groupHealth(userId, phrase) {
    const groups = await knownGroups(userId);
    const q = String(phrase||'').trim().replace(/^@/,'').toLowerCase();
    const g = groups.find(x => String(x.title||'').toLowerCase()===q || String(x.username||'').toLowerCase()===q) || groups.find(x => String(x.title||'').toLowerCase().includes(q));
    if (!g) return {success:false,error:'Group not found or not uniquely verified.'};
    const gate = await canUse(userId, g.id);
    if (!gate.ok) return {success:false,error:gate.message};
    const s = state.chatSettings?.[String(g.id)] || {};
    const am = state.ariaAutoMod?.[String(g.id)] || {};
    const recent = (state.ariaAudit||[]).filter(x => String(x.target||'').startsWith(String(g.id))).slice(-50);
    const incidents = recent.filter(x => /ban|kick|mute|warn|flood|link|delete|emergency/i.test(String(x.action||'')+' '+String(x.detail||''))).length;
    const score = Math.max(0, Math.min(100, 100 - incidents*8 - (!s.lockLinks?10:0) - (!am.enabled?5:0)));
    return {success:true,data:{group:g,score,incidents,antiLink:!!s.lockLinks,autoMod:!!am.enabled,recentActions:recent.length}};
  }
  function search(userId, query) {
    if (!own(userId)) return {success:false,error:'Owner access only.'};
    const q=String(query||'').toLowerCase().trim();
    const dir=Object.values(state.ariaUserDirectory||{});
    const users=dir.filter(x => String(x.id).includes(q)||String(x.username||'').toLowerCase().includes(q)||String(x.name||'').toLowerCase().includes(q)).slice(0,20);
    const audit=(state.ariaAudit||[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(-20).reverse();
    return {success:true,data:{users,audit}};
  }
  function incidents(userId, limit=30) {
    if(!own(userId)) return {success:false,error:'Owner access only.'};
    return {success:true,data:state.ariaIncidents.slice(-Math.min(Number(limit)||30,50)).reverse()};
  }
  function simulate(userId, description) {
    if(!own(userId)) return {success:false,error:'Owner access only.'};
    const steps=[];
    if(/lock/i.test(text)) steps.push({action:'lockGroup',dangerous:true,note:'Would restrict group messaging; confirmation required.'});
    if(/unlock/i.test(text)) steps.push({action:'unlockGroup',dangerous:true,note:'Would restore group messaging.'});
    if(/anti[- ]link/i.test(text)) steps.push({action:'antiLink',dangerous:false,note:'Would change the stored anti-link setting.'});
    if(/auto[- ]mod/i.test(text)) steps.push({action:'autoMod',dangerous:false,note:'Would change Auto-Mod configuration.'});
    if(/mute|ban|kick|warn/i.test(text)) steps.push({action:'moderation',dangerous:true,note:'Would affect a Telegram member; confirmation required.'});
    if(/send|message/i.test(text)) steps.push({action:'sendMessage',dangerous:false,note:'Would send a Telegram message.'});
    if(!steps.length) steps.push({action:'inspect',dangerous:false,note:'No executable allow-listed operation detected; simulation only.'});
    return {success:true,data:{description:text,steps,executed:false}};
  }
  async function profile(userId, phrase) {
    const r=await groupHealth(userId,phrase); if(!r.success)return r;
    const admins=await registry.execute('groupAdmins',{userId,chatId:r.data.group.id});
    return {success:true,data:{...r.data,admins:admins.success?admins.data:[]}};
  }
  return {groupHealth,search,incidents,simulate,profile,pushIncident};
}
module.exports={setup};
