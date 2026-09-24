'use strict';
function setup({state,saveStore,ownerId}){
  state.ariaMemory=state.ariaMemory||{notes:[],preferences:{}};
  const owner=id=>!!ownerId&&String(id)===String(ownerId);
  function add(userId,text){if(!owner(userId))return {success:false,error:'Owner access only.'};const value=String(text||'').trim().slice(0,1000);if(!value)return {success:false,error:'Empty memory.'};state.ariaMemory.notes.push({id:Date.now().toString(36),text:value,createdAt:new Date().toISOString()});state.ariaMemory.notes=state.ariaMemory.notes.slice(-200);saveStore();return {success:true};}
  function list(userId){if(!owner(userId))return [];return state.ariaMemory.notes.slice(-30).reverse();}
  function remove(userId,id){if(!owner(userId))return {success:false,error:'Owner access only.'};const before=state.ariaMemory.notes.length;state.ariaMemory.notes=state.ariaMemory.notes.filter(n=>n.id!==String(id));saveStore();return {success:state.ariaMemory.notes.length!==before};}
  return {add,list,remove};
}
module.exports={setup};
