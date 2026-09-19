// ============================================================
// Usage analytics / "cool tracking"
// services/statsTracker.js
//
// Lightweight, self-contained — deliberately kept separate from
// the main users/store.json so it can never corrupt existing
// bot state. Tracks daily active users, command popularity,
// and feature usage (voice notes, code studio, games, etc).
// ============================================================

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "analytics.json");

function todayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function load() {
    if (!fs.existsSync(DATA_FILE)) {
        return { commands: {}, features: {}, dailyActive: {}, totalMessages: 0, firstSeen: {}, startedAt: Date.now() };
    }
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
        return { commands: {}, features: {}, dailyActive: {}, totalMessages: 0, firstSeen: {}, startedAt: Date.now() };
    }
}

let data = load();
let dirty = false;
let saveTimer = null;

function scheduleSave() {
    dirty = true;
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        if (!dirty) return;
        dirty = false;
        try {
            fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("statsTracker save failed:", err.message);
        }
    }, 3000); // batch writes instead of hitting disk on every event
}

/** Call on every incoming message to track daily-active-users + volume. */
function trackMessage(userId) {
    const day = todayKey();
    const key = String(userId);

    if (!data.dailyActive[day]) data.dailyActive[day] = [];
    if (!data.dailyActive[day].includes(key)) data.dailyActive[day].push(key);

    if (!data.firstSeen[key]) data.firstSeen[key] = Date.now();

    data.totalMessages += 1;
    scheduleSave();
}

/** Call when a specific command (e.g. "/code", "/start") is used. */
function trackCommand(name) {
    data.commands[name] = (data.commands[name] || 0) + 1;
    scheduleSave();
}

/** Call for named features that aren't slash-commands (e.g. "voice_note", "code_studio", "game:dungeon"). */
function trackFeature(name) {
    data.features[name] = (data.features[name] || 0) + 1;
    scheduleSave();
}

function topEntries(obj, limit = 10) {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

function getSummary() {
    const day = todayKey();
    const totalUniqueUsers = Object.keys(data.firstSeen).length;
    const activeToday = (data.dailyActive[day] || []).length;

    // 7-day rolling active users
    const last7 = new Set();
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        (data.dailyActive[key] || []).forEach((u) => last7.add(u));
    }

    return {
        totalUniqueUsers,
        activeToday,
        active7d: last7.size,
        totalMessages: data.totalMessages,
        topCommands: topEntries(data.commands),
        topFeatures: topEntries(data.features),
        since: data.startedAt
    };
}

module.exports = {
    trackMessage,
    trackCommand,
    trackFeature,
    getSummary
};
