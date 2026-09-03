// ============================================================
// Persistent per-user chat memory
// memory/userHistoryStore.js
//
// userHistory used to be a plain `new Map()` — every restart wiped
// every user's conversation memory since nothing ever wrote it to
// disk. This is a drop-in Map subclass: same .has()/.get()/.set()
// API used throughout bot.js, but it hydrates from disk on startup
// and persists (debounced, so a burst of messages = one write) on
// every change. Keyed by Telegram user id.
// ============================================================

const fs = require("fs");
const path = require("path");

const DEFAULT_DATA_FILE = path.join(__dirname, "..", "data", "userHistory.json");
const SAVE_DEBOUNCE_MS = 2000;

class PersistentUserHistory extends Map {
    constructor(dataFile = DEFAULT_DATA_FILE) {
        super();
        this._dataFile = dataFile;
        this._dirty = false;
        this._saveTimer = null;
        this._load();
    }

    _load() {
        if (!fs.existsSync(this._dataFile)) return;
        try {
            const raw = JSON.parse(fs.readFileSync(this._dataFile, "utf8"));
            for (const [userId, history] of Object.entries(raw)) {
                const key = Number(userId);
                super.set(Number.isNaN(key) ? userId : key, history);
            }
        } catch (err) {
            console.error("userHistory: failed to load from disk:", err.message);
        }
    }

    set(key, value) {
        super.set(key, value);
        this._scheduleSave();
        return this;
    }

    delete(key) {
        const result = super.delete(key);
        this._scheduleSave();
        return result;
    }

    clear() {
        super.clear();
        this._scheduleSave();
    }

    _scheduleSave() {
        this._dirty = true;
        if (this._saveTimer) return;
        this._saveTimer = setTimeout(() => {
            this._saveTimer = null;
            if (!this._dirty) return;
            this._dirty = false;
            this._persist();
        }, SAVE_DEBOUNCE_MS);
    }

    _persist() {
        try {
            const obj = {};
            for (const [key, value] of this.entries()) {
                obj[key] = value;
            }
            fs.mkdirSync(path.dirname(this._dataFile), { recursive: true });
            fs.writeFileSync(this._dataFile, JSON.stringify(obj, null, 2));
        } catch (err) {
            console.error("userHistory: failed to save to disk:", err.message);
        }
    }

    /** Force an immediate synchronous save — used on graceful shutdown. */
    flushSync() {
        this._dirty = false;
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this._saveTimer = null;
        }
        this._persist();
    }
}

module.exports = PersistentUserHistory;
