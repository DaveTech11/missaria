// ============================================================
// features.js
// A batch of new, self-contained slash-command features.
// Kept in its own file so it doesn't add more risk to the
// already-massive bot.js. Call registerFeatures(bot) once.
// ============================================================

module.exports = function registerFeatures(bot) {

  const startedAt = Date.now();

  const send = (chatId, text, extra) => bot.sendMessage(chatId, text, extra);

  // 1. Ping / latency
  bot.onText(/\/ping/, async (msg) => { const chatId = msg.chat.id; const t0 = Date.now(); const sent = await bot.sendPhoto( chatId, "./images/ping.jpg", { caption: `🏓 <blockquote expandable="true">Checking ping...</blockquote>`, parse_mode: "HTML", reply_to_message_id: msg.message_id } ); const animations = [ "📡 Getting Server Host...", "🧮 Accessing Server...", "🚨 Details Acquired...", "🌐 System Ping Done...", "🔄 Almost there..." ]; for (const text of animations) { await new Promise(resolve => setTimeout(resolve, 700)); await bot.editMessageCaption( `<blockquote expandable="true">${text}</blockquote>`, { chat_id: chatId, message_id: sent.message_id, parse_mode: "HTML" } ); } const ms = Date.now() - t0; const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name; await bot.editMessageCaption( `🏓 <blockquote expandable="true">Pong! ${ms}ms</blockquote>\n\n` + `👤 ${username}\n` + `⚡ Server: Online\n` + `🌐 Status: Excellent`, { chat_id: chatId, message_id: sent.message_id, parse_mode: "HTML" } ); });
  
  // 2. Uptime
  bot.onText(/\/uptime/, async (msg) => {
    const chatId = msg.chat.id;

    const username = msg.from.username
        ? `@${msg.from.username}`
        : msg.from.first_name;

    // Send menu image
    const sent = await bot.sendPhoto(
        chatId,
        "./images/menu.jpg",
        {
            caption:
`⏱️ <blockquote expandable="true">🔄 Checking uptime...</blockquote>

👤 ${username}`,
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );

    // Animated status updates
    const animations = [
        "🔄 Checking system uptime...",
        "⚙️ Reading server status...",
        "📡 Checking bot connection...",
        "🧮 Calculating uptime...",
        "🚀 Almost done...",
        "✅ Uptime acquired..."
    ];

    for (const status of animations) {
        await new Promise(resolve => setTimeout(resolve, 650));

        await bot.editMessageCaption(
`⏱️ <blockquote expandable="true">${status}</blockquote>

👤 ${username}`,
            {
                chat_id: chatId,
                message_id: sent.message_id,
                parse_mode: "HTML"
            }
        );
    }

    // Calculate uptime
    const totalSeconds = Math.floor(
        (Date.now() - startedAt) / 1000
    );

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const uptime =
        `${days > 0 ? `${days}d ` : ""}` +
        `${hours}h ${minutes}m ${seconds}s`;

    // Final uptime result
    await bot.editMessageCaption(
`⏱️ <blockquote expandable="true">ᴍɪss ᴀʀɪᴀ ᴜᴘᴛɪᴍᴇ

━━━━━━━━━━━━━━
⏳ ${uptime}
⚡ Status: Online
🟢 System: Running
━━━━━━━━━━━━━━</blockquote>

👤 ${username}`,
        {
            chat_id: chatId,
            message_id: sent.message_id,
            parse_mode: "HTML"
        }
    );
});
// ==========================================
// USER PROFILE DATABASE / STORAGE
// ==========================================

const profiles = new Map();

function getProfile(userId) {
    if (!profiles.has(userId)) {
        profiles.set(userId, {
            level: 1,
            aura: 0,
            wealth: "Starting",
            activity: "Voice",
            activityNeed: 20,
            nextWealth: 5000,
            messages: 0
        });
    }

    return profiles.get(userId);
}


// ==========================================
// ADD AURA / MESSAGE ACTIVITY
// ==========================================

function addUserActivity(userId) {
    const profile = getProfile(userId);

    profile.aura += 1;
    profile.messages += 1;

    const newLevel = Math.floor(profile.aura / 100) + 1;

    if (newLevel > profile.level) {
        profile.level = newLevel;
    }

    if (profile.aura >= 5000) {
        profile.wealth = "Elite";
    } else if (profile.aura >= 2500) {
        profile.wealth = "Rich";
    } else if (profile.aura >= 1000) {
        profile.wealth = "Rising";
    } else {
        profile.wealth = "Starting";
    }

    return profile;
}


// ==========================================
// /PROFILE
// ==========================================

bot.onText(/\/profile/, async (msg) => {
    const user = msg.from;
    const chatId = msg.chat.id;

    const profile = getProfile(user.id);

    const username = user.username
        ? `@${user.username}`
        : user.first_name;

    const text = `💗 <blockquote expandable="true">ᴍɪss ᴀʀɪᴀ · ᴘʀᴏғɪʟᴇ

━━━━━━━━━━━━━━━━━━

👤 ᴜsᴇʀ:
<a href="tg://user?id=${user.id}">${user.first_name}</a>

🆔 ɪᴅ:
<code>${user.id}</code>

⭐ ʟᴇᴠᴇʟ:
<b>ℵ${profile.level}</b>

💎 ᴀᴜʀᴀ:
<b>${profile.aura.toLocaleString()}</b>

💰 ᴡᴇᴀʟᴛʜ:
<b>${profile.wealth}</b>

📈 ɴᴇxᴛ ᴡᴇᴀʟᴛʜ:
<b>ℵ${profile.nextWealth.toLocaleString()}</b>

🎙️ ᴀᴄᴛɪᴠɪᴛʏ:
<b>${profile.activity}</b>

💬 ᴍᴇssᴀɢᴇs:
<b>${profile.messages.toLocaleString()}</b>

━━━━━━━━━━━━━━━━━━

✨ <b>ᴋᴇᴇᴘ ᴜsɪɴɢ ᴍɪss ᴀʀɪᴀ ᴛᴏ ɢʀᴏᴡ ʏᴏᴜʀ ᴀᴜʀᴀ 💗</b>
</blockquote>

👤 ${username}`;

    await bot.sendPhoto(
        chatId,
        "./images/profile.jpg",
        {
            caption: text,
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id,

            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "👑 Developer",
                            url: "https://t.me/F3BAN"
                        },
                        {
                            text: "💗 Support Channel",
                            url: "https://t.me/YOUR_CHANNEL"
                        }
                    ],
                    [
                        {
                            text: "🔄 Refresh Profile",
                            callback_data: "profile_refresh"
                        }
                    ]
                ]
            }
        }
    );
});


// ==========================================
// REFRESH PROFILE BUTTON
// ==========================================

bot.on("callback_query", async (query) => {
    if (query.data !== "profile_refresh") return;

    const user = query.from;
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    const profile = getProfile(user.id);

    const username = user.username
        ? `@${user.username}`
        : user.first_name;

    const text = `💗 <blockquote expandable="true">ᴍɪss ᴀʀɪᴀ · ᴘʀᴏғɪʟᴇ

━━━━━━━━━━━━━━━━━━

👤 ᴜsᴇʀ:
<a href="tg://user?id=${user.id}">${user.first_name}</a>

🆔 ɪᴅ:
<code>${user.id}</code>

⭐ ʟᴇᴠᴇʟ:
<b>ℵ${profile.level}</b>

💎 ᴀᴜʀᴀ:
<b>${profile.aura.toLocaleString()}</b>

💰 ᴡᴇᴀʟᴛʜ:
<b>${profile.wealth}</b>

📈 ɴᴇxᴛ ᴡᴇᴀʟᴛʜ:
<b>ℵ${profile.nextWealth.toLocaleString()}</b>

🎙️ ᴀᴄᴛɪᴠɪᴛʏ:
<b>${profile.activity}</b>

💬 ᴍᴇssᴀɢᴇs:
<b>${profile.messages.toLocaleString()}</b>

━━━━━━━━━━━━━━━━━━

✨ <b>ᴋᴇᴇᴘ ᴜsɪɴɢ ᴍɪss ᴀʀɪᴀ ᴛᴏ ɢʀᴏᴡ ʏᴏᴜʀ ᴀᴜʀᴀ 💗</b>
</blockquote>

👤 ${username}`;

    try {
        await bot.editMessageCaption(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",

            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "👑 Developer",
                            url: "https://t.me/F3BAN"
                        },
                        {
                            text: "💗 Support Channel",
                            url: "https://t.me/YOUR_CHANNEL"
                        }
                    ],
                    [
                        {
                            text: "🔄 Refresh Profile",
                            callback_data: "profile_refresh"
                        }
                    ]
                ]
            }
        });

        await bot.answerCallbackQuery(query.id, {
            text: "💗 Profile refreshed!"
        });

    } catch (err) {
        console.error("Profile refresh error:", err);

        await bot.answerCallbackQuery(query.id, {
            text: "❌ Unable to refresh profile."
        });
    }
});


bot.on("message", async (msg) => {
    if (!msg.from) return;

    if (msg.text === "/profile") return;

    addUserActivity(msg.from.id);
});
  // 4. Dice Roll
bot.onText(/\/roll(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;

    const sides = Math.max(
        2,
        Math.min(1000, parseInt(match[1] || "6", 10))
    );

    const roll = await bot.sendPhoto(
        chatId,
        "./images/dice.jpg",
        {
            caption: `🎲 ʀᴏʟʟɪɴɢ ᴅ${sides}...`,
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );

    const animations = [
        `🎲 ʀᴏʟʟɪɴɢ ᴅ${sides}.`,
        `🎲 ʀᴏʟʟɪɴɢ ᴅ${sides}..`,
        `🎲 ʀᴏʟʟɪɴɢ ᴅ${sides}...`,
        `🎲 ✨ sʜᴀᴋɪɴɢ ᴛʜᴇ ᴅɪᴄᴇ...`,
        `🎲 🔄 ᴛʜʀᴏᴡɪɴɢ ᴅ${sides}...`,
        `🎲 🎯 ᴄᴀʟᴄᴜʟᴀᴛɪɴɢ ʀᴇsᴜʟᴛ...`
    ];

    for (const text of animations) {
        await new Promise(resolve =>
            setTimeout(resolve, 600)
        );

        await bot.editMessageCaption(
            text,
            {
                chat_id: chatId,
                message_id: roll.message_id,
                parse_mode: "HTML"
            }
        );
    }

    const result = 1 + Math.floor(Math.random() * sides);

    await bot.editMessageCaption(
`<blockquote expandable="true">
🎲 <b>ᴅɪᴄᴇ ʀᴏʟʟ ʀᴇsᴜʟᴛ</b>

━━━━━━━━━━━━━━━━━━

👤 ᴘʟᴀʏᴇʀ:
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

🎯 ᴅɪᴄᴇ:
<b>ᴅ${sides}</b>

✨ ʀᴏʟʟᴇᴅ:
<b>${result}</b>

━━━━━━━━━━━━━━━━━━

🍀 ɢᴏᴏᴅ ʟᴜᴄᴋ!
</blockquote>`,
        {
            chat_id: chatId,
            message_id: roll.message_id,
            parse_mode: "HTML"
        }
    );
});
// 5. Magic 8-Ball
bot.onText(/\/8ball(?:\s+(.+))?/, async (msg, match) => {

    const chatId = msg.chat.id;

    const answers = [
        "ʏᴇs ✨",
        "ɴᴏ ❌",
        "ᴅᴇғɪɴɪᴛᴇʟʏ 💫",
        "ᴀsᴋ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ 🔮",
        "ᴜɴʟɪᴋᴇʟʏ 🌙",
        "ᴀʙsᴏʟᴜᴛᴇʟʏ ⭐",
        "ɪᴛ ɪs ᴅᴇᴄɪᴅᴇᴅ ⚡",
        "ᴠᴇʀʏ ᴅᴏᴜʙᴛғᴜʟ 💭"
    ];

    if (!match[1]) {
        return bot.sendMessage(
            chatId,
            "🎱 ᴀsᴋ ᴍᴇ sᴏᴍᴇᴛʜɪɴɢ:\n\n/8ball ᴡɪʟʟ ɪ ᴡɪɴ?",
            {
                reply_to_message_id: msg.message_id
            }
        );
    }

    const ball = await bot.sendPhoto(
        chatId,
        "./images/8ball.jpg",
        {
            caption:
`<blockquote expandable="true">
🎱 ᴍʏsᴛɪᴄ 8ʙᴀʟʟ ɪs ᴛʜɪɴᴋɪɴɢ...
</blockquote>`,
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );

    const animations = [
`<blockquote expandable="true">
🎱 sʜᴀᴋɪɴɢ ᴛʜᴇ 8ʙᴀʟʟ...
</blockquote>`,

`<blockquote expandable="true">
🎱 ᴄᴏɴsᴜʟᴛɪɴɢ ᴛʜᴇ ᴜɴɪᴠᴇʀsᴇ ✨
</blockquote>`,

`<blockquote expandable="true">
🎱 ʀᴇᴀᴅɪɴɢ ᴛʜᴇ ғᴜᴛᴜʀᴇ 🔮
</blockquote>`,

`<blockquote expandable="true">
🎱 ᴛʜᴇ ᴀɴsᴡᴇʀ ɪs ɴᴇᴀʀ...
</blockquote>`
    ];

    for (const text of animations) {

        await new Promise(resolve =>
            setTimeout(resolve, 800)
        );

        await bot.editMessageCaption(
            text,
            {
                chat_id: chatId,
                message_id: ball.message_id,
                parse_mode: "HTML"
            }
        );
    }

    const answer =
        answers[Math.floor(Math.random() * answers.length)];

    await bot.editMessageCaption(
`<blockquote expandable="true">
🎱 <b>ᴍʏsᴛɪᴄ 8ʙᴀʟʟ</b>

━━━━━━━━━━━━━━━━━━

👤 ᴘʟᴀʏᴇʀ:
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

❓ ǫᴜᴇsᴛɪᴏɴ:
${match[1]}

🔮 ᴀɴsᴡᴇʀ:
<b>${answer}</b>

━━━━━━━━━━━━━━━━━━

✨ ᴛʜᴇ 8ʙᴀʟʟ ʜᴀs sᴘᴏᴋᴇɴ.
</blockquote>`,
        {
            chat_id: chatId,
            message_id: ball.message_id,
            parse_mode: "HTML"
        }
    );
});
  // 6. Random number
bot.onText(/\/random(?:\s+(\d+)\s+(\d+))?/, async (msg, match) => {

    const chatId = msg.chat.id;

    const min = match[1]
        ? parseInt(match[1], 10)
        : 1;

    const max = match[2]
        ? parseInt(match[2], 10)
        : 100;


    const randomMsg = await bot.sendMessage(
        chatId,
`<blockquote expandable='true'>
🔢 ɢᴇɴᴇʀᴀᴛɪɴɢ ʀᴀɴᴅᴏᴍ ɴᴜᴍʙᴇʀ...
</blockquote>`,
        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );


    const animations = [
`<blockquote expandable='true'>
🔢 ᴄʜᴏᴏsɪɴɢ ᴀ ɴᴜᴍʙᴇʀ...
</blockquote>`,

`<blockquote expandable='true'>
🔢 ᴄᴀʟᴄᴜʟᴀᴛɪɴɢ ᴘᴏssɪʙɪʟɪᴛɪᴇs...
</blockquote>`,

`<blockquote expandable='true'>
🎲 sᴘɪɴɴɪɴɢ ᴛʜᴇ ʀᴀɴᴅᴏᴍɪᴢᴇʀ...
</blockquote>`,

`<blockquote expandable='true'>
✨ ɢᴇᴛᴛɪɴɢ ʀᴇsᴜʟᴛ...
</blockquote>`
    ];


    for (const text of animations) {

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );


        await bot.editMessageText(
            text,
            {
                chat_id: chatId,
                message_id: randomMsg.message_id,
                parse_mode: "HTML"
            }
        );

    }


    const result =
        min + Math.floor(
            Math.random() * (max - min + 1)
        );


    await bot.editMessageText(
`<blockquote expandable='true'>
🔢 <b>ʀᴀɴᴅᴏᴍ ɴᴜᴍʙᴇʀ</b>

👤 ᴘʟᴀʏᴇʀ:
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

📊 ʀᴀɴɢᴇ:
${min} - ${max}

✨ ʀᴇsᴜʟᴛ:
<b>${result}</b>

🍀 ᴛʜᴇ ʀᴀɴᴅᴏᴍ ɢᴏᴅs ʜᴀᴠᴇ ᴄʜᴏsᴇɴ.
</blockquote>`,
        {
            chat_id: chatId,
            message_id: randomMsg.message_id,
            parse_mode: "HTML"
        }
    );

});

  // 7. Choose between options
bot.onText(/\/choose\s+(.+)/, async (msg, match) => {

    const chatId = msg.chat.id;

    const opts = match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);


    if (opts.length < 2) {

        return bot.sendMessage(
            chatId,
`<blockquote expandable='true'>
👉 ᴘʟᴇᴀsᴇ ɢɪᴠᴇ ᴀᴛ ʟᴇᴀsᴛ 2 ᴏᴘᴛɪᴏɴs.

ᴇxᴀᴍᴘʟᴇ:
➜ /choose ᴘɪᴢᴢᴀ, ʙᴜʀɢᴇʀ
</blockquote>`,
            {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );

    }


    const choosing = await bot.sendMessage(
        chatId,
`<blockquote expandable='true'>
<tg-emoji emoji-id="5350460637182993292">🎯</tg-emoji> ᴄʜᴏᴏsɪɴɢ ᴀɴ ᴏᴘᴛɪᴏɴ...
</blockquote>`,
        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );


    const animations = [
`<blockquote expandable='true'>
<tg-emoji emoji-id="5350460637182993292">🎯</tg-emoji> ᴄᴏᴍᴘᴀʀɪɴɢ ᴄʜᴏɪᴄᴇs...
</blockquote>`,

`<blockquote expandable='true'>
🎲 ʀᴀɴᴅᴏᴍɪᴢɪɴɢ ᴛʜᴇ ᴏᴘᴛɪᴏɴs...
</blockquote>`,

`<blockquote expandable='true'>
✨ sᴇʟᴇᴄᴛɪɴɢ ᴛʜᴇ ᴡɪɴɴᴇʀ...
</blockquote>`
    ];


    for (const text of animations) {

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );


        await bot.editMessageText(
            text,
            {
                chat_id: chatId,
                message_id: choosing.message_id,
                parse_mode: "HTML"
            }
        );

    }


    const result =
        opts[Math.floor(Math.random() * opts.length)];


    await bot.editMessageText(
`<blockquote expandable='true'>
<tg-emoji emoji-id="5350460637182993292">🎯</tg-emoji> <b>ᴄʜᴏɪᴄᴇ ʀᴇsᴜʟᴛ</b>

👤 ᴘʟᴀʏᴇʀ:
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

📋 ᴏᴘᴛɪᴏɴs:
${opts.join(" • ")}

✨ ᴄʜᴏsᴇɴ:
<b>${result}</b>

🍀 ᴛʜᴇ ᴄʜᴏɪᴄᴇ ʜᴀs ʙᴇᴇɴ ᴍᴀᴅᴇ.
</blockquote>`,
        {
            chat_id: chatId,
            message_id: choosing.message_id,
            parse_mode: "HTML"
        }
    );

});
  // 8. User info
// User Info
bot.onText(/\/whoami/, async (msg) => {

    const chatId = msg.chat.id;


    const loading = await bot.sendMessage(
        chatId,
`<blockquote expandable='true'>
👤 ᴄʜᴇᴄᴋɪɴɢ ᴜsᴇʀ ɪɴғᴏ...
</blockquote>`,
        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );


    const animations = [
`<blockquote expandable='true'>
🔍 ʟᴏᴏᴋɪɴɢ ᴜᴘ ᴘʀᴏғɪʟᴇ...
</blockquote>`,

`<blockquote expandable='true'>
✨ ᴀɴᴀʟʏᴢɪɴɢ ᴜsᴇʀ ᴅᴀᴛᴀ...
</blockquote>`,

`<blockquote expandable='true'>
👑 ᴘʀᴇᴘᴀʀɪɴɢ ɪɴғᴏ ᴄᴀʀᴅ...
</blockquote>`
    ];


    for (const text of animations) {

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );


        await bot.editMessageText(
            text,
            {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "HTML"
            }
        );

    }


    await bot.editMessageText(
`<blockquote expandable='true'>
👤 <b>ᴜsᴇʀ ɪɴғᴏ</b>

🆔 ɪᴅ:
<code>${msg.from.id}</code>

🏷️ ɴᴀᴍᴇ:
${msg.from.first_name || "Unknown"} ${msg.from.last_name || ""}

🔗 ᴜsᴇʀɴᴀᴍᴇ:
${msg.from.username ? "@" + msg.from.username : "ɴᴏɴᴇ"}

🌐 ʟᴀɴɢᴜᴀɢᴇ:
${msg.from.language_code || "Unknown"}

✨ ᴘʀᴏғɪʟᴇ ʟᴏᴀᴅᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ
</blockquote>`,
        {
            chat_id: chatId,
            message_id: loading.message_id,
            parse_mode: "HTML"
        }
    );

});

  // 9. Chat info
// Chat Info
bot.onText(/\/chatinfo/, async (msg) => {

    const chatId = msg.chat.id;


    const loading = await bot.sendMessage(
        chatId,
`<blockquote expandable='true'>
💬 ᴄʜᴇᴄᴋɪɴɢ ᴄʜᴀᴛ ɪɴғᴏ...
</blockquote>`,
        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );


    const animations = [
`<blockquote expandable='true'>
💬 ᴀɴᴀʟʏᴢɪɴɢ ᴄʜᴀᴛ...
</blockquote>`,

`<blockquote expandable='true'>
🔍 ғᴇᴛᴄʜɪɴɢ ᴅᴇᴛᴀɪʟs...
</blockquote>`,

`<blockquote expandable='true'>
✨ ᴘʀᴇᴘᴀʀɪɴɢ ᴄʜᴀᴛ ʀᴇᴘᴏʀᴛ...
</blockquote>`
    ];


    for (const text of animations) {

        await new Promise(resolve =>
            setTimeout(resolve, 700)
        );


        await bot.editMessageText(
            text,
            {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "HTML"
            }
        );

    }


    const title =
        msg.chat.title || "Private Chat";


    const type =
        msg.chat.type.toUpperCase();


    await bot.editMessageText(
`<blockquote expandable='true'>
💬 <b>ᴄʜᴀᴛ ɪɴғᴏ</b>

🆔 ɪᴅ:
<code>${msg.chat.id}</code>

📌 ᴛʏᴘᴇ:
${type}

🏷️ ᴛɪᴛʟᴇ:
${title}

👤 ʀᴇǫᴜᴇsᴛᴇᴅ ʙʏ:
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

✨ ᴄʜᴀᴛ ɪɴғᴏ ʟᴏᴀᴅᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ
</blockquote>`,
        {
            chat_id: chatId,
            message_id: loading.message_id,
            parse_mode: "HTML"
        }
    );

});
  // 10. Avatar
bot.onText(/\/avatar/, async (msg) => {

    const chatId = msg.chat.id;

    try {

        const photos = await bot.getUserProfilePhotos(
            msg.from.id,
            {
                limit: 1
            }
        );


        if (!photos.total_count) {

            return bot.sendMessage(
                chatId,
`<blockquote expandable='true'>
🖼️ ᴀᴠᴀᴛᴀʀ ɴᴏᴛ ғᴏᴜɴᴅ

❌ ᴛʜɪs ᴜsᴇʀ ʜᴀs ɴᴏ ᴘʀᴏғɪʟᴇ ᴘɪᴄᴛᴜʀᴇ.
</blockquote>`,
                {
                    parse_mode: "HTML",
                    reply_to_message_id: msg.message_id
                }
            );

        }


        const fileId =
            photos.photos[0][
                photos.photos[0].length - 1
            ].file_id;


        await bot.sendPhoto(
            chatId,
            fileId,
            {
                caption:
`<blockquote expandable='true'>
🖼️ <b>ᴘʀᴏғɪʟᴇ ᴀᴠᴀᴛᴀʀ</b>

👤 ᴜsᴇʀ:
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

✨ ʜᴇʀᴇ ɪs ʏᴏᴜʀ ᴀᴠᴀᴛᴀʀ.
</blockquote>`,
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );


    } catch (e) {

        console.error("AVATAR ERROR:", e);

        await bot.sendMessage(
            chatId,
`<blockquote expandable='true'>
❌ ᴄᴏᴜʟᴅɴ'ᴛ ғᴇᴛᴄʜ ᴀᴠᴀᴛᴀʀ.

🌸 ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.
</blockquote>`,
            {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );

    }

});

  // 11. AFK
  const afkUsers = new Map();
  bot.onText(/\/afk(?:\s+(.+))?/, (msg, match) => {
    afkUsers.set(msg.from.id, match[1] || "AFK");
    send(msg.chat.id, `💤 ${msg.from.first_name} is now AFK: ${match[1] || "AFK"}`);
  });
  bot.on("message", (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    if (afkUsers.has(msg.from.id)) {
      afkUsers.delete(msg.from.id);
      send(msg.chat.id, `👋 Welcome back, ${msg.from.first_name}! AFK removed.`);
    }
    if (msg.reply_to_message && afkUsers.has(msg.reply_to_message.from.id)) {
      const reason = afkUsers.get(msg.reply_to_message.from.id);
      send(msg.chat.id, `💤 ${msg.reply_to_message.from.first_name} is AFK: ${reason}`);
    }
  });

  // 12. Reminders
  bot.onText(/\/remind\s+(\d+)([mh])\s+(.+)/, (msg, match) => {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === "h" ? amount * 3600000 : amount * 60000;
    send(msg.chat.id, `⏰ Reminder set for ${amount}${unit}: "${match[3]}"`);
    setTimeout(() => send(msg.chat.id, `⏰ Reminder: ${match[3]}`), ms);
  });

  // 13. Poll
  bot.onText(/\/poll\s+(.+)/, (msg, match) => {
    const parts = match[1].split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 3) return send(msg.chat.id, "Usage: /poll Question | Option1 | Option2 | ...");
    bot.sendPoll(msg.chat.id, parts[0], parts.slice(1), { is_anonymous: false });
  });

  // 14. Calculator
  bot.onText(/\/calc\s+(.+)/, (msg, match) => {
    try {
      if (!/^[0-9+\-*/().\s]+$/.test(match[1])) throw new Error("bad chars");
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict";return (${match[1]})`)();
      send(msg.chat.id, `🧮 ${match[1]} = ${result}`);
    } catch {
      send(msg.chat.id, "❌ Invalid expression. Only numbers and + - * / ( ) allowed.");
    }
  });

  // 15. QR code (via public QR image API — no key needed)
  bot.onText(/\/qr\s+(.+)/, (msg, match) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(match[1])}`;
    bot.sendPhoto(msg.chat.id, url, { caption: "📷 Your QR code" }).catch(() =>
      send(msg.chat.id, "❌ Couldn't generate QR code.")
    );
  });

  // 16. Reverse text
  bot.onText(/\/reverse\s+(.+)/, (msg, match) => {
    send(msg.chat.id, match[1].split("").reverse().join(""));
  });

  // 17. Word/char count
  bot.onText(/\/count\s+(.+)/, (msg, match) => {
    const words = match[1].trim().split(/\s+/).length;
    send(msg.chat.id, `📝 ${words} words, ${match[1].length} characters`);
  });

  // 18. Poll-style vote tally is handled by Telegram itself; add /suggest instead
  bot.onText(/\/suggest\s+(.+)/, (msg, match) => {
    send(msg.chat.id, `💡 Suggestion recorded: "${match[1]}"\nThanks, ${msg.from.first_name}!`);
  });
bot.onText(/\/emoji/, async (msg) => {

    await bot.sendMessage(
        msg.chat.id,
 
`<tg-emoji emoji-id="5906716471756593520">🎁</tg-emoji>🎁Premium Test`,
        {
            parse_mode: "HTML"
        }
    );

});
  // 19. Bot stats

bot.onText(/\/botstats/, async (msg) => {
    const chatId = msg.chat.id;

    const mem = process.memoryUsage().rss / 1024 / 1024;
    const uptime = Math.floor((Date.now() - startedAt) / 1000);

    const text = `
<blockquote expandable='true'>
<tg-emoji emoji-id="5465665476971471368"></tg-emoji> <b>ʙᴏᴛ sᴛᴀᴛs</b>

<tg-emoji emoji-id="5352670019899652428"></tg-emoji> <b>ʀᴀᴍ</b>
${mem.toFixed(1)} ᴍʙ

<tg-emoji emoji-id="5906891238270834298"></tg-emoji> <b>ɴᴏᴅᴇ.ᴊs</b>
${process.version}

<tg-emoji emoji-id="6100453534422013617"></tg-emoji> <b>ᴜᴘᴛɪᴍᴇ</b>
${uptime}s

<tg-emoji emoji-id="5237699328847950683"></tg-emoji> <b>sᴛᴀᴛᴜs</b>
Online

<tg-emoji emoji-id="5213460324425935151"></tg-emoji>
<b>ᴍɪss ᴀʀɪᴀ ɪs ʀᴜɴɴɪɴɢ sᴍᴏᴏᴛʜʟʏ</b>
</blockquote>`;

    try {
        await bot.sendMessage(chatId, text, {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        });
    } catch (err) {
        console.log(err.response?.body || err);
    }
});
  // 20. Help for new features
bot.onText(/\/help/, async (msg) => {

    await bot.sendMessage(
        msg.chat.id,

`<blockquote expandable='true'>
✨ <b>ɴᴇᴡ ᴄᴏᴍᴍᴀɴᴅs</b>

🎮 /games — ʟɪsᴛ ᴀʟʟ 30 ɢᴀᴍᴇs

▶️ /play &lt;ɴᴀᴍᴇ&gt; — sᴛᴀʀᴛ ᴀ ɢᴀᴍᴇ

📥 /download — ᴇxᴘᴏʀᴛ sᴀᴠᴇᴅ ᴍᴇᴅɪᴀ / ᴅᴀᴛᴀ

🤖 "ᴄᴏᴅᴇ ᴀ ᴡᴇʙsɪᴛᴇ ғᴏʀ ᴍᴇ"
— ᴀɪ ᴄᴏᴅᴇ + ᴅᴇᴘʟᴏʏ ᴀssɪsᴛᴀɴᴛ

⚡ /ping
⏱️ /uptime
🪙 /coinflip
🎲 /roll
🎱 /8ball
🔢 /random
<tg-emoji emoji-id="5350460637182993292">🎯</tg-emoji> /choose

👤 /whoami
💬 /chatinfo
🖼️ /avatar
💤 /afk
⏰ /remind
📊 /poll
🧮 /calc
🔳 /qr
🔄 /reverse
🔢 /count
💡 /suggest
📈 /botstats

🌸 ᴜsᴇ /help ᴛᴏ ᴠɪᴇᴡ ᴍᴏʀᴇ ғᴇᴀᴛᴜʀᴇs ✨
</blockquote>`,

        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );

});
    };
