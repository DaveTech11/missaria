const fs = require("fs");
const path = require("path");

const IGNORE_FOLDERS = [
    "node_modules",
    ".git",
    ".github",
    "dist",
    "build",
    "out",
    ".next",
    ".turbo",
    "coverage",
    ".cache",
    "vendor",
    "__pycache__"
];

const SUPPORTED_EXTENSIONS = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".html",
    ".css",
    ".scss",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".php",
    ".go",
    ".rs",
    ".kt",
    ".swift",
    ".xml",
    ".yaml",
    ".yml",
    ".sql",
    ".md",
    ".env.example"
];

// Prevent sending huge projects to the AI
const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER;
const MAX_TOTAL_SIZE = Number.MAX_SAFE_INTEGER;

function scanProject(rootDir) {

    const files = [];

    let totalSize = 0;

    function walk(currentDir) {

        const entries = fs.readdirSync(currentDir);

        for (const entry of entries) {

            const fullPath = path.join(currentDir, entry);

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {

                if (IGNORE_FOLDERS.includes(entry))
                    continue;

                walk(fullPath);

                continue;

            }

            const ext = path.extname(entry).toLowerCase();

            if (!SUPPORTED_EXTENSIONS.includes(ext))
                continue;

            if (stat.size > MAX_FILE_SIZE)
                continue;

            totalSize += stat.size;

            if (totalSize > MAX_TOTAL_SIZE)
                break;

            files.push(fullPath);

        }

    }

    walk(rootDir);

    return files;

}

function buildPrompt(files, rootDir) {

    let project = "";

    for (const file of files) {

        const relative = path.relative(rootDir, file);

        let content = "";

        try {

            content = fs.readFileSync(file, "utf8");

        } catch {

            continue;

        }

        project +=
`========================================
FILE: ${relative}
========================================

${content}

`;

    }

    return project;

}

module.exports = {

    scanProject,

    buildPrompt

};