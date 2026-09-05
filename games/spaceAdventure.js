// ============================================================
// Miss Aria Adventures
// Space Adventure Mode
// spaceAdventure.js
// Part 1A
// ============================================================



// ============================================================
// PLANETS
// ============================================================

const planets = [

{
name:"🌎 Nova Earth",

danger:10,

loot:"💎 Crystal",

description:
"A peaceful planet rebuilding after a galactic war."

},


{
name:"🔴 Mars X",

danger:40,

loot:"🔋 Energy Core",

description:
"A dangerous abandoned colony."

},


{
name:"🪐 Saturn Outpost",

danger:60,

loot:"🛸 Alien Technology",

description:
"An old space station full of secrets."

},


{
name:"🌑 Shadow Moon",

danger:80,

loot:"👽 Alien Artifact",

description:
"A mysterious moon where ships disappear."

},


{
name:"🌌 Void Planet",

danger:100,

loot:"⭐ Ancient Galaxy Weapon",

description:
"A forbidden planet at the edge of space."

}

];



// ============================================================
// ENEMIES
// ============================================================

const enemies = [

{

name:"👽 Alien Scout",

hp:60,

attack:15,

reward:100

},


{

name:"🤖 Rogue Robot",

hp:120,

attack:30,

reward:250

},


{

name:"👹 Alien Commander",

hp:250,

attack:50,

reward:600

},


{

name:"☠ Galaxy Destroyer",

hp:500,

attack:90,

reward:1500

}

];



// ============================================================
// START GAME
// ============================================================

function start(session){


session.state = {


planet:"🌎 Nova Earth",


fuel:100,


credits:500,


ship:

{

name:"🚀 Guardian Explorer",

hp:100,

maxHp:100,

attack:20

},


enemy:null,


discovered:[],


ending:false


};



session.player = {


name:
session.player?.name || "Captain",


level:1,


xp:0,


inventory:[

"🔫 Basic Laser"

]


};



return {


text:

`🚀 SPACE ADVENTURE


Welcome Captain.


Your mission:

Explore the galaxy.

Discover planets.

Fight enemies.

Find lost technology.


🚀 Ship:

Guardian Explorer


❤️ Hull:

100/100


⛽ Fuel:

100%


💰 Credits:

500


Commands:


🌌 explore

🪐 planets

🚀 ship

🎒 inventory`

};


}



// ============================================================
// SHOW PLANETS
// ============================================================

function showPlanets(){


return {


text:

`🪐 GALAXY MAP


${

planets.map(

(p,i)=>

`${i+1}. ${p.name}

Danger:
${p.danger}%

${p.description}`

).join("\n\n")

}`

};


}
// ============================================================
// SPACE ADVENTURE
// Part 1B
// Exploration + Discoveries + Space Events
// ============================================================



// ============================================================
// EXPLORE GALAXY
// ============================================================

function explore(session){


    if(session.state.fuel <= 0){


        return {


text:

`⛽ NO FUEL!


Your ship cannot travel.


Find fuel or trade.`

        };


    }



    // consume fuel

    session.state.fuel -= 20;



    const planet =

    planets[

        Math.floor(

            Math.random()

            *

            planets.length

        )

    ];



    session.state.planet =
        planet.name;



    if(
        !session.state.discovered.includes(
            planet.name
        )
    ){


        session.state.discovered.push(
            planet.name
        );


    }



    const chance =
        Math.random();



    // Enemy encounter

    if(chance < 0.40){


        return alienEncounter(session,planet);


    }



    // Loot discovery

    if(chance < 0.75){


        return discoverLoot(session,planet);


    }



    return randomSpaceEvent(session);



}



// ============================================================
// ALIEN ENCOUNTER
// ============================================================

function alienEncounter(session,planet){



const enemy =

{

...enemies[

Math.floor(

Math.random()

*

enemies.length

)

]

};



session.state.enemy =
enemy;



return {


text:

`⚠️ SPACE ALERT!


Planet:

${planet.name}


An enemy ship detected!


👽 Enemy:

${enemy.name}


❤️ HP:

${enemy.hp}


⚔ Attack:

${enemy.attack}


Prepare for battle!


Commands:

attack

fire

escape`

};


}



// ============================================================
// FIND SPACE LOOT
// ============================================================

function discoverLoot(session,planet){



const loot = [

"💎 Crystal",

"🔋 Energy Core",

"🛸 Alien Technology",

"🪙 Ancient Coin",

"⚡ Plasma Battery",

"🧬 Alien DNA"

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



session.state.credits += 100;



return {


text:

`🌌 PLANET DISCOVERY


You landed on:

${planet.name}



You discovered:


🎁 ${item}


💰 +100 Credits


The galaxy hides many secrets.`

};


}



// ============================================================
// RANDOM SPACE EVENTS
// ============================================================

function randomSpaceEvent(session){



const events = [


{

title:"📡 Unknown Signal",

text:
"You receive a mysterious transmission from deep space."

},


{

title:"🛸 Friendly Aliens",

text:
"An alien civilization offers you assistance."

},


{

title:"☄ Asteroid Field",

text:
"You dodge a dangerous asteroid storm."

},


{

title:"🚀 Lost Explorer",

text:
"You find an abandoned spaceship."

},


{

title:"🌌 Galaxy Storm",

text:
"A cosmic storm damages your ship."

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



if(event.title.includes("Storm")){


session.state.ship.hp -= 15;


}



return {


text:

`🚀 SPACE EVENT


${event.title}


${event.text}`

};


}



// ============================================================
// GALAXY DISCOVERIES
// ============================================================

function discoveries(session){


return {


text:

`🌌 DISCOVERED PLANETS


${
session.state.discovered.length

?

session.state.discovered.join("\n")

:

"No planets discovered."

}`

};


}



// ============================================================
// SHIP STATUS
// ============================================================

function shipStatus(session){


const ship =
session.state.ship;



return {


text:

`🚀 SHIP STATUS


${ship.name}


❤️ Hull:

${ship.hp}/${ship.maxHp}


⚔ Weapon Power:

${ship.attack}


⛽ Fuel:

${session.state.fuel}%


💰 Credits:

${session.state.credits}`

};


}// ============================================================
// SPACE ADVENTURE
// Part 2A
// Space Combat + Alien Battles
// ============================================================



// ============================================================
// START SPACE BATTLE
// ============================================================

function startBattle(session){


    const enemy =
        session.state.enemy;



    if(!enemy){


        return {


text:

`❌ No enemy detected.`

        };


    }



    return {


text:

`⚔️ SPACE BATTLE


Enemy:

${enemy.name}


❤️ Enemy Hull:

${enemy.hp}


⚔ Enemy Damage:

${enemy.attack}



Your Ship:

${session.state.ship.name}


❤️ Hull:

${session.state.ship.hp}/${session.state.ship.maxHp}


Choose:


attack

laser

escape`

    };


}



// ============================================================
// NORMAL SHIP ATTACK
// ============================================================

function attack(session){


    const enemy =
        session.state.enemy;



    if(!enemy){


        return {


text:

`❌ No enemy ship.`

        };

    }



    let damage =

        session.state.ship.attack

        +

        Math.floor(
            Math.random() * 20
        );



    // Critical laser hit

    if(Math.random() < 0.20){


        damage *= 2;


    }



    enemy.hp -= damage;



    let result =

`🚀 WEAPON FIRED!


Enemy:

${enemy.name}


Damage:

-${damage}`;



    if(enemy.hp <= 0){


        return victory(session);

    }



    // Enemy counter attack

    const enemyDamage =

    enemy.attack;



    session.state.ship.hp -=
        enemyDamage;



    result +=


`

👽 Enemy attacked!


Ship damage:

-${enemyDamage}


🚀 Hull:

${session.state.ship.hp}/${session.state.ship.maxHp}`;



    return {


text:result

    };


}



// ============================================================
// LASER ATTACK
// ============================================================

function laserAttack(session){



const enemy =
session.state.enemy;



if(!enemy){


return {


text:

"❌ No enemy."

};


}



let damage = 80;



if(
session.player.inventory.includes(
"🛸 Alien Technology"
)
){


damage += 40;


}



enemy.hp -= damage;



if(enemy.hp <= 0){


return victory(session);

}



return {


text:

`⚡ PLASMA LASER!


Massive energy blast!


Damage:

-${damage}


Enemy Hull:

${enemy.hp}`

};



}



// ============================================================
// ESCAPE BATTLE
// ============================================================

function escape(session){



const enemy =
session.state.enemy;



if(!enemy){


return {


text:

"❌ Nothing chasing you."

};


}



if(Math.random() < 0.60){



session.state.enemy = null;



return {


text:

`🚀 ESCAPED!


You activated hyperspeed.

Enemy lost your signal.`

};



}



const damage =
enemy.attack;



session.state.ship.hp -= damage;



return {


text:

`❌ ESCAPE FAILED!


Enemy locked on.


-${damage} Hull Damage`

};



}



// ============================================================
// BATTLE VICTORY
// ============================================================

function victory(session){



const enemy =
session.state.enemy;



const reward =
enemy.reward || 100;



session.player.xp += reward;



session.state.credits += reward;



session.player.level =

Math.floor(
session.player.xp / 500
)

+

1;



session.state.enemy = null;



return {


text:

`🏆 SPACE VICTORY!


Enemy destroyed:


${enemy.name}


⭐ XP:

+${reward}


💰 Credits:

+${reward}



The galaxy becomes safer.`

};



}



// ============================================================
// REPAIR SHIP
// ============================================================

function repairShip(session){



const cost = 200;



if(
session.state.credits < cost
){


return {


text:

`❌ Not enough credits.


Need:

${cost}`

};


}



session.state.credits -= cost;



session.state.ship.hp =

session.state.ship.maxHp;



return {


text:

`🔧 SHIP REPAIRED!


Hull restored.


💰 Cost:

${cost} credits`

};


}
// ============================================================
// SPACE ADVENTURE
// Part 2B
// Ship Upgrades + Fuel + Trading System
// ============================================================



// ============================================================
// BUY FUEL
// ============================================================

function buyFuel(session){


const price = 100;



if(
session.state.credits < price
){


return {


text:

`❌ Not enough credits.


Fuel cost:

${price}`

};


}



session.state.credits -= price;



session.state.fuel =

Math.min(

100,

session.state.fuel + 50

);



return {


text:

`⛽ FUEL PURCHASED!


+50% Fuel


💰 Paid:

${price} credits`

};


}



// ============================================================
// UPGRADE SHIP ARMOR
// ============================================================

function upgradeArmor(session){



const price = 500;



if(
session.state.credits < price
){


return {


text:

`❌ Need more credits.


Upgrade cost:

${price}`

};


}



session.state.credits -= price;



session.state.ship.maxHp += 50;



session.state.ship.hp += 50;



return {


text:

`🛡 ARMOR UPGRADED!


New Hull:


${session.state.ship.maxHp}


Your ship is stronger.`

};



}



// ============================================================
// UPGRADE WEAPON
// ============================================================

function upgradeWeapon(session){



const price = 600;



if(
session.state.credits < price
){


return {


text:

`❌ Weapon upgrade unavailable.


Need:

${price} credits`

};


}



session.state.credits -= price;



session.state.ship.attack += 25;



return {


text:

`🔫 WEAPON UPGRADED!


Attack Power:


${session.state.ship.attack}


Enemies beware 🚀`

};



}



// ============================================================
// SPACE MARKET
// ============================================================

function market(session){



return {


text:

`🏪 GALACTIC MARKET


Available:


⛽ Fuel

100 credits


🛡 Armor Upgrade

500 credits


🔫 Weapon Upgrade

600 credits


Commands:


fuel

armor

weapon`

};



}



// ============================================================
// SELL ITEMS
// ============================================================

function sellItem(session,item){



const inventory =
session.player.inventory;



const index =
inventory.indexOf(item);



if(index === -1){


return {


text:

`❌ Item not found.`

};


}



inventory.splice(index,1);



const reward = 150;



session.state.credits += reward;



return {


text:

`💰 ITEM SOLD!


Sold:

${item}


+${reward} credits`

};



}



// ============================================================
// INVENTORY
// ============================================================

function inventory(session){



return {


text:

`🎒 SPACE INVENTORY


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
// CAPTAIN STATUS
// ============================================================

function status(session){



return {


text:

`👨‍🚀 CAPTAIN STATUS


⭐ Level:

${session.player.level}


XP:

${session.player.xp}



🚀 Ship:

${session.state.ship.name}



❤️ Hull:

${session.state.ship.hp}/${session.state.ship.maxHp}



⚔ Attack:

${session.state.ship.attack}



⛽ Fuel:

${session.state.fuel}%



💰 Credits:

${session.state.credits}`

};



}



// ============================================================
// TRADE ALIEN TECHNOLOGY
// ============================================================

function tradeTechnology(session){



const item =
"🛸 Alien Technology";



const index =

session.player.inventory.indexOf(item);



if(index === -1){


return {


text:

`❌ You don't have alien technology.`

};


}



session.player.inventory.splice(
index,
1
);



session.state.credits += 1000;



return {


text:

`🛸 ALIEN TECHNOLOGY SOLD!


+1000 Credits`

};


}
// ============================================================
// SPACE ADVENTURE
// Part 3A
// AI Space Captain + Memory + Galaxy Events
// ============================================================



// ============================================================
// SPACE MEMORY SYSTEM
// ============================================================

function addHistory(session, action){


    if(!session.history){

        session.history = [];

    }



    session.history.push({

        action,

        time: Date.now()

    });



    // Keep latest 50 actions

    if(session.history.length > 50){

        session.history.shift();

    }


}



// ============================================================
// GET GALAXY HISTORY
// ============================================================

function getHistory(session){


    return session.history || [];

}



// ============================================================
// AI SPACE CAPTAIN PROMPT
// ============================================================

function buildSpacePrompt(session, action){



return `

You are Miss Aria, Space Captain.


You control an epic galaxy adventure.


CAPTAIN:

${session.player.name}



SHIP:

${session.state.ship.name}


Hull:

${session.state.ship.hp}/${session.state.ship.maxHp}


Weapon Power:

${session.state.ship.attack}



GALAXY STATUS:


Current Planet:

${session.state.planet}


Fuel:

${session.state.fuel}%


Credits:

${session.state.credits}



Inventory:

${session.player.inventory.join(", ")}



Player Action:

${action}



RULES:


- Create cinematic space scenes.
- Describe alien worlds.
- Introduce mysterious discoveries.
- Allow choices with consequences.
- Keep enemies challenging.
- Never reveal future events.
- Maintain space adventure feeling.
- Keep responses under 250 words.


`;

}



// ============================================================
// RANDOM GALAXY EVENTS
// ============================================================

function galaxyEvent(session){



const events = [


{

title:"🌌 Wormhole Discovery",

text:
"Your ship discovers a strange wormhole leading somewhere unknown."

},


{

title:"👽 Alien Civilization",

text:
"You encounter an advanced alien race offering a deal."

},


{

title:"☄ Asteroid Emergency",

text:
"A massive asteroid field blocks your route."

},


{

title:"🛰 Lost Space Station",

text:
"You discover an abandoned station containing secrets."

},


{

title:"⚠️ Galactic War",

text:
"Two alien factions are fighting nearby."

},


{

title:"🛸 Ancient Ship",

text:
"You find an ancient spaceship drifting in space."

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


text:

`🚀 GALAXY EVENT


${event.title}


${event.text}`

};



}



// ============================================================
// ALIEN DIPLOMACY
// ============================================================

function alienDiplomacy(session){



const result =

Math.random();



if(result < 0.50){



session.state.credits += 300;



return {


text:

`👽 ALIEN ALLIANCE


The aliens trust you.


Reward:


💰 +300 Credits`

};



}



return {


text:

`👽 ALIEN WARNING


They do not trust humans yet.


Your journey continues.`

};



}



// ============================================================
// DISCOVER ANCIENT TECHNOLOGY
// ============================================================

function ancientDiscovery(session){



const item =
"⭐ Ancient Galaxy Weapon";



if(
!session.player.inventory.includes(item)

){


session.player.inventory.push(item);



session.state.ship.attack += 50;



return {


text:

`⭐ ANCIENT DISCOVERY


You found a forgotten weapon from an old civilization.


⚔ Ship Attack +50`

};


}



return {


text:

`🌌 You already discovered this technology.`

};



}



// ============================================================
// GALACTIC RANK
// ============================================================

function captainRank(session){



const level =
session.player.level;



let rank =
"🚀 Space Rookie";



if(level >= 10){

rank =
"🌌 Galaxy Legend";

}

else if(level >= 5){

rank =
"🛸 Star Commander";

}

else if(level >= 3){

rank =
"⭐ Space Explorer";

}



return {


text:

`🏅 CAPTAIN RANK


${rank}


Level:

${level}`

};



}
// ============================================================
// SPACE ADVENTURE
// Part 3B
// Keyboard + Router + Save + Exports
// ============================================================



// ============================================================
// SPACE KEYBOARD
// ============================================================

function getKeyboard(){


return [

[
"🌌 Explore",
"🪐 Planets"
],

[
"🚀 Ship",
"🎒 Inventory"
],

[
"⚔️ Attack",
"⚡ Laser"
],

[
"🏪 Market",
"📊 Status"
]

];


}



// ============================================================
// COMMAND ROUTER
// ============================================================

function handleInput(session,input){



input =
input.toLowerCase().trim();



addHistory(
session,
input
);



switch(input){



case "explore":

case "🌌 explore":

return explore(session);



case "planets":

case "🪐 planets":

return showPlanets();



case "ship":

case "🚀 ship":

return shipStatus(session);



case "inventory":

case "🎒 inventory":

return inventory(session);



case "attack":

case "⚔️ attack":

return attack(session);



case "laser":

case "⚡ laser":

return laserAttack(session);



case "escape":

return escape(session);



case "fuel":

return buyFuel(session);



case "armor":

return upgradeArmor(session);



case "weapon":

return upgradeWeapon(session);



case "market":

case "🏪 market":

return market(session);



case "repair":

return repairShip(session);



case "discoveries":

return discoveries(session);



case "event":

return galaxyEvent(session);



case "alien":

return alienDiplomacy(session);



case "ancient":

return ancientDiscovery(session);



case "rank":

return captainRank(session);



case "status":

case "📊 status":

return status(session);



case "restart":

return restart(session);



default:


return {


text:

`🚀 SPACE COMMANDS


🌌 explore

🪐 planets

🚀 ship

🎒 inventory

⚔️ attack

⚡ laser

🏪 market

⛽ fuel

🛡 armor

🔫 weapon

🔧 repair

🌌 event

👽 alien

⭐ ancient

🏅 rank`

};



}



}



// ============================================================
// SAVE GAME
// ============================================================

function saveGame(session){



return {


success:true,


data:{


state:
session.state,


player:
session.player,


history:
session.history || []


}


};


}



// ============================================================
// LOAD GAME
// ============================================================

function loadGame(session,data){



if(!data){

return false;

}



session.state =
data.state;



session.player =
data.player;



session.history =
data.history || [];



return true;


}



// ============================================================
// RESTART ADVENTURE
// ============================================================

function restart(session){



session.state = null;


session.history = [];


return start(session);


}



// ============================================================
// EXPORTS
// ============================================================

module.exports = {



// Start

start,



// Galaxy

showPlanets,

explore,

discoveries,

galaxyEvent,



// Combat

startBattle,

attack,

laserAttack,

escape,

victory,



// Ship

shipStatus,

repairShip,

buyFuel,

upgradeArmor,

upgradeWeapon,



// Economy

market,

sellItem,

tradeTechnology,



// Player

inventory,

status,

captainRank,



// AI

buildSpacePrompt,

addHistory,

getHistory,

alienDiplomacy,

ancientDiscovery,



// Router

handleInput,



// UI

getKeyboard,



// Save

saveGame,

loadGame,

restart

};