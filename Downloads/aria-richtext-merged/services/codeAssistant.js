// ============================================================
// Code Assistant
// services/codeAssistant.js
//
// Flow:
//   user: "code a website for me"
//   bot:  file or script? -> generates code -> deploy? -> where?
//
// Deployment reality check (documented, not hidden):
//   - GitHub push is a real, working API call — requires a
//     GITHUB_TOKEN (repo scope) and GITHUB_USERNAME in .env.
//   - There is no public "push a button, deploy on Replit"
//     API for third-party apps. What *does* work: push the code
//     to GitHub, then hand the user a Replit import link
//     (https://replit.com/github/{owner}/{repo}) that creates a
//     ready-to-run Repl from that repo in one click.
// ============================================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const aiService = require("./aiService");

const GEN_ROOT = path.join(__dirname, "..", "data", "generated");

const CODE_INTENT_RE =
  /\b(code|build|make|create|write)\b.{0,40}\b(website|site|webpage|web app|app|bot|script|program|api|game|tool)\b.{0,20}\b(for me|please|pls)?\b/i;

function looksLikeCodeRequest(text) {
  if (!text) return false;
  return CODE_INTENT_RE.test(text.toLowerCase());
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Ask the model for code. mode: "file" (one self-contained file,
 * e.g. a single index.html) or "script" (a small multi-file
 * project with a clear entry point).
 */
async function generateCode(request, mode) {
  const system =
    mode === "file"
      ? "You are an expert developer. Produce ONE self-contained, working file that fulfills the user's request " +
        "(e.g. a single index.html with inline CSS/JS for a website, or a single .py/.js script). " +
        "Respond with ONLY the code, no explanation, no markdown fences."
      : "You are an expert developer. Produce a small, working multi-file project fulfilling the user's request. " +
        "Respond ONLY as JSON: an array of objects like " +
        '[{"path":"index.js","content":"..."}, {"path":"package.json","content":"..."}]. ' +
        "Keep it minimal but runnable (include a README.md with run instructions). No prose outside the JSON.";

  const { text } = await aiService.generateText({
    prompt: request,
    system,
    maxTokens: 4000
  });

  if (mode === "file") {
    const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
    const ext = guessExtension(request, cleaned);
    return [{ path: `main${ext}`, content: cleaned }];
  }

  // script/project mode — expect JSON
  try {
    const cleaned = text.replace(/^```json\n?/i, "").replace(/```$/i, "").trim();
    const files = JSON.parse(cleaned);
    if (Array.isArray(files) && files.length) return files;
    throw new Error("empty");
  } catch {
    // model didn't return clean JSON — fall back to a single file so the
    // user still gets something usable instead of an error
    return [{ path: "main.txt", content: text }];
  }
}

function guessExtension(request, content) {
  const r = request.toLowerCase();
  if (r.includes("website") || r.includes("site") || r.includes("webpage") || /<html/i.test(content)) return ".html";
  if (r.includes("python")) return ".py";
  if (r.includes("bot") || r.includes("node") || r.includes("javascript")) return ".js";
  return ".txt";
}

function saveGeneratedFiles(userId, projectName, files) {
  const dir = path.join(GEN_ROOT, String(userId), projectName);
  ensureDir(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f.path);
    ensureDir(path.dirname(fullPath));
    fs.writeFileSync(fullPath, f.content, "utf8");
  }
  return dir;
}

// ============================================================
// GITHUB DEPLOY
// ============================================================

async function deployToGithub({ token, username, repoName, files, isPrivate = false }) {
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "MissAriaBot"
  };

  // 1. Create the repo (idempotent-ish: ignore 422 "already exists")
  try {
    await axios.post(
      "https://api.github.com/user/repos",
      { name: repoName, private: isPrivate, auto_init: true },
      { headers }
    );
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    if (!/already exists/i.test(msg)) throw new Error(`GitHub repo creation failed: ${msg}`);
  }

  // 2. Push each file via the Contents API
  for (const file of files) {
    const contentB64 = Buffer.from(file.content, "utf8").toString("base64");
    const url = `https://api.github.com/repos/${username}/${repoName}/contents/${encodeURIComponent(file.path)}`;

    let sha;
    try {
      const existing = await axios.get(url, { headers });
      sha = existing.data.sha;
    } catch {
      // file doesn't exist yet — fine
    }

    await axios.put(
      url,
      {
        message: `Add ${file.path}`,
        content: contentB64,
        ...(sha ? { sha } : {})
      },
      { headers }
    );
  }

  const repoUrl = `https://github.com/${username}/${repoName}`;
  return {
    repoUrl,
    replitImportUrl: `https://replit.com/github/${username}/${repoName}`
  };
}

module.exports = {
  looksLikeCodeRequest,
  generateCode,
  saveGeneratedFiles,
  deployToGithub,
  GEN_ROOT
};
