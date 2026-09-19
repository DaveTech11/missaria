'use strict';

function setup({state, saveStore, ownerId, registry, audit, feed}) {
  state.ariaActionJournal = state.ariaActionJournal || {};
  const own = id => String(id) === String(ownerId);
  const key = id => String(id);
  const list = id => state.ariaActionJournal[key(id)] || [];
  function record(id, entry) {
    if (!own(id)) return null;
    const row = { id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`, at: new Date().toISOString(), ownerId: key(id), status: 'success', ...entry };
    const a = list(id); a.push(row); state.ariaActionJournal[key(id)] = a.slice(-100); saveStore();
    feed?.({action:'journal.record', detail: row.action || 'action', target: row.target || row.chatId || ''});
    audit?.({action:row.action, target:row.target || row.chatId || '', detail:row.detail || '', journalId:row.id});
    return row;
  }
  function latest(id, filter = {}) {
    return list(id).slice().reverse().find(x => Object.entries(filter).every(([k,v]) => v == null || String(x[k]) === String(v))) || null;
  }
  function explain(id, query) {
    const q=String(query||'').toLowerCase();
    const row=list(id).slice().reverse().find(x=>!q || JSON.stringify(x).toLowerCase().includes(q));
    return row || null;
  }
  async function retry(id, row) {
    if(!own(id)||!row||!row.tool||!row.args) return {success:false,error:{message:'This action is not safely retryable.'}};
    try { const r=await registry.execute(row.tool,{...row.args,userId:id}); if(r.success!==false) record(id,{action:row.action+'.retry',tool:row.tool,args:row.args,chatId:row.chatId,target:row.target,detail:'Retry succeeded'}); return r; }
    catch(e){return {success:false,error:{message:e.message}}}
  }
  async function undo(id,row) {
    if(!own(id)||!row?.inverse) return {success:false,error:{message:'No safe undo is available for this action.'}};
    try { const r=await registry.execute(row.inverse.tool,{...row.inverse.args,userId:id}); if(r.success!==false) record(id,{action:row.action+'.undo',tool:row.inverse.tool,args:row.inverse.args,chatId:row.chatId,target:row.target,detail:'Undo succeeded'}); return r; }
    catch(e){return {success:false,error:{message:e.message}}}
  }
  return {record,list,latest,explain,retry,undo};
}
module.exports={setup};
