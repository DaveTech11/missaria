const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const WASTED_COOLDOWN = new Map();
const WANTED_COOLDOWN = new Map();

const afkUsers = new Map();
// =========================================
// FUN SYSTEM IMPORTS
// =========================================

const {
    proposals,
    saveAll,
    isMarried,
    marry,
    mention,
    random,
    setAFK,
    removeAFK,
    isAFK
} = require("./fun");
// =========================================
// WASTED MESSAGES
// =========================================

const WASTED_MESSAGES = [

    "🔫 Sniped from across the map.",
    "💣 Blew themselves up.",
    "🚗 Got hit by a speeding truck.",
    "⚡ Couldn't dodge the lightning.",
    "🩸 Lost the final duel.",
    "💀 Respawn unavailable.",
    "☠️ Couldn't survive the encounter.",
    "<tg-emoji emoji-id=\"5350460637182993292\">🎯</tg-emoji> Headshot! No second chances.",
    "🔥 Burned to ashes.",
    "🌊 Sank without a trace.",
    "🪦 Their journey ends here."

];


// =========================================
// PROFILE DOWNLOADER
// =========================================

async function downloadProfile(bot, userId){

    try{

        const photos =
            await bot.getUserProfilePhotos(
                userId,
                {limit:1}
            );


        if(!photos.total_count)
            return null;


        const fileId =
            photos.photos[0]
            .pop()
            .file_id;


        const link =
            await bot.getFileLink(fileId);


        const file =
            path.join(
                __dirname,
                "temp",
                `${userId}.jpg`
            );


        fs.mkdirSync(
            path.dirname(file),
            {
                recursive:true
            }
        );


        const response =
            await axios({
                url:link,
                responseType:"stream"
            });


        const writer =
            fs.createWriteStream(file);


        response.data.pipe(writer);


        return new Promise((resolve,reject)=>{

            writer.on(
                "finish",
                ()=>resolve(file)
            );

            writer.on(
                "error",
                reject
            );

        });


    }catch(err){

        console.error(
            "PROFILE DOWNLOAD ERROR:",
            err
        );

        return null;

    }

}
// =========================================
// CREATE WASTED IMAGE
// =========================================
// =========================================
// CREATE WASTED IMAGE
// =========================================

async function createWasted(photoPath, userId){

    const canvas =
        Canvas.createCanvas(700,700);

    const ctx =
        canvas.getContext("2d");


    const avatar =
        await Canvas.loadImage(photoPath);


    // Avatar
    ctx.drawImage(
        avatar,
        0,
        0,
        700,
        700
    );


    // Dark effect
    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        0,
        0,
        700,
        700
    );


    // Red effect
    ctx.fillStyle =
        "rgba(180,0,0,0.18)";

    ctx.fillRect(
        0,
        0,
        700,
        700
    );


    // Wasted overlay

    const overlay =
        await Canvas.loadImage(
            path.join(
                __dirname,
                "assets",
                "wasted.png"
            )
        );


    ctx.drawImage(
        overlay,
        0,
        0,
        700,
        700
    );


    // Blood particles

    for(let i=0;i<30;i++){

        ctx.beginPath();

        ctx.fillStyle =
            `rgba(180,0,0,${Math.random()*0.4})`;


        ctx.arc(
            Math.random()*700,
            Math.random()*700,
            Math.random()*15+5,
            0,
            Math.PI*2
        );


        ctx.fill();

    }



    const output =
        path.join(
            __dirname,
            "temp",
            `wasted_${userId}.png`
        );


    fs.mkdirSync(
        path.dirname(output),
        {
            recursive:true
        }
    );


    fs.writeFileSync(
        output,
        canvas.toBuffer("image/png")
    );


    return output;

}



// =========================================
// PLAYER DATABASE
// =========================================


const PLAYER_DB =
    path.join(
        __dirname,
        "data",
        "players.json"
    );


fs.mkdirSync(
    path.dirname(PLAYER_DB),
    {
        recursive:true
    }
);



if(!fs.existsSync(PLAYER_DB)){

    fs.writeFileSync(
        PLAYER_DB,
        JSON.stringify(
            {},
            null,
            2
        )
    );

}



let players = {};


try{

    players =
        JSON.parse(
            fs.readFileSync(
                PLAYER_DB,
                "utf8"
            )
        );

}catch{

    players = {};

}



// =========================================
// SAVE PLAYERS
// =========================================


function savePlayers(){

    fs.writeFileSync(
        PLAYER_DB,
        JSON.stringify(
            players,
            null,
            2
        )
    );

}



// =========================================
// GET PLAYER
// =========================================


function getPlayer(userId){

    userId =
        String(userId);



    if(!players[userId]){


        players[userId] = {

            id:userId,

            aura:1000,

            kills:0,

            deaths:0,

            streak:0,

            highestStreak:0,

            wasted:0,

            wanted:0,

            created:Date.now()

        };


        savePlayers();

    }


    return players[userId];

}




// =========================================
// CREATE WANTED POSTER
// =========================================


async function createWanted(photoPath,userId){


    const canvas =
        Canvas.createCanvas(
            700,
            900
        );


    const ctx =
        canvas.getContext("2d");



    ctx.fillStyle =
        "#e2c48d";


    ctx.fillRect(
        0,
        0,
        700,
        900
    );



    ctx.strokeStyle =
        "#4a2d14";


    ctx.lineWidth =
        12;


    ctx.strokeRect(
        10,
        10,
        680,
        880
    );



    ctx.fillStyle =
        "#4a2d14";


    ctx.textAlign =
        "center";



    ctx.font =
        "bold 75px Arial";


    ctx.fillText(
        "WANTED",
        350,
        90
    );



    ctx.font =
        "28px Arial";


    ctx.fillText(
        "DEAD OR ALIVE",
        350,
        135
    );



    const avatar =
        await Canvas.loadImage(photoPath);



    ctx.drawImage(
        avatar,
        100,
        180,
        500,
        500
    );



    ctx.strokeStyle =
        "#4a2d14";


    ctx.lineWidth =
        8;


    ctx.strokeRect(
        100,
        180,
        500,
        500
    );



    const bounty =
        Math.floor(
            Math.random()*9000
        )+1000;



    ctx.fillStyle =
        "#4a2d14";


    ctx.font =
        "bold 42px Arial";


    ctx.fillText(
        `BOUNTY: ${bounty.toLocaleString()} AURA`,
        350,
        760
    );



    ctx.font =
        "26px Arial";


    ctx.fillText(
        "EXTREMELY DANGEROUS",
        350,
        810
    );



    ctx.font =
        "20px Arial";


    ctx.fillText(
        "MISS ARIA POLICE DEPARTMENT",
        350,
        855
    );



    const output =
        path.join(
            __dirname,
            "temp",
            `wanted_${userId}.png`
        );



    fs.writeFileSync(
        output,
        canvas.toBuffer("image/png")
    );



    return {

        image:output,

        bounty

    };

}



// =========================================
// EXPORT BOT HANDLER
// =========================================


module.exports = function(bot){
// =========================================
// 💀 /wasted
// =========================================
// =========================================
// 💀 /wasted
// =========================================

bot.onText(/^\/wasted$/, async (msg) => {

    const chatId = msg.chat.id;
    const attacker = msg.from;

    let photo = null;
    let image = null;

    try {

        // ==========================
        // Cooldown
        // ==========================

        const cooldown = WASTED_COOLDOWN.get(attacker.id);

        if (cooldown && Date.now() - cooldown < 300000) {

            const left = Math.ceil(
                (300000 - (Date.now() - cooldown)) / 1000
            );

            return bot.sendMessage(
                chatId,
                `⏳ Wait ${left} seconds before using /wasted again.`,
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        // ==========================
        // Must reply
        // ==========================

        if (!msg.reply_to_message) {

            return bot.sendMessage(
                chatId,
                "💀 Reply to someone's message to waste them.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        const target = msg.reply_to_message.from;

        // ==========================
        // Checks
        // ==========================

        if (target.id === attacker.id) {

            return bot.sendMessage(
                chatId,
                "🙄 You can't waste yourself.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        if (target.is_bot) {

            return bot.sendMessage(
                chatId,
                "🤖 Bots cannot be wasted.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        // ==========================
        // Download avatar
        // ==========================

        photo = await downloadProfile(
            bot,
            target.id
        );

        if (!photo) {

            return bot.sendMessage(
                chatId,
                "❌ This user doesn't have a profile photo.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        // ==========================
        // Generate image
        // ==========================

        image = await createWasted(
            photo,
            target.id
        );

        WASTED_COOLDOWN.set(
            attacker.id,
            Date.now()
        );

        // ==========================
        // Player Data
        // ==========================

        const attackerData =
            getPlayer(attacker.id);

        const targetData =
            getPlayer(target.id);

        const stolenAura =
            Math.floor(Math.random() * 451) + 50;

        attackerData.aura += stolenAura;

        targetData.aura = Math.max(
            0,
            targetData.aura - stolenAura
        );

        attackerData.kills++;
        attackerData.wasted++;
        attackerData.streak++;

        if (
            attackerData.streak >
            attackerData.highestStreak
        ) {

            attackerData.highestStreak =
                attackerData.streak;

        }

        targetData.deaths++;
        targetData.streak = 0;

        savePlayers();

        // ==========================
        // Random Kill Message
        // ==========================

        const deathMessage = random([
            "🔫 Sniped from across the map.",
            "💣 Blown into another dimension.",
            "<tg-emoji emoji-id=\"5350460637182993292\">🎯</tg-emoji> Headshot.",
            "⚡ Couldn't dodge the attack.",
            "☠️ Respawn unavailable.",
            "🔥 Burned to ashes.",
            "🚗 Flattened by a truck.",
            "🩸 Lost the final duel.",
            "🌊 Sank without a trace.",
            "💀 Mission Failed.",
            "🪦 Better luck next round."
        ]);

        // ==========================
        // Send Image
        // ==========================

        await bot.sendPhoto(
            chatId,
            image,
            {
                parse_mode: "HTML",
                reply_to_message_id:
                    msg.reply_to_message.message_id,

                caption:

`💀 <b>${target.first_name}</b> has been <b>ωαѕтє∂!</b>

<i>${deathMessage}</i>

⚔️ Eliminated by <a href="tg://user?id=${attacker.id}">${attacker.first_name}</a>

💰 <b>αυяα ѕтσℓєη:</b> ${stolenAura}

💎 <b>уσυя αυяα:</b> ${attackerData.aura}

🔥 <b>¢υяяєηт ѕтяєαк:</b> ${attackerData.streak}

🏆 <b>нιgнєѕт ѕтяєαк:</b> ${attackerData.highestStreak}

☠️ <b>тσтαℓ кιℓℓѕ:</b> ${attackerData.kills}`

            }
        );

    } catch (err) {

        console.error(
            "WASTED ERROR:",
            err
        );

        return bot.sendMessage(
            chatId,
            "❌ Failed to generate the WASTED image.",
            {
                reply_to_message_id: msg.message_id
            }
        );

    } finally {

        try {

            if (
                photo &&
                fs.existsSync(photo)
            ) {

                fs.unlinkSync(photo);

            }

            if (
                image &&
                fs.existsSync(image)
            ) {

                fs.unlinkSync(image);

            }

        } catch (e) {

            console.error(
                "Cleanup Error:",
                e
            );

        }

    }

});
// =========================================
// 🤠 /wanted (Part 1)
// =========================================


bot.onText(/^\/wanted$/, async (msg) => {

    const chatId = msg.chat.id;
    const hunter = msg.from;

    let photo = null;
    let wanted = null;

    try {

        // ==========================
        // Cooldown
        // ==========================

        const cooldown = WANTED_COOLDOWN.get(hunter.id);

        if (cooldown && Date.now() - cooldown < 300000) {

            const left = Math.ceil(
                (300000 - (Date.now() - cooldown)) / 1000
            );

            return bot.sendMessage(
                chatId,
                `🤠 Wait ${left} seconds before using /wanted again.`,
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        // Must reply
        if (!msg.reply_to_message) {

            return bot.sendMessage(
                chatId,
                "🤠 Reply to someone's message to put a bounty on them.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        const target = msg.reply_to_message.from;

        if (target.id === hunter.id) {

            return bot.sendMessage(
                chatId,
                "🙄 You can't place a bounty on yourself.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        if (target.is_bot) {

            return bot.sendMessage(
                chatId,
                "🤖 Bots cannot become wanted.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        // Download avatar

        photo = await downloadProfile(
            bot,
            target.id
        );

        if (!photo) {

            return bot.sendMessage(
                chatId,
                "❌ That user doesn't have a profile photo.",
                {
                    reply_to_message_id: msg.message_id
                }
            );

        }

        // Generate poster

        wanted = await createWanted(
            photo,
            target.id
        );

        WANTED_COOLDOWN.set(
            hunter.id,
            Date.now()
        );

        // ==========================
        // Player Data
        // ==========================

        const hunterData = getPlayer(hunter.id);
        const targetData = getPlayer(target.id);

        targetData.wanted++;

        hunterData.aura += 25;

        // OPTIONAL:
        targetData.activeBounty = wanted.bounty;
        targetData.wantedBy = hunter.id;
        targetData.wantedAt = Date.now();

        savePlayers();

        // ==========================
        // Send Poster
        // ==========================

        await bot.sendPhoto(
            chatId,
            wanted.image,
            {
                parse_mode: "HTML",
                reply_to_message_id:
                    msg.reply_to_message.message_id,

                caption:

`🤠 <b>ωαηтє∂</b>

🚨 <a href="tg://user?id=${target.id}">${target.first_name}</a> ɪs ɴᴏᴡ ᴏғғɪᴄɪᴀʟʟʏ <b>ωαηтє∂</b>!

💰 <b>вσυηту:</b> ${wanted.bounty.toLocaleString()} ᴀᴜʀᴀ

👮 <b>ρℓα¢є∂ ву:</b>
<a href="tg://user?id=${hunter.id}">${hunter.first_name}</a>

<tg-emoji emoji-id="5350460637182993292">🎯</tg-emoji> <b>∂єα∂ σя αℓινє</b>

💎 ʏᴏᴜ ᴇᴀʀɴᴇᴅ <b>25 αυяα</b> ғᴏʀ ʀᴇᴘᴏʀᴛɪɴɢ ᴛʜɪs ᴏᴜᴛʟᴀᴡ.`
            }
        );

    } catch (err) {

        console.error("WANTED ERROR:", err);

        await bot.sendMessage(
            chatId,
            "❌ Failed to generate the wanted poster.",
            {
                reply_to_message_id: msg.message_id
            }
        );

    } finally {

        try {

            if (photo && fs.existsSync(photo))
                fs.unlinkSync(photo);

            if (wanted?.image && fs.existsSync(wanted.image))
                fs.unlinkSync(wanted.image);

        } catch (e) {

            console.error("Cleanup Error:", e);

        }

    }

});
// =========================================
// 💤 AFK SYSTEM
// =========================================



bot.onText(/^\/afk(?:\s+(.+))?$/i, async (msg, match) => {

    const reason = match[1] || "No reason";


    afkUsers.set(msg.from.id, {

        name: msg.from.first_name,

        reason,

        time: Date.now()

    });


    await bot.sendMessage(

        msg.chat.id,

       `💤 ${mention(msg.from)} ɪs ɴᴏᴡ ᴀғᴋ 💗\n\n` +
`📝 ʀᴇᴀsᴏɴ: ${reason}\n\n` +
`👧🏻💞 ᴍɪss ᴀʀɪᴀ ʟᴏᴠᴇs ${mention(msg.from)} ᴀɴᴅ ᴘᴜᴛs ᴛʜᴇᴍ ɪɴᴛᴏ ᴀғᴋ ᴍᴏᴅᴇ ✨`,

        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }

    );

});



// Remove AFK when user sends message

bot.on("message", async (msg) => {

    if (!msg.from || !msg.text)
        return;

    if (msg.text.startsWith("/"))
        return;


    // Ignore channels
    if (msg.chat.type === "channel")
        return;


    const userId = msg.from.id;


    if (afkUsers.has(userId)) {

        const afkData = afkUsers.get(userId);

        afkUsers.delete(userId);


        const duration = Math.floor(
            (Date.now() - afkData.time) / 1000
        );


        await bot.sendMessage(
            msg.chat.id,

            `👧🏻💞 ᴍɪss ᴀʀɪᴀ ɪs ʜᴀᴘᴘʏ ᴛᴏ sᴇᴇ ${mention(msg.from)} ʙᴀᴄᴋ ✨\n\n` +
            `🌸 ᴀғᴋ ᴍᴏᴅᴇ ʜᴀs ʙᴇᴇɴ ᴄʟᴇᴀʀᴇᴅ 💗\n\n` +
            `⏱ ᴀғᴋ ᴛɪᴍᴇ: ${duration}s`,

            {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );

    }

});


// =========================================
// 📢 REPORT SYSTEM
// =========================================

bot.onText(/^\/report$/i, async(msg)=>{


    if(!msg.reply_to_message){

        return bot.sendMessage(

            msg.chat.id,

            `👧🏻💞 ${mention(msg.from)} ᴍɪss ᴀʀɪᴀ ɴᴇᴇᴅs ᴀ ʀᴇᴘᴏʀᴛ ᴛᴀʀɢᴇᴛ ✨\n\n` +
`📩 ʀᴇᴘʟʏ ᴛᴏ ᴛʜᴇ ᴍᴇssᴀɢᴇ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ sᴇɴᴅ ᴛᴏ ᴀᴅᴍɪɴs 💗`,

            {
                parse_mode:"HTML",
                reply_to_message_id:msg.message_id
            }

        );

    }



    const ADMIN_ID = "7161177100";


    await bot.forwardMessage(

        ADMIN_ID,

        msg.chat.id,

        msg.reply_to_message.message_id

    );



    await bot.sendMessage(

        msg.chat.id,

        `✅ ${mention(msg.from)} report sent to admins.`,

        {
            parse_mode:"HTML",
            reply_to_message_id:msg.message_id
        }

    );


});




// =========================================
// 📩 DM SYSTEM
// =========================================

bot.onText(/^\/msg\s+(@\w+)\s+(.+)/is, async(msg, match)=>{


    const username = match[1]
        .replace("@","")
        .toLowerCase();


    const text = match[2];


    // Find user in your database here
    // Example:
    // const user = await Users.findOne({username});


    const user = null;


    if(!user){

        return bot.sendMessage(

            msg.chat.id,

           `👧🏻💞 ${mention(msg.from)} ɪ ᴄᴏᴜʟᴅɴ'ᴛ ғɪɴᴅ ᴛʜᴀᴛ ᴜsᴇʀ 🌸\n\n` +
`📌 ᴍᴀᴋᴇ sᴜʀᴇ ᴛʜᴇ ᴜsᴇʀ ʜᴀs sᴛᴀʀᴛᴇᴅ ᴛʜᴇ ʙᴏᴛ ғɪʀsᴛ 💗`,

            {
                parse_mode:"HTML",
                reply_to_message_id:msg.message_id
            }

        );

    }



    await bot.sendMessage(

        user.id,

       `👧🏻💞 ᴍɪss ᴀʀɪᴀ ʀᴇᴄᴇɪᴠᴇᴅ ᴀ ᴘʀɪᴠᴀᴛᴇ ᴍᴇssᴀɢᴇ ғʀᴏᴍ ${mention(msg.from)} ✨\n\n` +
`💌 ${text}`,

        {
            parse_mode:"HTML"
        }

    );



    bot.sendMessage(

        msg.chat.id,

        `✅ ${mention(msg.from)} DM sent.`,

        {
            parse_mode:"HTML",
            reply_to_message_id:msg.message_id
        }

    );


});
 bot.onText(/^\/marry$/, async (msg) => {

        const chatId = msg.chat.id;
        const proposer = msg.from;

        if (msg.chat.type === "private") {
            return bot.sendMessage(
                chatId,
                "💍 This command can only be used in groups.",
                {
                    reply_to_message_id: msg.message_id
                }
            );
        }

        if (!msg.reply_to_message) {
            return bot.sendMessage(
                chatId,
                "💍 Reply to someone's message to propose.",
                {
                    reply_to_message_id: msg.message_id
                }
            );
        }

        const target = msg.reply_to_message.from;

        if (target.id === proposer.id) {
            return bot.sendMessage(
                chatId,
                "🙄 You can't marry yourself.",
                {
                    reply_to_message_id: msg.message_id
                }
            );
        }

        if (target.is_bot) {
            return bot.sendMessage(
                chatId,
                "🤖 You can't marry a bot.",
                {
                    reply_to_message_id: msg.message_id
                }
            );
        }

        if (isMarried(proposer.id)) {
            return bot.sendMessage(
                chatId,
                "💔 You're already married.",
                {
                    reply_to_message_id: msg.message_id
                }
            );
        }

        if (isMarried(target.id)) {
            return bot.sendMessage(
                chatId,
                "💔 That user is already married.",
                {
                    reply_to_message_id: msg.message_id
                }
            );
        }

        proposals[target.id] = {
            proposer: proposer.id,
            chatId,
            time: Date.now()
        };

        saveAll();

        await bot.sendMessage(
            chatId,
            `💍 <a href="tg://user?id=${target.id}">${target.first_name}</a>\n\n<b>${proposer.first_name}</b> wants to marry you!\n\nDo you accept? ❤️`,
            {
                parse_mode: "HTML",
                reply_to_message_id: msg.reply_to_message.message_id,
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: "💖 α¢¢єρт",
                            callback_data: `marry_accept_${target.id}`
                        },
                        {
                            text: "💔 ∂є¢ℓιηє",
                            callback_data: `marry_decline_${target.id}`
                  }
                ]]
            }
        }
    );

}); // ✅ close command only
// =========================================
// 💍 ᴍᴀʀʀɪᴀɢᴇ ᴄᴀʟʟʙᴀᴄᴋ sʏsᴛᴇᴍ
// =========================================

bot.on("callback_query", async (query)=>{

    try{

        const data = query.data;

        if(!data.startsWith("marry_"))
            return;


        if(!query.message)
            return;



        const chatId = query.message.chat.id;
        const userId = String(query.from.id);



        // =================================
        // 💖 ᴀᴄᴄᴇᴘᴛ
        // =================================

        if(data.startsWith("marry_accept_")){


            const targetId =
                String(data.split("_")[2]);



            if(userId !== targetId){

                return bot.answerCallbackQuery(
                    query.id,
                    {
                        text:"💗 ᴛʜɪs ᴘʀᴏᴘᴏsᴀʟ ɪs ɴᴏᴛ ғᴏʀ ʏᴏᴜ.",
                        show_alert:true
                    }
                );

            }



            const proposal =
                proposals[targetId];



            if(!proposal){

                return bot.answerCallbackQuery(
                    query.id,
                    {
                        text:"❌ ᴛʜɪs ᴘʀᴏᴘᴏsᴀʟ ʜᴀs ᴇxᴘɪʀᴇᴅ.",
                        show_alert:true
                    }
                );

            }



            const proposerId =
                String(proposal.proposer);



            if(
                isMarried(proposerId) ||
                isMarried(targetId)
            ){

                return bot.answerCallbackQuery(
                    query.id,
                    {
                        text:"💔 sᴏᴍᴇᴏɴᴇ ɪs ᴀʟʀᴇᴀᴅʏ ᴍᴀʀʀɪᴇᴅ.",
                        show_alert:true
                    }
                );

            }



            marry(
                proposerId,
                targetId
            );



            delete proposals[targetId];


            saveAll();



            await bot.answerCallbackQuery(
                query.id,
                {
                    text:"💍 ᴍᴀʀʀɪᴀɢᴇ ᴀᴄᴄᴇᴘᴛᴇᴅ 💗"
                }
            );



            await bot.editMessageText(

`👧🏻💞 <b>мιѕѕ αяια ℓσνє αηησυη¢ємєηт ✨</b>

💍 <a href="tg://user?id=${proposerId}">ᴘᴀʀᴛɴᴇʀ</a>
❤️ <a href="tg://user?id=${targetId}">ᴘᴀʀᴛɴᴇʀ</a>

🌸 ᴛʜᴇʏ ᴀʀᴇ ɴᴏᴡ ᴏғғɪᴄɪᴀʟʟʏ ᴍᴀʀʀɪᴇᴅ 💗

🎉 ᴍᴀʏ ᴛʜᴇɪʀ ʟᴏᴠᴇ ʟᴀsᴛ ғᴏʀᴇᴠᴇʀ ✨`,

            {
                chat_id:chatId,
                message_id:query.message.message_id,
                parse_mode:"HTML"
            });


        }



        // =================================
        // 💔 ᴅᴇᴄʟɪɴᴇ
        // =================================

        if(data.startsWith("marry_decline_")){


            const targetId =
                String(data.split("_")[2]);



            if(userId !== targetId){

                return bot.answerCallbackQuery(
                    query.id,
                    {
                        text:"💗 ᴛʜɪs ᴘʀᴏᴘᴏsᴀʟ ɪs ɴᴏᴛ ғᴏʀ ʏᴏᴜ.",
                        show_alert:true
                    }
                );

            }



            delete proposals[targetId];

            saveAll();



            await bot.answerCallbackQuery(
                query.id,
                {
                    text:"💔 ᴘʀᴏᴘᴏsᴀʟ ᴅᴇᴄʟɪɴᴇᴅ"
                }
            );



            await bot.editMessageText(

`👧🏻💞 <b>мιѕѕ αяια υρ∂αтє ✨</b>

💔 ᴛʜᴇ ʟᴏᴠᴇ ᴘʀᴏᴘᴏsᴀʟ ᴡᴀs ᴅᴇᴄʟɪɴᴇᴅ.

🌸 ᴍᴀʏʙᴇ ᴛʜᴇ ʀɪɢʜᴛ ʜᴇᴀʀᴛ ᴡɪʟʟ ᴄᴏᴍᴇ sᴏᴏɴ 💗`,

            {
                chat_id:chatId,
                message_id:query.message.message_id,
                parse_mode:"HTML"
            });


        }



    }catch(err){

        console.error(
            "💍 ᴍᴀʀʀʏ ᴄᴀʟʟʙᴀᴄᴋ ᴇʀʀᴏʀ:",
            err
        );

    }

});


};
    