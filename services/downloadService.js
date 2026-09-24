// ============================================================
// downloadService.js
// Builds downloadable archives (.tar.gz) of bot data, and saves
// incoming media (documents/videos/audio/voice) into categorized
// folders so they can be exported later.
//
// Uses the system `tar` binary (present on virtually every Linux
// host, including Replit/Railway/VPS) instead of adding an extra
// npm dependency.
// ============================================================

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const DATA_DIR = path.join(__dirname, "..", "data");
const EXPORT_DIR = path.join(DATA_DIR, "exports");
const CATEGORY_DIRS = {
    photos: path.join(DATA_DIR, "photos"),
    videos: path.join(DATA_DIR, "videos"),
    documents: path.join(DATA_DIR, "documents"),
    audio: path.join(DATA_DIR, "audio"),
    voice: path.join(DATA_DIR, "voice"),
    animations: path.join(DATA_DIR, "animations"),
    gamesaves: path.join(DATA_DIR, "gameSaves")
};

for (const dir of [EXPORT_DIR, ...Object.values(CATEGORY_DIRS)]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ------------------------------------------------------------
// Category list shown in the /download menu
// ------------------------------------------------------------
function listCategories() {
    return [
        { id: "photos", label: "🖼️ Photos", dir: CATEGORY_DIRS.photos },
        { id: "videos", label: "🎥 Videos", dir: CATEGORY_DIRS.videos },
        { id: "documents", label: "📄 Documents", dir: CATEGORY_DIRS.documents },
        { id: "audio", label: "🎵 Audio", dir: CATEGORY_DIRS.audio },
        { id: "voice", label: "🎙️ Voice notes", dir: CATEGORY_DIRS.voice },
        { id: "animations", label: "🎞️ GIFs/Stickers", dir: CATEGORY_DIRS.animations },
        { id: "gamesaves", label: "💾 Game saves", dir: CATEGORY_DIRS.gamesaves },
        { id: "full", label: "📦 Full data backup", dir: DATA_DIR }
    ];
}

function countFiles(dir) {
    try {
        return fs.readdirSync(dir).filter(f => {
            try { return fs.statSync(path.join(dir, f)).isFile(); } catch { return false; }
        }).length;
    } catch {
        return 0;
    }
}

// ------------------------------------------------------------
// Save an incoming Telegram file into a category folder.
// fileBuffer: Buffer, category: one of CATEGORY_DIRS keys
// ------------------------------------------------------------
function saveMedia(category, fileName, buffer) {
    const dir = CATEGORY_DIRS[category];
    if (!dir) throw new Error(`Unknown category: ${category}`);

    const safeName = `${Date.now()}_${fileName}`.replace(/[^\w.\-]/g, "_");
    const fullPath = path.join(dir, safeName);
    fs.writeFileSync(fullPath, buffer);
    return fullPath;
}

// ------------------------------------------------------------
// Build a .tar.gz of a category (or the whole data dir) and
// return its path. Resolves once tar finishes.
// ------------------------------------------------------------
function buildArchive(categoryId) {
    return new Promise((resolve, reject) => {

        const categories = listCategories();
        const cat = categories.find(c => c.id === categoryId);
        if (!cat) return reject(new Error("Unknown category"));

        if (!fs.existsSync(cat.dir) || countFiles(cat.dir) === 0) {
            // still allow full backup even if a subfolder is empty
            if (categoryId !== "full") {
                return reject(new Error("No files saved in this category yet."));
            }
        }

        const outFile = path.join(
            EXPORT_DIR,
            `${categoryId}_${Date.now()}.tar.gz`
        );

        const cwd = path.dirname(cat.dir);
        const target = path.basename(cat.dir);

        execFile(
            "tar",
            ["-czf", outFile, "-C", cwd, target],
            { maxBuffer: 1024 * 1024 * 50 },
            (err) => {
                if (err) return reject(err);
                resolve(outFile);
            }
        );
    });
}

module.exports = {
    listCategories,
    countFiles,
    saveMedia,
    buildArchive,
    CATEGORY_DIRS
};
