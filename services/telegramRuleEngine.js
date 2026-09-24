'use strict';

function setup({state,saveStore,ownerId,registry,journal,feed}) {
  state.ariaAutomationRules = state.ariaAutomationRules || [];
  const own=id=>String(id)===String(ownerId);
  function normalize(rule){return {id:rule.id||`rule_${Date.now().toString(36)}`,ownerId:String(rule.ownerId),enabled:true,createdAt:new Date().toISOString(),event:'',condition:'',action:'',actionType:null,actionArgs:{},...rule};}
  function add(id,rule){if(!own(id))return {success:false,error:'Owner access only.'};const r=normalize({...rule,ownerId:id});state.ariaAutomationRules.push(r);saveStore();feed?.({action:'automation.create',detail:r.event+' → '+r.action});return {success:true,data:r};}
  function list(id){return state.ariaAutomationRules.filter(r=>r.ownerId===String(id));}
  function remove(id,rid){if(!own(id))return {success:false,error:'Owner access only.'};const i=state.ariaAutomationRules.findIndex(r=>r.ownerId===String(id)&&r.id===rid);if(i<0)return {success:false,error:'Rule not found.'};state.ariaAutomationRules.splice(i,1);saveStore();feed?.({action:'automation.remove',detail:rid});return {success:true};}
  function setEnabled(id,rid,enabled){const r=list(id).find(x=>x.id===rid);if(!r)return {success:false,error:'Rule not found.'};r.enabled=!!enabled;saveStore();return {success:true,data:r};}
  async function emit(id,event,payload={}) {
    if(!own(id))return [];
    const results=[];
    for(const r of list(id).filter(x=>x.enabled)) {
      if(!matches(r.event,event,payload))continue;
      if(!r.actionType || !['sendMessage','lockGroup','antiLink','moderate','warn'].includes(r.actionType)) { results.push({rule:r,skipped:true,reason:'Action is not allow-listed'}); continue; }
      try { const args={...r.actionArgs,userId:id,...(payload.chatId?{chatId:payload.chatId}: {})}; const out=await registry.execute(r.actionType,args); journal.record(id,{action:'automation.execute',tool:r.actionType,args,chatId:payload.chatId,target:payload.targetUserId||payload.chatId,detail:r.action}); results.push({rule:r,result:out}); }
      catch(e){results.push({rule:r,error:e.message});}
    }
    return results;
  }
  function matches(pattern,event,payload){const p=String(pattern||'').toLowerCase(),e=String(event||'').toLowerCase();if(!p)return false;if(p.includes('message')&&e==='message')return true;if(p.includes('flood')&&payload.flood)return true;if(p.includes('link')&&payload.hasLink)return true;if(p===e)return true;return false;}
  return {add,list,remove,setEnabled,emit};
}
module.exports={setup};
