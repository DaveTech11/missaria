const axios = require("axios");

async function downloadTelegramFile(ctx, fileId) {
    try {
        const file = await ctx.telegram.getFile(fileId);

        const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

        const response = await axios.get(url, {
            responseType: "text",
            timeout: 60000
        });

        return {
            success: true,
            fileName: file.file_path.split("/").pop(),
            content: response.data
        };

    } catch (err) {
        console.error("Telegram File Error:", err.message);

        return {
            success: false,
            message: err.message
        };
    }
}

module.exports = downloadTelegramFile;