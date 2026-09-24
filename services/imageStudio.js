'use strict';

const jobs = new Map();
const histories = new Map();
const favorites = new Map();
const running = new Map();

const DEFAULTS = { style: 'realistic', aspect: '1:1', quality: 'standard', variations: 1, enhanced: false, negative: '' };
const ASPECTS = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const QUALITIES = ['standard', 'hd', 'ultra'];

function key(id) { return String(id); }
function state(userId) { return jobs.get(key(userId)) || { ...DEFAULTS }; }
function save(userId, patch) { const next = { ...state(userId), ...patch }; jobs.set(key(userId), next); return next; }
function makePrompt(s) {
  let p = String(s.prompt || '').trim();
  if (s.enhanced) p += ', highly detailed, cinematic composition, professional lighting, crisp focus, polished finish';
  p += `, aspect ratio ${s.aspect}`;
  if (s.quality !== 'standard') p += `, ${s.quality} quality`;
  if (s.negative) p += `, avoid: ${s.negative}`;
  return p;
}
function addHistory(userId, item) {
  const arr = histories.get(key(userId)) || [];
  arr.unshift({ ...item, id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` });
  histories.set(key(userId), arr.slice(0, 20));
  return arr[0];
}
function getHistory(userId) { return histories.get(key(userId)) || []; }
function addFavorite(userId, item) {
  const arr = favorites.get(key(userId)) || [];
  if (!arr.some(x => x.id === item.id)) arr.unshift(item);
  favorites.set(key(userId), arr.slice(0, 20));
}
function getFavorites(userId) { return favorites.get(key(userId)) || []; }
function setRunning(userId, value) { if (value) running.set(key(userId), value); else running.delete(key(userId)); }
function getRunning(userId) { return running.get(key(userId)); }
function cancel(userId) { const r = getRunning(userId); if (r) r.cancelled = true; return Boolean(r); }

module.exports = { ASPECTS, QUALITIES, state, save, makePrompt, addHistory, getHistory, addFavorite, getFavorites, setRunning, getRunning, cancel };
