const { searchTrack } = require("../services/musicservice");
const cache = require("../utils/cache");
const logger = require("../utils/logger");

const RESULT_CACHE_TTL = 15 * 60; // 15 minutes

function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildCaption(track) {
    const lines = [
        `🎶 <b>${escapeHtml(track.title)}</b>`,
        `👤 Artist: ${escapeHtml(track.artist)}`,
        `💿 Album: ${escapeHtml(track.album)}`,
        `📅 Release date: ${escapeHtml(track.releaseDate)}`,
        `⏱️ Duration: ${escapeHtml(track.duration)}`
    ];

    if (track.genre) {
        lines.push(`🏷️ Genre: ${escapeHtml(track.genre)}`);
    }

    if (track.explicit) {
        lines.push("🔞 Explicit");
    }

    if (!track.previewUrl) {
        lines.push(
            "\n<i>No official preview clip available for this track — use the links below to listen.</i>"
        );
    }

    return lines.join("\n");
}

function trackKeyboard(track, hasMore) {
    const rows = [
        [
            {
                text: "🎵 αρρℓє мυѕι¢",
                url:
                    track.links?.appleMusic ||
                    `https://music.apple.com/search?term=${encodeURIComponent(track.title)}`
            },
            {
                text: "🎧 ѕρσтιƒу",
                url: track.links?.spotify || "https://open.spotify.com/"
            }
        ],
        [
            {
                text: "▶️ уσυтυвє мυѕι¢",
                url:
                    track.links?.youtubeMusic ||
                    `https://music.youtube.com/search?q=${encodeURIComponent(
                        `${track.title} ${track.artist}`
                    )}`
            }
        ]
    ];

    if (hasMore) {
        rows.push([
            {
                text: "🔎 мσяє яєѕυℓтѕ",
                callback_data: `music_more:${track._searchId}`
            }
        ]);
    }

    return {
        inline_keyboard: rows
    };
}

async function sendTrack(bot, chatId, track, hasMore) {
    const caption = buildCaption(track);
    const reply_markup = trackKeyboard(track, hasMore);

    try {
        if (track.artworkUrl) {
            await bot.sendPhoto(chatId, track.artworkUrl, {
                caption,
                parse_mode: "HTML",
                reply_markup
            });
        } else {
            await bot.sendMessage(chatId, caption, {
                parse_mode: "HTML",
                reply_markup
            });
        }

        // Official preview clip only
        if (track.previewUrl) {
            await bot.sendChatAction(chatId, "upload_audio");

            await bot.sendAudio(
                chatId,
                track.previewUrl,
                {
                    title: track.title,
                    performer: track.artist
                },
                track.artworkUrl
                    ? {
                          filename: `${track.title}.m4a`
                      }
                    : {}
            );
        }
    } catch (err) {
        logger.error("Failed to send track", {
            error: err.message,
            track: track.title
        });

        await bot.sendMessage(
            chatId,
            "⚠️ Found the track but had trouble sending the preview. Try the links above instead."
        );
    }
}

function registerPlay(bot) {

    // ============================================================
    // /play
    // ============================================================

    bot.onText(/^\/play2(?:\s+(.+))?$/i, async (msg, match) => {
        const chatId = msg.chat.id;
        const query = match?.[1]?.trim();

        if (!query) {
            return bot.sendMessage(
                chatId,
                "⚠️ Usage: /play2 <song name>\n\nExample:\n/play hate myself by nf"
            );
        }

        try {
            await bot.sendChatAction(chatId, "typing");

            const results = await searchTrack(query, 5);

            if (!results || !results.length) {
                return bot.sendMessage(
                    chatId,
                    `🔍 No results found for "${query}".`
                );
            }

            const searchId = `${msg.from.id}:${Date.now()}`;

            cache.set(
                `music_results:${searchId}`,
                results,
                RESULT_CACHE_TTL
            );

            results[0]._searchId = searchId;

            await sendTrack(
                bot,
                chatId,
                results[0],
                results.length > 1
            );

        } catch (err) {
            console.error("Play command error:", err);

            await bot.sendMessage(
                chatId,
                `❌ ${err.message || "Something went wrong."}`
            );
        }
    });

    // ============================================================
    // MORE RESULTS
    // ============================================================

    bot.on("callback_query", async (query) => {

        const data = query.data || "";

        if (!data.startsWith("music_more:")) {
            return;
        }

        const chatId = query.message?.chat?.id;

        if (!chatId) {
            return;
        }

        const searchId = data.replace("music_more:", "");

        const results = cache.get(
            `music_results:${searchId}`
        );

        if (!results) {
            await bot.answerCallbackQuery(query.id, {
                text: "This search has expired. Run /play again."
            });

            return;
        }

        await bot.answerCallbackQuery(query.id);

        const buttons = results
            .slice(1, 6)
            .map((track, index) => [
                {
                    text:
                        `${track.title} — ${track.artist}`.slice(0, 60),
                    callback_data:
                        `music_pick:${searchId}:${index + 1}`
                }
            ]);

        await bot.sendMessage(
            chatId,
            "🔎 <b>σтнєя мαт¢нєѕ:</b>",
            {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: buttons
                }
            }
        );
    });

    // ============================================================
    // PICK RESULT
    // ============================================================

    bot.on("callback_query", async (query) => {

        const data = query.data || "";

        if (!data.startsWith("music_pick:")) {
            return;
        }

        const chatId = query.message?.chat?.id;

        if (!chatId) {
            return;
        }

        const parts = data.split(":");

        const searchId = parts[1];
        const index = Number(parts[2]);

        const results = cache.get(
            `music_results:${searchId}`
        );

        if (!results || !results[index]) {
            await bot.answerCallbackQuery(query.id, {
                text: "This search has expired. Run /play again."
            });

            return;
        }

        await bot.answerCallbackQuery(query.id);

        const track = results[index];

        track._searchId = searchId;

        await sendTrack(
            bot,
            chatId,
            track,
            false
        );
    });
}

module.exports = registerPlay;