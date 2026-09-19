const axios = require("axios");

const API_URL = "https://api-rebix.vercel.app/api/claude-haiku";

/**
 * Coding-only LLM adapter for Miss Aria.
 * The Rebix Claude Haiku endpoint accepts the prompt through ?q=...
 * and returns the generated text in { response: "..." }.
 */
async function askClaudeHaiku({
    system = "You are Miss Aria, a helpful AI coding assistant.",
    prompt = "",
    maxTokens = 4096
} = {}) {
    try {
        // Keep the instruction and user content together because this endpoint
        // exposes a single q parameter rather than a chat-completions body.
        const q = `${system}\n\nUSER REQUEST:\n${String(prompt)}`;

        const { data } = await axios.get(API_URL, {
            params: { q },
            timeout: 120000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const message =
            typeof data?.response === "string"
                ? data.response
                : typeof data?.message === "string"
                    ? data.message
                    : "";

        if (!message) {
            return {
                success: false,
                message: "The Claude Haiku coding API returned an empty response."
            };
        }

        return {
            success: true,
            message,
            usage: data?.usage || {}
        };
    } catch (error) {
        console.error("❌ Claude Haiku Coding API Error");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        return {
            success: false,
            message: "Sorry, I couldn't process your coding request right now."
        };
    }
}

module.exports = askClaudeHaiku;
