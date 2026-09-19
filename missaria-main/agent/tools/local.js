'use strict';
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

function safeRoot(ctx) { return path.resolve(ctx.AGENT_WORKSPACE || process.env.ARIA_AGENT_WORKSPACE || process.cwd()); }
function safePath(ctx, p) {
  const root = safeRoot(ctx); const target = path.resolve(root, String(p || '.'));
  if (target !== root && !target.startsWith(root + path.sep)) throw Object.assign(new Error('Path is outside the Aria workspace.'), { code:'PATH_NOT_ALLOWED' });
  return target;
}
function ok(data){return {success:true,data};}
function fail(e){return {success:false,error:{code:e.code||'LOCAL_TOOL_ERROR',message:e.message||String(e)}};}

function createLocalTools(ctx) {
  return {
    workspaceList: async ({ path: p='.' }={}) => { try { const dir=safePath(ctx,p); const items=fs.readdirSync(dir,{withFileTypes:true}).slice(0,200).map(x=>({name:x.name,type:x.isDirectory()?'directory':'file'})); return ok(items); } catch(e){return fail(e);} },
    workspaceRead: async ({ path:p, maxBytes=50000 }={}) => { try { const f=safePath(ctx,p); const st=fs.statSync(f); if(!st.isFile()) throw new Error('Not a file.'); const buf=fs.readFileSync(f); return ok({path:p,content:buf.subarray(0,Math.min(buf.length,Math.max(1,Number(maxBytes)||50000))).toString('utf8'),truncated:buf.length>Number(maxBytes||50000)}); } catch(e){return fail(e);} },
    workspaceWrite: async ({ path:p, content='' }={}) => { try { const f=safePath(ctx,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,String(content),'utf8'); return ok({path:p,bytes:Buffer.byteLength(String(content))}); } catch(e){return fail(e);} },
    workspaceDelete: async ({ path:p }={}) => { try { const f=safePath(ctx,p); if(f===safeRoot(ctx)) throw new Error('Workspace root cannot be deleted.'); fs.rmSync(f,{recursive:true,force:false}); return ok({path:p}); } catch(e){return fail(e);} },
    runCommand: async ({ command, args=[] }={}) => { try { const allowed=new Set(['node','npm','npm.cmd','git','python','python3']); const bin=String(command||'').trim(); if(!allowed.has(bin)) throw Object.assign(new Error('Command is not on the Aria allow-list.'),{code:'COMMAND_NOT_ALLOWED'}); const argv=Array.isArray(args)?args.map(String):[]; if(argv.length>30) throw new Error('Too many command arguments.'); const {stdout,stderr}=await execFileAsync(bin,argv,{cwd:safeRoot(ctx),timeout:60000,maxBuffer:1024*1024,windowsHide:true}); return ok({stdout:stdout.slice(0,50000),stderr:stderr.slice(0,20000)}); } catch(e){return fail(e);} },
  };
}
module.exports={createLocalTools};
