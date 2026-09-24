/**
 * Handler pack 6.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  // Direct import keeps AI replies independent of runtime ctx wiring.
  const { formatAiReplyForTelegram } = require('../utils/telegramRichText');
  const imageUsage = require('../services/imageUsage');
  const sendImageLimitNotice = async (chatId) => bot.sendMessage(chatId, `<blockquote expandable='true'>🎨 <b>ɪᴍᴀɢᴇ ʟɪᴍɪᴛ ʀᴇᴀᴄʜᴇᴅ</b>\n\nʏᴏᴜ ʜᴀᴠᴇ ᴜsᴇᴅ ʏᴏᴜʀ <b>3 ғʀᴇᴇ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴs</b> ғᴏʀ ᴛᴏᴅᴀʏ.\n\n⭐ ᴜᴘɢʀᴀᴅᴇ ᴛᴏ ᴘʀᴇᴍɪᴜᴍ ᴛᴏ ᴜɴʟᴏᴄᴋ ᴍᴏʀᴇ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴs.</blockquote>`, {parse_mode:'HTML', reply_markup:{inline_keyboard:[[{text:'⭐ ᴘʀᴇᴍɪᴜᴍ',callback_data:'aria_premium_info',style:'success'},{text:'👑 ᴏᴡɴᴇʀ',callback_data:'aria_owner_info',style:'primary'}]]}});
  const { bot, AIART_API_URL, ANILIST_QUERY, FLOOD_MUTE_MS, FORCE_JOIN_CHANNELS, FORCE_JOIN_EXEMPT_ADMINS, TOKEN, acquireGenSlot, addBannedImage, addBlacklistWord, addBotAdmin, addChat, addRule, animeSessions, axios, backToAdminKeyboard, canManageAdmins, canManageChat, canUseAi, canGenerateImages, captureChatPhotoBaseline, chatBlacklistKeyboard, chatRulesKeyboard, chatTitleFor, classifyImage, classifyImageCustomRules, classifyImageSightengine, classifyLinks, classifyText, clearAnnouncement, clearFloodHistory, clearPending, computeImageHash, downloadFileToBuffer, ensureChatStats, escapeHTML, escapeHtml, extractUrls, forceJoinKeyboard, fs, gameManager, genQueue, genQueuePosition, getBannedImages, getMissingChannels, getOwnerId, getPending, getPlan, getRules, handleChatPhotoChanged, https, incrementChatFlags, isBotAdmin, isFloodLockEnabled, isFlooding, isForwardLockEnabled, isLinkLockEnabled, isPremiumActive, isWarnSystemEnabled, log, mainMenuKeyboard, matchBannedImage, muteUser, pendingForceJoin, play, processWithFailover, releaseGenSlot, removeBotAdmin, resolveTargetFromMessage, runAiConfigTurn, sendChatSettingsPanel, sendSignupGate, sendImageSignupGate, setAnnouncement, setPending, setPlan, speechToText, splitText, stickerRecognitionService, textToVoice, userHistory, warnUser } = ctx;

bot.onText(/^\/generate1(?:\s+([\s\S]+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const prompt = match[1]?.trim();

    if (!canGenerateImages(msg.from.id)) {
        return sendImageSignupGate(chatId, msg.message_id);
    }

    if (!prompt) {
        return bot.sendMessage(
            chatId,
            `🎨 <b>αι ιмαgє gєηєяαтσя</b>

Usage:
<code>/generate1 cyberpunk city at night</code>`,
            {
                parse_mode: "HTML"
            }
        );
    }


    const imageQuota1 = imageUsage.status(ctx, msg.from.id);
    if (!imageQuota1.premium && imageQuota1.remaining <= 0) return sendImageLimitNotice(chatId);
    const priority1 = isBotAdmin(msg.from.id) || isPremiumActive(msg.from.id);
    const ahead1 = genQueuePosition(priority1);
    let queueMsg1;
    if (ahead1 > 0 || genQueue.running >= genQueue.maxConcurrent) {
        queueMsg1 = await bot.sendMessage(
            chatId,
            `⏳ ${priority1 ? "⭐ Priority queue" : "Queue"}: ${ahead1} request(s) ahead of you…`
        );
    }
    await acquireGenSlot(priority1);
    if (queueMsg1) await bot.deleteMessage(chatId, queueMsg1.message_id).catch(() => {});

    try {

        await bot.sendChatAction(chatId, "upload_photo");


        const { data } = await axios.get(AIART_API_URL, {
            params: {
                prompt: prompt,
                model: "Anime",
                ratio: "1:1"
            },
            timeout: 120000
        });


        console.log("AI ART RESPONSE:", data);


        if (!data.status) {
            throw new Error(
                data.error || "AI generation failed"
            );
        }


        const image =
            data.image_url ||
            data.images?.[0];


        if (!image) {
            throw new Error("No image URL returned");
        }

        const consumed1 = imageUsage.consume(ctx, msg.from.id);
        if (!consumed1.allowed) return sendImageLimitNotice(chatId);

        await bot.sendPhoto(
            chatId,
            image,
            {
                caption:
`🎨 <b>αι ιмαgє gєηєяαтє∂</b>

📝 <b>ρяσмρт:</b>
<code>${prompt}</code>

🤖 <b>мσ∂єℓ:</b> ${data.model || "AI Art"}
📐 <b>яαтισ:</b> ${data.ratio || "1:1"}
⏱ <b>тιмє:</b> ${data.time_seconds || "N/A"}s`,
                parse_mode: "HTML"
            }
        );

        const afterQuota1 = imageUsage.status(ctx, msg.from.id);
        if (!afterQuota1.premium && afterQuota1.remaining <= 0) await sendImageLimitNotice(chatId);

    } catch (err) {

        console.log(
            "AI ART ERROR:",
            err.response?.data || err.message
        );


        await bot.sendMessage(
            chatId,
            `❌ <b>αι ιмαgє єяяσя</b>

${err.message}`,
            {
                parse_mode: "HTML"
            }
        );
    } finally {
        releaseGenSlot();
    }

});

bot.onText(/^\/anime(?:\s+(.+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;

    const query = match[1]?.trim();

    if (!query) {

        return bot.sendMessage(

            chatId,

`🌸 <b>мιѕѕ αяια • αηιмє</b>

<blockquote expandable='true'>

🔎 <b>υѕαgє</b>

<code>/anime naruto</code>

<code>/anime one piece</code>

<code>/anime demon slayer</code>

</blockquote>`,

            {

                parse_mode: "HTML",

                reply_to_message_id: msg.message_id

            }

        );

    }

    // ========================================================
    // Loading Animation
    // ========================================================

    const loadingFrames = [

        "🌸 <b>ѕєαя¢нιηg...</b>",

        "🌸 <b>ѕєαя¢нιηg.</b>",

        "🌸 <b>ѕєαя¢нιηg..</b>",

        "🌸 <b>ѕєαя¢нιηg...</b>",

        "✨ <b>ғєт¢нιηg αηιмє...</b>"

    ];

    const loading = await bot.sendMessage(

        chatId,

`${loadingFrames[0]}

<blockquote expandable='true'>

🌸 ᴍɪss ᴀʀɪᴀ ɪs sᴇᴀʀᴄʜɪɴɢ ᴀɴɪʟɪsᴛ...

</blockquote>`,

        {

            parse_mode: "HTML",

            reply_to_message_id: msg.message_id

        }

    );

    let frame = 0;

    const animation = setInterval(async () => {

        frame = (frame + 1) % loadingFrames.length;

        try {

            await bot.editMessageText(

`${loadingFrames[frame]}

<blockquote expandable='true'>

🌸 ᴍɪss ᴀʀɪᴀ ɪs sᴇᴀʀᴄʜɪɴɢ ᴀɴɪʟɪsᴛ...

</blockquote>`,

                {

                    chat_id: chatId,

                    message_id: loading.message_id,

                    parse_mode: "HTML"

                }

            );

        } catch {}

    }, 900);

    try {

                // ========================================================
        // Fetch Anime From AniList
        // ========================================================

        const { data } = await axios.post(

            "https://graphql.anilist.co",

            {

                query: ANILIST_QUERY,

                variables: {

                    search: query

                }

            },

            {

                timeout: 20000,

                headers: {

                    "Content-Type": "application/json",

                    "Accept": "application/json",

                    "User-Agent": "Miss-Aria"

                }

            }

        );

        clearInterval(animation);

        try {

            await bot.deleteMessage(
                chatId,
                loading.message_id
            );

        } catch {}

        if (
            !data ||
            !data.data ||
            !data.data.Media
        ) {

            return bot.sendMessage(

                chatId,

`❌ <b>ησ αηιмє ƒσυη∂.</b>

<blockquote expandable='true'>

Try another anime title.

</blockquote>`,

                {

                    parse_mode: "HTML",

                    reply_to_message_id: msg.message_id

                }

            );

        }

        const anime = data.data.Media;

        // ========================================================
        // Clean Description
        // ========================================================

        const synopsis = escapeHTML(

            (anime.description || "No synopsis available.")

                .replace(/<br>/gi, "\n")

                .replace(/<\/?i>/gi, "")

                .replace(/<\/?b>/gi, "")

                .replace(/\r/g, "")

                .trim()

        );

        // ========================================================
        // Trailer
        // ========================================================

        let trailer = null;

        if (

            anime.trailer &&

            anime.trailer.site &&

            anime.trailer.site.toLowerCase() === "youtube"

        ) {

            trailer = `https://youtu.be/${anime.trailer.id}`;

        }

        // ========================================================
        // Buttons
        // ========================================================

        const keyboard = {

            inline_keyboard: [

                [

                    {

                        text: "📖 αηιℓιѕт",

                        url: anime.siteUrl

                    },

                    ...(trailer

                        ? [

                            {

                                text: "🎬 тяαιℓєя",

                                url: trailer

                            }

                        ]

                        : [])

                ]

            ]

        };

        // ========================================================
        // Studio
        // ========================================================

        const studio =

            anime.studios?.nodes?.length

                ? anime.studios.nodes

                      .map(x => x.name)

                      .join(", ")

                : "Unknown";

        // ========================================================
        // Caption
        // ========================================================

        const caption =

`🌸 <b>${escapeHTML(anime.title.english || anime.title.romaji)}</b>

<blockquote expandable='true'>

🎌 <b>ηαтινє</b>
${escapeHTML(anime.title.native || "N/A")}

⭐ <b>ѕ¢σяє</b>
${anime.averageScore || "N/A"}%

📺 <b>ѕтαтυѕ</b>
${escapeHTML(anime.status || "Unknown")}

🎬 <b>ғσямαт</b>
${escapeHTML(anime.format || "Unknown")}

🎞 <b>єριѕσ∂єѕ</b>
${anime.episodes || "?"}

⏱ <b>∂υяαтιση</b>
${anime.duration || "?"} min

🌸 <b>ѕєαѕση</b>
${escapeHTML(anime.season || "?")} ${anime.seasonYear || ""}

🎭 <b>gєηяєѕ</b>
${anime.genres.join(", ")}

🏢 <b>ѕтυ∂ισ</b>
${escapeHTML(studio)}

❤️ <b>ғανσяιтєѕ</b>
${anime.favourites.toLocaleString()}

👥 <b>ρσρυℓαяιту</b>
${anime.popularity.toLocaleString()}

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`;
                // ========================================================
        // Send Anime Poster
        // ========================================================

        await bot.sendPhoto(

            chatId,

            anime.coverImage.extraLarge,

            {

                caption,

                parse_mode: "HTML",

                reply_markup: keyboard,

                reply_to_message_id: msg.message_id

            }

        );

        // ========================================================
        // Build Synopsis
        // ========================================================

        const fullSynopsis =

`📝 <b>${escapeHTML(anime.title.english || anime.title.romaji)} • sʏɴᴏᴘsɪs</b>

<blockquote expandable='true'>

${synopsis}

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`;

        // ========================================================
        // Split Into Pages
        // ========================================================

        const pages = splitText(fullSynopsis);

        for (let i = 0; i < pages.length; i++) {

            const pageText =

`${pages[i]}

━━━━━━━━━━━━━━━━━━━━━━

📄 <b>Page ${i + 1}/${pages.length}</b>`;

            await bot.sendMessage(

                chatId,

                pageText,

                {

                    parse_mode: "HTML",

                    reply_to_message_id: msg.message_id,

                    // Buttons only on the last page
                    reply_markup:

                        i === pages.length - 1

                            ? keyboard

                            : undefined

                }

            );

        }

    }

    // ========================================================
    // Error Handling
    // ========================================================

    catch (err) {

        clearInterval(animation);

        console.log(

            "Anime Error:",

            err.response?.data ||

            err.message

        );

        try {

            await bot.deleteMessage(

                chatId,

                loading.message_id

            );

        } catch {}

        await bot.sendMessage(

            chatId,

`❌ <b>ғαιℓє∂ тσ ƒєт¢н αηιмє.</b>

<blockquote expandable='true'>

Please try again later.

If the problem continues,
AniList may be temporarily unavailable.

</blockquote>

🌸 <b>мιѕѕ αяια</b>`,

            {

                parse_mode: "HTML",

                reply_to_message_id: msg.message_id

            }

        );

    }

});

bot.onText(/^\/anime3(?:\s+(.+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const query = match[1]?.trim();

    if (!query) {

        return bot.sendMessage(
            chatId,
`🌸 <b>мιѕѕ αяια • αηιмє</b>

<blockquote expandable='true'>

🔎 <b>υѕαgє</b>

<code>/anime naruto</code>

<code>/anime one piece</code>

<code>/anime bleach</code>

</blockquote>`,
            {
                parse_mode:"HTML",
                reply_to_message_id:msg.message_id
            }
        );

    }

    const frames = [

        "🌸 <b>ѕєαя¢нιηg...</b>",
        "🌸 <b>ѕєαя¢нιηg.</b>",
        "🌸 <b>ѕєαя¢нιηg..</b>",
        "🌸 <b>ѕєαя¢нιηg...</b>"

    ];

    const wait = await bot.sendMessage(

        chatId,

`${frames[0]}

<blockquote expandable='true'>

✨ ᴍɪss ᴀʀɪᴀ ɪs ʟᴏᴏᴋɪɴɢ ꜰᴏʀ ʏᴏᴜʀ ᴀɴɪᴍᴇ...

</blockquote>`,

        {

            parse_mode:"HTML",

            reply_to_message_id:msg.message_id

        }

    );

    let frame = 0;

    const animation = setInterval(async()=>{

        frame=(frame+1)%frames.length;

        try{

            await bot.editMessageText(

`${frames[frame]}

<blockquote expandable='true'>

✨ ᴍɪss ᴀʀɪᴀ ɪs ʟᴏᴏᴋɪɴɢ ꜰᴏʀ ʏᴏᴜʀ ᴀɴɪᴍᴇ...

</blockquote>`,

            {

                chat_id:chatId,

                message_id:wait.message_id,

                parse_mode:"HTML"

            });

        }catch{}

    },900);

    try{

        const {data}=await axios.post(

            "https://graphql.anilist.co",

            {

                query:ANILIST_QUERY,

                variables:{

                    search:query

                }

            }

        );

        clearInterval(animation);

        try{

            await bot.deleteMessage(chatId,wait.message_id);

        }catch{}

        const anime=data.data.Media;

        if(!anime){

            return bot.sendMessage(

                chatId,

                "❌ <b>ησ αηιмє ƒσυη∂.</b>",

                {

                    parse_mode:"HTML",

                    reply_to_message_id:msg.message_id

                }

            );

        }

        const trailer =

anime.trailer && anime.trailer.site==="youtube"

?`https://youtu.be/${anime.trailer.id}`

:null;

        const caption=

`🌸 <b>${anime.title.english||anime.title.romaji}</b>

<blockquote expandable='true'>

🎌 <b>ηαтινє</b>
${anime.title.native||"N/A"}

⭐ <b>ѕ¢σяє</b>
${anime.averageScore||"N/A"}%

📺 <b>ѕтαтυѕ</b>
${anime.status}

🎬 <b>ғσямαт</b>
${anime.format}

🎞 <b>єριѕσ∂єѕ</b>
${anime.episodes||"Unknown"}

⏱ <b>∂υяαтιση</b>
${anime.duration||"?"} min

🌸 <b>ѕєαѕση</b>
${anime.season||"?"} ${anime.seasonYear||""}

🎭 <b>gєηяєѕ</b>
${anime.genres.join(", ")}

🏢 <b>ѕтυ∂ισ</b>
${anime.studios.nodes.map(x=>x.name).join(", ")||"Unknown"}

❤️ <b>ғανσяιтєѕ</b>
${anime.favourites.toLocaleString()}

👥 <b>ρσρυℓαяιту</b>
${anime.popularity.toLocaleString()}

📝 <b>ѕуησρѕιѕ</b>

${anime.description
.replace(/<[^>]+>/g,"")
.substring(0,900)}

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`;

        const keyboard={

            inline_keyboard:[

                [

                    {

                        text:"📖 αηιℓιѕт",

                        url:anime.siteUrl,
                        style:'primary'

                    },

                    ...(trailer?[{

                        text:"🎬 тяαιℓєя",

                        url:trailer,
                        style: 'success'

                    }]:[])

                ]

            ]

        };

        await bot.sendPhoto(

            chatId,

            anime.coverImage.extraLarge,

            {

                caption,

                parse_mode:"HTML",

                reply_markup:keyboard,

                reply_to_message_id:msg.message_id

            }

        );

    }catch(err){

        clearInterval(animation);

        console.log(err.response?.data||err.message);

        try{

            await bot.editMessageText(

`❌ <b>ғαιℓє∂ тσ ƒєт¢н αηιмє.</b>

<blockquote expandable='true'>

Please try again in a few moments.

</blockquote>`,

            {

                chat_id:chatId,

                message_id:wait.message_id,

                parse_mode:"HTML"

            });

        }catch{}

    }

});

bot.onText(/^\/youtube1(?:\s+(.+))?$/i, async (msg, match) => {


    const chatId = msg.chat.id;

    const youtubeUrl = match[1]?.trim();



    if (!youtubeUrl) {


        return bot.sendMessage(

            chatId,

`🎵 <b>мιѕѕ αяια мυѕι¢ ∂σωηℓσα∂єя</b>

<blockquote expandable='true'>

Download music from YouTube.

<b>υѕαgє</b>

<code>/youtube1 YouTube_URL</code>

<b>єxαмρℓє</b>

<code>/youtube1 https://youtube.com/watch?v=xxxx</code>

</blockquote>

🌸 Powered by Miss Aria`,

            {

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );

    }



    const loading = await bot.sendMessage(

        chatId,

`🎧 <b>мυѕι¢ ∂σωηℓσα∂єя</b>

<blockquote expandable='true'>

⏳ Processing your link...

</blockquote>`,

        {

        parse_mode:"HTML",

        reply_to_message_id:
        msg.message_id

        }

    );



    try {



        let audioUrl = null;



        let apiResponse;



        // ==========================
        // TRY GET METHOD
        // ==========================


        try {


            const api =

            `https://prexzyapis.com/sound/download?url=${encodeURIComponent(youtubeUrl)}`;



            apiResponse = await axios.get(api, {


                timeout:120000,


                headers:{


                    "User-Agent":
                    "Mozilla/5.0",

                    "Accept":
                    "application/json"

                },


                validateStatus:()=>true


            });



            console.log(
                "PREXZY GET:",
                apiResponse.data
            );



            const data = apiResponse.data;



            audioUrl =

            data.url ||

            data.download ||

            data.audio ||

            data.link ||

            data.result?.url;



        } catch(e){



            console.log(
                "GET FAILED:",
                e.message
            );


        }




        // ==========================
        // TRY POST METHOD
        // ==========================


        if(!audioUrl){



            const postResponse = await axios.post(

                "https://prexzyapis.com/sound/download",


                {

                    url:youtubeUrl

                },


                {


                timeout:120000,


                headers:{


                    "Content-Type":
                    "application/json",


                    "User-Agent":
                    "Mozilla/5.0"


                },


                validateStatus:()=>true


                }


            );



            console.log(
                "PREXZY POST:",
                postResponse.data
            );



            const data =
            postResponse.data;



            audioUrl =


            data.url ||

            data.download ||

            data.audio ||

            data.link ||

            data.result?.url;



        }




        if(!audioUrl){


            throw new Error(
                "Prexzy did not return audio link"
            );


        }





        await bot.deleteMessage(

            chatId,

            loading.message_id

        ).catch(()=>{});





        await bot.sendAudio(

            chatId,

            audioUrl,

            {


            caption:

`🎵 <b>мυѕι¢ яєα∂у</b>

<blockquote expandable='true'>

✅ Download complete

🔗 Source:
YouTube

🌸 Powered by Miss Aria

</blockquote>`,



            parse_mode:"HTML",


            reply_to_message_id:
            msg.message_id


            }


        );





    } catch(err){



        console.log(

            "MUSIC ERROR:",

            err.response?.data ||
            err.message

        );



        await bot.deleteMessage(

            chatId,

            loading.message_id

        ).catch(()=>{});



        await bot.sendMessage(

            chatId,

`❌ <b>мυѕι¢ ∂σωηℓσα∂ ƒαιℓє∂</b>

<blockquote expandable='true'>

${err.response?.data?.error || err.message}

</blockquote>

🌸 Miss Aria`,

            {

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );


    }



});

bot.onText(/^\/youtube(?:\s+(.+))?$/i, async (msg, match) => {


    const chatId = msg.chat.id;

    const url = match[1]?.trim();



    if(!url){

        return bot.sendMessage(
            chatId,

`🎵 <b>мιѕѕ αяια мυѕι¢ ∂σωηℓσα∂єя</b>

<blockquote expandable='true'>

Usage:

<code>/youtube YouTube_URL</code>

Example:

<code>/youtube https://youtube.com/watch?v=xxxxx</code>

</blockquote>

🌸 Powered by Miss Aria`,

{
parse_mode:"HTML",
reply_to_message_id:msg.message_id
}

        );

    }



    const loading = await bot.sendMessage(

        chatId,

`🎧 <b>∂σωηℓσα∂ιηg мυѕι¢...</b>

<blockquote expandable='true'>

⏳ Processing your link...

</blockquote>`,

{
parse_mode:"HTML",
reply_to_message_id:msg.message_id
}

    );



    try{


        const api =

        `https://prexzyapis.com/sound/download?url=${encodeURIComponent(url)}`;



        const response = await axios.get(api,{

            timeout:120000,

            headers:{
                "User-Agent":"Mozilla/5.0",
                "Accept":"application/json"
            }

        });



        console.log(
            "PREXZY:",
            response.data
        );



        let audioUrl;



        // Different possible response formats

        audioUrl =
        response.data.url ||
        response.data.download ||
        response.data.audio ||
        response.data.result?.url;



        if(!audioUrl){

            throw new Error(
                "No audio link returned"
            );

        }



        await bot.deleteMessage(
            chatId,
            loading.message_id
        );



        await bot.sendAudio(

            chatId,

            audioUrl,

            {

            caption:

`🎵 <b>мυѕι¢ яєα∂у</b>

<blockquote expandable='true'>

🔗 Source:
YouTube

⚡ Powered by Miss Aria

</blockquote>`,

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );



    }catch(err){



        console.log(
            "MUSIC ERROR:",
            err.response?.data ||
            err.message
        );



        try{

            await bot.deleteMessage(
                chatId,
                loading.message_id
            );

        }catch{}



        bot.sendMessage(

            chatId,

`❌ <b>мυѕι¢ ∂σωηℓσα∂ ƒαιℓє∂</b>

<blockquote expandable='true'>

${err.message}

</blockquote>

🌸 Miss Aria`,

            {

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );


    }


});

bot.onText(/^\/animeimage(?:\s+([\s\S]+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;

    let input = match[1]?.trim();

    if (!input) {

        return bot.sendMessage(
            chatId,

`🌸 <blockquote><b>мιѕѕ αяια • αηιмє ιмαgє</b></blockquote>

<blockquote expandable='true'>

🎨 <b>gєηєяαтє вєαυтιƒυℓ αηιмє αятωσяк ωιтн αι.</b>

<b>υѕαgє</b>

<code>/animeimage &lt;prompt&gt;</code>

<b>єxαмρℓєѕ</b>

<code>/animeimage cute anime girl with blue eyes</code>

<code>/animeimage cyberpunk samurai in Tokyo</code>

<code>/animeimage fox spirit princess under cherry blossoms</code>

<code>/animeimage white dragon flying above mountains</code>

<b>ηєgαтινє ρяσмρт</b>

<code>/animeimage anime girl --negative blurry, bad quality</code>

✨ <b>тιρ:</b> Detailed prompts create better images.

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`,

            {
                parse_mode:"HTML",
                reply_to_message_id:msg.message_id
            }
        );
    }


    let prompt = input;
    let negative = "";


    if(input.includes("--negative")){

        const split = input.split("--negative");

        prompt = split[0].trim();
        negative = split.slice(1).join("--negative").trim();

    }


    const start = Date.now();


    const loading = await bot.sendMessage(
        chatId,

`🎨 <b>мιѕѕ αяια αηιмє ѕтυ∂ισ</b>

━━━━━━━━━━━━━━━━━━

🧠 <b>υη∂єяѕтαη∂ιηg уσυя ρяσмρт...</b>

<code>█░░░░░░░░░</code>

<b>10%</b>`,

{
parse_mode:"HTML",
reply_to_message_id:msg.message_id
}

);



const frames=[

["🧠 Understanding your prompt...",20],
["🎨 Creating composition...",40],
["✨ Rendering anime...",65],
["🌈 Coloring masterpiece...",85],
["🖌 Finalizing image...",100]

];


let frame=0;


const animation=setInterval(async()=>{


if(frame >= frames.length){

clearInterval(animation);
return;

}


const [text,percent]=frames[frame++];


const filled=Math.floor(percent/10);


const bar =
"█".repeat(filled)+
"░".repeat(10-filled);



try{


await bot.editMessageText(

`🎨 <b>мιѕѕ αяια αηιмє ѕтυ∂ισ</b>

━━━━━━━━━━━━━━━━━━

${text}

<code>${bar}</code>

<b>${percent}%</b>`,

{

chat_id:chatId,

message_id:loading.message_id,

parse_mode:"HTML"

});


}catch{}


},1200);





try{


let imageBuffer;

let engine="Prexzy";



// ============================
// PREXZY ENGINE
// ============================


try{


const url =
`https://prexzyapis.com/ai/anime?prompt=${encodeURIComponent(prompt)}&negative_prompt=${encodeURIComponent(negative)}`;



const response = await axios.get(url,{

responseType:"arraybuffer",

timeout:60000,

validateStatus:()=>true

});



const contentType =
response.headers["content-type"] || "";



if(contentType.startsWith("image/")){


imageBuffer =
Buffer.from(response.data);


}else{


throw new Error(
"Prexzy did not return image"
);


}



}catch(err){



console.log(
"Prexzy failed:",
err.message
);



engine="Pollinations";



// ============================
// POLLINATIONS FALLBACK
// ============================


const pollinationsUrl =

`https://image.pollinations.ai/prompt/${encodeURIComponent(

`${prompt}, anime style, masterpiece, ultra detailed`

)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;



const response =
await axios.get(
pollinationsUrl,
{
responseType:"arraybuffer",
timeout:120000
}
);



imageBuffer =
Buffer.from(response.data);



}




clearInterval(animation);



try{

await bot.deleteMessage(
chatId,
loading.message_id
);

}catch{}



const seconds =
((Date.now()-start)/1000).toFixed(1);



const sessionId =
Date.now().toString();



if(typeof animeSessions !== "undefined"){

animeSessions.set(
sessionId,
{
prompt,
negative
}
);

}



await bot.sendPhoto(

chatId,

imageBuffer,

{


caption:

`✨ <b>αηιмє ιмαgє gєηєяαтє∂</b>

<blockquote expandable='true'>

📝 <b>ρяσмρт</b>

<code>${escapeHtml(prompt)}</code>

${negative ?

`🚫 <b>ηєgαтινє</b>

<code>${escapeHtml(negative)}</code>

`
:""}

⚡ <b>єηgιηє</b>

${engine}

⏱ <b>тιмє</b>

${seconds}s

🎨 <b>ѕтуℓє</b>

Anime

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`,



parse_mode:"HTML",


reply_to_message_id:
msg.message_id,



reply_markup:{


inline_keyboard:[


[

{

text:"🔄 яєgєηєяαтє",

callback_data:
`anime_regen_${sessionId}`,

style: 'success'
},


{

text:"🎨 New Prompt",

switch_inline_query_current_chat:
"/animeimage ",

style: 'primary'

}

]


]


}


}

);



}catch(err){



clearInterval(animation);



console.log(
"IMAGE ERROR:",
err.message
);



try{

await bot.deleteMessage(
chatId,
loading.message_id
);

}catch{}



await bot.sendMessage(

chatId,

`❌ <b>ιмαgє gєηєяαтιση ƒαιℓє∂</b>

<blockquote expandable='true'>

Both AI image engines failed.

<code>${escapeHtml(err.message)}</code>

</blockquote>

🌸 <b>мιѕѕ αяια</b>`,

{

parse_mode:"HTML",

reply_to_message_id:
msg.message_id

}

);



}



});

bot.on("callback_query",async(query)=>{

    if(!query.data.startsWith("anime_regen_")) return;

    const sessionId=query.data.replace("anime_regen_","");

    const session=animeSessions.get(sessionId);

    if(!session){

        return bot.answerCallbackQuery(query.id,{
            text:"Session expired."
        });

    }

    await bot.answerCallbackQuery(query.id,{
        text:"🔄 Regenerating..."
    });

    const url=

`https://prexzyapis.com/ai/anime?prompt=${encodeURIComponent(session.prompt)}&negative_prompt=${encodeURIComponent(session.negative)}`;

    try{

        const response=await axios.get(url,{
            responseType:"arraybuffer"
        });

        await bot.sendPhoto(

            query.message.chat.id,

            Buffer.from(response.data),

            {

                caption:

`🌸 <b>яєgєηєяαтє∂ ѕυ¢¢єѕѕƒυℓℓу</b>

📝 ${session.prompt}`,

                parse_mode:"HTML",

                reply_to_message_id:query.message.message_id

            }

        );

    }catch{

        bot.sendMessage(

            query.message.chat.id,

            "❌ Failed to regenerate."

        );

    }

});

bot.onText(/^\/image\s+(abstract|anime)\s+(.+)/i, async (msg, match) => {

    const chatId = msg.chat.id;

    const style = match[1].toLowerCase();
    const input = match[2].trim();

    if (!canGenerateImages(msg.from.id)) {
        return sendImageSignupGate(chatId, msg.message_id);
    }

    const imageQuota2 = imageUsage.status(ctx, msg.from.id);
    if (!imageQuota2.premium && imageQuota2.remaining <= 0) return sendImageLimitNotice(chatId);

    let prompt = input;
    let negativePrompt = "";

    if (input.includes("--negative")) {
        const parts = input.split("--negative");
        prompt = parts[0].trim();
        negativePrompt = parts[1].trim();
    }

    const loadingFrames = [
        "🎨 <b>gєηєяαтιηg ιмαgє.</b>",
        "🎨 <b>gєηєяαтιηg ιмαgє..</b>",
        "🎨 <b>gєηєяαтιηg ιмαgє...</b>",
        "✨ <b>вяιηgιηg уσυя ι∂єα тσ ℓιғє...</b>"
    ];

    const waiting = await bot.sendMessage(
        chatId,
        `${loadingFrames[0]}\n\n<blockquote expandable='true'>🌸 ᴍɪss ᴀʀɪᴀ ɪs ᴄʀᴇᴀᴛɪɴɢ ʏᴏᴜʀ ᴀʀᴛ...</blockquote>`,
        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );

    let frame = 0;

    const animation = setInterval(async () => {

        frame = (frame + 1) % loadingFrames.length;

        try {

            await bot.editMessageText(
                `${loadingFrames[frame]}

<blockquote expandable='true'>🌸 ᴍɪss ᴀʀɪᴀ ɪs ᴄʀᴇᴀᴛɪɴɢ ʏᴏᴜʀ ᴀʀᴛ...</blockquote>`,
                {
                    chat_id: chatId,
                    message_id: waiting.message_id,
                    parse_mode: "HTML"
                }
            );

        } catch {}

    }, 1000);

    try {

        let endpoint;

        if (style === "abstract") {

            endpoint =
                `https://prexzyapis.com/ai/abstract?prompt=${encodeURIComponent(prompt)}&negative_prompt=${encodeURIComponent(negativePrompt)}`;

        } else {

            endpoint =
                `https://prexzyapis.com/ai/anime?prompt=${encodeURIComponent(prompt)}&negative_prompt=${encodeURIComponent(negativePrompt)}`;

        }

        const response = await axios.get(endpoint, {
            responseType: "arraybuffer"
        });

        clearInterval(animation);

        try {
            await bot.deleteMessage(chatId, waiting.message_id);
        } catch {}

        const consumed2 = imageUsage.consume(ctx, msg.from.id);
        if (!consumed2.allowed) return sendImageLimitNotice(chatId);

        await bot.sendPhoto(
            chatId,
            Buffer.from(response.data),
            {
                caption:
`🎨 <b>ιмαgє gєηєяαтє∂</b>

<blockquote expandable='true'>
🎭 <b>ѕтуℓє:</b> <code>${style}</code>

📝 <b>ρяσмρт:</b>
<code>${prompt}</code>

${negativePrompt ? `🚫 <b>ηєgαтινє:</b>\n<code>${negativePrompt}</code>\n` : ""}
✨ <b>ѕтαтυѕ:</b> <i>sᴜᴄᴄᴇssғᴜʟʟʏ ɢᴇɴᴇʀᴀᴛᴇᴅ</i>
</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`,
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );

        const afterQuota2 = imageUsage.status(ctx, msg.from.id);
        if (!afterQuota2.premium && afterQuota2.remaining <= 0) await sendImageLimitNotice(chatId);

    } catch (err) {

        clearInterval(animation);

        console.error(err.response?.data || err.message);

        try {

            await bot.editMessageText(
                `❌ <b>gєηєяαтιση ƒαιℓє∂</b>

<blockquote expandable='true'>ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ᴀ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛs.</blockquote>`,
                {
                    chat_id: chatId,
                    message_id: waiting.message_id,
                    parse_mode: "HTML"
                }
            );

        } catch {}

    }

});

bot.onText(
/\/play (.+)/,
(msg,match)=>{


const gameName =
match[1].toLowerCase();


const user = {

id: msg.from.id,

username:
msg.from.username,

first_name:
msg.from.first_name

};


try{


const result =
gameManager.startGame(
user,
gameName
);



bot.sendMessage(

msg.chat.id,

result.text,

{

reply_markup:{

keyboard:

gameManager
.getGame(gameName)
.getKeyboard(),

resize_keyboard:true

}

}

);



}

catch(err){


console.log(err);


bot.sendMessage(

msg.chat.id,

"❌ Game not found."

);


}


});

bot.onText(
/\/games/,
(msg)=>{

const meta = gameManager.getAllGamesMeta
  ? gameManager.getAllGamesMeta()
  : [];

const list = meta.length
  ? meta.map(g => `${g.label} -> /play ${g.name}`).join("\n")
  : "pirate\nzombie\ndungeon\ndetective\nspace\nstory";

bot.sendMessage(

msg.chat.id,

`GUARDIAN AI ADVENTURES - ${meta.length || 6} GAMES

${list}

Start any game with: /play <name>
Example: /play ninja

While playing, type "chat ai" or "talk to ai" any time to pause the game and go back to chatting normally.`

);


});

bot.on("message", async (msg) => {

  const isPrivateMsg = msg.chat.type === "private";

  const maybePending = isPrivateMsg
    ? getPending(msg.from.id)
    : null;


  if (
    !msg.text &&
    !msg.photo &&
    !msg.sticker &&
    !msg.forward_from &&
    !msg.forward_from_chat &&
    !msg.new_chat_photo &&
    !msg.delete_chat_photo
  ) {

    if (
      !(
        maybePending &&
        maybePending.action === "admin_broadcast"
      )
    ) {
      return;
    }

  }

  const chatId = msg.chat.id;
  const sender = msg.from;

  const isPrivate = msg.chat.type === "private";

  const isGroup =
    msg.chat.type === "group" ||
    msg.chat.type === "supergroup";

  const isCommand =
    msg.text &&
    msg.text.startsWith("/");
const me = await bot.getMe();

const botMentioned =
    isGroup &&
    msg.text &&
    msg.text.toLowerCase().includes(`@${me.username.toLowerCase()}`);

const repliedToBot =
    isGroup &&
    msg.reply_to_message &&
    msg.reply_to_message.from &&
    msg.reply_to_message.from.id === me.id;

// Mention handling is owned by handlers/13_aria_ai_companion.js.
// Keep this legacy group-AI path for replies to the bot only so a
// username mention does not produce duplicate AI replies.
if (repliedToBot) {

    if (!userHistory.has(sender.id)) {
        userHistory.set(sender.id, []);
    }

    const history = userHistory.get(sender.id);

    await bot.sendChatAction(chatId, "typing");

    let input = "";
    let imageUrl = null;

    // ==========================
    // TEXT
    // ==========================

    if (msg.text) {

        input = msg.text
            .replace(
                new RegExp(`@${me.username}`, "ig"),
                ""
            )
            .trim();

        if (!input) input = "Hi";

    }

    // ==========================
    // PHOTO
    // ==========================

    else if (msg.photo) {

        try {

            const biggestPhoto =
                msg.photo[msg.photo.length - 1];

            const file =
                await bot.getFile(
                    biggestPhoto.file_id
                );

            imageUrl =
                `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;

            input =
                msg.caption ||
                "Describe this image in detail.";

        } catch (err) {

            console.log(
                "GROUP PHOTO ERROR:",
                err.message
            );

            input =
                "The user sent an image, but it couldn't be downloaded.";

        }

    }

    // ==========================
    // STICKER
    // ==========================

    else if (msg.sticker) {

        input = `The user sent a Telegram sticker.

Emoji: ${msg.sticker.emoji || "🙂"}

React naturally to it like a real friend.`;

    }

    else {

        input = "Hi";

    }

    // ==========================
    // AI
    // ==========================

    if (!canUseAi(sender.id)) {
        await sendSignupGate(chatId, msg.message_id);
        return;
    }

    const result =
        await processWithFailover(

            sender.id,

            input,

            history,

            {

                msg,

                imageUrl,

                category: null,

                systemPrompt: null,

                forceFreeOnly: false,

                preferredModel: null

            }

        );

    if (!result.success) {

        await bot.sendMessage(
            chatId,
            "⚙️ Miss Aria is temporarily unavailable.",
            {
                reply_to_message_id: msg.message_id
            }
        );

        return;

    }

    const parts =
        formatAiReplyForTelegram(result.response);

    for (const part of parts) {

        await bot.sendMessage(
            chatId,
            part,
            {
                parse_mode: "HTML",
                reply_to_message_id:
                    msg.message_id
            }
        );

    }

    // ==========================
    // MEMORY
    // ==========================

    let userContent = "";

    if (msg.text) {

        userContent = input;

    }

    else if (msg.photo) {

        userContent =
            `[Telegram Photo] ${msg.caption || ""}`;

    }

    else if (msg.sticker) {

        userContent =
            `[Telegram Sticker | ${msg.sticker.emoji || "🙂"}]`;

    }

    history.push(

        {
            role: "user",
            content: userContent
        },

        {
            role: "assistant",
            content: result.response
        }

    );

    if (history.length > 40) {

        history.splice(
            0,
            history.length - 40
        );

    }

    userHistory.set(
        sender.id,
        history
    );

    return;

}
  // Continue your message handling logic here...
// ======================================
// Save Telegram Stickers
// ======================================

if (msg.sticker) {
    let stickers = [];

    try {
        if (fs.existsSync("./stickers.json")) {
            stickers = JSON.parse(
                fs.readFileSync("./stickers.json", "utf8")
            );
        }
    } catch {
        stickers = [];
    }

    if (!stickers.includes(msg.sticker.file_id)) {
        stickers.push(msg.sticker.file_id);

        fs.writeFileSync(
            "./stickers.json",
            JSON.stringify(stickers, null, 2)
        );

        console.log("✨ New sticker learned:", msg.sticker.file_id);

        // Don't send any message to the user.
    }

    return;
}
    // ===============================
// GAME SYSTEM PRIORITY
// ===============================
if (msg.text) {

    const text = msg.text.toLowerCase().trim();

    const gameNames = (gameManager.getAllGamesMeta
        ? gameManager.getAllGamesMeta().map(g => g.name)
        : ["pirate", "zombie", "dungeon", "detective", "space", "story"]
    );

    // ==========================
    // EXIT GAME -> HAND OFF TO AI
    // ==========================
    // If a session is active and the user wants out (explicit exit word,
    // or something like "let me chat the ai" / "talk to ai"), end the
    // session for real and let this same message fall through to the
    // normal AI chat handler below instead of getting eaten by the game.

    const AI_HANDOFF_RE = /\b(chat|talk|speak)\b.{0,15}\b(ai|bot)\b|\b(ai|bot)\b.{0,15}\bchat\b/i;
    const EXIT_WORDS = ["quit", "exit", "leave", "stop", "stop game", "exit game", "quit game"];

    const activeSession = gameManager.getSession(msg.from.id);

    if (activeSession && (EXIT_WORDS.includes(text) || AI_HANDOFF_RE.test(text))) {

        gameManager.endSession(msg.from.id);

        await bot.sendMessage(
            msg.chat.id,
            "Game paused — you're back to chatting with the AI. Type a game name any time to play again.",
            { reply_markup: { remove_keyboard: true } }
        );

        // No return here — let this same message continue down to the
        // normal AI chat handler further below, in case it was also a
        // real question (e.g. "let's chat, how's the weather?").
    } else {

        // ==========================
        // START NEW GAME
        // ==========================

        if (gameNames.includes(text)) {

            const user = {
                id: msg.from.id,
                username: msg.from.username || "",
                first_name: msg.from.first_name || ""
            };

            try {

                const result = gameManager.startGame(user, text);

                await bot.sendMessage(
                    msg.chat.id,
                    result.text,
                    {
                        reply_markup: {
                            keyboard: gameManager
                                .getGame(text)
                                .getKeyboard(),
                            resize_keyboard: true
                        }
                    }
                );

                return; // Game started

            } catch (err) {

                console.error("GAME START ERROR:", err);

                await bot.sendMessage(
                    msg.chat.id,
                    "Game failed to start."
                );

                return;
            }
        }

        // ==========================
        // CONTINUE GAME
        // ==========================

        const session = gameManager.getSession(msg.from.id);

        if (session) {

            const game = gameManager.getGame(session.game);

            if (game && typeof game.getKeyboard === "function") {

                const gameInputs = game
                    .getKeyboard()
                    .flat()
                    .map(btn => btn.toLowerCase().trim());

                if (gameInputs.includes(text)) {

                    try {

                        const result = await gameManager.continueGame(
                            msg.from.id,
                            text
                        );

                        if (result && result.text) {
                            await bot.sendMessage(
                                msg.chat.id,
                                result.text,
                                result.end
                                    ? { reply_markup: { remove_keyboard: true } }
                                    : {}
                            );
                        }

                        // If the game itself signalled it ended (e.g. its own
                        // exit-word handling), also clear the session so the
                        // next message goes straight to AI without needing a
                        // second exit command.
                        if (result && result.end) {
                            gameManager.endSession(msg.from.id);
                        }

                        return; // Only block AI for valid game inputs

                    } catch (err) {

                        console.error("GAME CONTINUE ERROR:", err);

                        await bot.sendMessage(
                            msg.chat.id,
                            "Game error occurred."
                        );

                        return;
                    }
                }
            }
        }
    }

    // ==========================
    // NOT A GAME MESSAGE
    // AI WILL HANDLE IT BELOW
    // ==========================
}
// AI handles all other messages
// ===============================
// 🤖 AI SYSTEM STARTS BELOW HERE
// ===============================
  // --- AI Sticker Recognition (only for stickers, doesn't block other message types) ---
  if (msg.sticker) {
    try {
      const result = await stickerRecognitionService.analyzeSticker({
        bot,
        stickerFileId: msg.sticker.file_id,
        userId: sender.id,
      });

      console.log("Sticker AI:", result.text);

      await bot.sendMessage(chatId, result.text);
    } catch (error) {
      console.error("Sticker recognition error:", error);
    }
    // NOTE: no `return` here — decide below whether stickers should
    // still flow into group moderation checks further down.
  }

  // --- Group/supergroup photo (avatar) changed — revert or remove it ---
  if (isGroup && (msg.new_chat_photo || msg.delete_chat_photo)) {
    await handleChatPhotoChanged(chatId, msg.message_id, msg.chat.title);
    return;
  }

  // ... rest of your handler continues unchanged

  // --- Private chat: menu multi-step flows (Add Channel/Group, Promote User) ---
  if (isPrivate && !isCommand) {
    const pending = getPending(sender.id);

    if (pending && (pending.action === "admin_addprem" || pending.action === "admin_removeprem")) {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      const target = await resolveTargetFromMessage(msg);
      if (!target) {
        await bot.sendMessage(chatId, "Couldn't resolve that. Send a numeric ID, forward a message from them, or send their @username.");
        return;
      }
      const grantingPrem = pending.action === "admin_addprem";
      setPlan(target.id, grantingPrem ? "premium" : "free");
      clearPending(sender.id);
      await bot.sendMessage(
        chatId,
        grantingPrem
          ? `✅ Granted premium to ${target.label} (${target.id}).`
          : `✅ Removed premium from ${target.label} (${target.id}).`,
        { reply_markup: backToAdminKeyboard() }
      );
      try {
        await bot.sendMessage(
          target.id,
          grantingPrem
            ? "🎉 You've been granted *Premium* access!"
            : "Your *Premium* access has been removed.",
          { parse_mode: "Markdown" }
        );
      } catch {
        // target hasn't started the bot — nothing we can do
      }
      return;
    }

    if (pending && (pending.action === "admin_addadmin" || pending.action === "admin_deladmin")) {
      if (!canManageAdmins(sender.id)) {
        clearPending(sender.id);
        return;
      }
      const target = await resolveTargetFromMessage(msg);
      if (!target) {
        await bot.sendMessage(chatId, "Couldn't resolve that. Send a numeric ID, forward a message from them, or send their @username.");
        return;
      }
      clearPending(sender.id);
      if (pending.action === "admin_addadmin") {
        const added = addBotAdmin(target.id);
        await bot.sendMessage(
          chatId,
          added ? `✅ ${target.label} (${target.id}) is now a bot admin.` : `${target.label} was already a bot admin.`,
          { reply_markup: backToAdminKeyboard() }
        );
      } else {
        const result = removeBotAdmin(target.id);
        const text =
          result === "owner" ? "🚫 Can't remove the owner." :
          result === "missing" ? "That user wasn't a bot admin." :
          `✅ Removed ${target.label} (${target.id}) from bot admins.`;
        await bot.sendMessage(chatId, text, { reply_markup: backToAdminKeyboard() });
      }
      return;
    }

    if (pending && pending.action === "admin_edit_announcement") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      const text = (msg.text || "").trim();
      if (text === "-") {
        clearAnnouncement();
        await bot.sendMessage(chatId, "✅ Announcement cleared.", { reply_markup: backToAdminKeyboard() });
      } else if (text) {
        setAnnouncement(text);
        await bot.sendMessage(chatId, "✅ Announcement updated. It now shows at the top of everyone's menu.", {
          reply_markup: backToAdminKeyboard(),
        });
      } else {
        await bot.sendMessage(chatId, "Send text for the announcement, or `-` to clear it.", { reply_markup: backToAdminKeyboard() });
      }
      return;
    }

    if (pending && pending.action === "admin_broadcast") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      setPending(sender.id, { action: "admin_broadcast_confirm", fromChatId: chatId, messageId: msg.message_id });
      await bot.sendMessage(chatId, "👆 That's the message that will be broadcast. Preview above.");
      await bot.sendMessage(chatId, "Send this to everyone who has started the bot?", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ ¢σηƒιям & ѕєη∂", callback_data: "admin_broadcast_confirm" ,style: 'success' },
              { text: "❌ ¢αη¢єℓ", callback_data: "admin_broadcast_cancel",style: 'danger'  },
            ],
          ],
        },
      });
      return;
    }

    if (pending && pending.action === "ai_chat") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      const targetChatId = pending.chatId;
      const targetLabel = pending.chatLabel || String(targetChatId);
      const endKeyboard = { inline_keyboard: [[{ text: "🛑 єη∂ ¢нαт", callback_data: `cs_ai_end_${targetChatId}`, style: 'danger' }]] };
      // A photo sent during an AI chat session registers a "delete on sight" image
      // (this list is shared across every chat the bot protects).
      if (msg.photo) {
        try {
          const photo = msg.photo[msg.photo.length - 1];
          const buf = await downloadFileToBuffer(photo.file_id);
          const hash = await computeImageHash(buf);
          addBannedImage(hash, msg.caption || undefined);
          await bot.sendMessage(
            chatId,
            `🚫 Got it — that image is now on the auto-delete list (${getBannedImages().length} total). ` +
              `I'll remove any future post that looks like it, in any group or channel I'm admin in.`,
            { reply_markup: endKeyboard }
          );
        } catch (err) {
          console.error("Failed to register banned image via AI chat", err.message);
          await bot.sendMessage(chatId, "Couldn't process that image, try again.");
        }
        return;
      }
      if (msg.text) {
        try {
          const { reply, changes } = await runAiConfigTurn(sender.id, msg.text, targetChatId, targetLabel);
          let out = reply;
          if (changes.length) out += "\n\n" + changes.join("\n") + `\n\n(applies to ${targetLabel} only)`;
          await bot.sendMessage(chatId, out, { reply_markup: endKeyboard });
        } catch (err) {
          console.error("AI assistant turn failed", err.message);
          await bot.sendMessage(chatId, `⚠️ The AI assistant hit an error: ${err.message}`);
        }
        return;
      }
      return;
    }

    if (pending && pending.action === "cs_addrule") {
      const targetChatId = pending.chatId;
      if (!canManageChat(sender.id, targetChatId)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      const text = (msg.text || "").trim();
      if (!text) {
        await bot.sendMessage(chatId, "Send the rule as plain text.", { reply_markup: chatRulesKeyboard(targetChatId) });
        return;
      }
      addRule(targetChatId, text);
      await bot.sendMessage(chatId, `✅ Rule added to ${chatTitleFor(targetChatId)}: "${text}"`, {
        reply_markup: chatRulesKeyboard(targetChatId),
      });
      return;
    }

    if (pending && pending.action === "cs_addword") {
      const targetChatId = pending.chatId;
      if (!canManageChat(sender.id, targetChatId)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      const text = (msg.text || "").trim();
      if (!text) {
        await bot.sendMessage(chatId, "Send the word/phrase as plain text.", { reply_markup: chatBlacklistKeyboard(targetChatId) });
        return;
      }
      addBlacklistWord(targetChatId, text);
      await bot.sendMessage(chatId, `✅ Blacklisted "${text}" in ${chatTitleFor(targetChatId)}.`, {
        reply_markup: chatBlacklistKeyboard(targetChatId),
      });
      return;
    }

    if (pending && pending.action === "admin_addbanimage") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      if (!msg.photo) {
        await bot.sendMessage(chatId, "Send a photo to ban.", { reply_markup: backToAdminKeyboard() });
        return;
      }
      try {
        const photo = msg.photo[msg.photo.length - 1];
        const buf = await downloadFileToBuffer(photo.file_id);
        const hash = await computeImageHash(buf);
        addBannedImage(hash, msg.caption || undefined);
        await bot.sendMessage(chatId, `🚫 Banned image added (${getBannedImages().length} total).`, {
          reply_markup: backToAdminKeyboard(),
        });
      } catch (err) {
        console.error("Failed to register banned image", err.message);
        await bot.sendMessage(chatId, "Couldn't process that image, try again.", { reply_markup: backToAdminKeyboard() });
      }
      return;
    }


    if (pending && pending.action === "add_chat") {
      if (!isBotAdmin(sender.id) && getPlan(sender.id) !== "premium") {
        clearPending(sender.id);
        await bot.sendMessage(chatId, "🔒 Adding a chat for protection requires Premium (or Bot Admin).", {
          reply_markup: { inline_keyboard: [[{ text: "⭐ νιєω ρяємιυм", callback_data: "menu_premium", style: 'primary' }]] },
        });
        return;
      }
      let target = null;
      if (msg.forward_from_chat) {
        target = msg.forward_from_chat;
      } else if (msg.text && msg.text.trim().startsWith("@")) {
        try {
          target = await bot.getChat(msg.text.trim());
        } catch (err) {
          await bot.sendMessage(chatId, `Couldn't find that chat: ${err.message}`);
          return;
        }
      } else {
        await bot.sendMessage(
          chatId,
          "Please forward a message from the chat, or send its @username (e.g. @mychannel)."
        );
        return;
      }

      try {
        const me = await bot.getMe();
        const member = await bot.getChatMember(target.id, me.id);
        if (member.status !== "administrator" && member.status !== "creator") {
          await bot.sendMessage(
            chatId,
            `I'm not an admin in "${target.title || target.username}" yet. Add me as admin there ` +
              `(with delete/restrict/promote rights) and try again.`
          );
          clearPending(sender.id);
          return;
        }
      } catch (err) {
        await bot.sendMessage(
          chatId,
          `Couldn't verify my admin status there: ${err.message}. Make sure I'm added as admin and try again.`
        );
        clearPending(sender.id);
        return;
      }

      addChat(sender.id, target);
      clearPending(sender.id);
      await captureChatPhotoBaseline(target.id, target.title);
      ensureChatStats(target.id, target.title || target.username, target.type);
      // Immediately show this chat's own ⚙️ Settings panel — toggles from here
      // (Photo Lock, Rules, etc.) only ever apply to this one chat.
      await sendChatSettingsPanel(chatId, target.id, true);
      return;
    }

    if (pending && pending.action === "promote_user") {
      let targetUserId = null;
      let targetLabel = "";

      if (msg.forward_from) {
        targetUserId = msg.forward_from.id;
        targetLabel = msg.forward_from.first_name || String(targetUserId);
      } else if (msg.text && msg.text.trim().startsWith("@")) {
        try {
          const chat = await bot.getChat(msg.text.trim());
          targetUserId = chat.id;
          targetLabel = chat.first_name || chat.username || String(targetUserId);
        } catch (err) {
          await bot.sendMessage(
            chatId,
            `Couldn't resolve that username (${err.message}). Try forwarding a message from them instead.`
          );
          return;
        }
      } else {
        await bot.sendMessage(chatId, "Forward a message from the person, or send their @username.");
        return;
      }

      try {
        await bot.promoteChatMember(pending.chatId, targetUserId, {
          can_delete_messages: true,
          can_restrict_members: true,
          can_invite_users: true,
          can_pin_messages: true,
          can_manage_chat: true,
        });
        await bot.sendMessage(chatId, `✅ Promoted ${targetLabel} in that chat.`, {
          reply_markup: mainMenuKeyboard(sender.id),
        });
      } catch (err) {
        await bot.sendMessage(
          chatId,
          `❌ Couldn't promote them: ${err.message}. Make sure I have "Add new admins" rights in that chat.`
        );
      }
      clearPending(sender.id);
      return;
    }
  }
  // ===== PRIVATE AI CHAT =====
    
// ==========================================
// PRIVATE STICKER AI
// ==========================================

// ===== PRIVATE AI CHAT =====
// ======================================
// PRIVATE AI CHAT
// ======================================

// ======================================================
// PRIVATE AI CHAT
// ======================================================

// ======================================================
// PRIVATE AI CHAT
// ======================================================

if (
    isPrivate &&
    !isCommand &&
    (
        msg.text ||
        msg.sticker ||
        msg.photo ||
        msg.voice
    )
) {


    const pending = getPending(sender.id);


    if (!pending) {


        await bot.sendChatAction(
            chatId,
            "typing"
        );



        if(!userHistory.has(sender.id)){

            userHistory.set(
                sender.id,
                []
            );

        }


        const memoryEnabled = ctx.ariaPreferences?.memoryEnabled?.(sender.id) !== false;

        const history =
            memoryEnabled ? userHistory.get(sender.id) : [];



        let inputText = "";

        let imageUrl = null;

        let isImage = false;

        let isVoice = false;



        // ============================
        // TEXT
        // ============================

        if(msg.text){

            inputText = msg.text;
            ctx.ariaAiCompanion?.rememberPrompt?.(sender.id, inputText);

        }



        // ============================
        // STICKER
        // ============================

        else if(msg.sticker){


            inputText = `

The user sent a Telegram sticker.

Emoji:
${msg.sticker.emoji || "🙂"}

React naturally.

Do not say you cannot see stickers.

`;

        }




        // ============================
        // IMAGE
        // ============================

        else if(msg.photo){


            isImage = true;


            try{


                const photo =
                    msg.photo[
                        msg.photo.length - 1
                    ];


                const file =
                    await bot.getFile(
                        photo.file_id
                    );



                imageUrl =
                `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;



                inputText =
                    msg.caption ||
                    "Analyze this image.";


            }
            catch(err){


                console.log(
                    "IMAGE ERROR:",
                    err.message
                );


                inputText =
                    "Analyze this image.";

            }


        }





        // ============================
        // VOICE NOTE
        // ============================

        else if(msg.voice){


            isVoice = true;


            try{


                const file =
                    await bot.getFile(
                        msg.voice.file_id
                    );



                const voiceUrl =
                `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;



                console.log(
                    "VOICE:",
                    voiceUrl
                );



                const transcript =
                    await speechToText(
                        voiceUrl
                    );



                console.log(
                    "TRANSCRIPT:",
                    transcript
                );



                if(transcript){


                    inputText =
                        transcript;


                }
                else{


                    inputText =
                    "The user sent a voice message.";

                }


            }
            catch(err){


                console.log(
                    "VOICE ERROR:",
                    err.message
                );


                inputText =
                "The user sent a voice message.";

            }


        }





        // ============================
        // AI RESPONSE
        // ============================

        if (!canUseAi(sender.id)) {
            await sendSignupGate(chatId, msg.message_id);
            return;
        }

        const result =
        await processWithFailover(

            sender.id,

            inputText,

            (
                isImage ||
                isVoice
            )
            ?
            []
            :
            history,


            {

                msg,


                imageUrl,


                category: (() => {
                    let selectedMode = ctx.ariaAiCompanion?.getMode?.(sender.id) || "chat";
                    if (selectedMode === "auto") {
                        const t = String(inputText || "").toLowerCase();
                        if (/\b(code|coding|debug|javascript|typescript|python|node\.js|sql|bug|function|api)\b/.test(t)) selectedMode = "coding";
                        else if (/\b(research|sources|cite|citation|latest|compare|investigate|evidence)\b/.test(t)) selectedMode = "research";
                        else if (/\b(write|story|poem|lyrics|creative|script|caption|novel|imagine)\b/.test(t)) selectedMode = "creative";
                        else if (/\b(explain|teach|learn|lesson|quiz|homework|study|tutorial)\b/.test(t)) selectedMode = "tutor";
                        else selectedMode = "chat";
                    }
                    return selectedMode === "chat" ? null : selectedMode;
                })(),


                systemPrompt:
                isImage
                ?
`
You are an image analysis AI.

Only analyze the image.

Do not chat.
Do not roleplay.
Describe visible details only.
`
                :
                null,


                forceFreeOnly:false,


                preferredModel:
                isImage
                ?
                "charart"
                :
                null


            }

        );





        if(!result.success){


            await bot.sendMessage(

                chatId,

                "✨ ᴍɪꜱꜱ ᴀʀɪᴀ ɪꜱ ᴘᴏʟɪꜱʜɪɴɢ ʏᴏᴜʀ ʀᴇꜱᴘᴏɴꜱᴇ ᴛᴏ ᴍᴀᴋᴇ ɪᴛ ᴘᴇʀꜰᴇᴄᴛ. 🌸 ᴘʟᴇᴀꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ᴀ ᴍᴏᴍᴇɴᴛ. 💗"

            );


            return;

        }






        // ============================
        // VOICE REPLY
        // ============================


        if(isVoice){


            try{


                const audio =
                    await textToVoice(
                        result.response
                    );



                if(audio){


                    await bot.sendVoice(

                        chatId,

                        audio,

                        {

                            reply_to_message_id:
                            msg.message_id

                        }

                    );


                    return;

                }



            }
            catch(err){


                console.log(
                    "TTS ERROR:",
                    err.message
                );


            }


        }







        // ============================
        // NORMAL TEXT REPLY
        // ============================


        const parts =
            formatAiReplyForTelegram(
                result.response
            );

        const sentResponseIds = [];
        const rawResponse = String(result.response || "");
        const copyText = rawResponse.slice(0, 256) || "ᴍɪss ᴀʀɪᴀ";

        for(let partIndex = 0; partIndex < parts.length; partIndex++){

            const part = parts[partIndex];
            const isLastPart = partIndex === parts.length - 1;

            const sent = await bot.sendMessage(

                chatId,

                part,

                {

                    parse_mode: "HTML",

                    reply_to_message_id:
                    msg.message_id,

                    ...(isLastPart ? {
                        reply_markup: { inline_keyboard: [
                            [
                                { text: "📋 ᴄᴏᴘʏ", copy_text: { text: copyText }, style: "success" },
                                { text: "🔄 ʀᴇɢᴇɴᴇʀᴀᴛᴇ", callback_data: "aria_regenerate", style: "primary" }
                            ]
                        ] }
                    } : {})

                }

            );

            if (sent?.message_id) sentResponseIds.push(sent.message_id);
        }

        if (ctx.ariaAiCompanion?.rememberResponseMessages) {
            ctx.ariaAiCompanion.rememberResponseMessages(sender.id, sentResponseIds);
        }






        // ============================
        // SAVE MEMORY
        // ============================


        if(
            !isImage &&
            !isVoice
        ){


            history.push(


                {
                    role:"user",
                    content:inputText
                },


                {
                    role:"assistant",
                    content:result.response
                }


            );



            if(history.length > 40){


                history.splice(
                    0,
                    history.length - 40
                );

            }



            if (memoryEnabled) {
                userHistory.set(
                    sender.id,
                    history
                );
            }


        }



        return;


    }

}
  // --- Group messages: force-join gate, then image moderation ---
  if (!isGroup) return;

  const senderDisplayName =
    [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.username || String(sender.id);
    
if (FORCE_JOIN_CHANNELS.length > 0 && !isCommand) {

    let exempt = false;

    if (FORCE_JOIN_EXEMPT_ADMINS) {
        const admins = await bot.getChatAdministrators(chatId);
        exempt = admins.some(a => a.user.id === sender.id);
    }

    if (!exempt) {

        const missing = await getMissingChannels(sender.id);

        if (missing.length > 0) {

            // Delete the user's message
            try {
                await bot.deleteMessage(chatId, msg.message_id);
            } catch (err) {
                console.error("Could not delete message:", err.message);
            }

            // Don't send another prompt if one already exists
            if (pendingForceJoin.has(sender.id)) {
                return;
            }

            try {

                const sent = await bot.sendMessage(
                    chatId,
                    `🌸 <b>мιѕѕ αяια</b>

🔒 <b>αℓмσѕт тнєяє!</b>

You need to join the required channel and group before I'll let you chat.

Tap the buttons below, then press <b>✅ νєяιƒу</b>.`,
                    {
                        parse_mode: "HTML",
                        reply_markup: forceJoinKeyboard(missing)
                    }
                );

                pendingForceJoin.set(sender.id, sent.message_id);

            } catch (err) {
                console.error("Could not send force-join prompt:", err.message);
            }

            return;
        }

        // User has joined everything
        if (pendingForceJoin.has(sender.id)) {

            try {
                await bot.deleteMessage(
                    chatId,
                    pendingForceJoin.get(sender.id)
                );
            } catch {}

            pendingForceJoin.delete(sender.id);
        }
    }
}

  // --- Flood Lock: mutes anyone who fires off a burst of messages ---
  if (!isCommand && isFloodLockEnabled(chatId)) {
    const admins = await bot.getChatAdministrators(chatId).catch(() => []);
    const isSenderAdmin = admins.some((a) => a.user.id === sender.id);
    if (!isSenderAdmin && isFlooding(chatId, sender.id)) {
      clearFloodHistory(chatId, sender.id);
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete flood message", err.message);
      }
      const muted = await muteUser(chatId, sender.id, FLOOD_MUTE_MS);
      incrementChatFlags(chatId, msg.chat.title);
      const ownerId = await getOwnerId(chatId).catch(() => null);
      if (ownerId) {
        const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ");
        bot
          .sendMessage(
            ownerId,
            `🌊 *Flood detected*\n*Chat:* ${msg.chat.title || chatId}\n*User:* ${senderName} (${sender.id})\n${
              muted ? "Muted for 5 minutes." : "Could not mute them (likely an admin/higher rank)."
            }`,
            { parse_mode: "Markdown" }
          )
          .catch(() => {});
      }
      return;
    }
  }

  // --- Forward Lock: blocks forwarded posts from other channels/bots (common ad-spam vector) ---
  if (!isCommand && isForwardLockEnabled(chatId) && msg.forward_from_chat) {
    const admins = await bot.getChatAdministrators(chatId).catch(() => []);
    const isSenderAdmin = admins.some((a) => a.user.id === sender.id);
    if (!isSenderAdmin) {
      log("Flagged forwarded post from", sender.first_name, sender.id, "in chat", chatId);
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete forwarded message", err.message);
      }
      incrementChatFlags(chatId, msg.chat.title);
      if (isWarnSystemEnabled(chatId)) await warnUser(chatId, sender.id, senderDisplayName, "forwarded post");
      return;
    }
  }

  // --- Custom admin-defined text rules (only runs if any rules are set) ---
  if (msg.text && !isCommand && getRules(chatId).length > 0) {
    try {
      const flaggedText = await classifyText(msg.text, chatId);
      if (flaggedText) {
        log("Flagged text (custom rule) from", sender.first_name, sender.id, "in chat", chatId);
        try {
          await bot.deleteMessage(chatId, msg.message_id);
        } catch (err) {
          console.error("Failed to delete rule-violating message", err.message);
        }
        incrementChatFlags(chatId, msg.chat.title);
        if (isWarnSystemEnabled(chatId)) await warnUser(chatId, sender.id, senderDisplayName, "custom rule violation");
        return;
      }
    } catch (err) {
      console.error("Text rule check failed", err.message);
    }
  }

  // --- Link Lock: strips every link from non-admins (stricter than the malicious-link check below) ---
  if (msg.text && !isCommand && isLinkLockEnabled(chatId) && extractUrls(msg.text).length > 0) {
    const admins = await bot.getChatAdministrators(chatId).catch(() => []);
    const isSenderAdmin = admins.some((a) => a.user.id === sender.id);
    if (!isSenderAdmin) {
      log("Flagged link (Link Lock) from", sender.first_name, sender.id, "in chat", chatId);
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete message with link", err.message);
      }
      incrementChatFlags(chatId, msg.chat.title);
      if (isWarnSystemEnabled(chatId)) await warnUser(chatId, sender.id, senderDisplayName, "link not allowed");
      return;
    }
  }

  // --- Malicious links (phishing/malware) via Google Safe Browsing ---
  if (msg.text && !isCommand) {
    try {
      const flaggedLink = await classifyLinks(msg.text);
      if (flaggedLink) {
        log("Flagged malicious link from", sender.first_name, sender.id, "in chat", chatId);
        try {
          await bot.deleteMessage(chatId, msg.message_id);
        } catch (err) {
          console.error("Failed to delete message with malicious link", err.message);
        }
        incrementChatFlags(chatId, msg.chat.title);
        const ownerId = await getOwnerId(chatId).catch(() => null);
        if (ownerId) {
          bot
            .sendMessage(ownerId, `🔗 *Malicious link removed*\n*Chat:* ${msg.chat.title || chatId}`, {
              parse_mode: "Markdown",
            })
            .catch(() => {});
        }
        return;
      }
    } catch (err) {
      console.error("Link check failed", err.message);
    }
  }

  if (!msg.photo) return;

try {
  const photo = msg.photo[msg.photo.length - 1]; // Highest resolution
  const buf = await downloadFileToBuffer(photo.file_id);

  // ------------------------------------------------
  // Fast local banned-image hash check
  // ------------------------------------------------
  try {
    const hash = await computeImageHash(buf);
    const match = matchBannedImage(hash);

    if (match) {
      log(
        "Banned reference image matched (",
        match.label,
        ") from",
        sender.first_name,
        sender.id,
        "in chat",
        chatId
      );

      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete banned-image match", err.message);
      }

      incrementChatFlags(chatId, msg.chat.title);

      const ownerId = await getOwnerId(chatId).catch(() => null);

      if (ownerId) {
        bot.sendMessage(
          ownerId,
          `🚫 *Banned image removed*\n\n*Chat:* ${
            msg.chat.title || chatId
          }\nMatched: ${match.label}`,
          {
            parse_mode: "Markdown",
          }
        ).catch(() => {});
      }

      return;
    }
  } catch (err) {
    console.error("Image hash check failed", err.message);
  }

  // ------------------------------------------------
  // AI image moderation
  // ------------------------------------------------
  const base64Data = buf.toString("base64");

  // sender + title are now passed so enforcement
  // (demote, owner DM, etc.) can happen internally.
  const flagged = await classifyImage(
    buf,
    base64Data,
    "image/jpeg",
    chatId,
    sender,
    msg.chat.title
  );

  if (!flagged) return;

  log(
    "Flagged image from",
    sender.first_name,
    sender.id,
    "in chat",
    chatId
  );

  // Delete offending message
  try {
    await bot.deleteMessage(chatId, msg.message_id);
  } catch (err) {
    console.error("Failed to delete flagged message", err.message);
  }

  // Track moderation statistics
  incrementChatFlags(chatId, msg.chat.title);

  // Everything else (demote admin, lock chat,
  // warn owner, severe enforcement, etc.)
  // already happened inside:
  //
  // classifyImage()
  //   ├── classifyImageSightengine()
  //   └── classifyImageCustomRules()
  //
  // so don't repeat it here.
} catch (err) {
  console.error("Error handling photo message", err);
}
});
}

module.exports = register;
