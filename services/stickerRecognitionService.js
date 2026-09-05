const aiService = require("./aiService");
const axios = require("axios");

async function analyzeSticker({
    bot,
    stickerFileId,
    userId
}) {

    // Get the fully-formed file URL directly from the bot instance
    // (uses the same token the bot was constructed with — no env var mismatch possible)
    const stickerUrl = await bot.getFileLink(stickerFileId);

    // Download sticker
    const image = await axios.get(stickerUrl, {
        responseType: "arraybuffer"
    });

    const buffer = Buffer.from(image.data);

    // Send to AI vision
    const result = await aiService.analyzeImage({
        userId,
        image: buffer,
        prompt: `
        Analyze this Telegram sticker.

        Tell me:
        - What is happening in the sticker
        - Emotion/reaction
        - Meme meaning
        - Whether it contains unsafe content
        `
    });

    return result;
}

module.exports = {
    analyzeSticker
};