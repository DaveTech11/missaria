'use strict';

const fs = require('fs');
const path = require('path');

const CODING_UNLOCK_POINTS = 100;
const CODING_UNLOCK_DURATION_MS = 5 * 60 * 60 * 1000;
const FILE = path.join(__dirname, '..', 'data', 'coding-access.json');

function load() {
  try {
    if (!fs.existsSync(FILE)) return { users: {} };
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return data && data.users ? data : { users: {} };
  } catch { return { users: {} }; }
}
function save(db) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}
function getUnlock(userId) {
  const db = load();
  return Number(db.users[String(userId)] || 0);
}
function isCodingUnlocked(userId) { return getUnlock(userId) > Date.now(); }
function getRemainingMs(userId) { return Math.max(0, getUnlock(userId) - Date.now()); }
function unlockCoding(userId, spendPoints) {
  if (typeof spendPoints !== 'function') return { ok:false, reason:'Points service unavailable.' };
  const result = spendPoints(userId, CODING_UNLOCK_POINTS);
  if (!result.ok) return result;
  const db = load();
  const now = Date.now();
  const base = Math.max(now, Number(db.users[String(userId)] || 0));
  db.users[String(userId)] = base + CODING_UNLOCK_DURATION_MS;
  save(db);
  return { ok:true, expiresAt:db.users[String(userId)], pointsSpent:CODING_UNLOCK_POINTS, durationMs:CODING_UNLOCK_DURATION_MS };
}
module.exports = { CODING_UNLOCK_POINTS, CODING_UNLOCK_DURATION_MS, getUnlock, isCodingUnlocked, getRemainingMs, unlockCoding };
