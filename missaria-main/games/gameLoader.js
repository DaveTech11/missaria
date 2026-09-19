// ============================================================
// Miss Aria Adventures
// gameLoader.js
// Loads all 30 games: 6 original hand-written ones + 24 built
// from the shared engine (games/engine.js + games/newAdventures.js)
// ============================================================

const path = require("path");
const fs = require("fs");

const gameManager = require("./gameManager");
const { games: generatedGames } = require("./newAdventures");

// ============================================================
// ORIGINAL, HAND-WRITTEN GAMES
// ============================================================

const GAME_LIST = [
    { name: "pirate", file: "pirateTreasure.js", label: "Pirate Treasure" },
    { name: "zombie", file: "zombieSurvival.js", label: "Zombie Survival" },
    { name: "dungeon", file: "dungeonRPG.js", label: "Dungeon RPG" },
    { name: "detective", file: "detectiveMystery.js", label: "Detective Mystery" },
    { name: "space", file: "spaceAdventure.js", label: "Space Adventure" },
    { name: "story", file: "aiStory.js", label: "AI Story" }
];

// Metadata used to build the /games menu dynamically
const ALL_GAMES_META = [
    ...GAME_LIST.map(g => ({ name: g.name, label: g.label })),
    ...generatedGames.map(g => ({ name: g.name, label: g.title }))
];

function getAllGamesMeta() {
    return ALL_GAMES_META;
}

// ============================================================
// LOAD GAMES
// ============================================================

function loadGames() {

    console.log("\nLoading Miss Aria Adventures...\n");

    let loadedGames = [];

    // ---- File-based games ----
    for (const game of GAME_LIST) {

        const gamePath = path.join(__dirname, game.file);

        try {

            if (!fs.existsSync(gamePath)) {
                console.log(`Missing: ${game.file}`);
                continue;
            }

            const gameModule = require(gamePath);

            if (
                typeof gameModule.start !== "function" ||
                typeof gameModule.handleInput !== "function"
            ) {
                console.log(`Invalid game module: ${game.name}`);
                continue;
            }

            gameManager.registerGame(game.name, gameModule);
            loadedGames.push(game.name);
            console.log(`Loaded ${game.name}`);

        } catch (error) {
            console.log(`Failed loading ${game.name}`);
            console.log(error.message);
        }
    }

    // ---- Engine-based games ----
    for (const g of generatedGames) {
        try {
            gameManager.registerGame(g.name, g.module);
            loadedGames.push(g.name);
            console.log(`Loaded ${g.name} (generated)`);
        } catch (error) {
            console.log(`Failed loading generated game ${g.name}`);
            console.log(error.message);
        }
    }

    console.log("\nMiss Aria Games Online:");
    console.log(loadedGames);
    console.log(`\nTotal games loaded: ${loadedGames.length}\n`);

    return loadedGames;
}

// ============================================================
// START LOADER
// ============================================================

loadGames();

// ============================================================
// EXPORT
// ============================================================

module.exports = gameManager;
module.exports.getAllGamesMeta = getAllGamesMeta;
