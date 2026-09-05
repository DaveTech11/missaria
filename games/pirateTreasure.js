// ============================================================
// Miss Aria Adventures
// Pirate Treasure Hunt Mode
// pirateTreasure.js
// Part 1A
// ============================================================



// ============================================================
// ISLAND DATABASE
// ============================================================

const islands = [

{
    name:"🏝 Skull Island",

    danger:20,

    treasure:"💰 Golden Coins",

    description:
    "A mysterious island filled with old pirate secrets."
},


{
    name:"🌴 Lost Paradise",

    danger:40,

    treasure:"💎 Crystal Jewel",

    description:
    "A hidden island untouched by explorers."
},


{
    name:"🌋 Dragon Island",

    danger:70,

    treasure:"🔥 Ancient Pirate Sword",

    description:
    "A dangerous island guarded by legends."
},


{
    name:"☠ Shadow Cove",

    danger:90,

    treasure:"👑 Pirate King's Crown",

    description:
    "The final resting place of a legendary pirate."
}

];



// ============================================================
// PIRATE ENEMIES
// ============================================================

const pirates = [

{
    name:"⚔️ Rookie Pirate",

    hp:80,

    attack:15,

    reward:100
},


{
    name:"🏴‍☠️ Captain Raider",

    hp:180,

    attack:35,

    reward:300
},


{
    name:"☠ Black Sea Lord",

    hp:400,

    attack:70,

    reward:1000
}

];



// ============================================================
// START PIRATE GAME
// ============================================================

function start(session){


session.state = {


    location:"⚓ Pirate Bay",


    gold:500,


    ship:{


        name:"🚢 Guardian Pearl",


        hp:100,


        maxHp:100,


        attack:20

    },


    crew:[],


    treasures:[],


    enemy:null,


    visited:[],


    legend:0


};



session.player = {


    name:
    session.player?.name || "Captain",


    level:1,


    xp:0


};



return {


text:

`🏴‍☠️ PIRATE TREASURE HUNT


Welcome Captain!


Your mission:


🏝 Explore dangerous islands

💎 Discover legendary treasures

⚔️ Defeat rival pirates


🚢 Ship:

Guardian Pearl


❤️ Hull:

100/100


💰 Gold:

500


Commands:


🌊 sail

🏝 islands

🚢 ship

💎 treasure`

};


}



// ============================================================
// SHOW ISLAND MAP
// ============================================================

function showIslands(){


return {


text:

`🗺 TREASURE MAP


${
islands.map(

(i,index)=>

`${index + 1}. ${i.name}

⚠️ Danger:
${i.danger}%

📜 ${i.description}`

).join("\n\n")
}`

};


}
// ============================================================
// PIRATE TREASURE HUNT
// Part 1B
// Sailing + Islands + Treasure Discovery
// ============================================================



// ============================================================
// SAIL THE OCEAN
// ============================================================

function sail(session){


const island =

islands[

Math.floor(

Math.random()

*

islands.length

)

];



session.state.location =
island.name;



if(
!session.state.visited.includes(island.name)
){

session.state.visited.push(
island.name
);

}



const chance =
Math.random();



if(chance < 0.35){

return pirateEncounter(
session,
island
);

}



if(chance < 0.75){

return findTreasure(
session,
island
);

}



return oceanEvent(session);


}




// ============================================================
// FIND TREASURE
// ============================================================

function findTreasure(session,island){



const treasures = [

"💰 Gold Chest",

"💎 Ancient Jewel",

"🗺 Treasure Map Fragment",

"⚔️ Lost Pirate Weapon",

"👑 Royal Crown"

];



const treasure =

treasures[

Math.floor(

Math.random()

*

treasures.length

)

];



session.state.treasures.push(
treasure
);



session.state.gold += 200;


session.state.legend += 10;



return {


text:

`🏝 TREASURE DISCOVERED!


Island:

${island.name}


You found:


${treasure}


💰 +200 Gold

⭐ +10 Pirate Legend`

};


}





// ============================================================
// PIRATE ENCOUNTER
// ============================================================

function pirateEncounter(session,island){



const enemy = {


...pirates[

Math.floor(

Math.random()

*

pirates.length

)

]

};



session.state.enemy =
enemy;



return {


text:

`⚠️ ENEMY PIRATES!


Location:

${island.name}


A pirate ship approaches!


🏴‍☠️ Enemy:

${enemy.name}


❤️ Enemy Hull:

${enemy.hp}


⚔️ Damage:

${enemy.attack}



Commands:


attack

cannon

board

escape`

};


}




// ============================================================
// RANDOM OCEAN EVENTS
// ============================================================

function oceanEvent(session){



const events = [

{

title:"🌊 Giant Storm",

text:
"Massive waves attack your ship."
},


{

title:"🐋 Sea Monster",

text:
"A legendary creature appears beneath your ship."
},


{

title:"🦜 Talking Parrot",

text:
"A strange parrot reveals a hidden clue."
},


{

title:"🚢 Ghost Ship",

text:
"You discover an abandoned ghost ship."
},


{

title:"🗺 Old Treasure Map",

text:
"You find a forgotten treasure route."
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



if(
event.title.includes("Storm")
){


session.state.ship.hp = Math.max(

0,

session.state.ship.hp - 10

);


}



return {


text:

`🌊 OCEAN EVENT


${event.title}


${event.text}`

};


}





// ============================================================
// TREASURE INVENTORY
// ============================================================

function treasureInventory(session){


return {


text:

`💎 TREASURE COLLECTION


${
session.state.treasures.length

?

session.state.treasures.join("\n")

:

"No treasures discovered yet."
}`

};


}




// ============================================================
// VISITED ISLANDS
// ============================================================

function visitedIslands(session){


return {


text:

`🗺 EXPLORED ISLANDS


${
session.state.visited.length

?

session.state.visited.join("\n")

:

"No islands explored yet."
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

`🚢 SHIP STATUS


${ship.name}


❤️ Hull:

${ship.hp}/${ship.maxHp}


💣 Cannon Power:

${ship.attack}


💰 Gold:

${session.state.gold}


⭐ Legend:

${session.state.legend}`

};


}
// ============================================================
// PIRATE TREASURE HUNT
// Part 2A
// Pirate Battles + Cannon Combat
// ============================================================



// ============================================================
// START PIRATE BATTLE
// ============================================================

function startBattle(session){


const enemy =
session.state.enemy;



if(!enemy){


return {


text:

`❌ No enemy pirate ship nearby.`

};


}



return {


text:

`⚔️ PIRATE BATTLE!


Enemy Ship:


🏴‍☠️ ${enemy.name}


❤️ Hull:

${enemy.hp}


💣 Cannon Damage:

${enemy.attack}



Your Ship:


🚢 ${session.state.ship.name}


❤️ Hull:

${session.state.ship.hp}/${session.state.ship.maxHp}



Commands:


attack

cannon

board

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

"❌ No enemy ship."

};


}



let damage =

session.state.ship.attack

+

Math.floor(
Math.random()*20
);



if(Math.random() < 0.25){

damage *= 2;

}



enemy.hp -= damage;



let message =

`⚔️ CANNON FIRE!


You hit the enemy ship!


Damage:

-${damage}`;



if(enemy.hp <= 0){


return victory(session);

}




// Enemy counter attack

session.state.ship.hp = Math.max(

0,

session.state.ship.hp - enemy.attack

);



message +=

`

🏴‍☠️ Enemy fired back!


Damage:

-${enemy.attack}



🚢 Your Hull:

${session.state.ship.hp}/${session.state.ship.maxHp}`;



if(session.state.ship.hp <= 0){


message +=

`

💀 Your ship has sunk!`;

}



return {


text:message

};


}





// ============================================================
// HEAVY CANNON ATTACK
// ============================================================

function cannon(session){



const enemy =
session.state.enemy;



if(!enemy){


return {


text:

"❌ No enemy ship."

};


}



const damage = 100;



enemy.hp -= damage;



if(enemy.hp <= 0){


return victory(session);

}



return {


text:

`💣 MEGA CANNON!


A powerful cannon blast destroys part of the enemy ship!


Damage:

-${damage}



Enemy Hull:

${enemy.hp}`

};


}





// ============================================================
// BOARD ENEMY SHIP
// ============================================================

function boardShip(session){



const enemy =
session.state.enemy;



if(!enemy){


return {


text:

"❌ No ship to board."

};


}



const chance =
Math.random();



if(chance < 0.5){



session.state.gold += 300;


session.state.legend += 20;


session.state.enemy = null;



return {


text:

`🏴‍☠️ BOARDING SUCCESS!


You defeated the enemy crew!


Rewards:


💰 +300 Gold

⭐ +20 Pirate Legend`

};


}



session.state.ship.hp = Math.max(

0,

session.state.ship.hp - 30

);



return {


text:

`⚠️ BOARDING FAILED!


Enemy pirates fought back!


🚢 Ship Damage:

-30`

};


}





// ============================================================
// ESCAPE FROM BATTLE
// ============================================================

function escape(session){



if(Math.random() < 0.6){



session.state.enemy = null;



return {


text:

`🌊 ESCAPED!


Your ship disappeared into the ocean fog.`

};


}



const enemy =
session.state.enemy;



session.state.ship.hp = Math.max(

0,

session.state.ship.hp - enemy.attack

);



return {


text:

`❌ ESCAPE FAILED!


Enemy fired!


Damage:

-${enemy.attack}`

};


}





// ============================================================
// PIRATE VICTORY
// ============================================================

function victory(session){



const enemy =
session.state.enemy;



if(!enemy){

return {

text:
"❌ No battle data."

};

}



const reward =
enemy.reward;



session.player.xp += reward;



session.state.gold += reward;



session.state.legend += 30;



session.player.level =

Math.floor(

session.player.xp / 500

)

+

1;



session.state.enemy = null;



return {


text:

`🏆 PIRATE VICTORY!


Enemy defeated:


${enemy.name}



Rewards:


💰 +${reward} Gold


⭐ +30 Legend


⚔️ Your pirate fame increases!`

};


}





// ============================================================
// REPAIR SHIP
// ============================================================

function repairShip(session){



const cost = 200;



if(session.state.gold < cost){


return {


text:

`❌ Not enough gold.


Repair cost:

${cost} Gold`

};


}



session.state.gold -= cost;



session.state.ship.hp =

session.state.ship.maxHp;



return {


text:

`🔧 SHIP REPAIRED!


🚢 Hull fully restored.


💰 Cost:

${cost} Gold`

};


}
// ============================================================
// PIRATE TREASURE HUNT
// Part 2B
// Ship Upgrades + Crew + Trading
// ============================================================



// ============================================================
// RECRUIT CREW MEMBER
// ============================================================

function recruitCrew(session){


const crewMembers = [

"⚔️ Sword Master",

"🦜 Parrot Navigator",

"🏹 Pirate Archer",

"🧭 Master Navigator",

"💣 Cannon Expert"

];



const member =

crewMembers[

Math.floor(

Math.random()

*

crewMembers.length

)

];



if(
session.state.crew.includes(member)
){


return {


text:

`🏴‍☠️ ${member}


is already part of your crew.`

};


}



const cost = 250;



if(
session.state.gold < cost
){


return {


text:

`❌ Not enough gold.


Recruitment cost:

${cost} Gold`

};


}



session.state.gold -= cost;



session.state.crew.push(member);



return {


text:

`🏴‍☠️ CREW MEMBER JOINED!


${member}


is now part of your pirate crew.


💰 Paid:

${cost} Gold`

};


}





// ============================================================
// SHOW CREW
// ============================================================

function showCrew(session){


return {


text:

`👥 PIRATE CREW


${
session.state.crew.length

?

session.state.crew.join("\n")

:

"No crew members yet."
}`

};


}





// ============================================================
// UPGRADE SHIP
// ============================================================

function upgradeShip(session){



const cost = 600;



if(
session.state.gold < cost
){


return {


text:

`❌ Not enough gold.


Ship upgrade cost:

${cost} Gold`

};


}



session.state.gold -= cost;



session.state.ship.maxHp += 50;



session.state.ship.hp += 50;



return {


text:

`🚢 SHIP UPGRADED!


Your ship became stronger!


❤️ New Hull:


${session.state.ship.maxHp}`

};


}





// ============================================================
// UPGRADE CANNONS
// ============================================================

function upgradeCannons(session){



const cost = 700;



if(
session.state.gold < cost
){


return {


text:

`❌ Cannot upgrade cannons.


Need:

${cost} Gold`

};


}



session.state.gold -= cost;



session.state.ship.attack += 30;



return {


text:

`💣 CANNONS UPGRADED!


New Cannon Power:


${session.state.ship.attack}`

};


}





// ============================================================
// PIRATE MARKET
// ============================================================

function market(session){



return {


text:

`🏪 PIRATE MARKET


Available Upgrades:


🚢 Ship Upgrade

Cost: 600 Gold


💣 Cannon Upgrade

Cost: 700 Gold


🏴‍☠️ Recruit Crew

Cost: 250 Gold


🔧 Repair Ship

Cost: 200 Gold



Commands:


upgrade

cannons

recruit

repair`

};


}





// ============================================================
// SELL TREASURE
// ============================================================

function sellTreasure(session,item){



const index =

session.state.treasures.indexOf(item);



if(index === -1){


return {


text:

`❌ Treasure not found.`

};


}



session.state.treasures.splice(

index,

1

);



const reward = 300;



session.state.gold += reward;



return {


text:

`💰 TREASURE SOLD!


${item}


+${reward} Gold`

};


}





// ============================================================
// TREASURE VALUE
// ============================================================

function treasureValue(session){



const amount =

session.state.treasures.length;



const value =

amount * 300;



return {


text:

`💎 TREASURE VALUE


Items:

${amount}


Estimated Worth:


💰 ${value} Gold`

};


}





// ============================================================
// PIRATE STATUS
// ============================================================

function pirateStatus(session){


const ship =

session.state.ship;



return {


text:

`🏴‍☠️ PIRATE STATUS


Captain:

${session.player.name}



⭐ Level:

${session.player.level}



🚢 Ship:

${ship.name}



❤️ Hull:

${ship.hp}/${ship.maxHp}



💣 Cannon Power:

${ship.attack}



💰 Gold:

${session.state.gold}



⭐ Legend:

${session.state.legend}



👥 Crew:

${session.state.crew.length}`

};


}
// ============================================================
// PIRATE TREASURE HUNT
// Part 3A
// AI Pirate Captain + Memory + Legend System
// ============================================================



// ============================================================
// PIRATE MEMORY SYSTEM
// ============================================================

function addHistory(session, action){


if(!session.history){

    session.history = [];

}



session.history.push({

    action,

    time: Date.now()

});



// Keep last 50 actions

if(session.history.length > 50){

    session.history.shift();

}


}




// ============================================================
// GET PIRATE HISTORY
// ============================================================

function getHistory(session){


return session.history || [];


}





// ============================================================
// AI PIRATE CAPTAIN PROMPT
// ============================================================

function buildPiratePrompt(session, action){


return `

You are Miss Aria, Pirate Captain 🏴‍☠️


You control an epic pirate treasure adventure.


CAPTAIN:

${session.player.name}



SHIP:

${session.state.ship.name}



SHIP HULL:

${session.state.ship.hp}/${session.state.ship.maxHp}



CANNON POWER:

${session.state.ship.attack}



CURRENT LOCATION:

${session.state.location}



GOLD:

${session.state.gold}



CREW:

${session.state.crew.join(", ") || "No crew"}



TREASURES:

${session.state.treasures.join(", ") || "None"}



PIRATE LEGEND:

${session.state.legend}



PLAYER ACTION:

${action}



RULES:


- Create cinematic pirate adventures.
- Describe oceans, islands and battles.
- Create mysterious treasure stories.
- Give choices with consequences.
- Reward clever pirates.
- Keep legendary treasure secret.
- Never instantly finish the adventure.
- Keep replies under 250 words.



`;

}





// ============================================================
// LEGENDARY OCEAN EVENTS
// ============================================================

function legendaryEvent(session){


const events = [


{

title:"🌊 Kraken Attack",

text:
"A giant Kraken rises from the ocean and attacks your ship."

},


{

title:"👻 Ghost Pirate",

text:
"The spirit of an ancient pirate challenges your legend."

},


{

title:"🗺 Legendary Map",

text:
"You discover a map leading to forgotten treasure."

},


{

title:"🏴‍☠️ Pirate Alliance",

text:
"A powerful pirate fleet offers you an alliance."

},


{

title:"🌑 Cursed Island",

text:
"You discover an island protected by an ancient curse."

},


{

title:"💎 Lost Pirate Vault",

text:
"You find a hidden vault from the golden age of pirates."

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


text:

`⚓ LEGENDARY EVENT


${event.title}


${event.text}`


};


}





// ============================================================
// PIRATE REPUTATION SYSTEM
// ============================================================

function pirateReputation(session){



const legend =

session.state.legend;



let rank =

"🛶 Unknown Sailor";



if(legend >= 500){

rank =

"👑 Pirate King";

}

else if(legend >= 300){

rank =

"⚔️ Legendary Captain";

}

else if(legend >= 100){

rank =

"🏴‍☠️ Famous Pirate";

}

else if(legend >= 50){

rank =

"🌊 Experienced Raider";

}



return {


text:

`🏴‍☠️ PIRATE REPUTATION


Rank:

${rank}



Legend Points:

${legend}`


};


}





// ============================================================
// LEGENDARY TREASURE
// ============================================================

function legendaryTreasure(session){



const treasure =

"👑 Pirate King's Treasure";



if(

session.state.treasures.includes(treasure)

){


return {


text:

`💎 You already discovered the legendary treasure.`


};


}



session.state.treasures.push(

treasure

);



session.state.gold += 2000;



session.state.legend += 200;



return {


text:

`👑 LEGENDARY DISCOVERY!


You discovered:


${treasure}



Rewards:


💰 +2000 Gold


⭐ +200 Legend`

};


}





// ============================================================
// CREW BONUS SYSTEM
// ============================================================

function crewBonus(session){



const bonus =

session.state.crew.length * 5;



return {


text:

`👥 CREW BONUS


Crew Members:

${session.state.crew.length}



⚔️ Attack Bonus:

+${bonus}`


};


}
// ============================================================
// PIRATE TREASURE HUNT
// Part 3B
// Keyboard + Router + Save + Exports
// ============================================================



// ============================================================
// PIRATE KEYBOARD
// ============================================================

function getKeyboard(){


return [

[
"🌊 Sail",
"🏝 Islands"
],

[
"🚢 Ship",
"💎 Treasure"
],

[
"⚔️ Attack",
"💣 Cannon"
],

[
"👥 Crew",
"📊 Status"
],

[
"🏪 Market",
"⭐ Legend"
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



case "sail":

case "🌊 sail":

return sail(session);



case "islands":

case "🏝 islands":

return showIslands();



case "ship":

case "🚢 ship":

return shipStatus(session);



case "treasure":

case "💎 treasure":

return treasureInventory(session);



case "attack":

case "⚔️ attack":

return attack(session);



case "cannon":

case "💣 cannon":

return cannon(session);



case "board":

return boardShip(session);



case "escape":

return escape(session);



case "crew":

case "👥 crew":

return showCrew(session);



case "recruit":

return recruitCrew(session);



case "upgrade":

return upgradeShip(session);



case "cannons":

return upgradeCannons(session);



case "market":

return market(session);



case "repair":

return repairShip(session);



case "sell":

return sellTreasure(session);



case "value":

return treasureValue(session);



case "event":

return legendaryEvent(session);



case "legend":

return pirateReputation(session);



case "king":

return legendaryTreasure(session);



case "bonus":

return crewBonus(session);



case "status":

case "📊 status":

return pirateStatus(session);



case "restart":

return restart(session);



default:


return {


text:

`🏴‍☠️ PIRATE COMMANDS


🌊 sail

🏝 islands

🚢 ship

💎 treasure

⚔️ attack

💣 cannon

🏴‍☠️ board

👥 crew

🏪 market

🚢 upgrade

💰 sell

🌊 event

👑 legend

📊 status

🔄 restart`

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
// RESTART GAME
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



// Game Start

start,



// Exploration

showIslands,

sail,

findTreasure,

oceanEvent,

treasureInventory,

visitedIslands,



// Combat

startBattle,

attack,

cannon,

boardShip,

escape,

victory,



// Ship

shipStatus,

repairShip,

upgradeShip,

upgradeCannons,



// Economy

market,

sellTreasure,

treasureValue,



// Crew

recruitCrew,

showCrew,

crewBonus,



// AI

buildPiratePrompt,

addHistory,

getHistory,

legendaryEvent,

legendaryTreasure,



// Reputation

pirateReputation,

pirateStatus,



// Router

handleInput,



// UI

getKeyboard,



// Save System

saveGame,

loadGame,

restart


};