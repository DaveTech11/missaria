require("dotenv").config();

const axios = require("axios");

const DEEPSEEK_API =
    "https://api.hcnsec.cn/v1/chat/completions";

const DEEPSEEK_MODEL =
    process.env.DEEPSEEK_MODEL || "DeepSeek-V4-Pro";

const DEEPSEEK_API_KEY =
    process.env.DEEPSEEK_API_KEY;

// ==========================================
// IMAGE ANALYSIS
// ==========================================

async function analyzeImage({
    image,
    prompt
}) {

    try {

        const mimeType = "image/webp";

        const base64 =
            image.toString("base64");

        const response =
            await axios.post(

                DEEPSEEK_API,

                {
                    model: DEEPSEEK_MODEL,

                    messages: [

                        {
                            role: "user",

                            content: [

                                {
                                    type: "text",
                                    text: prompt
                                },

                                {
                                    type: "image_url",

                                    image_url: {
                                        url:
                                            `data:${mimeType};base64,${base64}`
                                    }
                                }

                            ]
                        }

                    ],

                    temperature: 0.2,
                    max_tokens: 500
                },

                {
                    headers: {

                        Authorization:
                            `Bearer ${DEEPSEEK_API_KEY}`,

                        "Content-Type":
                            "application/json"

                    },

                    timeout: 60000
                }

            );

        return {
            text:
                response.data
                    ?.choices?.[0]
                    ?.message?.content || ""
        };

    } catch (error) {

        console.error(
            "\n========== DEEPSEEK IMAGE ERROR =========="
        );

        if (error.response) {

            console.error(
                "Status:",
                error.response.status
            );

            console.error(
                "Data:",
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

        } else {

            console.error(
                error.message
            );

        }

        console.error(
            "==========================================\n"
        );

        throw error;
    }
}


// ==========================================
// TEXT / CODE GENERATION
// ==========================================

async function generateText({
    prompt,
    system,
    maxTokens = 3000,
    model = DEEPSEEK_MODEL
}) {
    const messages = [];

    if (system) {
        messages.push({
            role: "system",
            content: String(system)
        });
    }

    messages.push({
        role: "user",
        content: String(prompt)
    });


    // =========================================================
    // DEEPSEEK — PRIMARY
    // =========================================================

    try {
        if (!DEEPSEEK_API_KEY) {
            throw new Error(
                "DEEPSEEK_API_KEY is missing"
            );
        }

        console.log("🔵 Trying DeepSeek...");

        const response = await axios.post(
            DEEPSEEK_API,
            {
                model,
                messages,
                temperature: 0.3,
                max_tokens: maxTokens
            },
            {
                headers: {
                    Authorization:
                        `Bearer ${DEEPSEEK_API_KEY}`,
                    "Content-Type":
                        "application/json"
                },
                timeout: 90000
            }
        );

        const text =
            response.data
                ?.choices?.[0]
                ?.message?.content;

        if (
            typeof text !== "string" ||
            !text.trim()
        ) {
            throw new Error(
                "DeepSeek returned empty text"
            );
        }

        console.log(
            "✅ DeepSeek response successful"
        );

        // IMPORTANT:
        // Return STRING, not { text: ... }
        return text;


    } catch (deepSeekError) {

        console.error(
            "\n========== DEEPSEEK FAILED =========="
        );

        if (deepSeekError.response) {
            console.error(
                "Status:",
                deepSeekError.response.status
            );

            console.error(
                "Data:",
                JSON.stringify(
                    deepSeekError.response.data,
                    null,
                    2
                )
            );
        } else {
            console.error(
                "Error:",
                deepSeekError.message
            );
        }

        console.error(
            "⚠️ Switching to Claude fallback..."
        );

        console.error(
            "====================================\n"
        );
    }


    // =========================================================
    // CLAUDE — FALLBACK
    // =========================================================

    try {
        console.log(
            "🔄 Calling Claude fallback..."
        );

        const claudePrompt = system
            ? `${String(system)}\n\n${String(prompt)}`
            : String(prompt);

        const response = await axios.get(
            "https://api-rebix.zone.id/api/claude-session",
            {
                params: {
                    q: claudePrompt
                },
                timeout: 90000
            }
        );

        let text =
            response.data?.response;

        // Handle object response
        if (
            text &&
            typeof text === "object"
        ) {
            text =
                text.text ??
                text.content ??
                text.message ??
                "";
        }

        // GUARANTEE STRING
        text = String(text ?? "");

        if (!text.trim()) {
            throw new Error(
                "Claude returned empty text"
            );
        }

        console.log(
            "✅ Claude fallback successful"
        );

        console.log(
            "Claude response type:",
            typeof text
        );

        // IMPORTANT:
        // Return STRING, not { text: text }
        return text;


    } catch (claudeError) {

        console.error(
            "\n========== CLAUDE FALLBACK FAILED =========="
        );

        if (claudeError.response) {
            console.error(
                "Status:",
                claudeError.response.status
            );

            console.error(
                "Data:",
                JSON.stringify(
                    claudeError.response.data,
                    null,
                    2
                )
            );
        } else {
            console.error(
                "Error:",
                claudeError.message
            );
        }

        console.error(
            "============================================\n"
        );

        throw new Error(
            "Both DeepSeek and Claude failed"
        );
    }
}
// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    analyzeImage,
    generateText
};
