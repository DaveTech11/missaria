'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'telegram_scheduler.sqlite');
let db = null, bot = null, ownerId = '', state = null, saveStore = null, audit = () => {};
let timer = null;
const TICK_MS = 15000;
const ALLOWED_ACTIONS = new Set(['sendMessage','lock','unlock','antiLink','welcomeMessage']);

function getDb(){
  if(db)return db;
  fs.mkdirSync(DB_DIR,{recursive:true});
  const Database=require('better-sqlite3'); db=new Database(DB_PATH);
  db.exec(`CREATE TABLE IF NOT EXISTS telegram_tasks (
    id TEXT PRIMARY KEY, ownerJid TEXT NOT NULL, targetJid TEXT NOT NULL,
    action TEXT NOT NULL, payload TEXT NOT NULL, schedule TEXT NOT NULL,
    createdAt INTEGER NOT NULL, status TEXT NOT NULL, lastRunAt INTEGER,
    nextRunAt INTEGER, timezone TEXT, retryCount INTEGER NOT NULL DEFAULT 0
  )`);
  // Upgrade old v3 databases without destructive migrations.
  for(const sql of [
    "ALTER TABLE telegram_tasks ADD COLUMN nextRunAt INTEGER",
    "ALTER TABLE telegram_tasks ADD COLUMN timezone TEXT",
    "ALTER TABLE telegram_tasks ADD COLUMN retryCount INTEGER NOT NULL DEFAULT 0"
  ]){try{db.exec(sql)}catch{}}
  db.exec(`CREATE TABLE IF NOT EXISTS telegram_task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, taskId TEXT NOT NULL, at INTEGER NOT NULL,
    ok INTEGER NOT NULL, error TEXT, manual INTEGER NOT NULL DEFAULT 0
  )`);
  return db;
}
function result(success,data=null,error=null){return {success,data,error};}
function isOwner(id){return !!ownerId&&String(id)===String(ownerId)}
function newId(){return crypto.randomBytes(5).toString('hex')}
function validTz(tz){try{new Intl.DateTimeFormat('en-US',{timeZone:tz}).format();return true}catch{return false}}
function parseRow(r){return {...r,payload:JSON.parse(r.payload),schedule:JSON.parse(r.schedule)}}
function localParts(ms,tz){const parts=new Intl.DateTimeFormat('en-US',{timeZone:tz||'UTC',hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short'}).formatToParts(new Date(ms));const o={};for(const p of parts)o[p.type]=p.value;return o}
function matchesSchedule(schedule,ms,tz){
  const p=localParts(ms,tz||schedule.timezone||'UTC');
  const minute=Number(p.hour)*60+Number(p.minute);
  if(schedule.type==='once')return ms>=new Date(schedule.runAt).getTime();
  if(minute!==Number(schedule.hour)*60+Number(schedule.minute||0))return false;
  if(schedule.type==='weekly'){
    const day={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday];return day===Number(schedule.dayOfWeek);
  }
  return schedule.type==='daily';
}
function nextOccurrence(schedule,fromMs){
  if(schedule.type==='once')return new Date(schedule.runAt).getTime();
  const tz=schedule.timezone||'UTC';
  // Search minute-by-minute for up to 8 days. This is simple, DST-safe enough for the bot's scale.
  const start=fromMs+60000;
  for(let i=0;i<=8*24*60;i++){
    const ms=start+i*60000,p=localParts(ms,tz);const minute=Number(p.hour)*60+Number(p.minute);
    if(minute!==Number(schedule.hour)*60+Number(schedule.minute||0))continue;
    if(schedule.type==='weekly'){
      const day={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday];if(day!==Number(schedule.dayOfWeek))continue;
    }
    return ms;
  }
  return null;
}
function normalizeSchedule(schedule){
  if(!schedule||!['once','daily','weekly'].includes(schedule.type))throw new Error('Schedule must be once, daily, or weekly.');
  const s={...schedule,timezone:schedule.timezone||process.env.TZ||'UTC'};
  if(!validTz(s.timezone))throw new Error('Invalid timezone.');
  if(s.type==='once'){const ms=new Date(s.runAt).getTime();if(!Number.isFinite(ms))throw new Error('Invalid runAt.');s.runAt=new Date(ms).toISOString();}
  else {s.hour=Number(s.hour);s.minute=Number(s.minute||0);if(s.hour<0||s.hour>23||s.minute<0||s.minute>59)throw new Error('Invalid time.');if(s.type==='weekly'){s.dayOfWeek=Number(s.dayOfWeek);if(s.dayOfWeek<0||s.dayOfWeek>6)throw new Error('Invalid weekday.');}}
  return s;
}
function createTask({ownerJid,targetJid,action,payload,schedule}){
  if(!isOwner(ownerJid))return result(false,null,{code:'UNAUTHORIZED',message:'Only the Telegram owner can create tasks.'});
  if(!ALLOWED_ACTIONS.has(action))return result(false,null,{code:'ACTION_NOT_ALLOWED',message:'That task action is not supported.'});
  if(!targetJid)return result(false,null,{code:'TARGET_REQUIRED',message:'A target Telegram chat is required.'});
  let s;try{s=normalizeSchedule(schedule)}catch(e){return result(false,null,{code:'INVALID_SCHEDULE',message:e.message})}
  const task={id:newId(),ownerJid:String(ownerJid),targetJid:String(targetJid),action,payload:payload||{},schedule:s,createdAt:Date.now(),status:'active',lastRunAt:null,nextRunAt:nextOccurrence(s,Date.now()),timezone:s.timezone,retryCount:0};
  getDb().prepare(`INSERT INTO telegram_tasks(id,ownerJid,targetJid,action,payload,schedule,createdAt,status,lastRunAt,nextRunAt,timezone,retryCount) VALUES (@id,@ownerJid,@targetJid,@action,@payload,@schedule,@createdAt,@status,@lastRunAt,@nextRunAt,@timezone,@retryCount)`).run({...task,payload:JSON.stringify(task.payload),schedule:JSON.stringify(task.schedule)});
  audit({action:'task_create',target:task.targetJid,task:task.id});
  return result(true,task);
}
function listTasks(ownerJid){if(!isOwner(ownerJid))return [];return getDb().prepare('SELECT * FROM telegram_tasks WHERE ownerJid=? ORDER BY createdAt DESC').all(String(ownerJid)).map(parseRow)}
function getTask(id){const r=getDb().prepare('SELECT * FROM telegram_tasks WHERE id=?').get(String(id));return r?parseRow(r):null}
function updateTask(id,ownerJid,patch){
  if(!isOwner(ownerJid))return result(false,null,{code:'UNAUTHORIZED',message:'Only the owner can edit tasks.'});
  const old=getTask(id);if(!old||old.ownerJid!==String(ownerJid))return result(false,null,{code:'TASK_NOT_FOUND',message:'Task not found.'});
  let schedule=old.schedule;if(patch.schedule){try{schedule=normalizeSchedule(patch.schedule)}catch(e){return result(false,null,{code:'INVALID_SCHEDULE',message:e.message})}}
  const payload=patch.payload===undefined?old.payload:patch.payload;
  const action=patch.action||old.action;if(!ALLOWED_ACTIONS.has(action))return result(false,null,{code:'ACTION_NOT_ALLOWED',message:'Unsupported task action.'});
  const targetJid=patch.targetJid||old.targetJid;
  const next=nextOccurrence(schedule,Date.now());
  getDb().prepare(`UPDATE telegram_tasks SET targetJid=?,action=?,payload=?,schedule=?,nextRunAt=?,timezone=? WHERE id=?`).run(String(targetJid),action,JSON.stringify(payload),JSON.stringify(schedule),next,schedule.timezone,String(id));
  audit({action:'task_edit',target:String(targetJid),task:String(id)});
  return result(true,getTask(id));
}
function cancelTask(id,ownerJid){return setStatus(id,ownerJid,'cancelled')}
function pauseTask(id,ownerJid){return setStatus(id,ownerJid,'paused')}
function resumeTask(id,ownerJid){return setStatus(id,ownerJid,'active')}
function setStatus(id,ownerJid,status){if(!isOwner(ownerJid))return result(false,null,{code:'UNAUTHORIZED',message:'Owner only.'});const t=getTask(id);if(!t||t.ownerJid!==String(ownerJid))return result(false,null,{code:'TASK_NOT_FOUND',message:'Task not found.'});getDb().prepare('UPDATE telegram_tasks SET status=?,nextRunAt=? WHERE id=?').run(status,status==='active'?nextOccurrence(t.schedule,Date.now()):null,String(id));audit({action:`task_${status}`,target:t.targetJid,task:String(id)});return result(true,{id:String(id),status})}
function history(id,ownerJid){if(!isOwner(ownerJid))return [];const t=getTask(id);if(!t||t.ownerJid!==String(ownerJid))return [];return getDb().prepare('SELECT * FROM telegram_task_history WHERE taskId=? ORDER BY at DESC LIMIT 50').all(String(id))}
async function executeTask(task,manual=false){
  try{
    let ok=false;
    if(task.action==='sendMessage'){const text=String(task.payload?.text||'').trim();if(!text)throw new Error('Message text is empty.');const sent=await bot.sendMessage(task.targetJid,text,task.payload?.options||{});ok=!!sent?.message_id}
    else if(task.action==='lock'){await bot.setChatPermissions(task.targetJid,{can_send_messages:false});ok=true}
    else if(task.action==='unlock'){await bot.setChatPermissions(task.targetJid,{can_send_messages:true,can_send_audios:true,can_send_documents:true,can_send_photos:true,can_send_videos:true,can_send_video_notes:true,can_send_voice_notes:true,can_send_polls:true,can_send_other_messages:true,can_add_web_page_previews:true});ok=true}
    else if(task.action==='antiLink'){state.chatSettings=state.chatSettings||{};const k=String(task.targetJid);state.chatSettings[k]=state.chatSettings[k]||{};state.chatSettings[k].lockLinks=!!task.payload?.enabled;saveStore();ok=true}
    else if(task.action==='welcomeMessage'){state.telegramWelcome=state.telegramWelcome||{};state.telegramWelcome[String(task.targetJid)]=String(task.payload?.text||'');saveStore();ok=true}
    getDb().prepare('INSERT INTO telegram_task_history(taskId,at,ok,error,manual) VALUES (?,?,?,?,?)').run(task.id,Date.now(),ok?1:0,null,manual?1:0);
    return ok;
  }catch(e){getDb().prepare('INSERT INTO telegram_task_history(taskId,at,ok,error,manual) VALUES (?,?,?,?,?)').run(task.id,Date.now(),0,String(e.message||e),manual?1:0);console.error('[TG SCHEDULER]',task.id,e.message);return false}
}
async function runNow(id,ownerJid){if(!isOwner(ownerJid))return result(false,null,{code:'UNAUTHORIZED',message:'Owner only.'});const t=getTask(id);if(!t||t.ownerJid!==String(ownerJid))return result(false,null,{code:'TASK_NOT_FOUND',message:'Task not found.'});const ok=await executeTask(t,true);if(ok)audit({action:'task_run_now',target:t.targetJid,task:t.id});return ok?result(true,{executed:true}):result(false,null,{code:'EXECUTION_FAILED',message:'Task execution failed; check task history.'})}
async function tick(){const now=Date.now();const tasks=getDb().prepare("SELECT * FROM telegram_tasks WHERE status='active'").all().map(parseRow);for(const t of tasks){if(t.schedule.type==='once'){if(now<new Date(t.schedule.runAt).getTime()||t.lastRunAt)continue}else if(!(t.nextRunAt&&now>=t.nextRunAt))continue;const ok=await executeTask(t,false);if(t.schedule.type==='once'){getDb().prepare('UPDATE telegram_tasks SET status=?,lastRunAt=?,nextRunAt=NULL WHERE id=?').run(ok?'completed':'failed',Date.now(),t.id)}else if(ok){const next=nextOccurrence(t.schedule,now);getDb().prepare('UPDATE telegram_tasks SET lastRunAt=?,nextRunAt=?,retryCount=0 WHERE id=?').run(now,next,t.id)}else{const retry=(t.retryCount||0)+1;if(retry>=3){getDb().prepare('UPDATE telegram_tasks SET status=\'failed\',retryCount=? WHERE id=?').run(retry,t.id)}else{getDb().prepare('UPDATE telegram_tasks SET retryCount=?,nextRunAt=? WHERE id=?').run(retry,now+Math.min(retry*60000,180000),t.id)}}}}
function start(opts={}){bot=opts.bot||bot;ownerId=String(opts.ownerId||ownerId||'').trim();state=opts.state||state;saveStore=opts.saveStore||saveStore;audit=opts.audit||audit;getDb();if(timer)return;timer=setInterval(()=>tick().catch(e=>console.error('[TG SCHEDULER TICK]',e.message)),TICK_MS);tick().catch(()=>{})}
function stop(){if(timer)clearInterval(timer);timer=null}
module.exports={start,stop,tick,createTask,listTasks,getTask,updateTask,cancelTask,pauseTask,resumeTask,runNow,history,ALLOWED_ACTIONS};
