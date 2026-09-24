'use strict';

const os = require('os');
const scheduler = require('./telegramScheduler');
const confirmations = require('./telegramConfirmations');
const stats = require('./statsTracker');
const { createRegistry } = require('./telegramToolRegistry');
const backup = require('./telegramBackup');
const memoryFactory = require('./telegramMemory');
const analyticsFactory = require('./telegramAnalytics');
const automodFactory = require('./telegramAutoMod');
const aiIntent = require('./telegramAiIntent');

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function isGroup(c){return c&&(c.type==='group'||c.type==='supergroup');}
function fmt(sec){sec=Math.max(0,Number(sec)||0);const d=Math.floor(sec/86400);sec%=86400;const h=Math.floor(sec/3600);sec%=3600;const m=Math.floor(sec/60);return `${d?d+'d ':''}${h?h+'h ':''}${m}m`}
function menu(){return {inline_keyboard:[
 [{text:'👥 Groups',callback_data:'aria_groups'},{text:'🛡 Moderation',callback_data:'aria_moderation'}],
 [{text:'📨 Messaging',callback_data:'aria_message'},{text:'⏰ Tasks',callback_data:'aria_tasks'}],
 [{text:'📊 Analytics',callback_data:'aria_stats'},{text:'🧠 AI Control',callback_data:'aria_ai'}],
 [{text:'🤖 Auto-Mod',callback_data:'aria_automod'},{text:'🚨 Emergency',callback_data:'aria_emergency'}],
 [{text:'🔐 Security',callback_data:'aria_security'},{text:'💾 Backup',callback_data:'aria_backup'}],
 [{text:'🧠 Memory',callback_data:'aria_memory'},{text:'🔧 Diagnostics',callback_data:'aria_diag'}],
 [{text:'📜 Audit',callback_data:'aria_audit'},{text:'⚙️ Help',callback_data:'aria_help'}]
]};}
function setup({bot,state,saveStore,addChat,ownerId}){
 const ownerOnly=id=>!!ownerId&&String(id)===String(ownerId);
 const audit=entry=>{state.ariaAudit=state.ariaAudit||[];state.ariaAudit.push({...entry,at:new Date().toISOString()});if(state.ariaAudit.length>500)state.ariaAudit=state.ariaAudit.slice(-500);saveStore()};
 const analytics=analyticsFactory.setup({state,saveStore});
 const memory=memoryFactory.setup({state,saveStore,ownerId});
 const autoMod=automodFactory.setup({bot,state,saveStore,ownerId,audit});
 const backupApi=backup.setup({state,saveStore,ownerId});
 async function knownGroups(userId){const known=state.users?.[String(userId)]?.chats||[];const out=[];for(const c of known.filter(isGroup)){const m=await bot.getChatMember(c.id,userId).catch(()=>null);if(m&&['administrator','creator'].includes(m.status))out.push(c)}return out;}
 const registry=createRegistry({bot,state,saveStore,ownerId,knownGroups});
 scheduler.start({bot,ownerId,state,saveStore,audit});

 bot.on('message',msg=>{try{analytics.recordMessage(msg);analytics.persist()}catch{} autoMod.onMessage(msg).catch(()=>{})});

 const denied=chat=>bot.sendMessage(chat,'🔒 <b>Owner access only.</b>',{parse_mode:'HTML'});
 const send=(chat,text,opts={})=>bot.sendMessage(chat,text,{parse_mode:'HTML',...opts});
 const groups=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const r=await registry.execute('listGroups',{userId:user});if(!r.success)return send(chat,`❌ ${esc(r.error.message)}`);if(!r.data.length)return send(chat,'👥 <b>No verified admin groups</b>\n\nAdd Miss Aria to a group as an administrator, then use the group setup flow.');return send(chat,`👥 <b>Telegram Control Center</b>\n\nVerified admin groups: <b>${r.data.length}</b>\n\nChoose a group:`,{reply_markup:{inline_keyboard:r.data.slice(0,50).map(c=>[{text:`👥 ${String(c.title).slice(0,45)}`,callback_data:`aria_manage_${c.id}`}])}})};
 const groupPanel=async(chat,user,id)=>{if(!ownerOnly(user))return denied(chat);const r=await registry.execute('groupInfo',{userId:user,chatId:id});if(!r.success)return send(chat,`❌ ${esc(r.error.message)}`);const s=state.ariaAutoMod?.[String(id)]||{};return send(chat,`🛡 <b>${esc(r.data.title)}</b>\n<code>${esc(r.data.id)}</code>\n\nAuto-Mod: ${s.enabled?'🟢 ON':'⚪ OFF'}\nAnti-Link: ${state.chatSettings?.[String(id)]?.lockLinks?'🟢 ON':'⚪ OFF'}`,{reply_markup:{inline_keyboard:[
 [{text:'🛡 Moderation',callback_data:`aria_gmod_${id}`},{text:'👑 Admins',callback_data:`aria_admins_${id}`}],
 [{text:'🔒 Lock',callback_data:`aria_lock_${id}`},{text:'🔓 Unlock',callback_data:`aria_unlock_${id}`}],
 [{text:'🔗 Anti-Link ON',callback_data:`aria_linkon_${id}`},{text:'🔗 OFF',callback_data:`aria_linkoff_${id}`}],
 [{text:'🤖 Auto-Mod',callback_data:`aria_am_${id}`},{text:'📜 Logs',callback_data:`aria_logs_${id}`}],
 [{text:'✏️ Rename',callback_data:`aria_rename_${id}`}],
 [{text:'⬅️ Groups',callback_data:'aria_groups'}]
]}})};
 const moderation=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);return send(chat,'🛡 <b>Moderation Center</b>\n\nUse the natural-language controller or choose a group first.\n\nExamples:\n• <code>Aria, mute 123456 for 30m in Zuno</code>\n• <code>Aria, ban 123456 in Zuno</code>\n• <code>Aria, warn 123456 in Zuno</code>\n• <code>Aria, unmute 123456 in Zuno</code>',{reply_markup:menu()})};
 const statsPage=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const s=stats.getSummary(), a=analytics.summary();return send(chat,`📊 <b>Miss Aria Analytics</b>\n\n👤 Total users: <b>${s.totalUniqueUsers}</b>\n🟢 Active today: <b>${s.activeToday}</b>\n📅 Active 7d: <b>${s.active7d}</b>\n💬 Messages: <b>${s.totalMessages}</b>\n📨 Messages today: <b>${a.messagesToday}</b>\n👥 Users today: <b>${a.usersToday}</b>\n⏱ Uptime: <b>${fmt(process.uptime())}</b>\n💾 RSS: <b>${Math.round(process.memoryUsage().rss/1024/1024)} MB</b>\n\n🔥 <b>Top commands</b>\n${s.topCommands.slice(0,8).map(x=>`• ${esc(x[0])}: ${x[1]}`).join('\n')||'None'}\n\n🏆 <b>Groups</b>\n${a.groups.slice(0,8).map(x=>`• ${esc(x.title)} — ${x.messages} msgs / ${x.uniqueUsers} users`).join('\n')||'None'}`)};
 const diagnostics=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const gs=await knownGroups(user);let online=false;try{await bot.getMe();online=true}catch{}const active=scheduler.listTasks(user).filter(t=>t.status==='active').length;return send(chat,`🔧 <b>Diagnostics</b>\n\nTelegram API: ${online?'🟢 Online':'🔴 Offline'}\nNode: ${process.version}\nPlatform: ${process.platform}\nCPU: ${os.cpus().length} cores\nMemory: ${Math.round(process.memoryUsage().rss/1024/1024)} MB\nUptime: ${fmt(process.uptime())}\nVerified groups: ${gs.length}\nActive tasks: ${active}\nScheduler: 🟢 Running\nTool registry: 🟢 ${registry.names.length} allow-listed tools\nRaw Telegram HTTP: 🔒 Not used by owner center\nShell/eval/arbitrary dispatch: 🔒 Disabled`)};
 const tasks=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const ts=scheduler.listTasks(user);if(!ts.length)return send(chat,'⏰ <b>No scheduled tasks</b>');return send(chat,'⏰ <b>Scheduler v2</b>\n\n'+ts.slice(0,25).map(t=>`• <code>${t.id}</code> — ${esc(t.action)} — <b>${esc(t.status)}</b> — ${esc(t.timezone||'UTC')}`).join('\n'),{reply_markup:{inline_keyboard:ts.slice(0,20).map(t=>[{text:`${t.status==='active'?'🟢':'⚪'} ${t.action} ${t.id}`,callback_data:`aria_task_${t.id}`}])}})};
 const auditPage=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const rows=(state.ariaAudit||[]).slice(-30).reverse();return send(chat,'📜 <b>Audit Log</b>\n\n'+(rows.map(x=>`• ${esc(x.at)} — <b>${esc(x.action)}</b> — ${esc(x.target||'')}${x.detail?` — ${esc(x.detail)}`:''}`).join('\n')||'No audit events yet.'))};
 const autoPage=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);return send(chat,'🤖 <b>Auto-Moderation</b>\n\nPer-group controls:\n• link detection\n• blacklist detection\n• excessive caps\n• flood detection\n• delete / delete+warn / temporary mute\n\nUse <code>Aria, enable auto-mod in Zuno</code>.')};
 const security=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);return send(chat,`🔐 <b>Security Center</b>\n\nOwner ID locked: <code>${esc(ownerId||'not configured')}</code>\nOwner-only tools: 🟢\nConfirmation tokens: 🟢 60s / one-time\nAudit trail: 🟢\nAllow-listed Telegram tools: <b>${registry.names.length}</b>\nArbitrary shell: 🔒\nArbitrary JS: 🔒\nArbitrary filesystem: 🔒\n\nDestructive actions require confirmation.`)};
 const emergency=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const on=!!state.ariaEmergencyMode;return send(chat,`🚨 <b>Emergency Mode</b>\n\nCurrent state: ${on?'🔴 ACTIVE':'🟢 NORMAL'}\n\nEmergency mode locks verified admin groups through Telegram chat permissions.`,{reply_markup:{inline_keyboard:[[ {text:on?'🟢 Disable Emergency':'🔴 Activate Emergency',callback_data:on?'aria_emergency_off':'aria_emergency_on'} ]]}})};
 const backupPage=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const bs=backupApi.list(user);return send(chat,'💾 <b>Backup & Recovery</b>\n\n'+(bs.length?bs.slice(0,8).map(b=>`• <code>${esc(b.file)}</code> — ${Math.round(b.bytes/1024)} KB`).join('\n'):'No backups yet.'),{reply_markup:{inline_keyboard:[[ {text:'💾 Create Backup',callback_data:'aria_backup_create'} ],...bs.slice(0,5).map(b=>[{text:`♻️ Restore ${b.file.slice(5,17)}`,callback_data:`aria_restore_${encodeURIComponent(b.file)}`}]) ]}})};
 const memoryPage=async(chat,user)=>{if(!ownerOnly(user))return denied(chat);const notes=memory.list(user);return send(chat,'🧠 <b>Aria Memory</b>\n\n'+(notes.map(n=>`• <code>${n.id}</code> — ${esc(n.text)}`).join('\n')||'No owner memories saved.')+'\n\nSay: <code>Aria, remember that ...</code>')};

 function confirm(chat,user,action,payload,label){const token=confirmations.create({ownerId:user,action,payload});return send(chat,`⚠️ <b>Confirmation required</b>\n\n${esc(label)}`,{reply_markup:{inline_keyboard:[[ {text:'✅ Confirm',callback_data:`aria_confirm_${token}`},{text:'❌ Cancel',callback_data:'aria_cancel_confirm'} ]]}})}
 async function executeConfirmed(chat,user,token){const c=confirmations.consume(token,user);if(!c)return send(chat,'⌛ Confirmation expired or already used.');if(c.action==='restart'){audit({action:'restart',target:'process'});return send(chat,'♻️ Restarting Miss Aria…').then(()=>setTimeout(()=>process.exit(0),300))}if(c.action==='emergency'){const r=await registry.execute('emergencyLockdown',{userId:user,enabled:c.payload.enabled});audit({action:'emergency',target:'all-verified-groups',detail:String(c.payload.enabled)});return send(chat,r.success?`🚨 Emergency mode ${c.payload.enabled?'ACTIVE':'DISABLED'}.\nSuccessful groups: ${r.data.results.filter(x=>x.success).length}/${r.data.results.length}`:`❌ ${esc(r.error.message)}`)}if(c.action==='ban'){const r=await registry.execute('moderate',{userId:user,...c.payload,action:'ban'});audit({action:'ban',target:`${c.payload.chatId}:${c.payload.targetUserId}`,detail:c.payload.reason||''});return send(chat,r.success?'🔨 Ban completed.':`❌ ${esc(r.error.message)}`)}if(c.action==='restore'){const r=backupApi.restore(user,c.payload.file);audit({action:'restore',target:c.payload.file});return send(chat,r.success?'♻️ Backup restored. Restart the bot to fully reload every in-memory component.':`❌ ${esc(r.error)}`)}if(c.action==='lock'||c.action==='unlock'){const r=await registry.execute('lockGroup',{userId:user,chatId:c.payload.chatId,locked:c.action==='lock'});audit({action:c.action,target:String(c.payload.chatId)});return send(chat,r.success?`✅ Group ${c.action==='lock'?'locked':'unlocked'}.`:`❌ ${esc(r.error.message)}`)}return send(chat,'❌ Unknown confirmation.');}

 bot.onText(/^\/(?:aria|owner|menu)$/i,m=>ownerOnly(m.from.id)?send(m.chat.id,'🌸 <b>MISS ARIA — TELEGRAM OWNER COMMAND CENTER</b>\n\nAI control • groups • moderation • scheduler • analytics • security', {reply_markup:menu()}):denied(m.chat.id));
 bot.onText(/^\/status$/i,m=>ownerOnly(m.from.id)?send(m.chat.id,'🌸 <b>Miss Aria</b> 🟢 ONLINE\nTelegram tools: 🟢\nScheduler: 🟢\nAuto-Mod: 🟢'):denied(m.chat.id));
 bot.onText(/^\/groups$/i,m=>groups(m.chat.id,m.from.id));
 bot.onText(/^\/tasks$/i,m=>tasks(m.chat.id,m.from.id));
 bot.onText(/^\/diagnostics$/i,m=>diagnostics(m.chat.id,m.from.id));
 bot.onText(/^\/stats$/i,m=>statsPage(m.chat.id,m.from.id));
 bot.onText(/^\/help$/i,m=>send(m.chat.id,'<b>🌸 MISS ARIA OWNER CENTER</b>\n\n/aria — open control center\n/groups — verified groups\n/tasks — scheduler\n/stats — analytics\n/diagnostics — system health\n/restart — restart with confirmation\n\nNatural language is supported for group management, moderation, messaging, tasks, auto-mod, emergency mode and memory.',{reply_markup:menu()}));
 bot.onText(/^\/restart$/i,m=>ownerOnly(m.from.id)?confirm(m.chat.id,m.from.id,'restart',{},'Restart the current Node.js process?'):denied(m.chat.id));

 bot.on('callback_query',async q=>{const d=String(q.data||'');if(!d.startsWith('aria_'))return;await bot.answerCallbackQuery(q.id).catch(()=>{});const user=q.from.id,chat=q.message?.chat?.id||user;if(!ownerOnly(user))return denied(chat);try{
  if(d==='aria_groups')return groups(chat,user);if(d==='aria_moderation')return moderation(chat,user);if(d==='aria_tasks')return tasks(chat,user);if(d==='aria_stats')return statsPage(chat,user);if(d==='aria_diag')return diagnostics(chat,user);if(d==='aria_audit')return auditPage(chat,user);if(d==='aria_automod')return autoPage(chat,user);if(d==='aria_security')return security(chat,user);if(d==='aria_emergency')return emergency(chat,user);if(d==='aria_backup')return backupPage(chat,user);if(d==='aria_memory')return memoryPage(chat,user);
  if(d==='aria_ai')return send(chat,`🧠 <b>AI Control Engine</b>\n\nIntent → permission → confirmation → Telegram tool → result verification → audit.\n\nAvailable tools: <b>${registry.names.length}</b>\nNo eval. No shell. No arbitrary Telegram method dispatch.`);
  if(d==='aria_message')return send(chat,'📨 <b>Messaging</b>\n\nUse: <code>Aria, send "hello" to Zuno</code>\nThe target is resolved from your verified Telegram admin groups.');
  if(d==='aria_help')return send(chat,'Use natural language such as:\n• <code>Aria, lock Zuno</code>\n• <code>Aria, turn anti-link on in Zuno</code>\n• <code>Aria, enable auto-mod in Zuno</code>\n• <code>Aria, mute 123456 for 30m in Zuno</code>\n• <code>Aria, send "hello" to Zuno</code>\n• <code>Aria, schedule a message tomorrow at 9 AM saying "hello" to Zuno</code>\n• <code>Aria, remember that my default group is Zuno</code>\n• <code>Aria, lock every group</code>',{reply_markup:menu()});
  if(d==='aria_cancel_confirm')return send(chat,'❌ Cancelled.');
  if(d.startsWith('aria_confirm_'))return executeConfirmed(chat,user,d.slice('aria_confirm_'.length));
  if(d.startsWith('aria_manage_'))return groupPanel(chat,user,d.slice('aria_manage_'.length));
  if(d.startsWith('aria_lock_'))return doAction(chat,user,d.slice(10),'lock');
  if(d.startsWith('aria_unlock_'))return doAction(chat,user,d.slice(12),'unlock');
  if(d.startsWith('aria_linkon_'))return doAction(chat,user,d.slice(12),'linkon');
  if(d.startsWith('aria_linkoff_'))return doAction(chat,user,d.slice(13),'linkoff');
  if(d.startsWith('aria_admins_')){const r=await registry.execute('groupAdmins',{userId:user,chatId:d.slice(12)});return send(chat,r.success?'👑 <b>Admins</b>\n\n'+r.data.map(a=>`• ${esc(a.name||a.username||a.id)} — <code>${a.id}</code>`).join('\n'):`❌ ${esc(r.error.message)}`)}
  if(d.startsWith('aria_logs_')){const id=d.slice(10);const logs=state.modLogs?.[String(id)]||[];return send(chat,'📜 <b>Group Logs</b>\n\n'+(logs.slice(-25).reverse().map(x=>`• ${esc(x.action)} — ${esc(x.target||'')} — ${esc(x.reason||'')}`).join('\n')||'No moderation logs.'))}
  if(d.startsWith('aria_gmod_'))return send(chat,'🛡 Use natural language moderation with the selected group ID or group name.');
  if(d.startsWith('aria_am_'))return send(chat,'🤖 Configure auto-mod with natural language, e.g. <code>Aria, enable auto-mod in Zuno</code>.');
  if(d.startsWith('aria_task_'))return taskPanel(chat,user,d.slice(10));
  if(d==='aria_backup_create'){const r=backupApi.create(user);return send(chat,r.success?`💾 Backup created: <code>${esc(r.file)}</code>\nSize: ${Math.round(r.bytes/1024)} KB`:`❌ ${esc(r.error)}`)}
  if(d.startsWith('aria_restore_'))return confirm(chat,user,'restore',{file:decodeURIComponent(d.slice(13))},`Restore backup <code>${esc(decodeURIComponent(d.slice(13)))}</code>?`);
  if(d==='aria_emergency_on')return confirm(chat,user,'emergency',{enabled:true},'Lock every verified admin group now?');
  if(d==='aria_emergency_off')return confirm(chat,user,'emergency',{enabled:false},'Disable emergency lockdown for every verified admin group?');
 }catch(e){return send(chat,`❌ ${esc(e.message||e)}`)}});

 async function doAction(chat,user,id,action){
  if(action==='lock'||action==='unlock')return confirm(chat,user,action,{chatId:id},`${action==='lock'?'Lock':'Unlock'} this group?`).then(async()=>{});
  const enabled=action==='linkon';const r=await registry.execute('antiLink',{userId:user,chatId:id,enabled});audit({action:'antiLink',target:String(id),detail:String(enabled)});return send(chat,r.success?`🔗 Anti-link ${enabled?'ON':'OFF'}.`:`❌ ${esc(r.error.message)}`);
 }
 // Confirmed lock/unlock is handled by extending executeConfirmed without exposing arbitrary actions.
 const oldExecuteConfirmed=executeConfirmed;
 // Natural-language engine lives below; callback lock/unlock is intentionally handled directly here with confirmation tokens.
 function taskPanel(chat,user,id){const t=scheduler.getTask(id);if(!t||t.ownerJid!==String(user))return send(chat,'❌ Task not found.');return send(chat,`⏰ <b>Task ${esc(t.id)}</b>\nAction: ${esc(t.action)}\nTarget: <code>${esc(t.targetJid)}</code>\nStatus: <b>${esc(t.status)}</b>\nTimezone: ${esc(t.timezone||'UTC')}\nNext: ${t.nextRunAt?new Date(t.nextRunAt).toLocaleString():'—'}`,{reply_markup:{inline_keyboard:[[{text:'▶️ Run now',callback_data:`aria_run_${t.id}`}],[{text:t.status==='active'?'⏸ Pause':'▶️ Resume',callback_data:`aria_toggle_${t.id}`}],[{text:'🗑 Cancel',callback_data:`aria_cancel_task_${t.id}`}],[{text:'📜 History',callback_data:`aria_history_${t.id}`}]]}})}
 bot.on('callback_query',async q=>{const d=String(q.data||'');if(!d.startsWith('aria_'))return;const user=q.from.id,chat=q.message?.chat?.id||user;if(!ownerOnly(user))return;if(d.startsWith('aria_run_')){const r=await scheduler.runNow(d.slice(9),user);return send(chat,r.success?'▶️ Task executed.':`❌ ${esc(r.error.message)}`)}if(d.startsWith('aria_toggle_')){const id=d.slice(12),t=scheduler.getTask(id);if(!t)return send(chat,'❌ Task not found.');const r=t.status==='active'?scheduler.pauseTask(id,user):scheduler.resumeTask(id,user);return send(chat,r.success?`✅ Task ${r.data.status}.`:`❌ ${esc(r.error.message)}`)}if(d.startsWith('aria_cancel_task_')){const r=scheduler.cancelTask(d.slice(17),user);return send(chat,r.success?'🗑 Task cancelled.':`❌ ${esc(r.error.message)}`)}if(d.startsWith('aria_history_')){const h=scheduler.history(d.slice(13),user);return send(chat,'📜 <b>Task History</b>\n\n'+(h.map(x=>`• ${new Date(x.at).toLocaleString()} — ${x.ok?'✅':'❌'}${x.manual?' — manual':''}${x.error?` — ${esc(x.error)}`:''}`).join('\n')||'No history.'))}if(d.startsWith('aria_retry_')){const r=await scheduler.runNow(d.slice(11),user);return send(chat,r.success?'🔁 Task retry executed.':`❌ ${esc(r.error.message)}`)}});

 bot.on('message',async m=>{
  if(!m?.text||!ownerOnly(m.from?.id))return;
  const raw=m.text.replace(/^@\w+\s*/,'').trim();
  if(/^\/(aria|owner|menu|status|groups|tasks|diagnostics|stats|help|restart)\b/i.test(raw))return;
  const text=raw.replace(/^aria[,:\s-]*/i,'').trim();if(!text)return;
  const user=m.from.id,chat=m.chat.id;
  try{
   // Keep a small Telegram username directory from messages the bot actually sees.
   // This lets the natural-language controller resolve @user safely without scraping Telegram.
   state.ariaUserDirectory = state.ariaUserDirectory || {};
   if (m.from?.id) state.ariaUserDirectory[String(m.from.id)] = { id: m.from.id, username: m.from.username || null, name: [m.from.first_name,m.from.last_name].filter(Boolean).join(' ') };
   const intent=aiIntent.parse(text);
   if(intent){
    if(intent.type==='groups') return groups(chat,user);
    if(intent.type==='tasks') return tasks(chat,user);
    if(intent.type==='diagnostics') return diagnostics(chat,user);
    if(intent.type==='stats') return statsPage(chat,user);
    if(intent.type==='audit') return auditPage(chat,user);
    if(intent.type==='memory') return memoryPage(chat,user);
    if(intent.type==='backup'){const r=backupApi.create(user);return send(chat,r.success?`💾 Backup created: <code>${esc(r.file)}</code>`:`❌ ${esc(r.error)}`)}
    if(intent.type==='memoryAdd'){const r=memory.add(user,intent.text);return send(chat,r.success?'🧠 Saved to Aria memory.':`❌ ${esc(r.error)}`)}
    if(intent.type==='sendMessage'){const gs=await findOneGroup(user,intent.group);if(!gs)return send(chat,'❌ I could not uniquely resolve that Telegram group. Try <code>Aria, show my groups</code>.');const r=await registry.execute('sendMessage',{userId:user,chatId:gs.id,text:intent.text});audit({action:'sendMessage',target:String(gs.id)});return send(chat,r.success?`📨 Sent to <b>${esc(gs.title)}</b>.`:`❌ ${esc(r.error.message)}`)}
    if(intent.type==='groupPermission'){const gs=await findOneGroup(user,intent.group);if(!gs)return send(chat,'❌ I could not uniquely resolve that Telegram group.');return confirm(chat,user,intent.action,{chatId:gs.id},`${intent.action.toUpperCase()} <b>${esc(gs.title)}</b>?`)}
    if(intent.type==='antiLink'){const gs=await findOneGroup(user,intent.group);if(!gs)return send(chat,'❌ I could not uniquely resolve that Telegram group.');const r=await registry.execute('antiLink',{userId:user,chatId:gs.id,enabled:intent.enabled});audit({action:'antiLink',target:String(gs.id),detail:String(intent.enabled)});return send(chat,r.success?`🔗 Anti-link ${intent.enabled?'ON':'OFF'} in <b>${esc(gs.title)}</b>.`:`❌ ${esc(r.error.message)}`)}
    if(intent.type==='autoMod'){const gs=await findOneGroup(user,intent.group);if(!gs)return send(chat,'❌ I could not uniquely resolve that Telegram group.');const r=autoMod.configure(user,gs.id,{enabled:intent.enabled});audit({action:'autoMod',target:String(gs.id),detail:String(intent.enabled)});return send(chat,r.success?`🤖 Auto-Mod ${intent.enabled?'ON':'OFF'} in <b>${esc(gs.title)}</b>.`:`❌ ${esc(r.error)}`)}
    if(intent.type==='emergency') return confirm(chat,user,'emergency',{enabled:intent.enabled},`${intent.enabled?'Lock':'Unlock'} every verified admin group?`);
    if(intent.type==='restart') return confirm(chat,user,'restart',{},'Restart the current Node.js process?');
    if(intent.type==='moderation'){
      const gs=await findOneGroup(user,intent.group); if(!gs)return send(chat,'❌ I could not uniquely resolve that Telegram group.');
      let targetId=String(intent.target).replace(/^@/,'');
      if(/^\d+$/.test(targetId)) targetId=Number(targetId);
      else {
       const hit=Object.values(state.ariaUserDirectory||{}).find(x=>String(x.username||'').toLowerCase()===String(targetId).toLowerCase());
       if(!hit)return send(chat,`👤 I found the group <b>${esc(gs.title)}</b>, but I do not have a verified Telegram ID for <b>@${esc(targetId)}</b>. Ask the user to send a message in a chat Aria can see, or use their numeric Telegram ID.`);
       targetId=hit.id;
      }
      const action=intent.action==='remove'?'kick':intent.action;
      const label=`${action.toUpperCase()} <code>${esc(targetId)}</code> in <b>${esc(gs.title)}</b>${intent.reason?`
Reason: ${esc(intent.reason)}`:''}${intent.durationMs?`
Duration: ${Math.round(intent.durationMs/60000)} minutes`:''}`;
      if(['ban','kick'].includes(action)) return confirm(chat,user,action,{chatId:gs.id,targetUserId:Number(targetId),reason:intent.reason||'AI moderation request',durationMs:intent.durationMs},label+'\n\nAI recommendation requires your confirmation.');
      const tool=action==='warn'?'warn':'moderate';
      const r=tool==='warn'?await registry.execute('warn',{userId:user,chatId:gs.id,targetUserId:Number(targetId),reason:intent.reason}):await registry.execute('moderate',{userId:user,chatId:gs.id,targetUserId:Number(targetId),action,durationMs:intent.durationMs,reason:intent.reason});
      audit({action,target:`${gs.id}:${targetId}`,detail:intent.reason||''});
      return send(chat,r.success?`🤖 <b>AI control action completed</b>

${label}`:`❌ ${esc(r.error.message)}`);
    }
   }

   if(/^(?:list|show) (?:my )?groups$/i.test(text))return groups(chat,user);
   if(/^(?:show|list) (?:my )?(?:tasks|reminders)$/i.test(text))return tasks(chat,user);
   if(/^(?:run )?diagnostics$/i.test(text))return diagnostics(chat,user);
   if(/^show (?:the )?audit$/i.test(text))return auditPage(chat,user);
   if(/^show (?:my )?memory$/i.test(text))return memoryPage(chat,user);
   let mm=text.match(/^send\s+["“](.+?)["”]\s+to\s+(.+)$/i);if(mm){const gs=await findOneGroup(user,mm[2]);if(!gs)return send(chat,'❌ Group not found.');const r=await registry.execute('sendMessage',{userId:user,chatId:gs.id,text:mm[1]});audit({action:'sendMessage',target:String(gs.id)});return send(chat,r.success?`📨 Sent to <b>${esc(gs.title)}</b>.`:`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^(lock|unlock)\s+(.+)$/i);if(mm){const gs=await findOneGroup(user,mm[2]);if(!gs)return send(chat,'❌ Group not found.');return confirm(chat,user,mm[1].toLowerCase(),{chatId:gs.id},`${mm[1].toUpperCase()} <b>${esc(gs.title)}</b>?`)}
   mm=text.match(/^turn\s+anti[- ]link\s+(on|off)\s+in\s+(.+)$/i);if(mm){const gs=await findOneGroup(user,mm[2]);if(!gs)return send(chat,'❌ Group not found.');const r=await registry.execute('antiLink',{userId:user,chatId:gs.id,enabled:mm[1].toLowerCase()==='on'});audit({action:'antiLink',target:String(gs.id),detail:mm[1]});return send(chat,r.success?`🔗 Anti-link ${mm[1].toUpperCase()} in <b>${esc(gs.title)}</b>.`:`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^(?:enable|disable|turn on|turn off)\s+auto[- ]mod\s+in\s+(.+)$/i);if(mm){const enable=!/^disable|turn off/i.test(text);const gs=await findOneGroup(user,mm[1]);if(!gs)return send(chat,'❌ Group not found.');const r=autoMod.configure(user,gs.id,{enabled:enable});audit({action:'autoMod',target:String(gs.id),detail:String(enable)});return send(chat,r.success?`🤖 Auto-Mod ${enable?'ON':'OFF'} in <b>${esc(gs.title)}</b>.`:`❌ ${esc(r.error)}`)}
   mm=text.match(/^auto[- ]mod\s+(delete|delete_warn|mute)\s+in\s+(.+)$/i);if(mm){const gs=await findOneGroup(user,mm[2]);if(!gs)return send(chat,'❌ Group not found.');autoMod.configure(user,gs.id,{enabled:true,action:mm[1]});return send(chat,`🤖 Auto-Mod action set to <b>${esc(mm[1])}</b> in <b>${esc(gs.title)}</b>.`)}
   mm=text.match(/^(promote|demote)\s+(\d+)\s+(?:in|@)\s+(.+)$/i);if(mm){const gs=await findOneGroup(user,mm[3]);if(!gs)return send(chat,'❌ Group not found.');const r=await registry.execute('setAdminRole',{userId:user,chatId:gs.id,targetUserId:Number(mm[2]),promoted:mm[1].toLowerCase()==='promote'});audit({action:mm[1],target:`${gs.id}:${mm[2]}`});return send(chat,r.success?`👑 ${mm[1]} completed for <code>${mm[2]}</code>.`:`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^rename\s+(.+?)\s+to\s+["“](.+?)["”]$/i);if(mm){const gs=await findOneGroup(user,mm[1]);if(!gs)return send(chat,'❌ Group not found.');const r=await registry.execute('updateGroupTitle',{userId:user,chatId:gs.id,title:mm[2]});return send(chat,r.success?`✏️ Renamed group to <b>${esc(mm[2])}</b>.`:`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^edit\s+task\s+([a-f0-9]+)\s+(?:saying|message|text)\s+["“](.+?)["”]$/i);if(mm){const t=scheduler.getTask(mm[1]);if(!t||t.ownerJid!==String(user))return send(chat,'❌ Task not found.');const r=scheduler.updateTask(mm[1],user,{payload:{...t.payload,text:mm[2]}});return send(chat,r.success?'✏️ Task updated.':`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^(mute|unmute|warn|ban|kick|unban)\s+(\d+)\s*(?:for\s+(\d+\s*(?:m|min|h|hr|d|day|days)))?\s*(?:in|@)\s+(.+?)(?:\s+because\s+(.+))?$/i);if(mm){const action=mm[1].toLowerCase(),targetUserId=Number(mm[2]),duration=parseDur(mm[3]);const gs=await findOneGroup(user,mm[4]);if(!gs)return send(chat,'❌ Group not found.');if(action==='ban')return confirm(chat,user,'ban',{chatId:gs.id,targetUserId,reason:mm[5]||'Owner moderation',durationMs:duration},`Ban <code>${targetUserId}</code> from <b>${esc(gs.title)}</b>?`);const toolAction=action==='kick'?'kick':action==='warn'?'warn':action;const r=action==='warn'?await registry.execute('warn',{userId:user,chatId:gs.id,targetUserId,reason:mm[5]}):await registry.execute('moderate',{userId:user,chatId:gs.id,targetUserId,action:toolAction,durationMs:duration,reason:mm[5]});audit({action,target:`${gs.id}:${targetUserId}`,detail:mm[5]||''});return send(chat,r.success?`✅ ${action} completed for <code>${targetUserId}</code>.`:`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^schedule\s+(?:a\s+)?(?:message|reminder|task)\s+(tomorrow\s+)?at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+(?:saying|message|text)\s+["“](.+?)["”](?:\s+to\s+(.+))?$/i);if(mm){let h=Number(mm[2]),mi=Number(mm[3]||0);const ap=(mm[4]||'').toLowerCase();if(ap==='pm'&&h<12)h+=12;if(ap==='am'&&h===12)h=0;const gs=mm[6]?await findOneGroup(user,mm[6]):null;const target=gs?gs.id:String(chat);const run=new Date();if(mm[1])run.setDate(run.getDate()+1);run.setHours(h,mi,0,0);if(run.getTime()<=Date.now())run.setDate(run.getDate()+1);const r=scheduler.createTask({ownerJid:String(user),targetJid:target,action:'sendMessage',payload:{text:mm[5]},schedule:{type:'once',runAt:run.toISOString(),timezone:process.env.TZ||'UTC'}});return send(chat,r.success?`⏰ Scheduled <code>${r.data.id}</code> for ${run.toLocaleString()}.`:`❌ ${esc(r.error.message)}`)}
   mm=text.match(/^remember(?:\s+that)?\s+(.+)$/i);if(mm){const r=memory.add(user,mm[1]);return send(chat,r.success?'🧠 Saved to Aria memory.':`❌ ${esc(r.error)}`)}
   if(/^lock every group$/i.test(text))return confirm(chat,user,'emergency',{enabled:true},'Lock every verified admin group?');
   if(/^unlock every group$/i.test(text))return confirm(chat,user,'emergency',{enabled:false},'Unlock every verified admin group?');
   if(/^restart|reboot$/i.test(text))return confirm(chat,user,'restart',{},'Restart the current Node.js process?');
   if(/^create (?:a )?backup$/i.test(text)){const r=backupApi.create(user);return send(chat,r.success?`💾 Backup created: <code>${esc(r.file)}</code>`:`❌ ${esc(r.error)}`)}
   return send(chat,'🧠 I can control Telegram groups, moderation, messages, tasks, auto-mod, analytics, security, backups and memory. Try <code>Aria, help</code>.');
  }catch(e){return send(chat,`❌ ${esc(e.message||e)}`)}
 });
 async function findOneGroup(user,phrase){const q=String(phrase||'').toLowerCase().replace(/^@/,'').trim();const gs=await knownGroups(user);const exact=gs.find(c=>String(c.title||'').toLowerCase()===q||String(c.username||'').toLowerCase()===q);if(exact)return exact;const matches=gs.filter(c=>String(c.title||'').toLowerCase().includes(q));return matches.length===1?matches[0]:null}
 function parseDur(s){if(!s)return null;const m=String(s).match(/(\d+)\s*(m|min|h|hr|d|day|days)/i);if(!m)return null;const n=Number(m[1]),u=m[2].toLowerCase();return u.startsWith('m')?n*60000:u.startsWith('h')?n*3600000:n*86400000}
}
module.exports={setup};
