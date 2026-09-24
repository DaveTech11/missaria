"use strict";

// Posts a video to a user's TikTok account via the Content Posting API
// (Direct Post, FILE_UPLOAD source). Docs: developers.tiktok.com —
// content-posting-api-get-started, content-posting-api-reference-direct-post.

const axios = require("axios");

const API_BASE = "https://open.tiktokapis.com/v2/post/publish";
const MIN_CHUNK = 5 * 1024 * 1024;   // TikTok's minimum chunk size
const MAX_CHUNK = 64 * 1024 * 1024;  // TikTok's maximum chunk size
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

function authHeaders(accessToken) {
    return {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8"
    };
}

async function queryCreatorInfo(accessToken) {
    const { data } = await axios.post(`${API_BASE}/creator_info/query/`, {}, {
        headers: authHeaders(accessToken),
        timeout: 20000
    });
    if (data.error && data.error.code !== "ok") {
        throw new Error(data.error.message || "creator_info/query failed");
    }
    return data.data; // { privacy_level_options, comment_disabled, duet_disabled, stitch_disabled, max_video_post_duration_sec, ... }
}

function pickPrivacyLevel(creatorInfo, requested) {
    const options = creatorInfo.privacy_level_options || [];
    if (requested && options.includes(requested)) return requested;
    if (options.includes("SELF_ONLY")) return "SELF_ONLY"; // safest default — matches the forced-private reality for unaudited apps anyway
    return options[0] || "SELF_ONLY";
}

function chunkPlanFor(size) {
    if (size <= MAX_CHUNK) {
        return { chunkSize: size, totalChunks: 1 };
    }
    const chunkSize = Math.min(MAX_CHUNK, Math.max(MIN_CHUNK, 10 * 1024 * 1024));
    const totalChunks = Math.ceil(size / chunkSize);
    return { chunkSize, totalChunks };
}

async function initVideoPublish(accessToken, { title, privacyLevel, videoSize, chunkSize, totalChunks, disableComment }) {
    const body = {
        post_info: {
            title: title || "",
            privacy_level: privacyLevel,
            disable_comment: Boolean(disableComment),
            disable_duet: false,
            disable_stitch: false
        },
        source_info: {
            source: "FILE_UPLOAD",
            video_size: videoSize,
            chunk_size: chunkSize,
            total_chunk_count: totalChunks
        }
    };
    const { data } = await axios.post(`${API_BASE}/video/init/`, body, {
        headers: authHeaders(accessToken),
        timeout: 20000
    });
    if (data.error && data.error.code !== "ok") {
        throw new Error(data.error.message || "video/init failed");
    }
    return data.data; // { publish_id, upload_url }
}

async function uploadChunks(uploadUrl, videoBuffer, chunkSize, totalChunks) {
    const size = videoBuffer.length;
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, size) - 1;
        const chunk = videoBuffer.subarray(start, end + 1);

        await axios.put(uploadUrl, chunk, {
            headers: {
                "Content-Type": "video/mp4",
                "Content-Range": `bytes ${start}-${end}/${size}`,
                "Content-Length": String(chunk.length)
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 120000
        });
    }
}

async function pollStatus(accessToken, publishId) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        const { data } = await axios.post(`${API_BASE}/status/fetch/`, { publish_id: publishId }, {
            headers: authHeaders(accessToken),
            timeout: 20000
        });
        const status = data?.data?.status;
        if (status === "PUBLISH_COMPLETE") return { success: true, status };
        if (status === "FAILED") return { success: false, status, reason: data?.data?.fail_reason };
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    return { success: false, status: "TIMEOUT", reason: "TikTok didn't finish processing in time — check the TikTok app directly, it may still complete." };
}

/**
 * Full publish flow for one video buffer.
 * @returns {Promise<{success:boolean, publishId?:string, privacyLevel?:string, error?:string}>}
 */
async function postVideo(accessToken, videoBuffer, { title, requestedPrivacyLevel } = {}) {
    const creatorInfo = await queryCreatorInfo(accessToken);
    const privacyLevel = pickPrivacyLevel(creatorInfo, requestedPrivacyLevel);
    const { chunkSize, totalChunks } = chunkPlanFor(videoBuffer.length);

    const init = await initVideoPublish(accessToken, {
        title,
        privacyLevel,
        videoSize: videoBuffer.length,
        chunkSize,
        totalChunks,
        disableComment: Boolean(creatorInfo.comment_disabled)
    });

    await uploadChunks(init.upload_url, videoBuffer, chunkSize, totalChunks);

    const result = await pollStatus(accessToken, init.publish_id);
    if (!result.success) {
        return { success: false, publishId: init.publish_id, error: result.reason || result.status };
    }
    return { success: true, publishId: init.publish_id, privacyLevel };
}

module.exports = { postVideo };
