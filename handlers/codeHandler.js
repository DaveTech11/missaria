const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");

const codeState = require("../memory/codeState");
const askDeepSeek = require("../services/deepseek");
const extractZip = require("./zipExtractor");
const { scanProject, buildPrompt } = require("./projectScanner");
const { formatAIResponse } = require("../utils/codeFormatter");

const debuggingPrompt = require("../prompts/debuggingPrompt");
const codingPrompt = require("../prompts/codingPrompt");
const explainPrompt = require("../prompts/explainPrompt");
const optimizePrompt = require("../prompts/optimizePrompt");
const testsPrompt = require("../prompts/testsPrompt");
const convertPrompt = require("../prompts/convertPrompt");
const docsPrompt = require("../prompts/docsPrompt");

const SYSTEM_PROMPTS = {
    debug: debuggingPrompt,
    generate: codingPrompt,
    explain: explainPrompt,
    optimize: optimizePrompt,
    tests: testsPrompt,
    convert: convertPrompt,
    docs: docsPrompt
};

const TMP_ROOT = path.join(os.tmpdir(), "novagpt-code-studio");
const MAX_PROMPT_CHARS = 60000; // keep well under DeepSeek's context + Telegram limits

function chunkText(text, size = 3800) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

async function sendAIResult(bot, chatId, mode, aiText) {
    const formatted = formatAIResponse(mode, aiText);
    const chunks = chunkText(formatted);
    for (const chunk of chunks) {
        await bot.sendMessage(chatId, chunk, { parse_mode: "HTML" });
    }
}

async function downloadTelegramDocument(bot, fileId, destPath) {
    const link = await bot.getFileLink(fileId);
    const response = await axios.get(link, { responseType: "arraybuffer", timeout: 60000 });
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, response.data);
    return destPath;
}

module.exports = (bot) => {

    // ------------------------------------------------------------
    // /code menu buttons — sets which mode the user is in
    // ------------------------------------------------------------
    bot.on("callback_query", async (query) => {

        const chatId = query.message.chat.id;
        const userId = query.from.id;
        const data = query.data;
        const mode = data.startsWith("code_") ? data.replace("code_", "") : null;

        if (!mode || !SYSTEM_PROMPTS[mode]) return;

        await bot.answerCallbackQuery(query.id);

        switch (data) {

            case "code_debug":
                codeState.set(userId, { mode: "debug" });
                return bot.sendMessage(chatId, `
🐞 <b>ᴅᴇʙᴜɢ ᴍᴏᴅᴇ ᴇɴᴀʙʟᴇᴅ</b>

━━━━━━━━━━━━━━━━━━

📂 Send any source code file.

<b>Supported</b>

• .js
• .ts
• .py
• .java
• .cpp
• .c
• .cs
• .php
• .go
• .rs
• .html
• .css
• .json
• .zip

Or simply paste your code.

✨ I'll analyze it and fix any issues I find.
`, { parse_mode: "HTML" });

            case "code_generate":
                codeState.set(userId, { mode: "generate" });
                return bot.sendMessage(chatId, `
💻 <b>ᴄᴏᴅᴇ ɢᴇɴᴇʀᴀᴛᴏʀ</b>

Describe what you want me to build.

Examples

• Telegram Bot

• Express API

• Portfolio Website

• Discord Bot

• AI Chatbot
`, { parse_mode: "HTML" });

            case "code_explain":
                codeState.set(userId, { mode: "explain" });
                return bot.sendMessage(chatId, `
📖 <b>ᴄᴏᴅᴇ ᴇxᴘʟᴀɪɴᴇʀ</b>

Upload your file or paste your code.

I'll explain it line by line.
`, { parse_mode: "HTML" });

            case "code_optimize":
                codeState.set(userId, { mode: "optimize" });
                return bot.sendMessage(chatId, `
⚡ <b>ᴏᴘᴛɪᴍɪᴢᴇ ᴄᴏᴅᴇ</b>

Send your project or source code.

I'll improve:

🚀 Performance

🛡 Security

🧹 Readability

📦 Structure
`, { parse_mode: "HTML" });

            case "code_tests":
                codeState.set(userId, { mode: "tests" });
                return bot.sendMessage(chatId, `
🧪 <b>ᴛᴇsᴛ ɢᴇɴᴇʀᴀᴛᴏʀ</b>

Upload your project.

I'll generate professional test cases.
`, { parse_mode: "HTML" });

            case "code_convert":
                codeState.set(userId, { mode: "convert" });
                return bot.sendMessage(chatId, `
🔄 <b>ᴄᴏᴅᴇ ᴄᴏɴᴠᴇʀᴛᴇʀ</b>

Send your source code, and tell me the target language
(e.g. "convert to Python").

Example

JavaScript → Python

Python → Java

C++ → Rust
`, { parse_mode: "HTML" });

            case "code_docs":
                codeState.set(userId, { mode: "docs" });
                return bot.sendMessage(chatId, `
📄 <b>ᴅᴏᴄᴜᴍᴇɴᴛᴀᴛɪᴏɴ</b>

Upload your project.

I'll generate:

• README.md

• API Documentation

• Installation Guide

• Code Comments
`, { parse_mode: "HTML" });

        }

    });

    // ------------------------------------------------------------
    // Uploaded file (single file or .zip project) while in a mode
    // ------------------------------------------------------------
    bot.on("document", async (msg) => {

        const userId = msg.from.id;
        const chatId = msg.chat.id;
        const state = codeState.get(userId);

        if (!state || !state.mode) return; // not in /code flow — ignore
        if (state.mode === "generate") return; // generate mode expects a text description, not a file

        const fileName = msg.document.file_name || "file";
        const ext = path.extname(fileName).toLowerCase();
        const workDir = path.join(TMP_ROOT, String(userId), String(Date.now()));

        await bot.sendChatAction(chatId, "typing");

        try {
            const localPath = path.join(workDir, fileName);
            await downloadTelegramDocument(bot, msg.document.file_id, localPath);

            let codeContent;

            if (ext === ".zip") {
                const extractDir = path.join(workDir, "extracted");
                const result = await extractZip(localPath, extractDir);

                if (!result.success) {
                    await bot.sendMessage(chatId, `⚠️ Couldn't extract that zip: ${result.message}`);
                    return;
                }

                const files = scanProject(result.path);

                if (!files.length) {
                    await bot.sendMessage(chatId, "⚠️ No supported source files found in that zip.");
                    return;
                }

                codeContent = buildPrompt(files, result.path);
            } else {
                codeContent = fs.readFileSync(localPath, "utf8");
            }

            if (codeContent.length > MAX_PROMPT_CHARS) {
                codeContent = codeContent.slice(0, MAX_PROMPT_CHARS) + "\n\n... (truncated — file/project too large)";
            }

            const system = SYSTEM_PROMPTS[state.mode] || debuggingPrompt;
            const prompt =
                state.mode === "convert"
                    ? `Convert this code as requested. If no target language was specified, ask which language to convert to:\n\n${codeContent}`
                    : codeContent;

            const result = await askDeepSeek({ system, prompt, maxTokens: 4000 });

            if (!result.success) {
                await bot.sendMessage(chatId, "⚠️ I couldn't process that file right now. Please try again in a moment.");
                return;
            }

            await sendAIResult(bot, chatId, state.mode, result.message);

        } catch (err) {
            console.error("codeHandler document error:", err.message);
            await bot.sendMessage(chatId, "⚠️ Something went wrong reading that file.");
        } finally {
            fs.rm(workDir, { recursive: true, force: true }, () => {});
        }

    });

    // ------------------------------------------------------------
    // Pasted code / generation description as plain text
    // ------------------------------------------------------------
    bot.on("message", async (msg) => {

        if (!msg.text || msg.text.startsWith("/")) return;

        const userId = msg.from.id;
        const chatId = msg.chat.id;
        const state = codeState.get(userId);

        if (!state || !state.mode) return; // not in /code flow — ignore, let other handlers process it

        await bot.sendChatAction(chatId, "typing");

        try {
            const system = SYSTEM_PROMPTS[state.mode] || debuggingPrompt;
            const result = await askDeepSeek({ system, prompt: msg.text, maxTokens: 4000 });

            if (!result.success) {
                await bot.sendMessage(chatId, "⚠️ I couldn't process that right now. Please try again in a moment.");
                return;
            }

            await sendAIResult(bot, chatId, state.mode, result.message);

        } catch (err) {
            console.error("codeHandler text error:", err.message);
            await bot.sendMessage(chatId, "⚠️ Something went wrong processing that.");
        }

    });

};
