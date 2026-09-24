// ============================================================
// Miss Aria Adventures
// gameManager.js
// Part 1
// ============================================================

const fs = require("fs");
const path = require("path");

// ============================================================
// SAVE DIRECTORY
// ============================================================

const SAVE_DIR = path.join(__dirname, "../data/gameSaves");

if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
}

// ============================================================
// ACTIVE SESSIONS
// ============================================================

const sessions = new Map();

// ============================================================
// REGISTERED GAMES
// ============================================================

const games = {
    zombie: null,
    dungeon: null,
    detective: null,
    space: null,
    pirate: null,
    story: null
};

// ============================================================
// GAME REGISTRATION
// ============================================================

function registerGame(name, handler) {
    games[name] = handler;
}

function getGame(name) {
    return games[name];
}

function getGames() {
    return Object.keys(games);
}

// ============================================================
// PLAYER TEMPLATE
// ============================================================

function createPlayer(user) {

    return {

        id: user.id,

        username: user.username || "",

        firstName: user.first_name || "",

        level: 1,

        xp: 0,

        coins: 100,

        gems: 0,

        hp: 100,

        maxHp: 100,

        mana: 50,

        maxMana: 50,

        stamina: 100,

        attack: 10,

        defense: 5,

        luck: 1,

        weapon: null,

        armor: null,

        inventory: [],

        achievements: [],

        quests: [],

        game: null,

        location: null,

        lastAction: Date.now(),

        stats: {

            monstersKilled: 0,

            gamesPlayed: 0,

            deaths: 0,

            wins: 0

        }

    };

}

// ============================================================
// SAVE PATH
// ============================================================

function getSavePath(userId) {

    return path.join(SAVE_DIR, `${userId}.json`);

}

// ============================================================
// SAVE GAME
// ============================================================

function saveGame(userId) {

    const session = sessions.get(userId);

    if (!session) return false;

    try {

        fs.writeFileSync(

            getSavePath(userId),

            JSON.stringify(session, null, 2)

        );

        return true;

    } catch (err) {

        console.error("Failed saving game:", err.message);

        return false;

    }

}

// ============================================================
// LOAD GAME
// ============================================================

function loadGame(userId) {

    try {

        const file = getSavePath(userId);

        if (!fs.existsSync(file)) return null;

        const data = JSON.parse(

            fs.readFileSync(file)

        );

        sessions.set(userId, data);

        return data;

    } catch (err) {

        console.error("Failed loading save:", err.message);

        return null;

    }

}

// ============================================================
// DELETE SAVE
// ============================================================

function deleteSave(userId) {

    try {

        const file = getSavePath(userId);

        if (fs.existsSync(file))

            fs.unlinkSync(file);

    } catch (err) {

        console.error(err);

    }

}

// ============================================================
// CREATE SESSION
// ============================================================

function createSession(user, gameName) {

    const player = createPlayer(user);

    const session = {

        player,

        game: gameName,

        state: {},

        history: [],

        createdAt: Date.now(),

        updatedAt: Date.now()

    };

    sessions.set(user.id, session);

    saveGame(user.id);

    return session;

}

// ============================================================
// GET SESSION
// ============================================================

function getSession(userId) {

    if (sessions.has(userId)) {
        return sessions.get(userId);
    }

    // Not in memory (e.g. bot restarted) — try to restore from disk before
    // giving up. Without this, saveGame() was writing files that nothing
    // ever read back, which is why games looked like they "didn't save".
    const restored = loadGame(userId);
    return restored || undefined;

}

// ============================================================
// HAS SESSION
// ============================================================

function hasSession(userId) {

    return sessions.has(userId) || !!getSession(userId);

}

// ============================================================
// END SESSION
// ============================================================

function endSession(userId) {

    saveGame(userId);

    sessions.delete(userId);

}

// ============================================================
// UPDATE SESSION
// ============================================================

function updateSession(userId, updater) {

    const session = sessions.get(userId);

    if (!session) return;

    updater(session);

    session.updatedAt = Date.now();

    saveGame(userId);

}

// ============================================================
// HISTORY
// ============================================================

function pushHistory(userId, text) {

    const session = sessions.get(userId);

    if (!session) return;

    session.history.push({

        text,

        time: Date.now()

    });

    if (session.history.length > 100)

        session.history.shift();

}

// ============================================================
// PLAYER HELPERS
// ============================================================

function addXP(userId, amount) {

    const session = sessions.get(userId);

    if (!session) return;

    const player = session.player;

    player.xp += amount;

    while (player.xp >= player.level * 100) {

        player.xp -= player.level * 100;

        player.level++;

        player.maxHp += 15;

        player.hp = player.maxHp;

        player.attack += 3;

        player.defense += 2;

        player.maxMana += 5;

        player.mana = player.maxMana;

    }

}

function addCoins(userId, amount) {

    const session = sessions.get(userId);

    if (!session) return;

    session.player.coins += amount;

}

function addItem(userId, item) {

    const session = sessions.get(userId);

    if (!session) return;

    session.player.inventory.push(item);

}

function removeItem(userId, item) {

    const session = sessions.get(userId);

    if (!session) return;

    session.player.inventory =

        session.player.inventory.filter(

            x => x !== item

        );

}


// ============================================================
// GAME STARTER
// ============================================================

function startGame(user, gameName) {

    const handler = getGame(gameName);

    if (!handler) {
        throw new Error(`Game "${gameName}" is not registered.`);
    }

    let session = getSession(user.id);

    if (!session) {
        session = createSession(user, gameName);
    }

    session.game = gameName;
    session.updatedAt = Date.now();

    saveGame(user.id);

    return handler.start(session);
}

// ============================================================
// CONTINUE GAME
// ============================================================

async function continueGame(userId, input) {

    const session = getSession(userId);

    if (!session) {
        return {
            text: "❌ You don't have an active adventure."
        };
    }

    const handler = getGame(session.game);

    if (!handler) {
        return {
            text: "❌ Game handler not found."
        };
    }

    session.updatedAt = Date.now();

    // IMPORTANT: handleInput mutates session.state (XP, HP, inventory, etc.),
    // so we must save AFTER it runs, not before — saving first was writing
    // every move one turn stale, which is why restored games looked like
    // progress wasn't being kept.
    const result = await handler.handleInput(session, input);

    saveGame(userId);

    return result;
}

// ============================================================
// PLAYER STATS
// ============================================================

function getPlayer(userId) {

    const session = getSession(userId);

    if (!session) return null;

    return session.player;
}

function healPlayer(userId, amount) {

    const player = getPlayer(userId);

    if (!player) return;

    player.hp = Math.min(
        player.maxHp,
        player.hp + amount
    );

    saveGame(userId);
}

function damagePlayer(userId, amount) {

    const player = getPlayer(userId);

    if (!player) return;

    player.hp -= amount;

    if (player.hp < 0)
        player.hp = 0;

    saveGame(userId);
}

// ============================================================
// INVENTORY
// ============================================================

function hasItem(userId, itemName) {

    const player = getPlayer(userId);

    if (!player) return false;

    return player.inventory.includes(itemName);
}

function inventoryText(userId) {

    const player = getPlayer(userId);

    if (!player)
        return "Inventory unavailable.";

    if (!player.inventory.length)
        return "🎒 Inventory is empty.";

    return player.inventory
        .map((item, i) => `${i + 1}. ${item}`)
        .join("\n");
}
// ============================================================
// COMBAT SYSTEM
// ============================================================

function attackEnemy(userId, enemy) {

    const player = getPlayer(userId);

    if (!player) return null;

    const damage = Math.max(
        1,
        player.attack + Math.floor(Math.random() * 6) - enemy.defense
    );

    enemy.hp -= damage;

    return {
        damage,
        enemyHp: Math.max(0, enemy.hp),
        defeated: enemy.hp <= 0
    };

}

function enemyAttack(userId, enemy) {

    const player = getPlayer(userId);

    if (!player) return null;

    const damage = Math.max(
        1,
        enemy.attack + Math.floor(Math.random() * 4) - player.defense
    );

    damagePlayer(userId, damage);

    return damage;

}

// ============================================================
// LOOT SYSTEM
// ============================================================

const LOOT = [

    "🍞 Bread",

    "🧪 Small Potion",

    "🪙 Gold Coin",

    "🗡 Iron Sword",

    "🛡 Wooden Shield",

    "💎 Gem",

    "🏹 Bow",

    "🪓 Axe"

];

function generateLoot() {

    return LOOT[
        Math.floor(
            Math.random() * LOOT.length
        )
    ];

}

// ============================================================
// PLAYER REWARDS
// ============================================================

function rewardPlayer(userId, xp, coins) {

    addXP(userId, xp);

    addCoins(userId, coins);

    const lootChance = Math.random();

    let loot = null;

    if (lootChance <= 0.45) {

        loot = generateLoot();

        addItem(userId, loot);

    }

    saveGame(userId);

    return {

        xp,

        coins,

        loot

    };

}

// ============================================================
// PLAYER DEATH
// ============================================================

function playerDied(userId) {

    const session = getSession(userId);

    if (!session) return;

    session.player.stats.deaths++;

    session.player.hp = session.player.maxHp;

    session.player.coins = Math.max(
        0,
        session.player.coins - 50
    );

    saveGame(userId);

}

// ============================================================
// RANDOM EVENTS
// ============================================================

const EVENTS = [

    "💰 You found a hidden treasure chest.",

    "👴 A mysterious traveler gives you advice.",

    "🧪 You discovered an abandoned laboratory.",

    "⚔ Bandits are hiding nearby.",

    "🌧 Heavy rain slows your journey.",

    "🐺 Wild animals surround you.",

    "✨ You feel stronger.",

    "🏕 You found a safe camp."

];

function randomEvent() {

    return EVENTS[
        Math.floor(
            Math.random() * EVENTS.length
        )
    ];

}
// ============================================================
// GAME ROUTER
// Part 3A
// ============================================================

async function handleAction(userId, action) {

    const session = getSession(userId);

    if (!session) {
        return {
            success: false,
            text: "❌ No active game session."
        };
    }

    const game = getGame(session.game);

    if (!game) {
        return {
            success: false,
            text: "❌ Unknown game."
        };
    }

    try {

        const result = await game.handleAction(
            session,
            action
        );

        session.updatedAt = Date.now();

        saveGame(userId);

        return result;

    } catch (err) {

        console.error("Game Error:", err);

        return {

            success: false,

            text: "❌ Something went wrong."

        };

    }

}

// ============================================================
// GAME STATUS
// ============================================================

function gameStatus(userId) {

    const session = getSession(userId);

    if (!session)
        return null;

    return {

        game: session.game,

        created: session.createdAt,

        updated: session.updatedAt,

        player: session.player

    };

}

// ============================================================
// ACTIVE GAME
// ============================================================

function currentGame(userId) {

    const session = getSession(userId);

    if (!session)
        return null;

    return session.game;

}

// ============================================================
// SWITCH GAME
// ============================================================

function switchGame(userId, gameName) {

    const session = getSession(userId);

    if (!session)
        return null;

    if (!games[gameName])
        return null;

    session.game = gameName;

    session.state = {};

    session.history = [];

    session.updatedAt = Date.now();

    saveGame(userId);

    return session;

}

// ============================================================
// HEALTH REGEN
// ============================================================

function regenerateHealth(userId) {

    const player = getPlayer(userId);

    if (!player)
        return;

    if (player.hp >= player.maxHp)
        return;

    player.hp += 2;

    if (player.hp > player.maxHp)
        player.hp = player.maxHp;

}

// ============================================================
// MANA REGEN
// ============================================================

function regenerateMana(userId) {

    const player = getPlayer(userId);

    if (!player)
        return;

    if (player.mana >= player.maxMana)
        return;

    player.mana += 1;

    if (player.mana > player.maxMana)
        player.mana = player.maxMana;

}
// ============================================================
// ACHIEVEMENT SYSTEM
// Part 3B
// ============================================================

function unlockAchievement(userId, achievement) {

    const player = getPlayer(userId);

    if (!player) return false;

    if (player.achievements.includes(achievement))
        return false;

    player.achievements.push(achievement);

    addXP(userId, 100);
    addCoins(userId, 250);

    saveGame(userId);

    return true;
}

// ============================================================
// DAILY REWARD
// ============================================================

function claimDailyReward(userId) {

    const session = getSession(userId);

    if (!session) return null;

    const now = Date.now();

    if (
        session.lastDaily &&
        now - session.lastDaily < 86400000
    ) {
        return null;
    }

    session.lastDaily = now;

    addCoins(userId, 500);
    addXP(userId, 150);

    saveGame(userId);

    return {
        coins: 500,
        xp: 150
    };
}

// ============================================================
// COOLDOWN
// ============================================================

const cooldowns = new Map();

function isOnCooldown(userId, key, seconds = 3) {

    const id = `${userId}:${key}`;

    const last = cooldowns.get(id);

    if (!last) {

        cooldowns.set(id, Date.now());

        return false;

    }

    if (
        Date.now() - last <
        seconds * 1000
    ) {
        return true;
    }

    cooldowns.set(id, Date.now());

    return false;
}

// ============================================================
// EQUIPMENT
// ============================================================

function equipWeapon(userId, weapon) {

    const player = getPlayer(userId);

    if (!player) return false;

    if (!player.inventory.includes(weapon))
        return false;

    player.weapon = weapon;

    saveGame(userId);

    return true;
}

function equipArmor(userId, armor) {

    const player = getPlayer(userId);

    if (!player) return false;

    if (!player.inventory.includes(armor))
        return false;

    player.armor = armor;

    saveGame(userId);

    return true;
}

// ============================================================
// PLAYER CARD
// ============================================================

function playerCard(userId) {

    const player = getPlayer(userId);

    if (!player)
        return "Player not found.";

    return `
🎮 Miss Aria Adventure

👤 ${player.firstName}

⭐ Level: ${player.level}
✨ XP: ${player.xp}

❤️ HP: ${player.hp}/${player.maxHp}
💙 Mana: ${player.mana}/${player.maxMana}

🪙 Coins: ${player.coins}
💎 Gems: ${player.gems}

⚔ Weapon:
${player.weapon || "None"}

🛡 Armor:
${player.armor || "None"}

🎒 Inventory:
${player.inventory.length} item(s)
`.trim();

}
// ============================================================
// LEADERBOARD HELPERS
// ============================================================

function getLeaderboard() {

    const players = [];

    for (const session of sessions.values()) {

        players.push({
            id: session.player.id,
            name: session.player.firstName,
            level: session.player.level,
            xp: session.player.xp,
            coins: session.player.coins
        });

    }

    players.sort((a, b) => {

        if (b.level !== a.level)
            return b.level - a.level;

        return b.xp - a.xp;

    });

    return players;

}

// ============================================================
// SAVE ALL
// ============================================================

function saveAllGames() {

    for (const [userId] of sessions) {
        saveGame(userId);
    }

}

// ============================================================
// SESSION CLEANUP
// ============================================================

function cleanupSessions(maxIdleHours = 24) {

    const now = Date.now();

    const limit = maxIdleHours * 60 * 60 * 1000;

    for (const [userId, session] of sessions) {

        if (now - session.updatedAt > limit) {

            saveGame(userId);

            sessions.delete(userId);

        }

    }

}

// ============================================================
// RESTORE SAVES
// ============================================================

function restoreSessions() {

    const files = fs.readdirSync(SAVE_DIR);

    for (const file of files) {

        if (!file.endsWith(".json"))
            continue;

        try {

            const data = JSON.parse(
                fs.readFileSync(
                    path.join(SAVE_DIR, file)
                )
            );

            sessions.set(data.player.id, data);

        } catch (err) {

            console.error(
                "Failed restoring:",
                file,
                err.message
            );

        }

    }

}

// ============================================================
// AUTO SAVE
// ============================================================

setInterval(() => {

    saveAllGames();

    cleanupSessions();

}, 60000);

// Restore saves immediately
restoreSessions();

// ============================================================
// MODULE EXPORTS
// ============================================================

module.exports = {

    registerGame,
    getGame,
    getGames,

    createSession,
    getSession,
    hasSession,
    endSession,
    updateSession,

    pushHistory,

    addXP,
    addCoins,
    addItem,
    removeItem,

    saveGame,
    loadGame,
    deleteSave,

    startGame,
    continueGame,

    getPlayer,
    healPlayer,
    damagePlayer,

    hasItem,
    inventoryText,

    attackEnemy,
    enemyAttack,
    generateLoot,
    rewardPlayer,
    playerDied,
    randomEvent,

    handleAction,
    gameStatus,
    currentGame,
    switchGame,

    regenerateHealth,
    regenerateMana,

    unlockAchievement,
    claimDailyReward,

    isOnCooldown,

    equipWeapon,
    equipArmor,

    playerCard,

    getLeaderboard,
    saveAllGames,
    cleanupSessions,
    restoreSessions

};