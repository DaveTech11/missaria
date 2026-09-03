const axios = require("axios");

const API_URL = "https://api.tavily.com/search";
const API_KEY = process.env.TAVILY_API_KEY;

async function webSearch(query, options = {}) {
    try {
        const {
            topic = "general",
            searchDepth = "advanced",
            maxResults = 5,
            includeAnswer = true,
            includeImages = true,
            includeRawContent = false
        } = options;

        const { data } = await axios.post(
            API_URL,
            {
                api_key: API_KEY,
                query,
                topic,
                search_depth: searchDepth,
                max_results: maxResults,
                include_answer: includeAnswer,
                include_images: includeImages,
                include_raw_content: includeRawContent
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        return {
            success: true,
            query,
            answer: data.answer || "",
            images: data.images || [],
            results: (data.results || []).map(result => ({
                title: result.title,
                url: result.url,
                content: result.content,
                score: result.score
            }))
        };

    } catch (error) {

        console.error("🌐 Web Search Error");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        return {
            success: false,
            query,
            answer: "",
            images: [],
            results: []
        };
    }
}

module.exports = webSearch;