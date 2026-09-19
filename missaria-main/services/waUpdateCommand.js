// services/waUpdateCommand.js
//
// .update — owner-only. Does a REAL update, not a themed animation
// over a fixed sleep():
//
//   1a. If this checkout is a git repo, `git fetch` + `git pull` for
//       real.
//   1b. Otherwise, if GITHUB_REPO is set in .env, downloads the
//       latest zip archive of that repo straight from GitHub's API
//       and extracts it over the project folder for real — this is
//       the path for deployments that aren't a git clone (e.g. files
//       were uploaded/extracted from a zip, which is how this project
//       currently sits). Set GITHUB_REPO=owner/name, optionally
//       GITHUB_BRANCH (defaults to "main") and GITHUB_TOKEN (only
//       needed for a private repo).
//   1c. If neither applies, says so plainly and skips straight to
//       step 3 instead of pretending to pull anything.
//   2. If package.json changed, runs `npm install` for real (bounded
//      by a timeout so a hung install can't wedge the bot).
//   3. Hot-reloads every command module in services/ that registers
//      commands on waCommandRouter — including brand-new files that
//      didn't exist when the bot started. This is what actually makes
//      "new commands" show up without restarting the process: it
//      diffs the command list before/after and reports exactly what's
//      new.
//
// The progress message is edited at each real milestone. If this
// Baileys fork doesn't support message editing, it falls back to
// sending each step as its own message instead — either way nothing
// here is faked, and the whole thing takes as long as the real work
// takes (typically seconds with nothing to do, up to a minute or so
// when there's an actual download + npm install to do).

const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");
const axios = require("axios");
const AdmZip = require("adm-zip");
const router = require("./waCommandRouter");

const PROJECT_ROOT = path.join(__dirname, "..");
const SERVICES_DIR = __dirname;

// Never touched by a GitHub-zip update, even though they might exist
// inside the downloaded repo — these hold local state / secrets that
// must never be silently overwritten by whatever's in the repo.
const PROTECTED_PATHS = new Set([
  ".env",
  "node_modules",
  "data",
  "memory",
  "temp",
  "callbacks",
  ".git",
]);

// Infra files that other services depend on directly (DB connections,
// shared state, etc.) — reloading these mid-process is what would
// actually make the bot unstable, so they're deliberately excluded.
// Anything else matching services/wa*.js is treated as a command
// module and is safe to hot-reload, INCLUDING files that don't exist
// yet at boot — that's how a freshly-pulled new command file gets
// picked up automatically.
const RELOAD_EXCLUDE = new Set([
  "whatsappService.js",
  "waGroupManager.js",
  "waMemory.js",
  "waImageGen.js",
  "waVoice.js",
  "waUpload.js",
  "waCommandRouter.js",
  "waUpdateCommand.js",
]);

let updating = false; // simple concurrency guard — never run two updates at once

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd: PROJECT_ROOT, timeout: opts.timeout || 60000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.toString().trim() || err.message));
      resolve(stdout?.toString().trim() || "");
    });
  });
}

function isGitRepo() {
  return fs.existsSync(path.join(PROJECT_ROOT, ".git"));
}

// Recursively copies extractedDir's contents over PROJECT_ROOT,
// skipping anything under PROTECTED_PATHS, and returns the list of
// files that were actually written (relative paths) so the caller can
// tell whether package.json changed.
function copyOverProject(extractedDir) {
  const written = [];

  function walk(srcDir, relDir) {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const rel = relDir ? path.join(relDir, entry.name) : entry.name;
      const topLevel = rel.split(path.sep)[0];
      if (PROTECTED_PATHS.has(topLevel)) continue;

      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(PROJECT_ROOT, rel);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        walk(srcPath, rel);
      } else {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        written.push(rel);
      }
    }
  }

  walk(extractedDir, "");
  return written;
}

async function updateFromGithub(setStatus) {
  const repo = process.env.GITHUB_REPO; // "owner/name"
  if (!repo) return { attempted: false };

  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN || "";

  await setStatus(`⬇️ Downloading latest code from ${repo}@${branch}...`);

  const headers = { "User-Agent": "Miss-Aria-Update-Command" };
  if (token) headers.Authorization = `token ${token}`;

  const res = await axios.get(`https://api.github.com/repos/${repo}/zipball/${branch}`, {
    headers,
    responseType: "arraybuffer",
    timeout: 60000,
    validateStatus: () => true,
  });

  if (res.status !== 200) {
    throw new Error(`GitHub returned ${res.status} for ${repo}@${branch} — check GITHUB_REPO/GITHUB_BRANCH/GITHUB_TOKEN in .env`);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gh-update-"));
  try {
    const zip = new AdmZip(Buffer.from(res.data));
    zip.extractAllTo(tmpDir, true);

    // GitHub's zipball puts everything inside one folder named like
    // "owner-repo-<short sha>" — find it and treat ITS contents as the
    // update, not the temp dir itself.
    const topEntries = fs.readdirSync(tmpDir);
    const repoFolder = topEntries.find((f) => fs.statSync(path.join(tmpDir, f)).isDirectory());
    if (!repoFolder) throw new Error("Downloaded archive didn't contain a folder — unexpected GitHub response shape.");
    const shaMatch = /-([0-9a-f]{7,40})$/i.exec(repoFolder);

    const written = copyOverProject(path.join(tmpDir, repoFolder));
    return { attempted: true, written, commit: shaMatch ? shaMatch[1] : null };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function findCommandModules() {
  return fs
    .readdirSync(SERVICES_DIR)
    .filter((f) => f.startsWith("wa") && f.endsWith(".js") && !RELOAD_EXCLUDE.has(f))
    .map((f) => path.join(SERVICES_DIR, f));
}

function reloadCommandModules() {
  const before = new Set(router.listCommands());
  const files = findCommandModules();
  const errors = [];

  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
    } catch {
      // wasn't loaded yet (a brand-new file) — nothing to clear, that's fine
    }
    try {
      require(file);
    } catch (err) {
      errors.push(`${path.basename(file)}: ${err.message}`);
    }
  }

  const after = new Set(router.listCommands());
  const added = [...after].filter((c) => !before.has(c));
  const removed = [...before].filter((c) => !after.has(c));
  return { added, removed, total: after.size, errors, moduleCount: files.length };
}

router.register(
  "update",
  async (ctx) => {
    if (!ctx.isOwner) {
      return router.safeSend(ctx, "🔒 .update is owner-only.");
    }
    if (updating) {
      return router.safeSend(ctx, "⏳ An update is already running — hang tight.");
    }
    updating = true;

    let statusMsg = null;
    let editWorks = true;
    async function setStatus(text) {
      if (statusMsg && editWorks) {
        try {
          await ctx.sock.sendMessage(ctx.jid, { text, edit: statusMsg.key });
          return;
        } catch {
          editWorks = false; // this Baileys build doesn't support edits — fall through to sending a new message, every time from now on
        }
      }
      statusMsg = await ctx.sock.sendMessage(ctx.jid, { text });
    }

    const log = [];
    try {
      await setStatus("🔧 Checking for updates...");

      let changedFiles = [];

      if (isGitRepo()) {
        // ---- 1a. git pull ----
        try {
          const beforeHash = await run("git", ["rev-parse", "HEAD"]);
          await setStatus("⬇️ Pulling latest code...");
          await run("git", ["fetch", "--all"], { timeout: 30000 });
          await run("git", ["pull"], { timeout: 60000 });
          const afterHash = await run("git", ["rev-parse", "HEAD"]);

          if (beforeHash !== afterHash) {
            const diff = await run("git", ["diff", "--name-only", beforeHash, afterHash]);
            changedFiles = diff.split("\n").filter(Boolean);
            log.push(`⬇️ Pulled ${changedFiles.length} changed file(s) (git, now at ${afterHash.slice(0, 7)}).`);
          } else {
            log.push("✅ Code already up to date (git).");
          }
        } catch (err) {
          log.push(`⚠️ git pull failed: ${err.message.slice(0, 200)}`);
        }
      } else if (process.env.GITHUB_REPO) {
        // ---- 1b. GitHub zip download + extract ----
        try {
          const result = await updateFromGithub(setStatus);
          changedFiles = result.written || [];
          log.push(`⬇️ Downloaded & extracted ${changedFiles.length} file(s) from GitHub${result.commit ? ` (${result.commit})` : ""}.`);
        } catch (err) {
          log.push(`⚠️ GitHub update failed: ${err.message.slice(0, 250)}`);
        }
      } else {
        // ---- 1c. nothing configured ----
        log.push("ℹ️ Not a git checkout and no GITHUB_REPO set in .env — skipping code pull, just reloading local files.");
      }

      // ---- 2. npm install, only if package.json actually changed ----
      if (changedFiles.includes("package.json") || changedFiles.includes("package-lock.json")) {
        await setStatus("📦 Installing dependencies (this can take a minute)...");
        try {
          await run("npm", ["install", "--no-audit", "--no-fund"], { timeout: 180000 });
          log.push("📦 Dependencies installed.");
        } catch (err) {
          log.push(`⚠️ npm install failed: ${err.message.slice(0, 200)}`);
        }
      }

      // ---- 3. hot-reload command modules ----
      await setStatus("🔄 Reloading commands...");
      const { added, removed, total, errors, moduleCount } = reloadCommandModules();
      log.push(`🔄 Scanned ${moduleCount} command module file(s), ${total} commands total.`);
      if (added.length) log.push(`✨ New: ${added.map((c) => "." + c).join(", ")}`);
      if (removed.length) log.push(`🗑️ Removed: ${removed.map((c) => "." + c).join(", ")}`);
      if (errors.length) log.push(`❌ Failed to load: ${errors.join("; ").slice(0, 300)}`);

      await setStatus(`✅ Update complete.\n\n${log.join("\n")}`);
    } catch (err) {
      console.error("waUpdateCommand error:", err.message);
      await router.safeSend(ctx, `❌ Update failed: ${err.message.slice(0, 200)}`);
    } finally {
      updating = false;
    }
  },
  { aliases: ["upgrade"] }
);

module.exports = {};
