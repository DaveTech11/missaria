// ============================================================
// Miss Aria Adventures
// Inventory System
// inventory.js
// Part 1A
// Item Database + Inventory Core
// ============================================================



// ============================================================
// ITEM DATABASE
// ============================================================

const items = [

{
    id:"health_potion",

    name:"🧪 Health Potion",

    type:"consumable",

    rarity:"common",

    description:
    "Restores 50 HP.",

    value:100
},


{
    id:"mega_health",

    name:"💊 Mega Health Potion",

    type:"consumable",

    rarity:"rare",

    description:
    "Restores 150 HP.",

    value:300
},


{
    id:"gold_coin",

    name:"💰 Gold Coin",

    type:"treasure",

    rarity:"common",

    description:
    "A shiny pirate coin.",

    value:50
},


{
    id:"ancient_key",

    name:"🗝 Ancient Key",

    type:"quest",

    rarity:"legendary",

    description:
    "Opens forgotten doors.",

    value:1000
},


{
    id:"magic_scroll",

    name:"📜 Magic Scroll",

    type:"special",

    rarity:"rare",

    description:
    "Contains ancient knowledge.",

    value:500
},


{
    id:"dragon_scale",

    name:"🐉 Dragon Scale",

    type:"material",

    rarity:"legendary",

    description:
    "A rare crafting material.",

    value:2000
}

];





// ============================================================
// CREATE INVENTORY
// ============================================================

function createInventory(){


return {


items:[],


capacity:50,


gold:0,


equipped:{


weapon:null,


armor:null


}


};


}





// ============================================================
// START INVENTORY
// ============================================================

function startInventory(session){


session.inventory = createInventory();



return {


text:

`🎒 INVENTORY CREATED!


Capacity:

50 Slots


Items:

Empty


💰 Gold:

0`

};


}





// ============================================================
// GET ITEM DATA
// ============================================================

function getItem(id){


return items.find(

item => item.id === id

);


}
// ============================================================
// Miss Aria Adventures
// Inventory System
// inventory.js
// Part 1B
// Item Management System
// ============================================================



// ============================================================
// ADD ITEM
// ============================================================

function addItem(session,itemId,amount=1){


const item = getItem(itemId);



if(!item){


return {


text:

`❌ Item does not exist.`

};


}



const inventory =

session.inventory;



const existing =

inventory.items.find(

i => i.id === itemId

);



if(existing){


existing.amount += amount;


}

else{


if(inventory.items.length >= inventory.capacity){


return {


text:

`🎒 Inventory Full!`

};


}



inventory.items.push({


id:item.id,


name:item.name,


type:item.type,


rarity:item.rarity,


amount:amount,


value:item.value


});


}



return {


text:

`✅ ITEM ADDED!


${item.name}


Amount:

x${amount}`

};


}





// ============================================================
// REMOVE ITEM
// ============================================================

function removeItem(session,itemId,amount=1){



const inventory =

session.inventory;



const item =

inventory.items.find(

i => i.id === itemId

);



if(!item){


return {


text:

`❌ Item not found.`

};


}



item.amount -= amount;



if(item.amount <= 0){


inventory.items =

inventory.items.filter(

i => i.id !== itemId

);


}



return {


text:

`🗑 ITEM REMOVED!


${item.name}


Amount:

-${amount}`

};


}





// ============================================================
// CHECK ITEM
// ============================================================

function hasItem(session,itemId){



const item =

session.inventory.items.find(

i => i.id === itemId

);



return !!item;


}





// ============================================================
// GET ITEM COUNT
// ============================================================

function itemCount(session,itemId){



const item =

session.inventory.items.find(

i => i.id === itemId

);



return item ?

item.amount :

0;


}





// ============================================================
// SHOW INVENTORY
// ============================================================

function showInventory(session){



const inventory =

session.inventory;



if(!inventory.items.length){


return {


text:

`🎒 INVENTORY


Empty


💰 Gold:

${inventory.gold}`

};


}



return {


text:

`🎒 INVENTORY


${

inventory.items.map(

item =>

`${item.name}

⭐ Rarity:

${item.rarity}

Amount:

x${item.amount}`

).join("\n\n")

}



━━━━━━━━━━


💰 Gold:

${inventory.gold}


📦 Slots:

${inventory.items.length}/${inventory.capacity}`

};


}





// ============================================================
// ADD GOLD
// ============================================================

function addGold(session,amount){



session.inventory.gold += amount;



return {


text:

`💰 GOLD RECEIVED!


+${amount} Gold


Total:

${session.inventory.gold}`

};


}





// ============================================================
// REMOVE GOLD
// ============================================================

function removeGold(session,amount){



if(session.inventory.gold < amount){


return {


text:

`❌ Not enough gold.`

};


}



session.inventory.gold -= amount;



return {


text:

`💰 GOLD SPENT!


-${amount} Gold


Remaining:

${session.inventory.gold}`

};


}
// ============================================================
// Miss Aria Adventures
// Inventory System
// inventory.js
// Part 2A
// Equipment + Weapons + Armor
// ============================================================



// ============================================================
// EQUIPMENT DATABASE
// ============================================================

const equipment = [


{
    id:"iron_sword",

    name:"⚔️ Iron Sword",

    type:"weapon",

    rarity:"common",

    attack:15,

    defense:0,

    value:300
},


{
    id:"dragon_blade",

    name:"🔥 Dragon Blade",

    type:"weapon",

    rarity:"legendary",

    attack:80,

    defense:0,

    value:5000
},


{
    id:"wooden_shield",

    name:"🛡 Wooden Shield",

    type:"armor",

    rarity:"common",

    attack:0,

    defense:10,

    value:200
},


{
    id:"guardian_armor",

    name:"🛡 Guardian Armor",

    type:"armor",

    rarity:"legendary",

    attack:0,

    defense:100,

    value:6000
}


];





// ============================================================
// GET EQUIPMENT
// ============================================================

function getEquipment(id){


return equipment.find(

item => item.id === id

);


}





// ============================================================
// ADD EQUIPMENT ITEM
// ============================================================

function addEquipment(session,itemId){



const item =

getEquipment(itemId);



if(!item){


return {


text:

`❌ Equipment not found.`

};


}



session.inventory.items.push({


id:item.id,


name:item.name,


type:item.type,


rarity:item.rarity,


attack:item.attack,


defense:item.defense,


value:item.value,


amount:1


});



return {


text:

`⚔️ EQUIPMENT FOUND!


${item.name}


⭐ Rarity:

${item.rarity}`

};


}





// ============================================================
// EQUIP ITEM
// ============================================================

function equipItem(session,itemId){



const item =

session.inventory.items.find(

i => i.id === itemId

);



if(!item){


return {


text:

`❌ You don't own this item.`

};


}



if(item.type !== "weapon" && item.type !== "armor"){


return {


text:

`❌ This item cannot be equipped.`

};


}



if(item.type === "weapon"){


session.inventory.equipped.weapon = item;


}



if(item.type === "armor"){


session.inventory.equipped.armor = item;


}



return {


text:

`✅ EQUIPPED!


${item.name}


Type:

${item.type}`

};


}





// ============================================================
// UNEQUIP ITEM
// ============================================================

function unequipItem(session,type){



if(

!session.inventory.equipped[type]

){


return {


text:

`❌ Nothing equipped.`

};


}



const item =

session.inventory.equipped[type];



session.inventory.equipped[type] = null;



return {


text:

`🔄 UNEQUIPPED!


${item.name}`

};


}





// ============================================================
// GET PLAYER BONUS
// ============================================================

function equipmentBonus(session){



let attack = 0;

let defense = 0;



const weapon =

session.inventory.equipped.weapon;



const armor =

session.inventory.equipped.armor;



if(weapon){

attack += weapon.attack;

}



if(armor){

defense += armor.defense;

}



return {


attack,

defense

};


}





// ============================================================
// SHOW EQUIPMENT
// ============================================================

function showEquipment(session){



const equipped =

session.inventory.equipped;



return {


text:

`⚔️ EQUIPMENT STATUS



⚔️ Weapon:


${
equipped.weapon ?

equipped.weapon.name :

"None"

}



🛡 Armor:


${
equipped.armor ?

equipped.armor.name :

"None"

}`

};


}
// ============================================================
// Miss Aria Adventures
// Inventory System
// inventory.js
// Part 2B
// Shop + Trading + Economy
// ============================================================



// ============================================================
// INVENTORY SHOP DATABASE
// ============================================================

const shopItems = [


{
    id:"health_potion",

    name:"🧪 Health Potion",

    price:100,

    stock:20
},


{
    id:"mega_health",

    name:"💊 Mega Health Potion",

    price:300,

    stock:10
},


{
    id:"magic_scroll",

    name:"📜 Magic Scroll",

    price:500,

    stock:5
},


{
    id:"ancient_key",

    name:"🗝 Ancient Key",

    price:1000,

    stock:2
}


];





// ============================================================
// SHOW SHOP
// ============================================================

function showShop(){



return {


text:

`🏪 ADVENTURE SHOP


${

shopItems.map(

item =>

`${item.name}


💰 Price:

${item.price}


📦 Stock:

${item.stock}`

).join("\n\n")

}`

};


}





// ============================================================
// BUY ITEM
// ============================================================

function buyItem(session,itemId,amount=1){



const shopItem =

shopItems.find(

item => item.id === itemId

);



if(!shopItem){


return {


text:

`❌ Item not available.`

};


}



if(shopItem.stock < amount){


return {


text:

`❌ Not enough stock.`

};


}



const cost =

shopItem.price * amount;



if(session.inventory.gold < cost){


return {


text:

`❌ Not enough gold.


Need:

${cost} Gold`

};


}



session.inventory.gold -= cost;



shopItem.stock -= amount;



return addItem(

session,

itemId,

amount

);


}





// ============================================================
// SELL ITEM
// ============================================================

function sellItem(session,itemId,amount=1){



const item =

session.inventory.items.find(

i => i.id === itemId

);



if(!item){


return {


text:

`❌ Item not found.`

};


}



if(item.amount < amount){


return {


text:

`❌ Not enough items.`

};


}



const value =

item.value * amount;



session.inventory.gold += value;



removeItem(

session,

itemId,

amount

);



return {


text:

`💰 ITEM SOLD!


${item.name}


Amount:

x${amount}



Received:

+${value} Gold`

};


}





// ============================================================
// TRADE ITEMS
// ============================================================

function tradeItem(session,target,itemId,amount=1){



const item =

session.inventory.items.find(

i => i.id === itemId

);



if(!item){


return {


text:

`❌ You don't own this item.`

};


}



if(item.amount < amount){


return {


text:

`❌ Not enough items.`

};


}



removeItem(

session,

itemId,

amount

);



if(!target.inventory){


target.inventory = createInventory();

}



target.inventory.items.push({


...item,


amount:amount


});



return {


text:

`🤝 TRADE COMPLETE!


Sent:


${item.name}


Amount:

x${amount}`

};


}





// ============================================================
// RESTOCK SHOP
// ============================================================

function restockShop(){



shopItems.forEach(item=>{


item.stock += 5;


});



return {


text:

`🏪 SHOP RESTOCKED!`

};


}





// ============================================================
// DAILY REWARD
// ============================================================

function dailyReward(session){



const reward = 500;



session.inventory.gold += reward;



addItem(

session,

"health_potion",

2

);



return {


text:

`🎁 DAILY ADVENTURE REWARD!


💰 +${reward} Gold


🧪 +2 Health Potions`

};


}





// ============================================================
// ECONOMY STATUS
// ============================================================

function economyStatus(session){



return {


text:

`💰 ECONOMY STATUS


Gold:

${session.inventory.gold}



Items:


${

session.inventory.items.length

}



Inventory Space:


${session.inventory.items.length}/${session.inventory.capacity}`

};


}
// ============================================================
// Miss Aria Adventures
// Inventory System
// inventory.js
// Part 3A
// AI Memory + Rarity + Loot Generator
// ============================================================



// ============================================================
// INVENTORY MEMORY SYSTEM
// ============================================================

function addInventoryHistory(session,action){


if(!session.inventoryHistory){

session.inventoryHistory = [];

}



session.inventoryHistory.push({

action,

time:Date.now()

});



// Keep latest 50 actions

if(session.inventoryHistory.length > 50){

session.inventoryHistory.shift();

}


}





// ============================================================
// GET INVENTORY HISTORY
// ============================================================

function getInventoryHistory(session){


return session.inventoryHistory || [];


}





// ============================================================
// ITEM RARITY SYSTEM
// ============================================================

const rarityLevels = {


common:{

name:"⚪ Common",

chance:60,

multiplier:1

},


uncommon:{

name:"🟢 Uncommon",

chance:25,

multiplier:1.5

},


rare:{

name:"🔵 Rare",

chance:10,

multiplier:3

},


epic:{

name:"🟣 Epic",

chance:4,

multiplier:6

},


legendary:{

name:"🟡 Legendary",

chance:1,

multiplier:15

}


};





// ============================================================
// RANDOM RARITY
// ============================================================

function randomRarity(){



const roll =

Math.floor(

Math.random()*100

);



let total = 0;



for(const rarity in rarityLevels){


total += rarityLevels[rarity].chance;



if(roll < total){


return rarity;


}


}



return "common";


}





// ============================================================
// LOOT GENERATOR
// ============================================================

function generateLoot(){



const lootTable = [


{

id:"gold_coin",

name:"💰 Gold Coin",

type:"treasure",

value:50

},


{

id:"health_potion",

name:"🧪 Health Potion",

type:"consumable",

value:100

},


{

id:"magic_scroll",

name:"📜 Magic Scroll",

type:"special",

value:500

},


{

id:"dragon_scale",

name:"🐉 Dragon Scale",

type:"material",

value:2000

},


{

id:"ancient_key",

name:"🗝 Ancient Key",

type:"quest",

value:1000

}


];



const base =

lootTable[

Math.floor(

Math.random()

*

lootTable.length

)

];



const rarity =

randomRarity();



const bonus =

rarityLevels[rarity].multiplier;



return {


id:base.id,


name:base.name,


type:base.type,


rarity,


value:

Math.floor(

base.value * bonus

),


amount:1


};


}





// ============================================================
// FIND LOOT EVENT
// ============================================================

function findLoot(session){



const loot =

generateLoot();



session.inventory.items.push(

loot

);



addInventoryHistory(

session,

`Found ${loot.name}`

);



return {


text:

`🎁 LOOT DISCOVERED!


${loot.name}



⭐ Rarity:

${rarityLevels[loot.rarity].name}



💰 Value:

${loot.value} Gold`

};


}





// ============================================================
// AI INVENTORY PROMPT
// ============================================================

function buildInventoryPrompt(session){



return `

You are Miss Aria, Inventory Manager.


PLAYER:

${session.player?.name || "Unknown"}



GOLD:

${session.inventory.gold}



ITEMS:

${

session.inventory.items

.map(

i =>

`${i.name} x${i.amount}`

)

.join("\n")

|| "Empty"

}



RULES:


- Suggest useful items.
- Explain item value.
- Recommend equipment.
- Track rare treasures.
- Help manage inventory.


`;

}





// ============================================================
// RARITY INFORMATION
// ============================================================

function rarityInfo(){



return {


text:

`⭐ ITEM RARITIES


⚪ Common

🟢 Uncommon

🔵 Rare

🟣 Epic

🟡 Legendary`

};


}
// ============================================================
// Miss Aria Adventures
// Inventory System
// inventory.js
// Part 3B
// Router + Save + Load + Exports
// ============================================================



// ============================================================
// INVENTORY COMMAND ROUTER
// ============================================================

function handleInventory(session,input){


input = input
.toLowerCase()
.trim();



addInventoryHistory(

session,

input

);



switch(input){



case "inventory":

case "🎒 inventory":

return showInventory(session);



case "shop":

case "🏪 shop":

return showShop();



case "equipment":

case "⚔️ equipment":

return showEquipment(session);



case "loot":

case "🎁 loot":

return findLoot(session);



case "rarity":

case "⭐ rarity":

return rarityInfo();



case "economy":

case "💰 economy":

return economyStatus(session);



case "daily":

case "🎁 daily":

return dailyReward(session);



case "restock":

return restockShop();



case "bonus":


return equipmentBonus(session);



default:


return {


text:

`🎒 INVENTORY COMMANDS


🎒 inventory

🏪 shop

⚔️ equipment

🎁 loot

⭐ rarity

💰 economy

🎁 daily

🔄 restock`

};


}


}





// ============================================================
// INVENTORY KEYBOARD
// ============================================================

function inventoryKeyboard(){


return [


[
"🎒 Inventory",
"🏪 Shop"
],


[
"⚔️ Equipment",
"🎁 Loot"
],


[
"💰 Economy",
"⭐ Rarity"
],


[
"🎁 Daily Reward"
]


];


}





// ============================================================
// SAVE INVENTORY
// ============================================================

function saveInventory(session){



return {


success:true,


data:{


inventory:

session.inventory,


history:

session.inventoryHistory || []


}


};


}





// ============================================================
// LOAD INVENTORY
// ============================================================

function loadInventory(session,data){



if(!data){


return false;


}



session.inventory =

data.inventory;



session.inventoryHistory =

data.history || [];



return true;


}





// ============================================================
// RESET INVENTORY
// ============================================================

function resetInventory(session){



session.inventory =

createInventory();



session.inventoryHistory = [];



return {


text:

`🔄 INVENTORY RESET!


All items removed.`

};


}





// ============================================================
// INVENTORY SUMMARY
// ============================================================

function inventorySummary(session){



const inv =

session.inventory;



return {


text:

`📦 INVENTORY SUMMARY


Items:

${inv.items.length}/${inv.capacity}



💰 Gold:

${inv.gold}



⚔️ Weapon:


${
inv.equipped.weapon ?

inv.equipped.weapon.name :

"None"

}



🛡 Armor:


${
inv.equipped.armor ?

inv.equipped.armor.name :

"None"

}`

};


}





// ============================================================
// FINAL EXPORTS
// ============================================================

module.exports = {



// Database

items,

equipment,

shopItems,



// Core

createInventory,

startInventory,

getItem,

getEquipment,



// Items

addItem,

removeItem,

hasItem,

itemCount,

showInventory,



// Gold

addGold,

removeGold,



// Equipment

addEquipment,

equipItem,

unequipItem,

equipmentBonus,

showEquipment,



// Shop

showShop,

buyItem,

sellItem,

tradeItem,

restockShop,

dailyReward,

economyStatus,



// AI + Loot

addInventoryHistory,

getInventoryHistory,

generateLoot,

findLoot,

buildInventoryPrompt,

rarityInfo,

randomRarity,



// Router

handleInventory,

inventoryKeyboard,



// Save

saveInventory,

loadInventory,

resetInventory,

inventorySummary


};