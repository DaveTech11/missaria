'use strict';

function setup({bot,state,saveStore,registry,audit,knownGroups,ownerId}) {
  const ownerOnly = id => String(id) === String(ownerId);
  const MAX = 20;
  state.ariaAiContext = state.ariaAiContext || {};
  state.ariaUndo = state.ariaUndo || {};

  function rememberContext(userId, patch) {
    if (!ownerOnly(userId)) return;
    const k=String(userId);
    state.ariaAiContext[k] = {...(state.ariaAiContext[k]||{}), ...patch, at:Date.now()};
    saveStore();
  }
  function context(userId) { return state.ariaAiContext[String(userId)] || {}; }
  function pushUndo(userId, entry) {
    const k=String(userId); state.ariaUndo[k]=state.ariaUndo[k]||[];
    state.ariaUndo[k].push({...entry,at:Date.now()});
    if(state.ariaUndo[k].length>MAX) state.ariaUndo[k]=state.ariaUndo[k].slice(-MAX);
    saveStore();
  }
  function peekUndo(userId) { const a=state.ariaUndo[String(userId)]||[]; return a[a.length-1]||null; }
  async function undo(userId) {
    if(!ownerOnly(userId)) return {success:false,error:{message:'Owner access only.'}};
    const k=String(userId), a=state.ariaUndo[k]||[], e=a.pop();
    if(!e) return {success:false,error:{message:'Nothing to undo.'}};
    try {
      let r;
      if(e.type==='antiLink') r=await registry.execute('antiLink',{userId,chatId:e.chatId,enabled:e.previous});
      else if(e.type==='lock') r=await registry.execute('lockGroup',{userId,chatId:e.chatId,locked:e.previous});
      else if(e.type==='autoMod') {
        const cfg=state.ariaAutoMod?.[String(e.chatId)]||{};
        state.ariaAutoMod[String(e.chatId)]={...cfg,...e.previous}; saveStore(); r={success:true};
      } else if(e.type==='rename') r=await registry.execute('updateGroupTitle',{userId,chatId:e.chatId,title:e.previous});
      else throw new Error('This action cannot be undone automatically.');
      audit({action:'undo',target:String(e.chatId),detail:e.type}); saveStore();
      return r.success===false?r:{success:true,data:{type:e.type}};
    } catch(err){ a.push(e); saveStore(); return {success:false,error:{message:err.message}}; }
  }
  async function resolveGroup(userId, phrase) {
    const q=String(phrase||'').trim().replace(/^@/,'').toLowerCase();
    const gs=await knownGroups(userId);
    return gs.find(g=>String(g.title||'').toLowerCase()===q || String(g.username||'').toLowerCase()===q)
      || (gs.filter(g=>String(g.title||'').toLowerCase().includes(q)).length===1 ? gs.filter(g=>String(g.title||'').toLowerCase().includes(q))[0] : null);
  }
  async function multi(userId, chatId, text, send) {
    const parts=String(text).split(/\s+and\s+(?=(?:lock|unlock|enable|disable|turn|send|rename|pin|unpin)\b)/i).map(x=>x.trim()).filter(Boolean);
    if(parts.length<2) return null;
    const preview=[];
    for(const p of parts){
      let m=p.match(/^(lock|unlock)\s+(.+)$/i);
      if(m){const g=await resolveGroup(userId,m[2]); if(!g)return send(chatId,`❌ Could not resolve group <b>${m[2]}</b>.`); preview.push({kind:'lock',group:g,locked:m[1].toLowerCase()==='lock'});continue;}
      m=p.match(/^(?:enable|turn on|disable|turn off)\s+(?:anti[- ]link|links?)\s+(?:in|on)\s+(.+)$/i);
      if(m){const g=await resolveGroup(userId,m[1]); if(!g)return send(chatId,`❌ Could not resolve group <b>${m[1]}</b>.`); preview.push({kind:'antiLink',group:g,enabled:/^(?:enable|turn on)/i.test(p)});continue;}
      return null;
    }
    const dangerous=preview.some(x=>x.kind==='lock');
    const lines=preview.map(x=>x.kind==='lock'?`🔒 ${x.locked?'Lock':'Unlock'} <b>${x.group.title}</b>`:`🔗 Anti-link ${x.enabled?'ON':'OFF'} in <b>${x.group.title}</b>`);
    if(dangerous) return send(chatId,'🧠 <b>Multi-step operation preview</b>\n\n'+lines.join('\n')+'\n\n⚠️ One or more actions change group permissions. Run each action individually to confirm, or use the control buttons.');
    for(const x of preview){
      if(x.kind==='antiLink'){
        const previous=!!state.chatSettings?.[String(x.group.id)]?.lockLinks;
        const r=await registry.execute('antiLink',{userId,chatId:x.group.id,enabled:x.enabled});
        if(r.success) pushUndo(userId,{type:'antiLink',chatId:x.group.id,previous});
      }
    }
    return send(chatId,'✅ <b>Multi-step operation completed</b>\n\n'+lines.join('\n')+'\n\n↩️ Say <code>Aria, undo</code> to reverse the last supported change.');
  }
  return {rememberContext,context,pushUndo,peekUndo,undo,multi};
}
module.exports={setup};
