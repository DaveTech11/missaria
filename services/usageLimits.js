const fs = require('fs');
const path = require('path');
const FILE = path.join(process.cwd(), 'data', 'usage-limits.json');
const NORMAL_LIMITS = { messages: 30, agent: 5, images: 3, coding: 2 };
function load(){ try{return JSON.parse(fs.readFileSync(FILE,'utf8'));}catch{return {};}}
function save(db){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(db,null,2));}
function day(){return new Date().toISOString().slice(0,10)}
function isPremium(ctx,id){return !!(ctx.isPremiumActive?.(id)||ctx.getPlan?.(id)==='premium'||ctx.isBotAdmin?.(id));}
function check(ctx,id,type){if(isPremium(ctx,id))return {allowed:true,premium:true,used:0,limit:null,remaining:null};const db=load();const row=db[id]||{date:day(),messages:0,agent:0,images:0,coding:0};if(row.date!==day())Object.assign(row,{date:day(),messages:0,agent:0,images:0,coding:0});const limit=NORMAL_LIMITS[type]??30;const used=row[type]||0;if(used>=limit)return {allowed:false,premium:false,used,limit,remaining:0};row[type]=used+1;db[id]=row;save(db);return {allowed:true,premium:false,used:used+1,limit,remaining:limit-used-1};}
function status(ctx,id){if(isPremium(ctx,id))return {premium:true,limits:NORMAL_LIMITS};const db=load();const r=db[id]||{};return {premium:false,limits:NORMAL_LIMITS,used:Object.fromEntries(Object.keys(NORMAL_LIMITS).map(k=>[k,r[k]||0]))};}
module.exports={NORMAL_LIMITS,check,status,isPremium};
