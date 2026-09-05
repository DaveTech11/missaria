// src/owner/localStore.js
//
// WhatsApp/Baileys has no API to rename a contact on the account itself —
// contact names are synced from the phone's own address book, and nothing
// in this codebase or Baileys can write to that. So "save/edit a contact
// name" is implemented honestly here as the bot's OWN local alias list —
// used when the bot displays or refers to that number, not a claim that
// it changes anything on WhatsApp's side. Same honesty standard as the
// local ban/mute state in waGroupManager.js, which doesn't call a
// WhatsApp API either — it's real, just real as bot-side state, not as a
// WhatsApp account change.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const STORE_FILE = path.join(DATA_DIR, "ownerLocalState.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(STORE_FILE)) return { contactAliases: {}, dnd: false };
  try {
    const parsed = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
    return { contactAliases: parsed.contactAliases || {}, dnd: !!parsed.dnd };
  } catch {
    return { contactAliases: {}, dnd: false };
  }
}

let state = load();
let saveTimer = null;

function saveSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      console.error("localStore: failed saving:", err.message);
    }
  }, 1000);
}

function setContactAlias(jid, alias) {
  state.contactAliases[jid] = alias;
  saveSoon();
}

function getContactAlias(jid) {
  return state.contactAliases[jid] || null;
}

function setDnd(enabled) {
  state.dnd = !!enabled;
  saveSoon();
}

function isDndEnabled() {
  return !!state.dnd;
}

module.exports = { setContactAlias, getContactAlias, setDnd, isDndEnabled };
