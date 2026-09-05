// ============================================================
// Miss Aria Story Mode
// aiStory.js
// Part 1A
// ============================================================

const {
    addXP,
    addCoins,
    addItem,
    randomEvent,
    rewardPlayer
} = require("./gameManager");

// ============================================================
// INTROS
// ============================================================

const intros = [

`🌌 **αι ѕтσяу мσ∂є**

You suddenly wake up in a strange place...

Nothing looks familiar.

A glowing door appears before you.

What will you do?`,

`🌲 **тнє ℓσѕт ƒσяєѕт**

The trees whisper your name.

A strange fox watches you from the shadows.

Three paths lie ahead.`,

`🏰 **тнє ¢υяѕє∂ кιηg∂σм**

The kingdom has fallen.

Only one hero can save it.

That hero might be you...`

];

// ============================================================
// RANDOM NPCS
// ============================================================

const npcs = [

{
name:"Old Wizard",
emoji:"🧙",
reward:150
},

{
name:"Merchant",
emoji:"🛒",
reward:80
},

{
name:"Knight",
emoji:"⚔",
reward:120
},

{
name:"Ghost",
emoji:"👻",
reward:200
},

{
name:"Princess",
emoji:"👸",
reward:180
}

];

// ============================================================
// ENEMIES
// ============================================================

const enemies = [

{
name:"Goblin",
hp:25,
attack:4,
defense:1,
xp:60,
coins:25
},

{
name:"Skeleton",
hp:35,
attack:6,
defense:2,
xp:90,
coins:40
},

{
name:"Orc",
hp:55,
attack:9,
defense:4,
xp:150,
coins:70
},

{
name:"Dark Knight",
hp:90,
attack:14,
defense:7,
xp:250,
coins:120
}

];

// ============================================================
// STORY START
// ============================================================

function start(session){

session.state={

chapter:1,

scene:0,

completed:false,

enemy:null,

npc:null

};

const intro=intros[
Math.floor(
Math.random()*intros.length
)
];

return{

text:
`${intro}

━━━━━━━━━━━━━━━

Choose your first action.

1️⃣ Explore

2️⃣ Rest

3️⃣ Search

4️⃣ Leave`,

keyboard:[
["Explore","Rest"],
["Search","Leave"]
]

};

}

// ============================================================
// RANDOM HELPERS
// ============================================================

function randomNPC(){

return npcs[
Math.floor(
Math.random()*npcs.length
)
];

}

function randomEnemy(){

const e=enemies[
Math.floor(
Math.random()*enemies.length
)
];

return{

...e

};

}
// ============================================================
// AI STORY ENGINE
// Part 1B
// ============================================================

const locations = [

"🌲 Whispering Forest",
"🏰 Forgotten Castle",
"🕳 Ancient Dungeon",
"🌋 Burning Mountain",
"🏜 Desert of Souls",
"🌌 Crystal Cave",
"🏕 Hidden Camp",
"⚓ Pirate Bay"

];

const treasures = [

"💎 Ancient Crystal",
"🪙 Bag of Gold",
"⚔ Legendary Sword",
"🛡 Dragon Shield",
"📜 Secret Scroll",
"🧪 Magic Potion",
"💍 Golden Ring",
"🔮 Mystic Orb"

];

const traps = [

"☠ Poison Trap",
"🪤 Spike Pit",
"💥 Explosive Rune",
"🕷 Giant Spider",
"🐍 Venom Snake",
"🌪 Dark Tornado"

];

// ============================================================
// RANDOM HELPERS
// ============================================================

function randomLocation() {

    return locations[
        Math.floor(Math.random() * locations.length)
    ];

}

function randomTreasure() {

    return treasures[
        Math.floor(Math.random() * treasures.length)
    ];

}

function randomTrap() {

    return traps[
        Math.floor(Math.random() * traps.length)
    ];

}

// ============================================================
// AI SCENE
// ============================================================

function generateScene(session) {

    const location = randomLocation();

    const event = Math.floor(Math.random() * 5);

    session.state.location = location;

    switch (event) {

        case 0:

            session.state.enemy = randomEnemy();

            return {

                type: "enemy",

                text:
`${location}

👹 You encounter a **${session.state.enemy.name}**!

What will you do?

⚔ Attack
🏃 Run
🛡 Defend`

            };

        case 1:

            session.state.npc = randomNPC();

            return {

                type: "npc",

                text:
`${location}

${session.state.npc.emoji} You meet **${session.state.npc.name}**.

They seem friendly.

💬 Talk
🎁 Ask for help
👋 Leave`

            };

        case 2:

            const loot = randomTreasure();

            session.state.loot = loot;

            return {

                type: "treasure",

                text:
`${location}

✨ You found a treasure chest!

Inside is:

${loot}

🎒 Take it?
✅ Yes
❌ No`

            };

        case 3:

            const trap = randomTrap();

            return {

                type: "trap",

                text:
`${location}

⚠ ${trap} blocks your path!

🏃 Escape
⚔ Break through
🤔 Think`

            };

        default:

            return {

                type: "event",

                text:
`${location}

${randomEvent()}

➡ Continue exploring?`

            };

    }

}

// ============================================================
// NEXT CHAPTER
// ============================================================

function nextChapter(session) {

    session.state.chapter++;

    session.state.scene = 0;

    return `📖 Chapter ${session.state.chapter} begins...`;

}
// ============================================================
// HANDLE PLAYER INPUT
// Part 2A
// ============================================================

async function handleInput(session, input) {

    input = String(input).toLowerCase().trim();

    // ========================================================
    // LEAVE GAME
    // ========================================================

    if (input === "leave") {

        session.state.completed = true;

        return {
            text:
`🚪 You decided to leave the adventure.

See you next time, hero! 👋`
        };

    }

    // ========================================================
    // EXPLORE
    // ========================================================

    if (input === "explore") {

        session.state.scene++;

        return generateScene(session);

    }

    // ========================================================
    // REST
    // ========================================================

    if (input === "rest") {

        session.player.hp = session.player.maxHp;

        session.player.mana = session.player.maxMana;

        return {

            text:
`🏕 You rest beside a campfire.

❤️ HP Fully Restored

💙 Mana Fully Restored`

        };

    }

    // ========================================================
    // SEARCH
    // ========================================================

    if (input === "search") {

        const coins = Math.floor(
            Math.random() * 80
        ) + 20;

        addCoins(session.player.id, coins);

        return {

            text:
`🔍 You searched the area.

🪙 You found ${coins} coins.`

        };

    }

    // ========================================================
    // NPC
    // ========================================================

    if (session.state.npc) {

        if (input === "talk") {

            const npc = session.state.npc;

            addXP(
                session.player.id,
                npc.reward
            );

            session.state.npc = null;

            return {

                text:
`${npc.emoji} ${npc.name}

"I believe in you.

Never give up."

✨ +${npc.reward} XP`

            };

        }

        if (input === "ask") {

            const npc = session.state.npc;

            addCoins(
                session.player.id,
                100
            );

            session.state.npc = null;

            return {

                text:
`${npc.emoji} ${npc.name}

hands you a small pouch.

🪙 +100 Coins`

            };

        }

    }

    // ========================================================
    // TREASURE
    // ========================================================

    if (session.state.loot) {

        if (
            input === "yes" ||
            input === "take"
        ) {

            addItem(
                session.player.id,
                session.state.loot
            );

            const loot =
                session.state.loot;

            session.state.loot = null;

            return {

                text:
`🎁 You obtained

${loot}

It was added to your inventory.`

            };

        }

        if (input === "no") {

            session.state.loot = null;

            return {

                text:
`You leave the treasure behind...`

            };

        }

    }

    // ========================================================
    // TRAP
    // ========================================================

    if (input === "escape") {

        return {

            text:
`🏃 You escaped safely!`

        };

    }

    if (input === "think") {

        return {

            text:
`🤔 After thinking carefully...

You discovered another path.`

        };

    }

    // ========================================================
    // UNKNOWN
    // ========================================================

    return {

        text:
`❓ I didn't understand that action.

Try:

• Explore
• Rest
• Search
• Leave`

    };

}
// ============================================================
// COMBAT SYSTEM
// Part 2B
// ============================================================

async function battle(session, action) {

    const enemy = session.state.enemy;

    if (!enemy) {

        return {
            text: "There's nothing to fight."
        };

    }

    const player = session.player;

    // ===========================
    // ATTACK
    // ===========================

    if (action === "attack") {

        const playerDamage =
            Math.max(
                1,
                player.attack +
                Math.floor(Math.random() * 6) -
                enemy.defense
            );

        enemy.hp -= playerDamage;

        if (enemy.hp <= 0) {

            session.state.enemy = null;

            const reward = rewardPlayer(
                player.id,
                enemy.xp,
                enemy.coins
            );

            return {

                text:
`⚔ You defeated the ${enemy.name}!

⭐ XP +${reward.xp}
🪙 Coins +${reward.coins}

${reward.loot
? `🎁 Loot: ${reward.loot}`
: "No loot dropped."}

➡ Continue exploring!`

            };

        }

        const enemyDamage =
            Math.max(
                1,
                enemy.attack -
                player.defense +
                Math.floor(Math.random() * 4)
            );

        player.hp -= enemyDamage;

        if (player.hp <= 0) {

            player.hp = player.maxHp;

            player.coins =
                Math.max(
                    0,
                    player.coins - 50
                );

            session.state.enemy = null;

            return {

                text:
`💀 You were defeated...

You lost 50 coins.

❤️ You respawn at camp.`

            };

        }

        return {

            text:
`⚔ You hit ${enemy.name}
-${playerDamage} HP

👹 ${enemy.name} hits back
-${enemyDamage} HP

❤️ ${player.hp}/${player.maxHp}
👹 ${enemy.hp} HP`

        };

    }

    // ===========================
    // DEFEND
    // ===========================

    if (action === "defend") {

        const damage = Math.max(
            0,
            enemy.attack -
            player.defense - 3
        );

        player.hp -= damage;

        return {

            text:
`🛡 You defend yourself.

Enemy deals only ${damage} damage.`

        };

    }

    // ===========================
    // RUN
    // ===========================

    if (action === "run") {

        if (Math.random() < 0.70) {

            session.state.enemy = null;

            return {

                text:
`🏃 You escaped successfully!`

            };

        }

        return {

            text:
`❌ Escape failed!

The ${enemy.name} blocks your path!`

        };

    }

    return {

        text:
`Choose:

⚔ Attack
🛡 Defend
🏃 Run`

    };

}

// ============================================================
// HANDLE COMBAT
// ============================================================

const originalHandleInput = handleInput;

handleInput = async function(session, input){

    input = String(input).toLowerCase();

    if(session.state.enemy){

        return battle(session,input);

    }

    return originalHandleInput(session,input);

};

// ============================================================
// STORY COMPLETE
// ============================================================

function finishStory(session){

    session.state.completed=true;

    rewardPlayer(
        session.player.id,
        500,
        1000
    );

    return{

text:
`🏆 Congratulations!

You completed AI Story Mode!

⭐ +500 XP
🪙 +1000 Coins

More adventures await...`

    };

}
// ============================================================
// AI STORY ENDINGS
// Part 3A
// ============================================================

const endings = [

{
title:"🏆 Hero Ending",
text:
`You defeated every challenge.

The kingdom celebrates your victory.

People will remember your name forever.`
},

{
title:"💀 Dark Ending",
text:
`Power corrupted you.

You become the new ruler of darkness.

Legends fear your return.`
},

{
title:"🕊 Peace Ending",
text:
`Instead of fighting...

You united everyone together.

Peace spreads across the land.`
},

{
title:"😂 Lucky Ending",
text:
`You accidentally saved the world.

Nobody knows how.

Not even you.`
}

];

// ============================================================
// RANDOM ENDING
// ============================================================

function getEnding() {

    return endings[
        Math.floor(
            Math.random() * endings.length
        )
    ];

}

function finishAdventure(session) {

    const ending = getEnding();

    rewardPlayer(
        session.player.id,
        800,
        1500
    );

    session.state.completed = true;

    return {

        text:

`${ending.title}

━━━━━━━━━━━━━━

${ending.text}

━━━━━━━━━━━━━━

⭐ +800 XP
🪙 +1500 Coins

🎉 Adventure Complete!`

    };

}

// ============================================================
// RESTART GAME
// ============================================================

function restart(session) {

    session.state = {

        chapter: 1,

        scene: 0,

        completed: false,

        enemy: null,

        npc: null,

        loot: null,

        location: null

    };

    return start(session);

}

// ============================================================
// BUTTONS
// ============================================================

function getKeyboard(type = "main") {

    switch(type){

        case "battle":

            return [

                ["⚔ Attack"],

                ["🛡 Defend"],

                ["🏃 Run"]

            ];

        case "npc":

            return [

                ["💬 Talk"],

                ["🎁 Ask"],

                ["👋 Leave"]

            ];

        default:

            return [

                ["🌍 Explore"],

                ["🔍 Search"],

                ["🏕 Rest"],

                ["🚪 Leave"]

            ];

    }

}
// ============================================================
// STORY HISTORY
// ============================================================

function addHistory(session, text) {

    if (!session.history)
        session.history = [];

    session.history.push({
        text,
        time: Date.now()
    });

    if (session.history.length > 50)
        session.history.shift();

}

function getHistory(session) {

    if (!session.history)
        return [];

    return session.history;

}

// ============================================================
// DYNAMIC CHOICES
// ============================================================

function generateChoices(session) {

    if (session.state.enemy) {

        return [
            "Attack",
            "Defend",
            "Run"
        ];

    }

    if (session.state.npc) {

        return [
            "Talk",
            "Ask",
            "Leave"
        ];

    }

    return [
        "Explore",
        "Search",
        "Rest",
        "Inventory"
    ];

}

// ============================================================
// AI PROMPT
// ============================================================

function buildPrompt(session, userInput) {

    return `

You are the Game Master.

Player Level:
${session.player.level}

Player HP:
${session.player.hp}

Current Chapter:
${session.state.chapter}

Current Location:
${session.state.location || "Unknown"}

Player Action:
${userInput}

Continue the adventure naturally.

Give vivid descriptions.

Offer interesting consequences.

Keep responses under 180 words.

`;

}

// ============================================================
// INVENTORY VIEW
// ============================================================

function inventory(session){

    if(
        !session.player.inventory.length
    ){

        return "🎒 Inventory is empty.";

    }

    return session.player.inventory
        .map((x,i)=>`${i+1}. ${x}`)
        .join("\n");

}

// ============================================================
// SAVE STORY
// ============================================================

function saveStory(session){

    session.lastPlayed=Date.now();

}

// ============================================================
// EXPORTS
// ============================================================

module.exports={

    start,

    handleInput,

    battle,

    finishStory,

    finishAdventure,

    restart,

    getKeyboard,

    generateScene,

    nextChapter,

    randomNPC,

    randomEnemy,

    randomLocation,

    randomTreasure,

    randomTrap,

    addHistory,

    getHistory,

    generateChoices,

    buildPrompt,

    inventory,

    saveStory

};