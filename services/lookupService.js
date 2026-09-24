// ============================================================
// lookupService.js
// Translate, lyrics, song lookup, gif/meme/clip search, and a
// rough Telegram account-age estimate.
// ============================================================

const axios = require("axios");
const { generateText } = require("./aiService");

// ------------------------------------------------------------
// Translate
// ------------------------------------------------------------
async function translate(text, targetLang) {
    const lang = targetLang || "English";
    const { text: out } = await generateText({
        prompt: text,
        system: `Translate the user's message to ${lang}. Reply with ONLY the translation, nothing else — no notes, no quotes.`,
        maxTokens: 500
    });
    return out.trim();
}

// ------------------------------------------------------------
// Song search (iTunes Search API — free, no key required)
// ------------------------------------------------------------
async function findSong(query) {
    const res = await axios.get("https://itunes.apple.com/search", {
        params: { term: query, media: "music", limit: 1 }
    });
    const hit = res.data.results && res.data.results[0];
    if (!hit) return null;
    return {
        title: hit.trackName,
        artist: hit.artistName,
        album: hit.collectionName,
        artwork: hit.artworkUrl100 ? hit.artworkUrl100.replace("100x100", "512x512") : null,
        preview: hit.previewUrl,
        url: hit.trackViewUrl
    };
}

// ------------------------------------------------------------
// Lyrics (lyrics.ovh — free, no key, but needs artist+title,
// so we resolve the song via iTunes first if given free text)
// ------------------------------------------------------------
async function findLyrics(query) {
    const song = await findSong(query);
    if (!song) return null;

    try {
        const res = await axios.get(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist)}/${encodeURIComponent(song.title)}`
        );
        return {
            title: song.title,
            artist: song.artist,
            lyrics: res.data.lyrics ? res.data.lyrics.trim() : null
        };
    } catch (err) {
        return { title: song.title, artist: song.artist, lyrics: null };
    }
}

// ------------------------------------------------------------
// Gif / meme / clip search via Tenor
// Requires TENOR_API_KEY in .env — throws a clear error if missing
// so the bot can tell the user instead of failing silently.
// ------------------------------------------------------------
async function tenorSearch(query, { limit = 1, mediaFilter = "gif" } = {}) {
    const key = process.env.TENOR_API_KEY;
    if (!key) {
        throw new Error("TENOR_API_KEY isn't set in .env — gif/meme/clip search needs a free Tenor API key.");
    }
    const res = await axios.get("https://tenor.googleapis.com/v2/search", {
        params: { q: query, key, limit, media_filter: mediaFilter, contentfilter: "medium" }
    });
    const results = res.data.results || [];
    return results.map((r) => ({
        url: r.media_formats?.gif?.url || r.media_formats?.mp4?.url,
        title: r.content_description
    }));
}

async function findGif(query) {
    const [hit] = await tenorSearch(query, { mediaFilter: "gif" });
    return hit || null;
}

async function findMeme(query) {
    // Tenor doesn't distinguish "meme" as a media type — search with the
    // word appended, which is the common workaround.
    const [hit] = await tenorSearch(`${query} meme`, { mediaFilter: "gif" });
    return hit || null;
}

async function findClip(query) {
    const [hit] = await tenorSearch(query, { mediaFilter: "mp4" });
    return hit || null;
}

// ------------------------------------------------------------
// Rough Telegram account age estimate.
// Telegram user IDs are roughly sequential over time, but there's
// no official public mapping — this uses a small set of known
// approximate ID/date checkpoints and interpolates linearly.
// It's a ballpark, not a fact, and is presented that way.
// ------------------------------------------------------------
const ID_CHECKPOINTS = [
    { id: 100000000, date: "2013-08-01" },
    { id: 500000000, date: "2016-06-01" },
    { id: 1000000000, date: "2018-08-01" },
    { id: 1500000000, date: "2020-04-01" },
    { id: 2000000000, date: "2021-11-01" },
    { id: 3000000000, date: "2022-09-01" },
    { id: 5000000000, date: "2023-08-01" },
    { id: 7000000000, date: "2024-11-01" },
    { id: 8000000000, date: "2025-11-01" }
];

function estimateAccountAge(userId) {
    const id = Number(userId);
    let lower = ID_CHECKPOINTS[0];
    let upper = ID_CHECKPOINTS[ID_CHECKPOINTS.length - 1];

    for (let i = 0; i < ID_CHECKPOINTS.length - 1; i++) {
        if (id >= ID_CHECKPOINTS[i].id && id <= ID_CHECKPOINTS[i + 1].id) {
            lower = ID_CHECKPOINTS[i];
            upper = ID_CHECKPOINTS[i + 1];
            break;
        }
    }

    const lowerTime = new Date(lower.date).getTime();
    const upperTime = new Date(upper.date).getTime();
    const ratio = upper.id === lower.id ? 0 : (id - lower.id) / (upper.id - lower.id);
    const estTime = lowerTime + ratio * (upperTime - lowerTime);
    const estDate = new Date(estTime);

    return {
        estimatedDate: estDate.toISOString().slice(0, 10),
        note: "Rough estimate based on ID position, not an official value."
    };
}

module.exports = {
    translate,
    findSong,
    findLyrics,
    findGif,
    findMeme,
    findClip,
    estimateAccountAge
};
