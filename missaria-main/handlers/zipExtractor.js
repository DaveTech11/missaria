const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

/**
 * Extract a ZIP archive.
 *
 * @param {string} zipPath
 * @param {string} outputDir
 *
 * @returns {{
 *   success: boolean,
 *   path?: string,
 *   files?: string[],
 *   message?: string
 * }}
 */
async function extractZip(zipPath, outputDir) {
    try {

        if (!fs.existsSync(zipPath)) {
            return {
                success: false,
                message: "ZIP file not found."
            };
        }

        // Create output directory if it doesn't exist
        fs.mkdirSync(outputDir, {
            recursive: true
        });

        const zip = new AdmZip(zipPath);

        zip.extractAllTo(outputDir, true);

        const extractedFiles = [];

        function walk(dir) {

            const entries = fs.readdirSync(dir);

            for (const entry of entries) {

                const fullPath = path.join(dir, entry);

                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {

                    walk(fullPath);

                } else {

                    extractedFiles.push(fullPath);

                }

            }

        }

        walk(outputDir);

        return {
            success: true,
            path: outputDir,
            files: extractedFiles
        };

    } catch (err) {

        console.error("ZIP Extraction Error:", err);

        return {
            success: false,
            message: err.message
        };

    }
}

module.exports = extractZip;