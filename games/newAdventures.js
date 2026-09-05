// ============================================================
// Miss Aria Adventures — 24 New Games (bringing total to 30)
// games/data/newAdventures.js
//
// Each entry is themed data fed into the shared engine
// (games/engine.js). Add a new game by adding one object here —
// no new input-handling code required, so it can't go "stale"
// like the old hand-written keyboards did.
// ============================================================

const { buildAdventure } = require("./engine");

const DEFS = [
{
id: "ninja",
title: "Shadow Ninja",
description: "Master the shadows, infiltrate strongholds, and take down the Crimson Clan.",
resourceName: "Scrolls",
enemyNames: ["Crimson Guard", "Shuriken Assassin", "Rogue Samurai"],
locationNames: ["the bamboo forest", "the hidden temple", "the rooftops of Edo"],
lootNames: ["a jade dagger", "a smoke bomb", "an ancient scroll"],
bossName: "Crimson Shogun"
},
{
id: "wizard",
title: "Arcane Academy",
description: "Study forbidden spells and defend the Academy from a rising dark order.",
resourceName: "Mana Crystals",
enemyNames: ["Cursed Familiar", "Rogue Apprentice", "Shade Wraith"],
locationNames: ["the restricted library", "the enchanted greenhouse", "the arcane vault"],
lootNames: ["a spellbook page", "a phoenix feather", "a mana crystal"],
bossName: "The Archlich"
},
{
id: "superhero",
title: "Metro Guardian",
description: "Protect Metro City from villains threatening its streets.",
resourceName: "Tech Parts",
enemyNames: ["Street Thug", "Rogue Drone", "Masked Bandit"],
locationNames: ["downtown Metro City", "the abandoned subway", "the harbor docks"],
lootNames: ["a power cell", "a grappling hook part", "an armor plate"],
bossName: "Doctor Malice"
},
{
id: "racing",
title: "Neon Circuit",
description: "Climb the underground street-racing ranks and become the city's top driver.",
resourceName: "Nitro",
enemyNames: ["Rival Racer", "Police Interceptor", "Street Champion"],
locationNames: ["the harbor tunnel", "the neon strip", "the mountain pass"],
lootNames: ["a turbo kit", "a nitro canister", "race winnings"],
bossName: "The Midnight King"
},
{
id: "farm",
title: "Sunny Meadows Farm",
description: "Build up your farm, fend off pests, and become the region's top farmer.",
resourceName: "Coins",
enemyNames: ["Crop Raider", "Wild Boar", "Pest Swarm"],
locationNames: ["the wheat field", "the old barn", "the riverside plot"],
lootNames: ["a bag of seeds", "fresh produce", "a farming tool"],
bossName: "The Blight Beast"
},
{
id: "fishing",
title: "Deep Blue Fishing",
description: "Sail the open water chasing the legendary catch of a lifetime.",
resourceName: "Fish Coins",
enemyNames: ["Aggressive Shark", "Tangled Net Monster", "Storm Current"],
locationNames: ["the coral reef", "the deep trench", "the misty cove"],
lootNames: ["a rare pearl", "a sturdy rod part", "a chest of fish coins"],
bossName: "The Kraken"
},
{
id: "cooking",
title: "Iron Kitchen",
description: "Cook your way to culinary fame in the city's most competitive kitchen.",
resourceName: "Ingredients",
enemyNames: ["Kitchen Rival", "Critic in Disguise", "Health Inspector"],
locationNames: ["the spice market", "the walk-in freezer", "the rival's restaurant"],
lootNames: ["a rare spice", "a chef's knife", "a secret recipe"],
bossName: "Chef Vendetta"
},
{
id: "heist",
title: "Midnight Heist",
description: "Assemble a crew and pull off the biggest heist the city has ever seen.",
resourceName: "Loot Cash",
enemyNames: ["Security Guard", "Rival Crew", "Undercover Cop"],
locationNames: ["the bank vault", "the casino floor", "the armored truck depot"],
lootNames: ["a stack of cash", "a laser cutter", "a diamond"],
bossName: "The Vault Warden"
},
{
id: "western",
title: "Dust Trail Outlaw",
description: "Ride through the frontier as a gunslinger with a bounty on your head.",
resourceName: "Bounty Gold",
enemyNames: ["Bandit", "Bounty Hunter", "Crooked Sheriff"],
locationNames: ["the dusty saloon", "the canyon pass", "the abandoned mine"],
lootNames: ["a silver spur", "a stick of dynamite", "a bag of gold"],
bossName: "Black Jack Reyes"
},
{
id: "vampire",
title: "Nightfall Hunter",
description: "Hunt the creatures of the night before the eternal darkness spreads.",
resourceName: "Silver",
enemyNames: ["Fledgling Vampire", "Feral Ghoul", "Cursed Wolf"],
locationNames: ["the gothic manor", "the foggy graveyard", "the crypt tunnels"],
lootNames: ["a silver stake", "holy water", "a vial of garlic oil"],
bossName: "Count Ravencrest"
},
{
id: "mecha",
title: "Titan Pilot",
description: "Pilot a giant mech and defend the last human colony from a robot uprising.",
resourceName: "Scrap",
enemyNames: ["Rogue Drone", "Sentinel Walker", "Hijacked Mech"],
locationNames: ["the scrapyard", "the collapsed factory", "the reactor core"],
lootNames: ["a servo motor", "a power core", "an armor shard"],
bossName: "Omega Prime"
},
{
id: "island",
title: "Castaway Island",
description: "Survive being shipwrecked and uncover the island's dark secret.",
resourceName: "Supplies",
enemyNames: ["Wild Beast", "Rival Castaway", "Territorial Ape"],
locationNames: ["the dense jungle", "the rocky cliffs", "the hidden lagoon"],
lootNames: ["coconuts", "a makeshift spear", "a salvaged crate"],
bossName: "The Island Guardian"
},
{
id: "esports",
title: "Pro League Rising",
description: "Grind your way from amateur gamer to world champion.",
resourceName: "Fans",
enemyNames: ["Toxic Rival", "Ranked Opponent", "Smurf Account"],
locationNames: ["the ranked queue", "the regional finals", "the practice server"],
lootNames: ["a sponsorship offer", "new gaming gear", "a highlight clip"],
bossName: "Reigning Champion Kaze"
},
{
id: "football",
title: "Dynasty Manager",
description: "Manage your football club from relegation zone to global dynasty.",
resourceName: "Budget",
enemyNames: ["Rival Club", "Injury Crisis", "Board Pressure"],
locationNames: ["the transfer market", "the home stadium", "the training ground"],
lootNames: ["a star transfer", "sponsorship funds", "a tactics playbook"],
bossName: "United Megaclub"
},
{
id: "dragon",
title: "Dragon Rider",
description: "Bond with a young dragon and soar through the Skyrealms together.",
resourceName: "Dragon Scales",
enemyNames: ["Sky Raider", "Wild Wyvern", "Storm Elemental"],
locationNames: ["the cloud citadel", "the volcanic peaks", "the floating isles"],
lootNames: ["a dragon scale", "an enchanted saddle", "a sky crystal"],
bossName: "The Elder Wyrm"
},
{
id: "submarine",
title: "Abyss Explorer",
description: "Pilot a submarine into the crushing depths in search of a lost city.",
resourceName: "Salvage",
enemyNames: ["Deep Leviathan", "Rogue Sub", "Pressure Anomaly"],
locationNames: ["the abyssal trench", "the sunken ruins", "the hydrothermal vents"],
lootNames: ["ancient gold", "a sonar module", "a pressure-sealed chest"],
bossName: "The Abyssal Warden"
},
{
id: "arctic",
title: "Frozen Expedition",
description: "Lead an expedition across the frozen wastes to find a lost research base.",
resourceName: "Rations",
enemyNames: ["Frost Wolf", "Rival Expedition", "Snow Golem"],
locationNames: ["the glacier field", "the ice caves", "the frozen research base"],
lootNames: ["thermal gear", "a fuel canister", "an old research log"],
bossName: "The Frost Colossus"
},
{
id: "jungle",
title: "Lost Temple Expedition",
description: "Chart a path through dense jungle to reach a temple no one has entered in centuries.",
resourceName: "Relics",
enemyNames: ["Jaguar Pack", "Trap Guardian", "Rival Treasure Hunter"],
locationNames: ["the vine-covered ruins", "the river crossing", "the hidden temple entrance"],
lootNames: ["a golden idol", "a carved relic", "an ancient map fragment"],
bossName: "The Temple Guardian"
},
{
id: "casino",
title: "High Roller",
description: "Work your way up the casino floor from small stakes to the high-roller room.",
resourceName: "Chips",
enemyNames: ["Card Shark", "Casino Bouncer", "Rival High Roller"],
locationNames: ["the poker room", "the high-limit floor", "the VIP lounge"],
lootNames: ["a stack of chips", "a lucky charm", "a VIP pass"],
bossName: "The House Boss"
},
{
id: "stocks",
title: "Market Tycoon",
description: "Trade your way from a small portfolio to a market-dominating empire.",
resourceName: "Capital",
enemyNames: ["Market Crash", "Rival Trader", "Insider Scandal"],
locationNames: ["the trading floor", "the boardroom", "the emerging markets desk"],
lootNames: ["a hot tip", "a bull market surge", "a buyout offer"],
bossName: "The Hedge Fund Titan"
},
{
id: "tamer",
title: "Monster Tamer",
description: "Explore the wilds, befriend monsters, and battle rival tamers.",
resourceName: "Tame Points",
enemyNames: ["Wild Beastling", "Rival Tamer", "Feral Alpha"],
locationNames: ["the whispering woods", "the crystal caves", "the tamer arena"],
lootNames: ["a taming treat", "a monster egg", "a rare gem"],
bossName: "The Alpha Overlord"
},
{
id: "ghost",
title: "Ghost Hunter Agency",
description: "Investigate haunted locations and put restless spirits to rest.",
resourceName: "Ecto Energy",
enemyNames: ["Restless Spirit", "Poltergeist", "Shadow Wraith"],
locationNames: ["the haunted mansion", "the abandoned asylum", "the old cemetery"],
lootNames: ["an EMF reading", "a spirit photo", "a sealed ecto-jar"],
bossName: "The Vengeful Phantom"
},
{
id: "alien",
title: "Xeno Invasion",
description: "Defend Earth's last outpost against a full-scale alien invasion.",
resourceName: "Tech Salvage",
enemyNames: ["Xeno Scout", "Bio Drone", "Alien Warrior"],
locationNames: ["the crash site", "the underground bunker", "the mothership hull"],
lootNames: ["an alien core", "plasma cell", "salvaged tech"],
bossName: "The Hive Overmind"
},
{
id: "timetravel",
title: "Chrono Drifter",
emoji: "⏳",
description: "Jump through fractured timelines to repair history before it collapses.",
resourceName: "Chrono Shards",
enemyNames: ["Time Wraith", "Paradox Clone", "Rogue Chronomancer"],
locationNames: ["the fractured 1920s", "the collapsing far future", "the looping medieval siege"],
lootNames: ["a chrono shard", "a stabilizer core", "a fragment of lost history"],
bossName: "The Paradox King"
}
];

const games = DEFS.map(def => ({
name: def.id,
title: def.title,
emoji: def.emoji,
module: buildAdventure(def)
}));

module.exports = { games };
