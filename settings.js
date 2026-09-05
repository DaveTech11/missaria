module.exports = (bot) => {

    bot.onText(/^\/setting$/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            await bot.sendPhoto(
                chatId,
                "https://files.catbox.moe/oxphv7.jpg",
                {
                    caption:
                        "⚙️ *Miss Aria Settings*\n\n" +
                        "Choose what you'd like to manage.",

                    parse_mode: "Markdown",

                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "👤 α¢¢συηт",
                                    callback_data: "settings_account"
                                }
                            ],
                            [
                                {
                                    text: "🤖 αι мσ∂єℓ",
                                    callback_data: "settings_model"
                                }
                            ],
                            [
                                {
                                    text: "🎨 ρєяѕσηαℓιту",
                                    callback_data: "settings_personality"
                                }
                            ],
                            [
                                {
                                    text: "💬 мємσяу",
                                    callback_data: "settings_memory"
                                }
                            ],
                            [
                                {
                                    text: "🔒 ρяινα¢у",
                                    callback_data: "settings_privacy"
                                }
                            ],
                            [
                                {
                                    text: "🌐 ℓαηgυαgє",
                                    callback_data: "settings_language"
                                }
                            ],
                            [
                                {
                                    text: "🔔 ησтιƒι¢αтισηѕ",
                                    callback_data: "settings_notifications"
                                }
                            ],
                            [
                                {
                                    text: "🚪 ℓσgσυт",
                                    callback_data: "settings_logout"
                                }
                            ]
                        ]
                    }
                }
            );
        } catch (error) {
            console.error("Settings command error:", error);

            await bot.sendMessage(
                chatId,
                "❌ Failed to open settings."
            );
        }
    });

};