const axios = require("axios");

const API_URL = "https://api.deepseek.com/v1/chat/completions";
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

/**
 * Send a request to DeepSeek
 * @param {Object} options
 * @param {string} options.system - System prompt
 * @param {string} options.prompt - User prompt
 * @param {number} options.temperature
 * @param {number} options.maxTokens
 */

async function askDeepSeek({
    system = "You are Miss Aria, a helpful AI assistant.",
    prompt,
    temperature = 0.7,
    maxTokens = 4096
}) {
    try {

        const { data } = await axios.post(
            API_URL,
            {
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: system
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature,
                max_tokens: maxTokens,
                stream: false
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 60000
            }
        );

        return {
            success: true,
            message: data.choices?.[0]?.message?.content || "No response.",
            usage: data.usage || {}
        };

    } catch (error) {

        console.error("❌ DeepSeek Error");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        return {
            success: false,
            message: "Sorry, I couldn't process your request."
        };
    }
}

module.exports = askDeepSeek;