"use strict";
const fs=require("fs"),path=require("path");
const FILE=path.join(process.cwd(),"data","aria-v16.json");
function load(){try{return JSON.parse(fs.readFileSync(FILE,"utf8")||"{}")}catch{return {}}}
function save(db){fs.mkdirSync(path.dirname(FILE),{recursive:true});fs.writeFileSync(FILE,JSON.stringify(db,null,2),"utf8")}
function user(db,id){const k=String(id);return db[k]||(db[k]={blocked:[],reports:[],favorites:[],achievements:[],updatedAt:new Date().toISOString()})}
function addBlock(id,target){const db=load(),u=user(db,id);if(!u.blocked.includes(String(target)))u.blocked.push(String(target));u.updatedAt=new Date().toISOString();save(db)}
function removeBlock(id,target){const db=load(),u=user(db,id);u.blocked=u.blocked.filter(x=>x!==String(target));u.updatedAt=new Date().toISOString();save(db)}
function blocks(id){return user(load(),id).blocked}
function report(id,target,reason){const db=load(),u=user(db,id);u.reports.unshift({target:String(target),reason:String(reason||"not specified").slice(0,500),at:new Date().toISOString()});u.reports=u.reports.slice(0,50);save(db);return u.reports[0]}
function addFavorite(id,type,value){const db=load(),u=user(db,id);u.favorites.unshift({id:`fav_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,type:String(type),value:String(value||"").slice(0,2000),at:new Date().toISOString()});u.favorites=u.favorites.slice(0,100);save(db);return u.favorites[0]}
function favorites(id){return user(load(),id).favorites}
function removeFavorite(id,favId){const db=load(),u=user(db,id);u.favorites=u.favorites.filter(x=>x.id!==String(favId));save(db)}
module.exports={addBlock,removeBlock,blocks,report,addFavorite,favorites,removeFavorite};
