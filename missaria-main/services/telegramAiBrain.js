'use strict';

function setup({state,saveStore,ownerId,knownGroups,registry,audit}) {
  const own=id=>String(id)===String(ownerId);
  state.ariaAiBrain=state.ariaAiBrain||{};
  state.ariaLiveFeed=state.ariaLiveFeed||[];
  state.ariaRules=state.ariaRules||[];
  const key=id=>String(id);
  function context(id){return state.ariaAiBrain[key(id)]||{};}
  function remember(id,patch){if(!own(id))return;state.ariaAiBrain[key(id)]={...context(id),...patch,at:Date.now()};saveStore();}
  function feed(entry){state.ariaLiveFeed.push({...entry,at:new Date().toISOString()});if(state.ariaLiveFeed.length>200)state.ariaLiveFeed=state.ariaLiveFeed.slice(-200);saveStore();}
  function journal(id,entry){remember(id,{lastAction:entry.action,lastGroupId:entry.chatId||null,lastGroupTitle:entry.groupTitle||null,lastUserId:entry.targetUserId||null,lastTaskId:entry.taskId||null,lastEntry:entry});feed(entry);audit({...entry,target:entry.chatId||entry.target||''});}
  async function resolveGroup(id,phrase){const c=context(id);const q=String(phrase||'').trim().replace(/^@/,'').toLowerCase();if(!q||/^(that|this|the group|it|there)$/.test(q)) {if(c.lastGroupId)return {id:c.lastGroupId,title:c.lastGroupTitle||String(c.lastGroupId)};return null;}const gs=await knownGroups(id);return gs.find(g=>String(g.title||'').toLowerCase()===q||String(g.username||'').toLowerCase()===q)|| (gs.filter(g=>String(g.title||'').toLowerCase().includes(q)).length===1?gs.filter(g=>String(g.title||'').toLowerCase().includes(q))[0]:null);}
  function resolveUser(id,phrase){const c=context(id);const q=String(phrase||'').replace(/^@/,'').toLowerCase();if(/^(him|her|them|that user|the user)$/.test(q)&&c.lastUserId)return c.lastUserId;const d=state.ariaUserDirectory||{};const hit=Object.values(d).find(x=>String(x.username||'').toLowerCase()===q);return hit?.id||(/^[0-9]+$/.test(q)?Number(q):null);}
  function suggest(id,analytics){const c=context(id), out=[];if(c.lastGroupId){const s=state.chatSettings?.[String(c.lastGroupId)]||{};if(!s.lockLinks)out.push('Consider enabling anti-link if links are a recurring problem.');}if((analytics||{}).messagesToday>100)out.push('Activity is high today; review flood/auto-mod settings.');if(!out.length)out.push('Everything looks quiet. Review groups, auto-mod incidents, or scheduled tasks.');return out;}
  function addRule(id,rule){if(!own(id))return {success:false,error:'Owner access only.'};const r={id:'rule_'+Date.now().toString(36),ownerId:String(id),enabled:true,...rule};state.ariaRules.push(r);saveStore();feed({action:'rule.create',detail:r.name||r.id});return {success:true,data:r};}
  function listRules(id){return state.ariaRules.filter(r=>r.ownerId===String(id));}
  function removeRule(id,rid){const i=state.ariaRules.findIndex(r=>r.ownerId===String(id)&&r.id===rid);if(i<0)return {success:false,error:'Rule not found.'};state.ariaRules.splice(i,1);saveStore();feed({action:'rule.remove',detail:rid});return {success:true};}
  return {context,remember,feed,journal,resolveGroup,resolveUser,suggest,addRule,listRules,removeRule};
}
module.exports={setup};
