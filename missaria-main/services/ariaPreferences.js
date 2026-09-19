"use strict";

const fs = require("fs");
const path = require("path");

const DATA = path.join(process.cwd(), "data", "aria-preferences.json");
const VALID_MODES = new Set(["chat", "coding", "research", "creative", "tutor"]);

function ensure() {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, "{}", "utf8");
}
function load() {
  ensure();
  try { return JSON.parse(fs.readFileSync(DATA, "utf8") || "{}"); }
  catch { return {}; }
}
function save(db) {
  ensure();
  fs.writeFileSync(DATA, JSON.stringify(db, null, 2), "utf8");
}
function get(id) {
  const db = load();
  return db[String(id)] || { mode: "chat", memory: true, language: "auto" };
}
function set(id, patch) {
  const db = load();
  const key = String(id);
  db[key] = { ...get(id), ...patch };
  save(db);
  return db[key];
}
function getMode(id) {
  const mode = get(id).mode;
  return VALID_MODES.has(mode) ? mode : "chat";
}
function setMode(id, mode) {
  if (!VALID_MODES.has(mode)) return get(id);
  return set(id, { mode });
}
function memoryEnabled(id) { return get(id).memory !== false; }
function setMemory(id, enabled) { return set(id, { memory: Boolean(enabled) }); }
function setLanguage(id, language) { return set(id, { language: String(language || "auto") }); }

module.exports = { VALID_MODES, get, set, getMode, setMode, memoryEnabled, setMemory, setLanguage };
