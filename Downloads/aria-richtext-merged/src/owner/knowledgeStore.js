// src/owner/knowledgeStore.js
//
// What makes Aria genuinely respond differently over time — NOT a fake
// "learning" counter. Every entry here gets injected into the real AI
// system prompt in commands/whatsapp.js's replyFromAI(), so teaching Aria
// something actually changes what she says on the next message, for real.
//
// Deliberately capped (MAX_INJECTED) at read time: unbounded growth would
// eventually blow the AI system prompt's size and cost/latency, so only
// the most recent entries are ever injected — older ones stay stored and
// listable, just not fed into every single prompt forever.

const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "..", "..", "data", "knowledge.json");
const MAX_INJECTED = 20;

function load() {
  if (!fs.existsSync(FILE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

function addEntry(ownerJid, text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return { success: false, error: "Nothing to remember." };
  const data = load();
  data[ownerJid] = data[ownerJid] || [];
  const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: trimmed, createdAt: Date.now() };
  data[ownerJid].push(entry);
  save(data);
  return { success: true, entry };
}

function listEntries(ownerJid) {
  const data = load();
  return data[ownerJid] || [];
}

/**
 * Removes by exact id, or by 1-based index into listEntries()'s order
 * (oldest first) — matching the numbering shown to the owner when they
 * ask "what have you learned".
 */
function removeEntry(ownerJid, idOrIndex) {
  const data = load();
  const list = data[ownerJid] || [];
  let idx = list.findIndex((e) => e.id === idOrIndex);
  if (idx === -1 && /^\d+$/.test(String(idOrIndex))) {
    idx = parseInt(idOrIndex, 10) - 1;
  }
  if (idx < 0 || idx >= list.length) return { success: false };
  const [removed] = list.splice(idx, 1);
  data[ownerJid] = list;
  save(data);
  return { success: true, removed };
}

/**
 * The actual "smarter" mechanism: the most recent entries, formatted for
 * direct inclusion in an AI system prompt. Real text, real facts the
 * owner actually said — nothing synthesized.
 */
function getInjectedKnowledgeText(ownerJid) {
  const entries = listEntries(ownerJid).slice(-MAX_INJECTED);
  if (entries.length === 0) return "";
  const lines = entries.map((e) => `- ${e.text}`).join("\n");
  return `\n\nThings the owner has specifically told you to remember:\n${lines}`;
}

module.exports = { addEntry, listEntries, removeEntry, getInjectedKnowledgeText, MAX_INJECTED };
