// ============================================================
// Miss Aria Adventures
// Dungeon RPG Mode
// dungeonRPG.js
// Part 1A
// ============================================================


const {
    addXP,
    addCoins,
    addItem,
    rewardPlayer
} = require("./gameManager");


// ============================================================
// PLAYER CLASSES
// ============================================================

const classes = {

    knight: {

        name:"⚔ Knight",

        hp:150,

        attack:20,

        defense:15,

        skill:"Shield Strike"

    },


    mage: {

        name:"🔮 Mage",

        hp:90,

        attack:35,

        defense:5,

        skill:"Fire Blast"

    },


    rogue: {

        name:"🗡 Rogue",

        hp:110,

        attack:28,

        defense:10,

        skill:"Shadow Attack"

    }

};


// ============================================================
// MONSTERS
// ============================================================

const monsters = [

{

    name:"🧟 Dungeon Skeleton",

    hp:50,

    attack:10,

    defense:3,

    xp:80,

    coins:50,

    loot:"🦴 Bone Sword"

},


{

    name:"👹 Goblin Warrior",

    hp:80,

    attack:15,

    defense:5,

    xp:120,

    coins:80,

    loot:"🗡 Goblin Blade"

},


{

    name:"🐺 Shadow Wolf",

    hp:120,

    attack:22,

    defense:8,

    xp:200,

    coins:150,

    loot:"🐺 Wolf Fang"

},


{

    name:"🐉 Ancient Dragon",

    hp:500,

    attack:50,

    defense:20,

    xp:2000,

    coins:5000,

    loot:"🐲 Dragon Heart"

}

];


// ============================================================
// DUNGEON FLOORS
// ============================================================

const floors = [

{

floor:1,

name:"🪨 Forgotten Cave",

danger:30

},


{

floor:2,

name:"🔥 Burning Depths",

danger:50

},


{

floor:3,

name:"🌑 Shadow Realm",

danger:70

},


{

floor:4,

name:"☠ Demon Fortress",

danger:90

}

];


// ============================================================
// RANDOM HELPERS
// ============================================================

function randomMonster(){


return {

    ...monsters[
        Math.floor(
            Math.random()
            *
            monsters.length
        )
    ]

};


}



function randomFloor(){


return floors[
    Math.floor(
        Math.random()
        *
        floors.length
    )
];


}



// ============================================================
// START DUNGEON
// ============================================================

function start(session){


session.state = {


    floor:1,


    location:"Dungeon Entrance",


    monster:null,


    treasure:false,


    completed:false,


    class:null


};



return {


text:

`🏰 DUNGEON RPG

Welcome, adventurer.

The ancient dungeon awaits.

Choose your class:

⚔ Knight
🔮 Mage
🗡 Rogue


Type:

knight
mage
rogue`

};


}



// ============================================================
// CHOOSE CLASS
// ============================================================

function chooseClass(session,type){


type =
type.toLowerCase();



const playerClass =
classes[type];



if(!playerClass){


return {

text:

`❌ Unknown class.

Choose:

knight
mage
rogue`

};


}



session.state.class =
type;



session.player.maxHp =
playerClass.hp;


session.player.hp =
playerClass.hp;


session.player.attack =
playerClass.attack;


session.player.defense =
playerClass.defense;



return {


text:

`${playerClass.name}

has been chosen!

❤️ HP:
${playerClass.hp}

⚔ Attack:
${playerClass.attack}

🛡 Defense:
${playerClass.defense}

✨ Skill:
${playerClass.skill}


The dungeon door opens...`

};


}
// ============================================================
// DUNGEON RPG
// Part 1B
// Exploration + Treasure + Traps
// ============================================================


// ============================================================
// DUNGEON EXPLORATION
// ============================================================

function exploreDungeon(session){


    if(!session.state.class){

        return {

            text:
`❌ Choose a class first.

⚔ knight
🔮 mage
🗡 rogue`

        };

    }



    const floor =
        floors.find(
            f =>
            f.floor === session.state.floor
        );



    let event =
        Math.random();



    // Monster encounter

    if(event < 0.45){


        const monster =
            randomMonster();



        session.state.monster =
            monster;



        return {


text:

`🏰 ${floor.name}

You walk deeper...

Something moves in the darkness.

👹 ${monster.name}

❤️ HP:
${monster.hp}

⚔ Attack:
${monster.attack}


Prepare for battle!`

        };


    }



    // Treasure room

    if(event < 0.75){


        return findTreasure(session);


    }



    // Trap

    return dungeonTrap(session);


}



// ============================================================
// TREASURE SYSTEM
// ============================================================

function findTreasure(session){


    const treasures = [


        "💎 Ancient Gem",

        "🪙 Gold Chest",

        "🧪 Health Potion",

        "⚔ Magic Sword",

        "🛡 Iron Armor"

    ];



    const item =
        treasures[
            Math.floor(
                Math.random()
                *
                treasures.length
            )
        ];



    addItem(
        session.player.id,
        item
    );



    session.state.treasure =
        true;



    return {


text:

`🎁 TREASURE ROOM!

You discovered:

${item}

The dungeon grows darker...`

    };


}



// ============================================================
// TRAPS
// ============================================================

function dungeonTrap(session){


    const traps = [

        {
            name:"Spike Trap",
            damage:15
        },


        {
            name:"Poison Dart",
            damage:25
        },


        {
            name:"Fire Trap",
            damage:35
        }

    ];



    const trap =
        traps[
            Math.floor(
                Math.random()
                *
                traps.length
            )
        ];



    session.player.hp -=
        trap.damage;



    return {


text:

`⚠ DUNGEON TRAP!

${trap.name}

-${trap.damage} HP

❤️ Remaining:

${session.player.hp}/${session.player.maxHp}`

    };


}



// ============================================================
// NEXT FLOOR
// ============================================================

function nextFloor(session){


    if(
        session.state.floor >= floors.length
    ){


        return {


text:

`🏆 You reached the final dungeon!

The ancient boss awaits...`

        };


    }



    session.state.floor++;



    session.state.location =
        floors[
            session.state.floor - 1
        ].name;



    return {


text:

`⬇ You descend deeper...

🏰 Floor:

${session.state.floor}

📍 Location:

${session.state.location}


Danger increases...`

    };


}



// ============================================================
// REST INSIDE DUNGEON
// ============================================================

function dungeonRest(session){


    const heal = 20;



    session.player.hp =
        Math.min(
            session.player.maxHp,
            session.player.hp + heal
        );



    return {


text:

`🔥 You rest beside a dungeon fire.

❤️ +${heal} HP restored.

But the monsters are getting closer...`

    };


}



// ============================================================
// DUNGEON STATUS
// ============================================================

function dungeonStatus(session){


return `

🏰 DUNGEON STATUS

📍 Floor:
${session.state.floor}

Location:
${session.state.location}

❤️ HP:
${session.player.hp}/${session.player.maxHp}

⚔ Attack:
${session.player.attack}

🛡 Defense:
${session.player.defense}

🎒 Inventory:

${
session.player.inventory.length
?
session.player.inventory.join("\n")
:
"Empty"
}

`;

}
// ============================================================
// DUNGEON RPG
// Part 2A
// Combat System + Skills + Items
// ============================================================


// ============================================================
// START BATTLE
// ============================================================

function startBattle(session){


    const monster =
        session.state.monster;



    if(!monster){


        return {

            text:
`❌ No monster nearby.`

        };

    }



    return {


text:

`⚔ BATTLE START!

👹 Enemy:
${monster.name}

❤️ Enemy HP:
${monster.hp}

⚔ Enemy Attack:
${monster.attack}


Choose:

attack
skill
potion
run`

    };


}



// ============================================================
// PLAYER NORMAL ATTACK
// ============================================================

function attack(session){


    const monster =
        session.state.monster;



    if(!monster){

        return {

            text:
`❌ No enemy.`

        };

    }



    let damage =
        Math.floor(
            Math.random()*10
        )
        +
        session.player.attack;



    // critical hit

    if(Math.random() < 0.15){


        damage *= 2;


    }



    damage =
        Math.max(
            1,
            damage - monster.defense
        );



    monster.hp -= damage;



    if(monster.hp <= 0){


        return victory(session);

    }



    // enemy turn

    const enemyDamage =
        Math.max(
            1,
            monster.attack -
            session.player.defense
        );



    session.player.hp -= enemyDamage;



    return {


text:

`⚔ You attacked!

-${damage} HP to ${monster.name}


👹 ${monster.name} attacks!

-${enemyDamage} HP


❤️ Your HP:

${session.player.hp}/${session.player.maxHp}


👹 Enemy HP:

${monster.hp}`

    };


}



// ============================================================
// CLASS SKILLS
// ============================================================

function useSkill(session){


    const type =
        session.state.class;



    const monster =
        session.state.monster;



    if(!monster){

        return {

            text:
`❌ No enemy.`

        };

    }



    let damage = 0;

    let skill = "";



    if(type === "knight"){


        skill =
        "🛡 Shield Strike";


        damage =
        session.player.attack + 30;


    }



    if(type === "mage"){


        skill =
        "🔥 Fire Blast";


        damage =
        session.player.attack + 50;


    }



    if(type === "rogue"){


        skill =
        "🌑 Shadow Attack";


        damage =
        session.player.attack + 40;


    }



    damage =
        Math.max(
            1,
            damage - monster.defense
        );



    monster.hp -= damage;



    if(monster.hp <= 0){


        return victory(session);

    }



    const enemyDamage =
        monster.attack;



    session.player.hp -= enemyDamage;



    return {


text:

`${skill}

💥 Damage:

-${damage}


👹 ${monster.name} attacks back!

-${enemyDamage} HP`

    };


}



// ============================================================
// POTION SYSTEM
// ============================================================

function usePotion(session){


    const inventory =
        session.player.inventory;



    const potion =
        "🧪 Health Potion";



    const index =
        inventory.indexOf(potion);



    if(index === -1){


        return {


text:

`❌ No health potion.`

        };

    }



    inventory.splice(index,1);



    session.player.hp =
        Math.min(
            session.player.maxHp,
            session.player.hp + 50
        );



    return {


text:

`🧪 You drank a Health Potion.

❤️ +50 HP restored.`

    };


}



// ============================================================
// ESCAPE BATTLE
// ============================================================

function escapeBattle(session){


    if(Math.random() < 0.60){


        session.state.monster =
            null;



        return {


text:

`🏃 You escaped the battle.`

        };


    }



    const monster =
        session.state.monster;



    session.player.hp -=
        monster.attack;



    return {


text:

`❌ Escape failed!

👹 ${monster.name}

-${monster.attack} HP`

    };


}
// ============================================================
// DUNGEON RPG
// Part 2B
// Rewards + Boss + Equipment + Combat Router
// ============================================================


// ============================================================
// VICTORY SYSTEM
// ============================================================

function victory(session){


    const monster =
        session.state.monster;



    if(!monster){

        return {

            text:
`❌ No monster defeated.`

        };

    }



    const xp =
        monster.xp;


    const coins =
        monster.coins;



    rewardPlayer(
        session.player.id,
        xp,
        coins
    );



    if(monster.loot){


        addItem(
            session.player.id,
            monster.loot
        );

    }



    session.state.monster =
        null;



    return {


text:

`🏆 VICTORY!

You defeated:

${monster.name}


⭐ XP:
+${xp}


🪙 Coins:
+${coins}


🎁 Loot:

${monster.loot || "Nothing"}

`

    };


}



// ============================================================
// LEVEL SYSTEM
// ============================================================

function levelUp(session){


    const player =
        session.player;



    if(!player.xp){

        player.xp = 0;

    }



    if(!player.level){

        player.level = 1;

    }



    const required =
        player.level * 500;



    if(
        player.xp >= required
    ){


        player.level++;


        player.maxHp += 30;


        player.attack += 10;


        player.defense += 5;


        player.hp =
            player.maxHp;



        return {


text:

`⬆ LEVEL UP!

You reached:

Level ${player.level}


❤️ HP increased

⚔ Attack increased

🛡 Defense increased`

        };

    }



    return null;


}



// ============================================================
// EQUIPMENT SYSTEM
// ============================================================

function equipItem(session,item){


    const inventory =
        session.player.inventory;



    if(
        !inventory.includes(item)
    ){


        return {


text:

`❌ You don't own:

${item}`

        };

    }



    session.player.weapon =
        item;



    let bonus = 0;



    if(
        item.includes("Sword") ||
        item.includes("Blade")
    ){

        bonus = 15;

    }



    if(
        item.includes("Armor")
    ){

        session.player.defense += 15;


    }



    session.player.attack += bonus;



    return {


text:

`⚔ Equipped:

${item}


Stats increased!`

    };


}



// ============================================================
// BOSS BATTLE
// ============================================================

function startBoss(session){


    if(
        session.state.floor <
        floors.length
    ){


        return {


text:

`❌ You haven't reached the final floor.`

        };


    }



    const boss = {

        name:"🐉 Ancient Dragon",

        hp:500,

        attack:60,

        defense:25,

        xp:3000,

        coins:10000,

        loot:"🐲 Dragon Slayer Sword"

    };



    session.state.monster =
        boss;



    return {


text:

`🐉 FINAL BOSS!

The Ancient Dragon awakens.

❤️ HP:

${boss.hp}


⚔ Attack:

${boss.attack}


Defeat it to conquer the dungeon.`

    };


}



// ============================================================
// COMBAT INPUT ROUTER
// ============================================================

function combatInput(session,input){


    input =
    input.toLowerCase();



    switch(input){


        case "attack":

            return attack(session);



        case "skill":

            return useSkill(session);



        case "potion":

            return usePotion(session);



        case "run":

            return escapeBattle(session);



        default:

            return {


text:

`⚔ Choose:

attack
skill
potion
run`

            };

    }


}



// ============================================================
// DUNGEON RESET
// ============================================================

function restartDungeon(session){


    session.state = {


        floor:1,


        location:"Dungeon Entrance",


        monster:null,


        treasure:false,


        completed:false,


        class:null


    };



    session.player.hp =
        session.player.maxHp;



    return start(session);


}
// ============================================================
// DUNGEON RPG
// Part 3A
// Endings + Legendary Rooms + AI Memory
// ============================================================


// ============================================================
// LEGENDARY ROOMS
// ============================================================

const legendaryRooms = [

    {
        name:"💎 Crystal Chamber",
        reward:"💎 Legendary Crystal"
    },


    {
        name:"📚 Ancient Library",
        reward:"📜 Lost Spell Book"
    },


    {
        name:"⚔ Warrior Tomb",
        reward:"⚔ Hero's Sword"
    },


    {
        name:"👑 Royal Vault",
        reward:"👑 Golden Crown"
    }

];


// ============================================================
// FIND LEGENDARY ROOM
// ============================================================

function legendaryRoom(session){


    const room =
        legendaryRooms[
            Math.floor(
                Math.random()
                *
                legendaryRooms.length
            )
        ];



    addItem(
        session.player.id,
        room.reward
    );



    return {


text:

`✨ LEGENDARY ROOM FOUND!

${room.name}

You discovered:

🎁 ${room.reward}

The dungeon whispers your name...`

    };


}



// ============================================================
// FINAL DUNGEON ENDINGS
// ============================================================

const dungeonEndings = [


{

title:"🏆 Dungeon Champion",

text:
"You conquered the dungeon and became a legend among adventurers."

},


{

title:"🐉 Dragon Slayer",

text:
"You destroyed the Ancient Dragon and claimed its treasure."

},


{

title:"🌑 Dark Lord Ending",

text:
"The dungeon accepted you as its new ruler."

},


{

title:"💀 Lost Hero",

text:
"You vanished inside the dungeon, becoming a mysterious legend."

}


];



// ============================================================
// COMPLETE DUNGEON
// ============================================================

function completeDungeon(session){


    const ending =
        dungeonEndings[
            Math.floor(
                Math.random()
                *
                dungeonEndings.length
            )
        ];



    session.state.completed =
        true;



    rewardPlayer(
        session.player.id,
        5000,
        20000
    );



    return {


text:

`${ending.title}

━━━━━━━━━━━━━━

${ending.text}

━━━━━━━━━━━━━━

⭐ +5000 XP

🪙 +20000 Coins

🏰 Dungeon Completed!`

    };


}



// ============================================================
// ADVENTURE HISTORY
// ============================================================

function addHistory(session,text){


    if(!session.history){

        session.history=[];

    }



    session.history.push({

        text,

        time:Date.now()

    });



    if(session.history.length > 50){

        session.history.shift();

    }

}



// ============================================================
// GET HISTORY
// ============================================================

function getHistory(session){


    return session.history || [];


}



// ============================================================
// AI DUNGEON MASTER PROMPT
// ============================================================

function buildDungeonPrompt(
    session,
    action
){


return `

You are Miss Aria, Dungeon Master.

Create an epic fantasy RPG adventure.

PLAYER:

Class:
${session.state.class || "Unknown"}

Level:
${session.player.level || 1}

HP:
${session.player.hp}/${session.player.maxHp}

Attack:
${session.player.attack}

Defense:
${session.player.defense}


DUNGEON:

Floor:
${session.state.floor}

Location:
${session.state.location}


Inventory:

${session.player.inventory.join(", ")}


Player Action:

${action}


Rules:

- Describe fantasy scenes.
- Create dangerous choices.
- Reward creativity.
- Keep responses under 200 words.
- Act like a legendary RPG narrator.

`;

}
// ============================================================
// DUNGEON RPG
// Part 3B
// Keyboard + Save System + Exports
// ============================================================


// ============================================================
// GAME KEYBOARD
// ============================================================

function getKeyboard(type = "main"){


    if(type === "combat"){


        return [

            [
                "⚔ Attack",
                "✨ Skill"
            ],

            [
                "🧪 Potion",
                "🏃 Run"
            ]

        ];

    }



    if(type === "explore"){


        return [

            [
                "🏰 Explore"
            ],

            [
                "🔍 Search Room",
                "⬇ Next Floor"
            ],

            [
                "📊 Status"
            ]

        ];

    }



    return [

        [
            "🏰 Explore"
        ],

        [
            "⚔ Battle"
        ],

        [
            "🎒 Inventory"
        ],

        [
            "📊 Status"
        ],

        [
            "🔥 Rest"
        ]

    ];

}



// ============================================================
// GAME SAVE
// ============================================================

function saveDungeon(session){


    session.lastSave =
        Date.now();



    return {


        success:true,


        time:session.lastSave

    };


}



// ============================================================
// DUNGEON GAME ROUTER
// ============================================================

function handleInput(session,input){


    input =
    input.toLowerCase();



    if(
        session.state.monster
    ){

        return combatInput(
            session,
            input
        );

    }



    switch(input){


        case "explore":

            return exploreDungeon(session);



        case "search":

            return legendaryRoom(session);



        case "next":

            return nextFloor(session);



        case "rest":

            return dungeonRest(session);



        case "status":

            return {


                text:
                dungeonStatus(session)

            };



        case "boss":

            return startBoss(session);



        case "restart":

            return restartDungeon(session);



        default:

            return {


text:

`🏰 Dungeon Commands:

explore
search
next
rest
status
boss
restart`

            };

    }


}



// ============================================================
// FINAL EXPORTS
// ============================================================

module.exports = {


    // Start

    start,


    chooseClass,


    // Exploration

    exploreDungeon,

    findTreasure,

    dungeonTrap,

    nextFloor,

    dungeonRest,

    dungeonStatus,

    legendaryRoom,


    // Combat

    startBattle,

    attack,

    useSkill,

    usePotion,

    escapeBattle,

    combatInput,


    // Rewards

    victory,

    levelUp,

    equipItem,


    // Boss

    startBoss,


    // Completion

    completeDungeon,

    restartDungeon,


    // AI

    addHistory,

    getHistory,

    buildDungeonPrompt,


    // Router

    handleInput,


    // UI

    getKeyboard,


    // Save

    saveDungeon

};