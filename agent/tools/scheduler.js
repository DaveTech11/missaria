'use strict';
const fs=require('fs'),path=require('path');
function file(ctx){return path.join(ctx.DATA_DIR||path.join(process.cwd(),'data'),'aria-agent-jobs.json');}
function load(ctx){try{return JSON.parse(fs.readFileSync(file(ctx),'utf8'));}catch{return [];}}
function save(ctx,j){fs.mkdirSync(path.dirname(file(ctx)),{recursive:true});fs.writeFileSync(file(ctx),JSON.stringify(j,null,2));}
function createScheduler(ctx){
  const timers=new Map();
  const schedule=(job)=>{const delay=Math.max(1000,new Date(job.runAt).getTime()-Date.now()); const t=setTimeout(()=>{ctx.bot.sendMessage(job.chatId,`🌸 <b>Miss Aria reminder</b>\n\n${String(job.text).replace(/&/g,'&amp;').replace(/</g,'&lt;')}`,{parse_mode:'HTML'}).catch(()=>{}); timers.delete(job.id); const all=load(ctx).filter(x=>x.id!==job.id); save(ctx,all);},Math.min(delay,2147483647)); timers.set(job.id,t);};
  for(const j of load(ctx)){if(new Date(j.runAt).getTime()>Date.now()) schedule(j);}
  return {
    scheduleReminder: async ({chatId,text,runAt,userId}={})=>{if(!chatId||!text||!runAt) return {success:false,error:{code:'INVALID_JOB',message:'chatId, text and runAt are required.'}}; const id=Date.now().toString(36)+Math.random().toString(36).slice(2,7); const j={id,chatId:String(chatId),text:String(text).slice(0,2000),runAt:new Date(runAt).toISOString(),userId:String(userId||'')}; const all=load(ctx); all.push(j); save(ctx,all); schedule(j); return {success:true,data:j};},
    listReminders: async ({chatId}={})=>({success:true,data:load(ctx).filter(x=>!chatId||String(x.chatId)===String(chatId))}),
    cancelReminder: async ({id}={})=>{const all=load(ctx); const j=all.find(x=>x.id===String(id)); if(!j)return {success:false,error:{code:'NOT_FOUND',message:'Reminder not found.'}}; clearTimeout(timers.get(j.id));timers.delete(j.id);save(ctx,all.filter(x=>x.id!==j.id));return {success:true,data:j};}
  };
}
module.exports={createScheduler};
