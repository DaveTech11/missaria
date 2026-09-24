'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

function ok(data){ return {success:true,data}; }
function fail(code,message){ return {success:false,error:{code,message}}; }
function root(ctx){ return path.resolve(ctx.AGENT_WORKSPACE || process.env.ARIA_AGENT_WORKSPACE || process.cwd()); }
function safe(ctx,p){ const r=root(ctx), t=path.resolve(r,String(p||'.')); if(t!==r&&!t.startsWith(r+path.sep)) throw Object.assign(new Error('Path is outside the Aria workspace.'),{code:'PATH_NOT_ALLOWED'}); return t; }

function createHermesStyleTools(ctx){
  const sessions = new Map();
  const jobs = new Map();

  async function webSearch({query,limit=5}={}){
    try {
      const search = require('../../services/webSearch');
      const r = await search(String(query||''), {maxResults:Math.min(10,Math.max(1,Number(limit)||5)),includeAnswer:true,includeImages:false});
      return ok(r);
    } catch(e){ return fail('WEB_SEARCH_ERROR',e.message); }
  }

  async function webExtract({url,maxChars=30000}={}){
    try {
      const u=new URL(String(url));
      if(!['http:','https:'].includes(u.protocol)) return fail('INVALID_URL','Only HTTP/HTTPS URLs are allowed.');
      const r=await axios.get(u.href,{timeout:30000,maxRedirects:5,headers:{'User-Agent':'Miss-Aria-Agent/1.0'}});
      const html=String(r.data||'');
      const text=html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      return ok({url:u.href,status:r.status,title:(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'',content:text.slice(0,Math.min(100000,Number(maxChars)||30000))});
    } catch(e){ return fail('WEB_EXTRACT_ERROR',e.message); }
  }

  async function imageGenerate({prompt}={}){
    try { const svc=require('../../services/imageGenerator'); const r=await svc.generateImage(prompt); const dir=safe(ctx,'agent-output'); fs.mkdirSync(dir,{recursive:true}); const name=`aria-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.png`; const file=path.join(dir,name); fs.writeFileSync(file,r.image); return ok({path:path.relative(root(ctx),file),engine:r.engine}); }
    catch(e){ return fail('IMAGE_GENERATION_ERROR',e.message); }
  }

  async function createCheckpoint({label='checkpoint'}={}){
    const base=safe(ctx,'.'); const stamp=new Date().toISOString().replace(/[:.]/g,'-'); const out=safe(ctx,path.join('.aria-checkpoints',`${stamp}-${String(label).replace(/[^a-z0-9_-]/gi,'-').slice(0,40)}.json`));
    const manifest=[];
    function walk(dir,rel=''){ for(const ent of fs.readdirSync(dir,{withFileTypes:true})){ if(ent.name==='.git'||ent.name==='.aria-checkpoints'||ent.name==='node_modules') continue; const abs=path.join(dir,ent.name), rr=path.join(rel,ent.name); if(ent.isDirectory()) walk(abs,rr); else { const st=fs.statSync(abs); if(st.size<=2*1024*1024) manifest.push({path:rr,size:st.size,sha256:crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')}); } } }
    walk(base); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,JSON.stringify({label,createdAt:new Date().toISOString(),files:manifest},null,2)); return ok({path:path.relative(base,out),files:manifest.length});
  }

  async function sessionSearch({userId,query,limit=10}={}){
    const list=sessions.get(String(userId))||[]; const q=String(query||'').toLowerCase(); return ok(list.filter(x=>!q||x.content.toLowerCase().includes(q)).slice(-Math.min(50,Number(limit)||10)));
  }
  function rememberSession({userId,role='user',content}={}){ const k=String(userId); const a=sessions.get(k)||[]; a.push({role,content:String(content||''),at:new Date().toISOString()}); sessions.set(k,a.slice(-200)); return ok({stored:true}); }

  async function delegateTask({task,agents=1}={}){
    // Local orchestration placeholder: creates isolated work units rather than pretending a second model exists.
    const count=Math.min(4,Math.max(1,Number(agents)||1)); return ok({delegated:true,units:Array.from({length:count},(_,i)=>({id:`sub-${Date.now()}-${i+1}`,task:String(task||'')})),note:'Subagent execution requires a configured secondary model/provider; these units are ready for a provider-backed worker.'});
  }

  async function mcpDiscover(){ return ok({supported:true,transport:'stdio',env:'ARIA_MCP_SERVERS',note:'Configure MCP servers in JSON; execution is intentionally disabled until each server is explicitly allow-listed.'}); }
  async function gitStatus(){ const {createLocalTools}=require('./local'); return createLocalTools(ctx).runCommand({command:process.platform==='win32'?'git':'git',args:['status','--short','--branch']}); }
  async function gitDiff(){ const {createLocalTools}=require('./local'); return createLocalTools(ctx).runCommand({command:'git',args:['diff','--stat']}); }
  async function gitLog(){ const {createLocalTools}=require('./local'); return createLocalTools(ctx).runCommand({command:'git',args:['log','-8','--oneline']}); }
  async function createTodo({items=[]}={}){ const file=safe(ctx,'.aria-todos.json'); const data={updatedAt:new Date().toISOString(),items:Array.isArray(items)?items.slice(0,50).map((x,i)=>typeof x==='string'?{id:i+1,title:x,status:'pending'}:x):[]}; fs.writeFileSync(file,JSON.stringify(data,null,2)); return ok(data); }
  async function listTodos(){ const f=safe(ctx,'.aria-todos.json'); try{return ok(JSON.parse(fs.readFileSync(f,'utf8')))}catch{return ok({items:[]});} }
  async function systemInfo(){ return ok({platform:process.platform,node:process.version,pid:process.pid,workspace:root(ctx),uptime:process.uptime(),memory:process.memoryUsage()}); }

  return {
    webSearch,webExtract,imageGenerate,createCheckpoint,sessionSearch,rememberSession,delegateTask,mcpDiscover,gitStatus,gitDiff,gitLog,createTodo,listTodos,systemInfo,
    // Explicit capability flags for future provider-backed integrations.
    browserNavigate: async ({url}={})=>{ try { const {createBrowserTools}=require('./browser'); return createBrowserTools().webFetch({url}); }catch(e){return fail('BROWSER_ERROR',e.message);} },
    visionAnalyze: async ({path:p}={})=>{ if(!p)return fail('MISSING_FILE','Image path required.'); const f=safe(ctx,p); if(!fs.existsSync(f))return fail('NOT_FOUND','Image not found.'); return ok({path:p,note:'Vision analysis provider is not configured in this build. The image is available to a provider-backed vision tool.'}); },
    textToSpeech: async ({text}={})=>fail('TTS_PROVIDER_NOT_CONFIGURED','Configure a TTS provider to enable audio generation.'),
    videoAnalyze: async ({path:p}={})=>fail('VIDEO_PROVIDER_NOT_CONFIGURED','Configure a video/vision provider to enable video analysis.'),
    videoGenerate: async ({prompt}={})=>fail('VIDEO_PROVIDER_NOT_CONFIGURED','Configure a video generation provider to enable video generation.'),
    computerUse: async ()=>fail('COMPUTER_USE_NOT_CONFIGURED','Computer-use driver is not configured. Enable it explicitly on a trusted host.'),
    homeAssistant: async ()=>fail('HOME_ASSISTANT_NOT_CONFIGURED','Home Assistant is not connected.'),
    xSearch: async ({query}={})=>fail('X_SEARCH_NOT_CONFIGURED','Configure an X/xAI search provider to enable X search.'),
    sendMessage: async ({chatId,text}={})=>{if(!chatId||!text)return fail('INVALID_MESSAGE','chatId and text are required.'); try{await ctx.bot.sendMessage(chatId,String(text),{parse_mode:'HTML'});return ok({chatId,text:String(text)});}catch(e){return fail('SEND_FAILED',e.message);}},
    systemInfo
  };
}
module.exports={createHermesStyleTools};
