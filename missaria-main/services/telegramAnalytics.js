'use strict';

function setup({ state, saveStore }) {
  state.ariaAnalytics = state.ariaAnalytics || { groups:{}, users:{}, actions:[], daily:{} };
  function day(){return new Date().toISOString().slice(0,10);}
  function recordMessage(msg){
    if(!msg?.chat) return;
    const c=String(msg.chat.id), u=String(msg.from?.id||'unknown'), d=day();
    state.ariaAnalytics.groups[c]=state.ariaAnalytics.groups[c]||{title:msg.chat.title||c,messages:0,users:{}};
    state.ariaAnalytics.groups[c].title=msg.chat.title||state.ariaAnalytics.groups[c].title;
    state.ariaAnalytics.groups[c].messages++;
    state.ariaAnalytics.groups[c].users[u]=(state.ariaAnalytics.groups[c].users[u]||0)+1;
    state.ariaAnalytics.users[u]=(state.ariaAnalytics.users[u]||0)+1;
    state.ariaAnalytics.daily[d]=state.ariaAnalytics.daily[d]||{messages:0,users:{}};
    state.ariaAnalytics.daily[d].messages++; state.ariaAnalytics.daily[d].users[u]=1;
  }
  function action(entry){state.ariaAnalytics.actions.push({...entry,at:new Date().toISOString()});if(state.ariaAnalytics.actions.length>1000)state.ariaAnalytics.actions=state.ariaAnalytics.actions.slice(-1000);}
  function summary(){
    const groups=Object.entries(state.ariaAnalytics.groups).map(([id,g])=>({id,title:g.title,messages:g.messages,uniqueUsers:Object.keys(g.users||{}).length})).sort((a,b)=>b.messages-a.messages);
    const actions=state.ariaAnalytics.actions.slice(-20).reverse();
    const d=state.ariaAnalytics.daily[day()]||{messages:0,users:{}};
    return {messagesToday:d.messages,usersToday:Object.keys(d.users||{}).length,totalUsers:Object.keys(state.ariaAnalytics.users).length,groups,actions};
  }
  function persist(){saveStore();}
  return {recordMessage,action,summary,persist};
}
module.exports={setup};
