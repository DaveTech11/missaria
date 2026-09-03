module.exports = (bot) => {

    bot.onText(/^\/code$/, async (msg) => {

        const chatId = msg.chat.id;

        await bot.sendPhoto(
            chatId,
            "https://files.catbox.moe/oxphv7.jpg", // Replace with your banner
            {
                caption: `
👩‍💻 <b>мιѕѕ αяια • ¢σ∂є ѕтυ∂ισ</b>

━━━━━━━━━━━━━━━━━━

ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴍɪss ᴀʀɪᴀ's ᴘʀᴇᴍɪᴜᴍ ᴄᴏᴅɪɴɢ ᴀssɪsᴛᴀɴᴛ.

✨ ɪ ᴄᴀɴ ʜᴇʟᴘ ʏᴏᴜ ᴡɪᴛʜ:

🐞 ᴅᴇʙᴜɢ ᴄᴏᴅᴇ
💻 ɢᴇɴᴇʀᴀᴛᴇ ᴄᴏᴅᴇ
📖 ᴇxᴘʟᴀɪɴ ᴄᴏᴅᴇ
⚡ ᴏᴘᴛɪᴍɪᴢᴇ ᴄᴏᴅᴇ
🧪 ɢᴇɴᴇʀᴀᴛᴇ ᴛᴇsᴛs
🔄 ᴄᴏɴᴠᴇʀᴛ ʟᴀɴɢᴜᴀɢᴇs
📄 ɢᴇɴᴇʀᴀᴛᴇ ᴅᴏᴄᴜᴍᴇɴᴛᴀᴛɪᴏɴ

━━━━━━━━━━━━━━━━━━

🌸 sᴇʟᴇᴄᴛ ᴀ ᴛᴏᴏʟ ᴛᴏ ʙᴇɢɪɴ.
`,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "🐞 ∂євυg",
                                callback_data: "code_debug"
                            },
                            {
                                text: "💻 gєηєяαтє",
                                callback_data: "code_generate"
                            }
                        ],
                        [
                            {
                                text: "📖 єxρℓαιη",
                                callback_data: "code_explain"
                            },
                            {
                                text: "⚡ σρтιмιzє",
                                callback_data: "code_optimize"
                            }
                        ],
                        [
                            {
                                text: "🧪 тєѕтѕ",
                                callback_data: "code_tests"
                            },
                            {
                                text: "🔄 ¢σηνєят",
                                callback_data: "code_convert"
                            }
                        ],
                        [
                            {
                                text: "📄 ∂σ¢ѕ",
                                callback_data: "code_docs"
                            }
                        ],
                        [
                            {
                                text: "❌ ¢ℓσѕє",
                                callback_data: "close_menu"
                            }
                        ]
                    ]
                }
            }
        );

    });

};