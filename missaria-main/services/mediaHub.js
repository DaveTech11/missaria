'use strict';
const fs=require('fs');
const path=require('path');
const DATA=path.join(__dirname,'..','data','media-hub.json');
function ensure(){fs.mkdirSync(path.dirname(DATA),{recursive:true});if(!fs.existsSync(DATA))fs.writeFileSync(DATA,'{}');}
function load(){ensure();try{return JSON.parse(fs.readFileSync(DATA,'utf8')||'{}')}catch{return {}}}
function save(x){ensure();fs.writeFileSync(DATA,JSON.stringify(x,null,2))}
function user(id){const d=load(),k=String(id);d[k] ||= {history:[],favorites:[],queue:[]};return [d,k]}
function addHistory(id,item){const [d,k]=user(id);d[k].history=[item,...d[k].history.filter(x=>x.key!==item.key)].slice(0,30);save(d)}
function toggleFavorite(id,item){const [d,k]=user(id);const i=d[k].favorites.findIndex(x=>x.key===item.key);if(i>=0){d[k].favorites.splice(i,1);save(d);return false}d[k].favorites.unshift(item);d[k].favorites=d[k].favorites.slice(0,50);save(d);return true}
function favorites(id){return user(id)[0][String(id)].favorites}
function history(id){return user(id)[0][String(id)].history}
function queueAdd(id,item){const [d,k]=user(id);if(!d[k].queue.some(x=>x.key===item.key))d[k].queue.push(item);save(d);return d[k].queue}
function queue(id){return user(id)[0][String(id)].queue}
function clearHistory(id){const [d,k]=user(id);d[k].history=[];save(d)}
module.exports={addHistory,toggleFavorite,favorites,history,queueAdd,queue,clearHistory};
