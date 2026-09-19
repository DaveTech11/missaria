"use strict";
const fs=require("fs"),path=require("path");
const FILE=path.join(process.cwd(),"data","aria-user-stats.json");
function load(){try{return JSON.parse(fs.readFileSync(FILE,"utf8")||"{}")}catch{return {}}}
function save(db){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(db,null,2),"utf8")}
function get(id){const db=load(),k=String(id);return db[k]||{messages:0,commands:0,days:[],firstSeen:new Date().toISOString()}}
function touch(id,type="messages"){const db=load(),k=String(id),u=db[k]||{messages:0,commands:0,days:[],firstSeen:new Date().toISOString()};u[type]=(u[type]||0)+1;const d=new Date().toISOString().slice(0,10);if(!u.days.includes(d))u.days.push(d);u.days=u.days.slice(-365);db[k]=u;save(db);return u}
function streak(id){const u=get(id),set=new Set(u.days||[]),now=new Date();let n=0;for(let i=0;i<365;i++){const d=new Date(now);d.setDate(now.getDate()-i);const key=d.toISOString().slice(0,10);if(set.has(key))n++;else if(i>0)break;}return n}
module.exports={get,touch,streak};
