// ============================================================
// Fun-command support module
// fun.js
//
// This module was required by funcommand.js but did not exist
// anywhere in the project, which crashed the bot at startup
// (Cannot find module './fun') before it ever connected to
// Telegram. This provides the marriage system, AFK helpers,
// and small utilities funcommand.js expects.
// ============================================================

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data", "fun.json");

function load() {
    if (!fs.existsSync(DATA_FILE)) {
        return { married: {} };
    }
    try {
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        if (!parsed.married) parsed.married = {};
        return parsed;
    } catch {
        return { married: {} };
    }
}

const store = load();

// In-memory pending marriage proposals: { [targetId]: { proposer, chatId, time } }
// Deliberately not persisted — a proposal that outlives a restart isn't useful.
const proposals = {};

function saveAll() {
    try {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    } catch (err) {
        console.error("fun.js saveAll failed:", err.message);
    }
}

function isMarried(userId) {
    return Boolean(store.married[String(userId)]);
}

function getSpouse(userId) {
    return store.married[String(userId)] || null;
}

function marry(userId1, userId2) {
    store.married[String(userId1)] = String(userId2);
    store.married[String(userId2)] = String(userId1);
    saveAll();
}

function divorce(userId) {
    const key = String(userId);
    const partner = store.married[key];
    delete store.married[key];
    if (partner) delete store.married[partner];
    saveAll();
    return partner || null;
}

/** HTML mention link for a Telegram user object (msg.from / query.from). */
function mention(user) {
    const name = String(user.first_name || user.username || "user")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<a href="tg://user?id=${user.id}">${name}</a>`;
}

/** Pick a random element from an array. */
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ---- AFK helpers (funcommand.js also keeps its own local afkUsers Map;
// these are exposed for any other module that wants AFK state) ----
const afkStore = new Map();

function setAFK(userId, data) {
    afkStore.set(String(userId), { ...data, time: Date.now() });
}

function removeAFK(userId) {
    afkStore.delete(String(userId));
}

function isAFK(userId) {
    return afkStore.get(String(userId)) || null;
}

module.exports = {
    proposals,
    saveAll,
    isMarried,
    getSpouse,
    marry,
    divorce,
    mention,
    random,
    setAFK,
    removeAFK,
    isAFK
};
