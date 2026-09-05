function formatSearchResult(query, result) {
    let text = `
🌐 <b>ᴍɪss ᴀʀɪᴀ • ᴡᴇʙ sᴇᴀʀᴄʜ</b>

━━━━━━━━━━━━━━━━━━

🔎 <b>Qᴜᴇsᴛɪᴏɴ</b>

${escapeHTML(query)}

━━━━━━━━━━━━━━━━━━

✨ <b>Aɴsᴡᴇʀ</b>

${escapeHTML(result.answer || "ɴᴏ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ғᴏᴜɴᴅ.")}
`;

    if (result.results?.length) {
        text += `

━━━━━━━━━━━━━━━━━━

📚 <b>Sᴏᴜʀᴄᴇs</b>
`;

        result.results.slice(0, 5).forEach((r, i) => {
            text += `

${i + 1}. <a href="${r.url}">${escapeHTML(r.title)}</a>`;
        });
    }

    text += `

━━━━━━━━━━━━━━━━━━

💬 <i>ᴀsᴋ ᴀɴᴏᴛʜᴇʀ ǫᴜᴇsᴛɪᴏɴ ᴀɴʏᴛɪᴍᴇ 🌸</i>`;

    return text.trim();
}

function escapeHTML(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

module.exports = {
    formatSearchResult,
    escapeHTML
};