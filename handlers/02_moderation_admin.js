/**
 * Handler pack 2.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  const { bot, generateInfoCard, ACTOR_ID, APIFY_TOKEN, BOT_VERSION, OWNER_USERNAME, WARN_LIMIT, axios, clearOneWarn, escapeHtml, forceJoinKeyboard, fs, getMissingChannels, getWarnCount, https, isBotAdmin, log, logModAction, markStarted, os, parseDuration, path, play, requireGroupAdmin, resolveGroupTarget, sendMainMenu, sendTalkingIntro, sleep, state, statsTracker, tempAdminTimers, tryDemote, users, warnUser } = ctx;

bot.onText(/^\/stats$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isBotAdmin(userId)) {
    return bot.sendMessage(chatId, "🚫 Admins only.");
  }

  const s = statsTracker.getSummary();
  const uptimeDays = ((Date.now() - s.since) / 86400000).toFixed(1);

  const topCommandsText = s.topCommands.length
    ? s.topCommands.map(([name, count]) => `${name} — ${count}`).join(", ")
    : "none yet";

  const topFeaturesText = s.topFeatures.length
    ? s.topFeatures.map(([name, count]) => `${name} — ${count}`).join(", ")
    : "none yet";

  try {
    const card = await generateInfoCard({
      title: "Miss Aria — Analytics",
      subtitle: `Tracking since ${uptimeDays}d ago`,
      rows: [
        { icon: "👥", label: "Unique users", value: String(s.totalUniqueUsers) },
        { icon: "🟢", label: "Active today", value: String(s.activeToday) },
        { icon: "📅", label: "Active 7d", value: String(s.active7d) },
        { icon: "💬", label: "Messages seen", value: String(s.totalMessages) },
        { icon: "🏆", label: "Top commands", value: topCommandsText },
        { icon: "✨", label: "Top features", value: topFeaturesText },
      ],
      footer: "Miss Aria • Bot Analytics",
    });
    await bot.sendPhoto(chatId, card, {
      caption: "<b>📊 Bot Analytics</b>",
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("stats card render failed, falling back to text:", err.message);
    await bot.sendMessage(chatId, `
📊 <b>вσт αηαℓутι¢ѕ</b>

━━━━━━━━━━━━━━━━━━

👥 Unique users (all-time): <b>${s.totalUniqueUsers}</b>
🟢 Active today: <b>${s.activeToday}</b>
📅 Active last 7 days: <b>${s.active7d}</b>
💬 Total messages seen: <b>${s.totalMessages}</b>
⏱ Tracking since: <b>${uptimeDays}d ago</b>

━━━━━━━━━━━━━━━━━━

🏆 <b>тσρ ¢σммαη∂ѕ</b>
${escapeHtml(topCommandsText)}

✨ <b>тσρ ƒєαтυяєѕ</b>
${escapeHtml(topFeaturesText)}
`, { parse_mode: "HTML" });
  }
});

bot.onText(/^\/botinfo(?:@\w+)?$/, async (msg) => {
  const chatId = msg.chat.id;
  const activeAgentIds = whatsappServiceInfo.getActiveAgentIds();
  const agentCount = whatsappServiceInfo.listAgents().length;

  try {
    const card = await generateInfoCard({
      title: "Miss Aria — Bot Info",
      subtitle: `Version ${BOT_VERSION} • Premium Edition`,
      rows: [
        { icon: "👑", label: "Owner", value: "Dave Tech" },
        { icon: "💌", label: "Telegram", value: `t.me/${OWNER_USERNAME}` },
        { icon: "⚡", label: "Version", value: BOT_VERSION },
        { icon: "🌸", label: "Prefix", value: "[ / ]" },
        { icon: "🤖", label: "Engine", value: "Advanced AI" },
        { icon: "💎", label: "Edition", value: "Premium" },
        { icon: "📲", label: "WA Agents", value: `${activeAgentIds.length} active / ${agentCount} paired` },
      ],
      footer: "Miss Aria • Bot Information",
    });

    await bot.sendPhoto(chatId, card, {
      caption: "<b>〣 ✦ 〈 Bot Information 〉 ✦ 〣</b>",
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("botinfo card render failed, falling back to text:", err.message);
    const text =
`➜ 🌷 ᴏᴡɴᴇʀ      : <b>∂ανє тє¢н</b>

➜ 💌 ᴛᴇʟᴇɢʀᴀᴍ   : <code>t.me/${OWNER_USERNAME}</code>

➜ ⚡ ᴠᴇʀꜱɪᴏɴ    : <b>${BOT_VERSION}</b>

➜ 🌸 ᴘʀᴇꜰɪx     : <b>[ / ]</b>

➜ 🤖 ᴇɴɢɪɴᴇ     : <b>α∂ναη¢є∂ αι</b>

➜ 💎 ᴇᴅɪᴛɪᴏɴ    : <b>ρяємιυм</b>

➜ 📲 ᴡᴀ ᴀɢᴇɴᴛꜱ  : <b>${activeAgentIds.length} active / ${agentCount} paired</b>
<blockquote expandable='true'><b> 〣 ✦ 〈 вσт ιηƒσямαтιση 〉 ✦ 〣</b></blockquote>`;
    await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
  }
});

bot.onText(/^\/kick(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /kick, or use /kick <user_id>.");
  }
  try {
    await bot.banChatMember(msg.chat.id, target.id);
    await bot.unbanChatMember(msg.chat.id, target.id); // ban+unban = kick, not permanent
    await bot.sendMessage(msg.chat.id, `👢 Kicked ${target.label}.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't kick ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/ban(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /ban, or use /ban <user_id>.");
  }
  try {
    await bot.banChatMember(msg.chat.id, target.id);
    await bot.sendMessage(msg.chat.id, `🔨 Banned ${target.label}.`);
    logModAction(msg.chat.id, {
      action: "ban",
      moderator: msg.from.username ? `@${msg.from.username}` : String(msg.from.id),
      target: target.label,
      reason: (match[1] || "").trim(),
    });
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't ban ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/unban(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Use /unban <user_id> (or reply to a forwarded message from them).");
  }
  try {
    await bot.unbanChatMember(msg.chat.id, target.id, { only_if_banned: true });
    await bot.sendMessage(msg.chat.id, `✅ Unbanned ${target.label}.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't unban ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/mute(?:@\w+)?(?:\s+(\S+))?(?:\s+(\S+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;

  // Support both "/mute 1h" (reply) and "/mute <id> 1h"
  let durationArg = match[1];
  let idArg = null;
  if (match[1] && /^\d+$/.test(match[1]) && !msg.reply_to_message) {
    idArg = match[1];
    durationArg = match[2];
  }

  const target = await resolveGroupTarget(msg, idArg);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /mute [1h/30m], or use /mute <user_id> [1h/30m].");
  }

  const ms = parseDuration(durationArg) || 60 * 60 * 1000; // default 1h
  try {
    await bot.restrictChatMember(msg.chat.id, target.id, {
      permissions: { can_send_messages: false, can_send_media_messages: false },
      until_date: Math.floor((Date.now() + ms) / 1000)
    });
    await bot.sendMessage(msg.chat.id, `🔇 Muted ${target.label} for ${durationArg || "1h"}.`);
    logModAction(msg.chat.id, {
      action: "mute",
      moderator: msg.from.username ? `@${msg.from.username}` : String(msg.from.id),
      target: target.label,
      reason: durationArg || "1h",
    });
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't mute ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/unmute(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /unmute, or use /unmute <user_id>.");
  }
  try {
    await bot.restrictChatMember(msg.chat.id, target.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      }
    });
    await bot.sendMessage(msg.chat.id, `🔊 Unmuted ${target.label}.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't unmute ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/pinterest(?:\s+(.+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const query = match[1]?.trim();

    if (!query) {
        return bot.sendMessage(
            chatId,
            `📌 <b>ριηтєяєѕт ѕєαя¢н</b>

<blockquote expandable='true'>🔎 sᴇᴀʀᴄʜ ᴍɪʟʟɪᴏɴs ᴏғ ᴘɪɴᴛᴇʀᴇsᴛ ɪᴍᴀɢᴇs.</blockquote>

<b>✦ υѕαgє</b>
<code>/pinterest anime girl</code>

🌸 <b>мιѕѕ αяια</b>`,
            {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );
    }

    const frames = [
        "🔎 <b>ѕєαя¢нιηg ριηтєяєѕт...</b>",
        "📡 <b>ғιη∂ιηg ιмαgєѕ...</b>",
        "🖼️ <b>ρяєραяιηg αℓвυм...</b>",
        "✨ <b>αℓмσѕт ∂σηє...</b>"
    ];

    const loading = await bot.sendMessage(chatId, frames[0], {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
    });

    let frame = 1;

    const animation = setInterval(() => {
        if (frame >= frames.length) return;

        bot.editMessageText(frames[frame], {
            chat_id: chatId,
            message_id: loading.message_id,
            parse_mode: "HTML"
        }).catch(() => {});

        frame++;
    }, 700);

    try {

        const { data } = await axios.get(
            `https://prexzyapis.com/search/pinterest?q=${encodeURIComponent(query)}`,
            {
                timeout: 30000,
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        clearInterval(animation);

        if (!data.status || !Array.isArray(data.data) || !data.data.length) {
            return bot.editMessageText(
                "❌ <b>ησ ιмαgєѕ ғσυη∂.</b>",
                {
                    chat_id: chatId,
                    message_id: loading.message_id,
                    parse_mode: "HTML"
                }
            );
        }

        const urls = [...new Set(data.data)];

        await bot.editMessageText(
            `✅ <b>${urls.length} ɪᴍᴀɢᴇs ғᴏᴜɴᴅ!</b>

<blockquote expandable='true'>📌 ${query}</blockquote>

🚀 <b>∂σωηℓσα∂ιηg...</b>`,
            {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "HTML"
            }
        );

        let media = [];
        let tempFiles = [];

        for (let i = 0; i < urls.length; i++) {

            try {

                const ext = path.extname(urls[i]).split("?")[0] || ".jpg";

                // Skip GIFs because Telegram albums only support photos/videos
                if (ext.toLowerCase() === ".gif") continue;

                const filePath = path.join(
                    os.tmpdir(),
                    `pin_${Date.now()}_${i}${ext}`
                );

                const image = await axios.get(urls[i], {
                    responseType: "arraybuffer",
                    timeout: 30000,
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        Referer: "https://www.pinterest.com/"
                    }
                });

                fs.writeFileSync(filePath, image.data);

                tempFiles.push(filePath);

                media.push({
                    type: "photo",
                    media: filePath,
                    caption:
                        media.length === 0
                            ? `📌 <b>ᴘɪɴᴛᴇʀᴇsᴛ • ${query}</b>

✨ ${urls.length} ɪᴍᴀɢᴇs
🌸 <b>мιѕѕ αяια</b>`
                            : undefined,
                    parse_mode: "HTML"
                });

                if (media.length === 10 || i === urls.length - 1) {

                    await bot.sendMediaGroup(chatId, media, {
                        reply_to_message_id: msg.message_id
                    });

                    for (const file of tempFiles) {
                        try {
                            fs.unlinkSync(file);
                        } catch {}
                    }

                    media = [];
                    tempFiles = [];
                }

            } catch (err) {
                console.log("Skipped:", urls[i]);
            }

        }

        await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

    } catch (err) {

        clearInterval(animation);

        console.error("PINTEREST ERROR:", err.response?.data || err.message);

        bot.editMessageText(
            `❌ <b>ѕєαя¢н ғαιℓє∂.</b>

<blockquote expandable='true'>ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.</blockquote>`,
            {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "HTML"
            }
        ).catch(() => {});
    }

});

bot.onText(/^\/getsong(?:\s+(.+))?$/, async (msg, match) => {


    const chatId = msg.chat.id;
    const input = match[1];


    const replyOptions = {

        reply_to_message_id: msg.message_id,
        parse_mode:"HTML"

    };



    if(!input){

        return bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

❌ <b>υѕαgє</b>

<code>/getsong YouTube URL</code>

Example:

<code>/getsong https://youtube.com/watch?v=xxxx</code>

</blockquote>`,

            replyOptions

        );

    }



    try {



        // ==========================
        // CLEAN URL
        // ==========================


        const youtubeUrl = input
            .trim()
            .replace(/[<>]/g,"")
            .replace(/\s+/g,"");



        console.log(
            "YOUTUBE URL:",
            youtubeUrl
        );



        if(
            !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(youtubeUrl)
        ){

            throw new Error(
                "Invalid YouTube URL"
            );

        }







        // ==========================
        // GET SONG INFO
        // ==========================


        const loading = await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

🔎 <b>gєттιηg ѕσηg ιηƒσямαтιση...</b>

</blockquote>`,

            replyOptions

        );





        const info = await axios.get(

`https://prexzyapis.com/download/ytinfo?url=${encodeURIComponent(youtubeUrl)}`,

        {

            timeout:60000

        }

        );



        const data = info.data;



        console.log(
            "PREXZY INFO:",
            JSON.stringify(data,null,2)
        );




        const title =

            data.info?.title ||
            data.title ||
            "Unknown";



        const channel =

            data.info?.channel ||
            data.info?.uploader ||
            "Unknown";



        const duration =

            data.info?.duration_string ||
            "Unknown";



        const views =

            data.info?.view_count ||
            "Unknown";





        await bot.deleteMessage(

            chatId,

            loading.message_id

        ).catch(()=>{});







        await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

🎵 <b>${escapeHtml(title)}</b>

👤 ${escapeHtml(channel)}

⏱ ${duration}

👁 ${views} Views

⬇️ Downloading MP3...

</blockquote>`,

            replyOptions

        );








        // ==========================
        // PREXZY MP3 RETRY
        // ==========================


        async function getMP3(url){


            let tries = 3;



            while(tries > 0){


                try{


                    const res = await axios.get(

`https://prexzyapis.com/download/ytmp3?url=${encodeURIComponent(url)}`,

                    {

                        timeout:120000

                    }

                    );


                    return res.data;



                }catch(err){



                    console.log(

                        "MP3 ERROR:",

                        err.response?.status ||
                        err.message

                    );



                    if(
                        err.response?.status === 502
                    ){

                        tries--;


                        if(tries > 0){

                            console.log(
                                "Retrying Prexzy..."
                            );


                            await sleep(60000);

                            continue;

                        }

                    }


                    throw err;


                }


            }


        }








        // ==========================
        // DOWNLOAD MP3
        // ==========================


        const mp3Data =
        await getMP3(youtubeUrl);




        console.log(

            "PREXZY MP3 RESPONSE:",

            JSON.stringify(
                mp3Data,
                null,
                2
            )

        );








        // ==========================
        // FIND URL ANYWHERE
        // ==========================


        function findUrl(obj){


            if(!obj)
                return null;



            if(typeof obj === "string"){


                if(
                    obj.startsWith("http")
                ){

                    return obj;

                }


                return null;

            }



            if(typeof obj === "object"){


                for(
                    const key of Object.keys(obj)
                ){


                    const found =
                    findUrl(obj[key]);



                    if(found)
                        return found;


                }


            }


            return null;


        }






        const audioUrl =
        findUrl(mp3Data);





        console.log(

            "AUDIO URL:",
            audioUrl

        );





        if(!audioUrl){


            throw new Error(
                "No MP3 URL returned from Prexzy"
            );

        }








        // ==========================
        // SEND AUDIO
        // ==========================


        await bot.sendAudio(

            chatId,

            audioUrl,

            {

caption:

`<blockquote expandable='true'>

🎵 <b>${escapeHtml(title)}</b>

👤 ${escapeHtml(channel)}

✅ Download Complete

⚡ Powered by Prexzy

</blockquote>`,

            parse_mode:"HTML",

            title:title,

            performer:channel

            }

        );





    }catch(err){



        console.log(

            "GETSONG ERROR:",

            err.response?.data ||
            err.message

        );



        await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

❌ <b>∂σωηℓσα∂ ƒαιℓє∂</b>

${escapeHtml(

err.response?.data?.detail ||
err.message

)}

</blockquote>`,

            replyOptions

        );


    }


});

bot.onText(/^\/warn(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /warn, or use /warn <user_id>.");
  }
  await warnUser(msg.chat.id, target.id, target.label, "manual warn by an admin");
});

bot.onText(/^\/unwarn(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /unwarn, or use /unwarn <user_id>.");
  }
  const count = clearOneWarn(msg.chat.id, target.id);
  await bot.sendMessage(msg.chat.id, `Removed one warn from ${target.label} (${count}/${WARN_LIMIT}).`);
});

bot.onText(/^\/warns(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  const target = await resolveGroupTarget(msg, match[1]);
  const who = target || { id: msg.from.id, label: msg.from.first_name };
  const count = getWarnCount(msg.chat.id, who.id);
  await bot.sendMessage(msg.chat.id, `${who.label} has ${count}/${WARN_LIMIT} warns.`);
});


bot.onText(/^\/song2(?:\s+(.+))?$/, async (msg, match) => {

    const chatId = msg.chat.id;
    const query = match[1];

    const reply = {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML"
    };

    if (!query) {
        return bot.sendMessage(
            chatId,
            `<blockquote expandable='true'>🎵 Send a song name

<code>/song2 Ghost by Justin Bieber</code></blockquote>`,
            reply
        );
    }

    let wait;

    try {

        wait = await bot.sendMessage(
            chatId,
            "<blockquote expandable='true'>🔎 Searching YouTube...</blockquote>",
            reply
        );

        // ==========================
        // SEARCH
        // ==========================

        const { data: search } = await axios.get(
            `https://prexzyapis.com/search/youtube?q=${encodeURIComponent(query)}`
        );

        if (!search.status || !search.data || search.data.length === 0) {
            throw new Error("No search results");
        }

        const video = search.data[0];
        const videoUrl = video.link;

        // ==========================
        // GET INFO
        // ==========================

        const { data: song } = await axios.get(
            `https://prexzyapis.com/download/ytinfo?url=${encodeURIComponent(videoUrl)}`
        );

        // ==========================
        // GET MP3
        // ==========================

        const { data: audio } = await axios.get(
            `https://prexzyapis.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
        );

        const audioUrl =
            audio.download_url ||
            audio.result?.download_url ||
            audio.url ||
            audio.result?.url;

        if (!audioUrl) {
            throw new Error("No audio URL returned");
        }

        await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

        // ==========================
        // SEND THUMBNAIL
        // ==========================

        await bot.sendPhoto(
            chatId,
            song.info?.thumbnail || video.imageUrl,
            {
                reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                caption:
`<blockquote expandable='true'>
🎵 <b>${song.info?.title || video.title}</b>

👤 ${song.info?.channel || video.channel}
⏱ ${song.info?.duration_string || video.duration}
👁 ${(song.info?.view_count || 0).toLocaleString()} Views
</blockquote>`
            }
        );
        
// ==========================
// DOWNLOAD AUDIO
// ==========================

const { data } = await axios.get(audioUrl, {
    responseType: "arraybuffer",
    timeout: 120000,
    maxRedirects: 10,
    headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.youtube.com/"
    }
});

const buffer = Buffer.from(data);

await bot.sendAudio(
    chatId,
    buffer,
    {
        title: song.info?.title || video.title,
        performer: song.info?.channel || video.channel,
        reply_to_message_id: msg.message_id
    },
    {
        filename: "song.m4a",
        contentType: "audio/mp4"
    }
);
} catch (err) {

    console.error("SONG2 ERROR");
    console.error("Message:", err.message);
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);

    if (wait) {
        await bot.deleteMessage(chatId, wait.message_id).catch(() => {});
    }

   await bot.sendMessage(
        chatId,
        "<blockquote expandable='true'>❌ Failed to download audio.</blockquote>",
        reply
    );
}

});

bot.onText(/^\/promote(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /promote, or use /promote <user_id>.");
  }
  try {
    await bot.promoteChatMember(msg.chat.id, target.id, {
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
      can_manage_video_chats: true
    });
    await bot.sendMessage(msg.chat.id, `⬆️ Promoted ${target.label} to admin.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't promote ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/demote(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /demote, or use /demote <user_id>.");
  }
  const ok = await tryDemote(msg.chat.id, target.id);
  await bot.sendMessage(
    msg.chat.id,
    ok ? `⬇️ Demoted ${target.label}.` : `Couldn't demote ${target.label} (they may outrank the bot).`
  );
});

bot.onText(/^\/tempadmin(?:@\w+)?\s+(\S+)\s+(\S+)$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  const ms = parseDuration(match[2]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user with /tempadmin <duration>, or use /tempadmin <user_id> <duration> (e.g. 5m).");
  }
  if (!ms) {
    return bot.sendMessage(msg.chat.id, "Couldn't parse the duration — use something like 5m, 1h, or 2d.");
  }

  try {
    await bot.promoteChatMember(msg.chat.id, target.id, {
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true
    });
    await bot.sendMessage(msg.chat.id, `⏳ ${target.label} is a temp admin for ${match[2]}.`);

    const key = `${msg.chat.id}:${target.id}`;
    if (tempAdminTimers.has(key)) clearTimeout(tempAdminTimers.get(key));
    const timer = setTimeout(async () => {
      tempAdminTimers.delete(key);
      const ok = await tryDemote(msg.chat.id, target.id);
      if (ok) {
        bot.sendMessage(msg.chat.id, `⌛ Temp-admin period ended for ${target.label} — demoted.`).catch(() => {});
      }
    }, ms);
    tempAdminTimers.set(key, timer);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't temp-promote ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/adminlist(?:@\w+)?$/, async (msg) => {
  if (msg.chat.type === "private") {
    return bot.sendMessage(msg.chat.id, "This command only works in a group.");
  }
  try {
    const admins = await bot.getChatAdministrators(msg.chat.id);
    const rows = admins.map((a) => {
      const name = a.user.username ? `@${a.user.username}` : (a.user.first_name || String(a.user.id));
      return {
        icon: a.status === "creator" ? "👑" : "👮",
        label: a.status === "creator" ? "Owner" : "Admin",
        value: name,
      };
    });

    const card = await generateInfoCard({
      title: "Group Admins",
      subtitle: msg.chat.title || "This group",
      rows,
      footer: "Miss Aria • Admin List",
    });
    await bot.sendPhoto(msg.chat.id, card, {
      caption: "<b>👮 Admins in this group</b>",
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("adminlist card render failed, falling back to text:", err.message);
    try {
      const admins = await bot.getChatAdministrators(msg.chat.id);
      const lines = admins.map((a) => {
        const name = a.user.username ? `@${a.user.username}` : (a.user.first_name || String(a.user.id));
        return a.status === "creator" ? `👑 ${name} (owner)` : `👮 ${name}`;
      });
      await bot.sendMessage(msg.chat.id, `*Admins in this group:*\n${lines.join("\n")}`, { parse_mode: "Markdown" });
    } catch (err2) {
      await bot.sendMessage(msg.chat.id, `Couldn't fetch admin list: ${err2.message}`);
    }
  }
});

bot.onText(/\/start(?:@\w+)?(?:\s|$)/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  markStarted(userId);

  if (msg.chat.type !== "private") return;

  const missing = await getMissingChannels(userId);

  if (missing.length > 0) {
    return bot.sendMessage(
      chatId,
      `<blockquote expandable='true'>
🌸 <b>ᴍɪss ᴀʀɪᴀ</b>
<i>ʏᴏᴜʀ ᴘᴇʀsᴏɴᴀʟ ᴀɪ ᴄᴏᴘɪʟᴏᴛ</i>

━━━━━━━━━━━━━━━━━━

🔐 <b>ǫᴜɪᴄᴋ ᴠᴇʀɪғɪᴄᴀᴛɪᴏɴ</b>

ᴊᴏɪɴ ᴛʜᴇ ʀᴇǫᴜɪʀᴇᴅ ᴄʜᴀɴɴᴇʟs ʙᴇʟᴏᴡ ᴛᴏ ᴏᴘᴇɴ ᴀʀɪᴀ.

💬 ᴄʜᴀᴛᴛɪɴɢ ɪs ғʀᴇᴇ
🎨 ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ ʀᴇǫᴜɪʀᴇs sɪɢɴᴜᴘ ғᴏʀ ғʀᴇᴇ ᴜsᴇʀs
⭐ ᴘʀᴇᴍɪᴜᴍ ᴜsᴇʀs ᴅᴏɴ'ᴛ ɴᴇᴇᴅ sɪɢɴᴜᴘ ғᴏʀ ɪᴍᴀɢᴇ ɢᴇɴ

━━━━━━━━━━━━━━━━━━

✨ <b>ᴊᴜsᴛ ᴊᴏɪɴ → ᴠᴇʀɪғʏ → ᴄʜᴀᴛ.</b>
</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: forceJoinKeyboard(missing)
      }
    );
  }

  // No signup/login wall: open the normal menu immediately.
  return sendMainMenu(chatId, userId);
});
}

module.exports = register;
