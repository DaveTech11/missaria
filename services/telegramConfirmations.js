'use strict';
const crypto = require('crypto');
const pending = new Map();
const TTL = 60 * 1000;
function create({ownerId, action, payload = {}}) {
  const token = crypto.randomBytes(9).toString('hex');
  pending.set(token, { ownerId:String(ownerId), action:String(action), payload, expiresAt:Date.now()+TTL });
  setTimeout(() => pending.delete(token), TTL + 1000).unref?.();
  return token;
}
function consume(token, ownerId) {
  const x=pending.get(String(token));
  pending.delete(String(token));
  if(!x || x.expiresAt<Date.now() || x.ownerId!==String(ownerId)) return null;
  return x;
}
module.exports={create,consume,TTL};
