const AdmZip = require("adm-zip");

// language/info-string -> file extension, for naming extracted blocks that
// don't carry an explicit filename hint.
const EXT_BY_LANG = {
    javascript: "js", js: "js", jsx: "jsx", typescript: "ts", ts: "ts", tsx: "tsx",
    python: "py", py: "py", java: "java", "c++": "cpp", cpp: "cpp", c: "c",
    "c#": "cs", csharp: "cs", php: "php", go: "go", golang: "go", rust: "rs", rs: "rs",
    html: "html", css: "css", json: "json", yml: "yml", yaml: "yaml",
    sql: "sql", sh: "sh", bash: "sh", shell: "sh", ruby: "rb", kotlin: "kt", swift: "swift"
};

// Matches a fenced code block: ```lang\n...content...\n```
// Also captures a short window of text right before the fence, so we can
// pull a filename out of a heading/comment like "### fixed: app.js" or
// "**File: routes/api.js**" if the model included one.
const FENCE_RE = /```([a-zA-Z0-9+#._-]*)\r?\n([\s\S]*?)```/g;
const FILENAME_HINT_RE = /(?:file(?:name)?|path)\s*[:\-]?\s*[`"']?([\w./\\-]+\.[a-zA-Z0-9]{1,10})[`"']?/i;

/**
 * Pull every fenced code block out of a markdown-ish AI response.
 * Returns [] if the response has no fences at all (e.g. pure prose/explanation).
 */
function extractCodeBlocks(markdown) {
    if (!markdown) return [];

    const blocks = [];
    let match;
    let lastIndex = 0;

    FENCE_RE.lastIndex = 0;
    while ((match = FENCE_RE.exec(markdown)) !== null) {
        const lang = (match[1] || "").toLowerCase();
        const content = match[2].replace(/\s+$/, "");
        if (!content.trim()) { lastIndex = FENCE_RE.lastIndex; continue; }

        // Look at the text between the previous block and this one for a filename hint.
        const precedingText = markdown.slice(lastIndex, match.index).slice(-200);
        const hintMatch = precedingText.match(FILENAME_HINT_RE);

        blocks.push({
            lang,
            content,
            filenameHint: hintMatch ? hintMatch[1].replace(/\\/g, "/") : null
        });

        lastIndex = FENCE_RE.lastIndex;
    }

    return blocks;
}

function extensionFor(lang) {
    return EXT_BY_LANG[lang] || (lang && /^[a-z0-9]{1,6}$/.test(lang) ? lang : "txt");
}

function sanitizeName(name) {
    return name.replace(/^\/+/, "").replace(/\.\.+/g, ".").replace(/[^\w./-]/g, "_");
}

/**
 * Turn extracted code blocks into a flat list of { name, content } files
 * ready to zip, picking a sensible filename for each.
 *
 * @param {Array} blocks         result of extractCodeBlocks()
 * @param {string} originalName  the filename the user uploaded, if any
 */
function nameCodeBlocks(blocks, originalName) {
    const used = new Set();

    function unique(candidate) {
        let name = sanitizeName(candidate);
        let i = 2;
        while (used.has(name)) {
            const dot = name.lastIndexOf(".");
            name = dot > -1 ? `${name.slice(0, dot)}_${i}${name.slice(dot)}` : `${name}_${i}`;
            i++;
        }
        used.add(name);
        return name;
    }

    // Single block + we know the original filename -> just reuse it.
    if (blocks.length === 1 && originalName && !blocks[0].filenameHint) {
        return [{ name: unique(originalName), content: blocks[0].content }];
    }

    return blocks.map((b, i) => {
        if (b.filenameHint) return { name: unique(b.filenameHint), content: b.content };
        const base = originalName && blocks.length === 1
            ? originalName
            : `file_${i + 1}.${extensionFor(b.lang)}`;
        return { name: unique(base), content: b.content };
    });
}

/**
 * Build an in-memory zip buffer from a list of { name, content } files.
 */
function buildZipBuffer(files) {
    const zip = new AdmZip();
    for (const f of files) {
        zip.addFile(f.name, Buffer.from(f.content, "utf8"));
    }
    return zip.toBuffer();
}

/**
 * Convenience: given a raw AI response and the originally uploaded filename
 * (if any), returns { files, zipBuffer } or null if there's no code to zip.
 */
function codeResponseToZip(aiText, originalName) {
    const blocks = extractCodeBlocks(aiText);
    if (!blocks.length) return null;
    const files = nameCodeBlocks(blocks, originalName);
    return { files, zipBuffer: buildZipBuffer(files) };
}

module.exports = { extractCodeBlocks, nameCodeBlocks, buildZipBuffer, codeResponseToZip };
