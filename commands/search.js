const webSearch = require("../services/webSearch");

module.exports = async (ctx) => {
    try {
        const query = (ctx.match || "").trim();

        if (!query) {
            return ctx.replyWithPhoto(
                "https://i.imgur.com/2Q9Z6Qk.jpeg", // Replace with your own banner
                {
                    caption: `
╭──〔 🌐 ᴍɪss ᴀʀɪᴀ • ᴡᴇʙ sᴇᴀʀᴄʜ 〕──╮

ʜɪ! ɪ ᴄᴀɴ sᴇᴀʀᴄʜ ᴛʜᴇ ɪɴᴛᴇʀɴᴇᴛ ғᴏʀ
ʏᴏᴜ ᴀɴᴅ sᴜᴍᴍᴀʀɪᴢᴇ ᴛʜᴇ ʀᴇsᴜʟᴛs.

🔎 <code>/search ʟᴀᴛᴇsᴛ ᴀɪ ɴᴇᴡs</code>

🔎 <code>/search ᴡʜᴏ ɪɴᴠᴇɴᴛᴇᴅ ᴊᴀᴠᴀsᴄʀɪᴘᴛ</code>

🔎 <code>/search ᴡᴇᴀᴛʜᴇʀ ɪɴ ʟᴀɢᴏs</code>

╰────────────────────╯
`,
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🌍 тяєη∂ιηg", callback_data: "search_trending" },
                                { text: "📰 ηєωѕ", callback_data: "search_news" }
                            ],
                            [
                                { text: "📚 ∂єєρ ѕєαя¢н", callback_data: "search_deep" }
                            ],
                            [
                                { text: "🏠 мαιη мєηυ", callback_data: "home" }
                            ]
                        ]
                    }
                }
            );
        }

        await ctx.sendChatAction("typing");

        const result = await webSearch(query);

        if (!result) {
            return ctx.reply("❌ ғᴀɪʟᴇᴅ ᴛᴏ sᴇᴀʀᴄʜ.");
        }

        let text = `
╭──〔 🌐 ᴍɪss ᴀʀɪᴀ • sᴇᴀʀᴄʜ 〕──╮

🔎 <b>qυєяу</b>

${query}

✨ <b>ѕυммαяу</b>

${result.answer || "ɴᴏ sᴜᴍᴍᴀʀʏ ᴀᴠᴀɪʟᴀʙʟᴇ."}
`;

        if (result.results?.length) {
            text += `\n📚 <b>ѕσυя¢єѕ</b>\n\n`;

            result.results.slice(0, 3).forEach((r, i) => {
                text += `${i + 1}. <a href="${r.url}">${r.title}</a>\n`;
            });
        }

        text += `

╰────────────────────╯`;

        await ctx.replyWithPhoto(
            "https://i.imgur.com/2Q9Z6Qk.jpeg", // Replace with your own banner
            {
                caption: text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🌐 σρєη ѕσυя¢єѕ",
                                url: result.results?.[0]?.url || "https://google.com"
                            }
                        ],
                        [
                            {
                                text: "🔄 ѕєαя¢н αgαιη",
                                callback_data: "search_again",
                                style: 'success'
                            },
                            {
                                text: "📄 ∂єєρ ѕєαя¢н",
                                callback_data: "search_deep",
                                style: 'primary'
                            }
                        ],
                        [
                            {
                                text: "🏠 мαιη мєηυ",
                                callback_data: "home",
                                style: 'success'
                            }
                        ]
                    ]
                }
            }
        );

    } catch (err) {
        console.error(err);
        ctx.reply("❌ sᴏᴍᴇᴛʜɪɴɢ ᴡᴇɴᴛ ᴡʀᴏɴɢ.");
    }
};