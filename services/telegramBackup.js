'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function safeName(name) { return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100); }
function setup({ state, saveStore, ownerId }) {
  const dir = path.join(__dirname, '..', 'data', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const ownerOnly = id => !!ownerId && String(id) === String(ownerId);

  function create(userId) {
    if (!ownerOnly(userId)) return { success:false, error:'Owner access only.' };
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(dir, `aria-${safeName(stamp)}-${crypto.randomBytes(3).toString('hex')}.json`);
    fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
    return { success:true, file:path.basename(file), path:file, createdAt:Date.now(), bytes:fs.statSync(file).size };
  }
  function list(userId) {
    if (!ownerOnly(userId)) return [];
    return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>({ file:f, bytes:fs.statSync(path.join(dir,f)).size, modifiedAt:fs.statSync(path.join(dir,f)).mtimeMs })).sort((a,b)=>b.modifiedAt-a.modifiedAt).slice(0,20);
  }
  function restore(userId, file) {
    if (!ownerOnly(userId)) return { success:false, error:'Owner access only.' };
    const base = path.basename(String(file));
    const target = path.join(dir, base);
    if (!fs.existsSync(target) || !base.endsWith('.json')) return { success:false, error:'Backup not found.' };
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return { success:false, error:'Backup is invalid.' };
    // Only restore known state containers; never execute anything from backup.
    for (const key of ['users','chatStats','admins','settings','chatSettings','modLogs','ariaAudit','ariaMemory','ariaEmergencyMode','telegramWelcome','ariaAutoMod']) {
      if (Object.prototype.hasOwnProperty.call(parsed,key)) state[key] = parsed[key];
    }
    saveStore();
    return { success:true, file:base };
  }
  return { create, list, restore };
}
module.exports = { setup };
