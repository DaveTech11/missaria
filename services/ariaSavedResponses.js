"use strict";
const fs = require("fs");
const path = require("path");
const FILE = path.join(process.cwd(), "data", "aria-saved-responses.json");
function load(){ try{return JSON.parse(fs.readFileSync(FILE,"utf8")||"{}");}catch{return {};}}
function save(db){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(db,null,2),"utf8");}
function list(id){const db=load();return Array.isArray(db[String(id)])?db[String(id)]:[];}
function add(id,text){const db=load(),k=String(id),items=Array.isArray(db[k])?db[k]:[];items.unshift({id:`${Date.now()}_${Math.random().toString(36).slice(2,8)}`,text:String(text||""),createdAt:new Date().toISOString()});db[k]=items.slice(0,50);save(db);return db[k][0];}
function remove(id,itemId){const db=load(),k=String(id);db[k]=(db[k]||[]).filter(x=>x.id!==String(itemId));save(db);}
function clear(id){const db=load();delete db[String(id)];save(db);}
module.exports={list,add,remove,clear};
