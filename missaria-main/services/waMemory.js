// services/waMemory.js
//
// Persistent per-user (per-JID) chat memory for the WhatsApp side, so
// each contact's conversation survives a bot restart and doesn't start
// fresh every time — until they explicitly ask to clear it ("forget
// everything" / "clear my memory").

const path = require("path");
const PersistentUserHistory = require("../memory/userHistoryStore");

const DATA_FILE = path.join(__dirname, "..", "data", "waUserHistory.json");
const MAX_TURNS = 24; // ~12 exchanges kept per contact, oldest trimmed first

const store = new PersistentUserHistory(DATA_FILE);

function getHistory(jid) {
  return store.get(jid) || [];
}

function appendTurn(jid, role, content) {
  const history = getHistory(jid);
  history.push({ role, content, at: Date.now() });
  while (history.length > MAX_TURNS) history.shift();
  store.set(jid, history);
}

function clearHistory(jid) {
  store.delete(jid);
}

const CLEAR_MEMORY_RE = /\b(clear|forget|reset|wipe)\b[\s\S]{0,20}\bmemory\b/i;

function isClearMemoryRequest(text) {
  return CLEAR_MEMORY_RE.test(String(text || ""));
}

function flushSync() {
  store.flushSync();
}

module.exports = {
  getHistory,
  appendTurn,
  clearHistory,
  isClearMemoryRequest,
  flushSync,
};
