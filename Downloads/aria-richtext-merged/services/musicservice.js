const ytSearch = require("yt-search");

/**
 * Search for music tracks.
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function searchTrack(query, limit = 5) {
    if (!query || typeof query !== "string") {
        throw new Error("Search query is required.");
    }

    const results = await ytSearch(query);

    if (!results || !results.videos) {
        return [];
    }

    return results.videos
        .slice(0, limit)
        .map((video) => ({
            title: video.title,
            artist: video.author?.name || "Unknown Artist",
            album: "Unknown",
            releaseDate: "Unknown",
            duration: video.timestamp || "Unknown",
            genre: null,
            explicit: false,

            // YouTube thumbnail
            artworkUrl: video.thumbnail,

            // We are not using a ripped/full audio URL.
            previewUrl: null,

            links: {
                youtubeMusic: video.url,
                youtube: video.url,
                spotify: `https://open.spotify.com/search/${encodeURIComponent(
                    `${video.title} ${video.author?.name || ""}`
                )}`,
                appleMusic: `https://music.apple.com/search?term=${encodeURIComponent(
                    `${video.title} ${video.author?.name || ""}`
                )}`,
            },

            // Useful if your play command wants it
            youtubeId: video.videoId,
        }));
}

module.exports = {
    searchTrack,
};