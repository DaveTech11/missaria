// ============================================================
// Talking avatar → Telegram video note
// services/talkingAvatar.js
//
// NOT real lip-sync (that needs a paid API — see README notes).
// This produces a short mouth-flap loop timed to the length of a
// TTS audio clip, giving the illusion of talking. Fully free —
// only needs ffmpeg on the host.
// ============================================================

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const ASSETS_DIR = path.join(__dirname, "..", "assets", "avatar");
const MOUTH_CLOSED = path.join(ASSETS_DIR, "mouth_closed.png");
const MOUTH_OPEN = path.join(ASSETS_DIR, "mouth_open.png");
const TMP_ROOT = path.join(os.tmpdir(), "novagpt-talking-avatar");

const MAX_DURATION_SECONDS = 59; // Telegram video_note practical cap

function run(cmd, args) {
    return new Promise((resolve, reject) => {
        execFile(cmd, args, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr ? stderr.toString() : err.message));
            resolve(stdout);
        });
    });
}

/**
 * @param {Buffer} audioBuffer  raw audio bytes returned by the TTS API
 * @param {string} audioExt     extension matching that audio's real format, e.g. "mp3" or "ogg"
 * @returns {Promise<{ outputPath: string, cleanup: () => void }>}
 */
async function generateTalkingVideoNote(audioBuffer, audioExt = "mp3") {
    if (!fs.existsSync(MOUTH_CLOSED)) {
        throw new Error(`Missing: ${MOUTH_CLOSED}`);
    }

    if (!fs.existsSync(MOUTH_OPEN)) {
        throw new Error(`Missing: ${MOUTH_OPEN}`);
    }

    const workDir = path.join(
        TMP_ROOT,
        `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );

    fs.mkdirSync(workDir, { recursive: true });

    const audioPath = path.join(workDir, `audio.${audioExt}`);
    const framesList = path.join(workDir, "frames.txt");
    const loopPath = path.join(workDir, "loop.mp4");
    const outputPath = path.join(workDir, "output.mp4");

    fs.writeFileSync(audioPath, audioBuffer);

    // Talking animation:
    // closed → open → closed → open → closed
    const frameDuration = 0.15;

    fs.writeFileSync(
        framesList,
        [
            `file '${MOUTH_CLOSED}'`,
            `duration ${frameDuration}`,

            `file '${MOUTH_OPEN}'`,
            `duration ${frameDuration}`,

            `file '${MOUTH_CLOSED}'`,
            `duration ${frameDuration}`,

            `file '${MOUTH_OPEN}'`,
            `duration ${frameDuration}`,

            `file '${MOUTH_CLOSED}'`
        ].join("\n")
    );

    try {
        // Create the repeating mouth animation
        await run("ffmpeg", [
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", framesList,

            "-vf", "fps=12,format=yuv420p",

            "-an",
            loopPath
        ]);

        // Combine animation + TTS audio
        await run("ffmpeg", [
            "-y",

            "-stream_loop", "-1",
            "-i", loopPath,

            "-i", audioPath,

            "-vf",
            "scale=384:384:force_original_aspect_ratio=decrease," +
            "pad=384:384:(ow-iw)/2:(oh-ih)/2," +
            "format=yuv420p",

            "-c:v", "libx264",
            "-preset", "veryfast",
            "-profile:v", "baseline",

            "-c:a", "aac",
            "-b:a", "96k",

            "-t", String(MAX_DURATION_SECONDS),

            "-shortest",
            "-movflags", "+faststart",

            outputPath
        ]);

    } catch (err) {
        fs.rmSync(workDir, {
            recursive: true,
            force: true
        });

        throw err;
    }

    return {
        outputPath,

        cleanup: () => {
            fs.rm(
                workDir,
                {
                    recursive: true,
                    force: true
                },
                () => {}
            );
        }
    };
}

module.exports = { generateTalkingVideoNote };
