"use strict";
const fs = require("fs");
const path = require("path");
const FILE = path.join(process.cwd(), "data", "aria-chats.json");
function load(){try{return JSON.parse(fs.readFileSync(FILE,"utf8")||"{}")}catch{return {}}}
function save(db){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(db,null,2),"utf8")}
function list(userId){const db=load();return Array.isArray(db[String(userId)])?db[String(userId)]:[]}
function create(userId,title,history=[]){const db=load(),k=String(userId),items=Array.isArray(db[k])?db[k]:[];const item={id:`chat_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,title:String(title||"ᴜɴᴛɪᴛʟᴇᴅ ᴄʜᴀᴛ").slice(0,60),history:Array.isArray(history)?history.slice(-40):[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};items.unshift(item);db[k]=items.slice(0,30);save(db);return item}
function update(userId,id,patch){const db=load(),k=String(userId),item=(db[k]||[]).find(x=>x.id===String(id));if(!item)return null;Object.assign(item,patch,{updatedAt:new Date().toISOString()});save(db);return item}
function remove(userId,id){const db=load(),k=String(userId);db[k]=(db[k]||[]).filter(x=>x.id!==String(id));save(db)}
function get(userId,id){return list(userId).find(x=>x.id===String(id))||null}
module.exports={list,create,update,remove,get};
