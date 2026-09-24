// ============================================================
// Miss Aria Adventures
// Zombie Survival Mode
// zombieSurvival.js
// Part 1A
// ============================================================


// ============================================================
// ZOMBIE TYPES
// ============================================================

const zombies = [

    {
        name: "🧟 Walker",
        hp: 40,
        attack: 10,
        xp: 50,
        loot: "🍞 Food"
    },


    {
        name: "🧟‍♂️ Runner Zombie",
        hp: 80,
        attack: 20,
        xp: 120,
        loot: "🔪 Knife"
    },


    {
        name: "👹 Mutant Zombie",
        hp: 200,
        attack: 40,
        xp: 300,
        loot: "🔫 Weapon Parts"
    },


    {
        name: "☠ Alpha Zombie",
        hp: 500,
        attack: 70,
        xp: 1000,
        loot: "💎 Rare Loot"
    }

];


// ============================================================
// LOCATIONS
// ============================================================

const locations = [

    "🏚 Abandoned House",

    "🏥 Destroyed Hospital",

    "🏪 Empty Store",

    "🌲 Dark Forest",

    "🏙 Ruined City",

    "🛣 Highway"

];


// ============================================================
// START GAME
// ============================================================

function start(session){


    session.state = {

        day:1,

        location:"Safe House",

        zombie:null,

        infection:0,

        hunger:100,

        thirst:100,

        survived:false

    };



    session.player = {


        name:
        session.player?.name || "Survivor",


        hp:100,

        maxHp:100,


        attack:15,


        defense:5,


        level:1,


        xp:0,


        inventory:[

            "🔪 Knife",

            "🍞 Food"

        ]


    };



    return {


text:

`🧟 ZOMBIE SURVIVAL

The world has fallen.

Cities are silent.

The dead are walking.

You wake up inside a safe house.


❤️ HP:
100/100

🍖 Hunger:
100%

💧 Thirst:
100%

☣ Infection:
0%


Your survival begins...

Choose:

🌍 explore
🎒 inventory
📊 status`

    };


}



// ============================================================
// RANDOM ZOMBIE
// ============================================================

function randomZombie(){


    return {

        ...zombies[
            Math.floor(
                Math.random()
                *
                zombies.length
            )
        ]

    };


}



// ============================================================
// RANDOM LOCATION
// ============================================================

function randomLocation(){


    return locations[

        Math.floor(

            Math.random()
            *
            locations.length

        )

    ];

}
// ============================================================
// ZOMBIE SURVIVAL
// Part 1B
// Exploration + Events + Loot
// ============================================================


// ============================================================
// EXPLORE WORLD
// ============================================================

function explore(session){


    const location =
        randomLocation();


    session.state.location =
        location;



    session.state.hunger -= 10;

    session.state.thirst -= 15;



    if(session.state.hunger <= 0){

        session.player.hp -= 10;

    }


    if(session.state.thirst <= 0){

        session.player.hp -= 15;

    }



    const chance =
        Math.random();



    // Zombie encounter

    if(chance < 0.50){


        const zombie =
            randomZombie();



        session.state.zombie =
            zombie;



        return {


text:

`🌍 EXPLORATION

Location:

${location}


You hear strange noises...


⚠️ A zombie appeared!


${zombie.name}

❤️ HP:
${zombie.hp}

⚔ Attack:
${zombie.attack}


Prepare yourself.

Commands:

attack
run`

        };


    }



    // Loot event

    if(chance < 0.80){


        return findLoot(session);


    }



    // Survivor event

    return randomEvent(session);


}



// ============================================================
// LOOT SYSTEM
// ============================================================

function findLoot(session){


    const loot = [

        "🔫 Pistol",

        "🧪 Medicine",

        "🍖 Food",

        "💧 Water",

        "🔋 Battery",

        "🔪 Better Knife"

    ];



    const item =

        loot[

            Math.floor(

                Math.random()
                *
                loot.length

            )

        ];



    session.player.inventory.push(
        item
    );



    return {


text:

`🎒 LOOT FOUND!


You searched the area.

You found:

${item}


Added to inventory.`

    };


}



// ============================================================
// RANDOM EVENTS
// ============================================================

function randomEvent(session){


    const events = [


`🧍 You found another survivor.

They warned you about a dangerous zombie nest.`,


`🏚 You found an abandoned shelter.

It may be useful later.`,


`📻 You discovered a working radio.

Someone is calling for help...`,


`🚁 You hear a helicopter far away.

Are survivors still alive?`

    ];



    const event =

        events[

            Math.floor(

                Math.random()
                *
                events.length

            )

        ];



    return {


text:event

    };


}



// ============================================================
// INVENTORY
// ============================================================

function inventory(session){


    return {


text:

`🎒 INVENTORY


${
session.player.inventory.length

?

session.player.inventory.join("\n")

:

"Empty"

}`

    };


}



// ============================================================
// STATUS
// ============================================================

function status(session){


return {


text:

`🧟 SURVIVAL STATUS

━━━━━━━━━━━━━━

📅 Day:
${session.state.day}


📍 Location:
${session.state.location}


❤️ HP:
${session.player.hp}/${session.player.maxHp}


⭐ Level:
${session.player.level}


⚔ Attack:
${session.player.attack}


🍖 Hunger:
${session.state.hunger}%


💧 Thirst:
${session.state.thirst}%


☣ Infection:
${session.state.infection}%

━━━━━━━━━━━━━━`

};


}



// ============================================================
// ADVANCE DAY
// ============================================================

function nextDay(session){


    session.state.day++;


    session.state.hunger -= 20;

    session.state.thirst -= 25;



    return {


text:

`🌅 DAY ${session.state.day}


Another day begins...


The zombies are getting stronger.`

    };


}
// ============================================================
// ZOMBIE SURVIVAL
// Part 2A
// Combat System + Weapons + Attacks
// ============================================================


// ============================================================
// START COMBAT
// ============================================================

function startBattle(session){


    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ No zombie nearby.`

        };


    }



    return {


text:

`⚔️ COMBAT STARTED


🧟 Enemy:

${zombie.name}


❤️ Zombie HP:

${zombie.hp}


⚔ Zombie Damage:

${zombie.attack}


Choose:

attack
weapon
run`

    };


}



// ============================================================
// NORMAL ATTACK
// ============================================================

function attack(session){


    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ No zombie to attack.`

        };

    }



    let damage =

        session.player.attack +

        Math.floor(
            Math.random() * 15
        );



    // Critical hit

    if(Math.random() < 0.20){


        damage *= 2;


    }



    zombie.hp -= damage;



    let message =

`⚔️ You attacked!


${zombie.name}

-${damage} HP`;




    if(zombie.hp <= 0){


        return victory(session);

    }



    // Zombie attacks back

    const zombieDamage =

        Math.max(

            1,

            zombie.attack -
            session.player.defense

        );



    session.player.hp -= zombieDamage;



    // Infection chance

    if(Math.random() < 0.15){


        session.state.infection += 10;


        message +=

`

☣️ Zombie bite!

+10% Infection`;

    }



    message +=

`

🧟 Zombie attacks!

-${zombieDamage} HP


❤️ Your HP:

${session.player.hp}/${session.player.maxHp}`;



    return {


text:message

    };


}



// ============================================================
// WEAPON ATTACK
// ============================================================

function useWeapon(session){


    const inventory =
        session.player.inventory;



    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ No enemy.`

        };

    }



    let weaponDamage = 0;

    let weaponName =
        "Hands";



    if(inventory.includes("🔫 Pistol")){


        weaponDamage = 60;

        weaponName =
        "🔫 Pistol";

    }


    else if(
        inventory.includes("🔪 Better Knife")
    ){


        weaponDamage = 40;

        weaponName =
        "🔪 Better Knife";

    }


    else if(
        inventory.includes("🔪 Knife")
    ){


        weaponDamage = 25;

        weaponName =
        "🔪 Knife";

    }



    else{


        weaponDamage = 10;


    }



    zombie.hp -= weaponDamage;



    if(zombie.hp <= 0){


        return victory(session);

    }



    const damageTaken =

        Math.max(

            1,

            zombie.attack -
            session.player.defense

        );



    session.player.hp -= damageTaken;



    return {


text:

`💥 Weapon Attack!


Weapon:

${weaponName}


🧟 Damage:

-${weaponDamage}


Zombie hits back!


❤️ You lose:

-${damageTaken} HP`

    };


}



// ============================================================
// RUN FROM ZOMBIE
// ============================================================

function run(session){


    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ Nothing chasing you.`

        };

    }



    if(Math.random() < 0.60){


        session.state.zombie =
            null;



        return {


text:

`🏃 You escaped!


The zombie disappears into the darkness.`

        };


    }



    const damage =
        zombie.attack;



    session.player.hp -= damage;



    return {


text:

`❌ Escape failed!


🧟 ${zombie.name}

attacked you!


-${damage} HP`

    };


}



// ============================================================
// VICTORY
// ============================================================

function victory(session){


    const zombie =
        session.state.zombie;



    const xp =
        zombie.xp || 50;



    session.player.xp += xp;



    session.player.level =

        Math.floor(
            session.player.xp / 500
        ) + 1;



    if(zombie.loot){


        session.player.inventory.push(
            zombie.loot
        );

    }



    session.state.zombie =
        null;



    return {


text:

`🏆 ZOMBIE DEFEATED!


🧟 Enemy:

${zombie.name}


⭐ XP:

+${xp}


🎁 Loot:

${zombie.loot || "None"}


Your survival continues...`

    };


}
// ============================================================
// ZOMBIE SURVIVAL
// Part 2A
// Combat System + Weapons + Attacks
// ============================================================


// ============================================================
// START COMBAT
// ============================================================

function startBattle(session){


    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ No zombie nearby.`

        };


    }



    return {


text:

`⚔️ COMBAT STARTED


🧟 Enemy:

${zombie.name}


❤️ Zombie HP:

${zombie.hp}


⚔ Zombie Damage:

${zombie.attack}


Choose:

attack
weapon
run`

    };


}



// ============================================================
// NORMAL ATTACK
// ============================================================

function attack(session){


    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ No zombie to attack.`

        };

    }



    let damage =

        session.player.attack +

        Math.floor(
            Math.random() * 15
        );



    // Critical hit

    if(Math.random() < 0.20){


        damage *= 2;


    }



    zombie.hp -= damage;



    let message =

`⚔️ You attacked!


${zombie.name}

-${damage} HP`;




    if(zombie.hp <= 0){


        return victory(session);

    }



    // Zombie attacks back

    const zombieDamage =

        Math.max(

            1,

            zombie.attack -
            session.player.defense

        );



    session.player.hp -= zombieDamage;



    // Infection chance

    if(Math.random() < 0.15){


        session.state.infection += 10;


        message +=

`

☣️ Zombie bite!

+10% Infection`;

    }



    message +=

`

🧟 Zombie attacks!

-${zombieDamage} HP


❤️ Your HP:

${session.player.hp}/${session.player.maxHp}`;



    return {


text:message

    };


}



// ============================================================
// WEAPON ATTACK
// ============================================================

function useWeapon(session){


    const inventory =
        session.player.inventory;



    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ No enemy.`

        };

    }



    let weaponDamage = 0;

    let weaponName =
        "Hands";



    if(inventory.includes("🔫 Pistol")){


        weaponDamage = 60;

        weaponName =
        "🔫 Pistol";

    }


    else if(
        inventory.includes("🔪 Better Knife")
    ){


        weaponDamage = 40;

        weaponName =
        "🔪 Better Knife";

    }


    else if(
        inventory.includes("🔪 Knife")
    ){


        weaponDamage = 25;

        weaponName =
        "🔪 Knife";

    }



    else{


        weaponDamage = 10;


    }



    zombie.hp -= weaponDamage;



    if(zombie.hp <= 0){


        return victory(session);

    }



    const damageTaken =

        Math.max(

            1,

            zombie.attack -
            session.player.defense

        );



    session.player.hp -= damageTaken;



    return {


text:

`💥 Weapon Attack!


Weapon:

${weaponName}


🧟 Damage:

-${weaponDamage}


Zombie hits back!


❤️ You lose:

-${damageTaken} HP`

    };


}



// ============================================================
// RUN FROM ZOMBIE
// ============================================================

function run(session){


    const zombie =
        session.state.zombie;



    if(!zombie){


        return {


text:

`❌ Nothing chasing you.`

        };

    }



    if(Math.random() < 0.60){


        session.state.zombie =
            null;



        return {


text:

`🏃 You escaped!


The zombie disappears into the darkness.`

        };


    }



    const damage =
        zombie.attack;



    session.player.hp -= damage;



    return {


text:

`❌ Escape failed!


🧟 ${zombie.name}

attacked you!


-${damage} HP`

    };


}



// ============================================================
// VICTORY
// ============================================================

function victory(session){


    const zombie =
        session.state.zombie;



    const xp =
        zombie.xp || 50;



    session.player.xp += xp;



    session.player.level =

        Math.floor(
            session.player.xp / 500
        ) + 1;



    if(zombie.loot){


        session.player.inventory.push(
            zombie.loot
        );

    }



    session.state.zombie =
        null;



    return {


text:

`🏆 ZOMBIE DEFEATED!


🧟 Enemy:

${zombie.name}


⭐ XP:

+${xp}


🎁 Loot:

${zombie.loot || "None"}


Your survival continues...`

    };


}
// ============================================================
// ZOMBIE SURVIVAL
// Part 2B
// Infection + Healing + Crafting + Survival Systems
// ============================================================


// ============================================================
// HEAL SYSTEM
// ============================================================

function heal(session){


    const inventory =
        session.player.inventory;



    const medicine =
        "🧪 Medicine";



    const index =
        inventory.indexOf(medicine);



    if(index === -1){


        return {


text:

`❌ You don't have medicine.`

        };


    }



    inventory.splice(index,1);



    const healAmount = 50;



    session.player.hp =

        Math.min(

            session.player.maxHp,

            session.player.hp + healAmount

        );



    return {


text:

`🧪 You used medicine.


❤️ +${healAmount} HP restored.`

    };


}



// ============================================================
// INFECTION SYSTEM
// ============================================================

function checkInfection(session){


    const infection =
        session.state.infection;



    if(infection >= 100){


        return {


dead:true,


text:

`☠ INFECTION COMPLETE


Your body couldn't survive...


The apocalypse claimed another victim.`

        };


    }



    if(infection >= 70){


        return {


text:

`⚠️ CRITICAL INFECTION


Your vision is fading.

Find medicine immediately.`

        };


    }



    if(infection >= 40){


        return {


text:

`☣ Infection spreading...


You feel weaker.`

        };


    }



    return {


text:

`✅ Infection level stable.`

    };


}



// ============================================================
// SURVIVAL EFFECTS
// ============================================================

function survivalEffects(session){



    let damage = 0;



    if(session.state.hunger <= 20){


        damage += 5;

    }



    if(session.state.thirst <= 20){


        damage += 10;

    }



    if(damage > 0){


        session.player.hp -= damage;



        return {


text:

`⚠️ Survival Warning


You are suffering.


-${damage} HP


🍖 Hunger:

${session.state.hunger}%


💧 Thirst:

${session.state.thirst}%`

        };


    }



    return {


text:

`✅ You are surviving.`

    };


}



// ============================================================
// DRINK WATER
// ============================================================

function drinkWater(session){


    const inventory =
        session.player.inventory;



    const item =
        "💧 Water";



    const index =
        inventory.indexOf(item);



    if(index === -1){


        return {


text:

`❌ No water available.`

        };


    }



    inventory.splice(index,1);



    session.state.thirst =

        Math.min(

            100,

            session.state.thirst + 40

        );



    return {


text:

`💧 You drank water.


Thirst restored.`

    };


}



// ============================================================
// EAT FOOD
// ============================================================

function eatFood(session){


    const inventory =
        session.player.inventory;



    const food =
        "🍖 Food";



    const index =
        inventory.indexOf(food);



    if(index === -1){


        return {


text:

`❌ No food available.`

        };


    }



    inventory.splice(index,1);



    session.state.hunger =

        Math.min(

            100,

            session.state.hunger + 40

        );



    return {


text:

`🍖 You ate food.


Hunger restored.`

    };


}



// ============================================================
// CRAFTING SYSTEM
// ============================================================

function craft(session,item){


    const inventory =
        session.player.inventory;



    if(item === "knife"){



        if(
            inventory.includes("🔋 Battery")
        ){


            inventory.push(
                "🔪 Better Knife"
            );



            return {


text:

`🔨 Crafting complete!


Created:

🔪 Better Knife`

            };


        }



        return {


text:

`❌ Need:

🔋 Battery`

        };


    }



    if(item === "medkit"){


        inventory.push(
            "🧪 Medicine"
        );



        return {


text:

`🧪 Crafted Medicine`

        };


    }



    return {


text:

`❌ Unknown item.`

    };


}



// ============================================================
// SAFE HOUSE REST
// ============================================================

function rest(session){


    session.player.hp =

        Math.min(

            session.player.maxHp,

            session.player.hp + 30

        );



    session.state.day++;



    session.state.hunger -= 15;

    session.state.thirst -= 20;



    return {


text:

`🏕 Safe House Rest


🌅 Day:

${session.state.day}


❤️ HP restored


But zombies are still outside...`

    };


}
// ============================================================
// ZOMBIE SURVIVAL
// Part 3A
// AI Game Master + Story Memory + Horde Events
// ============================================================


// ============================================================
// STORY MEMORY
// ============================================================

function addHistory(session, text){


    if(!session.history){

        session.history = [];

    }



    session.history.push({

        text,

        time: Date.now()

    });



    // Keep last 50 events

    if(session.history.length > 50){

        session.history.shift();

    }

}



// ============================================================
// GET STORY HISTORY
// ============================================================

function getHistory(session){


    return session.history || [];


}



// ============================================================
// AI ZOMBIE GAME MASTER PROMPT
// ============================================================

function buildZombiePrompt(
    session,
    action
){


return `

You are Miss Aria, Zombie Survival Game Master.


Create an intense zombie apocalypse adventure.


PLAYER:

Name:
${session.player.name}


Level:
${session.player.level}


XP:
${session.player.xp}


❤️ Health:

${session.player.hp}/${session.player.maxHp}



SURVIVAL:

Day:
${session.state.day}


Location:

${session.state.location}


🍖 Hunger:

${session.state.hunger}%


💧 Thirst:

${session.state.thirst}%


☣ Infection:

${session.state.infection}%



Inventory:

${session.player.inventory.join(", ")}



Player Action:

${action}



RULES:

- Describe cinematic zombie scenes.
- Give dangerous choices.
- Remember previous events.
- Create unexpected situations.
- Do not instantly save the player.
- Make every decision matter.
- Keep responses under 250 words.


`;

}



// ============================================================
// RANDOM APOCALYPSE EVENTS
// ============================================================

function apocalypseEvent(session){


    const events = [



{

title:"🚨 Zombie Horde",

text:
"A massive zombie group is moving toward your location."

},



{

title:"📻 Unknown Radio Signal",

text:
"A survivor is broadcasting coordinates."

},



{

title:"🚁 Military Signal",

text:
"A military evacuation message appears."

},



{

title:"🧟 Mutant Attack",

text:
"A strange mutated zombie appears nearby."

},



{

title:"🏚 Survivor Camp",

text:
"You discover a hidden survivor camp."

}



];



const event =

events[

Math.floor(

Math.random()
*
events.length

)

];



return {


title:event.title,


text:event.text

};


}



// ============================================================
// ZOMBIE HORDE ATTACK
// ============================================================

function zombieHorde(session){



const damage =

Math.floor(
Math.random() * 40
)
+
20;



session.player.hp -= damage;



session.state.infection += 15;



return {


text:

`🚨 ZOMBIE HORDE!


Hundreds of zombies surround you!


-${damage} HP


☣ +15% Infection


You barely escaped...`

};



}



// ============================================================
// MUTANT ENCOUNTER
// ============================================================

function mutantEncounter(session){



const mutant = {


name:"🧟‍♂️ Bio Mutant",


hp:300,


attack:60,


xp:500,


loot:"🧬 Mutant Serum"

};



session.state.zombie =
mutant;



return {


text:

`⚠️ MUTANT DETECTED!


A powerful creature appears.


${mutant.name}


❤️ HP:

${mutant.hp}


⚔ Attack:

${mutant.attack}


Prepare for battle!`

};



}



// ============================================================
// SURVIVAL ENDINGS
// ============================================================

function survivalEnding(session){



if(
session.state.day >= 30 &&
session.player.hp > 0
){


return {


title:"🏆 Apocalypse Survivor",


text:

`You survived 30 days.

Humanity remembers your name.

You became a legend.`

};


}



if(
session.state.infection >= 100
){


return {


title:"☠ Lost Survivor",


text:

`The infection took over.

You became part of the undead.`

};


}



return {


title:"🧟 Unknown Fate",


text:

`Your story continues...`

};


}
// ============================================================
// ZOMBIE SURVIVAL
// Part 3B
// Keyboard + Router + Save + Exports
// ============================================================



// ============================================================
// GAME KEYBOARD
// ============================================================

function getKeyboard(type = "main"){


    if(type === "combat"){


        return [

            [
                "⚔ Attack",
                "🔫 Weapon"
            ],

            [
                "🏃 Run"
            ]

        ];


    }



    if(type === "survival"){


        return [

            [
                "🌍 Explore"
            ],

            [
                "🎒 Inventory",
                "📊 Status"
            ],

            [
                "🍖 Eat",
                "💧 Drink"
            ],

            [
                "🧪 Heal",
                "🏕 Rest"
            ]

        ];


    }



    return [

        [
            "🌍 Explore"
        ],

        [
            "🎒 Inventory",
            "📊 Status"
        ],

        [
            "⚔ Fight Zombie"
        ],

        [
            "🏕 Rest"
        ]

    ];

}



// ============================================================
// GAME INPUT ROUTER
// ============================================================

function handleInput(session,input){


    input =
    input.toLowerCase();



    // Combat mode

    if(session.state.zombie){


        switch(input){


            case "attack":

                return attack(session);



            case "weapon":

                return useWeapon(session);



            case "run":

                return run(session);



            default:

                return {


text:

`⚔ Combat:

attack
weapon
run`

                };


        }


    }



    switch(input){



        case "explore":

            return explore(session);



        case "inventory":

            return inventory(session);



        case "status":

            return status(session);



        case "eat":

            return eatFood(session);



        case "drink":

            return drinkWater(session);



        case "heal":

            return heal(session);



        case "rest":

            return rest(session);



        case "craft":

            return craft(
                session,
                "knife"
            );



        case "horde":

            return zombieHorde(session);



        case "mutant":

            return mutantEncounter(session);



        case "ending":

            return survivalEnding(session);



        default:

            return {


text:

`🧟 Zombie Survival Commands:


🌍 explore

🎒 inventory

📊 status

🍖 eat

💧 drink

🧪 heal

🏕 rest

🔨 craft`

            };


    }


}



// ============================================================
// SAVE SYSTEM
// ============================================================

function saveGame(session){


    session.lastSave =
        Date.now();



    return {


success:true,


savedAt:
session.lastSave


    };


}



// ============================================================
// RESET SURVIVAL
// ============================================================

function restart(session){


    session.state = null;


    session.history = [];



    return start(session);


}



// ============================================================
// FINAL EXPORTS
// ============================================================

module.exports = {

    // Start

    start,


    // Exploration

    explore,

    findLoot,

    randomEvent,

    randomLocation,


    // Status

    inventory,

    status,

    nextDay,


    // Combat

    startBattle,

    attack,

    useWeapon,

    run,

    victory,


    // Survival

    heal,

    checkInfection,

    survivalEffects,

    drinkWater,

    eatFood,

    craft,

    rest,


    // AI

    addHistory,

    getHistory,

    buildZombiePrompt,


    // Events

    apocalypseEvent,

    zombieHorde,

    mutantEncounter,

    survivalEnding,


    // Router

    handleInput,


    // UI

    getKeyboard,


    // Save

    saveGame,

    restart

};