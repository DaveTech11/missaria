const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

function run(cmd, args) {
    return new Promise((resolve, reject) => {
        execFile(cmd, args, (err, stdout, stderr) => {
            if (err) return reject(new Error(stderr ? stderr.toString() : err.message));
            resolve(stdout);
        });
    });
}

/** Returns the duration (in seconds) of an audio buffer via ffprobe, or null if it can't be read. */
async function getAudioDurationSeconds(buffer) {
    const tmpPath = path.join(os.tmpdir(), `dur-check-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`);
    fs.writeFileSync(tmpPath, buffer);
    try {
        const out = await run("ffprobe", [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            tmpPath
        ]);
        const seconds = parseFloat(out.trim());
        return Number.isFinite(seconds) ? seconds : null;
    } catch {
        return null;
    } finally {
        fs.unlink(tmpPath, () => {});
    }
}

module.exports = { getAudioDurationSeconds };
