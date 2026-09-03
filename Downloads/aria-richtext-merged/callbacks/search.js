const webSearch = require("../services/webSearch");

module.exports = (bot) => {

    // 🌍 ᴛяєη∂ιηg
    bot.action("search_trending", async (ctx) => {
        await ctx.answerCbQuery();

        const result = await webSearch("Tяєη∂ιηg ηєωѕ тσ∂αу");

        if (!result) {
            return ctx.reply("❌ ᴄσυℓ∂η'т ғєтᴄн тяєη∂ιηg ηєωѕ.");
        }

        let text = `🌍 <b>тяєη∂ιηg тσ∂αу</b>\n\n`;

        result.results.slice(0, 5).forEach((r, i) => {
            text += `${i + 1}. <a href="${r.url}">${r.title}</a>\n\n`;
        });

        await ctx.reply(text, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌐 ηєω ѕєαя¢н", callback_data: "search_again" ,},
                        { text: "🔄 яєƒяєѕн", callback_data: "search_trending" }
                    ]
                ]
            }
        });
    });


    // 📰 ηєωѕ
    bot.action("search_news", async (ctx) => {
        await ctx.answerCbQuery();

        const result = await webSearch("Lαтєѕт ωσяℓ∂ ηєωѕ");

        if (!result) {
            return ctx.reply("❌ ηєωѕ υηαναιℓαναℓє.");
        }

        let text = `📰 <b>ℓαтєѕт ηєωѕ</b>\n\n`;

        result.results.slice(0, 5).forEach((r, i) => {
            text += `${i + 1}. <a href="${r.url}">${r.title}</a>\n\n`;
        });

        await ctx.reply(text, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌐 ηєω ѕєαя¢н", callback_data: "search_again" ,style: 'success'},
                        { text: "🔄 яєƒяєѕн", callback_data: "search_news" ,style: 'success'}
                    ]
                ]
            }
        });
    });

    // 📚 ∂єєρ Sєαя¢н
    bot.action("search_deep", async (ctx) => {
        await ctx.answerCbQuery();

        await ctx.reply(`
💎 <b>∂єєρ ѕєαя¢н</b>

тʏρє уσυя ǫυєяʏ:

<code>/∂єєρѕєαя¢н ʏσυя ǫυєяʏ</code>

<b>єχαмρℓє</b>

• /∂єєρѕєαя¢н ℓαтєѕт αι ηєωѕ
`, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔍 ηєω ѕєαя¢н", callback_data: "search_again" }
                    ]
                ]
            }
        });
    });


    // 🔄 Sєαя¢н Aɢαιη
    bot.action("search_again", async (ctx) => {
        await ctx.answerCbQuery();

        await ctx.reply(`
🌐 <blockquote expandable='true'><b>мιѕѕ αяια • ηєω ѕєαя¢н</b></blockquote>

тʏρє:

<code>/ѕєαя¢н ʏσυя ǫυєяʏ</code>

<b>єχαмρℓєѕ</b>

• /ѕєαя¢н ℓαтєѕт αι ηєωѕ
• /ѕєαя¢н тєℓєgяαм вσтѕ
• /ѕєαя¢н ησ∂єנѕ
`, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌍 тяєη∂ιηg", callback_data: "search_trending" ,style:'success'},
                        { text: "📰 ηєωѕ", callback_data: "search_news",style:'success' }
                    ],
                    [
                        { text: "💎 ∂єєρ ѕєαя¢н", callback_data: "search_deep",style:'primary' }
                    ]
                ]
            }
        });
    });
}
