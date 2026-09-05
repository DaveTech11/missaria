# Deploying Miss Aria

This project previously had no hosting configuration at all — it's a
background WhatsApp process with no HTTP server, no Dockerfile, no
platform config. Everything in this guide is new. None of it has been
run end-to-end (no Docker, no network, no Railway/Pterodactyl account
available in the environment this was built in) — the configs follow each
platform's real, documented format, but **treat first deploy on each
platform as a first real test**, not a confirmed working path.

## What was added, and why

- **`server/statusServer.js`** — a minimal, dependency-free HTTP server
  (`/health` returns real live status: uptime, active paired agents).
  Added because several hosting platforms (Railway in particular) expect
  something bound to a port; without it, a background-only process can
  get flagged unhealthy or restart-looped on some platforms. Defensive by
  design — if it fails to bind, it logs and Miss Aria keeps running
  regardless.
- **`Dockerfile`** — the real reason a naive `node:20` Dockerfile would
  fail here: this project has four native-compiled dependencies (`canvas`,
  `better-sqlite3`, `sharp`, and `puppeteer`'s bundled Chromium), each
  needing specific system libraries to build or run. The Dockerfile
  installs exactly those.
- **`railway.json`** — points Railway at the Dockerfile explicitly rather
  than letting it auto-detect a build (Nixpacks' default Node build
  doesn't reliably handle `canvas`/`puppeteer`'s native requirements).
- **`Procfile`, `ecosystem.config.js`, `deploy/miss-aria.service`** — three
  different ways to keep the process alive: Heroku-style, PM2, and raw
  systemd, for whichever a given VPS/panel expects.
- **`deploy/egg-miss-aria.json`** — a Pterodactyl-format panel egg.
- **`.env.example`** — every environment variable this codebase actually
  reads, found by grepping every `process.env.X` reference in the source,
  not written from memory or assumption.
- **`.gitignore` / `.dockerignore`** — didn't exist before; matters more
  than usual here since a missing `.gitignore` means `.env` or a paired
  `sessions/` folder can end up committed to whatever repo you deploy from.

## Persistent storage — read this before deploying anywhere

Two directories must survive restarts/redeploys or the bot loses its
paired WhatsApp session and all local moderation/scheduler state:

- `sessions/` — the paired WhatsApp auth credentials. Lost = re-pair from
  scratch.
- `data/` — warns/mutes/bans, the scheduler's task database, the report
  recipient list, antilink settings, etc.

Every deployment method below is written with this in mind (Docker
volumes, a persistent VPS disk, or a panel's persistent data directory).
**A platform with an ephemeral filesystem (many free-tier PaaS options)
will silently lose both on every restart** — check this before choosing a
host.

---

## Railway

1. Push this repo to GitHub (or use the Railway CLI directly).
2. Railway -> New Project -> Deploy from GitHub repo.
3. Railway will detect `railway.json` and build from the `Dockerfile`
   automatically -- no manual build settings needed.
4. Set every variable from `.env.example` you actually need in Railway's
   Variables tab. `PORT` is injected automatically by Railway; the status
   server already reads it.
5. **Storage**: Railway's default filesystem is ephemeral on redeploy.
   Attach a Railway Volume mounted at `/app/sessions` and another at
   `/app/data` (Railway -> your service -> Settings -> Volumes) or the bot
   will need re-pairing after every deploy.

## VPS (Ubuntu/Debian) -- two options

### Option A: PM2

```bash
git clone <your-repo> /opt/miss-aria && cd /opt/miss-aria
cp .env.example .env   # fill in real values
sudo apt-get install -y python3 make g++ libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev
npm install --omit=dev
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed instructions to survive a reboot
```

### Option B: systemd (no PM2)

```bash
git clone <your-repo> /opt/miss-aria && cd /opt/miss-aria
cp .env.example .env
sudo apt-get install -y python3 make g++ libcairo2-dev libpango1.0-dev \
  libjpeg-dev libgif-dev librsvg2-dev
npm install --omit=dev
sudo useradd -r -s /bin/false aria   # if it doesn't already exist
sudo chown -R aria:aria /opt/miss-aria
sudo cp deploy/miss-aria.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now miss-aria
sudo journalctl -u miss-aria -f   # watch logs
```

Both options run directly on the VPS filesystem, so `sessions/` and
`data/` are already persistent by default -- nothing extra to configure.

## VPS with Docker

```bash
git clone <your-repo> /opt/miss-aria && cd /opt/miss-aria
cp .env.example .env
docker compose up -d --build
docker compose logs -f
```

`docker-compose.yml` already defines named volumes for `sessions/` and
`data/`, so they persist across `docker compose down`/`up` and image
rebuilds.

## Pterodactyl-style panel

1. Admin panel -> Nests -> Import Egg -> upload `deploy/egg-miss-aria.json`.
2. Create a server using the new "Miss Aria" egg.
3. Set the `OWNER_ID` (and any API keys you use) as egg variables, or
   upload a full `.env` via the file manager after the server is created.
4. Start the server -- the install script installs the same system
   libraries the Dockerfile does, then runs `npm install`.
5. **Storage**: Pterodactyl server data directories are persistent by
   default (unlike most free PaaS), so `sessions/` and `data/` survive
   restarts without extra configuration -- just don't reinstall the server
   unless you intend to wipe it.

This egg has not been imported into a real Pterodactyl instance as part
of building it -- the JSON follows the documented `PTDL_v2` schema, but
verify the first real import before relying on it for anything important.

## Known risk, regardless of host

This project depends on `@whiskeysockets/baileys` via a third-party fork
(`github:xcoursed/baileys`), an unofficial WhatsApp client library. Using
it is against WhatsApp's Terms of Service and paired numbers can be
banned at WhatsApp's discretion -- this is unrelated to which host you
pick, and no deployment choice here changes that risk.

## New owner-agent capabilities added this round

- **Media intelligence** (`src/owner/mediaExtractor.js`) — "send this image
  to Zuno" now works for real, either with an image attached directly or
  replied-to. Extraction logic fully tested (6 cases: direct
  image/video/document/audio, quoted image, no-media, malformed message).
  The actual Baileys `downloadMediaMessage` byte-download is unverified at
  the network level (no `baileys` installed in this sandbox) — flagged in
  the file itself.
- **Delete-by-reply** (`src/owner/replyContext.js`) — "delete that" while
  replying to a message extracts the real message key (handles the
  group-vs-DM `fromMe`/`participant` distinction, and device-suffixed
  JIDs). Falls back to asking "reply to the message first" rather than
  guessing which message you meant.
- **Rate limiting** (`src/owner/rateLimiter.js`) — 20 owner-agent commands
  per 60s, independent of the message-redelivery dedup that already
  existed. Sliding window, tested at the boundary.
- **Bulk operations** (`src/owner/bulkOperations.js`) — "turn on anti-link
  in all groups where I'm admin" applies sequentially with a real 1.2s
  delay between each group (verified via actual elapsed-time
  measurement, not just present-in-code), confirms first with the full
  group list, and reports exactly which groups succeeded/failed —
  never claims total success on partial failure.
- **Compound commands** (spec §9) — "find Zuno, turn on anti-link, and
  message the admins" works end-to-end: resolves the group, applies each
  step with real tool calls, DMs the actual admins individually, and
  reports "Completed X/Y operations" with per-step ✅/❌ detail.
  **Deliberately scoped**, not general: only recognizes find/open a group,
  anti-link on/off, lock/unlock, and message-the-group/admins as chainable
  clauses. Any clause it can't confidently classify makes the WHOLE
  message fall through as non-compound, rather than guessing.

Three real bugs found and fixed while testing this round: the bulk
anti-link trigger was being intercepted by the existing "group admins"
lookup (both matched on the word "admin"); the delete-message reply text
read awkwardly ("Deleted in that message"); and the compound-command
partial-failure report had a double-period typo. All caught by actually
running the code against realistic message shapes, not by inspection.

## "Getting smarter" — added this round, real not cosmetic

You asked for the agent to get smarter from every message. Actual model
retraining per-message isn't a real capability for any system — so instead,
three concrete, testable mechanisms:

- **Knowledge/correction memory** (`src/owner/knowledgeStore.js`) —
  "remember that X" persists a fact; "what have you learned" lists them;
  "forget X" removes one. Capped at the 20 most recent for prompt
  injection (older entries stay stored/listable, just not injected
  forever, to keep the AI prompt from growing unbounded).
- **Real AI prompt injection** (`commands/whatsapp.js`'s `replyFromAI`) —
  this is the part that makes it genuinely real: every taught fact is
  injected into the actual system prompt sent to the AI on the owner's
  next conversation. Proven end-to-end in testing — captured the real
  system prompt string sent to `generateText()` after teaching a fact,
  confirmed it was present, and confirmed a non-owner's conversation never
  receives the owner's private taught facts.
- **Usage analytics** (`src/owner/usageAnalytics.js`) — real counts of
  handled vs. unhandled owner-agent commands, plus the last 50 unrecognized
  phrasings verbatim. This does NOT automatically improve `ownerRouter`'s
  patterns — it gives a genuine, evidence-based list for a human (you, or
  a future session) to act on. Say "usage stats" to see it.

All three are wired through `ownerRouter.js`'s existing owner-only,
rate-limited, audited path — same security model as everything else.
