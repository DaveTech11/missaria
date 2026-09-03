// ============================================================
// economyService.js
// A self-contained virtual-currency economy: "aura" (main currency)
// and "shards" (converted from aura). All numbers below are
// reasonable starting defaults — tune them freely, they're all
// grouped in CONFIG at the top for easy editing.
// ============================================================

const fs = require("fs");
const path = require("path");

const CONFIG = {
    startingAura: 100,
    stealCooldownMs: 30 * 60 * 1000,      // 30 min between steal attempts
    stealSuccessChance: 0.45,              // 45% chance to succeed
    stealMinPercent: 0.05,                 // steal 5-15% of target's aura on success
    stealMaxPercent: 0.15,
    stealFailPenaltyPercent: 0.05,         // lose 5% of your own aura on failed attempt
    duelHouseCutPercent: 0.05,             // 5% cut to the "house" on duels
    luckStakes: [300, 500, 700],           // fixed allowed stake amounts for /luck
    luckWinChance: 0.42,                   // slightly under 50/50, house edge
    luckMultiplier: 1.9,                   // payout multiplier on a win
    shardConversionRate: 10                // 10 aura = 1 shard
};

const DATA_FILE = path.join(__dirname, "..", "data", "economy.json");

function load() {
    try {
        if (!fs.existsSync(DATA_FILE)) return { users: {}, groupPrivacy: {}, stealDisabled: {} };
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
        return { users: {}, groupPrivacy: {}, stealDisabled: {} };
    }
}

let db = load();

function save() {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function getAccount(userId) {
    const key = String(userId);
    if (!db.users[key]) {
        db.users[key] = { aura: CONFIG.startingAura, shards: 0, lastSteal: 0, wins: 0, losses: 0 };
        save();
    }
    return db.users[key];
}

function getBalance(userId) {
    const acc = getAccount(userId);
    return { aura: acc.aura, shards: acc.shards };
}

// ------------------------------------------------------------
// STEAL
// ------------------------------------------------------------
function steal(groupId, fromId, toId) {
    if (db.stealDisabled[String(groupId)] && db.stealDisabled[String(groupId)] > Date.now()) {
        return { ok: false, reason: "Steal is currently disabled in this group." };
    }
    if (String(fromId) === String(toId)) {
        return { ok: false, reason: "You can't steal from yourself." };
    }

    const thief = getAccount(fromId);
    const target = getAccount(toId);

    const now = Date.now();
    if (now - thief.lastSteal < CONFIG.stealCooldownMs) {
        const waitMs = CONFIG.stealCooldownMs - (now - thief.lastSteal);
        return { ok: false, reason: `On cooldown — try again in ${Math.ceil(waitMs / 60000)} min.` };
    }
    thief.lastSteal = now;

    const success = Math.random() < CONFIG.stealSuccessChance;

    if (success) {
        const pct = CONFIG.stealMinPercent + Math.random() * (CONFIG.stealMaxPercent - CONFIG.stealMinPercent);
        const amount = Math.max(1, Math.floor(target.aura * pct));
        target.aura -= amount;
        thief.aura += amount;
        thief.wins += 1;
        save();
        return { ok: true, success: true, amount };
    }

    const penalty = Math.max(1, Math.floor(thief.aura * CONFIG.stealFailPenaltyPercent));
    thief.aura = Math.max(0, thief.aura - penalty);
    thief.losses += 1;
    save();
    return { ok: true, success: false, penalty };
}

function setStealDisabled(groupId, durationMs) {
    // durationMs = null/0 means indefinite
    db.stealDisabled[String(groupId)] = durationMs ? Date.now() + durationMs : Infinity;
    save();
}

function setStealEnabled(groupId) {
    delete db.stealDisabled[String(groupId)];
    save();
}

// ------------------------------------------------------------
// DUEL (wager between two users, or vs. the house in DM)
// ------------------------------------------------------------
function duel(challengerId, opponentId, amount) {
    const a = getAccount(challengerId);
    const b = opponentId ? getAccount(opponentId) : null;

    if (a.aura < amount) return { ok: false, reason: "You don't have enough aura for that wager." };
    if (b && b.aura < amount) return { ok: false, reason: "They don't have enough aura for that wager." };

    const challengerWins = Math.random() < 0.5;
    const pot = amount * 2;
    const houseCut = Math.floor(pot * CONFIG.duelHouseCutPercent);
    const payout = pot - houseCut;

    if (b) {
        // player vs player
        if (challengerWins) {
            a.aura += (payout - amount);
            b.aura -= amount;
            a.wins += 1; b.losses += 1;
        } else {
            b.aura += (payout - amount);
            a.aura -= amount;
            b.wins += 1; a.losses += 1;
        }
    } else {
        // player vs house
        if (challengerWins) {
            a.aura += (payout - amount);
            a.wins += 1;
        } else {
            a.aura -= amount;
            a.losses += 1;
        }
    }

    save();
    return { ok: true, winner: challengerWins ? "challenger" : (b ? "opponent" : "house"), payout: payout - amount };
}

// ------------------------------------------------------------
// LUCK (fixed-stake gamble)
// ------------------------------------------------------------
function luck(userId, stake) {
    if (!CONFIG.luckStakes.includes(stake)) {
        return { ok: false, reason: `Stake must be one of: ${CONFIG.luckStakes.join(", ")}` };
    }
    const acc = getAccount(userId);
    if (acc.aura < stake) return { ok: false, reason: "Not enough aura for that stake." };

    const won = Math.random() < CONFIG.luckWinChance;
    if (won) {
        const winnings = Math.floor(stake * CONFIG.luckMultiplier) - stake;
        acc.aura += winnings;
        acc.wins += 1;
        save();
        return { ok: true, won: true, winnings };
    }

    acc.aura -= stake;
    acc.losses += 1;
    save();
    return { ok: true, won: false, lost: stake };
}

// ------------------------------------------------------------
// SHARDS (convert aura -> shards)
// ------------------------------------------------------------
function convertToShards(userId, auraAmount) {
    const acc = getAccount(userId);
    if (acc.aura < auraAmount) return { ok: false, reason: "Not enough aura." };
    const shards = Math.floor(auraAmount / CONFIG.shardConversionRate);
    if (shards < 1) return { ok: false, reason: `Need at least ${CONFIG.shardConversionRate} aura to convert.` };

    const spent = shards * CONFIG.shardConversionRate;
    acc.aura -= spent;
    acc.shards += shards;
    save();
    return { ok: true, shards, spent };
}

// ------------------------------------------------------------
// LEADERBOARD / PRIVACY
// ------------------------------------------------------------
function setPrivacy(userId, hidden) {
    getAccount(userId).privacy = hidden;
    save();
}

function leaderboard(limit = 10) {
    return Object.entries(db.users)
        .filter(([, acc]) => !acc.privacy)
        .sort((a, b) => b[1].aura - a[1].aura)
        .slice(0, limit)
        .map(([id, acc]) => ({ id, aura: acc.aura, wins: acc.wins, losses: acc.losses }));
}

module.exports = {
    CONFIG,
    getBalance,
    steal,
    setStealDisabled,
    setStealEnabled,
    duel,
    luck,
    convertToShards,
    setPrivacy,
    leaderboard
};
