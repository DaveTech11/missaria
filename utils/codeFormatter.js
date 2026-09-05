function escapeHTML(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatAIResponse(mode, aiResponse) {

    const titles = {
        debug: "🐞 ᴅᴇʙᴜɢ",
        generate: "💻 ᴄᴏᴅᴇ ɢᴇɴᴇʀᴀᴛᴏʀ",
        explain: "📖 ᴇxᴘʟᴀɪɴ ᴄᴏᴅᴇ",
        optimize: "⚡ ᴏᴘᴛɪᴍɪᴢᴇ",
        tests: "🧪 ᴛᴇsᴛ ɢᴇɴᴇʀᴀᴛᴏʀ",
        convert: "🔄 ᴄᴏɴᴠᴇʀᴛ",
        docs: "📄 ᴅᴏᴄᴜᴍᴇɴᴛ"
    };

    return `
👩‍💻 <b>ᴍɪss ᴀʀɪᴀ • ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ</b>

━━━━━━━━━━━━━━━━━━

<b>${titles[mode] || "💻 ᴄᴏᴅᴇ"}</b>

━━━━━━━━━━━━━━━━━━

${escapeHTML(aiResponse)}

━━━━━━━━━━━━━━━━━━

🌸 <i>ɴᴇᴇᴅ ᴍᴏʀᴇ ʜᴇʟᴘ? sᴇɴᴅ ᴀɴᴏᴛʜᴇʀ ғɪʟᴇ ᴏʀ ᴀsᴋ ᴀ ɴᴇᴡ ǫᴜᴇsᴛɪᴏɴ.</i>
`.trim();
}

module.exports = {
    formatAIResponse,
    escapeHTML
};