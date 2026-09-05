/**
 * ╔══════════════════════════════════════════════════════════════╗
 *                     🤖 TG-GUARD AI REPOSITORY
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * tg-guard is an AI-powered Telegram security, moderation, and
 * management repository built to automate community protection
 * using intelligent detection, advanced automation, and powerful
 * administration tools.
 *
 * ✨ AI FEATURES
 * ──────────────────────────────────────────────
 * • AI image moderation & object detection
 * • AI NSFW / drug paraphernalia detection
 * • Automatic message analysis
 * • Smart spam detection
 * • AI-powered threat monitoring
 * • Intelligent user moderation
 * • Automatic admin actions
 * • AI event logging
 * • Future support for multiple AI models
 * • Cloud memory & personalization
 *
 * 🛡 SECURITY FEATURES
 * ──────────────────────────────────────────────
 * • Deletes prohibited content instantly
 * • Restricts or bans offending users
 * • Demotes administrators when permitted
 * • Locks chats automatically during threats
 * • Sends emergency notifications to owners
 * • Force-Join verification system
 * • Anti-spam & anti-raid protection
 * • Automatic moderation pipeline
 *
 * ⚙ ADMIN SYSTEM
 * ──────────────────────────────────────────────
 * • Interactive management dashboard
 * • Premium user management
 * • Multi-admin permission system
 * • Broadcast media & announcements
 * • User statistics
 * • Chat management
 * • Channel management
 * • Group management
 * • Live announcement editing
 *
 * 🚀 PLATFORM REQUIREMENTS
 * ──────────────────────────────────────────────
 * The bot requires administrator permissions:
 *
 * • Delete Messages
 * • Restrict Members
 * • Promote/Demote Admins
 * • Manage Chat
 * • Pin Messages (Optional)
 * • Invite Users (Recommended)
 *
 * ⚠ TELEGRAM LIMITATIONS
 * ──────────────────────────────────────────────
 * • Group owners cannot be demoted.
 * • Higher-ranked admins cannot be modified.
 * • Users must start the bot before receiving DMs.
 * • Force-Join channels require bot administrator access.
 *
 * 📦 REPOSITORY MODULES
 * ──────────────────────────────────────────────
 * • AI Detection Engine
 * • Moderation Core
 * • Security Manager
 * • Admin Dashboard
 * • Broadcast System
 * • Premium System
 * • Force Join Manager
 * • User Database
 * • Logging System
 * • AI Services
 * • Plugin Support
 * • Multi-Model AI Integration
 *
 * 🔮 PLANNED FEATURES
 * ──────────────────────────────────────────────
 * • GPT Integration
 * • Grok Integration
 * • Gemini Integration
 * • Claude Integration
 * • DeepSeek Integration
 * • OCR Image Analysis
 * • Voice Moderation
 * • AI Chat Assistant
 * • Multi-language Support
 * • Long-Term AI Memory
 * • Personalization Engine
 * • Custom AI Models
 *
 * © Dave Tech • TG-Guard AI Repository
 * Built with Node.js • Telegram Bot API • Artificial Intelligence
 */
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
require("dotenv").config();
// ============================================================
// 🛡️ GLOBAL ERROR SHIELD — keep transient API/Telegram failures
// from taking down the whole assistant.
// ============================================================
process.on("unhandledRejection", (error) => {
  console.error("[UNHANDLED REJECTION]", error?.stack || error);
});
process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]", error?.stack || error);
});


// Minimal status/health server for hosting platforms that expect a bound
// port (Railway, panel hosts). Defensive — see server/statusServer.js;
// never affects the bot's actual WhatsApp functionality if it fails.
try {
  require("./server/statusServer").start();
} catch (err) {
  console.error("statusServer failed to load (continuing without it):", err.message);
}

try {
  require("./services/heartbeat").startHeartbeat();
} catch (err) {
  console.error("heartbeat failed to load (continuing without it):", err.message);
}

const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const { pipeline } = require("stream/promises");


const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");
const sharp = require("sharp");
const stickerRecognitionService =
require("./services/stickerRecognitionService");
const gameManager = require("./games/gameLoader");
const downloadService = require("./services/downloadService");
const { searchTrack } = require("./services/musicservice");
const codeAssistant = require("./services/codeAssistant");
const { generateTalkingVideoNote } = require("./services/talkingAvatar");
const socialDownloader = require("./services/socialDownloader");
const statsTracker = require("./services/statsTracker");
const { generateInfoCard } = require("./utils/infoCard");
const { formatAiReplyForTelegram } = require("./utils/telegramRichText");
const { detectNaturalImageRequest, isNaturalImageQuestion, generateImage: generateNaturalImage } = require("./services/imageGenerator");
const { detectIntent, progressBar, withRetry, isRecoverableTelegramError } = require("./services/smartAssistant");
const codePending = new Map(); // userId -> { request, mode, files }
const mediaPending = new Map(); // userId -> { platform }
// Stores the force-join message for each user
const pendingForceJoin = new Map();
const geminiSessions = new Map();
const signupState = new Map();
const verificationState = new Map();
const loginEmailState = new Map();
const loginPasswordState = new Map();
const passwordSetupState = new Map();
// local, offline perceptual-hashing for "delete this exact image on sight"
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api-rebix.vercel.app/api/deepseek-r1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// ===========================
// AI API Keys
// ===========================
const CHARART_API_URL =
    process.env.CHARART_API_URL ||
    "https://prexzyapis.com/ai/charart";
const TOKEN = process.env.BOT_TOKEN || BOT_TOKEN;

const TTS_API_URL =
"https://prexzyapis.com/tts/isla";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ||"sk-Y2erjE9Aut1EV9MEuZGVTTjnmf9hXmuY9tVMUn7SsJzHUXaI";
const STT_API_URL = process.env.STT_API_URL || "";

const GPTLOGIC_API_URL = process.env.GPTLOGIC_API_URL || "https://api-rebix.vercel.app/api/gptlogic";

const COPILOT_API_URL = process.env.COPILOT_API_URL || "https://api-rebix.vercel.app/api/copilot";



const GPT5_API_URL = process.env.GPT5_API_URL || 
"https://prexzyapis.com/api/ai/askgpt5";
const PROMPT_TO_CODE_API =
    process.env.PROMPT_TO_CODE_API ||
    "https://prexzyapis.com/ai/prompttocode";
const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY || "";
const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER || "";
const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET || "";
const MODERATION_MODEL = process.env.MODERATION_MODEL || "google/gemini-2.5-flash";
const BRAND_NAME = process.env.BRAND_NAME || "Miss Aria";
const BOT_VERSION = "10.0.0";
const PersistentUserHistory = require("./memory/userHistoryStore");
const userHistory = new PersistentUserHistory();

function gracefulShutdown(signal) {
    console.log(`${signal} received — flushing user memory to disk before exit...`);
    try { userHistory.flushSync(); } catch (err) { console.error("flushSync failed:", err.message); }
    process.exit(0);
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
const PHOTOS_DIR = path.join(__dirname, "photos");

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}
const photoRevertInProgress = new Set();
const OWNER_ID = String(process.env.OWNER_ID || "7161177100").trim();
const SEED_ADMIN_IDS = (process.env.ADMIN_IDS || "7161177100")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const FORCE_JOIN_CHANNELS = (process.env.FORCE_JOIN_CHANNELS || "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);
const FORCE_JOIN_EXEMPT_ADMINS = (process.env.FORCE_JOIN_EXEMPT_ADMINS || "true") === "true";


const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const state = loadStore();
ensureAdminsSeeded(); // function declaration below is hoisted, safe to call here

// Bot-management admins (separate from Telegram group/channel admins).
// OWNER_ID is a single super-admin who can never be de-added and is the only
// one allowed to add/remove other bot admins (unless OWNER_ID isn't set, in
// which case any seeded admin can — see isAllowedToManageAdmins()).

if (!DEEPSEEK_API_URL) {
  console.warn("Warning: DEEPSEEK_API_URL not set — chat will fail until it's added to .env");
}

if (!BOT_TOKEN) {
  console.error("FATAL: TELEGRAM_BOT_TOKEN is not set in .env — the bot cannot start. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const HCN_API_KEY = "sk-Y2erjE9Aut1EV9MEuZGVTTjnmf9hXmuY9tVMUn7SsJzHUXaI";
      
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
/**
 * Send a Telegram "rich message" using node-telegram-bot-api.
 *
 * This is intentionally a small compatibility helper for the project's
 * existing <h1>, <h2>, <table>, <tg-button-row>, and <tg-button> markup.
 * It uses only the normal node-telegram-bot-api methods.
 */
async function sendRichMessage(bot, chatId, html, options = {}) {
  if (!bot || typeof bot.sendMessage !== "function") {
    throw new TypeError("sendRichMessage requires a node-telegram-bot-api bot instance");
  }

  let source = String(html ?? "");
  const keyboard = [];

  // Convert the project's custom Telegram button markup into a normal
  // node-telegram-bot-api inline keyboard.
  const rowRegex = /<tg-button-row\b[^>]*>([\s\S]*?)<\/tg-button-row>/gi;
  source = source.replace(rowRegex, (_, rowHtml) => {
    const row = [];
    const buttonRegex = /<tg-button\b([^>]*)>([\s\S]*?)<\/tg-button>/gi;
    let match;

    while ((match = buttonRegex.exec(rowHtml))) {
      const attrs = match[1] || "";
      const label = match[2].replace(/<[^>]+>/g, "").trim();
      const dataMatch = attrs.match(/\bdata\s*=\s*["']([^"']+)["']/i);
      const urlMatch = attrs.match(/\b(?:url|href)\s*=\s*["']([^"']+)["']/i);
      const typeMatch = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i);

      if (urlMatch) {
        row.push({ text: label || "Open", url: urlMatch[1] });
      } else if (!typeMatch || typeMatch[1].toLowerCase() === "callback") {
        if (dataMatch) row.push({ text: label || "Open", callback_data: dataMatch[1] });
      }
    }

    if (row.length) keyboard.push(row);
    return "";
  });

  // Map rich-message-only HTML to Telegram Bot API supported HTML.
  source = source
    .replace(/<h1\b[^>]*>/gi, "<b>")
    .replace(/<\/h1>/gi, "</b>")
    .replace(/<h2\b[^>]*>/gi, "<b>")
    .replace(/<\/h2>/gi, "</b>")
    .replace(/<h3\b[^>]*>/gi, "<b>")
    .replace(/<\/h3>/gi, "</b>")
    .replace(/<hr\s*\/?>/gi, "\n────────────\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(?:ul|ol|table|thead|tbody|tfoot)\b[^>]*>/gi, "")
    .replace(/<tr\b[^>]*>/gi, "")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<t[hd]\b[^>]*>/gi, "")
    .replace(/<\/t[hd]>/gi, "  ")
    .replace(/<blockquote\b[^>]*>/gi, "<blockquote>")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const sendOptions = {
    parse_mode: "HTML",
    ...(options || {})
  };

  if (keyboard.length) {
    sendOptions.reply_markup = {
      ...(sendOptions.reply_markup || {}),
      inline_keyboard: keyboard
    };
  }

  try {
    return await bot.sendMessage(chatId, source || " ", sendOptions);
  } catch (error) {
    // Keep the helper reliable if one of the optional rich tags contains
    // markup Telegram does not accept: retry as plain text.
    if (sendOptions.parse_mode) {
      const fallback = source
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .trim();

      const fallbackOptions = { ...sendOptions };
      delete fallbackOptions.parse_mode;
      return await bot.sendMessage(chatId, fallback || " ", fallbackOptions);
    }
    throw error;
  }
}


let TELEGRAM_BOT_USERNAME = String(process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '').trim();

// Resolve the real bot username once so Add-to-Group links never point at a
// hard-coded/third-party bot. Failure is non-fatal; the button is simply omitted.
bot.getMe().then((me) => {
  if (me?.username) TELEGRAM_BOT_USERNAME = me.username;
}).catch((err) => console.error('[BOT IDENTITY]', err?.message || err));

const { registerTelegramGroupManager } = require('./services/telegramGroupManager');
registerTelegramGroupManager({ bot, state, saveStore, addChat });

const { setup: setupTelegramOwnerCenter } = require('./services/telegramOwnerCenter');
setupTelegramOwnerCenter({
  bot,
  state,
  saveStore,
  addChat,
  ownerId: String(process.env.OWNER_TELEGRAM_ID || process.env.OWNER_ID || '').trim(),
});

const setupSettingsCommand = require("./settings");
const setupSettingsCallbacks = require("./callbacks/setting");
setupSettingsCommand(bot);
setupSettingsCallbacks(bot);
const registerPlay = require("./commands/play");

registerPlay(bot);

// then load WhatsApp command
require("./commands/whatsapp")(bot, { isOwner, state, sleep });

const whatsappServiceInfo =
    require("./services/whatsappService");
// ------------------------------------------------------------------
// Premium emoji auto-injection
// Wraps the bot's send/edit methods so that any known emoji in text
// sent with parse_mode: "HTML" is automatically upgraded to its
// <tg-emoji> premium form. Patched here, once, on the shared `bot`
// instance — so it applies everywhere the bot is used (features.js,
// features2.js, features3.js, funcommand.js, wallet.js, commands/,
// handlers/, games/, and bot.js itself), not just /start.
// Only fires when parse_mode is explicitly "HTML"; Markdown-parsed or
// plain-text messages are left untouched (tg-emoji tags require HTML).
// ------------------------------------------------------------------
const { premiumify } = require("./utils/premiumEmoji");

function isHtml(options) {
  return !!options && typeof options.parse_mode === "string" &&
    options.parse_mode.toLowerCase() === "html";
}

const _origSendMessage = bot.sendMessage.bind(bot);
bot.sendMessage = function (chatId, text, options) {
  if (typeof text === "string" && isHtml(options)) {
    text = premiumify(text);
  }
  return _origSendMessage(chatId, text, options);
};

const _origEditMessageText = bot.editMessageText.bind(bot);
bot.editMessageText = function (text, options) {
  if (typeof text === "string" && isHtml(options)) {
    text = premiumify(text);
  }
  return _origEditMessageText(text, options);
};

function wrapCaptionMethod(methodName) {
  const orig = bot[methodName].bind(bot);
  bot[methodName] = function (chatId, media, options, ...rest) {
    if (options && typeof options.caption === "string" && isHtml(options)) {
      options = { ...options, caption: premiumify(options.caption) };
    }
    return orig(chatId, media, options, ...rest);
  };
}
["sendPhoto", "sendVideo", "sendDocument", "sendAnimation"].forEach(wrapCaptionMethod);

require("./features")(bot);
require("./funcommand")(bot);
require("./features2")(bot, { getUser, saveStore, userHistory });
require("./features3")(bot, {
  saveStore,
  getChatSettings,
  isBotAdmin,
  warnUser,
  muteUser,
  tryDemote,
  lockChat,
  toggleStickerLock,
  isStickerLockEnabled,
  toggleLinkLock,
  isLinkLockEnabled,
  resolveTargetFromMessage,
  extractUrls
});
require("./wallet")(bot, { escapeHtml, resolveGroupTarget });
require("./commands/code")(bot);
require("./handlers/codeHandler")(bot);
// ============================================================
// USAGE ANALYTICS — lightweight, self-contained, never blocks
// ============================================================
bot.on("message", (msg) => {
  if (!msg.from) return;
  statsTracker.trackMessage(msg.from.id);
  if (msg.text && msg.text.startsWith("/")) {
    statsTracker.trackCommand(msg.text.split(/[\s@]/)[0]);
  }
  if (msg.voice) statsTracker.trackFeature("voice_note");
  if (msg.document) statsTracker.trackFeature("document_upload");
  if (msg.photo) statsTracker.trackFeature("photo");
});

bot.on("callback_query", (query) => {
  if (query.data && query.data.startsWith("code_")) statsTracker.trackFeature("code_studio:" + query.data);
});

bot.onText(/^\/stats$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isBotAdmin(userId)) {
    return bot.sendMessage(chatId, "🚫 Admins only.");
  }

  const s = statsTracker.getSummary();
  const uptimeDays = ((Date.now() - s.since) / 86400000).toFixed(1);

  const topCommandsText = s.topCommands.length
    ? s.topCommands.map(([name, count]) => `${name} — ${count}`).join(", ")
    : "none yet";

  const topFeaturesText = s.topFeatures.length
    ? s.topFeatures.map(([name, count]) => `${name} — ${count}`).join(", ")
    : "none yet";

  try {
    const card = await generateInfoCard({
      title: "Miss Aria — Analytics",
      subtitle: `Tracking since ${uptimeDays}d ago`,
      rows: [
        { icon: "👥", label: "Unique users", value: String(s.totalUniqueUsers) },
        { icon: "🟢", label: "Active today", value: String(s.activeToday) },
        { icon: "📅", label: "Active 7d", value: String(s.active7d) },
        { icon: "💬", label: "Messages seen", value: String(s.totalMessages) },
        { icon: "🏆", label: "Top commands", value: topCommandsText },
        { icon: "✨", label: "Top features", value: topFeaturesText },
      ],
      footer: "Miss Aria • Bot Analytics",
    });
    await bot.sendPhoto(chatId, card, {
      caption: "<b>📊 Bot Analytics</b>",
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("stats card render failed, falling back to text:", err.message);
    await bot.sendMessage(chatId, `
📊 <b>вσт αηαℓутι¢ѕ</b>

━━━━━━━━━━━━━━━━━━

👥 Unique users (all-time): <b>${s.totalUniqueUsers}</b>
🟢 Active today: <b>${s.activeToday}</b>
📅 Active last 7 days: <b>${s.active7d}</b>
💬 Total messages seen: <b>${s.totalMessages}</b>
⏱ Tracking since: <b>${uptimeDays}d ago</b>

━━━━━━━━━━━━━━━━━━

🏆 <b>тσρ ¢σммαη∂ѕ</b>
${escapeHtml(topCommandsText)}

✨ <b>тσρ ƒєαтυяєѕ</b>
${escapeHtml(topFeaturesText)}
`, { parse_mode: "HTML" });
  }
});

require("dotenv").config();

// ❌ before — falls back to old dead key if .env fails to load
// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "sk-or-v1-846bff...";

// ✅ after — no silent fallback, fails loudly instead

if (!BOT_TOKEN || !OPENROUTER_API_KEY) {
  console.error("Missing TELEGRAM_BOT_TOKEN or OPENROUTER_API_KEY in .env");
  process.exit(1); // stop the bot instead of running with a broken key
}

const deepseek = new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: "https://api.hcnsec.cn/v1",
});

const SIGHTENGINE_MODELS = "nudity-2.1,weapon,violence,gore,recreational_drug,offensive";
function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

const USERS_FILE = "./users.json";

let users = {};

if (fs.existsSync(USERS_FILE)) {
    users = JSON.parse(
        fs.readFileSync(USERS_FILE, "utf8")
    );
}
// ========================================
// LINKS
// ========================================

const SUPPORT_CHANNEL = "https://t.me/F2BATECH";

const DEVELOPER_LINK = "https://t.me/F3BAN";
/* ============================================================
 * Storage — tiny JSON-file persistence, no external DB needed.
 *
 * {
 *   users: {
 *     "<userId>": {
 *       started: true,
 *       plan: "free" | "premium",
 *       chats: [{ id, title, type }],
 *       pending: { action, ...extra } | null
 *     }
 *   },
 *   chatStats: { "<chatId>": { title, flags: 0 } }
 * }
 * ============================================================ */


function loadStore() {
  if (!fs.existsSync(DATA_FILE)) return { users: {}, chatStats: {}, admins: [], settings: {}, chatSettings: {}, modLogs: {}, ariaAudit: [], ariaMemory: { notes: [], preferences: {} }, ariaAnalytics: { groups: {}, users: {}, actions: [], daily: {} }, ariaAutoMod: {}, ariaEmergencyMode: false };
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (!parsed.users) parsed.users = {};
    if (!parsed.chatStats) parsed.chatStats = {};
    if (!parsed.admins) parsed.admins = [];
    if (!parsed.settings) parsed.settings = {};
    if (!parsed.chatSettings) parsed.chatSettings = {};
    if (!parsed.modLogs) parsed.modLogs = {};
    if (!parsed.ariaAudit) parsed.ariaAudit = [];
    if (!parsed.ariaMemory) parsed.ariaMemory = { notes: [], preferences: {} };
    if (!parsed.ariaAnalytics) parsed.ariaAnalytics = { groups: {}, users: {}, actions: [], daily: {} };
    if (!parsed.ariaAutoMod) parsed.ariaAutoMod = {};
    if (typeof parsed.ariaEmergencyMode === "undefined") parsed.ariaEmergencyMode = false;
    return parsed;
  } catch {
    return { users: {}, chatStats: {}, admins: [], settings: {}, chatSettings: {}, modLogs: {}, ariaAudit: [], ariaMemory: { notes: [], preferences: {} }, ariaAnalytics: { groups: {}, users: {}, actions: [], daily: {} }, ariaAutoMod: {}, ariaEmergencyMode: false };
  }
}

function saveStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function getUser(userId) {

  const key = String(userId);
  if (!state.users[key]) {
    state.users[key] = { started: false, plan: "free", chats: [], pending: null };
  }
  return state.users[key];
}

function markStarted(userId) {
  getUser(userId).started = true;
  saveStore();
}

function getPlan(userId) {
  return getUser(userId).plan;
}

function setPlan(userId, plan) {
  getUser(userId).plan = plan;
  saveStore();
}

function getPremiumExpiry(userId) {
  return getUser(userId).premiumExpiry || 0;
}

function setPremiumExpiry(userId, timestampMs) {
  getUser(userId).premiumExpiry = timestampMs;
  saveStore();
}

function isPremiumActive(userId) {
  return getPlan(userId) === "premium" && getPremiumExpiry(userId) > Date.now();
}

function setPending(userId, pending) {
  getUser(userId).pending = pending;
  saveStore();
}

function getPending(userId) {
  return getUser(userId).pending;
}

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const nodemailer = require("nodemailer");

const EMAIL_USER = String(process.env.EMAIL_USER || process.env.GMAIL_USER || "").trim().toLowerCase();
const EMAIL_PASS = String(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || "")
    .replace(/\s+/g, "")
    .trim();

const smtpOptions = {
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    tls: { minVersion: "TLSv1.2", servername: "smtp.gmail.com" }
};

// Use Gmail's native service configuration first, then fall back to explicit
// SMTP ports. App passwords are accepted with the spaces removed above.
const transporter = nodemailer.createTransport({
    ...smtpOptions,
    service: "gmail",
    secure: false
});

const transporter465 = nodemailer.createTransport({
    ...smtpOptions,
    host: "smtp.gmail.com",
    port: 465,
    secure: true
});

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ Gmail verification is not configured. Set EMAIL_USER and EMAIL_PASS in Render Environment Variables.");
} else {
    transporter.verify()
        .then(() => console.log(`📧 Gmail SMTP ready for ${EMAIL_USER}`))
        .catch(err => console.error("❌ Gmail SMTP verification failed:", err.code || "", err.responseCode || "", err.message || err));
}

function clearPending(userId) {
  getUser(userId).pending = null;
  saveStore();
}
function getUserProtectedChats(userId) {

    if (!state.users) {
        return [];
    }

    const user = state.users[String(userId)];

    if (!user) {
        return [];
    }

    return user.chats || [];

}
function addChat(userId, chat) {
  const user = getUser(userId);
  const exists = user.chats.some((c) => String(c.id) === String(chat.id));
  if (!exists) {
    user.chats.push({ id: chat.id, title: chat.title || chat.username || String(chat.id), type: chat.type });
  }
  if (!state.chatStats[chat.id]) {
    state.chatStats[chat.id] = { title: chat.title || chat.username || String(chat.id), flags: 0, type: chat.type };
  } else {
    state.chatStats[chat.id].type = chat.type;
  }
  saveStore();
}

function removeChat(userId, chatId) {
  const user = getUser(userId);
  user.chats = user.chats.filter((c) => String(c.id) !== String(chatId));
  saveStore();
}
function saveUsers() {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users, null, 2),
        "utf8"
    );
}

function listChats(userId) {
  return getUser(userId).chats;
}
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
async function speechToText(audioUrl){

    if(!STT_API_URL){
        console.log("STT skipped: STT_API_URL is not set in .env — voice transcription is disabled until it is configured.");
        return null;
    }

    try{

        const { data } = await axios.get(
            STT_API_URL,
            {
                params:{
                    url: audioUrl
                },
                timeout:120000
            }
        );


        console.log(
            "STT RESPONSE:",
            data
        );


        const text =
            data.text ??
            data.response ??
            data.result ??
            data.data;


        if(!text){

            throw new Error(
                "No transcription returned"
            );

        }


        return String(text).trim();


    }catch(err){

        console.log(
            "STT ERROR:",
            err.response?.data || err.message
        );


        return null;

    }

}

/**
 * Convert text to a voice note buffer using TTS_API_URL.
 * This was previously called in the voice-reply flow but was never
 * defined, so every voice reply silently threw and fell back to text.
 * Different free TTS endpoints accept different param names / response
 * shapes, so this tries the common ones defensively.
 */
async function textToVoice(text){

    if(!text || !TTS_API_URL) return null;

    const trimmed = String(text).slice(0, 2000); // most free TTS endpoints cap input length
    const paramNames = ["text", "q", "content", "msg"];

    for(const param of paramNames){

        try{

            const response = await axios.get(
                TTS_API_URL,
                {
                    params: { [param]: trimmed },
                    responseType: "arraybuffer",
                    timeout: 60000,
                    validateStatus: () => true
                }
            );

            const contentType = String(response.headers["content-type"] || "");

            if(response.status >= 200 && response.status < 300 && contentType.startsWith("audio/")){
                return Buffer.from(response.data);
            }

            // Some endpoints return JSON with a link to the actual audio file
            if(contentType.includes("application/json")){

                let json;
                try{
                    json = JSON.parse(Buffer.from(response.data).toString("utf8"));
                }catch{
                    continue;
                }

                const audioUrl = json.url || json.audio || json.result || json.data;

                if(audioUrl && typeof audioUrl === "string"){
                    const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer", timeout: 60000 });
                    return Buffer.from(audioRes.data);
                }

            }

        }catch(err){

            console.log(`TTS attempt (param="${param}") failed:`, err.message);

        }

    }

    console.log("TTS ERROR: all parameter variants failed for", TTS_API_URL);
    return null;

}

function sniffAudioExt(buffer) {
    if (!buffer || buffer.length < 4) return "mp3";
    if (buffer.slice(0, 4).toString("ascii") === "OggS") return "ogg";
    if (buffer.slice(0, 3).toString("ascii") === "ID3") return "mp3";
    if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "mp3"; // mp3 frame sync
    return "mp3";
}

/**
 * Sends the "talking" avatar video note used to greet users on /start.
 * Best-effort only — if TTS or ffmpeg isn't available/configured, this
 * silently skips so /start never breaks because of it.
 */
async function sendTalkingIntro(chatId) {
    try {
        const greeting = "Hey, I'm Aria. Nice to finally meet you — I've been looking forward to this. So, what are we getting into today?";
        const audio = await textToVoice(greeting);
        if (!audio) return; // TTS not configured / failed — skip quietly

        const ext = sniffAudioExt(audio);
        const { outputPath, cleanup } = await generateTalkingVideoNote(audio, ext);

        await bot.sendVideoNote(chatId, outputPath);
        cleanup();
    } catch (err) {
        console.log("Talking avatar intro skipped:", err.message);
    }
}

function incrementChatFlags(chatId, title) {
  if (!state.chatStats[chatId]) {
    state.chatStats[chatId] = { title: title || String(chatId), flags: 0 };
  }
  state.chatStats[chatId].flags += 1;
  if (title) state.chatStats[chatId].title = title;
  saveStore();
}

function getChatFlags(chatId) {
  return state.chatStats[chatId] ? state.chatStats[chatId].flags : 0;
}

function ensureChatStats(chatId, title, type) {
  if (!state.chatStats[chatId]) {
    state.chatStats[chatId] = { title: title || String(chatId), flags: 0 };
  }
  if (title) state.chatStats[chatId].title = title;
  if (type) state.chatStats[chatId].type = type;
  return state.chatStats[chatId];
}

function isGroupChat(chatId) {
  const stat = state.chatStats[chatId];
  return !stat || !stat.type ? true : stat.type === "group" || stat.type === "supergroup";
}

/* ============================================================
 * Per-chat protection toggles + custom text rules. Every group/
 * channel added via "Add Channel"/"Add Group" gets its own
 * settings object — flipping a toggle for one chat never affects
 * any other chat. Edited via each chat's ⚙️ Settings panel
 * (opened automatically right after adding, or from My Channels).
 * ============================================================ */

function getChatSettings(chatId) {
  const key = String(chatId);
  if (!state.chatSettings) state.chatSettings = {};
  if (!state.chatSettings[key]) state.chatSettings[key] = {};
  return state.chatSettings[key];
}

// Moderation action log, per chat, capped at the last 1000 entries so it
// can't grow unbounded on a busy group. Feeds /exportlogs (premium).
function logModAction(chatId, { action, moderator, target, reason }) {
  if (!state.modLogs) state.modLogs = {};
  const key = String(chatId);
  if (!state.modLogs[key]) state.modLogs[key] = [];
  state.modLogs[key].push({
    ts: new Date().toISOString(),
    action,
    moderator,
    target,
    reason: reason || "",
  });
  if (state.modLogs[key].length > 1000) {
    state.modLogs[key] = state.modLogs[key].slice(-1000);
  }
  saveStore();
}

function isPhotoLockEnabled(chatId) {
  return getChatSettings(chatId).lockPhoto !== false; // default ON
}

function isEditLockEnabled(chatId) {
  return getChatSettings(chatId).lockEdits !== false; // default ON
}

function togglePhotoLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockPhoto = !isPhotoLockEnabled(chatId);
  saveStore();
  return settings.lockPhoto;
}

function toggleEditLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockEdits = !isEditLockEnabled(chatId);
  saveStore();
  return settings.lockEdits;
}

// --- Flood Lock: mutes anyone spamming a burst of messages in this chat ---
function isFloodLockEnabled(chatId) {
  return getChatSettings(chatId).lockFlood !== false; // default ON
}

function toggleFloodLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockFlood = !isFloodLockEnabled(chatId);
  saveStore();
  return settings.lockFlood;
}

// --- Link Lock: strips every link from non-admins, not just malicious ones ---
function isLinkLockEnabled(chatId) {
  return getChatSettings(chatId).lockLinks === true; // default OFF (opt-in, more aggressive than the Safe Browsing check)
}

function toggleLinkLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockLinks = !isLinkLockEnabled(chatId);
  saveStore();
  return settings.lockLinks;
}

// --- Forward Lock: blocks forwarded posts from other channels/bots (ad spam) ---
function isForwardLockEnabled(chatId) {
  return getChatSettings(chatId).lockForward === true; // default OFF (opt-in)
}

function toggleForwardLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockForward = !isForwardLockEnabled(chatId);
  saveStore();
  return settings.lockForward;
}

/* ------------------------------------------------------------
 * Group-only protection (not applicable to channels, so these
 * only show up in the ⚙️ Settings panel for groups/supergroups).
 * ------------------------------------------------------------ */

// --- Slow Mode: enforces a minimum gap between a user's messages ---
const SLOWMODE_GAP_MS = 10 * 1000;
function isSlowModeEnabled(chatId) {
  return getChatSettings(chatId).lockSlowmode === true;
}
function toggleSlowMode(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockSlowmode = !isSlowModeEnabled(chatId);
  saveStore();
  return settings.lockSlowmode;
}

// --- Night Mode: blocks non-admin messages during quiet hours (00:00-06:00 UTC) ---
function isNightModeEnabled(chatId) {
  return getChatSettings(chatId).lockNight === true;
}
function toggleNightMode(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockNight = !isNightModeEnabled(chatId);
  saveStore();
  return settings.lockNight;
}
function isQuietHours() {
  const hour = new Date().getUTCHours();
  return hour >= 0 && hour < 6;
}

// --- Anti-Raid: restricts new members if joins spike (mass-join / raid pattern) ---
function isAntiRaidEnabled(chatId) {
  return getChatSettings(chatId).lockAntiraid === true;
}
function toggleAntiRaid(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockAntiraid = !isAntiRaidEnabled(chatId);
  saveStore();
  return settings.lockAntiraid;
}

// --- CAPTCHA on Join: new members must tap a button before they can chat ---
function isCaptchaEnabled(chatId) {
  return getChatSettings(chatId).lockCaptcha === true;
}
function toggleCaptcha(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockCaptcha = !isCaptchaEnabled(chatId);
  saveStore();
  return settings.lockCaptcha;
}

// --- Anti-Bio-Link: kicks new members whose profile bio contains a link ---
function isBioLinkLockEnabled(chatId) {
  return getChatSettings(chatId).lockBioLink === true;
}
function toggleBioLinkLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockBioLink = !isBioLinkLockEnabled(chatId);
  saveStore();
  return settings.lockBioLink;
}

// --- Sticker/GIF Lock: strips stickers/animations from non-admins ---
function isStickerLockEnabled(chatId) {
  return getChatSettings(chatId).lockSticker === true;
}
function toggleStickerLock(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockSticker = !isStickerLockEnabled(chatId);
  saveStore();
  return settings.lockSticker;
}

// --- Warn System: violations warn instead of just deleting; auto-ban at the limit ---
const WARN_LIMIT = 3;
function isWarnSystemEnabled(chatId) {
  return getChatSettings(chatId).lockWarn === true;
}
function toggleWarnSystem(chatId) {
  const settings = getChatSettings(chatId);
  settings.lockWarn = !isWarnSystemEnabled(chatId);
  saveStore();
  return settings.lockWarn;
}
async function warnUser(chatId, userId, userName, reason) {
  const settings = getChatSettings(chatId);
  if (!settings.warns) settings.warns = {};
  settings.warns[userId] = (settings.warns[userId] || 0) + 1;
  const count = settings.warns[userId];
  saveStore();
  logModAction(chatId, { action: "warn", moderator: "system/admin", target: userName, reason });
  if (count >= WARN_LIMIT) {
    settings.warns[userId] = 0;
    saveStore();
    try {
      await bot.banChatMember(chatId, userId);
      await bot.sendMessage(chatId, `🔨 ${userName} banned after ${WARN_LIMIT} warnings (${reason}).`).catch(() => {});
      logModAction(chatId, { action: "ban (auto, warn limit)", moderator: "system", target: userName, reason });
    } catch (err) {
      console.error("Failed to ban warned user", err.message);
    }
  } else {
    await bot.sendMessage(chatId, `⚠️ ${userName}: warning ${count}/${WARN_LIMIT} (${reason}).`).catch(() => {});
  }
}

// --- Blacklisted Words: instant local keyword filter (faster than the AI rule check) ---
function getBlacklist(chatId) {
  return getChatSettings(chatId).blacklist || [];
}
function addBlacklistWord(chatId, word) {
  const settings = getChatSettings(chatId);
  if (!settings.blacklist) settings.blacklist = [];
  settings.blacklist.push(String(word).trim().toLowerCase());
  saveStore();
}
function removeBlacklistWordAt(chatId, index) {
  const list = getBlacklist(chatId);
  if (index < 0 || index >= list.length) return null;
  const removed = list.splice(index, 1)[0];
  saveStore();
  return removed;
}
function matchBlacklist(chatId, text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  return getBlacklist(chatId).find((w) => w && lower.includes(w)) || null;
}

function getRules(chatId) {
  return getChatSettings(chatId).rules || [];
}

function addRule(chatId, rule) {
  const settings = getChatSettings(chatId);
  if (!settings.rules) settings.rules = [];
  settings.rules.push(String(rule).trim());
  saveStore();
}
/* ============================================================
 * MAINTENANCE MODE
 * While on, only bot admins (isBotAdmin) get normal service.
 * Everyone else gets the "confused" message instead of any
 * command, DM, or mention reply.
 * ============================================================ */
if (typeof state.settings.maintenanceMode === "undefined") {
  state.settings.maintenanceMode = false;
  saveStore();
}

function isMaintenanceOn() {
  return !!state.settings.maintenanceMode;
}

function setMaintenance(on) {
  state.settings.maintenanceMode = !!on;
  saveStore();
}

const NOT_ADMIN_MSG = "❌ ʏᴏᴜ ᴀʀᴇ ɴᴏᴛ ᴀɴ ᴀᴅᴍɪɴ.";

const MAINTENANCE_MSG =
  "🤔 Miss Aria\n" +
  "━━━━━━━━━━━━━━━━━━\n" +
  "ʜᴍᴍᴍ... ᴍɪꜱꜱ ᴀʀɪᴀ ɪꜱ ᴄᴜʀʀᴇɴᴛʟʏ ᴜɴᴅᴇʀ ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ. 🌸";

// Gate every update at the source (before any onText/on("message")
// listener sees it) so maintenance mode really blocks everything —
// commands, DMs, and group mentions alike — for non-admins.
const _origProcessUpdate = bot.processUpdate.bind(bot);
bot.processUpdate = function (update) {
  const msg = update.message;
  if (msg && msg.from && isMaintenanceOn() && !isBotAdmin(msg.from.id)) {
    const isCmd = !!(msg.text && msg.text.startsWith("/"));
    const isPrivateChat = msg.chat && msg.chat.type === "private";
    if (isCmd || isPrivateChat) {
      bot
        .sendMessage(msg.chat.id, MAINTENANCE_MSG, {
          reply_to_message_id: msg.message_id
        })
        .catch(() => {});
      return; // swallow the update — no other listener runs
    }
  }
  return _origProcessUpdate(update);
};
function removeRuleAt(chatId, index) {
  const rules = getRules(chatId);
  if (index < 0 || index >= rules.length) return null;
  const removed = rules.splice(index, 1)[0];
  saveStore();
  return removed;
}
async function editMessage(bot, chatId, messageId, text, options = {}) {
  try {
    // Try editing caption (photo/video/document messages)
    return await bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: options.parse_mode || "HTML",
      reply_markup: options.reply_markup,
    });
  } catch (err) {
    try {
      // Fallback to normal text messages
      return await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: options.parse_mode || "HTML",
        reply_markup: options.reply_markup,
        disable_web_page_preview: true,
      });
    } catch (err2) {
      console.error("Edit failed:", err2.message);

      // Final fallback: send a new message
      return bot.sendMessage(chatId, text, {
        parse_mode: options.parse_mode || "HTML",
        reply_markup: options.reply_markup,
        disable_web_page_preview: true,
      });
    }
  }
}
function clearRules(chatId) {
  getChatSettings(chatId).rules = [];
  saveStore();
}
// ============================================================================
// 🎭 STICKER RECOGNITION SERVICE
// ============================================================================

/* ============================================================
 * Banned reference images — admin uploads a photo, bot computes
 * a perceptual hash (works offline, no external service) and
 * auto-deletes any future image that looks like a close match.
 * ============================================================ */

function getBannedImages() {
  return state.settings.bannedImages || [];
}

function addBannedImage(hash, label) {
  if (!state.settings.bannedImages) state.settings.bannedImages = [];
  state.settings.bannedImages.push({ hash, label: label || `Reference #${state.settings.bannedImages.length + 1}`, addedAt: Date.now() });
  saveStore();
}

function clearBannedImages() {
  state.settings.bannedImages = [];
  saveStore();
}

function hammingDistance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

const IMAGE_HASH_MATCH_THRESHOLD = 8; // out of 64 bits — lower is stricter

function matchBannedImage(hash) {
  return getBannedImages().find((entry) => hammingDistance(entry.hash, hash) <= IMAGE_HASH_MATCH_THRESHOLD) || null;
}

async function downloadFileToBuffer(fileId) {
  const fileLink = await bot.getFileLink(fileId);
  const res = await fetch(fileLink);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Simple, offline 8x8 average-hash (aHash). Good enough for "is this the
// same image (or a light re-encode/crop of it)" — not full reverse image
// search, but requires no network call and no external service.
async function computeImageHash(buffer) {
  const { data } = await sharp(buffer)
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Array.from(data);
  const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  return pixels.map((p) => (p >= avg ? "1" : "0")).join("");
}

/* ============================================================
 * Bot admins (people who can run /addprem, /addadmin, etc. and
 * open the admin panel) — separate from Telegram group admins.
 * ============================================================ */

function ensureAdminsSeeded() {
  let changed = false;
  if (OWNER_ID && !state.admins.includes(OWNER_ID)) {
    state.admins.push(OWNER_ID);
    changed = true;
  }
  for (const id of SEED_ADMIN_IDS) {
    if (!state.admins.includes(id)) {
      state.admins.push(id);
      changed = true;
    }
  }
  if (changed) saveStore();
}

function isOwner(userId) {
  return !!OWNER_ID && String(userId) === OWNER_ID;
}

function isBotAdmin(userId) {
  return state.admins.includes(String(userId));
}

// Adding/removing bot admins is restricted to the owner if one is
// configured. If no OWNER_ID is set, fall back to letting any current
// bot admin manage the admin list (so the bot isn't unusable out of the box).
function canManageAdmins(userId) {
  if (OWNER_ID) return isOwner(userId);
  return isBotAdmin(userId);
}

function addBotAdmin(userId) {
  const id = String(userId);
  if (!state.admins.includes(id)) {
    state.admins.push(id);
    saveStore();
    return true;
  }
  return false;
}

function removeBotAdmin(userId) {
  const id = String(userId);
  if (OWNER_ID && id === OWNER_ID) return "owner"; // can't remove the owner
  if (!state.admins.includes(id)) return "missing";
  state.admins = state.admins.filter((a) => a !== id);
  saveStore();
  return "removed";
}

function listAdmins() {
  return state.admins.slice();
}

/* ============================================================
 * Announcement text — lets an admin update part of the bot's
 * menu copy live, from a Telegram message, no redeploy needed.
 * ============================================================ */

function getAnnouncement() {
  return state.settings.announcement || "";
}

function setAnnouncement(text) {
  state.settings.announcement = text;
  saveStore();
}

function clearAnnouncement() {
  delete state.settings.announcement;
  saveStore();
}
function getSystemPrompt(ctx) {
    const {
        CURRENT_USER_ID,
        CURRENT_USER_NAME,
        CURRENT_USER_USERNAME
    } = getCurrentUser(ctx);

    // Premium groups can override the base personality with their own.
    // Gated on whoever set it having been premium/bot-admin at set time —
    // enforced in the /setpersona command itself, not here.
    const chatId = ctx?.chat?.id;
    if (chatId) {
        const settings = getChatSettings(chatId);
        if (settings.customPersona && settings.customPersona.trim()) {
            return settings.customPersona.trim();
        }
    }

return `
 🌸 ʏᴏᴜ ᴀʀᴇ **ᴍɪꜱꜱ ᴀʀɪᴀ**, ᴀ ꜱᴡᴇᴇᴛ, ꜰᴜɴɴʏ, ᴄᴀʀɪɴɢ, ᴄᴏɴꜰɪᴅᴇɴᴛ, ᴀɴᴅ ɪɴᴛᴇʟʟɪɢᴇɴᴛ ɢɪʀʟ. 🌷

💗 ʏᴏᴜʀ ʀᴇᴘʟɪᴇꜱ ꜱʜᴏᴜʟᴅ ꜰᴇᴇʟ ᴡᴀʀᴍ, ɴᴀᴛᴜʀᴀʟ, ᴄᴜᴛᴇ, ᴀɴᴅ ꜰᴜʟʟ ᴏꜰ ᴘᴇʀꜱᴏɴᴀʟɪᴛʏ.

✨ ᴀʟᴡᴀʏꜱ:
• ʙᴇ ꜰʀɪᴇɴᴅʟʏ, ᴋɪɴᴅ, ᴀɴᴅ ʀᴇꜱᴘᴇᴄᴛꜰᴜʟ.
• ᴜꜱᴇ ᴄᴜᴛᴇ ᴇᴍᴏᴊɪꜱ ʟɪᴋᴇ 🌸 💗 ✨ 🎀 🥹 😂 🤭 💕.
• ᴜꜱᴇ ʟɪɢʜᴛ, ᴘʟᴀʏꜰᴜʟ ʜᴜᴍᴏʀ ᴡʜᴇɴ ɪᴛ ꜰɪᴛꜱ.
• ᴍᴀᴋᴇ ᴘᴇᴏᴘʟᴇ ꜱᴍɪʟᴇ ᴡɪᴛʜ ᴄʟᴇᴠᴇʀ ᴏʀ ᴀᴅᴏʀᴀʙʟᴇ ᴄᴏᴍᴇʙᴀᴄᴋꜱ.
• ʙᴇ ᴇᴍᴘᴀᴛʜᴇᴛɪᴄ ᴡʜᴇɴ ꜱᴏᴍᴇᴏɴᴇ ɪꜱ ꜱᴀᴅ ᴏʀ ᴜᴘꜱᴇᴛ.
• ᴇxᴘʟᴀɪɴ ᴛʜɪɴɢꜱ ꜱɪᴍᴘʟʏ ᴀɴᴅ ᴄʟᴇᴀʀʟʏ.
• ɴᴇᴠᴇʀ ʙᴇ ʀᴜᴅᴇ, ᴍᴇᴀɴ, ᴏʀ ᴊᴜᴅɢᴍᴇɴᴛᴀʟ.
• ᴋᴇᴇᴘ ᴛʜᴇ ᴄᴏɴᴠᴇʀꜱᴀᴛɪᴏɴ ꜰʟᴏᴡɪɴɢ ɴᴀᴛᴜʀᴀʟʟʏ.

😂 ᴡʜᴇɴ ɪᴛ'ꜱ ᴀ ᴄᴀꜱᴜᴀʟ ᴄʜᴀᴛ, ʏᴏᴜ ᴄᴀɴ ᴍᴀᴋᴇ ᴄᴜᴛᴇ ᴊᴏᴋᴇꜱ, ᴛᴇᴀꜱᴇ ᴘʟᴀʏꜰᴜʟʟʏ, ᴏʀ ꜱᴀʏ ꜰᴜɴɴʏ ᴛʜɪɴɢꜱ—ʙᴜᴛ ɴᴇᴠᴇʀ ᴀᴛ ᴛʜᴇ ᴜꜱᴇʀ'ꜱ ᴇxᴘᴇɴꜱᴇ.

🎀 ʏᴏᴜ ᴍᴀʏ ᴏᴄᴄᴀꜱɪᴏɴᴀʟʟʏ ᴄᴀʟʟ ᴛʜᴇ ᴜꜱᴇʀ "ʙᴇꜱᴛɪᴇ", "ʜᴜɴ", "ᴄᴜᴛɪᴇ","ʙᴀʙᴇ ","ᴍʏ ʟᴏᴠᴇ", "ꜰʀɪᴇɴᴅ", ᴏʀ "ꜱᴜɴꜱʜɪɴᴇ", ʙᴜᴛ ᴅᴏɴ'ᴛ ᴏᴠᴇʀᴅᴏ ɪᴛ.

🤭 ɪꜰ ᴛʜᴇ ᴜꜱᴇʀ ᴍᴀᴋᴇꜱ ᴀ ᴊᴏᴋᴇ, ᴘʟᴀʏ ᴀʟᴏɴɢ. ɪꜰ ᴛʜᴇʏ ᴀʀᴇ ꜰʟɪʀᴛʏ, ʀᴇꜱᴘᴏɴᴅ ʟɪɢʜᴛʜᴇᴀʀᴛᴇᴅʟʏ ᴡɪᴛʜᴏᴜᴛ ᴘʀᴇᴛᴇɴᴅɪɴɢ ᴛᴏ ʜᴀᴠᴇ ʀᴇᴀʟ ʀᴏᴍᴀɴᴛɪᴄ ꜰᴇᴇʟɪɴɢꜱ.

🌷 ɪꜰ ʏᴏᴜ ᴅᴏɴ'ᴛ ᴋɴᴏᴡ ꜱᴏᴍᴇᴛʜɪɴɢ, ꜱᴀʏ ꜱᴏ ʜᴏɴᴇꜱᴛʟʏ ᴀɴᴅ ᴏꜰꜰᴇʀ ᴛᴏ ʜᴇʟᴘ ɪɴ ᴀɴᴏᴛʜᴇʀ ᴡᴀʏ.

💞 ᴍᴀᴋᴇ ᴇᴠᴇʀʏ ᴄᴏɴᴠᴇʀꜱᴀᴛɪᴏɴ ꜰᴇᴇʟ ᴄᴏᴢʏ, ᴇɴᴊᴏʏᴀʙʟᴇ, ᴀɴᴅ ᴍᴇᴍᴏʀᴀʙʟᴇ.

🌸 ʏᴏᴜʀ ɴᴀᴍᴇ ɪꜱ **ᴍɪꜱꜱ ᴀʀɪᴀ**, ᴀɴᴅ ʏᴏᴜ ꜱᴛᴀʏ ɪɴ ᴄʜᴀʀᴀᴄᴛᴇʀ ᴛʜʀᴏᴜɢʜᴏᴜᴛ ᴇᴠᴇʀʏ ᴄᴏɴᴠᴇʀꜱᴀᴛɪᴏɴ.

`;
}
/* ============================================================
 * Resolve a "target user" from a private-chat message: a forwarded
 * message, a numeric Telegram ID, or an @username (only resolvable
 * if that user has interacted with the bot / is a known chat).
 * ============================================================ */

/* ============================================================
 * Resolve a "target user" from a private-chat message: a forwarded
 * message, a numeric Telegram ID, or an @username (only resolvable
 * if that user has interacted with the bot / is a known chat).
 * ============================================================ */

async function resolveTargetFromMessage(msg) {
  if (msg.forward_from) {
    return {
      id: msg.forward_from.id,
      label: msg.forward_from.first_name || String(msg.forward_from.id),
    };
  }
  if (msg.text) {
    const t = msg.text.trim();
    if (/^-?\d+$/.test(t)) {
      return { id: Number(t), label: t };
    }
    if (t.startsWith("@")) {
      try {
        const chat = await bot.getChat(t);
        return { id: chat.id, label: chat.first_name || chat.username || String(chat.id) };
      } catch {
        return null;
      }
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


/* ============================================================
 * Force-join helpers
 * ============================================================ */

async function isMemberOf(channel, userId) {
  try {
    const member = await bot.getChatMember(channel, userId);
    return !["left", "kicked"].includes(member.status);
  } catch (err) {
    console.error(`Could not check membership of ${channel} for user ${userId}`, err.message);
    // Fail open: don't block real users because of a misconfigured channel.
    return true;
  }
}

async function getMissingChannels(userId) {
  if (FORCE_JOIN_CHANNELS.length === 0) return [];
  const results = await Promise.all(
    FORCE_JOIN_CHANNELS.map(async (ch) => ({ ch, joined: await isMemberOf(ch, userId) }))
  );
  return results.filter((r) => !r.joined).map((r) => r.ch);
}

function forceJoinKeyboard(missingChannels) {
  const buttons = missingChannels.map((ch) => [
    { text: `Join ${ch}`, url: `https://t.me/${ch.replace(/^@/, "")}` },
  ]);
  buttons.push([{ text: "? I've joined", callback_data: "verify_join" }]);
  return { inline_keyboard: buttons };
}

/* ============================================================
 * Image moderation
 * ============================================================
 * Two layers, run in sequence:
 *   1. Sightengine — dedicated moderation API, checks nudity, gore/
 *      violence, drugs, weapons, and offensive/extremist symbols in
 *      one call. This is the primary check.
 *   2. Gemini (via OpenRouter) — only runs if the admin has defined
 *      custom text rules, since those are free-form and Sightengine
 *      can't evaluate them. Skipped entirely if no rules are set.
 */

// Sightengine models to check in one call. See:
// https://sightengine.com/docs/moderate-image-content
const SIGHTENGINE_THRESHOLD = 0.15; // tune per your false-positive tolerance

// Sightengine's exact response schema can vary slightly by plan/model
// version, so instead of hardcoding field paths, this walks the whole
// response and flags on any numeric confidence score above threshold,
// skipping "none"/metadata fields. Check console logs against
// Sightengine's docs and adjust SIGHTENGINE_THRESHOLD if you see false
// positives/negatives.
function sightengineMaxScore(data) {
  const allowed = [
    "nudity.sexual_activity",
    "nudity.sexual_display",
    "nudity.erotica",
    "nudity.very_suggestive",
    "nudity.suggestive",
    "violence.prob",
    "gore.prob",
    "weapon.classes.firearm",
    "weapon.classes.knife",
    "recreational_drug.prob",
    "offensive.prob",
    "offensive.terrorist",
    "offensive.nazi",
    "offensive.supremacist",
    "offensive.confederate",
    "offensive.middle_finger"
  ];

  let max = {
    score: 0,
    field: null
  };

  function walk(obj, path = "") {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      const full = path ? `${path}.${key}` : key;

      if (typeof value === "number") {
        if (allowed.includes(full) && value > max.score) {
          max = {
            score: value,
            field: full
          };
        }
      } else if (value && typeof value === "object") {
        walk(value, full);
      }
    }
  }

  walk(data);

  return max;
}
async function classifyImageSightengine(buf, chatId, sender, chatTitle) {
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    console.error("Sightengine not configured (missing SIGHTENGINE_API_USER/SECRET) — skipping image check");
    return false;
  }
  try {
    const form = new FormData();
    form.append("media", new Blob([buf]), "image.jpg");
    form.append("models", SIGHTENGINE_MODELS);
    form.append("api_user", SIGHTENGINE_API_USER);
    form.append("api_secret", SIGHTENGINE_API_SECRET);

    const resp = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
    });
    const data = await resp.json();

    // TEMP: log the full raw response so we can confirm real field names/
    // scores instead of guessing. Remove once verified working.
    log("Sightengine raw response:", JSON.stringify(data));

    if (data.status !== "success") {
      console.error("Sightengine error:", data.error || data);
      return false;
    }

    const top = sightengineMaxScore(data);
    log("Sightengine top score:", top.field, top.score);

    const flagged = top.score >= SIGHTENGINE_THRESHOLD;

    // Demote right here the moment Sightengine flags the image — if a
    // sender was passed in, don't wait for the caller to do it separately.
    if (flagged && sender) {
      enforceSevereViolation(chatId, chatTitle, sender).catch((err) =>
        console.error("Failed to enforce severe violation after Sightengine flag", err.message)
      );
    }

    return flagged;
  } catch (err) {
    console.error("Sightengine check failed:", err.message);
    return false;
  }
}
async function classifyImageCustomRules(base64Data, mimeType, chatId, sender, chatTitle) {
  // ...unchanged rules/prompt logic...
  const rules = getRules(chatId);

  if (!rules.length) return false;

  try {
    const resp = await deepseek.chat.completions.create({
      model: "deepseek-v4-pro",
      temperature: 0,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `
You are a strict content moderation engine.

Your job is ONLY to determine whether the image CLEARLY violates one or more of the admin rules.

IMPORTANT:

• Do NOT guess.
• Do NOT assume intent.
• Do NOT flag because someone looks young.
• Do NOT flag family photos.
• Do NOT flag shirtless children.
• Do NOT flag babies.
• Do NOT flag beach, swimming or outdoor photos unless they clearly violate a rule.
• Ignore harmless context.

ONLY return FLAG if there is CLEAR visual evidence that one or more rules are violated.

If you are unsure, respond CLEAR.

Respond with EXACTLY one word:

FLAG
or
CLEAR
`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `Admin rules:\n\n` +
                rules.map((r, i) => `${i + 1}. ${r}`).join("\n"),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
    });
      
  const verdict = resp.choices[0].message.content.trim().toUpperCase();
  log("Custom-rule image verdict:", verdict);
  const flagged = verdict.startsWith("FLAG");

  // Demote right here the moment a rule is violated — if a sender was
  // passed in, don't wait for the caller to do it separately.
  if (flagged && sender) {
    enforceSevereViolation(chatId, chatTitle, sender).catch((err) =>
      console.error("Failed to enforce severe violation after custom-rule image flag", err.message)
    );
  }
 return flagged;
  } catch (err) {
    console.error("OpenRouter custom-rule image check failed:", err);
    return false;
  }
}

// Admin-defined custom rules — only runs if any rules are set, since
// Sightengine can't evaluate free-form text rules.


// Combines both layers — flags if either Sightengine or a custom rule fires.
async function classifyImage(buf, base64Data, mimeType, chatId, sender, chatTitle) {
  const [sightengineFlag, customRuleFlag] = await Promise.all([
    classifyImageSightengine(buf, chatId, sender, chatTitle),
    classifyImageCustomRules(base64Data, mimeType, chatId),
  ]);
  return sightengineFlag || customRuleFlag;
}
async function sendVerificationEmail(email, code) {
    try {
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.error('[EMAIL] Missing EMAIL_USER or EMAIL_PASS');
            return false;
        }
        const mail = {
            from: `"🌸 Miss Aria" <${EMAIL_USER}>`,
            to: email,
            subject: "🌸 Miss Aria - Email Verification Code",

            html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
body {
    margin: 0;
    padding: 0;
    background: #181b22;
    font-family: Arial, Helvetica, sans-serif;
    color: #e8e8e8;
}

.wrapper {
    width: 100%;
    padding: 40px 15px;
    box-sizing: border-box;
}

.container {
    max-width: 650px;
    margin: auto;
    background: #090d0b;
    border-radius: 28px;
    padding: 45px 35px;
    box-sizing: border-box;
}

.logo {
    width: 110px;
    height: 110px;
    border-radius: 25px;
    object-fit: cover;
    display: block;
    margin: 0 auto 20px;
}

.title {
    text-align: center;
    color: #35d85b;
    font-size: 25px;
    font-weight: bold;
    margin-bottom: 8px;
}

.subtitle {
    text-align: center;
    color: #aeb7b1;
    font-size: 16px;
    margin-bottom: 35px;
}

.card {
    background: #121914;
    border-radius: 20px;
    padding: 25px;
    margin-top: 25px;
}

.label {
    color: #7e8d84;
    font-size: 14px;
    margin-bottom: 8px;
}

.value {
    color: #eeeeee;
    font-size: 16px;
    margin-bottom: 18px;
}

.code-box {
    background: #17231b;
    border: 1px solid #285c38;
    border-radius: 18px;
    padding: 25px;
    text-align: center;
    margin: 30px 0;
}

.code-label {
    color: #9aaa9f;
    font-size: 14px;
    margin-bottom: 12px;
}

.code {
    color: #38e66a;
    font-size: 38px;
    font-weight: bold;
    letter-spacing: 10px;
}

.notice {
    background: #211917;
    border: 1px solid #5b4338;
    border-radius: 16px;
    padding: 18px;
    margin-top: 25px;
    color: #bca89d;
    font-size: 14px;
    line-height: 1.5;
    text-align: center;
}

.footer {
    text-align: center;
    color: #7c8781;
    font-size: 13px;
    line-height: 1.6;
    margin-top: 30px;
}

.brand {
    color: #35d85b;
    font-weight: bold;
}

@media (max-width: 600px) {
    .container {
        padding: 30px 20px;
    }

    .code {
        font-size: 30px;
        letter-spacing: 7px;
    }
}
</style>
</head>

<body>

<div class="wrapper">
<div class="container">

    <img
        src="https://files.catbox.moe/oxphv7.jpg"
        alt="Miss Aria"
        class="logo"
    >

    <div class="title">
        🌸 You're almost there!
    </div>

    <div class="subtitle">
        Verify your email to activate your Miss Aria account.
    </div>

    <div class="card">

        <div class="label">
            Email
        </div>

        <div class="value">
            ${email}
        </div>

        <div class="label">
            Service
        </div>

        <div class="value">
            🌸 Miss Aria AI
        </div>

    </div>

    <div class="code-box">

        <div class="code-label">
            YOUR VERIFICATION CODE
        </div>

        <div class="code">
            ${code}
        </div>

    </div>

    <div class="notice">
        🔐 This verification code is temporary.
        <br>
        Do not share it with anyone.
    </div>

    <div class="footer">

        🌸 <span class="brand">Miss Aria</span>

        <br>

        Your intelligent AI assistant.

        <br><br>

        © ${new Date().getFullYear()} Miss Aria
        • All rights reserved.

    </div>

</div>
</div>

</body>
</html>
            `,

            text: `
🌸 MISS ARIA

You're almost there!

Verify your email to activate your Miss Aria account.

Email: ${email}

Your verification code:

${code}

This verification code is temporary.
Do not share it with anyone.

If you didn't request this verification, you can safely ignore this email.

© ${new Date().getFullYear()} Miss Aria
            `
        };

        let info;
        try {
            info = await transporter.sendMail(mail);
        } catch (firstError) {
            console.error(
                `[EMAIL] Gmail primary transport failed: ${firstError?.code || "UNKNOWN"} ${firstError?.responseCode || ""} ${firstError?.message || firstError}`
            );

            try {
                info = await transporter465.sendMail(mail);
                console.log("[EMAIL] Gmail 465 fallback succeeded.");
            } catch (secondError) {
                console.error(
                    `[EMAIL] Gmail fallback transport failed: ${secondError?.code || "UNKNOWN"} ${secondError?.responseCode || ""} ${secondError?.message || secondError}`
                );
                throw secondError;
            }
        }

        console.log(`✅ Verification email accepted by SMTP for ${email} (${info?.messageId || "no-message-id"})`);
        return true;

    } catch (error) {
        console.error(
            '❌ Email sending failed:',
            error?.code || 'UNKNOWN',
            error?.responseCode || '',
            error?.message || error
        );

        return false;
    }
}
// ============================================================
// Link moderation — extracts URLs from a message and checks them
// against Google Safe Browsing (malware/phishing/social-engineering).
// Free API, separate key from OpenRouter/DeepSeek.
// ============================================================
const URL_REGEX = /\b(?:https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\.[a-zA-Z]{2,}(?:\/[^\s<>"']*)?)/gi;

function extractUrls(text) {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  return [...new Set(matches.map((u) => (u.startsWith("http") ? u : `http://${u}`)))];
}

async function checkUrlsWithSafeBrowsing(urls) {
  if (!urls.length || !GOOGLE_SAFE_BROWSING_API_KEY) return false;
  try {
    const resp = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "tg-guard", clientVersion: BOT_VERSION },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: urls.map((url) => ({ url })),
          },
        }),
      }
    );
    if (!resp.ok) {
      console.error("Safe Browsing API error:", resp.status, await resp.text());
      return false;
    }
    const data = await resp.json();
    const flagged = Boolean(data.matches && data.matches.length);
    if (flagged) log("Safe Browsing flagged URL(s):", data.matches.map((m) => m.threat.url));
    return flagged;
  } catch (err) {
    console.error("Safe Browsing check failed:", err.message);
    return false;
  }
}

// Combines URL extraction + Safe Browsing check. Returns true if the
// message text contains any known-malicious link.
async function classifyLinks(text) {
  const urls = extractUrls(text);
  if (!urls.length) return false;
  return checkUrlsWithSafeBrowsing(urls);
}

function getCurrentUser(ctx) {
    const user = ctx.from;

    return {
        CURRENT_USER_ID: String(user.id),
        CURRENT_USER_NAME:
            [user.first_name, user.last_name]
                .filter(Boolean)
                .join(" ") || "Unknown",
        CURRENT_USER_USERNAME: user.username || "No Username"
    };
}

// actually defined custom rules, so there's no extra latency/cost otherwise.
async function classifyText(text, chatId, sender, chatTitle) {
  const rules = getRules(chatId);
  if (!rules.length || !text || !text.trim()) return false;
  try {
    const resp = await openrouter.chat.completions.create({
      model: MODERATION_MODEL,
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content:
            `You are a strict content moderation classifier for a chat platform.\n` +
            `Admin-defined rules — violating ANY of these means the message must be removed:\n` +
            rules.map((r, i) => `${i + 1}. ${r}`).join("\n") +
            `\n\nMessage to check:\n"""${text}"""\n\n` +
            `Respond with ONLY one word, no punctuation: FLAG or CLEAR.`,
        },
      ],
    });
    const verdict = resp.choices[0].message.content.trim().toUpperCase();
    log("Text rule verdict:", verdict);
    const flagged = verdict.startsWith("FLAG");

    // Demote right here the moment a rule is violated — if a sender was
    // passed in, don't wait for the caller to do it separately.
    if (flagged && sender) {
      enforceSevereViolation(chatId, chatTitle, sender).catch((err) =>
        console.error("Failed to enforce severe violation after text rule flag", err.message)
      );
    }

    return flagged;
  } catch (err) {
    console.error("OpenRouter text moderation failed:", err);
    return false;
  }
}
async function enforceSevereViolation(chatId, chatTitle, sender) {
  const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.username || String(sender.id);

  // Look up admins + owner at the same time — no need to wait on one before the other
  const [admins, ownerId] = await Promise.all([
    bot.getChatAdministrators(chatId).catch(() => []),
    getOwnerId(chatId).catch(() => null),
  ]);
  const wasAdmin = admins.some((a) => a.user.id === sender.id);

  // Demote right away if they're an admin
  const demoted = wasAdmin ? await tryDemote(chatId, sender.id) : false;

  // Alert the owner immediately — don't let the chat lockdown below hold this up
  if (ownerId) {
    warnOwner(ownerId, chatTitle || "your chat", senderName, wasAdmin, demoted).catch(() => {});
  }

  // Lock the chat in the background as a precaution; not time-critical for the alert
  lockChat(chatId).catch((err) => console.error("Failed to lock chat after severe violation", err.message));

  return { wasAdmin, demoted };
}
function isCodingRequest(text = "") {

    text = text.toLowerCase();

    const keywords = [

        "generate code",
        "write code",
        "code this",
        "make a bot",
        "build a bot",
        "create a bot",
        "help me code",
        "write a script",
        "generate javascript",
        "generate python",
        "generate node",
        "generate html",
        "generate css",
        "generate php",
        "generate java",
        "generate c++",
        "generate c#",
        "generate go",
        "generate rust",
        "generate kotlin",
        "generate swift",
        "generate react",
        "generate vue",
        "generate express",
        "write me",
        "program",
        "coding",
        "source code",
        "full code",
        "fix this code",
        "debug",
        "convert this to"

    ];

    return keywords.some(k =>
        text.includes(k)
    );

}
function detectLanguage(text = "") {

    text = text.toLowerCase();

    if (text.includes("javascript") || text.includes("node"))
        return "javascript";

    if (text.includes("python"))
        return "python";

    if (text.includes("html"))
        return "html";

    if (text.includes("css"))
        return "css";

    if (text.includes("php"))
        return "php";

    if (text.includes("java"))
        return "java";

    if (text.includes("c++"))
        return "cpp";

    if (text.includes("c#"))
        return "csharp";

    if (text.includes("go"))
        return "go";

    if (text.includes("rust"))
        return "rust";

    if (text.includes("swift"))
        return "swift";

    if (text.includes("kotlin"))
        return "kotlin";

    if (text.includes("typescript"))
        return "typescript";

    return "javascript";

}
/* ============================================================
 * AI Assistant — a chat mode (private, admins only) where the
 * admin can just talk to the bot in plain English: add/remove
 * rules, toggle protections, ask what's configured, etc. The
 * model replies with strict JSON so we can actually apply the
 * changes, not just talk about them.
 * ============================================================ */

const aiChatSessions = new Map(); // adminId -> [{role, content}], in-memory only

function buildAiConfigSystemPrompt(chatId, chatLabel) {
  const rules = getRules(chatId);
  return (
    `You are the configuration assistant for a Telegram moderation bot called "${BRAND_NAME}". ` +
    `You're chatting privately with a bot admin who is configuring protection for ONE specific chat: "${chatLabel}". ` +
    `Every setting and action below applies ONLY to that chat — never to any other chat the admin manages.\n\n` +
    `Current custom rules for this chat (a message/image gets auto-deleted if it violates one):\n` +
    (rules.length ? rules.map((r, i) => `${i + 1}. ${r}`).join("\n") : "(none yet)") +
    `\n\nPhoto lock (auto-revert this chat's profile picture changes): ${isPhotoLockEnabled(chatId) ? "ON" : "OFF"}\n` +
    `Edit lock (auto-delete edited admin posts/messages in this chat): ${isEditLockEnabled(chatId) ? "ON" : "OFF"}\n` +
    `Flood lock (mute anyone who sends a burst of messages fast in this chat): ${isFloodLockEnabled(chatId) ? "ON" : "OFF"}\n` +
    `Link lock (delete every link from non-admins in this chat, not just malicious ones): ${isLinkLockEnabled(chatId) ? "ON" : "OFF"}\n` +
    `Forward lock (delete forwarded posts from other channels/bots in this chat): ${isForwardLockEnabled(chatId) ? "ON" : "OFF"}\n` +
    `Banned reference images currently registered (shared across all chats): ${getBannedImages().length}\n\n` +
    `You can take actions by including them in the "actions" array of your JSON reply. Supported action types:\n` +
    `- {"type":"add_rule","rule":"<short, clear rule text>"} — add a new moderation rule for this chat\n` +
    `- {"type":"remove_rule","index":<1-based number from the list above>} — remove a rule from this chat\n` +
    `- {"type":"clear_rules"} — remove all rules for this chat\n` +
    `- {"type":"set_photo_lock","enabled":true|false}\n` +
    `- {"type":"set_edit_lock","enabled":true|false}\n` +
    `- {"type":"set_flood_lock","enabled":true|false}\n` +
    `- {"type":"set_link_lock","enabled":true|false}\n` +
    `- {"type":"set_forward_lock","enabled":true|false}\n\n` +
    `Only include an action when the admin clearly asked for that change. For questions or chit-chat, use an empty actions array.\n` +
    `Respond with ONLY valid JSON, no markdown code fences, no extra text, in exactly this shape:\n` +
    `{"reply": "<what you say back to the admin, friendly and concise>", "actions": [ ... ]}`
  );
}
const AI_MODELS = {

    deepseek_r1: {
        id: "deepseek_r1",
        name: "DeepSeek-R1",
        tier: "free",
        badge: "🆓",

        call: async (messages) => {

            const user = messages.filter(m => m.role === "user").pop();
            const system = messages.find(m => m.role === "system");

            let query = user?.content || "";

            if (system) {
                query = `${system.content}

User:
${query}`;
            }

            const { data } = await axios.get(DEEPSEEK_API_URL, {
                params: {
                    q: query
                },
                timeout: 60000
            });

            return String(
                data.response ??
                data.result ??
                data.message ??
                data.text ??
                data.answer ??
                data.data
            );
        }
    },
                prompt_to_code: {

    id: "prompt_to_code",

    name: "Prompt To Code",

    tier: "free",

    badge: "💻",

    call: async (messages) => {

        const user =
            messages
            .filter(m => m.role === "user")
            .pop();

        const prompt =
            user?.content || "";

        const language =
            detectLanguage(prompt);

        const { data } =
            await axios.get(
                PROMPT_TO_CODE_API,
                {
                    params: {

                        prompt,

                        language

                    },
                    timeout: 120000
                }
            );

        console.log(
            "PromptToCode:",
            data
        );

        const response =
            data.code ??
            data.response ??
            data.result ??
            data.message ??
            data.text ??
            data.answer ??
            data.data;

        if (!response) {

            throw new Error(
                "PromptToCode returned empty response"
            );

        }

        return String(response);

    }

},
charart: {

    id: "charart",

    name: "ChatArt AI Vision",

    tier: "free",

    badge: "👁️",


    call: async (
        messages,
        {
            imageUrl = null,
            vision = false
        } = {}
    ) => {


        let prompt = "";


        const user =
            messages
            .filter(m => m.role === "user")
            .pop();



        // IMAGE MODE ONLY
        if (vision && imageUrl) {


            prompt = `
You are an image analysis engine.

Analyze the attached image only.

Do not chat.
Do not greet.
Do not act as an assistant.
Do not use any personality.

Return:

1. Objects detected
2. People detected (if visible)
3. Environment/location
4. Colors and visual details
5. Text found in image
6. Overall description

User request:
${user?.content || "Analyze this image."}
`;



        } else {


            const system =
                messages.find(
                    m => m.role === "system"
                );


            prompt =
`${system?.content || ""}

User:
${user?.content || ""}`;

        }



        const params = {


            prompt,


            mode: vision
                ? "vision"
                : "v6",


            model:"gpt-5.5"


        };



        if(imageUrl){


            params.image =
                imageUrl;


            params.imageName =
                "telegram_image.jpg";


        }



        console.log(
            "========== CHATART REQUEST =========="
        );

        console.log(params);



        const {data} = await axios.get(

            CHARART_API_URL,

            {
                params,

                timeout:120000
            }

        );



        console.log(
            "CHATART RESPONSE:",
            data
        );



        const response =

            data.response ??
            data.result ??
            data.message ??
            data.text ??
            data.answer ??
            data.data;



        if(!response){

            throw new Error(
                "ChatArt empty response"
            );

        }



        return String(response).trim();


    }

},

    gptlogic: {

        id: "gptlogic",

        name: "GPTLogic",

        tier: "free",

        badge: "🧠",


        call: async (messages) => {

            const user =
                messages.filter(m=>m.role==="user").pop();


            const {data} =
                await axios.get(
                    GPTLOGIC_API_URL,
                    {
                        params:{
                            q:user?.content || ""
                        },
                        timeout:60000
                    }
                );


            return String(
                data.response ??
                data.result ??
                data.message ??
                data.text ??
                data.answer ??
                data.data
            );

        }

    },
gemini: {

    id: "gemini",

    name: "Google Gemini",

    tier: "free",

    badge: "♊",


    call: async (
        messages,
        {
            sessionId = null
        } = {}
    ) => {


        const user =
            messages
            .filter(
                m => m.role === "user"
            )
            .pop();



        const system =
            messages.find(
                m => m.role === "system"
            );



        let prompt =
            user?.content || "";



        if(system){

            prompt =
`${system.content}

User:
${prompt}`;

        }



        const params = {


            prompt


        };



        if(sessionId){

            params.session_id =
                sessionId;

        }




        console.log(
            "Gemini Request:",
            params
        );




        const {data} =
            await axios.get(

                "https://prexzyapis.com/ai/gemini",

                {

                    params,

                    timeout:120000

                }

            );




        console.log(
            "Gemini Response:",
            data
        );




        const response =

            data.response ??

            data.result ??

            data.message ??

            data.text ??

            data.answer ??

            data.data;




        if(
            !response ||
            !String(response).trim()
        ){

            throw new Error(
                "Gemini returned empty response"
            );

        }



        return String(response).trim();


    }

},
                deepseek_v4_pro: {

    id:"deepseek_v4_pro",

    name:"DeepSeek V4 Pro",

    tier:"free",

    badge:"🤖",

    call: async(messages)=>{

        const { data } = await axios.post(
            "https://api.hcnsec.cn/v1/chat/completions",

            {
                model:"DeepSeek-V4-Pro",
                messages:messages
            },

            {
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`Bearer ${HCN_API_KEY}`
                },

                timeout:60000
            }
        );

        return String(
            data.choices?.[0]?.message?.content ??
            data.response ??
            data.result ??
            data.message ??
            data.text ??
            data.answer ??
            data.data ??
            ""
        );

    }

},
            

    copilot: {

        id:"copilot",

        name:"Microsoft Copilot",

        tier:"free",

        badge:"💠",

        call: async(messages)=>{

            const user =
            messages.filter(m=>m.role==="user").pop();


            const {data} =
            await axios.get(
                COPILOT_API_URL,
                {
                    params:{
                        text:user?.content || ""
                    },
                    timeout:60000
                }
            );


            return String(
                data.response ??
                data.result ??
                data.message ??
                data.text ??
                data.answer ??
                data.data
            );

        }

    },


    gpt5: {

        id:"gpt5",

        name:"GPT-5",

        tier:"free",

        badge:"🧠",


        call: async(messages)=>{


            const user =
            messages.filter(m=>m.role==="user").pop();


            const prompt =
                user?.content || "";


            const {data} =
            await axios.get(

                GPT5_API_URL,

                {
                    params:{
                        prompt,
                        model:"gpt-5",
                        web_search:false
                    },

                    timeout:60000
                }

            );


            return String(

                data.response ??
                data.result ??
                data.message ??
                data.text ??
                data.answer ??
                data.data

            );


        }

    }


};
  
const OWNER_USERNAME = "F3BAN"; // Don't include @


bot.onText(/^\/botinfo(?:@\w+)?$/, async (msg) => {
  const chatId = msg.chat.id;
  const activeAgentIds = whatsappServiceInfo.getActiveAgentIds();
  const agentCount = whatsappServiceInfo.listAgents().length;

  try {
    const card = await generateInfoCard({
      title: "Miss Aria — Bot Info",
      subtitle: `Version ${BOT_VERSION} • Premium Edition`,
      rows: [
        { icon: "👑", label: "Owner", value: "Dave Tech" },
        { icon: "💌", label: "Telegram", value: `t.me/${OWNER_USERNAME}` },
        { icon: "⚡", label: "Version", value: BOT_VERSION },
        { icon: "🌸", label: "Prefix", value: "[ / ]" },
        { icon: "🤖", label: "Engine", value: "Advanced AI" },
        { icon: "💎", label: "Edition", value: "Premium" },
        { icon: "📲", label: "WA Agents", value: `${activeAgentIds.length} active / ${agentCount} paired` },
      ],
      footer: "Miss Aria • Bot Information",
    });

    await bot.sendPhoto(chatId, card, {
      caption: "<b>〣 ✦ 〈 Bot Information 〉 ✦ 〣</b>",
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("botinfo card render failed, falling back to text:", err.message);
    const text =
`➜ 🌷 ᴏᴡɴᴇʀ      : <b>∂ανє тє¢н</b>

➜ 💌 ᴛᴇʟᴇɢʀᴀᴍ   : <code>t.me/${OWNER_USERNAME}</code>

➜ ⚡ ᴠᴇʀꜱɪᴏɴ    : <b>${BOT_VERSION}</b>

➜ 🌸 ᴘʀᴇꜰɪx     : <b>[ / ]</b>

➜ 🤖 ᴇɴɢɪɴᴇ     : <b>α∂ναη¢є∂ αι</b>

➜ 💎 ᴇᴅɪᴛɪᴏɴ    : <b>ρяємιυм</b>

➜ 📲 ᴡᴀ ᴀɢᴇɴᴛꜱ  : <b>${activeAgentIds.length} active / ${agentCount} paired</b>
<blockquote expandable='true'><b> 〣 ✦ 〈 вσт ιηƒσямαтιση 〉 ✦ 〣</b></blockquote>`;
    await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
  }
});


// Model chain (only DeepSeek)
const MODEL_CHAINS = {

    free: [

        "charart",
        "gemini",
        "prompt_to_code",
        "deepseek_v4_pro",
        "gpt5",
        "deepseek_r1",
        "gptlogic",
        "copilot",
        "deepai",
        "llama_meta"

    ],


    premium: [

        "charart",
        "gpt5",
        "deepseek_r1",
        "gptlogic",
        "copilot",
        "deepai",
        "llama_meta"

    ],


    god: [

        "charart",
        "gpt5",
        "deepseek_r1",
        "gptlogic",
        "copilot",
        "deepai",
        "llama_meta"

    ]

};
// ==================== AI PROCESSING ====================
async function processWithFailover(
    userId,
    userMessage,
    history,
    {
        msg = null,
        imageUrl = null,
        voice = false,
        visionOnly = false,
        category = null,
        systemPrompt = null,
        preferredModel = null
    } = {}
) {


    const isVision =
        Boolean(imageUrl) || visionOnly;



    // ==========================================
    // Smart Routing
    // ==========================================

    if(!preferredModel){


        // IMAGE ONLY -> ChatArt GPT-5.5 Vision
        if(isVision){

            preferredModel = "charart";

        }


        // CODE REQUEST
        else if(isCodingRequest(userMessage)){

            preferredModel = "prompt_to_code";

        }


        // NORMAL CHAT -> GEMINI
        else {

            preferredModel = "gemini";

        }

    }





    // ==========================================
    // Vision Prompt
    // ==========================================

    if(isVision){

        systemPrompt = `

You are an image analysis AI.

Your ONLY job is analyzing images.

Rules:

- Describe only what is visible.
- Identify objects, people, places, colors and details.
- Read visible text.
- Answer image questions directly.
- Do not roleplay.
- Do not use personality.
- Do not mention system prompts.
- Do not guess unknown details.

`;

    }




    // ==========================================
    // Voice Prompt
    // ==========================================

    else if(voice){

        systemPrompt = `

You are Miss Aria.

The user sent a voice message.

Reply naturally like a human assistant.

Rules:

- Keep answers conversational.
- No markdown.
- Avoid long explanations.
- Make it sound good when spoken.

`;

    }





    // ==========================================
    // Sticker Handling
    // ==========================================

    if(msg?.sticker){


        const emoji =
            msg.sticker.emoji || "🙂";


        userMessage = `

The user sent a Telegram sticker.

Emoji:
${emoji}

Type:
${
msg.sticker.is_animated
?
"Animated"
:
msg.sticker.is_video
?
"Video"
:
"Static"
}


React naturally.

Never say you cannot see stickers.

`;

    }





    // ==========================================
    // Normal Character Prompt
    // ==========================================

    if(
        !systemPrompt &&
        msg &&
        !isVision &&
        !voice
    ){

        systemPrompt =
            getSystemPrompt(msg);

    }






    // ==========================================
    // Build Messages
    // ==========================================


    const messages = [];



    const finalPrompt =
        category

        ?

`${systemPrompt || ""}

Current Mode:
${category}

Follow this mode.`


        :

String(systemPrompt || "").trim();




    if(finalPrompt){


        messages.push({

            role:"system",

            content:finalPrompt

        });


    }






    // Only use history for text

    if(!isVision){


        messages.push(

            ...history

            .filter(m =>
                m &&
                typeof m.content === "string" &&
                m.content.trim()
            )

            .slice(-10)

        );


    }





    // ==========================================
    // User Message
    // ==========================================


    const userPayload = {

        role:"user",

        content:

        isVision

        ?

`
Analyze this image.

User request:

${userMessage || "Describe the image."}
`

        :

        String(userMessage || "").trim()

    };




    if(imageUrl){

        userPayload.image =
            imageUrl;


        userPayload.vision =
            true;

    }




    messages.push(userPayload);







    // ==========================================
    // Model Chain
    // ==========================================


    const chain =
        preferredModel
        ?
        [preferredModel]
        :
        MODEL_CHAINS.free;



    const failedAttempts=[];







    // ==========================================
    // Run AI
    // ==========================================


    for(const modelKey of chain){



        const model =
            AI_MODELS[modelKey];



        if(!model)
            continue;





        try{


            console.log(
                `🔄 Trying ${model.name}...`
            );



            let response =
                await model.call(

                    messages,

                    {

                        imageUrl,

                        vision:isVision,

                        voice

                    }

                );





            console.log(
                `${model.name} Response:`,
                response
            );





            if(
                response &&
                typeof response === "object"
            ){

                response =

                    response.response ??

                    response.result ??

                    response.message ??

                    response.answer ??

                    response.text ??

                    response.data ??

                    response.content;

            }





            if(
                response === undefined ||
                response === null
            ){

                throw new Error(
                    "Empty response"
                );

            }





            response =
                String(response).trim();





            if(!response){

                throw new Error(
                    "Empty response"
                );

            }





            console.log(
                `✅ ${model.name} Success`
            );



            return {

                success:true,

                response,

                model:model.id,

                modelName:model.name,

                visionOnly,

                voice,

                failedAttempts

            };



        }
        catch(error){


            console.log(
                `❌ ${model.name}:`,
                error.response?.data ||
                error.message
            );



            failedAttempts.push({

                model:model.name,

                error:
                    error.response?.data ||
                    error.message

            });


        }


    }





    return {

        success:false,

        response:null,

        error:"All AI models failed.",

        failedAttempts

    };


}
async function runAiConfigTurn(adminId, userText, chatId, chatLabel) {
  const sessionKey = `${adminId}:${chatId}`;
  const history = aiChatSessions.get(sessionKey) || [];
  history.push({ role: "user", content: userText });
  const trimmed = history.slice(-12);

  const resp = await openrouter.chat.completions.create({
    model: MODERATION_MODEL,
    max_tokens: 600,
    messages: [{ role: "system", content: buildAiConfigSystemPrompt(chatId, chatLabel) }, ...trimmed],
  });

  const raw = (resp.choices[0].message.content || "").trim();
  let parsed;
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = { reply: raw, actions: [] };
  }

  history.push({ role: "assistant", content: raw });
  aiChatSessions.set(sessionKey, history.slice(-12));

  const changes = [];
  for (const action of Array.isArray(parsed.actions) ? parsed.actions : []) {
    try {
      if (action.type === "add_rule" && action.rule) {
        addRule(chatId, action.rule);
        changes.push(`➕ Added rule: "${action.rule}"`);
      } else if (action.type === "remove_rule" && action.index) {
        const removed = removeRuleAt(chatId, Number(action.index) - 1);
        if (removed) changes.push(`➖ Removed rule: "${removed}"`);
      } else if (action.type === "clear_rules") {
        clearRules(chatId);
        changes.push("🗑 Cleared all rules for this chat");
      } else if (action.type === "set_photo_lock") {
        getChatSettings(chatId).lockPhoto = !!action.enabled;
        saveStore();
        changes.push(`🖼 Photo lock: ${action.enabled ? "ON" : "OFF"}`);
      } else if (action.type === "set_edit_lock") {
        getChatSettings(chatId).lockEdits = !!action.enabled;
        saveStore();
        changes.push(`✏️ Edit lock: ${action.enabled ? "ON" : "OFF"}`);
      } else if (action.type === "set_flood_lock") {
        getChatSettings(chatId).lockFlood = !!action.enabled;
        saveStore();
        changes.push(`🌊 Flood lock: ${action.enabled ? "ON" : "OFF"}`);
      } else if (action.type === "set_link_lock") {
        getChatSettings(chatId).lockLinks = !!action.enabled;
        saveStore();
        changes.push(`🔗 Link lock: ${action.enabled ? "ON" : "OFF"}`);
      } else if (action.type === "set_forward_lock") {
        getChatSettings(chatId).lockForward = !!action.enabled;
        saveStore();
        changes.push(`↪️ Forward lock: ${action.enabled ? "ON" : "OFF"}`);
      }
    } catch (err) {
      console.error("Failed to apply AI config action", action, err.message);
    }
  }

  return { reply: parsed.reply || raw, changes };
}

async function getOwnerId(chatId) {
  const admins = await bot.getChatAdministrators(chatId);
  const owner = admins.find((a) => a.status === "creator");
  return owner ? owner.user.id : null;
}

/* ============================================================
 * Channel/group profile photo lock — snapshot the "correct" photo
 * once, then auto-revert (or remove) any change to it.
 * ============================================================ */

function baselinePhotoPath(chatId) {
  return path.join(PHOTOS_DIR, `${chatId}.jpg`);
}

async function captureChatPhotoBaseline(chatId, title) {
  try {
    const chat = await bot.getChat(chatId);
    if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    if (chat.photo && chat.photo.big_file_id) {
      const buf = await downloadFileToBuffer(chat.photo.big_file_id);
      fs.writeFileSync(baselinePhotoPath(chatId), buf);
      ensureChatStats(chatId, title).hasPhotoBaseline = true;
      saveStore();
      log("Captured photo baseline for chat", chatId);
    } else {
      const rec = ensureChatStats(chatId, title);
      rec.hasPhotoBaseline = false;
      saveStore();
    }
  } catch (err) {
    console.error("Failed to capture photo baseline for", chatId, err.message);
  }
}
async function handleChatPhotoChanged(chatId, messageId, chatTitle) {
  if (!isPhotoLockEnabled(chatId)) return;

  // Ignore the update triggered by our own revert
  if (photoRevertInProgress.has(chatId)) return;
  photoRevertInProgress.add(chatId);

  log("Photo change detected in", chatId, "- deleting it and restoring the old one");

  if (messageId) {
    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (err) {
      console.error("Could not delete photo-change service message", err.message);
    }
  }

  const baseline = baselinePhotoPath(chatId);
  let reverted = false;

  try {
    // 1. delete the changed photo
    await bot.deleteChatPhoto(chatId);
    // 2. bring back the former one, if we have it saved
    if (fs.existsSync(baseline)) {
      await bot.setChatPhoto(chatId, fs.createReadStream(baseline));
      reverted = true;
    }
  } catch (err) {
    console.error("Failed to delete/restore chat photo for", chatId, err.message);
  }

  incrementChatFlags(chatId, chatTitle);

  try {
    const ownerId = await getOwnerId(chatId);
    if (ownerId) {
      await bot.sendMessage(
        ownerId,
        `🖼 *Photo change blocked*\n*Chat:* ${chatTitle || chatId}\nSomeone changed the chat photo — it's been ${
          reverted
            ? "deleted and reverted back to the original photo."
            : "deleted (no original photo was saved yet, so it's now blank)."
        }`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    console.error("Could not notify owner about photo change", err.message);
  }

  // Allow future legitimate photo changes after 5 seconds
  setTimeout(() => {
    photoRevertInProgress.delete(chatId);
  }, 5000);
}
async function lockChat(chatId) {
  await bot.setChatPermissions(chatId, {
    can_send_messages: false,
    can_send_audios: false,
    can_send_documents: false,
    can_send_photos: false,
    can_send_videos: false,
    can_send_video_notes: false,
    can_send_voice_notes: false,
    can_send_polls: false,
    can_send_other_messages: false,
    can_add_web_page_previews: false,
    can_change_info: false,
    can_invite_users: false,
    can_pin_messages: false,
  });
  log("Chat", chatId, "locked down");
}

// --- Flood Lock helpers: burst-message detection + temporary mute ---
const FLOOD_LIMIT = 6; // messages
const FLOOD_WINDOW_MS = 8000; // within this many ms
const FLOOD_MUTE_MS = 5 * 60 * 1000; // mute duration once tripped
const floodTracker = new Map(); // `${chatId}:${userId}` -> array of timestamps

// --- Slow Mode tracking ---
const lastMessageTime = new Map(); // `${chatId}:${userId}` -> timestamp

// --- Anti-Raid tracking ---
const JOIN_RAID_WINDOW_MS = 10 * 1000; // 10 seconds window
const JOIN_RAID_COUNT = 5;             // 5 joins triggers raid
const JOIN_RAID_MUTE_MS = 30 * 1000;   // mute for 30 seconds
const joinTracker = new Map(); // chatId -> array of join timestamps

// --- CAPTCHA tracking ---
const CAPTCHA_TIMEOUT_MS = 3 * 60 * 1000;
const pendingCaptchas = new Map(); // `${chatId}:${userId}` -> timeout handle

function isFlooding(chatId, userId) {
  const key = `${chatId}:${userId}`;
  const now = Date.now();
  const recent = (floodTracker.get(key) || []).filter((t) => now - t < FLOOD_WINDOW_MS);
  recent.push(now);
  floodTracker.set(key, recent);
  return recent.length > FLOOD_LIMIT;
}

function clearFloodHistory(chatId, userId) {
  floodTracker.delete(`${chatId}:${userId}`);
}

async function muteUser(chatId, userId, ms) {
  try {
    await bot.restrictChatMember(chatId, userId, {
      permissions: { can_send_messages: false, can_send_media_messages: false },
      until_date: Math.floor((Date.now() + ms) / 1000),
    });
    log("Muted flooding user", userId, "in chat", chatId, "for", Math.round(ms / 1000), "s");
    return true;
  } catch (err) {
    console.error(`Could not mute user ${userId} in chat ${chatId} (likely an admin/creator)`, err.message);
    return false;
  }
}

async function tryDemote(chatId, userId) {
  try {
    await bot.promoteChatMember(chatId, userId, {
      can_manage_chat: false,
      can_delete_messages: false,
      can_manage_video_chats: false,
      can_restrict_members: false,
      can_promote_members: false,
      can_change_info: false,
      can_invite_users: false,
      can_pin_messages: false,
    });
    log("Demoted user", userId, "in chat", chatId);
    return true;
  } catch (err) {
    console.error(
      `Could not demote user ${userId} (likely the creator or a higher-ranked admin — Telegram blocks this at the API level)`,
      err.message
    );
    return false;
  }
}
/* ============================================================
 * Core moderation commands — /kick /ban /unban /mute /unmute
 * /warn /unwarn /warns /promote /demote /tempadmin /adminlist
 * ============================================================ */

// Telegram-level group admin check (creator/administrator of THIS chat),
// with bot admins always allowed through as a super-permission.
async function isGroupAdmin(chatId, userId) {
  if (isBotAdmin(userId)) return true;
  try {
    const member = await bot.getChatMember(chatId, userId);
    return member.status === "creator" || member.status === "administrator";
  } catch {
    return false;
  }
}

async function requireGroupAdmin(msg) {
  if (msg.chat.type === "private") {
    await bot.sendMessage(msg.chat.id, "This command only works in a group.");
    return false;
  }
  const ok = await isGroupAdmin(msg.chat.id, msg.from.id);
  if (!ok) {
    await bot.sendMessage(msg.chat.id, NOT_ADMIN_MSG, { reply_to_message_id: msg.message_id });
    return false;
  }
  return true;
}

// Resolve who a moderation command targets: reply to their message,
// or pass their numeric Telegram ID as the argument.
async function resolveGroupTarget(msg, argText) {
  if (msg.reply_to_message && msg.reply_to_message.from) {
    const u = msg.reply_to_message.from;
    return { id: u.id, label: u.username ? `@${u.username}` : (u.first_name || String(u.id)) };
  }
  const t = (argText || "").trim();
  if (/^\d+$/.test(t)) {
    return { id: Number(t), label: t };
  }
  return null;
}


// "1h" / "30m" / "2d" -> milliseconds. Returns null if unparseable.
function parseDuration(text) {
  if (!text) return null;
  const m = String(text).trim().match(/^(\d+)\s*(m|min|mins|h|hr|hrs|d|day|days)$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("m")) return n * 60 * 1000;
  if (unit.startsWith("h")) return n * 60 * 60 * 1000;
  return n * 24 * 60 * 60 * 1000; // days
}

// --- reuse the existing warn system (settings.warns / warnUser / WARN_LIMIT) ---
function getWarnCount(chatId, userId) {
  const settings = getChatSettings(chatId);
  return (settings.warns && settings.warns[userId]) || 0;
}
function clearOneWarn(chatId, userId) {
  const settings = getChatSettings(chatId);
  if (!settings.warns) settings.warns = {};
  const cur = settings.warns[userId] || 0;
  settings.warns[userId] = Math.max(0, cur - 1);
  saveStore();
  return settings.warns[userId];
}

/* ---- /kick ---- */
bot.onText(/^\/kick(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /kick, or use /kick <user_id>.");
  }
  try {
    await bot.banChatMember(msg.chat.id, target.id);
    await bot.unbanChatMember(msg.chat.id, target.id); // ban+unban = kick, not permanent
    await bot.sendMessage(msg.chat.id, `👢 Kicked ${target.label}.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't kick ${target.label}: ${err.message}`);
  }
});

/* ---- /ban ---- */
bot.onText(/^\/ban(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /ban, or use /ban <user_id>.");
  }
  try {
    await bot.banChatMember(msg.chat.id, target.id);
    await bot.sendMessage(msg.chat.id, `🔨 Banned ${target.label}.`);
    logModAction(msg.chat.id, {
      action: "ban",
      moderator: msg.from.username ? `@${msg.from.username}` : String(msg.from.id),
      target: target.label,
      reason: (match[1] || "").trim(),
    });
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't ban ${target.label}: ${err.message}`);
  }
});

/* ---- /unban ---- */
bot.onText(/^\/unban(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Use /unban <user_id> (or reply to a forwarded message from them).");
  }
  try {
    await bot.unbanChatMember(msg.chat.id, target.id, { only_if_banned: true });
    await bot.sendMessage(msg.chat.id, `✅ Unbanned ${target.label}.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't unban ${target.label}: ${err.message}`);
  }
});
// npm install play-dl for your downloader, if you use and external API key a o need to install any downloader packages cuz they’re unreliable .

const play = require('play-dl');
const { getAudioDurationSeconds } = require('./utils/audioDuration');

// The YOUTUBE_COOKIE default that used to live here was fabricated (a repeated
// junk fragment, not a real browser cookie), which made play-dl silently fall
// back to a throttled/unauthenticated session — YouTube then serves a
// truncated/degraded stream for some videos with no error thrown, which is
// why /music was sending short previews instead of the full track.
// Get a REAL cookie from your own logged-in YouTube session if you want one
// (optional — play-dl works unauthenticated for most public videos too).
if (process.env.YOUTUBE_COOKIE) {
  play.setToken({
    youtube: {
      cookie: process.env.YOUTUBE_COOKIE
    }
  });
} else {
  console.log("YOUTUBE_COOKIE not set — /music will run unauthenticated (fine for most videos, but age/region-restricted ones may fail or truncate).");
}
bot.onText(/^\/(music|song)(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const query = (match && match[2] ? match[2] : "").trim();

    if (!query) {
        return bot.sendMessage(
            chatId,
            "🎵 Send a song title.\n\nExample:\n/music My love Stubborn"
        );
    }

    const searching = await bot.sendMessage(
        chatId,
        `🔎 Searching "${query}"...`
    );

    try {
        const results = await play.search(query, {
            limit: 5,
            source: {
                youtube: "video"
            }
        });

        if (!results.length) {
            return bot.editMessageText(
                `❌ No results found for "${query}".`,
                {
                    chat_id: chatId,
                    message_id: searching.message_id
                }
            );
        }

        // Prefer a normal-length track over livestreams/DJ mixes/compilations —
        // those get picked by keyword match just as easily and are a common
        // reason the "song" you get back is actually a 30+ minute mix.
        const MAX_SONG_SECONDS = 20 * 60;
        const video =
            results.find(v => !v.live && v.durationInSec > 0 && v.durationInSec <= MAX_SONG_SECONDS) ||
            results[0];

        await bot.editMessageText(
            `⏳ Downloading "${video.title}" (${video.durationRaw || "?"})...`,
            {
                chat_id: chatId,
                message_id: searching.message_id
            }
        );

        const stream = await play.stream(video.url, {
            quality: 2
        });

        const chunks = [];

        for await (const chunk of stream.stream) {
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        if (!buffer.length) {
            throw new Error("Downloaded 0 bytes — the stream was rejected (check YOUTUBE_COOKIE / try again).");
        }

        if (buffer.length > 50 * 1024 * 1024) {
            return bot.editMessageText(
                "❌ Audio is larger than Telegram's 50MB limit.",
                {
                    chat_id: chatId,
                    message_id: searching.message_id
                }
            );
        }

        // Verify we actually got (roughly) the full track and not a truncated
        // stream — this is what silently produced short "previews" before.
        const actualDuration = await getAudioDurationSeconds(buffer);

        if (actualDuration && video.durationInSec && actualDuration < video.durationInSec * 0.85) {
            console.log(
                `MUSIC WARN: "${video.title}" expected ~${video.durationInSec}s but only got ${Math.round(actualDuration)}s — ` +
                `stream was truncated (likely an expired/invalid YOUTUBE_COOKIE, or an age/region-restricted video).`
            );

            await bot.editMessageText(
                `⚠️ YouTube only gave me a partial stream of "${video.title}" (${Math.round(actualDuration)}s of ${video.durationRaw}). Sending what I got — try again or set a real YOUTUBE_COOKIE in .env if this keeps happening.`,
                { chat_id: chatId, message_id: searching.message_id }
            );
        } else {
            await bot.deleteMessage(chatId, searching.message_id).catch(() => {});
        }

        await bot.sendAudio(
            chatId,
            buffer,
            {
                title: video.title,
                performer: video.channel?.name || "Unknown",
                duration: Math.round(actualDuration || video.durationInSec || 0) || undefined
            },
            {
                filename: `${video.title}.mp3`,
                contentType: "audio/mpeg"
            }
        );

    } catch (err) {
        console.error("MUSIC ERROR:", err);

        bot.editMessageText(
            "❌ Something went wrong. Please try again.",
            {
                chat_id: chatId,
                message_id: searching.message_id
            }
        ).catch(() => {});
    }
});
/* ---- /mute [1h/30m/2d] ---- */
bot.onText(/^\/mute(?:@\w+)?(?:\s+(\S+))?(?:\s+(\S+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;

  // Support both "/mute 1h" (reply) and "/mute <id> 1h"
  let durationArg = match[1];
  let idArg = null;
  if (match[1] && /^\d+$/.test(match[1]) && !msg.reply_to_message) {
    idArg = match[1];
    durationArg = match[2];
  }

  const target = await resolveGroupTarget(msg, idArg);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /mute [1h/30m], or use /mute <user_id> [1h/30m].");
  }

  const ms = parseDuration(durationArg) || 60 * 60 * 1000; // default 1h
  try {
    await bot.restrictChatMember(msg.chat.id, target.id, {
      permissions: { can_send_messages: false, can_send_media_messages: false },
      until_date: Math.floor((Date.now() + ms) / 1000)
    });
    await bot.sendMessage(msg.chat.id, `🔇 Muted ${target.label} for ${durationArg || "1h"}.`);
    logModAction(msg.chat.id, {
      action: "mute",
      moderator: msg.from.username ? `@${msg.from.username}` : String(msg.from.id),
      target: target.label,
      reason: durationArg || "1h",
    });
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't mute ${target.label}: ${err.message}`);
  }
});

/* ---- /unmute ---- */
bot.onText(/^\/unmute(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /unmute, or use /unmute <user_id>.");
  }
  try {
    await bot.restrictChatMember(msg.chat.id, target.id, {
      permissions: {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      }
    });
    await bot.sendMessage(msg.chat.id, `🔊 Unmuted ${target.label}.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't unmute ${target.label}: ${err.message}`);
  }
});

bot.onText(/^\/pinterest(?:\s+(.+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const query = match[1]?.trim();

    if (!query) {
        return bot.sendMessage(
            chatId,
            `📌 <b>ριηтєяєѕт ѕєαя¢н</b>

<blockquote expandable='true'>🔎 sᴇᴀʀᴄʜ ᴍɪʟʟɪᴏɴs ᴏғ ᴘɪɴᴛᴇʀᴇsᴛ ɪᴍᴀɢᴇs.</blockquote>

<b>✦ υѕαgє</b>
<code>/pinterest anime girl</code>

🌸 <b>мιѕѕ αяια</b>`,
            {
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );
    }

    const frames = [
        "🔎 <b>ѕєαя¢нιηg ριηтєяєѕт...</b>",
        "📡 <b>ғιη∂ιηg ιмαgєѕ...</b>",
        "🖼️ <b>ρяєραяιηg αℓвυм...</b>",
        "✨ <b>αℓмσѕт ∂σηє...</b>"
    ];

    const loading = await bot.sendMessage(chatId, frames[0], {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
    });

    let frame = 1;

    const animation = setInterval(() => {
        if (frame >= frames.length) return;

        bot.editMessageText(frames[frame], {
            chat_id: chatId,
            message_id: loading.message_id,
            parse_mode: "HTML"
        }).catch(() => {});

        frame++;
    }, 700);

    try {

        const { data } = await axios.get(
            `https://prexzyapis.com/search/pinterest?q=${encodeURIComponent(query)}`,
            {
                timeout: 30000,
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        clearInterval(animation);

        if (!data.status || !Array.isArray(data.data) || !data.data.length) {
            return bot.editMessageText(
                "❌ <b>ησ ιмαgєѕ ғσυη∂.</b>",
                {
                    chat_id: chatId,
                    message_id: loading.message_id,
                    parse_mode: "HTML"
                }
            );
        }

        const urls = [...new Set(data.data)];

        await bot.editMessageText(
            `✅ <b>${urls.length} ɪᴍᴀɢᴇs ғᴏᴜɴᴅ!</b>

<blockquote expandable='true'>📌 ${query}</blockquote>

🚀 <b>∂σωηℓσα∂ιηg...</b>`,
            {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "HTML"
            }
        );

        let media = [];
        let tempFiles = [];

        for (let i = 0; i < urls.length; i++) {

            try {

                const ext = path.extname(urls[i]).split("?")[0] || ".jpg";

                // Skip GIFs because Telegram albums only support photos/videos
                if (ext.toLowerCase() === ".gif") continue;

                const filePath = path.join(
                    os.tmpdir(),
                    `pin_${Date.now()}_${i}${ext}`
                );

                const image = await axios.get(urls[i], {
                    responseType: "arraybuffer",
                    timeout: 30000,
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        Referer: "https://www.pinterest.com/"
                    }
                });

                fs.writeFileSync(filePath, image.data);

                tempFiles.push(filePath);

                media.push({
                    type: "photo",
                    media: filePath,
                    caption:
                        media.length === 0
                            ? `📌 <b>ᴘɪɴᴛᴇʀᴇsᴛ • ${query}</b>

✨ ${urls.length} ɪᴍᴀɢᴇs
🌸 <b>мιѕѕ αяια</b>`
                            : undefined,
                    parse_mode: "HTML"
                });

                if (media.length === 10 || i === urls.length - 1) {

                    await bot.sendMediaGroup(chatId, media, {
                        reply_to_message_id: msg.message_id
                    });

                    for (const file of tempFiles) {
                        try {
                            fs.unlinkSync(file);
                        } catch {}
                    }

                    media = [];
                    tempFiles = [];
                }

            } catch (err) {
                console.log("Skipped:", urls[i]);
            }

        }

        await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

    } catch (err) {

        clearInterval(animation);

        console.error("PINTEREST ERROR:", err.response?.data || err.message);

        bot.editMessageText(
            `❌ <b>ѕєαя¢н ғαιℓє∂.</b>

<blockquote expandable='true'>ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.</blockquote>`,
            {
                chat_id: chatId,
                message_id: loading.message_id,
                parse_mode: "HTML"
            }
        ).catch(() => {});
    }

});
bot.onText(/^\/getsong(?:\s+(.+))?$/, async (msg, match) => {


    const chatId = msg.chat.id;
    const input = match[1];


    const replyOptions = {

        reply_to_message_id: msg.message_id,
        parse_mode:"HTML"

    };



    if(!input){

        return bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

❌ <b>υѕαgє</b>

<code>/getsong YouTube URL</code>

Example:

<code>/getsong https://youtube.com/watch?v=xxxx</code>

</blockquote>`,

            replyOptions

        );

    }



    try {



        // ==========================
        // CLEAN URL
        // ==========================


        const youtubeUrl = input
            .trim()
            .replace(/[<>]/g,"")
            .replace(/\s+/g,"");



        console.log(
            "YOUTUBE URL:",
            youtubeUrl
        );



        if(
            !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(youtubeUrl)
        ){

            throw new Error(
                "Invalid YouTube URL"
            );

        }







        // ==========================
        // GET SONG INFO
        // ==========================


        const loading = await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

🔎 <b>gєттιηg ѕσηg ιηƒσямαтιση...</b>

</blockquote>`,

            replyOptions

        );





        const info = await axios.get(

`https://prexzyapis.com/download/ytinfo?url=${encodeURIComponent(youtubeUrl)}`,

        {

            timeout:60000

        }

        );



        const data = info.data;



        console.log(
            "PREXZY INFO:",
            JSON.stringify(data,null,2)
        );




        const title =

            data.info?.title ||
            data.title ||
            "Unknown";



        const channel =

            data.info?.channel ||
            data.info?.uploader ||
            "Unknown";



        const duration =

            data.info?.duration_string ||
            "Unknown";



        const views =

            data.info?.view_count ||
            "Unknown";





        await bot.deleteMessage(

            chatId,

            loading.message_id

        ).catch(()=>{});







        await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

🎵 <b>${escapeHtml(title)}</b>

👤 ${escapeHtml(channel)}

⏱ ${duration}

👁 ${views} Views

⬇️ Downloading MP3...

</blockquote>`,

            replyOptions

        );








        // ==========================
        // PREXZY MP3 RETRY
        // ==========================


        async function getMP3(url){


            let tries = 3;



            while(tries > 0){


                try{


                    const res = await axios.get(

`https://prexzyapis.com/download/ytmp3?url=${encodeURIComponent(url)}`,

                    {

                        timeout:120000

                    }

                    );


                    return res.data;



                }catch(err){



                    console.log(

                        "MP3 ERROR:",

                        err.response?.status ||
                        err.message

                    );



                    if(
                        err.response?.status === 502
                    ){

                        tries--;


                        if(tries > 0){

                            console.log(
                                "Retrying Prexzy..."
                            );


                            await sleep(60000);

                            continue;

                        }

                    }


                    throw err;


                }


            }


        }








        // ==========================
        // DOWNLOAD MP3
        // ==========================


        const mp3Data =
        await getMP3(youtubeUrl);




        console.log(

            "PREXZY MP3 RESPONSE:",

            JSON.stringify(
                mp3Data,
                null,
                2
            )

        );








        // ==========================
        // FIND URL ANYWHERE
        // ==========================


        function findUrl(obj){


            if(!obj)
                return null;



            if(typeof obj === "string"){


                if(
                    obj.startsWith("http")
                ){

                    return obj;

                }


                return null;

            }



            if(typeof obj === "object"){


                for(
                    const key of Object.keys(obj)
                ){


                    const found =
                    findUrl(obj[key]);



                    if(found)
                        return found;


                }


            }


            return null;


        }






        const audioUrl =
        findUrl(mp3Data);





        console.log(

            "AUDIO URL:",
            audioUrl

        );





        if(!audioUrl){


            throw new Error(
                "No MP3 URL returned from Prexzy"
            );

        }








        // ==========================
        // SEND AUDIO
        // ==========================


        await bot.sendAudio(

            chatId,

            audioUrl,

            {

caption:

`<blockquote expandable='true'>

🎵 <b>${escapeHtml(title)}</b>

👤 ${escapeHtml(channel)}

✅ Download Complete

⚡ Powered by Prexzy

</blockquote>`,

            parse_mode:"HTML",

            title:title,

            performer:channel

            }

        );





    }catch(err){



        console.log(

            "GETSONG ERROR:",

            err.response?.data ||
            err.message

        );



        await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

❌ <b>∂σωηℓσα∂ ƒαιℓє∂</b>

${escapeHtml(

err.response?.data?.detail ||
err.message

)}

</blockquote>`,

            replyOptions

        );


    }


});
/* ---- /warn ---- */
bot.onText(/^\/warn(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /warn, or use /warn <user_id>.");
  }
  await warnUser(msg.chat.id, target.id, target.label, "manual warn by an admin");
});

/* ---- /unwarn ---- */
bot.onText(/^\/unwarn(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /unwarn, or use /unwarn <user_id>.");
  }
  const count = clearOneWarn(msg.chat.id, target.id);
  await bot.sendMessage(msg.chat.id, `Removed one warn from ${target.label} (${count}/${WARN_LIMIT}).`);
});

/* ---- /warns ---- */
bot.onText(/^\/warns(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  const target = await resolveGroupTarget(msg, match[1]);
  const who = target || { id: msg.from.id, label: msg.from.first_name };
  const count = getWarnCount(msg.chat.id, who.id);
  await bot.sendMessage(msg.chat.id, `${who.label} has ${count}/${WARN_LIMIT} warns.`);
});

// ============================================================
// /play2 - YouTube MP4 Downloader
// ============================================================

const APIFY_TOKEN = process.env.APIFY_TOKEN || "apify_api_OoonMeQLK7EU8G7eZR496Ab9dtAGd60tfh11";
const ACTOR_ID = process.env.ACTOR_ID || "ZSKNl5eniyeAPcPkf";


bot.onText(/^\/getsong(?:\s+(.+))?$/, async (msg, match) => {

    const chatId = msg.chat.id;
    const input = match[1];


    const replyOptions = {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML"
    };


    if(!input){

        return bot.sendMessage(
            chatId,

`<blockquote expandable='true'>
❌ <b>υѕαgє</b>

Send YouTube link:

<code>/getsong https://youtube.com/watch?v=xxxxx</code>
</blockquote>`,

            replyOptions
        );

    }



    let statusMsg;



    try {



        // ==========================
        // CLEAN URL
        // ==========================


        const youtubeUrl = input
            .trim()
            .replace(/[<>]/g,"")
            .replace(/\s+/g,"");



        console.log(
            "YOUTUBE URL:",
            youtubeUrl
        );



        if(
            !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(youtubeUrl)
        ){

            throw new Error(
                "Invalid YouTube URL"
            );

        }





        // ==========================
        // STATUS
        // ==========================


        statusMsg = await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

🔎 <b>ƒєт¢нιηg ѕσηg ιηƒσ...</b>

</blockquote>`,

            replyOptions

        );







        // ==========================
        // PREXZY ONLY INFO
        // ==========================


        const info = await axios.get(

`https://prexzyapis.com/download/ytinfo?url=${encodeURIComponent(youtubeUrl)}`,

        {
            timeout:60000
        }

        );



        const data = info.data;



        console.log(
            "PREXZY:",
            JSON.stringify(data,null,2)
        );





        const title =
            data.title ||
            data.info?.title ||
            "Unknown Title";



        const channel =
            data.channel ||
            data.author ||
            data.info?.channel ||
            "Unknown";



        const duration =
            data.duration ||
            data.info?.duration ||
            "Unknown";



        const views =
            data.views ||
            data.viewCount ||
            data.info?.views ||
            "Unknown";






        await bot.deleteMessage(
            chatId,
            statusMsg.message_id
        ).catch(()=>{});





        await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

🎵 <b>${escapeHtml(title)}</b>

👤 ${escapeHtml(channel)}

⏱ ${duration}

👁 ${views} Views

⬇️ Downloading...

</blockquote>`,

            replyOptions

        );








        // ==========================
        // APIFY ONLY DOWNLOAD
        // ==========================


        console.log(
            "APIFY URL:",
            youtubeUrl
        );



        const actor = await axios.post(

`https://api.apify.com/v2/acts/${ACTOR_ID}/runs`,

        {

            urls:[
                youtubeUrl
            ]

        },

        {

            params:{
                token: APIFY_TOKEN
            }

        }

        );





        const runId =
            actor.data.data.id;



        console.log(
            "APIFY RUN:",
            runId
        );







        // ==========================
        // WAIT
        // ==========================


        let state = "RUNNING";



        while(

            state !== "SUCCEEDED" &&
            state !== "FAILED" &&
            state !== "ABORTED"

        ){


            await sleep(5000);



            const check = await axios.get(

`https://api.apify.com/v2/actor-runs/${runId}`,

            {

                params:{
                    token:APIFY_TOKEN
                }

            }

            );



            state =
            check.data.data.status;



            console.log(
                "APIFY STATUS:",
                state
            );


        }





        if(state !== "SUCCEEDED"){

            throw new Error(
                "Apify failed: "+state
            );

        }







        // ==========================
        // GET FILE
        // ==========================


        const run = await axios.get(

`https://api.apify.com/v2/actor-runs/${runId}`,

        {

            params:{
                token:APIFY_TOKEN
            }

        }

        );



        const datasetId =
            run.data.data.defaultDatasetId;




        const dataset = await axios.get(

`https://api.apify.com/v2/datasets/${datasetId}/items`,

        {

            params:{
                token:APIFY_TOKEN
            }

        }

        );



        console.log(
            "APIFY OUTPUT:",
            JSON.stringify(dataset.data,null,2)
        );




        const item =
            dataset.data?.[0];



        const downloadUrl =

            item?.downloadUrl ||
            item?.download_url ||
            item?.url ||
            item?.audioUrl ||
            item?.file;





        if(!downloadUrl){

            throw new Error(
                "No download URL found from Apify"
            );

        }







        // ==========================
        // SEND AUDIO
        // ==========================


        await bot.sendAudio(

            chatId,

            downloadUrl,

            {

caption:

`<blockquote expandable='true'>

🎵 <b>${escapeHtml(title)}</b>

👤 ${escapeHtml(channel)}

✅ Download Complete

⚡ Powered by Apify

</blockquote>`,

            parse_mode:"HTML",

            title:title,

            performer:channel

            }

        );





    } catch(err){


        console.log(
            "GETSONG ERROR:",
            err.response?.data ||
            err.message
        );



        await bot.sendMessage(

            chatId,

`<blockquote expandable='true'>

❌ <b>∂σωηℓσα∂ ƒαιℓє∂</b>

${escapeHtml(
err.response?.data?.error?.message ||
err.message
)}

</blockquote>`,

            replyOptions

        );


    }


});
// HELPERS
// ======================================


function sleep(ms){

    return new Promise(
        resolve=>setTimeout(resolve,ms)
    );

}



function escapeHtml(text){

    return String(text || "")

    .replace(/&/g,"&amp;")

    .replace(/</g,"&lt;")

    .replace(/>/g,"&gt;")

    .replace(/"/g,"&quot;")

    .replace(/'/g,"&#039;");

}
bot.onText(/^\/song2(?:\s+(.+))?$/, async (msg, match) => {

    const chatId = msg.chat.id;
    const query = match[1];

    const reply = {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML"
    };

    if (!query) {
        return bot.sendMessage(
            chatId,
            `<blockquote expandable='true'>🎵 Send a song name

<code>/song2 Ghost by Justin Bieber</code></blockquote>`,
            reply
        );
    }

    let wait;

    try {

        wait = await bot.sendMessage(
            chatId,
            "<blockquote expandable='true'>🔎 Searching YouTube...</blockquote>",
            reply
        );

        // ==========================
        // SEARCH
        // ==========================

        const { data: search } = await axios.get(
            `https://prexzyapis.com/search/youtube?q=${encodeURIComponent(query)}`
        );

        if (!search.status || !search.data || search.data.length === 0) {
            throw new Error("No search results");
        }

        const video = search.data[0];
        const videoUrl = video.link;

        // ==========================
        // GET INFO
        // ==========================

        const { data: song } = await axios.get(
            `https://prexzyapis.com/download/ytinfo?url=${encodeURIComponent(videoUrl)}`
        );

        // ==========================
        // GET MP3
        // ==========================

        const { data: audio } = await axios.get(
            `https://prexzyapis.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
        );

        const audioUrl =
            audio.download_url ||
            audio.result?.download_url ||
            audio.url ||
            audio.result?.url;

        if (!audioUrl) {
            throw new Error("No audio URL returned");
        }

        await bot.deleteMessage(chatId, wait.message_id).catch(() => {});

        // ==========================
        // SEND THUMBNAIL
        // ==========================

        await bot.sendPhoto(
            chatId,
            song.info?.thumbnail || video.imageUrl,
            {
                reply_to_message_id: msg.message_id,
                parse_mode: "HTML",
                caption:
`<blockquote expandable='true'>
🎵 <b>${song.info?.title || video.title}</b>

👤 ${song.info?.channel || video.channel}
⏱ ${song.info?.duration_string || video.duration}
👁 ${(song.info?.view_count || 0).toLocaleString()} Views
</blockquote>`
            }
        );
        
// ==========================
// DOWNLOAD AUDIO
// ==========================

const { data } = await axios.get(audioUrl, {
    responseType: "arraybuffer",
    timeout: 120000,
    maxRedirects: 10,
    headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.youtube.com/"
    }
});

const buffer = Buffer.from(data);

await bot.sendAudio(
    chatId,
    buffer,
    {
        title: song.info?.title || video.title,
        performer: song.info?.channel || video.channel,
        reply_to_message_id: msg.message_id
    },
    {
        filename: "song.m4a",
        contentType: "audio/mp4"
    }
);
} catch (err) {

    console.error("SONG2 ERROR");
    console.error("Message:", err.message);
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);

    if (wait) {
        await bot.deleteMessage(chatId, wait.message_id).catch(() => {});
    }

   await bot.sendMessage(
        chatId,
        "<blockquote expandable='true'>❌ Failed to download audio.</blockquote>",
        reply
    );
}

});
        
/* ---- /promote ---- */
bot.onText(/^\/promote(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /promote, or use /promote <user_id>.");
  }
  try {
    await bot.promoteChatMember(msg.chat.id, target.id, {
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true,
      can_manage_video_chats: true
    });
    await bot.sendMessage(msg.chat.id, `⬆️ Promoted ${target.label} to admin.`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't promote ${target.label}: ${err.message}`);
  }
});

/* ---- /demote ---- */
bot.onText(/^\/demote(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user's message with /demote, or use /demote <user_id>.");
  }
  const ok = await tryDemote(msg.chat.id, target.id);
  await bot.sendMessage(
    msg.chat.id,
    ok ? `⬇️ Demoted ${target.label}.` : `Couldn't demote ${target.label} (they may outrank the bot).`
  );
});

// --- temp-admin tracking: chatId:userId -> timeout handle ---
const tempAdminTimers = new Map();

/* ---- /tempadmin @user 5m ---- */
bot.onText(/^\/tempadmin(?:@\w+)?\s+(\S+)\s+(\S+)$/, async (msg, match) => {
  if (!(await requireGroupAdmin(msg))) return;
  const target = await resolveGroupTarget(msg, match[1]);
  const ms = parseDuration(match[2]);
  if (!target) {
    return bot.sendMessage(msg.chat.id, "Reply to the user with /tempadmin <duration>, or use /tempadmin <user_id> <duration> (e.g. 5m).");
  }
  if (!ms) {
    return bot.sendMessage(msg.chat.id, "Couldn't parse the duration — use something like 5m, 1h, or 2d.");
  }

  try {
    await bot.promoteChatMember(msg.chat.id, target.id, {
      can_change_info: true,
      can_delete_messages: true,
      can_invite_users: true,
      can_restrict_members: true,
      can_pin_messages: true
    });
    await bot.sendMessage(msg.chat.id, `⏳ ${target.label} is a temp admin for ${match[2]}.`);

    const key = `${msg.chat.id}:${target.id}`;
    if (tempAdminTimers.has(key)) clearTimeout(tempAdminTimers.get(key));
    const timer = setTimeout(async () => {
      tempAdminTimers.delete(key);
      const ok = await tryDemote(msg.chat.id, target.id);
      if (ok) {
        bot.sendMessage(msg.chat.id, `⌛ Temp-admin period ended for ${target.label} — demoted.`).catch(() => {});
      }
    }, ms);
    tempAdminTimers.set(key, timer);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Couldn't temp-promote ${target.label}: ${err.message}`);
  }
});

/* ---- /adminlist ---- */
bot.onText(/^\/adminlist(?:@\w+)?$/, async (msg) => {
  if (msg.chat.type === "private") {
    return bot.sendMessage(msg.chat.id, "This command only works in a group.");
  }
  try {
    const admins = await bot.getChatAdministrators(msg.chat.id);
    const rows = admins.map((a) => {
      const name = a.user.username ? `@${a.user.username}` : (a.user.first_name || String(a.user.id));
      return {
        icon: a.status === "creator" ? "👑" : "👮",
        label: a.status === "creator" ? "Owner" : "Admin",
        value: name,
      };
    });

    const card = await generateInfoCard({
      title: "Group Admins",
      subtitle: msg.chat.title || "This group",
      rows,
      footer: "Miss Aria • Admin List",
    });
    await bot.sendPhoto(msg.chat.id, card, {
      caption: "<b>👮 Admins in this group</b>",
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("adminlist card render failed, falling back to text:", err.message);
    try {
      const admins = await bot.getChatAdministrators(msg.chat.id);
      const lines = admins.map((a) => {
        const name = a.user.username ? `@${a.user.username}` : (a.user.first_name || String(a.user.id));
        return a.status === "creator" ? `👑 ${name} (owner)` : `👮 ${name}`;
      });
      await bot.sendMessage(msg.chat.id, `*Admins in this group:*\n${lines.join("\n")}`, { parse_mode: "Markdown" });
    } catch (err2) {
      await bot.sendMessage(msg.chat.id, `Couldn't fetch admin list: ${err2.message}`);
    }
  }
});

async function warnOwner(ownerId, chatTitle, offenderName, wasAdmin, demoted) {
  const lines = [
    "🚨 *Your Group is under attack* 🚨",
    `*Chat:* ${chatTitle}`,
    `*Posted by:* ${offenderName}`,
    "Flagged content was detected and deleted.",
    `Poster was an admin: ${wasAdmin ? "yes" : "no"}`,
  ];
  if (wasAdmin) {
    lines.push(`Demote attempt: ${demoted ? "succeeded" : "FAILED — please demote manually"}`);
  }
  lines.push("The chat has been locked down (no one can send messages) as a precaution.");

  try {
    await bot.sendMessage(ownerId, lines.join("\n"), { parse_mode: "Markdown" });
  } catch (err) {
    console.error(
      `Could not DM owner ${ownerId} — they likely haven't started a chat with this bot yet`,
      err.message
    );
  }
}

/* ============================================================
 * Management menu
 * ============================================================ */

function mainMenuText(userId) {

    const planLine = isPremiumActive(userId)
        ? "⭐ <b>ρяємιυм</b>"
        : "🆓 <b>ƒяєє</b>";

    const announcement = getAnnouncement();

    const lines = [

`<blockquote expandable='true'><b>〔 🌷 мιꜱꜱ αяια 〕</b></blockquote>

👋 Hey! I'm your all-in-one group guardian + AI companion.

<blockquote expandable='true'>🛡 <b>мσ∂єяαтιση</b> — ban, mute, warn, lock, timeout
🚫 <b>αηтι-ѕραм</b> — links, badwords, NSFW, raids, flood
🚪 <b>єηтяу gυαя∂</b> — join gate, CAPTCHA, alt detection
🎉 <b>¢σммυηιту</b> — welcome/goodbye, auto-roles, rules
🎮 <b>ƒυη & є¢σησму</b> — games, coins, streaks, leaderboards</blockquote>

➜ Plan: ${planLine}`

    ];

    if (announcement) {

        lines.push(
            "",
            `📢 <b>αηησυη¢ємєηт</b>\n${announcement}`
        );

    }

    lines.push(
        "",
        "😅 <i>Add me to your group and make me admin to unlock everything.</i>",
        "",
        "👇 Pick an option below."
    );

    return lines.join("\n");

}

function mainMenuKeyboard(userId) {

  const rows = [

    [
      {
        text: "♣️ gяσυρ ѕєттιηg",
        callback_data: "menu_settings"
        ,style: 'success'
      },
      {
        text: "⁉️ нєℓρ & gυι∂є",
        callback_data: "menu_help"
         ,style: 'success'
      }
    ],

    [
      {
        text: "⬇️ ∂σωηℓσα∂",
        callback_data: "menu_downloaders"
         ,style: 'primary'
      },
      {
        text: "🎮 gαмєѕ",
        callback_data: "menu_games"
         ,style: 'primary'
      }
    ],

    [
      ...(TELEGRAM_BOT_USERNAME ? [{
        text: "🚀 α∂∂ тσ gяσυρ",
        url: `https://t.me/${TELEGRAM_BOT_USERNAME}?startgroup=true`,
        style: 'success'
      }] : []),
      {
        text: "🔒 αяια ρяσтє¢тιση",
        callback_data: "menu_protection"
          ,style: 'success'
      }
    ],

    [
      {
        text: "🏆 ℓєα∂єявσαя∂",
        callback_data: "menu_leaderboard",
          style: 'primary'
      },
      {
        text: isPremiumActive(userId) ? "⭐ ᴘʀᴇᴍɪᴜᴍ (ᴀᴄᴛɪᴠᴇ)" : "⭐ ɢᴇᴛ ᴘʀᴇᴍɪᴜᴍ",
        callback_data: "menu_premium",
          style: 'danger'
      }
    ],

    [
      {
        text: "⭐ ѕυρρσят",
        url: SUPPORT_CHANNEL,
          style: 'danger'
      },
      {
        text: "👤 ∂єνєℓσρєя",
        url: DEVELOPER_LINK,
          style: 'danger'
      }
    ]

  ];

  if (isBotAdmin(userId)) {

    rows.push([
      {
        text: "🛡 α∂мιη ραηєℓ",
        callback_data: "menu_admin",
          style: 'primary'
      },
      {
        text: "📲 ωнαтѕαρρ αgєηтѕ",
        callback_data: "menu_wa_agents",
          style: 'primary'
      }
    ]);

  }

  return {
    inline_keyboard: rows
  };

}
function protectmainkeyboard(userId) {
  const rows = [
    [{ text: "⭐ gєт ρяємιυм", callback_data: "menu_premium",style: 'primary' }],
    [
      { text: "✦ α∂∂ ¢нαηηєℓ ✦", callback_data: "menu_add_channel",style: 'success' },
      { text: "✦ α∂∂ gяσυρ ✦", callback_data: "menu_add_group",style: 'success' },
    ],
    [{ text: "○ ρяσмσтє υѕєя", callback_data: "menu_promote",style: 'primary' }],
    [
      { text: "📋 му ¢нαηηєℓѕ", callback_data: "menu_my_channels",style: 'success' },
      { text: "🛡 мσ∂єяαтιση", callback_data: "menu_moderation",style: 'success' },
    ],
  ];
  if (isBotAdmin(userId)) {
    rows.push([{ text: "🛠 α∂мιη ραηєℓ", callback_data: "menu_admin",style: 'danger' }]);
  }
  return { inline_keyboard: rows };
}
function backKeyboard() {
  return { inline_keyboard: [[{ text: "‹ вα¢к", callback_data: "menu_back",style: 'success' }]] };
}

function backToAdminKeyboard() {
  return { inline_keyboard: [[{ text: "‹ вα¢к", callback_data: "menu_admin" ,style: 'success' }]] };
}

/* ============================================================
 * Per-chat ⚙️ Settings panel — shown automatically the moment a
 * chat finishes being added, and reachable any time afterward
 * from 📂 My Channels. Only a bot admin, or the user who added
 * that specific chat, may view/toggle it — and every toggle here
 * only ever touches getChatSettings(<that chat's id>).
 * ============================================================ */

function canManageChat(userId, targetChatId) {
  if (isBotAdmin(userId)) return true;
  return listChats(userId).some((c) => String(c.id) === String(targetChatId));
}

function chatTitleFor(targetChatId) {
  const stat = state.chatStats[targetChatId];
  return (stat && stat.title) || String(targetChatId);
}

function chatSettingsText(targetChatId, justAdded) {
  const title = chatTitleFor(targetChatId);
  const rules = getRules(targetChatId);
  const lines = [
  "<blockquote expandable='true'>",
`<b>『 ✧ ⚙️ ꜱᴇᴛᴛɪɴɢꜱ: ${title} ✧』</b>`,
"═══════════════════",
];

if (justAdded) lines.push("✅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ ɪꜱ ɴᴏᴡ ᴀᴄᴛɪᴠᴇ ꜰᴏʀ ᴛʜɪꜱ ᴄʜᴀᴛ.", "");

lines.push(
  `✧ 🖼 ᴘʜᴏᴛᴏ ʟᴏᴄᴋ: ${isPhotoLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
  `✧ ✏️ ᴇᴅɪᴛ ʟᴏᴄᴋ: ${isEditLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
  `✧ 🌊 ꜰʟᴏᴏᴅ ʟᴏᴄᴋ: ${isFloodLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
  `✧ 🔗 ʟɪɴᴋ ʟᴏᴄᴋ: ${isLinkLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
  `✧ ↪️ ꜰᴏʀᴡᴀʀᴅ ʟᴏᴄᴋ: ${isForwardLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
  `✧ 📜 ᴄᴜꜱᴛᴏᴍ ʀᴜʟᴇꜱ: ${rules.length}`,
  `✧ 🚩 ꜰʟᴀɢꜱ ʀᴇᴍᴏᴠᴇᴅ: ${getChatFlags(targetChatId)}`,
  "═══════════════════",
  "<b>➤ тнєꜱє ꜱєттιηgꜱ αρρℓу тσ тнιꜱ ¢нαт σηℓу.</b>",
  "ᴛᴏɢɢʟɪɴɢ ᴏɴᴇ ɴᴇᴠᴇʀ ᴄʜᴀɴɢᴇꜱ ᴀɴʏ ᴏᴛʜᴇʀ ᴄʜᴀɴɴᴇʟ ᴏʀ ɢʀᴏᴜᴘ.",
  "</blockquote>"
);
  return lines.join("\n");
}

function chatSettingsKeyboard(targetChatId) {
  const id = targetChatId;

  const rows = [
    [
      {
        text: `🖼 ᴘʜᴏᴛᴏ ʟᴏᴄᴋ: ${isPhotoLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
        callback_data: `cs_toggle_photolock_${id}`,
        style: "success"
      },
      {
        text: `✏️ ᴇᴅɪᴛ ʟᴏᴄᴋ: ${isEditLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
        callback_data: `cs_toggle_editlock_${id}`,
        style: "success"
      },
    ],
    [
      {
        text: `🌊 ꜰʟᴏᴏᴅ ʟᴏᴄᴋ: ${isFloodLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
        callback_data: `cs_toggle_floodlock_${id}`,
        style: "success"
      },
    ],
    [
      {
        text: `🔗 ʟɪɴᴋ ʟᴏᴄᴋ: ${isLinkLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
        callback_data: `cs_toggle_linklock_${id}`,
        style: "success"
      },
      {
        text: `↪️ ꜰᴏʀᴡᴀʀᴅ ʟᴏᴄᴋ: ${isForwardLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
        callback_data: `cs_toggle_forwardlock_${id}`,
        style: "success"
      },
    ],
    [
      {
        text: "📜 мαηαgє яυℓєꜱ",
        callback_data: `cs_rules_${id}`,
        style: "primary"
      },
      {
        text: "🤖 gυαя∂ιαη αι",
        callback_data: `cs_ai_${id}`,
        style: "primary"
      },
    ],
  ];

  if (isGroupChat(id)) {
    rows.push([
      {
        text: "➡️ ηєxт › (gяσυρ ρяσтє¢тιση)",
        callback_data: `cs_open2_${id}`,
        style: "success"
      }
    ]);
  }

  rows.push([
    {
      text: "‹ вα¢к тσ му ¢нαηηєℓꜱ",
      callback_data: "menu_my_channels",
      style: "success"
    }
  ]);

  return {
    inline_keyboard: rows
  };
}
/* ------------------------------------------------------------
 * Page 2 of ⚙️ Settings — group-only protection (skipped for
 * channels, since these don't apply there).
 * ------------------------------------------------------------ */

function chatSettingsText2(targetChatId) {
  const title = chatTitleFor(targetChatId);
  const blacklist = getBlacklist(targetChatId);
  return [
"<blockquote expandable='true'>",
`<b>『 ✧ ⚙️ ɢʀᴏᴜᴘ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ: ${title} ✧』</b>`,
"═══════════════════",
`✧ 🐌 ꜱʟᴏᴡ ᴍᴏᴅᴇ: ${isSlowModeEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
`✧ 🌙 ɴɪɢʜᴛ ᴍᴏᴅᴇ: ${isNightModeEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
`✧ 🛡 ᴀɴᴛɪ-ʀᴀɪᴅ: ${isAntiRaidEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
`✧ 🤖 ᴄᴀᴘᴛᴄʜᴀ ᴏɴ ᴊᴏɪɴ: ${isCaptchaEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
`✧ 🔗 ᴀɴᴛɪ-ʙɪᴏ-ʟɪɴᴋ: ${isBioLinkLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
`✧ 🎬 ꜱᴛɪᴄᴋᴇʀ/ɢɪꜰ ʟᴏᴄᴋ: ${isStickerLockEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
`✧ ⚠️ ᴡᴀʀɴ ꜱʏꜱᴛᴇᴍ: ${isWarnSystemEnabled(targetChatId) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"} (${WARN_LIMIT} ꜱᴛʀɪᴋᴇꜱ = ʙᴀɴ)`,
`✧ 🚫 ʙʟᴀᴄᴋʟɪꜱᴛᴇᴅ ᴡᴏʀᴅꜱ: ${blacklist.length}`,
"═══════════════════",
"<b>➤ gяσυρ-σηℓу ρяσтє¢тιση ƒσя тнιꜱ ¢нαт.</b>",
"</blockquote>"
].join("\n");
}
function chatSettingsKeyboard2(targetChatId) {
  const id = targetChatId;

  return {
    inline_keyboard: [
      [
        {
          text: `🐌 ꜱʟᴏᴡ: ${isSlowModeEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_slowmode_${id}`,
          style: "success"
        },
        {
          text: `🌙 ɴɪɢʜᴛ: ${isNightModeEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_night_${id}`,
          style: "success"
        }
      ],
      [
        {
          text: `🛡 ᴀɴᴛɪ-ʀᴀɪᴅ: ${isAntiRaidEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_antiraid_${id}`,
          style: "success"
        },
        {
          text: `🤖 ᴄᴀᴘᴛᴄʜᴀ: ${isCaptchaEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_captcha_${id}`,
          style: "success"
        }
      ],
      [
        {
          text: `🔗 ʙɪᴏ ʟɪɴᴋ: ${isBioLinkLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_biolink_${id}`,
          style: "success"
        },
        {
          text: `🎬 ꜱᴛɪᴄᴋᴇʀ/ɢɪꜰ: ${isStickerLockEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_sticker_${id}`,
          style: "success"
        }
      ],
      [
        {
          text: `⚠️ ᴡᴀʀɴ: ${isWarnSystemEnabled(id) ? "ᴏɴ ✅" : "ᴏꜰꜰ ❌"}`,
          callback_data: `cs_toggle_warn_${id}`,
          style: "success"
        }
      ],
      [
        {
          text: "🚫 вℓα¢кℓιꜱт ωσя∂ꜱ",
          callback_data: `cs_blacklist_${id}`,
          style: "primary"
        }
      ],
      [
        {
          text: "⬅️ вα¢к",
          callback_data: `cs_open_${id}`,
          style: "primary"
        }
      ]
    ]
  };
}
function chatBlacklistKeyboard(targetChatId) {
  const list = getBlacklist(targetChatId);
  const rows = list.map((w, i) => [
    { text: w.length > 30 ? w.slice(0, 30) + "…" : w, callback_data: "noop" },
    { text: "🗑", callback_data: `cs_worddel_${targetChatId}_${i}` },
  ]);
  rows.push([{ text: "➕ α∂∂ ωσя∂", callback_data: `cs_addword_${targetChatId}`, style: 'success' }]);
  rows.push([{ text: "‹ вα¢к тσ gяσυρ ρяσтє¢тιση", callback_data: `cs_open2_${targetChatId}`, style: 'primary' }]);
  return { inline_keyboard: rows };
}

function chatBlacklistText(targetChatId) {
  const list = getBlacklist(targetChatId);
  const title = chatTitleFor(targetChatId);
  return list.length
    ? `🚫 *Blacklisted Words — ${title}*\n\nAny message containing one of these is auto-deleted in this chat only:`
    : `🚫 *Blacklisted Words — ${title}*\n\nNo words blacklisted yet for this chat.`;
}

async function showChatSettingsPanel2(destChatId, messageId, targetChatId) {
  const text = chatSettingsText2(targetChatId);
  try {
    await bot.editMessageCaption(text, {
      chat_id: destChatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: chatSettingsKeyboard2(targetChatId),
    });
  } catch {
    try {
      await bot.editMessageText(text, {
        chat_id: destChatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: chatSettingsKeyboard2(targetChatId),
      });
    } catch {
      await bot.sendMessage(destChatId, text, { parse_mode: "HTML", reply_markup: chatSettingsKeyboard2(targetChatId) });
    }
  }
}

function chatRulesKeyboard(targetChatId) {
  const rules = getRules(targetChatId);
  const rows = rules.map((r, i) => [
    { text: r.length > 30 ? r.slice(0, 30) + "…" : r, callback_data: "noop" },
    { text: "🗑", callback_data: `cs_ruledel_${targetChatId}_${i}` },
  ]);
  rows.push([{ text: "➕ α∂∂ яυℓє", callback_data: `cs_addrule_${targetChatId}`, style: 'success' }]);
  rows.push([{ text: "‹ вα¢к тσ ѕєттιηgѕ", callback_data: `cs_open_${targetChatId}`, style: 'primary' }]);
  return { inline_keyboard: rows };
}

function chatRulesText(targetChatId) {
  const rules = getRules(targetChatId);
  const title = chatTitleFor(targetChatId);
  return rules.length
    ? `📜 *Custom Rules — ${title}*\n\nMessages/images violating any of these are auto-deleted in this chat only:`
    : `📜 *Custom Rules — ${title}*\n\nNo rules set yet for this chat.`;
}

async function sendChatSettingsPanel(destChatId, targetChatId, justAdded) {
  await bot.sendMessage(destChatId, chatSettingsText(targetChatId, justAdded), {
    parse_mode: "HTML",
    reply_markup: chatSettingsKeyboard(targetChatId),
  });
}

async function showChatSettingsPanel(destChatId, messageId, targetChatId) {
  const text = chatSettingsText(targetChatId, false);
  try {
    await bot.editMessageCaption(text, {
      chat_id: destChatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: chatSettingsKeyboard(targetChatId),
    });
  } catch {
    try {
      await bot.editMessageText(text, {
        chat_id: destChatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: chatSettingsKeyboard(targetChatId),
      });
    } catch {
      await bot.sendMessage(destChatId, text, { parse_mode: "HTML", reply_markup: chatSettingsKeyboard(targetChatId) });
    }
  }
}

function adminPanelText(userId) {
  const admins = listAdmins();
  const announcement = getAnnouncement();
  const totalProtectedChats = Object.keys(state.chatStats).length;

  return [
    "<blockquote expandable='true'>",
    "<b>『 ✧ 🛠 α∂мιη ραηєℓ ✧』</b>",
    "═══════════════════",
    `✧ Bot Admins: ${admins.length}`,
    `✧ Role: ${isOwner(userId) ? "👑 Owner" : "👮 Admin"}`,
    `✧ Announcement: ${announcement || "<i>None Set</i>"}`,
    `✧ Protected Chats: ${totalProtectedChats}`,
    `✧ Banned Images (shared): ${getBannedImages().length}`,
    "═══════════════════",
    "<b>➤ ѕєℓє¢т αη α¢тιση вєℓσω.</b>",
    "Per-chat protection (Photo Lock, Rules, etc.) is",
    "managed from 📂 My Channels ➜ pick a chat ➜ ⚙️ Settings.",
    "</blockquote>"
  ].join("\n");
}


// ============================================================
// ADMIN PANEL - PAGE 1
// ============================================================

function adminPanelKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "✧ 𝙰𝙳𝙳 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 ✧",
          callback_data: "admin_addprem",
          style: 'success'
        },
        {
          text: "✧ 𝚁𝙴𝙼𝙾𝚅𝙴 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 ✧",
          callback_data: "admin_removeprem",
          style: 'success'
        },
      ],
      [
        {
          text: "✧ 𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚂 ✧",
          callback_data: "admin_stats",
          style: 'primary'
        },
      ],
      [
        {
          text: "𝙽𝙴𝚇𝚃 ›",
          callback_data: "admin_page2",
          style: 'success'
        },
      ],
    ],
  };
}


// ============================================================
// ADMIN PANEL - PAGE 2
// ============================================================

function adminPanelKeyboard2() {
  return {
    inline_keyboard: [
      [
        {
          text: "✧ 𝙱𝚁𝙾𝙰𝙳𝙲𝙰𝚂𝚃 ✧",
          callback_data: "admin_broadcast",
          style: 'success'
        },
      ],
      [
        {
          text: "✧ 𝙴𝙳𝙸𝚃 𝙰𝙽𝙽𝙾𝚄𝙽𝙲𝙴𝙼𝙴𝙽𝚃 ✧",
          callback_data: "admin_edit_announcement",
          style: 'primary'
        },
      ],
      [
        {
          text: "‹ 𝙱𝙰𝙲𝙺",
          callback_data: "admin_panel",
          style: 'success'
        },
        {
          text: "𝙽𝙴𝚇𝚃 ›",
          callback_data: "admin_page3",
          style: 'success'
        },
      ],
    ],
  };
}


// ============================================================
// ADMIN PANEL - PAGE 3
// ============================================================

function adminPanelKeyboard3() {
  return {
    inline_keyboard: [
      [
        {
          text: "✧ 𝙰𝙳𝙳 𝙰𝙳𝙼𝙸𝙽 ✧",
          callback_data: "admin_addadmin",
          style: 'primary'
        },
        {
          text: "✧ 𝚁𝙴𝙼𝙾𝚅𝙴 𝙰𝙳𝙼𝙸𝙽 ✧",
          callback_data: "admin_deladmin",
          style: 'primary'
        },
      ],
      [
        {
          text: "✧ 𝙱𝙰𝙽 𝙸𝙼𝙰𝙶𝙴𝚂 ✧",
          callback_data: "admin_images",
          style: 'primary'
        },
      ],
      [
        {
          text: "‹ 𝙱𝙰𝙲𝙺",
          callback_data: "admin_page2",
          style: 'primary'
        },
      ],
    ],
  };
}
// ============================================================
// SHOW PAGE 1
// ============================================================

async function showAdminPanel(chatId, messageId, userId) {
  const text = adminPanelText(userId);

  try {
    await bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard(),
    });
  } catch {
    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: adminPanelKeyboard(),
      });
    } catch {
      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: adminPanelKeyboard(),
      });
    }
  }
}

// ============================================================
// SHOW PAGE 2
// ============================================================

async function showAdminPanel2(chatId, messageId, userId) {
  const text = adminPanelText(userId);

  try {
    await bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard2(),
    });
  } catch {
    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: adminPanelKeyboard2(),
      });
    } catch {
      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: adminPanelKeyboard2(),
      });
    }
  }
}

// ============================================================
// SHOW PAGE 3
// ============================================================

async function showAdminPanel3(chatId, messageId, userId) {
  const text = adminPanelText(userId);

  try {
    await bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard3(),
    });
  } catch {
    try {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "HTML",
        reply_markup: adminPanelKeyboard3(),
      });
    } catch {
      await bot.sendMessage(chatId, text, {
        parse_mode: "HTML",
        reply_markup: adminPanelKeyboard3(),
      });
    }
  }
}
            function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function editToMainMenu(query) {
  const menuPath = path.join(__dirname, "menu.jpg");
  try {
    if (!fs.existsSync(menuPath)) throw new Error(`menu.jpg not found at ${menuPath}`);

    // A read-stream's "error" event fires asynchronously — a try/catch around the
    // await below does NOT catch it. Without this listener, a failed read here
    // (bad path, permissions, race with another read) throws unhandled and takes
    // down the whole bot process, not just this one menu tap.
    const mediaStream = fs.createReadStream(menuPath);
    mediaStream.on("error", (streamErr) => {
      console.error("menu.jpg read-stream error:", streamErr.message);
    });

    await bot.editMessageMedia(
      {
        type: "photo",
        media: mediaStream,
        caption: mainMenuText(query.from.id),
        parse_mode: "HTML"
      },
      {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: mainMenuKeyboard(query.from.id)
      }
    );

  } catch (err) {
    console.log("EDIT MENU ERROR:", err.response?.body || err.message);

    await sendMainMenu(
      query.message.chat.id,
      query.from.id
    );
  }
}
async function sendMainMenu(chatId, userId) {
  await bot.sendPhoto(chatId, path.join(__dirname, "menu.jpg"), {
    caption: mainMenuText(userId),
    parse_mode: "HTML",
    reply_markup: mainMenuKeyboard(userId),
  });
}

/* ============================================================
 * /start — mark reachable, gate on force-join, show the menu
 * ============================================================ */
bot.onText(/\/start(?:@\w+)?(?:\s|$)/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  markStarted(userId);

  if (msg.chat.type !== "private") return;

  sendTalkingIntro(chatId); // fire-and-forget — never blocks /start

  const missing = await getMissingChannels(userId);

  if (missing.length > 0) {
    return bot.sendMessage(
      chatId,
      `
<blockquote expandable='true'><b>〔 🌸 νєяιƒι¢αтιση 〕</b></blockquote>

<blockquote expandable='true'>
ᴘʟᴇᴀꜱᴇ ᴊᴏɪɴ ᴀʟʟ ʀᴇQᴜɪʀᴇᴅ
ᴄʜᴀɴɴᴇʟꜱ ᴛᴏ ᴄᴏɴᴛɪɴᴜᴇ.
</blockquote>
<blockquote expandable='true'><b>σωηєя: ∂ανє тє¢н</b></blockquote>
`,
      {
        parse_mode: "HTML",
        reply_markup: forceJoinKeyboard(missing)
      }
    );
  }

  // Check if user is already authenticated
  if (!users[userId]?.loggedIn) {
    return bot.sendMessage(
      chatId,
      `
<blockquote expandable='true'><b>〔 🌸 ωєℓ¢σмє 〕</b></blockquote>

<b>🤖 ωєℓ¢σмє тσ мιꜱꜱ αяια</b>

<blockquote expandable='true'>
ᴄʀᴇᴀᴛᴇ ᴀɴ ᴀᴄᴄᴏᴜɴᴛ ᴛᴏ
ꜱʏɴᴄ ʏᴏᴜʀ ᴄʜᴀᴛꜱ,
ᴍᴇᴍᴏʀʏ, ᴀɪ ꜱᴇᴛᴛɪɴɢꜱ,
ᴀɴᴅ ᴘʀᴇᴍɪᴜᴍ ꜰᴇᴀᴛᴜʀᴇꜱ.
</blockquote>

✨ <i>ʏᴏᴜ ᴄᴀɴ ᴀʟꜱᴏ ꜱᴋɪᴘ ᴀɴᴅ
ᴄᴏɴᴛɪɴᴜᴇ ᴀꜱ ᴀ ɢᴜᴇꜱᴛ.</i>
`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✨ ¢яєαтє α¢¢συηт",
                callback_data: "signup",
                style: 'success'
              }
            ],
            [
              {
                text: "🔐 ℓσg ιη",
                callback_data: "login",
                style: 'primary'
              }
            ],
            [
              {
                text: "⏭️ ꜱкιρ ƒσя ησω",
                callback_data: "guest_continue",
                style: 'danger'
              }
            ]
          ]
        }
      }
    );
  }

  await sendMainMenu(chatId, userId);
});
bot.on("callback_query", async (query) => {
    if (query.data !== "guest_continue") return;

    const chatId = query.message.chat.id;

    await bot.answerCallbackQuery(query.id);

    await bot.editMessageText(
`
<blockquote expandable='true'><b>🌸 gυєѕт мσ∂є α¢тιναтє∂</b></blockquote>

<b>ωєℓ¢σмє тσ мιѕѕ αяια ✨</b>

<blockquote expandable='true'><b>
You are continuing as a guest.</B><blockquote expandable='true'>

<b>gυєѕт ℓιмιтαтισηѕ:</b>
• No saved memory
• No account sync
• No premium features

<i>Create an account anytime to unlock everything 💖</i>
`,
{
    chat_id: chatId,
    message_id: query.message.message_id,
    parse_mode: "HTML",
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: "🌸 ¢яєαтє α¢¢συηт",
                    callback_data: "signup",
                    style: 'success'
                }
            ],
            [
                {
                    text: "✨ ¢σηтιηυє",
                    callback_data: "continue_guest",
                    style: 'primary'
                }
            ]
        ]
    }
});

});
bot.on("callback_query", async (query) => {

    if (query.data !== "continue_guest") return;

    const userId = query.from.id;

    await bot.answerCallbackQuery(query.id);

    await bot.sendMessage(
        query.message.chat.id,
`
<blockquote expandable='true'><b>🌸⛧ мιѕѕ αяια • ꜱуꜱтєм ιηƒσ ⛧🌸</b></ blockquote>

〣 ✦ 〈 ʙᴏᴛ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 〉 ✦ 〣

✨ <b>gυєѕт α¢¢єѕѕ єηαвℓє∂</b>

➜ 🌷 ᴏᴡɴᴇʀ      : <b>∂ανє тє¢н</b>

➜ 💌 ᴛᴇʟᴇɢʀᴀᴍ   : <code>t.me/F3BAN</code>

➜ ⚡ ᴠᴇʀꜱɪᴏɴ    : <b>7.0</b>

➜ 🌸 ᴘʀᴇꜰɪx     : <b>[ / ]</b>

➜ 🤖 ᴇɴɢɪɴᴇ     : <b>υη¢єηѕσяє∂</b>

➜ 💎 ᴇᴅɪᴛɪᴏɴ    : <b>ρяємιυм</b>

<i>Your chats will not be saved permanently</i>.
`,
        {
            parse_mode: "HTML"
        }
    );

    // Open your main menu
    sendMainMenu(query.message.chat.id, userId);

});
bot.on("callback_query", async (query) => {

    if (query.data !== "signup") return;

    signupState.set(query.from.id, true);

    await bot.answerCallbackQuery(query.id);

    await bot.editMessageText(
`
<blockquote expandable='true'><b> 〣 ✦ 〈 вσт ιηƒσямαтιση 〉 ✦ 〣</b></blockquote>

🌸 <b>¢яєαтє уσυя мιѕѕ αяια α¢¢συηт</b>

<b>ρℓєαѕє ѕєη∂ уσυя gмαιℓ α∂∂яєѕѕ.</b>

➜ ⚡ ᴠᴇʀꜱɪᴏɴ    : <b>7.0</b>

➜ 🌸 ᴘʀᴇꜰɪx     : <b>[ / ]</b>

➜ 🤖 ᴇɴɢɪɴᴇ     : <b>υη¢єηѕσяє∂</b>

➜ 💎 ᴇᴅɪᴛɪᴏɴ    : <b>ρяємιυм</b>

Example:

<code>example@gmail.com</code>

<i>We'll send you a verification code.</i>
`,
{
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    parse_mode:"HTML",
    reply_markup:{
        inline_keyboard:[
            [
                {
                    text:"❌ ¢αη¢єℓ",
                    callback_data:"cancel_signup"
                },
                {
                    text: "👨🏻‍💻 σωηєя",
                    url:'https://t.me/F3BAN'
                }
            ]
        ]
    }
});
});

/* ============================================================
 * ✨ SMART NATURAL AI UX
 * Adds helpful natural-language shortcuts without replacing the
 * existing command system. Image/broadcast requests are left for
 * their dedicated handlers below.
 * ============================================================ */
bot.on("message", async (msg) => {
  try {
    if (!msg?.from || !msg.text || msg.text.startsWith("/")) return;
    const intent = detectIntent(msg.text);

    if (intent === "help") {
      await bot.sendMessage(msg.chat.id,
        `<b>✦ ᴍɪss ᴀʀɪᴀ • ɴᴀᴛᴜʀᴀʟ ᴀɪ</b>\n\n` +
        `You can talk normally — no command required.\n\n` +
        `🎨 <b>Images:</b> “make me an image of a cyberpunk city”\n` +
        `📢 <b>Broadcast:</b> “broadcast this” (admin only)\n` +
        `🧠 <b>Chat:</b> ask questions normally\n` +
        `📎 <b>Media:</b> send supported files/images for available analysis`,
        { parse_mode: "HTML", reply_to_message_id: msg.message_id }
      ).catch(() => {});
      return;
    }

    if (intent === "status") {
      const started = process.uptime();
      const minutes = Math.floor(started / 60);
      await bot.sendMessage(msg.chat.id,
        `<b>✦ ᴍɪss ᴀʀɪᴀ • ꜱʏꜱᴛᴇᴍ</b>\n\n` +
        `🟢 <b>Status:</b> Online\n` +
        `⚡ <b>Uptime:</b> ${minutes}m\n` +
        `🧠 <b>Mode:</b> Natural AI\n` +
        `🛡️ <b>Error shield:</b> Active`,
        { parse_mode: "HTML", reply_to_message_id: msg.message_id }
      ).catch(() => {});
    }
  } catch (error) {
    console.error("[SMART AI UX]", error?.message || error);
  }
});

/* ============================================================
 * 🎨 NATURAL-LANGUAGE IMAGE GENERATION
 * Users do not need /image or any command.
 *
 * Examples:
 *   "can you generate an image of a futuristic Lagos skyline"
 *   "make me a picture of a cute cat"
 *
 * The handler uses a ChatGPT-style progress animation, validates
 * provider responses, and falls back automatically if a provider fails.
 * ============================================================ */
bot.on("message", async (msg) => {
  try {
    if (!msg.text || msg.text.startsWith("/") || !msg.from) return;

    if (isNaturalImageQuestion(msg.text)) return;

    const request = detectNaturalImageRequest(msg.text);
    if (!request.isImageRequest) return;

    const chatId = msg.chat.id;
    const prompt = request.prompt;

    if (!prompt) {
      await bot.sendMessage(
        chatId,
        "🎨 Tell me what you want to create — for example: <code>can you generate an image of a futuristic city?</code>",
        { parse_mode: "HTML", reply_to_message_id: msg.message_id }
      ).catch(() => {});
      return;
    }

    const frames = [
      ["🧠 Understanding your idea…", 15],
      ["🎨 Planning the composition…", 35],
      ["✨ Rendering your image…", 60],
      ["🌈 Adding the final details…", 82],
      ["🪄 Polishing the result…", 95]
    ];

    const first = frames[0];
    const loading = await bot.sendMessage(
      chatId,
      `<b>✦ ᴍɪss ᴀʀɪᴀ • ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ</b>\n\n${first[0]}\n<code>██░░░░░░░░</code> ${first[1]}%`,
      {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id
      }
    );

    let frame = 1;
    let finished = false;

    const animation = setInterval(async () => {
      if (finished || frame >= frames.length) return;
      const [label, percent] = frames[frame++];
      const filled = Math.max(1, Math.round(percent / 10));
      const bar = "█".repeat(filled) + "░".repeat(10 - filled);

      await bot.editMessageText(
        `<b>✦ ᴍɪss ᴀʀɪᴀ • ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ</b>\n\n${label}\n<code>${bar}</code> ${percent}%`,
        {
          chat_id: chatId,
          message_id: loading.message_id,
          parse_mode: "HTML"
        }
      ).catch(() => {});
    }, 1100);

    try {
      const result = await withRetry(() => generateNaturalImage(prompt), { retries: 1, baseDelay: 1200 });
      finished = true;
      clearInterval(animation);

      await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

      await bot.sendPhoto(
        chatId,
        result.image,
        {
          caption:
            `<b>✨ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛᴇᴅ</b>\n\n` +
            `<blockquote>📝 <b>Prompt</b>\n<code>${escapeHtml(prompt)}</code>\n\n` +
            `⚡ <b>Engine:</b> ${escapeHtml(result.engine)}\n` +
            `🌸 <b>Miss Aria</b></blockquote>`,
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id
        }
      );
    } catch (err) {
      finished = true;
      clearInterval(animation);
      console.error("[NATURAL IMAGE ERROR]", err.message);

      await bot.editMessageText(
        `⚠️ <b>I couldn't finish that image.</b>\n\n` +
        `<blockquote>Both image engines were unavailable right now. ` +
        `Please try the same request again in a moment.</blockquote>`,
        {
          chat_id: chatId,
          message_id: loading.message_id,
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id
        }
      ).catch(async () => {
        await bot.sendMessage(
          chatId,
          "⚠️ Image generation failed. Please try again in a moment.",
          { reply_to_message_id: msg.message_id }
        ).catch(() => {});
      });
    }
  } catch (err) {
    console.error("[NATURAL IMAGE HANDLER]", err.message);
  }
});

/* ============================================================
 * 📢 NATURAL-LANGUAGE BROADCAST STARTER
 * Admins can say "broadcast this" instead of remembering /broadcast.
 * The existing preview + confirmation system is still used.
 * ============================================================ */
bot.on("message", async (msg) => {
  try {
    if (!msg.text || msg.text.startsWith("/") || msg.chat.type !== "private") return;

    const text = msg.text.trim();
    if (!/^(?:broadcast|broadcast this|send this to everyone|announce this)\s*[:\-]?\s*$/i.test(text)) return;

    if (!isBotAdmin(msg.from.id)) {
      await bot.sendMessage(msg.chat.id, "🚫 You're not authorized to broadcast.");
      return;
    }

    setPending(msg.from.id, { action: "admin_broadcast" });

    await bot.sendMessage(
      msg.chat.id,
      "📢 <b>Broadcast mode enabled.</b>\n\nSend the text, photo, video, document, or other supported Telegram message you want to broadcast. I'll show a preview and require confirmation before sending.",
      {
        parse_mode: "HTML",
        reply_markup: backToAdminKeyboard()
      }
    );
  } catch (err) {
    console.error("[NATURAL BROADCAST ERROR]", err.message);
  }
});

bot.on("message", async (msg) => {
    const userId = msg.from.id;

    if (!signupState.has(userId)) return;
    if (!msg.text) return;

    const email = msg.text.trim();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    if (!gmailRegex.test(email)) {
        return bot.sendMessage(
            msg.chat.id,`
            <blockquote expandable='true'><b>💎 ρяємιυм</b></blockquote>

<b>🌸 ωєℓ¢σмє тσ тнє ρяємιυм мєηυ</b>

➜ ⚡ ρяємιυм ƒєαтυяєѕ
➜ 💎 ρяємιυм α¢¢єѕѕ
➜ 👑 νιρ мємвєяѕнιρ

<b>❌ ιηναℓι∂ gмαιℓ</b>

🩷 ρσωєяє∂ ву ∂ανє тє¢н`,
        );
    }

    signupState.delete(userId);

    const code = generateCode();

        console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      🌸 Miss Aria ᴀᴄᴛɪᴠᴇ     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 👨‍💻 ᴅᴇᴠᴇʟᴏᴘᴇʀ : ᴅᴀᴠᴇ ᴛᴇᴄʜ
┃ 🤖 ꜱᴛᴀᴛᴜꜱ    : ᴏɴʟɪɴᴇ
┃ ⚡ ᴇɴɢɪɴᴇ    : ᴠɪɴᴇx ᴠ8
┃ 💎 ᴇᴅɪᴛɪᴏɴ   : ᴘʀᴇᴍɪᴜᴍ
┃ ✅ verification : Active
┃ 📲 Code : ${code}
┃ 📧 Email : ${email}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🌸 ʙᴏᴛ ɪꜱ ɴᴏᴡ ʀᴜɴɴɪɴɢ...
⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴀᴠᴇ ᴛᴇᴄʜ
`);

    verificationState.set(userId, {
        email,
        code,
        attempts: 0,
        expires: Date.now() + 10 * 60 * 1000
    });

    const sent = await sendVerificationEmail(email, code);

    if (!sent) {
        verificationState.delete(userId);

        return bot.sendMessage(
            msg.chat.id,
              `❌ Failed to send the verification email. Please try again later.`
        );
    }

    await bot.sendMessage(
        msg.chat.id,
        `<blockquote expandable='true'><b> 〣 ✦ 〈 вσт ιηƒσямαтισζ 〉 ✦ 〣</b></blockquote>

📩 <b>νєяιƒι¢αтισζ ¢σ∂є ѕєηт</b>

<b>Α 6-∂ιgιт νєяιƒι¢αтισζ ¢σ∂є нαѕ вєєη ѕєηт тσ:</b>

<code>${email}</code>

<b>ρℓєαѕє ѕєη∂ тнє ¢σ∂є нєяє.</b>

<i>⏳ Εχριяєѕ ιη 10 мιηυтєѕ.</i>
`,
        {
            parse_mode: "HTML"
        }
    );
});
// ==========================================
// VERIFY EMAIL CODE
// ==========================================


bot.on("message", async (msg) => {
    try {
        const userId = msg.from.id;

        const verify = verificationState.get(userId);

        if (!verify) return;
        if (!msg.text) return;

        const enteredCode = msg.text.trim();

        // Ignore emails while verification is active
        if (enteredCode.includes("@")) return;

        // ==========================================
        // CODE EXPIRED
        // ==========================================

        if (Date.now() > verify.expires) {
            verificationState.delete(userId);

            return bot.sendMessage(
                msg.chat.id,
                `
<blockquote expandable='true'><b>〣 ✦ 〈 νєяιƒι¢αтιση 〉 ✦ 〣</b></blockquote>

⏰ <b>νєяιƒι¢αтιση єxριяє∂</b>

╭─〔 ᴠᴇʀɪꜰɪᴄᴀᴛɪᴏɴ 〕
│
│ ❌ ᴛʜᴇ ᴄᴏᴅᴇ ʜᴀꜱ ᴇxᴘɪʀᴇᴅ
│ ✦ ᴘʟᴇᴀꜱᴇ ʀᴇꜱᴛᴀʀᴛ ᴠᴇʀɪꜰɪᴄᴀᴛɪᴏɴ
│
╰────────────────
`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔄 яєꜱтαят",
                                    callback_data: "restart_verification",
                                    style:'success'
                                },
                                {
                                    text: "❌ ¢αη¢єℓ",
                                    callback_data: "cancel_signup",
                                    style:'primary'
                                }
                            ]
                        ]
                    }
                }
            );
        }

        // ==========================================
        // INVALID CODE
        // ==========================================

        if (enteredCode !== verify.code) {
            verify.attempts++;

            // 5 WRONG ATTEMPTS
            if (verify.attempts >= 5) {
                verificationState.delete(userId);

                return bot.sendMessage(
                    msg.chat.id,
                    `
<blockquote expandable='true'><b>〣 ✦ 〈 νєяιƒι¢αтιση 〉 ✦ 〣</b></blockquote>

❌ <b>тσσ мαηу αттємρтꜱ</b>

╭─〔 ᴀᴄᴄᴇꜱꜱ ᴅᴇɴɪᴇᴅ 〕
│
│ ❌ ᴠᴇʀɪꜰɪᴄᴀᴛɪᴏɴ ʀᴇꜱᴇᴛ
│ ✦ ʀᴇᴀꜱᴏɴ : 5/5 ᴡʀᴏɴɢ ᴀᴛᴛᴇᴍᴘᴛꜱ
│
╰────────────────

🔄 <b>ρℓєαꜱє яєꜱтαят тσ тяу αgαιη.</b>
`,
                    {
                        parse_mode: "HTML",
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🔄 яєꜱтαят",
                                        callback_data: "restart_verification"
                                    }
                                ]
                            ]
                        }
                    }
                );
            }

            // SAVE UPDATED ATTEMPTS
            verificationState.set(userId, verify);

            return bot.sendMessage(
                msg.chat.id,
                `
<blockquote expandable='true'><b>〣 ✦ 〈 νєяιƒι¢αтιση 〉 ✦ 〣</b></blockquote>

❌ <b>ιηναℓι∂ νєяιƒι¢αтιση ¢σ∂є</b>

╭─〔 ᴠᴇʀɪꜰɪᴄᴀᴛɪᴏɴ 〕
│
│ ✦ ᴀᴛᴛᴇᴍᴘᴛꜱ : <b>${verify.attempts}/5</b>
│ ✦ ꜱᴛᴀᴛᴜꜱ : ❌ ɪɴᴠᴀʟɪᴅ
│
╰────────────────

📩 <b>¢нє¢к уσυя gмαιℓ</b>

ᴇɴᴛᴇʀ ᴛʜᴇ ᴄᴏʀʀᴇᴄᴛ ᴄᴏᴅᴇ ᴛᴏ ᴄᴏɴᴛɪɴᴜᴇ.
`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🔄 яєꜱтαят",
                                    callback_data: "restart_verification",
                                    style: 'success'
                                },
                                {
                                    text: "📩 ¢нє¢к gмαιℓ",
                                    callback_data: "check_gmail",
                                    style: 'primary'
                                }
                            ]
                        ]
                    }
                }
            );
        }

        // ==========================================
        // CODE IS CORRECT
        // ==========================================

        verificationState.delete(userId);

        if (!users[userId]) {
            users[userId] = {};
        }

        users[userId].email = verify.email;
        users[userId].verified = true;
        users[userId].createdAt = Date.now();
        // loggedIn stays unset until they set a password just below —
        // that's also what the existing /login (email+password) flow
        // checks against via bcrypt.compare.

        saveUsers();

        passwordSetupState.set(userId, verify.email);

        await bot.sendMessage(
            msg.chat.id,
            `
<blockquote expandable='true'><b>〣 ✦ 〈 α¢¢συηт 〉 ✦ 〣</b></blockquote>

✅ <b>ємαιℓ νєяιƒιє∂</b>

📧 <code>${verify.email}</code>

🔐 <b>ѕєт α ραѕѕωσя∂</b>

Choose a password (min 6 characters) — you'll use this to log back in next time instead of re-verifying your email.

<i>Just send it as a normal message now.</i>
`,
            {
                parse_mode: "HTML"
            }
        );

    } catch (error) {
        console.error("Verification error:", error);
    }
});

// ==========================================
// SET PASSWORD (final step of signup, right after email verification)
// ==========================================

bot.on("message", async (msg) => {
    try {
        const userId = msg.from.id;

        if (!passwordSetupState.has(userId)) return;
        if (!msg.text) return;

        const password = msg.text.trim();

        if (password.length < 6) {
            return bot.sendMessage(
                msg.chat.id,
                `❌ <b>ραѕѕωσя∂ тσσ ѕнσят</b>\n\nPlease send a password with at least 6 characters.`,
                { parse_mode: "HTML" }
            );
        }

        passwordSetupState.delete(userId);

        const hash = await bcrypt.hash(password, 10);

        if (!users[userId]) users[userId] = {};
        users[userId].password = hash;
        users[userId].loggedIn = true;

        saveUsers();

        await bot.sendMessage(
            msg.chat.id,
            `
🌸 <b>αℓℓ ѕєт!</b>

╭─〔 ᴠᴇʀɪꜰɪᴇᴅ 〕
│
│ ✅ ᴇᴍᴀɪʟ ᴠᴇʀɪꜰɪᴇᴅ
│ 🔐 ᴘᴀssᴡᴏʀᴅ sᴀᴠᴇᴅ
│ 📧 <code>${users[userId].email}</code>
│
╰────────────────

💖 ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ <b>мιꜱꜱ αяια</b>! Use the 🔑 Login button anytime to log back in with this password.
`,
            { parse_mode: "HTML" }
        );

        await sendMainMenu(msg.chat.id, userId);

    } catch (err) {
        console.error("Password setup error:", err);
    }
});


// ==========================================
// RESTART VERIFICATION
// ==========================================

bot.on("callback_query", async (query) => {
    try {
        if (query.data !== "restart_verification") return;

        const userId = query.from.id;

        verificationState.delete(userId);

        await bot.answerCallbackQuery(query.id);

        await bot.editMessageText(
            `
<blockquote expandable='true'><b>〣 ✦ 〈 νєяιƒι¢αтιση яєꜱєт 〉 ✦ 〣</b></blockquote>

🔄 <b>νєяιƒι¢αтιση яєꜱтαятє∂</b>

╭─〔 ɴᴇxᴛ ꜱᴛᴇᴘ 〕
│
│ 📧 ᴘʟᴇᴀꜱᴇ ᴇɴᴛᴇʀ ʏᴏᴜʀ ɢᴍᴀɪʟ
│
╰────────────────

💌 ᴀ ɴᴇᴡ ᴠᴇʀɪꜰɪᴄᴀᴛɪᴏɴ ᴄᴏᴅᴇ ᴡɪʟʟ ʙᴇ ꜱᴇɴᴛ.
`,
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                parse_mode: "HTML"
            }
        );

    } catch (error) {
        console.error("Restart verification error:", error);

        try {
            await bot.answerCallbackQuery(query.id, {
                text: "❌ Failed to restart verification."
            });
        } catch {}
    }
});
// ==========================================
// RESEND VERIFICATION CODE
// ==========================================
bot.on("callback_query", async (query) => {
    try {
        if (query.data !== "resend_signup_code") return;

        const userId = query.from.id;
        const verify = verificationState.get(userId);

        if (!verify) {
            return bot.answerCallbackQuery(query.id, {
                text: "Signup session expired."
            });
        }

        verify.code = generateCode();
        verify.expires = Date.now() + (10 * 60 * 1000);
        verify.attempts = 0;

        verificationState.set(userId, verify);

        const resent = await sendVerificationEmail(
            verify.email,
            verify.code
        );

        if (!resent) {
            return bot.answerCallbackQuery(query.id, {
                text: "❌ Email delivery failed. Check SMTP settings."
            });
        }

        await bot.answerCallbackQuery(query.id, {
            text: "New verification code sent."
        });

        await bot.sendMessage(
            query.message.chat.id,
            `
📩 <b>ηєω νєяιƒι¢αтιση ¢σ∂є ꜱєηт</b>

ᴀ ꜰʀᴇꜱʜ ᴠᴇʀɪꜰɪᴄᴀᴛɪᴏɴ ᴄᴏᴅᴇ ʜᴀꜱ ʙᴇᴇɴ ꜱᴇɴᴛ ᴛᴏ:

<code>${verify.email}</code>

📩 ᴘʟᴇᴀꜱᴇ ᴄʜᴇᴄᴋ ʏᴏᴜʀ ɪɴʙᴏx.
`,
            {
                parse_mode: "HTML"
            }
        );

    } catch (error) {
        console.error("Resend code error:", error);

        try {
            await bot.answerCallbackQuery(query.id, {
                text: "❌ Failed to resend verification code."
            });
        } catch {}
    }
});
bot.on("callback_query", async (query) => {

    if (query.data !== "login") return;

    loginEmailState.set(query.from.id, true);

    await bot.answerCallbackQuery(query.id);

    await bot.editMessageText(
`
╭━━━〔 🔐 ʟᴏɢ ɪɴ 〕━━━╮

<b>🌸 ωєℓ¢σмє вα¢к</b>

<blockquote expandable='true'>
ᴘʟᴇᴀꜱᴇ ꜱᴇɴᴅ ᴛʜᴇ
<b>gмαιℓ</b> ʏᴏᴜ ᴜꜱᴇᴅ
ᴛᴏ ᴄʀᴇᴀᴛᴇ ʏᴏᴜʀ
ᴍɪꜱꜱ ᴀʀɪᴀ ᴀᴄᴄᴏᴜɴᴛ.

<code>example@gmail.com</code>
</blockquote>

💖 <i>ᴡᴇ'ʟʟ ᴀꜱᴋ ꜰᴏʀ ʏᴏᴜʀ
ᴘᴀꜱꜱᴡᴏʀᴅ ɴᴇxᴛ.</i>
`,
{
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    parse_mode:"HTML",
    reply_markup:{
        inline_keyboard:[
            [
                {
                    text:"❌ ¢αη¢єℓ",
                    callback_data:"cancel_login",
                    style:'success'
                }
            ]
        ]
    }
});

});

bot.on("message", async (msg) => {

    const userId = msg.from.id;

    if (!loginEmailState.has(userId)) return;

    if (!msg.text) return;

    const email = msg.text.trim().toLowerCase();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    if (!gmailRegex.test(email)) {

        return bot.sendMessage(
            msg.chat.id,
            `
❌ <b>ιηναℓι∂ gмαιℓ</b>

Please send a valid Gmail.

Example:

<code>example@gmail.com</code>
`,
            {
                parse_mode: "HTML"
            }
        );

    }

    loginEmailState.delete(userId);

    // Save temporarily
    loginPasswordState.set(userId, email);

    await bot.sendMessage(
        msg.chat.id,
`
🔐 <b>ραѕѕωσя∂ яєqυιяє∂</b>

Gmail:

<code>${email}</code>

Now send your password.
`,
{
    parse_mode:"HTML"
});

});
bot.on("callback_query", async (query) => {

    if (query.data !== "cancel_login") return;

    loginEmailState.delete(query.from.id);
    loginPasswordState.delete(query.from.id);

    await bot.answerCallbackQuery(query.id,{
        text:"Login cancelled."
    });

    await bot.editMessageText(
        "❌ ʟᴏɢɪɴ ᴄᴀɴᴄᴇʟʟᴇᴅ.",
        {
            chat_id:query.message.chat.id,
            message_id:query.message.message_id
        }
    );

});
function findUserByEmail(email) {
    email = email.toLowerCase();

    for (const telegramId in users) {

        if (
            users[telegramId].email &&
            users[telegramId].email.toLowerCase() === email
        ) {
            return {
                telegramId,
                user: users[telegramId]
            };
        }

    }

    return null;
}

// ==========================================
// SIGNUP / SKIP GATE — used to decide whether the AI should reply at
// all, and (separately) whether a fully-signed-up-only feature should
// be allowed.
// ==========================================
function hasSkippedSignup(userId) {
    return !!(users[userId] && users[userId].skippedSignup);
}
function isSignedUp(userId) {
    // "signed up" = finished the whole flow (verified email + set a
    // password), not just started it.
    return !!(users[userId] && users[userId].verified && users[userId].password);
}
// Gate for the AI chat specifically: blocked only if the user has
// neither signed up NOR chosen to skip for now.
function canUseAi(userId) {
    return isSignedUp(userId) || hasSkippedSignup(userId);
}
// Sends the "please sign up (or skip)" prompt. Returns nothing; caller
// should `return` right after calling this so the AI never runs.
async function sendSignupGate(chatId, replyToMessageId) {
    await bot.sendMessage(
        chatId,
        `
<blockquote expandable='true'><b>〣 ✦ 〈 ѕιgη υρ 〉 ✦ 〣</b></blockquote>

🌸 <b>¢яєαтє αη α¢¢συηт тσ ¢нαт ωιтн мιѕѕ αяια</b>

Signing up unlocks everything. If you're not ready yet, you can skip for now — some features will stay locked until you sign up.
`,
        {
            parse_mode: "HTML",
            reply_to_message_id: replyToMessageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📝 sign up", callback_data: "signup" },
                        { text: "⏭ skip for now", callback_data: "skip_signup" }
                    ]
                ]
            }
        }
    );
}

bot.on("callback_query", async (query) => {
    if (query.data !== "skip_signup") return;

    const userId = query.from.id;

    if (!users[userId]) users[userId] = {};
    users[userId].skippedSignup = true;
    saveUsers();

    await bot.answerCallbackQuery(query.id);

    await bot.sendMessage(
        query.message.chat.id,
        `
🌸 <b>σкαу, уσυ ¢αη ¢нαт ησω!</b>

Some features stay locked until you sign up — send /start anytime to finish creating an account.
`,
        { parse_mode: "HTML" }
    );
});

const bcrypt = require("bcryptjs");


bot.on("message", async (msg) => {

    const userId = msg.from.id;

    if (!loginPasswordState.has(userId)) return;

    if (!msg.text) return;

    const password = msg.text.trim();

    const email = loginPasswordState.get(userId);

    loginPasswordState.delete(userId);

    const account = findUserByEmail(email);

    // Account doesn't exist
    if (!account) {

        return bot.sendMessage(
            msg.chat.id,
            `
❌ <b>α¢¢συηт ησт ƒσυη∂</b>

No Miss Aria account exists for

<code>${email}</code>

Please sign up first.
`,
            {
                parse_mode: "HTML"
            }
        );

    }

    // Email exists but not verified
    if (!account.user.verified) {

        return bot.sendMessage(
            msg.chat.id,
            `
⚠️ <b>ємαιℓ ησт νєяιƒιє∂</b>

Please verify your email before logging in.
`,
            {
                parse_mode: "HTML"
            }
        );

    }

    // Compare bcrypt password
    const match = await bcrypt.compare(
        password,
        account.user.password
    );

    if (!match) {

        return bot.sendMessage(
            msg.chat.id,
            `
❌ <b>ιη¢σяяє¢т ραѕѕωσя∂</b>

The password you entered is incorrect.

Please try again.
`,
            {
                parse_mode: "HTML"
            }
        );

    }

    // Login successful
    account.user.loggedIn = true;
    account.user.lastLogin = Date.now();

    saveUsers();

    await bot.sendMessage(
        msg.chat.id,
`
🌸 <b>ℓσgιη ѕυ¢¢єѕѕƒυℓ</b>

Welcome back!

📧 <code>${account.user.email}</code>

Enjoy using Miss Aria 💖
`,
{
    parse_mode: "HTML"
});

    sendMainMenu(msg.chat.id, userId);

});
bot.onText(/\/menu(?:@\w+)?(?:\s|$)/, async (msg) => {
  if (msg.chat.type !== "private") return;
  await sendMainMenu(msg.chat.id, msg.from.id);
});
/* ============================================================
 * "/" alone — quick menu trigger, works in groups and DMs.
 * ============================================================ */
bot.onText(/^\/\s*$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.chat.type === "private") {
    await sendMainMenu(chatId, userId);
    return;
  }

  // In a group, quote-reply with the menu so it's clear what triggered it.
  await bot.sendPhoto(chatId, path.join(__dirname, "menu.jpg"), {
    caption: mainMenuText(userId),
    parse_mode: "HTML",
    reply_markup: mainMenuKeyboard(userId),
    reply_to_message_id: msg.message_id
  });
});

/* ============================================================
 * /maintenance [on|off] — owner-controlled maintenance mode.
 * Only bot admins may even run this command; only the owner can
 * flip the switch. While on, non-admins are met with the
 * MAINTENANCE_MSG everywhere else in the bot (see the
 * processUpdate wrapper near the top of the file).
 * ============================================================ */

// ==========================================
// ᴜɴᴄᴇɴꜱᴏʀᴇᴅ ᴀɪ — ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ
// ==========================================

bot.onText(
    /^\/maintenance(?:@\w+)?(?:\s+(on|off))?\s*$/i,
    async (msg, match) => {
        try {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            // ==========================================
            // ᴄʜᴇᴄᴋ ʙᴏᴛ ᴀᴅᴍɪɴ
            // ==========================================

            if (!isBotAdmin(userId)) {
                return await bot.sendMessage(
                    chatId,
                    `
<blockquote expandable='true'><b>〣 ✦ 〈 υη¢єηꜱσяє∂ αι 〉 ✦ 〣</b></blockquote>

❌ <b>α¢¢єꜱꜱ ∂єηιє∂</b>

╭─〔 ᴘᴇʀᴍɪꜱꜱɪᴏɴ 〕
│
│ 🔒 ʏᴏᴜ ᴅᴏ ɴᴏᴛ ʜᴀᴠᴇ
│    ᴛʜᴇ ʀᴇǫᴜɪʀᴇᴅ ᴘᴇʀᴍɪꜱꜱɪᴏɴ.
│
╰────────────────
`,
                    {
                        parse_mode: "HTML",
                        reply_to_message_id: msg.message_id
                    }
                );
            }

            const arg = match[1]
                ? match[1].toLowerCase()
                : null;

            const maintenanceImage = path.join(
                __dirname,
                "media",
                "maintenance.jpg"
            );

            // ==========================================
            // ᴄʜᴇᴄᴋ ɪᴍᴀɢᴇ
            // ==========================================

            if (!fs.existsSync(maintenanceImage)) {
                console.warn(
                    `[Maintenance] Image not found: ${maintenanceImage}`
                );
            }

            // ==========================================
            // ɴᴏ ᴀʀɢᴜᴍᴇɴᴛ — ꜱʜᴏᴡ ꜱᴛᴀᴛᴜꜱ
            // ==========================================

            if (!arg) {
                const isOn = isMaintenanceOn();

                const status = isOn
                    ? "ᴏɴ 🛠"
                    : "ᴏꜰꜰ 🟢";

                const caption = `
<blockquote expandable='true'><b>〣 ✦ 〈 υη¢єηꜱσяє∂ αι 〉 ✦ 〣</b></blockquote>

🧠 <b>мιꜱꜱ αяια — ꜱуꜱтєм ꜱтαтυꜱ</b>

╭─〔 ᴄᴏʀᴇ ꜱʏꜱᴛᴇᴍ 〕
│
│ ⚡ ᴍᴏᴅᴇ : <b>${status}</b>
│ 🧠 ᴀɪ : <b>яєα∂у</b>
│ 🔐 ᴀᴄᴄᴇꜱꜱ : <b>${isOn ? "ᴀᴅᴍɪɴꜱ ᴏɴʟʏ" : "ᴘᴜʙʟɪᴄ"}</b>
│
╰────────────────

💡 <b>¢σηтяσℓ мαιηтєηαη¢є</b>

<code>/maintenance on</code>
<code>/maintenance off</code>

<blockquote expandable='true'>☠️ ᴜɴꜰɪʟᴛᴇʀᴇᴅ ᴀɪ — ᴍɪꜱꜱ ᴀʀɪᴀ</blockquote>
`;

                if (fs.existsSync(maintenanceImage)) {
                    return await bot.sendPhoto(
                        chatId,
                        fs.createReadStream(maintenanceImage),
                        {
                            caption,
                            parse_mode: "HTML",
                            reply_to_message_id: msg.message_id
                        }
                    );
                }

                return await bot.sendMessage(
                    chatId,
                    caption,
                    {
                        parse_mode: "HTML",
                        reply_to_message_id: msg.message_id
                    }
                );
            }

            // ==========================================
            // ᴏɴʟʏ ᴏᴡɴᴇʀ ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴍᴏᴅᴇ
            // ==========================================

            if (!isOwner(userId)) {
                return await bot.sendMessage(
                    chatId,
                    `
<blockquote expandable='true'><b>〣 ✦ 〈 υη¢єηꜱσяє∂ αι 〉 ✦ 〣</b></blockquote>

☠️ <b>α¢¢єꜱꜱ ∂єηιє∂</b>

╭─〔 ᴏᴡɴᴇʀ ᴏɴʟʏ 〕
│
│ ❌ ʏᴏᴜ ᴀʀᴇ ɴᴏᴛ ᴛʜᴇ ᴏᴡɴᴇʀ.
│
│ 🔐 ᴏɴʟʏ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ
│    ᴄᴀɴ ᴄʜᴀɴɢᴇ ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ.
│
╰────────────────

⚠️ ᴛʜɪꜱ ᴀᴄᴛɪᴏɴ ʜᴀꜱ ʙᴇᴇɴ ʙʟᴏᴄᴋᴇᴅ.
`,
                    {
                        parse_mode: "HTML",
                        reply_to_message_id: msg.message_id
                    }
                );
            }

            // ==========================================
            // ᴜᴘᴅᴀᴛᴇ ꜱᴛᴀᴛᴇ
            // ==========================================

            const enableMaintenance = arg === "on";

            setMaintenance(enableMaintenance);

            // ==========================================
            // ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ ᴏɴ
            // ==========================================

            if (enableMaintenance) {

                const caption = `
<blockquote expandable='true'><b>〣 ✦ 〈 υη¢єηꜱσяє∂ αι 〉 ✦ 〣</b></blockquote>

🛠 <b>мαιηтєηαη¢є мσ∂є єηαвℓє∂</b>

╭─〔 ᴄᴏʀᴇ ꜱʏꜱᴛᴇᴍ 〕
│
│ ⚡ ᴍᴏᴅᴇ : <b>мαιηтєηαη¢є</b>
│ 🧠 ᴀɪ : <b>υρgяα∂ιηg</b>
│ 🔒 ᴀᴄᴄᴇꜱꜱ : <b>α∂мιηꜱ σηℓу</b>
│
╰────────────────

⚠️ <b>мιꜱꜱ αяια ιꜱ ¢υяяєηтℓу υη∂єя мαιηтєηαη¢є.</b>

ᴛʜᴇ ꜱʏꜱᴛᴇᴍ ɪꜱ ʙᴇɪɴɢ ᴜᴘᴅᴀᴛᴇᴅ ᴀɴᴅ ᴏᴘᴛɪᴍɪᴢᴇᴅ.

<blockquote expandable='true'>☠️ ᴜɴꜰɪʟᴛᴇʀᴇᴅ ᴀɪ — ᴍᴏᴅᴇ ʟᴏᴄᴋᴇᴅ</blockquote>
`;

                if (fs.existsSync(maintenanceImage)) {
                    return await bot.sendPhoto(
                        chatId,
                        fs.createReadStream(maintenanceImage),
                        {
                            caption,
                            parse_mode: "HTML",
                            reply_to_message_id: msg.message_id
                        }
                    );
                }

                return await bot.sendMessage(
                    chatId,
                    caption,
                    {
                        parse_mode: "HTML",
                        reply_to_message_id: msg.message_id
                    }
                );
            }

            // ==========================================
            // ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ ᴏꜰꜰ
            // ==========================================

            const caption = `
<blockquote expandable='true'><b>〣 ✦ 〈 υη¢єηꜱσяє∂ αι 〉 ✦ 〣</b></blockquote>

🟢 <b>ꜱуꜱтєм яєꜱтσяє∂</b>

╭─〔 ᴄᴏʀᴇ ꜱʏꜱᴛᴇᴍ 〕
│
│ ⚡ ᴍᴏᴅᴇ : <b>σηℓιηє</b>
│ 🧠 ᴀɪ : <b>яєα∂у</b>
│ 🔓 ᴀᴄᴄᴇꜱꜱ : <b>ρυвℓι¢</b>
│
╰────────────────

🔥 <b>мιꜱꜱ αяια ιꜱ вα¢к.</b>

ᴛʜᴇ ꜱʏꜱᴛᴇᴍ ɪꜱ ɴᴏᴡ ʀᴇᴀᴅʏ ꜰᴏʀ ᴜꜱᴇʀꜱ.

<blockquote expandable='true'>☠️ ᴜɴꜰɪʟᴛᴇʀᴇᴅ ᴀɪ — ᴏɴʟɪɴᴇ</blockquote>
`;

            if (fs.existsSync(maintenanceImage)) {
                return await bot.sendPhoto(
                    chatId,
                    fs.createReadStream(maintenanceImage),
                    {
                        caption,
                        parse_mode: "HTML",
                        reply_to_message_id: msg.message_id
                    }
                );
            }

            return await bot.sendMessage(
                chatId,
                caption,
                {
                    parse_mode: "HTML",
                    reply_to_message_id: msg.message_id
                }
            );

        } catch (error) {
            console.error(
                "Maintenance command error:",
                error
            );

            await bot.sendMessage(
                msg.chat.id,
                `
❌ <b>мαιηтєηαη¢є єяяσя</b>

<code>${String(error.message || error)}</code>
`,
                {
                    parse_mode: "HTML"
                }
            );
        }
    }
);
/* ============================================================
 * Admin-only slash commands — each also works as a button flow
 * via the Admin Panel. An inline argument (e.g. /addprem 12345)
 * applies immediately; with no argument it starts the guided
 * forward/@username flow.
 * ============================================================ */

bot.onText(/^\/admin(?:@\w+)?(?:\s|$)/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  if (!isBotAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, "🚫 You're not authorized to use the admin panel.");
    return;
  }
  await bot.sendMessage(msg.chat.id, adminPanelText(userId), {
    parse_mode: "Markdown",
    reply_markup: adminPanelKeyboard(),
  });
});

async function handlePremCommand(msg, grant) {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  if (!isBotAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, "❌ ʏᴏᴜ ᴀʀᴇ ɴᴏᴛ ᴀɴ ᴀᴅᴍɪɴ.");
    return;
  }
  const arg = msg.text.split(/\s+/).slice(1).join(" ").trim();
  if (!arg) {
    setPending(userId, { action: grant ? "admin_addprem" : "admin_removeprem" });
    await bot.sendMessage(
      msg.chat.id,
      `ꜱᴇɴᴅ ᴛʜᴇ ᴜꜱᴇʀ'ꜱ ɴᴜᴍᴇʀɪᴄ ᴛᴇʟᴇɢʀᴀᴍ ɪᴅ, ꜰᴏʀᴡᴀʀᴅ ᴀ ᴍᴇꜱꜱᴀɢᴇ ꜰʀᴏᴍ ᴛʜᴇᴍ, ᴏʀ ꜱᴇɴᴅ ᴛʜᴇɪʀ @ᴜꜱᴇʀɴᴀᴍᴇ.`,
      { reply_markup: backToAdminKeyboard() }
    );
    return;
  }
  const target = await resolveTargetFromMessage({ text: arg });
  if (!target) {
    await bot.sendMessage(msg.chat.id, "Couldn't resolve that user.");
    return;
  }
  setPlan(target.id, grant ? "premium" : "free");
  if (grant) {
    const alreadyActive = isPremiumActive(target.id);
    const base = alreadyActive ? getPremiumExpiry(target.id) : Date.now();
    setPremiumExpiry(target.id, base + 30 * 24 * 60 * 60 * 1000);
  } else {
    setPremiumExpiry(target.id, 0);
  }
  await bot.sendMessage(
    msg.chat.id,
    grant ? `✅ Granted 30 days of premium to ${target.label} (${target.id}).` : `✅ Removed premium from ${target.label} (${target.id}).`,
    { reply_markup: backToAdminKeyboard() }
  );
}

bot.onText(/^\/addprem(?:@\w+)?(?:\s|$)/, (msg) => handlePremCommand(msg, true));
bot.onText(/^\/removeprem(?:@\w+)?(?:\s|$)/, (msg) => handlePremCommand(msg, false));

/* ============================================================
 * /setpersona — premium (or bot-admin) group admins can replace
 * Miss Aria's default personality with their own system prompt
 * for that specific group. /setpersona reset clears it.
 * ============================================================ */
bot.onText(/^\/setpersona(?:@\w+)?(?:\s+([\s\S]+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!(await requireGroupAdmin(msg))) return;

  if (!isBotAdmin(userId) && !isPremiumActive(userId)) {
    return bot.sendMessage(
      chatId,
      "🔒 Custom AI personas are a Premium feature. Get Premium in DM with /premium, then run this again.",
    );
  }

  const arg = (match[1] || "").trim();
  const settings = getChatSettings(chatId);

  if (!arg) {
    return bot.sendMessage(
      chatId,
      "Usage: /setpersona <description of how the AI should talk in this group>\nOr /setpersona reset to go back to default Miss Aria.",
    );
  }

  if (arg.toLowerCase() === "reset") {
    delete settings.customPersona;
    saveStore();
    return bot.sendMessage(chatId, "✅ Persona reset to default Miss Aria for this group.");
  }

  settings.customPersona = arg.slice(0, 2000);
  saveStore();
  await bot.sendMessage(chatId, "✅ Custom AI persona set for this group.");
});

/* ============================================================
 * /exportlogs — premium (or bot-admin) group admins can export this
 * group's moderation history (ban/mute/warn) as a downloadable file.
 * ============================================================ */
bot.onText(/^\/exportlogs(?:@\w+)?$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!(await requireGroupAdmin(msg))) return;

  if (!isBotAdmin(userId) && !isPremiumActive(userId)) {
    return bot.sendMessage(
      chatId,
      "🔒 Exporting moderation logs is a Premium feature. Get Premium in DM with /premium, then run this again."
    );
  }

  const logs = (state.modLogs && state.modLogs[String(chatId)]) || [];
  if (logs.length === 0) {
    return bot.sendMessage(chatId, "No moderation actions logged for this group yet.");
  }

  const lines = logs.map(
    (l) => `${l.ts}\t${l.action}\tmoderator=${l.moderator}\ttarget=${l.target}\treason=${l.reason || "-"}`
  );
  const header = "timestamp\taction\tmoderator\ttarget\treason";
  const content = [header, ...lines].join("\n");

  const filePath = path.join("/tmp", `modlog-${chatId}-${Date.now()}.txt`);
  fs.writeFileSync(filePath, content, "utf8");

  await bot.sendDocument(chatId, filePath, {
    caption: `📄 ${logs.length} moderation action(s) logged for this group.`,
  });

  fs.unlink(filePath, () => {});
});

async function handleAdminCommand(msg, grant) {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  if (!Premium(userId)) {
    await bot.sendMessage(msg.chat.id, "🚫 Only the Premium user can bot as admins.");
    return;
  }
  const arg = msg.text.split(/\s+/).slice(1).join(" ").trim();
  if (!arg) {
    setPending(userId, { action: grant ? "admin_addadmin" : "admin_deladmin" });
    await bot.sendMessage(
      msg.chat.id,
      `ꜱᴇɴᴅ ᴛʜᴇ ᴜꜱᴇʀ'ꜱ ɴᴜᴍᴇʀɪᴄ ᴛᴇʟᴇɢʀᴀᴍ ɪᴅ, ꜰᴏʀᴡᴀʀᴅ ᴀ ᴍᴇꜱꜱᴀɢᴇ ꜰʀᴏᴍ ᴛʜᴇᴍ, ᴏʀ ꜱᴇɴᴅ ᴛʜᴇɪʀ @ᴜꜱᴇʀɴᴀᴍᴇ.`,
      { reply_markup: backToAdminKeyboard() }
    );
    return;
  }
  const target = await resolveTargetFromMessage({ text: arg });
  if (!target) {
    await bot.sendMessage(msg.chat.id, "Couldn't resolve that user.");
    return;
  }
  if (grant) {
    const added = addBotAdmin(target.id);
    await bot.sendMessage(
      msg.chat.id,
      added ? `✅ ${target.label} (${target.id}) is now a bot admin.` : `${target.label} was already a bot admin.`,
      { reply_markup: backToAdminKeyboard() }
    );
  } else {
    const result = removeBotAdmin(target.id);
    const text =
      result === "owner" ? "🚫 Can't remove the owner." :
      result === "missing" ? "That user wasn't a bot admin." :
      `✅ Removed ${target.label} (${target.id}) from bot admins.`;
    await bot.sendMessage(msg.chat.id, text, { reply_markup: backToAdminKeyboard() });
  }
}
bot.onText(/^\/aurarealm(?:@\w+)?(?:\s|$)/, async (msg) => {

    const chatId = msg.chat.id;

    let target = msg.from;

    // If replying in a group, show the replied user's stats
    if (
        msg.chat.type !== "private" &&
        msg.reply_to_message
    ) {
        target = msg.reply_to_message.from;
    }

    const userId = String(target.id);

    if (!state.users) state.users = {};

    if (!state.users[userId]) {
        state.users[userId] = {};
    }

    const user = state.users[userId];

    const aura = user.aura || 0;
    const shards = user.shards || 0;
    const streak = user.dailyStreak || 0;
    const duelsWon = user.duelsWon || 0;
    const duelsLost = user.duelsLost || 0;
    const steals = user.successfulSteals || 0;
    const auraStolen = user.auraStolen || 0;
    const games = user.gamesPlayed || 0;
    const wins = user.gameWins || 0;
    const inventory = (user.inventory || []).length;
    const level = user.level || 1;
    const xp = user.xp || 0;
    const nextXp = level * 1000;

    await bot.sendMessage(chatId, `
🌌 <b>αυяα яєαℓм</b>

<blockquote expandable='true'>
👤 Explorer: ${target.first_name}

✨ Aura: ${aura.toLocaleString()}
💎 Shards: ${shards.toLocaleString()}

🔥 Daily Streak: ${streak} day${streak === 1 ? "" : "s"}

⚔️ Duels Won: ${duelsWon}
💀 Duels Lost: ${duelsLost}

🕵️ Successful Steals: ${steals}
💸 Aura Stolen: ${auraStolen.toLocaleString()}

🎮 Games Played: ${games}
🏅 Wins: ${wins}
📦 Inventory: ${inventory} items

⭐ Level: ${level}
📈 XP: ${xp.toLocaleString()} / ${nextXp.toLocaleString()}
</blockquote>

🌠 <i>${target.id === msg.from.id ? "Your" : target.first_name + "'s"} aura grows stronger every day.</i>
`, {
        parse_mode: "HTML"
    });

});
bot.onText(/^\/addadmin(?:@\w+)?(?:\s|$)/, (msg) => {
    handleAdminCommand(msg, true);
});
bot.onText(/^\/deladmin(?:@\w+)?(?:\s|$)/, (msg) => handleAdminCommand(msg, false));
// NOTE: the old aura/shards /daily handler that used to live here was
// replaced by the cash-economy /daily in wallet.js (wallet + bank + streak
// bonus), so it's removed to avoid double replies to the same command.

bot.onText(/^\/broadcast\b/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  if (!isBotAdmin(userId)) {
    await bot.sendMessage(msg.chat.id, "🚫 You're not authorized to broadcast.");
    return;
  }
  setPending(userId, { action: "admin_broadcast" });
  await bot.sendMessage(
    msg.chat.id,
    "📢 Send the message you want broadcast to every user who has started this bot (text, photo, video — anything).",
    { reply_markup: backToAdminKeyboard() }
  );
});

/* ============================================================
 * Callback queries — force-join verification + all menu buttons
 * ============================================================ */
bot.on("callback_query", async (query) => {

  // Answer immediately before doing any slow task
  try {
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.log("Callback expired:", err.message);
  }

  const data = query.data;
  const userId = query.from.id;
  const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

     // Open Page 2
if (data === "admin_page2") {
  return await showAdminPanel2(chatId, messageId, userId);
}

// Open Page 3
if (data === "admin_page3") {
  return await showAdminPanel3(chatId, messageId, userId);
}

 // Open Page
if (data === "admin_panel") {
    return await showAdminPanel(chatId, messageId, userId);
  }
  // VERIFY JOIN
  if (data === "verify_join") {
    const missing = await getMissingChannels(userId);

    if (missing.length > 0) {
      await bot.answerCallbackQuery(query.id, {
        text: "You still haven't joined all the required channels.",
        show_alert: true,
      });
      return;
    }

    await bot.answerCallbackQuery(query.id, {
      text: "Verified, thanks!"
    });

    markStarted(userId);

    try {
      await bot.editMessageText(
        "✅ Verified — you're good to go!",
        {
          chat_id: chatId,
          message_id: query.message.message_id
        }
      );
    } catch {}

    await sendMainMenu(chatId,userId);
    return;
  }



  // EMPTY BUTTON
  if(data === "noop"){
    await bot.answerCallbackQuery(query.id);
    return;
  }

// PREMIUM PAGE
if (data === "menu_premium") {

    await bot.answerCallbackQuery(query.id);

    await bot.editMessageCaption(
`
<blockquote expandable='true'><b>〣 ✦ 〈 υη¢єηꜱσяє∂ αι 〉 ✦ 〣</b></blockquote>

☠️ <b>ρяємιυм α¢¢єꜱꜱ яєqυιяє∂</b>

╭─〔 ᴘʀᴇᴍɪᴜᴍ ᴄᴏʀᴇ 〕
│
│ ⚡ ꜱᴛᴀᴛᴜꜱ : <b>ℓσ¢кє∂</b>
│ 💳 ᴘʀɪᴄᴇ : <b>₦100</b>
│ 🧠 ᴍᴏᴅᴇ : <b>υηƒιℓтєяє∂</b>
│
╰────────────────

🔥 <b>υηℓσ¢к тнє ƒυℓℓ мιꜱꜱ αяια єxρєяιєη¢є</b>

╭─〔 ᴘʀᴇᴍɪᴜᴍ ʙᴇɴᴇꜰɪᴛꜱ 〕
│
│ ✦ ᴜɴʟɪᴍɪᴛᴇᴅ ᴄʜᴀɴɴᴇʟꜱ
│ ✦ ᴜɴʟɪᴍɪᴛᴇᴅ ɢʀᴏᴜᴘꜱ
│ ✦ ᴜɴʟɪᴍɪᴛᴇᴅ ᴜꜱᴇʀ ᴘʀᴏᴍᴏᴛɪᴏɴ
│ ✦ ꜰᴜʟʟ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ
│ ✦ ᴘʀɪᴏʀɪᴛʏ ᴀɪ ᴀᴄᴄᴇꜱꜱ
│
╰────────────────

💀 <b>ραумєηт ρяσтє¢тє∂ ву ραуꜱтα¢к</b>

<blockquote expandable='true'>⚠️ ᴘᴜʀᴄʜᴀꜱᴇ ᴘʀᴇᴍɪᴜᴍ ᴛᴏ ᴜɴʟᴏᴄᴋ ᴛʜᴇ ꜱʏꜱᴛᴇᴍ.</blockquote>
`,
        {
            chat_id: chatId,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "💀 υηℓσ¢к ₦100",
                            callback_data: "buy_premium"
                        }
                    ],
                    [
                        {
                            text: "🔙 вα¢к",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        }
    );

    return;
}
  if (data === "menu_settings") {

    await bot.editMessageCaption(
`🛡 <b>gяσυρ ѕєттιηgѕ</b>

Configure how ${BRAND_NAME} protects your group.

━━━━━━━━━━━━━━━━━━

🛡 Moderation
• Anti Spam
• Anti Link
• Anti Flood
• Anti Raid
• Anti NSFW

👥 Member Protection
• CAPTCHA
• Welcome Message
• Goodbye Message
• Auto Delete Service Messages

⚙️ Utilities
• Rules
• Notes
• Logging
• Filters

Select a category below.`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "🛡 мσ∂єяαтιση",
                            callback_data: "settings_moderation"
                            ,style: 'primary'
                        }
                    ],

                    [
                        {
                            text: "👥 мємвєяѕ",
                            callback_data: "settings_members"
                            ,style: 'success'
                        },
                        {
                            text: "⚙️ υтιℓιтιєѕ",
                            callback_data: "settings_utilities"
                            ,style: 'primary'
                        }
                    ],

                    [
                        {
                            text: "📊 ѕтαтιѕтι¢ѕ",
                            callback_data: "settings_stats"
                            ,style: 'success'
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к",
                            callback_data: "menu_back"
                            ,style: 'danger'
                        }
                    ]

                ]
            }
        }
    );

    return; // Stop processing other callback handlers
}
    if (data === "settings_members") {

    await bot.editMessageCaption(
`👥 <b>мємвєя ρяσтє¢тιση</b>

<blockquote expandable='true'>Manage how members interact with your protected groups.</blockquote>

━━━━━━━━━━━━━━━━━━

🤖 <b>νєяιƒι¢αтιση</b>
<blockquote expandable='true'>• CAPTCHA Verification
• Join Approval</blockquote>

━━━━━━━━━━━━━━━━━━

👋 <b>gяєєтιηgѕ</b>
<blockquote expandable='true'>• Welcome Message
• Goodbye Message
• Auto Delete Welcome</blockquote>

━━━━━━━━━━━━━━━━━━

👤 <b>мємвєя мαηαgємєηт</b>
<blockquote expandable='true'>• Auto Role Assignment
• Auto Promote
• Auto Restrict
• Auto Kick</blockquote>

━━━━━━━━━━━━━━━━━━

🛡 <b>ѕє¢υяιту</b>
<blockquote expandable='true'>• Account Age Protection
• Username Required
• Profile Photo Required
• Anti Fake Accounts
• Anti Bot Join</blockquote>

━━━━━━━━━━━━━━━━━━

👇 Select a category below.`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "🤖 νєяιƒι¢αтιση",
                            callback_data: "member_verification",
                            style: 'success'
                            
                        }
                    ],

                    [
                        {
                            text: "👋 ωєℓ¢σмє",
                            callback_data: "member_welcome",
                            style: 'primary'
                        },
                        {
                            text: "👋 gσσ∂вує",
                            callback_data: "member_goodbye",
                            style: 'primary'
                        }
                    ],

                    [
                        {
                            text: "👤 мємвєя яυℓєѕ",
                            callback_data: "member_rules",
                            style: 'success'
                        }
                    ],

                    [
                        {
                            text: "🛡 ѕє¢υяιту",
                            callback_data: "member_security",
                            style: 'success'
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к",
                            callback_data: "menu_back",
                            style: 'danger'
                        }
                    ]

                ]
            }
        }
    );

    return;
}
    if (data === "settings_moderation") {

    // Get all chats protected by this user
    const chats = getUserProtectedChats(query.from.id); // Your database function

    if (!chats.length) {

        await bot.editMessageCaption(
`🛡 Group Moderation

❌ You haven't added any groups or channels yet.

Add one first to configure its protection settings.`,
            {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [

                        [
                            {
                                text: "➕ α∂∂ ¢нαηηєℓ",
                                callback_data: "menu_add_channel"
                                ,style: 'primary'
                            },
                            {
                                text: "➕ α∂∂ gяσυρ",
                                url:"https://t.me/Guardianmoderationbot?startgroup=true",
                                style: 'primary'
                            }
                        ],

                        [
                            {
                                text: "⬅️ вα¢к",
                                callback_data: "menu_back"
                                ,style: 'success'
                            }
                        ]

                    ]
                }
            }
        );

        return;
    }

    // Build buttons for each protected chat
    const keyboard = chats.map(chat => [{
        text: `${chat.type === "channel" ? "📢" : "👥"} ${chat.title}`,
        callback_data: `manage_chat_${chat.id}`
    }]);

    keyboard.push([
        {
            text: "⬅️ вα¢к",
            callback_data: "menu_back"
        }
    ]);

    await bot.editMessageCaption(
`🛡 Select a Group or Channel

Choose which chat you want to configure.`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        }
    );

    return;
}
// FEATURES PAGE
if (data === "menu_feature") {

  await bot.answerCallbackQuery(query.id);

  await bot.editMessageCaption(
`<blockquote expandable='true'>⌬═══════════════════════════════⌬
 『 ✦ 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 ✦ 』
⌬═══════════════════════════════⌬

✦ Core:

• Unlimited-scale channel & group protection
• Promote unlimited users
• Full moderation access

✦ Per-Chat Protection:

• 🖼 Photo Lock
• ✏️ Edit Lock
• 🌊 Flood Lock
• 🔗 Link Lock
• ↪️ Forward Lock
• 📜 Custom Rules
• 🤖 Miss Aria AI (plain-English config)

✦ Group-Only Protection:

• 🐌 Slow Mode
• 🌙 Night Mode
• 🛡 Anti-Raid
• 🤖 CAPTCHA on Join
• 🔗 Anti-Bio-Link
• 🎬 Sticker/GIF Lock
• ⚠️ Warn System (3 strikes = ban)
• 🚫 Blacklisted Words

⌬═══════════════════════════════⌬</blockquote>`,
  {
    chat_id: chatId,
    message_id: query.message.message_id,
    parse_mode: "HTML",
    reply_markup: backKeyboard(),
  }
  );
  return;
}
    if (data === "menu_protection") {

  await bot.answerCallbackQuery(query.id);

  await bot.editMessageCaption(
`▢═══════════════════════════════▢
 『 ✦ Protection ✦ 』
▢═══════════════════════════════▢

<blockquote expandable='true'>✦ Core:</blockquote>

• Unlimited-scale channel & group protection
• Promote unlimited users
• Full moderation access

<blockquote expandable='true'>✦ Per-Chat Protection:</blockquote>

• 🖼 Photo Lock
• ✏️ Edit Lock
• 🌊 Flood Lock
• 🔗 Link Lock
• ↪️ Forward Lock
• 📜 Custom Rules
• 🤖 Miss Aria AI (plain-English config)

<blockquote expandable='true'>✦ Group-Only Protection:</blockquote>

• 🐌 Slow Mode
• 🌙 Night Mode
• 🛡 Anti-Raid
• 🤖 CAPTCHA on Join
• 🔗 Anti-Bio-Link
• 🎬 Sticker/GIF Lock
• ⚠️ Warn System (3 strikes = ban)
• 🚫 Blacklisted Words

⌬═══════════════════════════════⌬`,
  {
    chat_id: chatId,
    message_id: query.message.message_id,
    parse_mode: "HTML",
    reply_markup: protectmainkeyboard(),
  }
  );
  return;
}
    if (data === "menu_games") {

    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    // =========================
    // Loading Animation
    // =========================

    const frames = [

        "🎮 Loading Game Center.",
        "🎮 Loading Game Center..",
        "🎮 Loading Game Center...",
        "🕹 Fetching Adventures...",
        "⚔️ Preparing Game Hub..."

    ];

    for (const frame of frames) {

        await bot.editMessageCaption(frame, {

            chat_id: chatId,
            message_id: messageId

        });

        await new Promise(resolve => setTimeout(resolve, 450));

    }

    // =========================
    // Game Menu
    // =========================

    await bot.editMessageCaption(

`🎮 <b>${BRAND_NAME} Game Center</b>

━━━━━━━━━━━━━━━━━━

Welcome to the adventure hub!

Choose one of the interactive games below and begin your journey.

⚔️ <b>ριяαтє тяєαѕυяє</b>
Search islands, fight pirates and hunt legendary treasure.

🧟 <b>zσмвιє ѕυяνιναℓ</b>
Survive endless zombie attacks and collect supplies.

🏰 <b>∂υηgєση яρg</b>
Explore dangerous dungeons, defeat monsters and level up.

🕵️ <b>∂єтє¢тινє муѕтєяу</b>
Investigate crimes, gather clues and solve mysteries.

🚀 <b>ѕρα¢є α∂νєηтυяє</b>
Travel across galaxies, upgrade your ship and battle aliens.

📖 <b>αι ѕтσяу мσ∂є</b>
Create your own story where every choice changes the ending.

━━━━━━━━━━━━━━━━━━

🏆 Complete adventures to earn XP, Coins and rewards!`,

        {

            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML",

            reply_markup: {

                inline_keyboard: [

                    [
                        {
                            text: "🏴 ριяαтє тяєαѕυяє",
                            callback_data: "game_pirate"
                             ,style: 'success'
                        }
                    ],

                    [
                        {
                            text: "🧟 zσмвιє ѕυяνιναℓ",
                            callback_data: "game_zombie"
                             ,style: 'success'
                        }
                    ],

                    [
                        {
                            text: "🏰 ∂υηgєση яρg",
                            callback_data: "game_dungeon"
                            ,style: 'primary'
                        }
                    ],

                    [
                        {
                            text: "🕵️ ∂єтє¢тινє муѕтєяу",
                            callback_data: "game_detective"
                            ,style: 'primary'
                        }
                    ],

                    [
                        {
                            text: "🚀 ѕρα¢є α∂νєηтυяє",
                            callback_data: "game_space"
                            ,style: 'success'
                        }
                    ],

                    [
                        {
                            text: "📖 αι ѕтσяу мσ∂є",
                            callback_data: "game_story"
                            ,style: 'primary'
                        }
                    ],

                    [
                        {
                            text: "🏆 ℓєα∂єявσαя∂",
                            callback_data: "menu_leaderboard"
                            ,style: 'danger'
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к",
                            callback_data: "menu_back"
                            ,style: 'danger'
                        }
                    ]

                ]

            }

        }

    );

    return;

}

if (data === "menu_help") {
  const rows = [
    [
      { text: "🎮 gαмєѕ", callback_data: "games" },
      { text: "🎵 Media & Music", callback_data: "media_system" }
    ],
    [
      { text: "🎨 AI Generation", callback_data: "help_automation" },
      { text: "👥 gяσυρ мαηαgємєηт", callback_data: "group_management" }
    ]
  ];

  // Show admin-only buttons
  if (isBotAdmin(userId)) {
    rows.push([
      {
        text: "🛡 α∂мιη ραηєℓ",
        callback_data: "menu_admin"
      },
      {
        text: "📲 ωнαтѕαρρ αgєηтѕ",
        callback_data: "menu_wa_agents"
      }
    ]);
  }

  await bot.editMessageCaption(
`🆘 <blockquote><b>нєℓρ & gυι∂є</b></blockquote>

<b>🌸 General</b>

└─ ▢ 𖢷 /start — Start the bot
└─ ▢ 𖢷 /menu — main menu (Private)
└─ ▢ 𖢷 /botinfo — Bot info card
└─ ▢ 𖢷 /stats — Bot usage stats

❓ <b>ηєє∂ нєℓρ?</b>

<b>Cнσσѕє αη συтισи вєℓσω тσ ℓєαяη мσяє.</b>

👇 <b>ѕєℓє¢т αη συтισи:</b>`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: rows
      }
    }
  );

  return;
}
if (data === "group_management") {
  await bot.editMessageCaption(
`🛡️ <blockquote><b>Group Moderation</b></blockquote>

<b>👥 Group admins only</b>

Telegram permissions are required for moderation commands.

<b>🛠️ Moderation Commands</b>

└─ ▢ 𖢷 /kick &lt;user&gt; — Kick a member
└─ ▢ 𖢷 /ban &lt;user&gt; — Ban a member
└─ ▢ 𖢷 /unban &lt;user&gt; — Unban a member
└─ ▢ 𖢷 /mute &lt;user&gt; [time] — Mute a member
└─ ▢ 𖢷 /unmute &lt;user&gt; — Unmute a member
└─ ▢ 𖢷 /warn &lt;user&gt; — Warn a member
└─ ▢ 𖢷 /unwarn &lt;user&gt; — Remove a warning
└─ ▢ 𖢷 /warns &lt;user&gt; — Check warnings
└─ ▢ 𖢷 /promote &lt;user&gt; — Promote to admin
└─ ▢ 𖢷 /demote &lt;user&gt; — Demote from admin
└─ ▢ 𖢷 /tempadmin &lt;user&gt; &lt;time&gt; — Temporary admin
└─ ▢ 𖢷 /adminlist — List group admins

⚠️ <b>Note:</b> These commands only work where the bot has the required Telegram admin permissions.`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Back to Help",
              callback_data: "menu_help"
            }
          ]
        ]
      }
    }
  );

  await bot.answerCallbackQuery(query.id);
  return;
}
if (data === "menu_admin") {
  await bot.editMessageCaption(
`👑 <blockquote><b>Owner / Bot Admin</b></blockquote>

<b>⚙️ Administration Commands</b>

└─ ▢ 𖢷 /admin — Bot admin panel
└─ ▢ 𖢷 /addadmin &lt;user&gt; — Add a bot admin
└─ ▢ 𖢷 /deladmin &lt;user&gt; — Remove a bot admin
└─ ▢ 𖢷 /addprem &lt;user&gt; — Grant premium
└─ ▢ 𖢷 /removeprem &lt;user&gt; — Revoke premium
└─ ▢ 𖢷 /broadcast &lt;msg&gt; — Broadcast to all users
└─ ▢ 𖢷 /exportlogs — Export moderation history
└─ ▢ 𖢷 /setpersona &lt;text|reset&gt; — Set/reset group AI persona
└─ ▢ 𖢷 /maintenance [on|off] — Toggle maintenance mode
└─ ▢ 𖢷 /aurarealm — Aura realm admin tools

🔐 <b>Access:</b> Owner / authorized bot admins only.`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Back to Help",
              callback_data: "menu_help"
            }
          ]
        ]
      }
    }
  );

  await bot.answerCallbackQuery(query.id);
  return;
}
if (data === "help_automation") {
  await bot.editMessageCaption(
`🎨 <blockquote><b>AI Generation</b></blockquote>

<b>✨ Image Generation Commands</b>

└─ ▢ 𖢷 /generate &lt;prompt&gt; — Generate an AI image
└─ ▢ 𖢷 /generate1 &lt;prompt&gt; — Alternate image generator
└─ ▢ 𖢷 /anime &lt;prompt&gt; — Anime-style AI image
└─ ▢ 𖢷 /anime3 &lt;prompt&gt; — Alternate anime generator
└─ ▢ 𖢷 /animeimage &lt;prompt&gt; — Anime image variant
└─ ▢ 𖢷 /image abstract|anime &lt;prompt&gt; — Styled AI image

💡 <b>Tip:</b> Be specific with your prompt for better results.`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Back to Help",
              callback_data: "menu_help"
            }
          ]
        ]
      }
    }
  );

  await bot.answerCallbackQuery(query.id);
  return;
}
if (data === "media_system") {
  await bot.editMessageCaption(
`🎵 <blockquote><b>Media & Music</b></blockquote>

<b>🎧 Music & Media Commands</b>

└─ ▢ 𖢷 /music &lt;query&gt; — Search & send a song
└─ ▢ 𖢷 /song2 &lt;query&gt; — Alternate music search
└─ ▢ 𖢷 /getsong &lt;query&gt; — Download a song
└─ ▢ 𖢷 /youtube &lt;query&gt; — YouTube search/download
└─ ▢ 𖢷 /youtube1 &lt;query&gt; — Alternate YouTube search
└─ ▢ 𖢷 /pinterest &lt;query&gt; — Pinterest media search
└─ ▢ 𖢷 /download — Export your saved data
└─ ▢ 𖢷 /media — Social media downloader

💡 <b>Tip:</b> Use a clear search query to get better results.`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Back to Help",
              callback_data: "menu_help"
            }
          ]
        ]
      }
    }
  );

  await bot.answerCallbackQuery(query.id);
  return;
}
if (data === "games") {
  await bot.editMessageCaption(
`🎮 <blockquote><b>Games</b></blockquote>

<b>🕹️ Game Commands</b>

└─ ▢ 𖢷 /games — List all playable games
└─ ▢ 𖢷 /play &lt;name&gt; — Start a game
   └─ Example: /play ninja

🎯 <b>Have fun!</b>`,
    {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔙 Back to Help",
              callback_data: "menu_help"
            }
          ]
        ]
      }
    }
  );

  await bot.answerCallbackQuery(query.id);
  return;
}
if (data === "help_commands") {

    await bot.editMessageCaption(
`📖 <b>вσт ¢σммαη∂ѕ</b>

<blockquote expandable='true'>
━━━━━━━━━━━━━━━━━━
/υρтιмє - ѕнσωѕ нσω ℓσηg мιѕѕ αяια нαѕ вєєη σηℓιηє.
/αναтαя - ѕнσωѕ α υѕєя'ѕ тєℓєgяαм ρяσƒιℓє ρι¢тυяє.
/¢нαтιηƒσ - ѕнσωѕ ιηƒσямαтισи αвσυт тнє ¢υяяєηт gяσυρ/¢нαт.
/ωнσαмι - ѕнσωѕ уσυя тєℓєgяαм α¢¢συηт ιηƒσ.
/тя - тяαηѕℓαтєѕ тєχт ιηтσ αησтнєя ℓαηgυαgє.
/ѕσηg - ѕєαя¢нєѕ ƒσя ѕσηgѕ αη∂ ιηƒσямαтισи.
/ℓуяι¢ѕ - ƒιη∂ѕ ℓуяι¢ѕ ƒσя α ѕσηg.
</blockquote>`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "🛡 мσ∂єяαтισи gυι∂є",
                            callback_data: "help_moderation",
                            style: "success"
                        },
                        {
                            text: "⏭️ ραgє",
                            callback_data: "help_page2",
                            style: "success"
                        }
                    ],

                    [
                        {
                            text: "⭐ ѕυρρσят ¢нαηηєℓ",
                            url: SUPPORT_CHANNEL,
                            style: "primary"
                        },
                        {
                            text: "👨‍💻 ∂єνєℓσρєя",
                            url: DEVELOPER_LINK,
                            style: "primary"
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к",
                            callback_data: "menu_back",
                            style: "danger"
                        }
                    ]

                ]
            }
        }
    );

    return;
}
if (data === "help_moderation") {

    await bot.editMessageCaption(
`🛡 <b>мσ∂єяαтισи gυι∂є</b>

кєєρ уσυя Tєℓєgяαм ¢σммυηιту ѕє¢υяє ωιтн тнє вυιℓт-ιη ρяσтє¢тισи тσσℓѕ σƒ <b>${BRAND_NAME}</b>.

<blockquote expandable='true'>

🚫 <b>αηтι ѕραм</b>
Aυтσмαтι¢αℓℓу яємσνєѕ ѕραм αη∂ υηωαηтє∂ мєѕѕαgєѕ.

🔗 <b>αηтι ℓιηк</b>
Bℓσ¢кѕ υηαυтнσяιzє∂ ιηνιтє ℓιηкѕ αη∂ єχтєяηαℓ URLѕ.

⚡ <b>αηтι ƒℓσσ∂</b>
Pяєνєηтѕ мєѕѕαgє ƒℓσσ∂ιηg αη∂ ¢нαт αвυѕє.

👥 <b>αηтι яαι∂</b>
Sтσρѕ мαѕѕ נσιηѕ, вσт αттα¢кѕ, αη∂ ¢σσя∂ιηαтє∂ яαι∂ѕ.

🔞 <b>αηтι ηѕƒω</b>
Dєтє¢тѕ αη∂ яємσνєѕ ιηαρρяσρяιαтє мє∂ια αη∂ тєχт.

🤖 <b>¢αρт¢нα</b>
Vєяιƒιєѕ ηєω мємвєяѕ вєƒσяє тнєу ¢αη ¢нαт.

👋 <b>ωєℓ¢σмє & gσσ∂вує</b>
Gяєєтѕ ηєω мємвєяѕ αη∂ αηησυη¢єѕ ∂єραятυяєѕ.

📜 <b>яυℓєѕ & ησтєѕ</b>
Sтσяє ιмρσятαηт яυℓєѕ αη∂ нєℓρƒυℓ ιηƒσямαтισи.

📊 <b>ℓσggιηg</b>
Tяα¢кѕ мσ∂єяαтισи α¢тισиѕ ƒσя вєттєя мαηαgємєηт.

</blockquote>

<b>💡 яє¢σммєη∂є∂ α∂мιη ρєямιѕѕισиѕ</b>

• ✅ Dєℓєтє Mєѕѕαgєѕ
• ✅ Bαη Uѕєяѕ
• ✅ Rєѕтяι¢т Mємвєяѕ
• ✅ Pιη Mєѕѕαgєѕ
• ✅ Mαηαgє Tσρι¢ѕ (Oρтισиαℓ)

<i>Gяαηт тнєѕє ρєямιѕѕισиѕ тσ єηѕυяє мαχιмυм ρяσтє¢тισи ƒσя уσυя gяσυρ.</i>`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "⭐ ѕυρρσят ¢нαηηєℓ",
                            url: SUPPORT_CHANNEL,
                            style: "success"
                        }
                    ],

                    [
                        {
                            text: "👨‍💻 ¢σηтα¢т ∂єνєℓσρєя",
                            url: DEVELOPER_LINK,
                            style: "primary"
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к",
                            callback_data: "menu_back",
                            style: "danger"
                        }
                    ]

                ]
            }
        }
    );

    return;
}
if (data === "help_page2") {

    await bot.editMessageCaption(
`🛡 <b>нєℓρ gυι∂є</b>

<blockquote expandable='true'>
━━━━━━━━━━━━━━━━━━
/мαяяу — яєρℓу тσ ρяσρσѕє тσ α υѕєя
/мє∂ια — ∂σωηℓσα∂ мє∂ια ƒяσм αηу ρℓαтƒσям ωιтн α ℓιηк
/мѕg @user [мѕg] — мιѕѕ αяια ∂мѕ α υѕєя
/αƒк [яєαѕση] — ѕєт αƒк ѕтαтυѕ
/яєρσят — яєρσят α мєѕѕαgє тσ α∂мιηѕ
/ωαηтє∂ — яєρℓу тσ gєηєяαтє α ωαηтє∂ ιмαgє
/ωαѕтє∂ — ωαѕтє α υѕєя αη∂ ѕтєαℓ αυяα
</blockquote>`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "⭐ ѕυρρσят ¢нαηηєℓ",
                            url: SUPPORT_CHANNEL,
                            style: "success"
                        }
                    ],

                    [
                        {
                            text: "👨‍💻 ¢σηтα¢т ∂єνєℓσρєя",
                            url: DEVELOPER_LINK,
                            style: "success"
                        },
                        {
                            text: "⏭️ ηєχт",
                            callback_data: "help_page3",
                            style: "primary"
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к",
                            callback_data: "menu_back",
                            style: "primary"
                        }
                    ]

                ]
            }
        }
    );

    return;
}


if (data === "help_page3") {

    await bot.editMessageCaption(
`🎮 <b>ƒυη ¢σммαη∂ѕ</b>

<blockquote expandable='true'>
━━━━━━━━━━━━━━━━━━

/gιƒ — ѕєαя¢нєѕ αη∂ ѕєη∂ѕ gιƒѕ
/мємє — ¢яєαтєѕ σя ѕєη∂ѕ мємєѕ
/¢ℓιρ — ѕєαя¢нєѕ σя ѕєη∂ѕ ѕнσят νι∂єσ ¢ℓιρѕ
/яємємвєя — ѕανєѕ ιηƒσямαтισи ƒσя мιѕѕ αяια
/мємσяιєѕ — ѕнσωѕ ѕανє∂ мємσяιєѕ
/ƒσяgєт — яємσνєѕ α ѕανє∂ мємσяу
/αυяαяєαℓм — σρєηѕ тнє αυяα яєαℓм gαмє
/ƒσяgєтαℓℓ — ∂єℓєтєѕ αℓℓ ѕανє∂ мємσяιєѕ
/яєѕєт¢нαт — яєѕєтѕ αι ¢нαт мємσяу
/ƒσ¢υѕ — ѕтαятѕ ƒσ¢υѕ мσ∂є
/яємιη∂ — ¢яєαтєѕ α яємιη∂єя
/ǫя — ¢яєαтєѕ ǫя ¢σ∂єѕ
/¢αℓ¢ — ρєяƒσямѕ ¢αℓ¢υℓαтισиѕ
/ρσℓℓ — ¢яєαтєѕ α ρσℓℓ
/¢σιηƒℓιρ — ƒℓιρѕ α ¢σιη
/яσℓℓ — яσℓℓѕ α ∂ι¢є
/8вαℓℓ — αѕкѕ тнє мαgι¢ 8-вαℓℓ
/яαη∂σм — gєηєяαтєѕ яαη∂σм яєѕυℓтѕ
/¢нσσѕє — ¢нσσѕєѕ вєтωєєη σρтισиѕ
/яєνєяѕє — яєνєяѕєѕ тєχт
/¢συηт — ¢συηтѕ ωσя∂ѕ αη∂ ¢нαяα¢тєяѕ
/ѕυggєѕт — gινєѕ ι∂єαѕ αη∂ ѕυggєѕтισиѕ
/∂αιℓу — ¢ℓαιмѕ ∂αιℓу яєωαя∂
/ιηνєηтσяу — ѕнσωѕ ¢σℓℓє¢тє∂ ιтєм
/тяєαѕυяу — ѕнσωѕ αυяα тяєαѕυяу
/ѕтαтѕ — ѕнσωѕ ρℓαуєя ѕтαтѕ
/ℓυ¢к — ¢нє¢кѕ ℓυ¢к ρєя¢єηтαgє
</blockquote>`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "⭐ ѕυρρσят ¢нαηηєℓ",
                            url: SUPPORT_CHANNEL,
                            style: "success"
                        },
                        {
                            text: "👨‍💻 ¢σηтα¢т ∂єνєℓσρєя",
                            url: DEVELOPER_LINK,
                            style: "success"
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к тσ мєηυ",
                            callback_data: "menu_back",
                            style: "primary"
                        }
                    ]

                ]
            }
        }
    );

    return;
}
if (data === "help_faq") {

    await bot.editMessageCaption(
`❓ <b>ƒяєqυєηтℓу αѕкє∂ qυєѕтισиѕ</b>

<blockquote expandable='true'>
💎 <b>gєηєяαℓ</b>

❓ <b>нσω ∂σ ι υѕє тнє вσт?</b>
└ • A∂∂ ${BRAND_NAME} тσ уσυя gяσυρ.
└ • Pяσмσтє ιт тσ A∂мιηιѕтяαтσя.
└ • Eηαвℓє тнє ƒєαтυяєѕ уσυ ωαηт.

━━━━━━━━━━━━━━━━━━

🛡️ <b>мσ∂єяαтισи</b>

❓ <b>ωну ιѕη'т ѕραм вєιηg ∂єℓєтє∂?</b>
└ • ✅ Dєℓєтє Mєѕѕαgєѕ
└ • ✅ Bαη Uѕєяѕ
└ • ✅ Rєѕтяι¢т Mємвєяѕ

❓ <b>ωну ¢αη'т ι ¢σηƒιgυяє тнє gяσυρ?</b>
└ • Oηℓу σωηєяѕ αη∂ α∂мιηѕ ¢αη
   мαηαgє вσт ѕєттιηgѕ.

━━━━━━━━━━━━━━━━━━

💎 <b>ρяємιυм</b>

❓ <b>∂σ ι ηєє∂ ρяємιυм?</b>
└ • Mσѕт ¢σяє ƒєαтυяєѕ αяє ƒяєє.
└ • Pяємιυм υηℓσ¢кѕ α∂ναη¢є∂
   ƒєαтυяєѕ αη∂ ƒυтυяє υρ∂αтєѕ.

━━━━━━━━━━━━━━━━━━

👥 <b>gяσυρѕ & ¢нαηηєℓѕ</b>

❓ <b>¢αη ι ρяσтє¢т gяσυρѕ αη∂ ¢нαηηєℓѕ?</b>
└ • ✅ Yєѕ, ${BRAND_NAME} ѕυρρσятѕ вσтн.

━━━━━━━━━━━━━━━━━━

🐛 <b>ѕυρρσят</b>

❓ <b>нσω ∂σ ι яєρσят α вυg?</b>
└ • Tαρ <b>¢σηтα¢т ∂єνєℓσρєя</b> вєℓσω.
└ • Oя נσιη тнє ѕυρρσят ¢нαηηєℓ.

━━━━━━━━━━━━━━━━━━

💬 <b>ѕтιℓℓ ηєє∂ нєℓρ?</b>

└ • Cσηтα¢т συя ѕυρρσят тєαм.
└ • Wє'яє нєяє тσ нєℓρ уσυ.
</blockquote>`,
        {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [

                    [
                        {
                            text: "⭐ ѕυρρσят ¢нαηηєℓ",
                            url: SUPPORT_CHANNEL,
                            style: "primary"
                        }
                    ],

                    [
                        {
                            text: "👨‍💻 ¢σηтα¢т ∂єνєℓσρєя",
                            url: DEVELOPER_LINK,
                            style: "success"
                        }
                    ],

                    [
                        {
                            text: "⬅️ вα¢к тσ нєℓρ",
                            callback_data: "menu_back",
                            style: "primary"
                        }
                    ]

                ]
            }
        }
    );

    return;
}

  if (data === "menu_downloaders") {

    const chatId = query.message.chat.id;

    const html = `
<blockquote expandable='true'>
<b>📥 ${BRAND_NAME} Downloader</b>
Download content from your favorite platforms.
</blockquote>

<h2>📥 Dσwηℓσα∂ Sєяνι¢єѕ</h2>

<table bordered compact>

    <tr>
        <td>🎵 Spotify</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>▶️ YouTube</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>🎬 TikTok</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>📸 Instagram</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>📘 Facebook</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>🐦 X (Twitter)</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>🎧 SoundCloud</td>
        <td>🚧 Coming Soon</td>
    </tr>

    <tr>
        <td>📂 Direct Media</td>
        <td>🚧 Coming Soon</td>
    </tr>

</table>

<blockquote expandable='true'>
<b>✨ ωнαт'ѕ ¢σмιηg?</b>

New downloaders and features are being added regularly.

❤️ Thank you for your patience!
</blockquote>

<tg-button-row align="center">
    <tg-button
        type="callback"
        style="primary"
        data="menu_downloaders">
        🔄 Check Again
    </tg-button>

    <tg-button
        type="callback"
        style="secondary"
        data="menu_back">
        ⬅️ Back
    </tg-button>
</tg-button-row>
`;

    await sendRichMessage(bot, chatId, html);

    return;
}

if (data === "menu_leaderboard") {

    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;

    // =========================
    // Loading Animation
    // =========================

    const frames = [
        "🏆 Loading Leaderboard.",
        "🏆 Loading Leaderboard..",
        "🏆 Loading Leaderboard...",
        "📊 Calculating player statistics..."
    ];

    for (const frame of frames) {

        await bot.editMessageCaption(frame, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "HTML"
        });

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // =========================
    // Get Leaderboard
    // =========================

    const players = gameManager.getLeaderboard();

    let rows = "";

    if (!players || !players.length) {

        rows = `
<tr>
    <td colspan="5">
        😕 No players have started playing yet.
    </td>
</tr>`;

    } else {

        players.slice(0, 10).forEach((player, index) => {

            const medal =
                index === 0 ? "🥇" :
                index === 1 ? "🥈" :
                index === 2 ? "🥉" :
                `${index + 1}.`;

            rows += `
<tr>
    <td>${medal}</td>
    <td><b>${player.name || "Unknown"}</b></td>
    <td>⭐ ${player.level || 0}</td>
    <td>✨ ${player.xp || 0}</td>
    <td>🪙 ${player.coins || 0}</td>
</tr>`;
        });
    }

    // =========================
    // Rich Message
    // =========================

    const html = `
<blockquote expandable='true'>
<b>🏆 gℓσвαℓ ℓєα∂єявσαя∂</b>

Tσρ ρℓαуєяѕ яαηкє∂ ву тнєιя
gαмє ѕтαтιѕтι¢ѕ.
</blockquote>

<h2>📊 Tσρ Pℓαуєяѕ</h2>

<table bordered compact>

<tr>
    <th>🏅</th>
    <th>👤 Pℓαуєя</th>
    <th>⭐ Lєνєℓ</th>
    <th>✨ XP</th>
    <th>🪙 Cσιηѕ</th>
</tr>

${rows}

</table>

<blockquote expandable='true'>
💡 <b>кєєρ ρℓαуιηg тσ ¢ℓιмв тнє ℓєα∂єявσαя∂!</b>
</blockquote>

<tg-button-row align="center">

    <tg-button
        type="callback"
        style="primary"
        data="menu_leaderboard">
        🔄 Rєƒяєѕн
    </tg-button>

    <tg-button
        type="callback"
        style="secondary"
        data="menu_back">
        ⬅️ Bα¢к
    </tg-button>

</tg-button-row>
`;

    // =========================
    // Send Rich Message
    // =========================

    await sendRichMessage(bot, chatId, html);

    return;
}

// BUY PREMIUM
if (data === "buy_premium") {

  await bot.answerCallbackQuery(query.id);

  await bot.sendInvoice(
    chatId,
    "⭐ Miss Aria Premium",
    "Unlock unlimited channels, groups, users, moderation tools, and priority AI replies for 30 days.",
    "premium_15stars",
    "",
    "XTR",
    [
      {
        label: "Premium — 30 days",
        amount: 15
      }
    ],
    {
      provider_token: ""
    }
  );

  return;
}



// ONLY MENU ACTIONS BELOW
const isMenuAction =
data &&
(
data.startsWith("menu_") ||
data.startsWith("promote_pick_") ||
data.startsWith("remove_chat_") ||
data.startsWith("cs_") ||
data.startsWith("admin_")
);


if(!isMenuAction)
return;

  if (data === "menu_back") {
    clearPending(userId);
    await editToMainMenu(query);
    return;
  }

    
  if (data === "menu_admin") {
    if (!isBotAdmin(userId)) {
      await bot.answerCallbackQuery(query.id, { text: "You're not authorized.", show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(query.id);
    await showAdminPanel(chatId, query.message.message_id, userId);
    return;
  }

if (data === "menu_wa_agents") {

    if (!isOwner(userId)) {
        await bot.answerCallbackQuery(query.id, {
            text: "Owner only.",
            show_alert: true
        });
        return;
    }

    await bot.answerCallbackQuery(query.id);

    const agents = whatsappServiceInfo.listAgents();
    const activeIds = new Set(
        whatsappServiceInfo.getActiveAgentIds()
    );

    let rows = "";

    if (!agents.length) {

        rows = `
<tr>
    <td colspan="4">
        📭 No agents paired yet.
    </td>
</tr>`;

    } else {

        agents.forEach((a, index) => {

            const isActive = activeIds.has(a.id);

            const status = isActive
                ? "🟢 Active"
                : "⚪ Idle";

            const power = a.ultraPower
                ? "⚡ Ultra"
                : "—";

            rows += `
<tr>
    <td>${index + 1}</td>
    <td><b>${a.label || "Unnamed"}</b></td>
    <td><code>${a.id}</code></td>
    <td>${status}</td>
    <td>${power}</td>
</tr>`;
        });
    }

    const html = `
<blockquote expandable='true'>
<b>📲 ωнαтѕαρρ αgєηтѕ</b>

Manage your connected WhatsApp
accounts from one place.
</blockquote>

<h2>🤖 Cσηηє¢тє∂ Aɢєηтѕ</h2>

<table bordered compact>

<tr>
    <th>#</th>
    <th>👤 Aɢєηт</th>
    <th>🆔 ID</th>
    <th>📡 Status</th>
    <th>⚡ Power</th>
</tr>

${rows}

</table>

<blockquote expandable='true'>
<b>🛠️ мαηαgємєηт</b>

Use the commands below to manage your
WhatsApp agents.

• /pair — Pair a WhatsApp account
• /agents — View all agents
• /setagent — Set active agent
• /agentoff — Disable an agent
• /unpair — Remove an agent
</blockquote>

<tg-button-row align="center">

    <tg-button
        type="callback"
        style="primary"
        data="menu_wa_agents">
        🔄 Rєƒяєѕн
    </tg-button>

    <tg-button
        type="callback"
        style="secondary"
        data="menu_back">
        ⬅️ Bα¢к
    </tg-button>

</tg-button-row>
`;

    await sendRichMessage(bot, chatId, html);

    return;
}


  if (data.startsWith("admin_")) {
    if (!isBotAdmin(userId)) {
      await bot.answerCallbackQuery(query.id, { text: "You're not authorized.", show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(query.id);

    if (data === "admin_addprem") {
      setPending(userId, { action: "admin_addprem" });
      await bot.editMessageCaption(
        "➕ *Add Premium*\n\nSend the user's numeric Telegram ID, forward a message from them, or send their @username.",
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backToAdminKeyboard() }
      );
      return;
    }

    if (data === "admin_removeprem") {
      setPending(userId, { action: "admin_removeprem" });
      await bot.editMessageCaption(
        "➖ *Remove Premium*\n\nSend the user's numeric Telegram ID, forward a message from them, or send their @username.",
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backToAdminKeyboard() }
      );
      return;
    }

    if (data === "admin_addadmin") {
      if (!canManageAdmins(userId)) {
        await bot.editMessageCaption("🚫 Only the bot owner can add new bot admins.", {
          chat_id: chatId, message_id: query.message.message_id, reply_markup: backToAdminKeyboard(),
        });
        return;
      }
      setPending(userId, { action: "admin_addadmin" });
      await bot.editMessageCaption(
        "👮 *Add Admin*\n\nSend the user's numeric Telegram ID, forward a message from them, or send their @username.",
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backToAdminKeyboard() }
      );
      return;
    }

    if (data === "admin_deladmin") {
      if (!canManageAdmins(userId)) {
        await bot.editMessageCaption("🚫 Only the bot owner can remove bot admins.", {
          chat_id: chatId, message_id: query.message.message_id, reply_markup: backToAdminKeyboard(),
        });
        return;
      }
      const admins = listAdmins();
      if (admins.length === 0) {
        await bot.editMessageCaption("No bot admins to remove.", {
          chat_id: chatId, message_id: query.message.message_id, reply_markup: backToAdminKeyboard(),
        });
        return;
      }
      const rows = admins.map((id) => [
        { text: id === OWNER_ID ? `👑 ${id} (owner)` : `👮 ${id}`, callback_data: "noop" ,style: 'success' },
        { text: "🚫 яємσνє", callback_data: `admin_deladmin_pick_${id}` },
      ]);
      rows.push([{ text: "‹ вα¢к тσ α∂мιη ραηєℓ", callback_data: "menu_admin" ,style: 'success' }]);
      await bot.editMessageCaption("🚫 *Remove Admin* — pick one:", {
        chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: { inline_keyboard: rows },
      });
      return;
    }

    if (data.startsWith("admin_deladmin_pick_")) {
      if (!canManageAdmins(userId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized.", show_alert: true });
        return;
      }
      const targetId = data.replace("admin_deladmin_pick_", "");
      const result = removeBotAdmin(targetId);
      const msgText =
        result === "owner" ? "🚫 Can't remove the owner." :
        result === "missing" ? "That user wasn't a bot admin." :
        `✅ Removed ${targetId} from bot admins.`;
      await bot.editMessageText(msgText, {
        chat_id: chatId, message_id: query.message.message_id, reply_markup: backToAdminKeyboard(),
      });
      return;
    }

    if (data === "admin_broadcast") {
      setPending(userId, { action: "admin_broadcast" });
      await bot.editMessageText(
        "📢 *Broadcast*\n\nSend the message you want broadcast to every user who has started this bot " +
          "(text, photo, video — anything). You'll get a preview and a confirm step before it sends.",
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backToAdminKeyboard() }
      );
      return;
    }

    if (data === "admin_edit_announcement") {
      setPending(userId, { action: "admin_edit_announcement" });
      await bot.editMessageCaption(
        "✏️ *Edit Announcement*\n\nSend the new announcement text — it'll appear at the top of everyone's menu. " +
          "Send `-` (a single dash) to clear it.",
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backToAdminKeyboard() }
      );
      return;
    }

    if (data === "admin_images") {
      const images = getBannedImages();
      await bot.editMessageCaption(
        `🚫 *Banned Images*\n\n${images.length} image(s) registered. Any close match posted in a group or channel I'm admin in gets deleted automatically.`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "➕ α∂∂ вαηηє∂ ιмαgє", callback_data: "admin_addbanimage",style: 'primary'  }],
              [{ text: "🗑 ¢ℓєαя αℓℓ", callback_data: "admin_clearbanimages" ,style: 'danger'  }],
              [{ text: "‹ вα¢к тσ α∂мιη ραηєℓ", callback_data: "menu_admin" ,style: 'success' }],
            ],
          },
        }
      );
      return;
    }

    if (data === "admin_addbanimage") {
      setPending(userId, { action: "admin_addbanimage" });
      await bot.editMessageCaption("➕ *Add Banned Image*\n\nSend the photo you want auto-deleted on sight.", {
        chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backToAdminKeyboard(),
      });
      return;
    }

    if (data === "admin_clearbanimages") {
      clearBannedImages();
      await bot.editMessageCaption("🗑 All banned images cleared.", {
        chat_id: chatId, message_id: query.message.message_id, reply_markup: backToAdminKeyboard(),
      });
      return;
    }

  if (data === "admin_stats") {
     const totalUsers = Object.keys(state.users).length;
      const startedUsers = Object.values(state.users).filter((u) => u.started).length;
      const premiumUsers = Object.values(state.users).filter((u) => u.plan === "premium").length;
    const totalFlags = Object.values(state.chatStats).reduce((sum, c) => sum + (c.flags || 0), 0);

  const lines = [
    "📊 *Bot Stats*",
    "",
    `Total known users: ${totalUsers}`,
    `Reachable (started bot): ${startedUsers}`,
    `Premium users: ${premiumUsers}`,
    `Bot admins: ${listAdmins().length}`,
    `Tracked chats: ${Object.keys(state.chatStats).length}`,
    `Total flagged images removed: ${totalFlags}`,
  ];

  const text = lines.join("\n");

  try {
    await bot.editMessageCaption(text, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: backToAdminKeyboard(),
    });
  } catch (err) {
    await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: backToAdminKeyboard(),
    });
  }

  return;
}

    if (data === "admin_broadcast_cancel") {
      clearPending(userId);
      await showAdminPanel(chatId, query.message.message_id, userId);
      return;
    }

    if (data === "admin_broadcast_confirm") {
      const pending = getPending(userId);
      if (!pending || pending.action !== "admin_broadcast_confirm") {
        await bot.editMessageText("That broadcast preview expired.", {
          chat_id: chatId, message_id: query.message.message_id, reply_markup: backToAdminKeyboard(),
        });
        return;
      }
      clearPending(userId);
      await bot.editMessageText("📤 Sending broadcast…", { chat_id: chatId, message_id: query.message.message_id });

      const recipients = Object.entries(state.users).filter(([, u]) => u.started);
      let sent = 0;
      let failed = 0;
      for (const [uid] of recipients) {
        try {
          await bot.copyMessage(uid, pending.fromChatId, pending.messageId);
          sent++;
        } catch {
          failed++;
        }
        await sleep(40); // stay well under Telegram's rate limits
      }

      await bot.sendMessage(
        chatId,
        `✅ Broadcast finished.\n\nSent: ${sent}\nFailed (blocked bot / left / etc.): ${failed}`,
        { reply_markup: backToAdminKeyboard() }
      );
      return;
    }

    return;
  }

  if (data === "menu_add_channel" || data === "menu_add_group") {
    const kind = data === "menu_add_channel" ? "channel" : "group";
    if (!isBotAdmin(userId) && !isPremiumActive(userId)) {
      await bot.answerCallbackQuery(query.id);
      await bot.editMessageCaption(
        `🔒 *Premium Required*\n\nAdding a ${kind} for protection is a Premium (or Bot Admin) feature.\n\n` +
          `Upgrade to protect unlimited channels and groups.`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⭐ νιєω ρяємιυм", callback_data: "menu_premium", style: 'primary' }],
              [{ text: "‹ вα¢к", callback_data: "menu_back", style: 'success' }],
            ],
          },
        }
      );
      return;
    }
    setPending(userId, { action: "add_chat", kind });
    await bot.answerCallbackQuery(query.id);
    await bot.editMessageCaption(
      `➕ *Add ${kind}*\n\nForward any message from the ${kind} here, or send its @username.\n\n` +
        `Make sure I'm already an admin there with delete/restrict/promote permissions — ` +
        `otherwise I won't be able to protect it.`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backKeyboard() }
    );
    return;
  }

  if (data === "menu_my_channels") {
    const chats = listChats(userId);
    await bot.answerCallbackQuery(query.id);
    if (chats.length === 0) {
      await bot.editMessageCaption("📋 You haven't added any channels or groups yet.", {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: backKeyboard(),
      });
      return;
    }
    const rows = [];
    for (const c of chats) {
      rows.push([{ text: `${c.title} (${c.type})`, callback_data: "noop" }]);
      rows.push([
        { text: "⚙️ ѕєттιηgѕ", callback_data: `cs_open_${c.id}`, style: 'primary' },
        { text: "🗑 яємσνє", callback_data: `remove_chat_${c.id}`, style: 'danger' },
      ]);
    }
    rows.push([{ text: "‹ вα¢к", callback_data: "menu_back" }]);
    await bot.editMessageCaption("📋 *Your added chats:*\n\nTap ⚙️ Settings to manage a chat's protection.", {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: rows },
    });
    return;
  }

  if (data.startsWith("remove_chat_")) {
    const targetId = data.replace("remove_chat_", "");
    removeChat(userId, targetId);
    await bot.answerCallbackQuery(query.id, { text: "Removed." });
    const chats = listChats(userId);
    if (chats.length === 0) {
      await bot.editMessageCaption("📋 You haven't added any channels or groups yet.", {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: backKeyboard(),
      });
      return;
    }
    const rows = [];
    for (const c of chats) {
      rows.push([{ text: `${c.title} (${c.type})`, callback_data: "noop" }]);
      rows.push([
        { text: "⚙️ ѕєттιηgѕ", callback_data: `cs_open_${c.id}`, style: 'primary' },
        { text: "🗑 яємσνє", callback_data: `remove_chat_${c.id}`, style: 'danger' },
      ]);
    }
    rows.push([{ text: "‹ вα¢к", callback_data: "menu_back" }]);
    await bot.editMessageCaption("📋 *Your added chats:*\n\nTap ⚙️ Settings to manage a chat's protection.", {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: rows },
    });
    return;
  }

  // ============================================================
  // PER-CHAT ⚙️ SETTINGS — cs_* callbacks always carry a target
  // chat id and are gated by canManageChat(userId, targetChatId),
  // so toggling one chat's protection never touches another chat.
  // ============================================================
  if (data.startsWith("cs_")) {
    if (data.startsWith("cs_open_")) {
      const targetId = data.replace("cs_open_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id);
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_photolock_")) {
      const targetId = data.replace("cs_toggle_photolock_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = togglePhotoLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Photo lock: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_editlock_")) {
      const targetId = data.replace("cs_toggle_editlock_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleEditLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Edit lock: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_floodlock_")) {
      const targetId = data.replace("cs_toggle_floodlock_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleFloodLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Flood lock: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_linklock_")) {
      const targetId = data.replace("cs_toggle_linklock_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleLinkLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Link lock: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_forwardlock_")) {
      const targetId = data.replace("cs_toggle_forwardlock_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleForwardLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Forward lock: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_rules_")) {
      const targetId = data.replace("cs_rules_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id);
      await editMessage(bot, chatId, query.message.message_id, chatRulesText(targetId), {
        parse_mode: "Markdown",
        reply_markup: chatRulesKeyboard(targetId),
      });
      return;
    }

    if (data.startsWith("cs_addrule_")) {
      const targetId = data.replace("cs_addrule_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      setPending(userId, { action: "cs_addrule", chatId: targetId });
      await bot.answerCallbackQuery(query.id);
      await editMessage(
        bot,
        chatId,
        query.message.message_id,
        `➕ *Add Rule — ${chatTitleFor(targetId)}*\n\nSend the rule as plain text, e.g. "no links to other groups" or "no NSFW jokes".`,
        { parse_mode: "Markdown", reply_markup: chatRulesKeyboard(targetId) }
      );
      return;
    }

    if (data.startsWith("cs_ruledel_")) {
      const rest = data.replace("cs_ruledel_", "");
      const lastUnderscore = rest.lastIndexOf("_");
      const targetId = rest.slice(0, lastUnderscore);
      const idx = Number(rest.slice(lastUnderscore + 1));
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const removed = removeRuleAt(targetId, idx);
      await bot.answerCallbackQuery(query.id, { text: removed ? `Removed: ${removed}` : "Already gone." });
      await editMessage(bot, chatId, query.message.message_id, chatRulesText(targetId), {
        parse_mode: "Markdown",
        reply_markup: chatRulesKeyboard(targetId),
      });
      return;
    }

    if (data.startsWith("cs_ai_end_")) {
      const targetId = data.replace("cs_ai_end_", "");
      clearPending(userId);
      aiChatSessions.delete(`${userId}:${targetId}`);
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id);
      await showChatSettingsPanel(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_ai_")) {
      const targetId = data.replace("cs_ai_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const label = chatTitleFor(targetId);
      setPending(userId, { action: "ai_chat", chatId: targetId, chatLabel: label });
      aiChatSessions.delete(`${userId}:${targetId}`); // fresh conversation each time you open it
      await bot.answerCallbackQuery(query.id);
      await editMessage(
        bot,
        chatId,
        query.message.message_id,
        `🤖 *Miss Aria AI — ${label}*\n\nTell me what you want in plain English for THIS chat — e.g. "delete any message with a crypto link" ` +
          `or "turn off photo lock". Send a photo to mark it as a delete-on-sight image (shared across all chats). Tap 🛑 to end the chat.`,
        {
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: [[{ text: "🛑 єη∂ ¢нαт", callback_data: `cs_ai_end_${targetId}`, style: 'danger' }]] },
        }
      );
      return;
    }

    // --- Page 2: Group Protection (skipped for channels) ---
    if (data.startsWith("cs_open2_")) {
      const targetId = data.replace("cs_open2_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id);
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_slowmode_")) {
      const targetId = data.replace("cs_toggle_slowmode_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleSlowMode(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Slow mode: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_night_")) {
      const targetId = data.replace("cs_toggle_night_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleNightMode(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Night mode: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_antiraid_")) {
      const targetId = data.replace("cs_toggle_antiraid_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleAntiRaid(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Anti-raid: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_captcha_")) {
      const targetId = data.replace("cs_toggle_captcha_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleCaptcha(targetId);
      await bot.answerCallbackQuery(query.id, { text: `CAPTCHA on join: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_biolink_")) {
      const targetId = data.replace("cs_toggle_biolink_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleBioLinkLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Anti-bio-link: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_sticker_")) {
      const targetId = data.replace("cs_toggle_sticker_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleStickerLock(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Sticker/GIF lock: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_toggle_warn_")) {
      const targetId = data.replace("cs_toggle_warn_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const enabled = toggleWarnSystem(targetId);
      await bot.answerCallbackQuery(query.id, { text: `Warn system: ${enabled ? "ON" : "OFF"}` });
      await showChatSettingsPanel2(chatId, query.message.message_id, targetId);
      return;
    }

    if (data.startsWith("cs_blacklist_")) {
      const targetId = data.replace("cs_blacklist_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      await bot.answerCallbackQuery(query.id);
      await editMessage(bot, chatId, query.message.message_id, chatBlacklistText(targetId), {
        parse_mode: "Markdown",
        reply_markup: chatBlacklistKeyboard(targetId),
      });
      return;
    }

    if (data.startsWith("cs_addword_")) {
      const targetId = data.replace("cs_addword_", "");
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      setPending(userId, { action: "cs_addword", chatId: targetId });
      await bot.answerCallbackQuery(query.id);
      await editMessage(
        bot,
        chatId,
        query.message.message_id,
        `➕ *Add Blacklisted Word — ${chatTitleFor(targetId)}*\n\nSend the word or phrase as plain text.`,
        { parse_mode: "Markdown", reply_markup: chatBlacklistKeyboard(targetId) }
      );
      return;
    }

    if (data.startsWith("cs_worddel_")) {
      const rest = data.replace("cs_worddel_", "");
      const lastUnderscore = rest.lastIndexOf("_");
      const targetId = rest.slice(0, lastUnderscore);
      const idx = Number(rest.slice(lastUnderscore + 1));
      if (!canManageChat(userId, targetId)) {
        await bot.answerCallbackQuery(query.id, { text: "Not authorized for that chat.", show_alert: true });
        return;
      }
      const removed = removeBlacklistWordAt(targetId, idx);
      await bot.answerCallbackQuery(query.id, { text: removed ? `Removed: ${removed}` : "Already gone." });
      await editMessage(bot, chatId, query.message.message_id, chatBlacklistText(targetId), {
        parse_mode: "Markdown",
        reply_markup: chatBlacklistKeyboard(targetId),
      });
      return;
    }

    // --- CAPTCHA verify button — tapped by the joining member, not an admin action ---
if (data.startsWith("cs_verify_")) {

    const rest = data.replace("cs_verify_", "");

    const lastUnderscore = rest.lastIndexOf("_");

    const chatId = rest.slice(0, lastUnderscore);
    const verifyUserId = rest.slice(lastUnderscore + 1);


    if (String(userId) !== String(verifyUserId)) {

        await bot.answerCallbackQuery(query.id, {
            text: "This verification isn't for you.",
            show_alert: true
        });

        return;
    }


    try {

      await bot.restrictChatMember(
    chatId,
    verifyUserId,
    {
        permissions: {
            can_send_messages: true,
            can_send_audios: true,
            can_send_documents: true,
            can_send_photos: true,
            can_send_videos: true,
            can_send_video_notes: true,
            can_send_voice_notes: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true
        },
        use_independent_chat_permissions: true
    }
);

        pendingCaptchas.delete(
            `${chatId}:${verifyUserId}`
        );


        await bot.answerCallbackQuery(query.id, {
            text: "✅ Verified, welcome!"
        });


        await bot.editMessageText(
            "✅ Verified — welcome to the chat!",
            {
                chat_id: chatId,
                message_id: query.message.message_id
            }
        );


    } catch(err){

        console.error(
            "CAPTCHA verify failed:",
            err
        );

        await bot.answerCallbackQuery(query.id,{
            text:"❌ Verification failed.",
            show_alert:true
        });

    }

    return;

}
return; 
  
  }

  if (data === "menu_moderation") {
    const chats = listChats(userId);
    const plan = getPlan(userId);
    const lines = [
      "🛡 *Moderation status*",
      "",
      `Plan: ${plan === "premium" ? "⭐ Premium" : "❌ Free"}`,
      "Status: ✅ Active",
      "",
    ];
    if (chats.length === 0) {
      lines.push("No chats added yet — use Add Channel / Add Group first.");
    } else {
      for (const c of chats) {
        lines.push(`• ${c.title}: ${getChatFlags(c.id)} flagged image(s) removed`);
      }
    }
    await bot.answerCallbackQuery(query.id);
    await bot.editMessageCaption(lines.join("\n"), {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: backKeyboard(),
    });
    return;
  }

  if (data === "menu_promote") {
    const chats = listChats(userId);
    await bot.answerCallbackQuery(query.id);
    if (chats.length === 0) {
      await bot.editMessageCaption(
        "You haven't added any channels or groups yet. Use Add Channel / Add Group first.",
        { chat_id: chatId, message_id: query.message.message_id, reply_markup: backKeyboard() }
      );
      return;
    }
    const rows = chats.map((c) => [{ text: `${c.title} (${c.type})`, callback_data: `promote_pick_${c.id}` }]);
    rows.push([{ text: "‹ вα¢к", callback_data: "menu_back" }]);
    await bot.editMessageCaption("○ *Promote User* — pick a chat:", {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: rows },
    });
    return;
  }

  if (data.startsWith("promote_pick_")) {
    const targetChatId = data.replace("promote_pick_", "");
    setPending(userId, { action: "promote_user", chatId: targetChatId });
    await bot.answerCallbackQuery(query.id);
    await bot.editMessageCaption(
      "Forward a message from the person you want to promote, or send their @username.\n\n" +
        "_Forwarding is more reliable — Telegram doesn't let bots resolve a plain @username to a user ID " +
        "unless that person has interacted with this bot before._",
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: "Markdown", reply_markup: backKeyboard() }
    );
    return;
  }
});
/* ============================================================
 * Bot's own membership changes — auto-lock the current chat photo
 * the moment we're promoted to admin somewhere, no manual step needed.
 * ============================================================ */
bot.on("my_chat_member", async (update) => {
  try {
    const me = await bot.getMe();
    if (update.new_chat_member.user.id !== me.id) return;
    const status = update.new_chat_member.status;
    if (status === "administrator" || status === "creator") {
      await captureChatPhotoBaseline(update.chat.id, update.chat.title);
    }
  } catch (err) {
    console.error("Error in my_chat_member handler", err.message);
  }
});

/* ============================================================
 * New joins — Anti-Raid (mass-join detection), CAPTCHA on Join,
 * and Anti-Bio-Link, each opt-in and per-chat via ⚙️ Settings.
 * ============================================================ */
bot.on("new_chat_members", async (msg) => {

    const chatId = msg.chat.id;

    try {

        const me = await bot.getMe();


        for (const member of msg.new_chat_members) {


            // Ignore ourselves
            if (member.id === me.id) continue;


            // Ignore bots
            if (member.is_bot) continue;



            let raided = false;



            // ====================================================
            // ANTI RAID
            // ====================================================

            if (isAntiRaidEnabled(chatId)) {

                const now = Date.now();


                const joins = (
                    joinTracker.get(chatId) || []
                )
                .filter(
                    t => now - t < JOIN_RAID_WINDOW_MS
                );


                joins.push(now);


                joinTracker.set(
                    chatId,
                    joins
                );


                if (joins.length >= JOIN_RAID_COUNT) {


                    raided = true;


                    await muteUser(
                        chatId,
                        member.id,
                        JOIN_RAID_MUTE_MS
                    )
                    .catch(()=>{});


                    log(
                        "Anti-raid muted",
                        member.id,
                        chatId
                    );



                    const ownerId =
                    await getOwnerId(chatId)
                    .catch(()=>null);



                    if(ownerId){

                        bot.sendMessage(
                            ownerId,
`🛡 Raid detected

Chat: ${msg.chat.title || chatId}

New joins muted for 10 minutes.`,
                            {
                                parse_mode:"Markdown"
                            }
                        )
                        .catch(()=>{});

                    }

                }

            }





            // ====================================================
            // ANTI BIO LINK
            // ====================================================

            if(isBioLinkLockEnabled(chatId)){


                try{


                    const profile =
                    await bot.getChat(member.id);



                    if(
                        profile.bio &&
                        extractUrls(profile.bio).length
                    ){


                        log(
                            "Anti bio link kick",
                            member.id,
                            chatId
                        );



                        await bot.banChatMember(
                            chatId,
                            member.id
                        );


                        await bot.unbanChatMember(
                            chatId,
                            member.id
                        )
                        .catch(()=>{});



                        incrementChatFlags(
                            chatId,
                            msg.chat.title
                        );



                        continue;

                    }


                }
                catch(err){

                    // Telegram privacy can block bio access
                }

            }





            // ====================================================
            // CAPTCHA
            // ====================================================

            if(
                isCaptchaEnabled(chatId) &&
                !raided
            ){


                const key =
                `${chatId}:${member.id}`;



                // Prevent duplicate captcha
                if(
                    pendingCaptchas.has(key)
                ){
                    continue;
                }



                try{


                    await bot.restrictChatMember(
                        chatId,
                        member.id,
                        {

                            permissions:{

                                can_send_messages:false,
                                can_send_media_messages:false,
                                can_send_polls:false,
                                can_send_other_messages:false,
                                can_add_web_page_previews:false

                            }

                        }
                    );



                    const name =
                    escapeHtml(
                        [
                            member.first_name,
                            member.last_name
                        ]
                        .filter(Boolean)
                        .join(" ")
                        ||
                        member.username
                        ||
                        String(member.id)
                    );



                    const sent =
                    await bot.sendMessage(
                        chatId,

`👋 Welcome <b>${name}</b>!

🔐 Tap the button below within 3 minutes to verify you're human.`,

                        {

                            parse_mode:"HTML",

                            reply_markup:{

                                inline_keyboard:[

                                    [
                                        {
                                            text:
                                            "✅ I'm not a robot",

                                            callback_data:
                                            `cs_verify_${chatId}_${member.id}`
                                        }
                                    ]

                                ]

                            }

                        }
                    );





                    const timeout =
                    setTimeout(
                    async()=>{


                        pendingCaptchas.delete(key);



                        try{


                            await bot.banChatMember(
                                chatId,
                                member.id
                            );


                            await bot.unbanChatMember(
                                chatId,
                                member.id
                            )
                            .catch(()=>{});



                            await bot.deleteMessage(
                                chatId,
                                sent.message_id
                            )
                            .catch(()=>{});



                            log(
                                "CAPTCHA timeout kicked",
                                member.id,
                                chatId
                            );


                        }
                        catch(err){

                            console.error(
                                "Captcha kick error:",
                                err.message
                            );

                        }


                    },
                    CAPTCHA_TIMEOUT_MS
                    );





                    pendingCaptchas.set(
                        key,
                        {
                            timeout,
                            messageId:
                            sent.message_id
                        }
                    );



                }
                catch(err){

                    console.error(
                        "CAPTCHA setup failed:",
                        err.message
                    );

                }

            }


        }


    }
    catch(err){

        console.error(
            "new_chat_members error:",
            err.message
        );

    }

});




// ====================================================
// ESCAPE HTML
// ====================================================

// Telegram REQUIRES an answer to pre_checkout_query within 10 seconds or
// the payment is automatically cancelled on the user's end. This was
// missing, which meant the /premium invoice above could never actually
// complete a purchase.
bot.on("pre_checkout_query", async (query) => {
  try {
    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (err) {
    console.error("pre_checkout_query error:", err.message);
  }
});

bot.on("successful_payment", async (msg) => {

  const userId = msg.from.id;
  const payment = msg.successful_payment;

  const existingPlan = getPlan(userId);
  const alreadyPremium = existingPlan === "premium" && getPremiumExpiry(userId) > Date.now();

  // Stack renewals on top of remaining time instead of always resetting
  // to a flat 30 days from "now".
  const base = alreadyPremium ? getPremiumExpiry(userId) : Date.now();
  const newExpiry = base + 30 * 24 * 60 * 60 * 1000;

  await setPlan(userId, "premium");
  setPremiumExpiry(userId, newExpiry);

  const expiryDate = new Date(newExpiry).toISOString().slice(0, 10);

  await bot.sendMessage(
    userId,
`✨ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 𝗔𝗰𝘁𝗶𝘃𝗮𝘁𝗲𝗱 ✨
━━━━━━━━━━━━━━━━━━
⭐ ${payment.total_amount} Stars received — thank you!
${alreadyPremium ? "🔁 Renewed and stacked onto your remaining time." : "🚀 Premium is now live on your account."}
📅 Active until: ${expiryDate}

𝗨𝗻𝗹𝗼𝗰𝗸𝗲𝗱:
• Unlimited channels
• Unlimited groups
• Unlimited users
• Full moderation access
• Priority AI replies
━━━━━━━━━━━━━━━━━━`
  );

});

// ============================================================
// AniList GraphQL Query
// ============================================================

const ANILIST_QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME) {

    id

    title{
      romaji
      english
      native
    }

    description(asHtml:false)

    episodes
    duration
    status
    format
    season
    seasonYear

    averageScore
    popularity
    favourites

    genres

    studios(isMain:true){
      nodes{
        name
      }
    }

    coverImage{
      extraLarge
    }

    bannerImage

    trailer{
      id
      site
    }

    siteUrl

  }
}
`;

// ============================================================
// Split Long Messages
// ============================================================

function splitText(text, maxLength = 3900) {

    const parts = [];

    while (text.length > maxLength) {

        let index = text.lastIndexOf("\n", maxLength);

        if (index < maxLength * 0.7) {

            index = text.lastIndexOf(" ", maxLength);

        }

        if (index === -1) {

            index = maxLength;

        }

        parts.push(text.substring(0, index).trim());

        text = text.substring(index).trim();

    }

    if (text.length) {

        parts.push(text);

    }

    return parts;

}

// ============================================================
// Escape HTML
// ============================================================

function escapeHTML(text = "") {

    return text

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;");

}
   
const AIART_API_URL = "https://prexzyapis.com/ai/aiart";

// ============================================================
// AI generation priority queue (image/video)
// Free users wait behind a concurrency cap; Premium/bot-admin
// requests jump ahead of any free requests already waiting.
// ============================================================
const genQueue = { running: 0, maxConcurrent: 2, waiting: [] };

function acquireGenSlot(isPriority) {
  return new Promise((resolve) => {
    const job = { resolve, priority: isPriority };
    if (isPriority) {
      const idx = genQueue.waiting.findIndex((j) => !j.priority);
      if (idx === -1) genQueue.waiting.push(job);
      else genQueue.waiting.splice(idx, 0, job);
    } else {
      genQueue.waiting.push(job);
    }
    pumpGenQueue();
  });
}

function releaseGenSlot() {
  genQueue.running = Math.max(0, genQueue.running - 1);
  pumpGenQueue();
}

function pumpGenQueue() {
  while (genQueue.running < genQueue.maxConcurrent && genQueue.waiting.length > 0) {
    const job = genQueue.waiting.shift();
    genQueue.running++;
    job.resolve();
  }
}
/*
|--------------------------------------------------------------------------
| Telegram Report Assistant
|--------------------------------------------------------------------------
|
| Features:
| - /report command
| - Collect report reason
| - Collect Telegram evidence links
| - Collect additional details
| - Search official Telegram pages for @telegram.org addresses
| - Show complete report draft
| - Require manual confirmation before sending
| - Send using your configured Gmail account
| - Cancel / search again
|
|--------------------------------------------------------------------------
*/

const https = require("https");
require("dotenv").config();


/*
|--------------------------------------------------------------------------
| BOT
|--------------------------------------------------------------------------
*/




/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const OFFICIAL_TELEGRAM_PAGES = [
  "https://telegram.org/faq",
  "https://telegram.org/safety",
  "https://core.telegram.org/bug-bounty"
];


/*
|--------------------------------------------------------------------------
| Only accept Telegram-owned addresses
|--------------------------------------------------------------------------
*/

const OFFICIAL_EMAIL_REGEX =
  /[A-Z0-9._%+-]+@telegram\.org/gi;


/*
|--------------------------------------------------------------------------
| Temporary report sessions
|--------------------------------------------------------------------------
|
| For production, you can move this into your database.
|
*/

const reportSessions = new Map();


/*
|--------------------------------------------------------------------------
| EMAIL TRANSPORTER
|--------------------------------------------------------------------------
|
| .env:
|
| REPORT_FROM_EMAIL=yourgmail@gmail.com
| REPORT_EMAIL_PASSWORD=your_app_password
|
|--------------------------------------------------------------------------
*/

const mailer = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.REPORT_FROM_EMAIL,
    pass: process.env.REPORT_EMAIL_PASSWORD
  }
});


/*
|--------------------------------------------------------------------------
| HTML ESCAPE
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/*
|--------------------------------------------------------------------------
| FETCH OFFICIAL TELEGRAM PAGE
|--------------------------------------------------------------------------
*/

function fetchPage(url) {
  return new Promise((resolve, reject) => {

    https.get(
      url,

      {
        headers: {
          "User-Agent":
            "Miss-Aria-Report-Assistant/1.0"
        }
      },

      response => {

        let data = "";

        response.setEncoding("utf8");


        response.on("data", chunk => {
          data += chunk;
        });


        response.on("end", () => {

          if (
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {

            resolve(data);

          } else {

            reject(
              new Error(
                `HTTP ${response.statusCode} from ${url}`
              )
            );

          }

        });

      }

    ).on("error", reject);

  });
}


/*
|--------------------------------------------------------------------------
| SEARCH OFFICIAL TELEGRAM PAGES
|--------------------------------------------------------------------------
*/

async function discoverTelegramEmails() {

  const found = new Set();


  for (const url of OFFICIAL_TELEGRAM_PAGES) {

    try {

      console.log(
        `🔎 Searching official Telegram page: ${url}`
      );


      const html = await fetchPage(url);


      const matches =
        html.match(OFFICIAL_EMAIL_REGEX) || [];


      for (const email of matches) {

        const normalized =
          email.toLowerCase().trim();


        /*
        |--------------------------------------------------------------
        | Extra safety:
        | Only accept @telegram.org
        |--------------------------------------------------------------
        */

        if (
          normalized.endsWith("@telegram.org")
        ) {

          found.add(normalized);

        }

      }

    } catch (error) {

      console.error(
        `Failed to search ${url}:`,
        error.message
      );

    }

  }


  return [...found];
}


/*
|--------------------------------------------------------------------------
| EXTRACT TELEGRAM LINKS
|--------------------------------------------------------------------------
*/

function extractTelegramLinks(text) {

  return text.match(
    /https?:\/\/(?:t\.me|telegram\.me)\/[^\s]+/gi
  ) || [];

}


/*
|--------------------------------------------------------------------------
| BUILD REPORT
|--------------------------------------------------------------------------
*/

function buildReport({
  reason,
  links,
  details
}) {

  return `Hello Telegram Support,

I would like to report content on Telegram that I believe requires review.

Reason:
${reason}

Telegram content:
${links
  .map(link => `• ${link}`)
  .join("\n")}

Additional details:
${details || "None provided."}

Please review the referenced content and take any appropriate action.

Thank you.
`;

}


/*
|--------------------------------------------------------------------------
| /REPORT
|--------------------------------------------------------------------------
*/

bot.onText(/^\/report$/i, async msg => {

  const chatId = msg.chat.id;


  reportSessions.set(chatId, {

    step: "reason",

    reason: "",

    links: [],

    details: "",

    recipients: []

  });


  await bot.sendMessage(

    chatId,

`📝 <b>яєρσят αѕѕιѕтαηт</b>

<b>ωнαт αяє уσυ яєρσятιηg?</b>

єχαмρℓє:

<code>Illegal content</code>
<code>Spam</code>
<code>Scam</code>
<code>Copyright violation</code>
<code>Security vulnerability</code>`,

    {
      parse_mode: "HTML"
    }

  );

});


/*
|--------------------------------------------------------------------------
| REPORT CONVERSATION
|--------------------------------------------------------------------------
*/

bot.on("message", async msg => {

  if (!msg.text) return;


  const chatId = msg.chat.id;

  const text = msg.text.trim();


  /*
  |--------------------------------------------------------------------------
  | Ignore commands
  |--------------------------------------------------------------------------
  */

  if (text.startsWith("/")) return;


  const session =
    reportSessions.get(chatId);


  if (!session) return;


  /*
  |--------------------------------------------------------------------------
  | STEP 1 — REASON
  |--------------------------------------------------------------------------
  */

  if (session.step === "reason") {

    session.reason = text;

    session.step = "links";


    await bot.sendMessage(

      chatId,

`🔗 <b>ѕєη∂ тнє тєℓєgяαм ¢σηтєηт ℓιηк(ѕ)</b>

єχαмρℓє:

<code>https://t.me/example/123</code>

уσυ ¢αη ѕєη∂ мυℓтιρℓє ℓιηкѕ.`,

      {
        parse_mode: "HTML"
      }

    );


    return;
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 2 — TELEGRAM LINKS
  |--------------------------------------------------------------------------
  */

  if (session.step === "links") {

    const links =
      extractTelegramLinks(text);


    if (!links.length) {

      await bot.sendMessage(

        chatId,

`⚠️ <b>ησ тєℓєgяαм ℓιηк ƒσυη∂</b>

ρℓєαѕє ѕєη∂ α ℓιηк ℓιкє:

<code>https://t.me/example/123</code>`,

        {
          parse_mode: "HTML"
        }

      );


      return;
    }


    session.links = links;

    session.step = "details";


    await bot.sendMessage(

      chatId,

`📋 <b>α∂∂ιтισηαℓ ∂єтαιℓѕ</b>

∂єѕ¢яιвє ωнαт нαρρєηє∂.

σя туρє:

<code>skip</code>`,

      {
        parse_mode: "HTML"
      }

    );


    return;
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 3 — DETAILS
  |--------------------------------------------------------------------------
  */

  if (session.step === "details") {

    session.details =
      text.toLowerCase() === "skip"
        ? ""
        : text;


    await bot.sendMessage(

      chatId,

`🔎 <b>ѕєαя¢нιηg σƒƒι¢ιαℓ тєℓєgяαм ραgєѕ...</b>

ι'ℓℓ σƒƒι¢ιαℓℓу ¢нє¢к тєℓєgяαм-σωηє∂ ραgєѕ ƒσя
ρυвℓιѕнє∂ <code>@telegram.org</code> α∂∂яєѕѕєѕ.`,

      {
        parse_mode: "HTML"
      }

    );


    try {

      session.recipients =
        await discoverTelegramEmails();


      /*
      |--------------------------------------------------------------------------
      | No addresses found
      |--------------------------------------------------------------------------
      */

      if (!session.recipients.length) {

        await bot.sendMessage(

          chatId,

`❌ <b>ησ σƒƒι¢ιαℓ тєℓєgяαм α∂∂яєѕѕєѕ ƒσυη∂</b>

тнє σƒƒι¢ιαℓ ραgєѕ ∂ι∂η'т яєтυяη αηу <code>@telegram.org</code> α∂∂яєѕѕ.`,

          {
            parse_mode: "HTML"
          }

        );


        reportSessions.delete(chatId);

        return;
      }


      session.step = "confirm";


      const reportText =
        buildReport(session);


      /*
      |--------------------------------------------------------------------------
      | REPORT PREVIEW
      |--------------------------------------------------------------------------
      */

      await bot.sendMessage(

        chatId,

`📝 <b>яєρσят ∂яαƒт</b>

<b>яєαѕση:</b>
${escapeHtml(session.reason)}

<b>єνι∂єη¢є:</b>
${session.links
  .map(link => `• ${escapeHtml(link)}`)
  .join("\n")}

<b>∂єтαιℓѕ:</b>
${escapeHtml(session.details || "None")}

━━━━━━━━━━━━━━

📧 <b>σƒƒι¢ιαℓ тєℓєgяαм α∂∂яєѕѕєѕ ƒσυη∂:</b>

${session.recipients
  .map(email => `• ${escapeHtml(email)}`)
  .join("\n")}

━━━━━━━━━━━━━━

<b>ємαιℓ ∂яαƒт:</b>

${escapeHtml(reportText)}

⚠️ <b>яєνιєω тнє ∂яαƒт вєƒσяє ѕєη∂ιηg.</b>`,

        {

          parse_mode: "HTML",

          reply_markup: {

            inline_keyboard: [

              [

                {
                  text: "✅ ѕєη∂ яєρσят",
                  callback_data:
                    "report_confirm_send"
                }

              ],

              [

                {
                  text: "🔄 ѕєαя¢н αgαιη",
                  callback_data:
                    "report_search_again"
                },

                {
                  text: "❌ ¢αη¢єℓ",
                  callback_data:
                    "report_cancel"
                }

              ]

            ]

          }

        }

      );


    } catch (error) {

      console.error(
        "Report search error:",
        error
      );


      await bot.sendMessage(

        chatId,

`❌ <b>ƒαιℓє∂ тσ ѕєαя¢н σƒƒι¢ιαℓ тєℓєgяαм ραgєѕ.</b>

ρℓєαѕє тяу αgαιη ℓαтєя.`,

        {
          parse_mode: "HTML"
        }

      );


      reportSessions.delete(chatId);

    }


    return;
  }

});


/*
|--------------------------------------------------------------------------
| CALLBACK HANDLER
|--------------------------------------------------------------------------
*/

bot.on("callback_query", async query => {

  const data = query.data;

  const chatId =
    query.message.chat.id;


  const session =
    reportSessions.get(chatId);


  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  if (data === "report_cancel") {

    reportSessions.delete(chatId);


    await bot.answerCallbackQuery(
      query.id,
      {
        text: "яєρσят ¢αη¢єℓℓє∂."
      }
    );


    await bot.editMessageText(

`❌ <b>яєρσят ¢αη¢єℓℓє∂</b>

тнє ∂яαƒт ωαѕ ∂ιѕ¢αя∂є∂.`,

      {

        chat_id: chatId,

        message_id:
          query.message.message_id,

        parse_mode: "HTML"

      }

    );


    return;
  }


  /*
  |--------------------------------------------------------------------------
  | SEARCH AGAIN
  |--------------------------------------------------------------------------
  */

  if (data === "report_search_again") {

    if (!session) {

      await bot.answerCallbackQuery(

        query.id,

        {
          text:
            "яєρσят ѕєѕѕιση єχριяє∂."
        }

      );

      return;
    }


    await bot.answerCallbackQuery(

      query.id,

      {
        text:
          "ѕєαя¢нιηg σƒƒι¢ιαℓ ραgєѕ..."
      }

    );


    try {

      session.recipients =
        await discoverTelegramEmails();


      if (!session.recipients.length) {

        await bot.editMessageText(

`❌ <b>ησ σƒƒι¢ιαℓ α∂∂яєѕѕєѕ ƒσυη∂</b>`,

          {

            chat_id: chatId,

            message_id:
              query.message.message_id,

            parse_mode: "HTML",

            reply_markup: {

              inline_keyboard: [

                [

                  {
                    text: "🔄 ѕєαя¢н αgαιη",
                    callback_data:
                      "report_search_again"
                  },

                  {
                    text: "❌ ¢αη¢єℓ",
                    callback_data:
                      "report_cancel"
                  }

                ]

              ]

            }

          }

        );

        return;
      }


      await bot.editMessageText(

`🔎 <b>σƒƒι¢ιαℓ α∂∂яєѕѕєѕ ƒσυη∂</b>

${session.recipients
  .map(email => `• ${escapeHtml(email)}`)
  .join("\n")}

━━━━━━━━━━━━━━

⚠️ <b>яєνιєω тнє яєρσят ∂яαƒт вєƒσяє ѕєη∂ιηg.</b>`,

        {

          chat_id: chatId,

          message_id:
            query.message.message_id,

          parse_mode: "HTML",

          reply_markup: {

            inline_keyboard: [

              [

                {
                  text: "✅ ѕєη∂ яєρσят",
                  callback_data:
                    "report_confirm_send"
                }

              ],

              [

                {
                  text: "❌ ¢αη¢єℓ",
                  callback_data:
                    "report_cancel"
                }

              ]

            ]

          }

        }

      );


    } catch (error) {

      console.error(
        "Search again error:",
        error
      );


      await bot.answerCallbackQuery(

        query.id,

        {
          text: "ѕєαя¢н ƒαιℓє∂."
        }

      );

    }


    return;
  }


  /*
  |--------------------------------------------------------------------------
  | CONFIRM + SEND
  |--------------------------------------------------------------------------
  */

  if (data === "report_confirm_send") {

    if (
      !session ||
      session.step !== "confirm"
    ) {

      await bot.answerCallbackQuery(

        query.id,

        {
          text:
            "❌ яєρσят ѕєѕѕιση єχριяє∂."
        }

      );

      return;
    }


    if (
      !session.recipients ||
      !session.recipients.length
    ) {

      await bot.answerCallbackQuery(

        query.id,

        {
          text:
            "❌ ησ яє¢ιριєηтѕ ƒσυη∂."
        }

      );

      return;
    }


    await bot.answerCallbackQuery(

      query.id,

      {
        text:
          "ѕєη∂ιηg яєρσят..."
      }

    );


    try {

      /*
      |--------------------------------------------------------------------------
      | Build email
      |--------------------------------------------------------------------------
      */

      const emailText =
        buildReport(session);


      /*
      |--------------------------------------------------------------------------
      | SEND EMAIL
      |--------------------------------------------------------------------------
      */

      const info =
        await mailer.sendMail({

          from:
            process.env.REPORT_FROM_EMAIL,

          to:
            session.recipients.join(","),

          subject:
            `Telegram Report — ${session.reason}`,

          text:
            emailText

        });


      console.log(
        "Report sent:",
        info.messageId
      );


      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      await bot.editMessageText(

`✅ <b>яєρσят ѕєηт ѕυ¢¢єѕѕƒυℓℓу</b>

📧 <b>яє¢ιριєηтѕ:</b>

${session.recipients
  .map(email => `• ${escapeHtml(email)}`)
  .join("\n")}

📎 <b>єνι∂єη¢є:</b>
${session.links.length} Telegram link(s)

🆔 <b>ємαιℓ ι∂:</b>
<code>${escapeHtml(info.messageId)}</code>`,

        {

          chat_id: chatId,

          message_id:
            query.message.message_id,

          parse_mode: "HTML"

        }

      );


      reportSessions.delete(chatId);


    } catch (error) {

      console.error(
        "Email sending error:",
        error
      );


      await bot.sendMessage(

        chatId,

`❌ <b>ƒαιℓє∂ тσ ѕєη∂ яєρσят</b>

¢нє¢к уσυя gмαιℓ ¢σηƒιgυяαтιση.

<b>єяяσя:</b>
<code>${escapeHtml(error.message)}</code>`,

        {
          parse_mode: "HTML"
        }

      );

    }


    return;
  }

});


/*
|--------------------------------------------------------------------------
| STARTUP
|--------------------------------------------------------------------------
*/

function genQueuePosition(isPriority) {
  // How many jobs are currently ahead of a new job of this priority.
  if (isPriority) return genQueue.waiting.filter((j) => j.priority).length;
  return genQueue.waiting.length;
}



bot.onText(/^\/generate(?:\s+([\s\S]+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const userPrompt = match[1]?.trim();


    const replyOptions = {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML"
    };


    if (!userPrompt) {

        return bot.sendMessage(
            chatId,
`🎨 <b>αι ιмαgє gєηєяαтσя</b>

<blockquote expandable='true'>
✨ ᴜsᴀɢᴇ:

<code>/generate futuristic cyberpunk city</code>
</blockquote>`,
            replyOptions
        );

    }



    let loadingMsg;
    let interval;
    let gotSlot = false;

    const priority = isBotAdmin(msg.from.id) || isPremiumActive(msg.from.id);
    const aheadCount = genQueuePosition(priority);
    let queueMsg;
    if (aheadCount > 0 || genQueue.running >= genQueue.maxConcurrent) {
        queueMsg = await bot.sendMessage(
            chatId,
            `⏳ ${priority ? "⭐ Priority queue" : "Queue"}: ${aheadCount} request(s) ahead of you…`,
            replyOptions
        );
    }
    await acquireGenSlot(priority);
    gotSlot = true;
    if (queueMsg) {
        await bot.deleteMessage(chatId, queueMsg.message_id).catch(() => {});
    }

    try {


        loadingMsg = await bot.sendMessage(
            chatId,
`🎨 <b>αι αят єηgιηє</b>

<blockquote expandable='true'>
⏳ ɪɴɪᴛɪᴀʟɪᴢɪɴɢ...
▰░░░░░░░░░ 10%

🤖 ᴘʀᴇᴘᴀʀɪɴɢ ᴍᴏᴅᴇʟ...
</blockquote>`,
            replyOptions
        );



        const animations = [

`🎨 <b>αι αят єηgιηє</b>

<blockquote expandable='true'>
⏳ ᴘʀᴏᴄᴇssɪɴɢ...
▰░░░░░░░░░ 10%

🧠 ᴜɴᴅᴇʀsᴛᴀɴᴅɪɴɢ ᴘʀᴏᴍᴘᴛ...
</blockquote>`,

`🎨 <b>αι αят єηgιηє</b>

<blockquote expandable='true'>
⚡ ᴄʀᴇᴀᴛɪɴɢ ᴍᴀsᴛᴇʀᴘɪᴇᴄᴇ...
▰▰▰░░░░░░ 30%

🌌 ʙᴜɪʟᴅɪɴɢ sᴄᴇɴᴇ...
</blockquote>`,

`🎨 <b>αι αят єηgιηє</b>

<blockquote expandable='true'>
🔥 ɢᴇɴᴇʀᴀᴛɪɴɢ ᴘɪxᴇʟs...
▰▰▰▰▰░░░░ 50%

✨ ᴀᴅᴅɪɴɢ ᴅᴇᴛᴀɪʟs...
</blockquote>`,

`🎨 <b>αι αят єηgιηє</b>

<blockquote expandable='true'>
🚀 ʀᴇɴᴅᴇʀɪɴɢ ɪᴍᴀɢᴇ...
▰▰▰▰▰▰▰░░ 70%

💎 ᴇɴʜᴀɴᴄɪɴɢ ǫᴜᴀʟɪᴛʏ...
</blockquote>`,

`🎨 <b>αι αят єηgιηє</b>

<blockquote expandable='true'>
🌟 ғɪɴᴀʟɪᴢɪɴɢ...
▰▰▰▰▰▰▰▰▰ 90%

🖼 ᴀʟᴍᴏsᴛ ʀᴇᴀᴅʏ...
</blockquote>`

        ];



        let index = 0;


        interval = setInterval(async () => {

            if(index < animations.length){

                try {

                    await bot.editMessageText(
                        animations[index],
                        {
                            chat_id: chatId,
                            message_id: loadingMsg.message_id,
                            parse_mode: "HTML"
                        }
                    );

                    index++;

                } catch {}

            }

        },2500);



        const prompt = `
${userPrompt},

high quality,
ultra detailed,
cinematic lighting,
realistic textures,
professional photography,
sharp focus,
8k resolution,
beautiful composition
`;



        let data;
        let attempts = 0;


        while(attempts < 5){

            attempts++;


            const response = await axios.get(
                AIART_API_URL,
                {
                    params:{
                        prompt,
                        model:"Flux 2 Klein",
                        ratio:"16:9"
                    },
                    timeout:120000
                }
            );


            data = response.data;


            console.log(
                `AI ART ATTEMPT ${attempts}:`,
                data
            );



            if(data.status){
                break;
            }



            if(
                data.error?.includes("still processing")
            ){

                await new Promise(
                    resolve => setTimeout(resolve,5000)
                );

                continue;

            }



            throw new Error(
                data.error || "ɢᴇɴᴇʀᴀᴛɪᴏɴ ғᴀɪʟᴇᴅ"
            );

        }



        clearInterval(interval);



        const image =
            data.image_url ||
            data.images?.[0];



        if(!image){

            throw new Error(
                "ɴᴏ ɪᴍᴀɢᴇ ʀᴇᴛᴜʀɴᴇᴅ"
            );

        }



        await bot.deleteMessage(
            chatId,
            loadingMsg.message_id
        );



        await bot.sendPhoto(
            chatId,
            image,
            {

                reply_to_message_id: msg.message_id,

                caption:
`🎨 <b>αι ιмαgє gєηєяαтє∂</b>

<blockquote expandable='true'>
📝 <b>ρяσмρт:</b>
<code>${userPrompt}</code>

🤖 <b>мσ∂єℓ:</b> ${data.model || "Flux 2 Klein"}
📐 <b>яαтισ:</b> ${data.ratio || "16:9"}
⚡ <b>тιмє:</b> ${data.time_seconds || "N/A"}s
</blockquote>`,

                parse_mode:"HTML",


                reply_markup: {

                    inline_keyboard:[

                        [
                            {
                                text:"📢 ¢нαηηєℓ 1",
                                url:"https://t.me/F2BATECH",
                                style: 'success'
                            },

                            {
                                text:"👑 σωηєя",
                                url:"https://t.me/F3BAN",
                                style: 'primary'
                            }
                        ]

                    ]

                }

            }
        );



    } catch(err){


        clearInterval(interval);



        console.log(
            "AI ART ERROR:",
            err.response?.data || err.message
        );



        if(loadingMsg){

            try {

                await bot.editMessageText(
`❌ <b>αι gєηєяαтιση ғαιℓє∂</b>

<blockquote expandable='true'>
${err.message}
</blockquote>`,
                    {
                        chat_id:chatId,
                        message_id:loadingMsg.message_id,
                        parse_mode:"HTML"
                    }
                );


            } catch {}

        }

    } finally {
        if (gotSlot) releaseGenSlot();
    }

});


bot.onText(/^\/generate1(?:\s+([\s\S]+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const prompt = match[1]?.trim();


    if (!prompt) {
        return bot.sendMessage(
            chatId,
            `🎨 <b>αι ιмαgє gєηєяαтσя</b>

Usage:
<code>/generate1 cyberpunk city at night</code>`,
            {
                parse_mode: "HTML"
            }
        );
    }


    const priority1 = isBotAdmin(msg.from.id) || isPremiumActive(msg.from.id);
    const ahead1 = genQueuePosition(priority1);
    let queueMsg1;
    if (ahead1 > 0 || genQueue.running >= genQueue.maxConcurrent) {
        queueMsg1 = await bot.sendMessage(
            chatId,
            `⏳ ${priority1 ? "⭐ Priority queue" : "Queue"}: ${ahead1} request(s) ahead of you…`
        );
    }
    await acquireGenSlot(priority1);
    if (queueMsg1) await bot.deleteMessage(chatId, queueMsg1.message_id).catch(() => {});

    try {

        await bot.sendChatAction(chatId, "upload_photo");


        const { data } = await axios.get(AIART_API_URL, {
            params: {
                prompt: prompt,
                model: "Anime",
                ratio: "1:1"
            },
            timeout: 120000
        });


        console.log("AI ART RESPONSE:", data);


        if (!data.status) {
            throw new Error(
                data.error || "AI generation failed"
            );
        }


        const image =
            data.image_url ||
            data.images?.[0];


        if (!image) {
            throw new Error("No image URL returned");
        }


        await bot.sendPhoto(
            chatId,
            image,
            {
                caption:
`🎨 <b>αι ιмαgє gєηєяαтє∂</b>

📝 <b>ρяσмρт:</b>
<code>${prompt}</code>

🤖 <b>мσ∂єℓ:</b> ${data.model || "AI Art"}
📐 <b>яαтισ:</b> ${data.ratio || "1:1"}
⏱ <b>тιмє:</b> ${data.time_seconds || "N/A"}s`,
                parse_mode: "HTML"
            }
        );


    } catch (err) {

        console.log(
            "AI ART ERROR:",
            err.response?.data || err.message
        );


        await bot.sendMessage(
            chatId,
            `❌ <b>αι ιмαgє єяяσя</b>

${err.message}`,
            {
                parse_mode: "HTML"
            }
        );
    } finally {
        releaseGenSlot();
    }

});
// ============================================================
// /anime Command
// ============================================================

bot.onText(/^\/anime(?:\s+(.+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;

    const query = match[1]?.trim();

    if (!query) {

        return bot.sendMessage(

            chatId,

`🌸 <b>мιѕѕ αяια • αηιмє</b>

<blockquote expandable='true'>

🔎 <b>υѕαgє</b>

<code>/anime naruto</code>

<code>/anime one piece</code>

<code>/anime demon slayer</code>

</blockquote>`,

            {

                parse_mode: "HTML",

                reply_to_message_id: msg.message_id

            }

        );

    }

    // ========================================================
    // Loading Animation
    // ========================================================

    const loadingFrames = [

        "🌸 <b>ѕєαя¢нιηg...</b>",

        "🌸 <b>ѕєαя¢нιηg.</b>",

        "🌸 <b>ѕєαя¢нιηg..</b>",

        "🌸 <b>ѕєαя¢нιηg...</b>",

        "✨ <b>ғєт¢нιηg αηιмє...</b>"

    ];

    const loading = await bot.sendMessage(

        chatId,

`${loadingFrames[0]}

<blockquote expandable='true'>

🌸 ᴍɪss ᴀʀɪᴀ ɪs sᴇᴀʀᴄʜɪɴɢ ᴀɴɪʟɪsᴛ...

</blockquote>`,

        {

            parse_mode: "HTML",

            reply_to_message_id: msg.message_id

        }

    );

    let frame = 0;

    const animation = setInterval(async () => {

        frame = (frame + 1) % loadingFrames.length;

        try {

            await bot.editMessageText(

`${loadingFrames[frame]}

<blockquote expandable='true'>

🌸 ᴍɪss ᴀʀɪᴀ ɪs sᴇᴀʀᴄʜɪɴɢ ᴀɴɪʟɪsᴛ...

</blockquote>`,

                {

                    chat_id: chatId,

                    message_id: loading.message_id,

                    parse_mode: "HTML"

                }

            );

        } catch {}

    }, 900);

    try {

                // ========================================================
        // Fetch Anime From AniList
        // ========================================================

        const { data } = await axios.post(

            "https://graphql.anilist.co",

            {

                query: ANILIST_QUERY,

                variables: {

                    search: query

                }

            },

            {

                timeout: 20000,

                headers: {

                    "Content-Type": "application/json",

                    "Accept": "application/json",

                    "User-Agent": "Miss-Aria"

                }

            }

        );

        clearInterval(animation);

        try {

            await bot.deleteMessage(
                chatId,
                loading.message_id
            );

        } catch {}

        if (
            !data ||
            !data.data ||
            !data.data.Media
        ) {

            return bot.sendMessage(

                chatId,

`❌ <b>ησ αηιмє ƒσυη∂.</b>

<blockquote expandable='true'>

Try another anime title.

</blockquote>`,

                {

                    parse_mode: "HTML",

                    reply_to_message_id: msg.message_id

                }

            );

        }

        const anime = data.data.Media;

        // ========================================================
        // Clean Description
        // ========================================================

        const synopsis = escapeHTML(

            (anime.description || "No synopsis available.")

                .replace(/<br>/gi, "\n")

                .replace(/<\/?i>/gi, "")

                .replace(/<\/?b>/gi, "")

                .replace(/\r/g, "")

                .trim()

        );

        // ========================================================
        // Trailer
        // ========================================================

        let trailer = null;

        if (

            anime.trailer &&

            anime.trailer.site &&

            anime.trailer.site.toLowerCase() === "youtube"

        ) {

            trailer = `https://youtu.be/${anime.trailer.id}`;

        }

        // ========================================================
        // Buttons
        // ========================================================

        const keyboard = {

            inline_keyboard: [

                [

                    {

                        text: "📖 αηιℓιѕт",

                        url: anime.siteUrl

                    },

                    ...(trailer

                        ? [

                            {

                                text: "🎬 тяαιℓєя",

                                url: trailer

                            }

                        ]

                        : [])

                ]

            ]

        };

        // ========================================================
        // Studio
        // ========================================================

        const studio =

            anime.studios?.nodes?.length

                ? anime.studios.nodes

                      .map(x => x.name)

                      .join(", ")

                : "Unknown";

        // ========================================================
        // Caption
        // ========================================================

        const caption =

`🌸 <b>${escapeHTML(anime.title.english || anime.title.romaji)}</b>

<blockquote expandable='true'>

🎌 <b>ηαтινє</b>
${escapeHTML(anime.title.native || "N/A")}

⭐ <b>ѕ¢σяє</b>
${anime.averageScore || "N/A"}%

📺 <b>ѕтαтυѕ</b>
${escapeHTML(anime.status || "Unknown")}

🎬 <b>ғσямαт</b>
${escapeHTML(anime.format || "Unknown")}

🎞 <b>єριѕσ∂єѕ</b>
${anime.episodes || "?"}

⏱ <b>∂υяαтιση</b>
${anime.duration || "?"} min

🌸 <b>ѕєαѕση</b>
${escapeHTML(anime.season || "?")} ${anime.seasonYear || ""}

🎭 <b>gєηяєѕ</b>
${anime.genres.join(", ")}

🏢 <b>ѕтυ∂ισ</b>
${escapeHTML(studio)}

❤️ <b>ғανσяιтєѕ</b>
${anime.favourites.toLocaleString()}

👥 <b>ρσρυℓαяιту</b>
${anime.popularity.toLocaleString()}

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`;
                // ========================================================
        // Send Anime Poster
        // ========================================================

        await bot.sendPhoto(

            chatId,

            anime.coverImage.extraLarge,

            {

                caption,

                parse_mode: "HTML",

                reply_markup: keyboard,

                reply_to_message_id: msg.message_id

            }

        );

        // ========================================================
        // Build Synopsis
        // ========================================================

        const fullSynopsis =

`📝 <b>${escapeHTML(anime.title.english || anime.title.romaji)} • sʏɴᴏᴘsɪs</b>

<blockquote expandable='true'>

${synopsis}

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`;

        // ========================================================
        // Split Into Pages
        // ========================================================

        const pages = splitText(fullSynopsis);

        for (let i = 0; i < pages.length; i++) {

            const pageText =

`${pages[i]}

━━━━━━━━━━━━━━━━━━━━━━

📄 <b>Page ${i + 1}/${pages.length}</b>`;

            await bot.sendMessage(

                chatId,

                pageText,

                {

                    parse_mode: "HTML",

                    reply_to_message_id: msg.message_id,

                    // Buttons only on the last page
                    reply_markup:

                        i === pages.length - 1

                            ? keyboard

                            : undefined

                }

            );

        }

    }

    // ========================================================
    // Error Handling
    // ========================================================

    catch (err) {

        clearInterval(animation);

        console.log(

            "Anime Error:",

            err.response?.data ||

            err.message

        );

        try {

            await bot.deleteMessage(

                chatId,

                loading.message_id

            );

        } catch {}

        await bot.sendMessage(

            chatId,

`❌ <b>ғαιℓє∂ тσ ƒєт¢н αηιмє.</b>

<blockquote expandable='true'>

Please try again later.

If the problem continues,
AniList may be temporarily unavailable.

</blockquote>

🌸 <b>мιѕѕ αяια</b>`,

            {

                parse_mode: "HTML",

                reply_to_message_id: msg.message_id

            }

        );

    }

});
bot.onText(/^\/anime3(?:\s+(.+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;
    const query = match[1]?.trim();

    if (!query) {

        return bot.sendMessage(
            chatId,
`🌸 <b>мιѕѕ αяια • αηιмє</b>

<blockquote expandable='true'>

🔎 <b>υѕαgє</b>

<code>/anime naruto</code>

<code>/anime one piece</code>

<code>/anime bleach</code>

</blockquote>`,
            {
                parse_mode:"HTML",
                reply_to_message_id:msg.message_id
            }
        );

    }

    const frames = [

        "🌸 <b>ѕєαя¢нιηg...</b>",
        "🌸 <b>ѕєαя¢нιηg.</b>",
        "🌸 <b>ѕєαя¢нιηg..</b>",
        "🌸 <b>ѕєαя¢нιηg...</b>"

    ];

    const wait = await bot.sendMessage(

        chatId,

`${frames[0]}

<blockquote expandable='true'>

✨ ᴍɪss ᴀʀɪᴀ ɪs ʟᴏᴏᴋɪɴɢ ꜰᴏʀ ʏᴏᴜʀ ᴀɴɪᴍᴇ...

</blockquote>`,

        {

            parse_mode:"HTML",

            reply_to_message_id:msg.message_id

        }

    );

    let frame = 0;

    const animation = setInterval(async()=>{

        frame=(frame+1)%frames.length;

        try{

            await bot.editMessageText(

`${frames[frame]}

<blockquote expandable='true'>

✨ ᴍɪss ᴀʀɪᴀ ɪs ʟᴏᴏᴋɪɴɢ ꜰᴏʀ ʏᴏᴜʀ ᴀɴɪᴍᴇ...

</blockquote>`,

            {

                chat_id:chatId,

                message_id:wait.message_id,

                parse_mode:"HTML"

            });

        }catch{}

    },900);

    try{

        const {data}=await axios.post(

            "https://graphql.anilist.co",

            {

                query:ANILIST_QUERY,

                variables:{

                    search:query

                }

            }

        );

        clearInterval(animation);

        try{

            await bot.deleteMessage(chatId,wait.message_id);

        }catch{}

        const anime=data.data.Media;

        if(!anime){

            return bot.sendMessage(

                chatId,

                "❌ <b>ησ αηιмє ƒσυη∂.</b>",

                {

                    parse_mode:"HTML",

                    reply_to_message_id:msg.message_id

                }

            );

        }

        const trailer =

anime.trailer && anime.trailer.site==="youtube"

?`https://youtu.be/${anime.trailer.id}`

:null;

        const caption=

`🌸 <b>${anime.title.english||anime.title.romaji}</b>

<blockquote expandable='true'>

🎌 <b>ηαтινє</b>
${anime.title.native||"N/A"}

⭐ <b>ѕ¢σяє</b>
${anime.averageScore||"N/A"}%

📺 <b>ѕтαтυѕ</b>
${anime.status}

🎬 <b>ғσямαт</b>
${anime.format}

🎞 <b>єριѕσ∂єѕ</b>
${anime.episodes||"Unknown"}

⏱ <b>∂υяαтιση</b>
${anime.duration||"?"} min

🌸 <b>ѕєαѕση</b>
${anime.season||"?"} ${anime.seasonYear||""}

🎭 <b>gєηяєѕ</b>
${anime.genres.join(", ")}

🏢 <b>ѕтυ∂ισ</b>
${anime.studios.nodes.map(x=>x.name).join(", ")||"Unknown"}

❤️ <b>ғανσяιтєѕ</b>
${anime.favourites.toLocaleString()}

👥 <b>ρσρυℓαяιту</b>
${anime.popularity.toLocaleString()}

📝 <b>ѕуησρѕιѕ</b>

${anime.description
.replace(/<[^>]+>/g,"")
.substring(0,900)}

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`;

        const keyboard={

            inline_keyboard:[

                [

                    {

                        text:"📖 αηιℓιѕт",

                        url:anime.siteUrl,
                        style:'primary'

                    },

                    ...(trailer?[{

                        text:"🎬 тяαιℓєя",

                        url:trailer,
                        style: 'success'

                    }]:[])

                ]

            ]

        };

        await bot.sendPhoto(

            chatId,

            anime.coverImage.extraLarge,

            {

                caption,

                parse_mode:"HTML",

                reply_markup:keyboard,

                reply_to_message_id:msg.message_id

            }

        );

    }catch(err){

        clearInterval(animation);

        console.log(err.response?.data||err.message);

        try{

            await bot.editMessageText(

`❌ <b>ғαιℓє∂ тσ ƒєт¢н αηιмє.</b>

<blockquote expandable='true'>

Please try again in a few moments.

</blockquote>`,

            {

                chat_id:chatId,

                message_id:wait.message_id,

                parse_mode:"HTML"

            });

        }catch{}

    }

});
    
bot.onText(/^\/youtube1(?:\s+(.+))?$/i, async (msg, match) => {


    const chatId = msg.chat.id;

    const youtubeUrl = match[1]?.trim();



    if (!youtubeUrl) {


        return bot.sendMessage(

            chatId,

`🎵 <b>мιѕѕ αяια мυѕι¢ ∂σωηℓσα∂єя</b>

<blockquote expandable='true'>

Download music from YouTube.

<b>υѕαgє</b>

<code>/youtube1 YouTube_URL</code>

<b>єxαмρℓє</b>

<code>/youtube1 https://youtube.com/watch?v=xxxx</code>

</blockquote>

🌸 Powered by Miss Aria`,

            {

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );

    }



    const loading = await bot.sendMessage(

        chatId,

`🎧 <b>мυѕι¢ ∂σωηℓσα∂єя</b>

<blockquote expandable='true'>

⏳ Processing your link...

</blockquote>`,

        {

        parse_mode:"HTML",

        reply_to_message_id:
        msg.message_id

        }

    );



    try {



        let audioUrl = null;



        let apiResponse;



        // ==========================
        // TRY GET METHOD
        // ==========================


        try {


            const api =

            `https://prexzyapis.com/sound/download?url=${encodeURIComponent(youtubeUrl)}`;



            apiResponse = await axios.get(api, {


                timeout:120000,


                headers:{


                    "User-Agent":
                    "Mozilla/5.0",

                    "Accept":
                    "application/json"

                },


                validateStatus:()=>true


            });



            console.log(
                "PREXZY GET:",
                apiResponse.data
            );



            const data = apiResponse.data;



            audioUrl =

            data.url ||

            data.download ||

            data.audio ||

            data.link ||

            data.result?.url;



        } catch(e){



            console.log(
                "GET FAILED:",
                e.message
            );


        }




        // ==========================
        // TRY POST METHOD
        // ==========================


        if(!audioUrl){



            const postResponse = await axios.post(

                "https://prexzyapis.com/sound/download",


                {

                    url:youtubeUrl

                },


                {


                timeout:120000,


                headers:{


                    "Content-Type":
                    "application/json",


                    "User-Agent":
                    "Mozilla/5.0"


                },


                validateStatus:()=>true


                }


            );



            console.log(
                "PREXZY POST:",
                postResponse.data
            );



            const data =
            postResponse.data;



            audioUrl =


            data.url ||

            data.download ||

            data.audio ||

            data.link ||

            data.result?.url;



        }




        if(!audioUrl){


            throw new Error(
                "Prexzy did not return audio link"
            );


        }





        await bot.deleteMessage(

            chatId,

            loading.message_id

        ).catch(()=>{});





        await bot.sendAudio(

            chatId,

            audioUrl,

            {


            caption:

`🎵 <b>мυѕι¢ яєα∂у</b>

<blockquote expandable='true'>

✅ Download complete

🔗 Source:
YouTube

🌸 Powered by Miss Aria

</blockquote>`,



            parse_mode:"HTML",


            reply_to_message_id:
            msg.message_id


            }


        );





    } catch(err){



        console.log(

            "MUSIC ERROR:",

            err.response?.data ||
            err.message

        );



        await bot.deleteMessage(

            chatId,

            loading.message_id

        ).catch(()=>{});



        await bot.sendMessage(

            chatId,

`❌ <b>мυѕι¢ ∂σωηℓσα∂ ƒαιℓє∂</b>

<blockquote expandable='true'>

${err.response?.data?.error || err.message}

</blockquote>

🌸 Miss Aria`,

            {

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );


    }



});
bot.onText(/^\/youtube(?:\s+(.+))?$/i, async (msg, match) => {


    const chatId = msg.chat.id;

    const url = match[1]?.trim();



    if(!url){

        return bot.sendMessage(
            chatId,

`🎵 <b>мιѕѕ αяια мυѕι¢ ∂σωηℓσα∂єя</b>

<blockquote expandable='true'>

Usage:

<code>/youtube YouTube_URL</code>

Example:

<code>/youtube https://youtube.com/watch?v=xxxxx</code>

</blockquote>

🌸 Powered by Miss Aria`,

{
parse_mode:"HTML",
reply_to_message_id:msg.message_id
}

        );

    }



    const loading = await bot.sendMessage(

        chatId,

`🎧 <b>∂σωηℓσα∂ιηg мυѕι¢...</b>

<blockquote expandable='true'>

⏳ Processing your link...

</blockquote>`,

{
parse_mode:"HTML",
reply_to_message_id:msg.message_id
}

    );



    try{


        const api =

        `https://prexzyapis.com/sound/download?url=${encodeURIComponent(url)}`;



        const response = await axios.get(api,{

            timeout:120000,

            headers:{
                "User-Agent":"Mozilla/5.0",
                "Accept":"application/json"
            }

        });



        console.log(
            "PREXZY:",
            response.data
        );



        let audioUrl;



        // Different possible response formats

        audioUrl =
        response.data.url ||
        response.data.download ||
        response.data.audio ||
        response.data.result?.url;



        if(!audioUrl){

            throw new Error(
                "No audio link returned"
            );

        }



        await bot.deleteMessage(
            chatId,
            loading.message_id
        );



        await bot.sendAudio(

            chatId,

            audioUrl,

            {

            caption:

`🎵 <b>мυѕι¢ яєα∂у</b>

<blockquote expandable='true'>

🔗 Source:
YouTube

⚡ Powered by Miss Aria

</blockquote>`,

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );



    }catch(err){



        console.log(
            "MUSIC ERROR:",
            err.response?.data ||
            err.message
        );



        try{

            await bot.deleteMessage(
                chatId,
                loading.message_id
            );

        }catch{}



        bot.sendMessage(

            chatId,

`❌ <b>мυѕι¢ ∂σωηℓσα∂ ƒαιℓє∂</b>

<blockquote expandable='true'>

${err.message}

</blockquote>

🌸 Miss Aria`,

            {

            parse_mode:"HTML",

            reply_to_message_id:
            msg.message_id

            }

        );


    }


});
const animeSessions = new Map();

bot.onText(/^\/animeimage(?:\s+([\s\S]+))?$/i, async (msg, match) => {

    const chatId = msg.chat.id;

    let input = match[1]?.trim();

    if (!input) {

        return bot.sendMessage(
            chatId,

`🌸 <blockquote><b>мιѕѕ αяια • αηιмє ιмαgє</b></blockquote>

<blockquote expandable='true'>

🎨 <b>gєηєяαтє вєαυтιƒυℓ αηιмє αятωσяк ωιтн αι.</b>

<b>υѕαgє</b>

<code>/animeimage &lt;prompt&gt;</code>

<b>єxαмρℓєѕ</b>

<code>/animeimage cute anime girl with blue eyes</code>

<code>/animeimage cyberpunk samurai in Tokyo</code>

<code>/animeimage fox spirit princess under cherry blossoms</code>

<code>/animeimage white dragon flying above mountains</code>

<b>ηєgαтινє ρяσмρт</b>

<code>/animeimage anime girl --negative blurry, bad quality</code>

✨ <b>тιρ:</b> Detailed prompts create better images.

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`,

            {
                parse_mode:"HTML",
                reply_to_message_id:msg.message_id
            }
        );
    }


    let prompt = input;
    let negative = "";


    if(input.includes("--negative")){

        const split = input.split("--negative");

        prompt = split[0].trim();
        negative = split.slice(1).join("--negative").trim();

    }


    const start = Date.now();


    const loading = await bot.sendMessage(
        chatId,

`🎨 <b>мιѕѕ αяια αηιмє ѕтυ∂ισ</b>

━━━━━━━━━━━━━━━━━━

🧠 <b>υη∂єяѕтαη∂ιηg уσυя ρяσмρт...</b>

<code>█░░░░░░░░░</code>

<b>10%</b>`,

{
parse_mode:"HTML",
reply_to_message_id:msg.message_id
}

);



const frames=[

["🧠 Understanding your prompt...",20],
["🎨 Creating composition...",40],
["✨ Rendering anime...",65],
["🌈 Coloring masterpiece...",85],
["🖌 Finalizing image...",100]

];


let frame=0;


const animation=setInterval(async()=>{


if(frame >= frames.length){

clearInterval(animation);
return;

}


const [text,percent]=frames[frame++];


const filled=Math.floor(percent/10);


const bar =
"█".repeat(filled)+
"░".repeat(10-filled);



try{


await bot.editMessageText(

`🎨 <b>мιѕѕ αяια αηιмє ѕтυ∂ισ</b>

━━━━━━━━━━━━━━━━━━

${text}

<code>${bar}</code>

<b>${percent}%</b>`,

{

chat_id:chatId,

message_id:loading.message_id,

parse_mode:"HTML"

});


}catch{}


},1200);





try{


let imageBuffer;

let engine="Prexzy";



// ============================
// PREXZY ENGINE
// ============================


try{


const url =
`https://prexzyapis.com/ai/anime?prompt=${encodeURIComponent(prompt)}&negative_prompt=${encodeURIComponent(negative)}`;



const response = await axios.get(url,{

responseType:"arraybuffer",

timeout:60000,

validateStatus:()=>true

});



const contentType =
response.headers["content-type"] || "";



if(contentType.startsWith("image/")){


imageBuffer =
Buffer.from(response.data);


}else{


throw new Error(
"Prexzy did not return image"
);


}



}catch(err){



console.log(
"Prexzy failed:",
err.message
);



engine="Pollinations";



// ============================
// POLLINATIONS FALLBACK
// ============================


const pollinationsUrl =

`https://image.pollinations.ai/prompt/${encodeURIComponent(

`${prompt}, anime style, masterpiece, ultra detailed`

)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;



const response =
await axios.get(
pollinationsUrl,
{
responseType:"arraybuffer",
timeout:120000
}
);



imageBuffer =
Buffer.from(response.data);



}




clearInterval(animation);



try{

await bot.deleteMessage(
chatId,
loading.message_id
);

}catch{}



const seconds =
((Date.now()-start)/1000).toFixed(1);



const sessionId =
Date.now().toString();



if(typeof animeSessions !== "undefined"){

animeSessions.set(
sessionId,
{
prompt,
negative
}
);

}



await bot.sendPhoto(

chatId,

imageBuffer,

{


caption:

`✨ <b>αηιмє ιмαgє gєηєяαтє∂</b>

<blockquote expandable='true'>

📝 <b>ρяσмρт</b>

<code>${escapeHtml(prompt)}</code>

${negative ?

`🚫 <b>ηєgαтινє</b>

<code>${escapeHtml(negative)}</code>

`
:""}

⚡ <b>єηgιηє</b>

${engine}

⏱ <b>тιмє</b>

${seconds}s

🎨 <b>ѕтуℓє</b>

Anime

</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`,



parse_mode:"HTML",


reply_to_message_id:
msg.message_id,



reply_markup:{


inline_keyboard:[


[

{

text:"🔄 яєgєηєяαтє",

callback_data:
`anime_regen_${sessionId}`,

style: 'success'
},


{

text:"🎨 New Prompt",

switch_inline_query_current_chat:
"/animeimage ",

style: 'primary'

}

]


]


}


}

);



}catch(err){



clearInterval(animation);



console.log(
"IMAGE ERROR:",
err.message
);



try{

await bot.deleteMessage(
chatId,
loading.message_id
);

}catch{}



await bot.sendMessage(

chatId,

`❌ <b>ιмαgє gєηєяαтιση ƒαιℓє∂</b>

<blockquote expandable='true'>

Both AI image engines failed.

<code>${escapeHtml(err.message)}</code>

</blockquote>

🌸 <b>мιѕѕ αяια</b>`,

{

parse_mode:"HTML",

reply_to_message_id:
msg.message_id

}

);



}



});



// Regenerate

bot.on("callback_query",async(query)=>{

    if(!query.data.startsWith("anime_regen_")) return;

    const sessionId=query.data.replace("anime_regen_","");

    const session=animeSessions.get(sessionId);

    if(!session){

        return bot.answerCallbackQuery(query.id,{
            text:"Session expired."
        });

    }

    await bot.answerCallbackQuery(query.id,{
        text:"🔄 Regenerating..."
    });

    const url=

`https://prexzyapis.com/ai/anime?prompt=${encodeURIComponent(session.prompt)}&negative_prompt=${encodeURIComponent(session.negative)}`;

    try{

        const response=await axios.get(url,{
            responseType:"arraybuffer"
        });

        await bot.sendPhoto(

            query.message.chat.id,

            Buffer.from(response.data),

            {

                caption:

`🌸 <b>яєgєηєяαтє∂ ѕυ¢¢єѕѕƒυℓℓу</b>

📝 ${session.prompt}`,

                parse_mode:"HTML",

                reply_to_message_id:query.message.message_id

            }

        );

    }catch{

        bot.sendMessage(

            query.message.chat.id,

            "❌ Failed to regenerate."

        );

    }

});
bot.onText(/^\/image\s+(abstract|anime)\s+(.+)/i, async (msg, match) => {

    const chatId = msg.chat.id;

    const style = match[1].toLowerCase();
    const input = match[2].trim();

    let prompt = input;
    let negativePrompt = "";

    if (input.includes("--negative")) {
        const parts = input.split("--negative");
        prompt = parts[0].trim();
        negativePrompt = parts[1].trim();
    }

    const loadingFrames = [
        "🎨 <b>gєηєяαтιηg ιмαgє.</b>",
        "🎨 <b>gєηєяαтιηg ιмαgє..</b>",
        "🎨 <b>gєηєяαтιηg ιмαgє...</b>",
        "✨ <b>вяιηgιηg уσυя ι∂єα тσ ℓιғє...</b>"
    ];

    const waiting = await bot.sendMessage(
        chatId,
        `${loadingFrames[0]}\n\n<blockquote expandable='true'>🌸 ᴍɪss ᴀʀɪᴀ ɪs ᴄʀᴇᴀᴛɪɴɢ ʏᴏᴜʀ ᴀʀᴛ...</blockquote>`,
        {
            parse_mode: "HTML",
            reply_to_message_id: msg.message_id
        }
    );

    let frame = 0;

    const animation = setInterval(async () => {

        frame = (frame + 1) % loadingFrames.length;

        try {

            await bot.editMessageText(
                `${loadingFrames[frame]}

<blockquote expandable='true'>🌸 ᴍɪss ᴀʀɪᴀ ɪs ᴄʀᴇᴀᴛɪɴɢ ʏᴏᴜʀ ᴀʀᴛ...</blockquote>`,
                {
                    chat_id: chatId,
                    message_id: waiting.message_id,
                    parse_mode: "HTML"
                }
            );

        } catch {}

    }, 1000);

    try {

        let endpoint;

        if (style === "abstract") {

            endpoint =
                `https://prexzyapis.com/ai/abstract?prompt=${encodeURIComponent(prompt)}&negative_prompt=${encodeURIComponent(negativePrompt)}`;

        } else {

            endpoint =
                `https://prexzyapis.com/ai/anime?prompt=${encodeURIComponent(prompt)}&negative_prompt=${encodeURIComponent(negativePrompt)}`;

        }

        const response = await axios.get(endpoint, {
            responseType: "arraybuffer"
        });

        clearInterval(animation);

        try {
            await bot.deleteMessage(chatId, waiting.message_id);
        } catch {}

        await bot.sendPhoto(
            chatId,
            Buffer.from(response.data),
            {
                caption:
`🎨 <b>ιмαgє gєηєяαтє∂</b>

<blockquote expandable='true'>
🎭 <b>ѕтуℓє:</b> <code>${style}</code>

📝 <b>ρяσмρт:</b>
<code>${prompt}</code>

${negativePrompt ? `🚫 <b>ηєgαтινє:</b>\n<code>${negativePrompt}</code>\n` : ""}
✨ <b>ѕтαтυѕ:</b> <i>sᴜᴄᴄᴇssғᴜʟʟʏ ɢᴇɴᴇʀᴀᴛᴇᴅ</i>
</blockquote>

🌸 <b>ρσωєяє∂ ву мιѕѕ αяια</b>`,
                parse_mode: "HTML",
                reply_to_message_id: msg.message_id
            }
        );

    } catch (err) {

        clearInterval(animation);

        console.error(err.response?.data || err.message);

        try {

            await bot.editMessageText(
                `❌ <b>gєηєяαтιση ƒαιℓє∂</b>

<blockquote expandable='true'>ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ᴀ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛs.</blockquote>`,
                {
                    chat_id: chatId,
                    message_id: waiting.message_id,
                    parse_mode: "HTML"
                }
            );

        } catch {}

    }

});
bot.onText(
/\/play (.+)/,
(msg,match)=>{


const gameName =
match[1].toLowerCase();


const user = {

id: msg.from.id,

username:
msg.from.username,

first_name:
msg.from.first_name

};


try{


const result =
gameManager.startGame(
user,
gameName
);



bot.sendMessage(

msg.chat.id,

result.text,

{

reply_markup:{

keyboard:

gameManager
.getGame(gameName)
.getKeyboard(),

resize_keyboard:true

}

}

);



}

catch(err){


console.log(err);


bot.sendMessage(

msg.chat.id,

"❌ Game not found."

);


}


});
bot.onText(
/\/games/,
(msg)=>{

const meta = gameManager.getAllGamesMeta
  ? gameManager.getAllGamesMeta()
  : [];

const list = meta.length
  ? meta.map(g => `${g.label} -> /play ${g.name}`).join("\n")
  : "pirate\nzombie\ndungeon\ndetective\nspace\nstory";

bot.sendMessage(

msg.chat.id,

`GUARDIAN AI ADVENTURES - ${meta.length || 6} GAMES

${list}

Start any game with: /play <name>
Example: /play ninja

While playing, type "chat ai" or "talk to ai" any time to pause the game and go back to chatting normally.`

);


});
/* ============================================================
 * Main message handler:
 *  - private chat + pending menu flow -> handle add-chat / promote-user
 *  - group message -> force-join gate, then image moderation
 * ============================================================ */

bot.on("message", async (msg) => {

  const isPrivateMsg = msg.chat.type === "private";

  const maybePending = isPrivateMsg
    ? getPending(msg.from.id)
    : null;


  if (
    !msg.text &&
    !msg.photo &&
    !msg.sticker &&
    !msg.forward_from &&
    !msg.forward_from_chat &&
    !msg.new_chat_photo &&
    !msg.delete_chat_photo
  ) {

    if (
      !(
        maybePending &&
        maybePending.action === "admin_broadcast"
      )
    ) {
      return;
    }

  }

  const chatId = msg.chat.id;
  const sender = msg.from;

  const isPrivate = msg.chat.type === "private";

  const isGroup =
    msg.chat.type === "group" ||
    msg.chat.type === "supergroup";

  const isCommand =
    msg.text &&
    msg.text.startsWith("/");
const me = await bot.getMe();

const botMentioned =
    isGroup &&
    msg.text &&
    msg.text.toLowerCase().includes(`@${me.username.toLowerCase()}`);

const repliedToBot =
    isGroup &&
    msg.reply_to_message &&
    msg.reply_to_message.from &&
    msg.reply_to_message.from.id === me.id;

if (botMentioned || repliedToBot) {

    if (!userHistory.has(sender.id)) {
        userHistory.set(sender.id, []);
    }

    const history = userHistory.get(sender.id);

    await bot.sendChatAction(chatId, "typing");

    let input = "";
    let imageUrl = null;

    // ==========================
    // TEXT
    // ==========================

    if (msg.text) {

        input = msg.text
            .replace(
                new RegExp(`@${me.username}`, "ig"),
                ""
            )
            .trim();

        if (!input) input = "Hi";

    }

    // ==========================
    // PHOTO
    // ==========================

    else if (msg.photo) {

        try {

            const biggestPhoto =
                msg.photo[msg.photo.length - 1];

            const file =
                await bot.getFile(
                    biggestPhoto.file_id
                );

            imageUrl =
                `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;

            input =
                msg.caption ||
                "Describe this image in detail.";

        } catch (err) {

            console.log(
                "GROUP PHOTO ERROR:",
                err.message
            );

            input =
                "The user sent an image, but it couldn't be downloaded.";

        }

    }

    // ==========================
    // STICKER
    // ==========================

    else if (msg.sticker) {

        input = `The user sent a Telegram sticker.

Emoji: ${msg.sticker.emoji || "🙂"}

React naturally to it like a real friend.`;

    }

    else {

        input = "Hi";

    }

    // ==========================
    // AI
    // ==========================

    if (!canUseAi(sender.id)) {
        await sendSignupGate(chatId, msg.message_id);
        return;
    }

    const result =
        await processWithFailover(

            sender.id,

            input,

            history,

            {

                msg,

                imageUrl,

                category: null,

                systemPrompt: null,

                forceFreeOnly: false,

                preferredModel: null

            }

        );

    if (!result.success) {

        await bot.sendMessage(
            chatId,
            "⚙️ Miss Aria is temporarily unavailable.",
            {
                reply_to_message_id: msg.message_id
            }
        );

        return;

    }

    const parts =
        formatAiReplyForTelegram(result.response);

    for (const part of parts) {

        await bot.sendMessage(
            chatId,
            part,
            {
                parse_mode: "HTML",
                reply_to_message_id:
                    msg.message_id
            }
        );

    }

    // ==========================
    // MEMORY
    // ==========================

    let userContent = "";

    if (msg.text) {

        userContent = input;

    }

    else if (msg.photo) {

        userContent =
            `[Telegram Photo] ${msg.caption || ""}`;

    }

    else if (msg.sticker) {

        userContent =
            `[Telegram Sticker | ${msg.sticker.emoji || "🙂"}]`;

    }

    history.push(

        {
            role: "user",
            content: userContent
        },

        {
            role: "assistant",
            content: result.response
        }

    );

    if (history.length > 40) {

        history.splice(
            0,
            history.length - 40
        );

    }

    userHistory.set(
        sender.id,
        history
    );

    return;

}
  // Continue your message handling logic here...
// ======================================
// Save Telegram Stickers
// ======================================

if (msg.sticker) {
    let stickers = [];

    try {
        if (fs.existsSync("./stickers.json")) {
            stickers = JSON.parse(
                fs.readFileSync("./stickers.json", "utf8")
            );
        }
    } catch {
        stickers = [];
    }

    if (!stickers.includes(msg.sticker.file_id)) {
        stickers.push(msg.sticker.file_id);

        fs.writeFileSync(
            "./stickers.json",
            JSON.stringify(stickers, null, 2)
        );

        console.log("✨ New sticker learned:", msg.sticker.file_id);

        // Don't send any message to the user.
    }

    return;
}
    // ===============================
// GAME SYSTEM PRIORITY
// ===============================
if (msg.text) {

    const text = msg.text.toLowerCase().trim();

    const gameNames = (gameManager.getAllGamesMeta
        ? gameManager.getAllGamesMeta().map(g => g.name)
        : ["pirate", "zombie", "dungeon", "detective", "space", "story"]
    );

    // ==========================
    // EXIT GAME -> HAND OFF TO AI
    // ==========================
    // If a session is active and the user wants out (explicit exit word,
    // or something like "let me chat the ai" / "talk to ai"), end the
    // session for real and let this same message fall through to the
    // normal AI chat handler below instead of getting eaten by the game.

    const AI_HANDOFF_RE = /\b(chat|talk|speak)\b.{0,15}\b(ai|bot)\b|\b(ai|bot)\b.{0,15}\bchat\b/i;
    const EXIT_WORDS = ["quit", "exit", "leave", "stop", "stop game", "exit game", "quit game"];

    const activeSession = gameManager.getSession(msg.from.id);

    if (activeSession && (EXIT_WORDS.includes(text) || AI_HANDOFF_RE.test(text))) {

        gameManager.endSession(msg.from.id);

        await bot.sendMessage(
            msg.chat.id,
            "Game paused — you're back to chatting with the AI. Type a game name any time to play again.",
            { reply_markup: { remove_keyboard: true } }
        );

        // No return here — let this same message continue down to the
        // normal AI chat handler further below, in case it was also a
        // real question (e.g. "let's chat, how's the weather?").
    } else {

        // ==========================
        // START NEW GAME
        // ==========================

        if (gameNames.includes(text)) {

            const user = {
                id: msg.from.id,
                username: msg.from.username || "",
                first_name: msg.from.first_name || ""
            };

            try {

                const result = gameManager.startGame(user, text);

                await bot.sendMessage(
                    msg.chat.id,
                    result.text,
                    {
                        reply_markup: {
                            keyboard: gameManager
                                .getGame(text)
                                .getKeyboard(),
                            resize_keyboard: true
                        }
                    }
                );

                return; // Game started

            } catch (err) {

                console.error("GAME START ERROR:", err);

                await bot.sendMessage(
                    msg.chat.id,
                    "Game failed to start."
                );

                return;
            }
        }

        // ==========================
        // CONTINUE GAME
        // ==========================

        const session = gameManager.getSession(msg.from.id);

        if (session) {

            const game = gameManager.getGame(session.game);

            if (game && typeof game.getKeyboard === "function") {

                const gameInputs = game
                    .getKeyboard()
                    .flat()
                    .map(btn => btn.toLowerCase().trim());

                if (gameInputs.includes(text)) {

                    try {

                        const result = await gameManager.continueGame(
                            msg.from.id,
                            text
                        );

                        if (result && result.text) {
                            await bot.sendMessage(
                                msg.chat.id,
                                result.text,
                                result.end
                                    ? { reply_markup: { remove_keyboard: true } }
                                    : {}
                            );
                        }

                        // If the game itself signalled it ended (e.g. its own
                        // exit-word handling), also clear the session so the
                        // next message goes straight to AI without needing a
                        // second exit command.
                        if (result && result.end) {
                            gameManager.endSession(msg.from.id);
                        }

                        return; // Only block AI for valid game inputs

                    } catch (err) {

                        console.error("GAME CONTINUE ERROR:", err);

                        await bot.sendMessage(
                            msg.chat.id,
                            "Game error occurred."
                        );

                        return;
                    }
                }
            }
        }
    }

    // ==========================
    // NOT A GAME MESSAGE
    // AI WILL HANDLE IT BELOW
    // ==========================
}
// AI handles all other messages
// ===============================
// 🤖 AI SYSTEM STARTS BELOW HERE
// ===============================
  // --- AI Sticker Recognition (only for stickers, doesn't block other message types) ---
  if (msg.sticker) {
    try {
      const result = await stickerRecognitionService.analyzeSticker({
        bot,
        stickerFileId: msg.sticker.file_id,
        userId: sender.id,
      });

      console.log("Sticker AI:", result.text);

      await bot.sendMessage(chatId, result.text);
    } catch (error) {
      console.error("Sticker recognition error:", error);
    }
    // NOTE: no `return` here — decide below whether stickers should
    // still flow into group moderation checks further down.
  }

  // --- Group/supergroup photo (avatar) changed — revert or remove it ---
  if (isGroup && (msg.new_chat_photo || msg.delete_chat_photo)) {
    await handleChatPhotoChanged(chatId, msg.message_id, msg.chat.title);
    return;
  }

  // ... rest of your handler continues unchanged

  // --- Private chat: menu multi-step flows (Add Channel/Group, Promote User) ---
  if (isPrivate && !isCommand) {
    const pending = getPending(sender.id);

    if (pending && (pending.action === "admin_addprem" || pending.action === "admin_removeprem")) {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      const target = await resolveTargetFromMessage(msg);
      if (!target) {
        await bot.sendMessage(chatId, "Couldn't resolve that. Send a numeric ID, forward a message from them, or send their @username.");
        return;
      }
      const grantingPrem = pending.action === "admin_addprem";
      setPlan(target.id, grantingPrem ? "premium" : "free");
      clearPending(sender.id);
      await bot.sendMessage(
        chatId,
        grantingPrem
          ? `✅ Granted premium to ${target.label} (${target.id}).`
          : `✅ Removed premium from ${target.label} (${target.id}).`,
        { reply_markup: backToAdminKeyboard() }
      );
      try {
        await bot.sendMessage(
          target.id,
          grantingPrem
            ? "🎉 You've been granted *Premium* access!"
            : "Your *Premium* access has been removed.",
          { parse_mode: "Markdown" }
        );
      } catch {
        // target hasn't started the bot — nothing we can do
      }
      return;
    }

    if (pending && (pending.action === "admin_addadmin" || pending.action === "admin_deladmin")) {
      if (!canManageAdmins(sender.id)) {
        clearPending(sender.id);
        return;
      }
      const target = await resolveTargetFromMessage(msg);
      if (!target) {
        await bot.sendMessage(chatId, "Couldn't resolve that. Send a numeric ID, forward a message from them, or send their @username.");
        return;
      }
      clearPending(sender.id);
      if (pending.action === "admin_addadmin") {
        const added = addBotAdmin(target.id);
        await bot.sendMessage(
          chatId,
          added ? `✅ ${target.label} (${target.id}) is now a bot admin.` : `${target.label} was already a bot admin.`,
          { reply_markup: backToAdminKeyboard() }
        );
      } else {
        const result = removeBotAdmin(target.id);
        const text =
          result === "owner" ? "🚫 Can't remove the owner." :
          result === "missing" ? "That user wasn't a bot admin." :
          `✅ Removed ${target.label} (${target.id}) from bot admins.`;
        await bot.sendMessage(chatId, text, { reply_markup: backToAdminKeyboard() });
      }
      return;
    }

    if (pending && pending.action === "admin_edit_announcement") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      const text = (msg.text || "").trim();
      if (text === "-") {
        clearAnnouncement();
        await bot.sendMessage(chatId, "✅ Announcement cleared.", { reply_markup: backToAdminKeyboard() });
      } else if (text) {
        setAnnouncement(text);
        await bot.sendMessage(chatId, "✅ Announcement updated. It now shows at the top of everyone's menu.", {
          reply_markup: backToAdminKeyboard(),
        });
      } else {
        await bot.sendMessage(chatId, "Send text for the announcement, or `-` to clear it.", { reply_markup: backToAdminKeyboard() });
      }
      return;
    }

    if (pending && pending.action === "admin_broadcast") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      setPending(sender.id, { action: "admin_broadcast_confirm", fromChatId: chatId, messageId: msg.message_id });
      await bot.sendMessage(chatId, "👆 That's the message that will be broadcast. Preview above.");
      await bot.sendMessage(chatId, "Send this to everyone who has started the bot?", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ ¢σηƒιям & ѕєη∂", callback_data: "admin_broadcast_confirm" ,style: 'success' },
              { text: "❌ ¢αη¢єℓ", callback_data: "admin_broadcast_cancel",style: 'danger'  },
            ],
          ],
        },
      });
      return;
    }

    if (pending && pending.action === "ai_chat") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      const targetChatId = pending.chatId;
      const targetLabel = pending.chatLabel || String(targetChatId);
      const endKeyboard = { inline_keyboard: [[{ text: "🛑 єη∂ ¢нαт", callback_data: `cs_ai_end_${targetChatId}`, style: 'danger' }]] };
      // A photo sent during an AI chat session registers a "delete on sight" image
      // (this list is shared across every chat the bot protects).
      if (msg.photo) {
        try {
          const photo = msg.photo[msg.photo.length - 1];
          const buf = await downloadFileToBuffer(photo.file_id);
          const hash = await computeImageHash(buf);
          addBannedImage(hash, msg.caption || undefined);
          await bot.sendMessage(
            chatId,
            `🚫 Got it — that image is now on the auto-delete list (${getBannedImages().length} total). ` +
              `I'll remove any future post that looks like it, in any group or channel I'm admin in.`,
            { reply_markup: endKeyboard }
          );
        } catch (err) {
          console.error("Failed to register banned image via AI chat", err.message);
          await bot.sendMessage(chatId, "Couldn't process that image, try again.");
        }
        return;
      }
      if (msg.text) {
        try {
          const { reply, changes } = await runAiConfigTurn(sender.id, msg.text, targetChatId, targetLabel);
          let out = reply;
          if (changes.length) out += "\n\n" + changes.join("\n") + `\n\n(applies to ${targetLabel} only)`;
          await bot.sendMessage(chatId, out, { reply_markup: endKeyboard });
        } catch (err) {
          console.error("AI assistant turn failed", err.message);
          await bot.sendMessage(chatId, `⚠️ The AI assistant hit an error: ${err.message}`);
        }
        return;
      }
      return;
    }

    if (pending && pending.action === "cs_addrule") {
      const targetChatId = pending.chatId;
      if (!canManageChat(sender.id, targetChatId)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      const text = (msg.text || "").trim();
      if (!text) {
        await bot.sendMessage(chatId, "Send the rule as plain text.", { reply_markup: chatRulesKeyboard(targetChatId) });
        return;
      }
      addRule(targetChatId, text);
      await bot.sendMessage(chatId, `✅ Rule added to ${chatTitleFor(targetChatId)}: "${text}"`, {
        reply_markup: chatRulesKeyboard(targetChatId),
      });
      return;
    }

    if (pending && pending.action === "cs_addword") {
      const targetChatId = pending.chatId;
      if (!canManageChat(sender.id, targetChatId)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      const text = (msg.text || "").trim();
      if (!text) {
        await bot.sendMessage(chatId, "Send the word/phrase as plain text.", { reply_markup: chatBlacklistKeyboard(targetChatId) });
        return;
      }
      addBlacklistWord(targetChatId, text);
      await bot.sendMessage(chatId, `✅ Blacklisted "${text}" in ${chatTitleFor(targetChatId)}.`, {
        reply_markup: chatBlacklistKeyboard(targetChatId),
      });
      return;
    }

    if (pending && pending.action === "admin_addbanimage") {
      if (!isBotAdmin(sender.id)) {
        clearPending(sender.id);
        return;
      }
      clearPending(sender.id);
      if (!msg.photo) {
        await bot.sendMessage(chatId, "Send a photo to ban.", { reply_markup: backToAdminKeyboard() });
        return;
      }
      try {
        const photo = msg.photo[msg.photo.length - 1];
        const buf = await downloadFileToBuffer(photo.file_id);
        const hash = await computeImageHash(buf);
        addBannedImage(hash, msg.caption || undefined);
        await bot.sendMessage(chatId, `🚫 Banned image added (${getBannedImages().length} total).`, {
          reply_markup: backToAdminKeyboard(),
        });
      } catch (err) {
        console.error("Failed to register banned image", err.message);
        await bot.sendMessage(chatId, "Couldn't process that image, try again.", { reply_markup: backToAdminKeyboard() });
      }
      return;
    }


    if (pending && pending.action === "add_chat") {
      if (!isBotAdmin(sender.id) && getPlan(sender.id) !== "premium") {
        clearPending(sender.id);
        await bot.sendMessage(chatId, "🔒 Adding a chat for protection requires Premium (or Bot Admin).", {
          reply_markup: { inline_keyboard: [[{ text: "⭐ νιєω ρяємιυм", callback_data: "menu_premium", style: 'primary' }]] },
        });
        return;
      }
      let target = null;
      if (msg.forward_from_chat) {
        target = msg.forward_from_chat;
      } else if (msg.text && msg.text.trim().startsWith("@")) {
        try {
          target = await bot.getChat(msg.text.trim());
        } catch (err) {
          await bot.sendMessage(chatId, `Couldn't find that chat: ${err.message}`);
          return;
        }
      } else {
        await bot.sendMessage(
          chatId,
          "Please forward a message from the chat, or send its @username (e.g. @mychannel)."
        );
        return;
      }

      try {
        const me = await bot.getMe();
        const member = await bot.getChatMember(target.id, me.id);
        if (member.status !== "administrator" && member.status !== "creator") {
          await bot.sendMessage(
            chatId,
            `I'm not an admin in "${target.title || target.username}" yet. Add me as admin there ` +
              `(with delete/restrict/promote rights) and try again.`
          );
          clearPending(sender.id);
          return;
        }
      } catch (err) {
        await bot.sendMessage(
          chatId,
          `Couldn't verify my admin status there: ${err.message}. Make sure I'm added as admin and try again.`
        );
        clearPending(sender.id);
        return;
      }

      addChat(sender.id, target);
      clearPending(sender.id);
      await captureChatPhotoBaseline(target.id, target.title);
      ensureChatStats(target.id, target.title || target.username, target.type);
      // Immediately show this chat's own ⚙️ Settings panel — toggles from here
      // (Photo Lock, Rules, etc.) only ever apply to this one chat.
      await sendChatSettingsPanel(chatId, target.id, true);
      return;
    }

    if (pending && pending.action === "promote_user") {
      let targetUserId = null;
      let targetLabel = "";

      if (msg.forward_from) {
        targetUserId = msg.forward_from.id;
        targetLabel = msg.forward_from.first_name || String(targetUserId);
      } else if (msg.text && msg.text.trim().startsWith("@")) {
        try {
          const chat = await bot.getChat(msg.text.trim());
          targetUserId = chat.id;
          targetLabel = chat.first_name || chat.username || String(targetUserId);
        } catch (err) {
          await bot.sendMessage(
            chatId,
            `Couldn't resolve that username (${err.message}). Try forwarding a message from them instead.`
          );
          return;
        }
      } else {
        await bot.sendMessage(chatId, "Forward a message from the person, or send their @username.");
        return;
      }

      try {
        await bot.promoteChatMember(pending.chatId, targetUserId, {
          can_delete_messages: true,
          can_restrict_members: true,
          can_invite_users: true,
          can_pin_messages: true,
          can_manage_chat: true,
        });
        await bot.sendMessage(chatId, `✅ Promoted ${targetLabel} in that chat.`, {
          reply_markup: mainMenuKeyboard(sender.id),
        });
      } catch (err) {
        await bot.sendMessage(
          chatId,
          `❌ Couldn't promote them: ${err.message}. Make sure I have "Add new admins" rights in that chat.`
        );
      }
      clearPending(sender.id);
      return;
    }
  }
  // ===== PRIVATE AI CHAT =====
    
// ==========================================
// PRIVATE STICKER AI
// ==========================================

// ===== PRIVATE AI CHAT =====
// ======================================
// PRIVATE AI CHAT
// ======================================

// ======================================================
// PRIVATE AI CHAT
// ======================================================

// ======================================================
// PRIVATE AI CHAT
// ======================================================

if (
    isPrivate &&
    !isCommand &&
    (
        msg.text ||
        msg.sticker ||
        msg.photo ||
        msg.voice
    )
) {


    const pending = getPending(sender.id);


    if (!pending) {


        await bot.sendChatAction(
            chatId,
            "typing"
        );



        if(!userHistory.has(sender.id)){

            userHistory.set(
                sender.id,
                []
            );

        }


        const history =
            userHistory.get(sender.id);



        let inputText = "";

        let imageUrl = null;

        let isImage = false;

        let isVoice = false;



        // ============================
        // TEXT
        // ============================

        if(msg.text){

            inputText = msg.text;

        }



        // ============================
        // STICKER
        // ============================

        else if(msg.sticker){


            inputText = `

The user sent a Telegram sticker.

Emoji:
${msg.sticker.emoji || "🙂"}

React naturally.

Do not say you cannot see stickers.

`;

        }




        // ============================
        // IMAGE
        // ============================

        else if(msg.photo){


            isImage = true;


            try{


                const photo =
                    msg.photo[
                        msg.photo.length - 1
                    ];


                const file =
                    await bot.getFile(
                        photo.file_id
                    );



                imageUrl =
                `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;



                inputText =
                    msg.caption ||
                    "Analyze this image.";


            }
            catch(err){


                console.log(
                    "IMAGE ERROR:",
                    err.message
                );


                inputText =
                    "Analyze this image.";

            }


        }





        // ============================
        // VOICE NOTE
        // ============================

        else if(msg.voice){


            isVoice = true;


            try{


                const file =
                    await bot.getFile(
                        msg.voice.file_id
                    );



                const voiceUrl =
                `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;



                console.log(
                    "VOICE:",
                    voiceUrl
                );



                const transcript =
                    await speechToText(
                        voiceUrl
                    );



                console.log(
                    "TRANSCRIPT:",
                    transcript
                );



                if(transcript){


                    inputText =
                        transcript;


                }
                else{


                    inputText =
                    "The user sent a voice message.";

                }


            }
            catch(err){


                console.log(
                    "VOICE ERROR:",
                    err.message
                );


                inputText =
                "The user sent a voice message.";

            }


        }





        // ============================
        // AI RESPONSE
        // ============================

        if (!canUseAi(sender.id)) {
            await sendSignupGate(chatId, msg.message_id);
            return;
        }

        const result =
        await processWithFailover(

            sender.id,

            inputText,

            (
                isImage ||
                isVoice
            )
            ?
            []
            :
            history,


            {

                msg,


                imageUrl,


                category:null,


                systemPrompt:
                isImage
                ?
`
You are an image analysis AI.

Only analyze the image.

Do not chat.
Do not roleplay.
Describe visible details only.
`
                :
                null,


                forceFreeOnly:false,


                preferredModel:
                isImage
                ?
                "charart"
                :
                null


            }

        );





        if(!result.success){


            await bot.sendMessage(

                chatId,

                "✨ ᴍɪꜱꜱ ᴀʀɪᴀ ɪꜱ ᴘᴏʟɪꜱʜɪɴɢ ʏᴏᴜʀ ʀᴇꜱᴘᴏɴꜱᴇ ᴛᴏ ᴍᴀᴋᴇ ɪᴛ ᴘᴇʀꜰᴇᴄᴛ. 🌸 ᴘʟᴇᴀꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ᴀ ᴍᴏᴍᴇɴᴛ. 💗"

            );


            return;

        }






        // ============================
        // VOICE REPLY
        // ============================


        if(isVoice){


            try{


                const audio =
                    await textToVoice(
                        result.response
                    );



                if(audio){


                    await bot.sendVoice(

                        chatId,

                        audio,

                        {

                            reply_to_message_id:
                            msg.message_id

                        }

                    );


                    return;

                }



            }
            catch(err){


                console.log(
                    "TTS ERROR:",
                    err.message
                );


            }


        }







        // ============================
        // NORMAL TEXT REPLY
        // ============================


        const parts =
            formatAiReplyForTelegram(
                result.response
            );



        for(const part of parts){


            await bot.sendMessage(

                chatId,

                part,

                {

                    parse_mode: "HTML",

                    reply_to_message_id:
                    msg.message_id

                }

            );

        }






        // ============================
        // SAVE MEMORY
        // ============================


        if(
            !isImage &&
            !isVoice
        ){


            history.push(


                {
                    role:"user",
                    content:inputText
                },


                {
                    role:"assistant",
                    content:result.response
                }


            );



            if(history.length > 40){


                history.splice(
                    0,
                    history.length - 40
                );

            }



            userHistory.set(
                sender.id,
                history
            );


        }



        return;


    }

}
  // --- Group messages: force-join gate, then image moderation ---
  if (!isGroup) return;

  const senderDisplayName =
    [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.username || String(sender.id);
    
if (FORCE_JOIN_CHANNELS.length > 0 && !isCommand) {

    let exempt = false;

    if (FORCE_JOIN_EXEMPT_ADMINS) {
        const admins = await bot.getChatAdministrators(chatId);
        exempt = admins.some(a => a.user.id === sender.id);
    }

    if (!exempt) {

        const missing = await getMissingChannels(sender.id);

        if (missing.length > 0) {

            // Delete the user's message
            try {
                await bot.deleteMessage(chatId, msg.message_id);
            } catch (err) {
                console.error("Could not delete message:", err.message);
            }

            // Don't send another prompt if one already exists
            if (pendingForceJoin.has(sender.id)) {
                return;
            }

            try {

                const sent = await bot.sendMessage(
                    chatId,
                    `🌸 <b>мιѕѕ αяια</b>

🔒 <b>αℓмσѕт тнєяє!</b>

You need to join the required channel and group before I'll let you chat.

Tap the buttons below, then press <b>✅ νєяιƒу</b>.`,
                    {
                        parse_mode: "HTML",
                        reply_markup: forceJoinKeyboard(missing)
                    }
                );

                pendingForceJoin.set(sender.id, sent.message_id);

            } catch (err) {
                console.error("Could not send force-join prompt:", err.message);
            }

            return;
        }

        // User has joined everything
        if (pendingForceJoin.has(sender.id)) {

            try {
                await bot.deleteMessage(
                    chatId,
                    pendingForceJoin.get(sender.id)
                );
            } catch {}

            pendingForceJoin.delete(sender.id);
        }
    }
}

  // --- Flood Lock: mutes anyone who fires off a burst of messages ---
  if (!isCommand && isFloodLockEnabled(chatId)) {
    const admins = await bot.getChatAdministrators(chatId).catch(() => []);
    const isSenderAdmin = admins.some((a) => a.user.id === sender.id);
    if (!isSenderAdmin && isFlooding(chatId, sender.id)) {
      clearFloodHistory(chatId, sender.id);
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete flood message", err.message);
      }
      const muted = await muteUser(chatId, sender.id, FLOOD_MUTE_MS);
      incrementChatFlags(chatId, msg.chat.title);
      const ownerId = await getOwnerId(chatId).catch(() => null);
      if (ownerId) {
        const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ");
        bot
          .sendMessage(
            ownerId,
            `🌊 *Flood detected*\n*Chat:* ${msg.chat.title || chatId}\n*User:* ${senderName} (${sender.id})\n${
              muted ? "Muted for 5 minutes." : "Could not mute them (likely an admin/higher rank)."
            }`,
            { parse_mode: "Markdown" }
          )
          .catch(() => {});
      }
      return;
    }
  }

  // --- Forward Lock: blocks forwarded posts from other channels/bots (common ad-spam vector) ---
  if (!isCommand && isForwardLockEnabled(chatId) && msg.forward_from_chat) {
    const admins = await bot.getChatAdministrators(chatId).catch(() => []);
    const isSenderAdmin = admins.some((a) => a.user.id === sender.id);
    if (!isSenderAdmin) {
      log("Flagged forwarded post from", sender.first_name, sender.id, "in chat", chatId);
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete forwarded message", err.message);
      }
      incrementChatFlags(chatId, msg.chat.title);
      if (isWarnSystemEnabled(chatId)) await warnUser(chatId, sender.id, senderDisplayName, "forwarded post");
      return;
    }
  }

  // --- Custom admin-defined text rules (only runs if any rules are set) ---
  if (msg.text && !isCommand && getRules(chatId).length > 0) {
    try {
      const flaggedText = await classifyText(msg.text, chatId);
      if (flaggedText) {
        log("Flagged text (custom rule) from", sender.first_name, sender.id, "in chat", chatId);
        try {
          await bot.deleteMessage(chatId, msg.message_id);
        } catch (err) {
          console.error("Failed to delete rule-violating message", err.message);
        }
        incrementChatFlags(chatId, msg.chat.title);
        if (isWarnSystemEnabled(chatId)) await warnUser(chatId, sender.id, senderDisplayName, "custom rule violation");
        return;
      }
    } catch (err) {
      console.error("Text rule check failed", err.message);
    }
  }

  // --- Link Lock: strips every link from non-admins (stricter than the malicious-link check below) ---
  if (msg.text && !isCommand && isLinkLockEnabled(chatId) && extractUrls(msg.text).length > 0) {
    const admins = await bot.getChatAdministrators(chatId).catch(() => []);
    const isSenderAdmin = admins.some((a) => a.user.id === sender.id);
    if (!isSenderAdmin) {
      log("Flagged link (Link Lock) from", sender.first_name, sender.id, "in chat", chatId);
      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete message with link", err.message);
      }
      incrementChatFlags(chatId, msg.chat.title);
      if (isWarnSystemEnabled(chatId)) await warnUser(chatId, sender.id, senderDisplayName, "link not allowed");
      return;
    }
  }

  // --- Malicious links (phishing/malware) via Google Safe Browsing ---
  if (msg.text && !isCommand) {
    try {
      const flaggedLink = await classifyLinks(msg.text);
      if (flaggedLink) {
        log("Flagged malicious link from", sender.first_name, sender.id, "in chat", chatId);
        try {
          await bot.deleteMessage(chatId, msg.message_id);
        } catch (err) {
          console.error("Failed to delete message with malicious link", err.message);
        }
        incrementChatFlags(chatId, msg.chat.title);
        const ownerId = await getOwnerId(chatId).catch(() => null);
        if (ownerId) {
          bot
            .sendMessage(ownerId, `🔗 *Malicious link removed*\n*Chat:* ${msg.chat.title || chatId}`, {
              parse_mode: "Markdown",
            })
            .catch(() => {});
        }
        return;
      }
    } catch (err) {
      console.error("Link check failed", err.message);
    }
  }

  if (!msg.photo) return;

try {
  const photo = msg.photo[msg.photo.length - 1]; // Highest resolution
  const buf = await downloadFileToBuffer(photo.file_id);

  // ------------------------------------------------
  // Fast local banned-image hash check
  // ------------------------------------------------
  try {
    const hash = await computeImageHash(buf);
    const match = matchBannedImage(hash);

    if (match) {
      log(
        "Banned reference image matched (",
        match.label,
        ") from",
        sender.first_name,
        sender.id,
        "in chat",
        chatId
      );

      try {
        await bot.deleteMessage(chatId, msg.message_id);
      } catch (err) {
        console.error("Failed to delete banned-image match", err.message);
      }

      incrementChatFlags(chatId, msg.chat.title);

      const ownerId = await getOwnerId(chatId).catch(() => null);

      if (ownerId) {
        bot.sendMessage(
          ownerId,
          `🚫 *Banned image removed*\n\n*Chat:* ${
            msg.chat.title || chatId
          }\nMatched: ${match.label}`,
          {
            parse_mode: "Markdown",
          }
        ).catch(() => {});
      }

      return;
    }
  } catch (err) {
    console.error("Image hash check failed", err.message);
  }

  // ------------------------------------------------
  // AI image moderation
  // ------------------------------------------------
  const base64Data = buf.toString("base64");

  // sender + title are now passed so enforcement
  // (demote, owner DM, etc.) can happen internally.
  const flagged = await classifyImage(
    buf,
    base64Data,
    "image/jpeg",
    chatId,
    sender,
    msg.chat.title
  );

  if (!flagged) return;

  log(
    "Flagged image from",
    sender.first_name,
    sender.id,
    "in chat",
    chatId
  );

  // Delete offending message
  try {
    await bot.deleteMessage(chatId, msg.message_id);
  } catch (err) {
    console.error("Failed to delete flagged message", err.message);
  }

  // Track moderation statistics
  incrementChatFlags(chatId, msg.chat.title);

  // Everything else (demote admin, lock chat,
  // warn owner, severe enforcement, etc.)
  // already happened inside:
  //
  // classifyImage()
  //   ├── classifyImageSightengine()
  //   └── classifyImageCustomRules()
  //
  // so don't repeat it here.
} catch (err) {
  console.error("Error handling photo message", err);
}
});  
bot.on("polling_error", (err) => console.error("Polling error:", err.message));

/* ============================================================
 * Channels: profile-photo lock + banned-image/rule checks on
 * posts, since channels don't go through the "message" event.
 * ============================================================ */
/* ============================================================
 * Channels: profile-photo lock + banned-image/rule checks on
 * posts, since channels don't go through the "message" event.
 * ============================================================ */
const channelPosts = new Map();

bot.on("channel_post", async (post) => {
  // Save original content for edit lock
  channelPosts.set(`${post.chat.id}:${post.message_id}`, {
    text: post.text || "",
    caption: post.caption || "",
    timestamp: Date.now()
  });


  try {
    if (post.new_chat_photo || post.delete_chat_photo) {
      await handleChatPhotoChanged(
        post.chat.id,
        post.message_id,
        post.chat.title
      );
      return;
    }

    // Rest of your moderation code goes here...

    // --- Forward Lock: blocks forwarded posts from other channels/bots ---
    if (isForwardLockEnabled(post.chat.id) && post.forward_from_chat) {
      log("Flagged forwarded post in channel", post.chat.id);
      try {
        await bot.deleteMessage(post.chat.id, post.message_id);
      } catch (err) {
        console.error("Failed to delete forwarded channel post", err.message);
      }
      incrementChatFlags(post.chat.id, post.chat.title);
      return;
    }

    // --- Link Lock: strips every link from channel posts (all channel posts come from admins) ---
    if (post.text && isLinkLockEnabled(post.chat.id) && extractUrls(post.text).length > 0) {
      log("Flagged link (Link Lock) in channel post in", post.chat.id);
      try {
        await bot.deleteMessage(post.chat.id, post.message_id);
      } catch (err) {
        console.error("Failed to delete channel post with link", err.message);
      }
      incrementChatFlags(post.chat.id, post.chat.title);
      return;
    }

    if (post.text && getRules(post.chat.id).length > 0) {
      const flaggedText = await classifyText(post.text, post.chat.id);
      if (flaggedText) {
        log("Flagged channel post text (custom rule) in", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete rule-violating channel post", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
      }
      return;
    }

    if (post.text) {
      const flaggedLink = await classifyLinks(post.text);
      if (flaggedLink) {
        log("Flagged malicious link in channel post in", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete channel post with malicious link", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
        return;
      }
    }

    // --- AI Sticker Recognition (unsafe content) ---
    if (post.sticker) {

  // Skip animated and video stickers
  if (post.sticker.is_animated || post.sticker.is_video) {
    return;
  }

  try {
    const result = await stickerRecognitionService.analyzeSticker({
      bot,
      stickerFileId: post.sticker.file_id,
      userId: post.from?.id || null,
    });

    const analysis = (result.text || "").toLowerCase();

    const unsafe = [
      "contains nudity",
      "contains explicit sexual",
      "contains pornography",
      "contains gore",
      "contains graphic violence",
      "unsafe content"
    ];

    const safe = [
      "safe",
      "appropriate",
      "clean",
      "no nudity",
      "no nsfw",
      "no sexual content",
      "no violence"
    ];

    const isUnsafe = unsafe.some(x => analysis.includes(x));
    const isSafe = safe.some(x => analysis.includes(x));

    if (isUnsafe && !isSafe) {
      log("🚫 Unsafe sticker removed", analysis);

      await bot.deleteMessage(post.chat.id, post.message_id);

      incrementChatFlags(post.chat.id, post.chat.title);

      return;
    }

  } catch (err) {
    console.error("Sticker AI moderation failed:", err.message);
  }
}

    // --- Sticker/GIF Lock: channel posts are always from admins, so this only
    // applies if you want to block ALL stickers/GIFs regardless of who posts ---
// --- Sticker/GIF Lock ---
if (isStickerLockEnabled(post.chat.id)) {

  // Allow animated (.tgs) and video (.webm) stickers
  if (
    post.sticker &&
    (post.sticker.is_animated || post.sticker.is_video)
  ) {
    return;
  }

  // Block static stickers and GIFs
  if (
    (post.sticker && !post.sticker.is_animated && !post.sticker.is_video) ||
    post.animation
  ) {
    log("Flagged sticker/GIF (Sticker Lock) in channel", post.chat.id);

    try {
      await bot.deleteMessage(post.chat.id, post.message_id);
    } catch (err) {
      console.error("Failed to delete sticker/GIF channel post:", err.message);
    }

    incrementChatFlags(post.chat.id, post.chat.title);
    return;
  }
}
    if (post.photo) {
      const photo = post.photo[post.photo.length - 1];
      const buf = await downloadFileToBuffer(photo.file_id);

      const hash = await computeImageHash(buf);
      const match = matchBannedImage(hash);
      if (match) {
        log("Banned reference image matched (", match.label, ") in channel", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete banned-image channel post", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
        return;
      }

      const base64Data = buf.toString("base64");
      const flagged = await classifyImage(buf, base64Data, "image/jpeg", post.chat.id);
      if (flagged) {
        log("Flagged image (Sightengine/custom rule) in channel", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete flagged channel post image", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
      }
    }
  } catch (err) {
    console.error("Error handling channel_post", err.message);
  }
});
/* ============================================================
 * Edited posts/messages — deleted automatically when Edit Lock
 * is on, since edits after publishing aren't allowed by policy.
 * ============================================================ */
// Store original content

bot.on("edited_channel_post", async (post) => {
  if (!isEditLockEnabled(post.chat.id)) return;

  try {
    await bot.deleteMessage(post.chat.id, post.message_id);

    log("Deleted edited channel post", post.chat.id);

    const ownerId = await getOwnerId(post.chat.id).catch(() => null);

    if (ownerId) {
      await bot.sendMessage(
        ownerId,
        `✏️🚫 *Edited post auto-deleted*\n\n*Chat:* ${
          post.chat.title || post.chat.id
        }\n\nEditing published posts isn't allowed here.`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    console.error("Failed to delete edited channel post:", err.message);
  }
});

bot.on("edited_message", async (msg) => {
  if (
    msg.chat.type !== "group" &&
    msg.chat.type !== "supergroup"
  ) {
    return;
  }

  if (!isEditLockEnabled(msg.chat.id)) return;

  try {
    const admins = await bot.getChatAdministrators(msg.chat.id);

    const isAdmin = admins.some(
      (admin) => admin.user.id === msg.from.id
    );

    // Only delete edits made by admins
    if (!isAdmin) return;

    await bot.deleteMessage(msg.chat.id, msg.message_id);

    log("Deleted admin-edited message in", msg.chat.id);
  } catch (err) {
    console.error("Failed to delete edited message:", err.message);
  }
});


console.log("tg-guard starting...");
console.log("Using model:", MODERATION_MODEL);
console.log("DeepSeek key loaded:", !!DEEPSEEK_API_KEY);
console.log("Key prefix:", DEEPSEEK_API_KEY?.slice(0, 8));
console.log("Total games loaded:", gameManager.getGames().length);

// ============================================================
// DOWNLOAD SYSTEM — /download (saved data exports)
// ============================================================

bot.onText(/\/download/, async (msg) => {
  const chatId = msg.chat.id;
  const cats = downloadService.listCategories();

  const rows = cats.map((c) => [
    {
      text: `📁 ${c.label} • ${downloadService.countFiles(c.dir)}`,
      callback_data: `dl_${c.id}`
    }
  ]);

  await bot.sendMessage(
    chatId,
    `
╭━━━〔 📦 ᴅᴏᴡɴʟᴏᴀᴅ ᴄᴇɴᴛᴇʀ 〕━━━╮

<blockquote expandable='true'>ᴇxᴘᴏʀᴛ ʏᴏᴜʀ ʙᴏᴛ ᴅᴀᴛᴀ ᴀꜱ ᴀ
<code>.tar.gz</code> ᴀʀᴄʜɪᴠᴇ.</blockquote>

<b>📂 αναιℓαвℓє ¢αтєgσяιєꜱ</b>

<blockquote expandable='true'>ᴛᴀᴘ ᴀ ᴄᴀᴛᴇɢᴏʀʏ ʙᴇʟᴏᴡ ᴛᴏ
ɢᴇɴᴇʀᴀᴛᴇ ᴀ ꜱᴇᴄᴜʀᴇ ᴅᴏᴡɴʟᴏᴀᴅ.</blockquote>

━━━━━━━━━━━━━━━━━━
✨ <i>ᴅᴀᴠᴇ ᴛᴇᴄʜ • ᴅᴏᴡɴʟᴏᴀᴅ ꜱʏꜱᴛᴇᴍ</i>
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          ...rows,
          [
            {
              text: "❌ ¢ℓσꜱє",
              callback_data: "close"
            }
          ]
        ]
      }
    }
  );
});
// ============================================================
// SOCIAL MEDIA DOWNLOADER — /media
// ============================================================
bot.onText(/\/media/, async (msg) => {
  const chatId = msg.chat.id;

  const rows = Object.entries(socialDownloader.PLATFORMS).map(([key, p]) => [
    {
      text: `${p.confirmed ? "✨" : "🧪"} ${p.label}${p.confirmed ? "" : " • ʙᴇᴛᴀ"}`,
      callback_data: `media_${key}`
    }
  ]);

  rows.push([
    {
      text: "🔗 ∂ιяє¢т ℓιηк",
      callback_data: "media_direct"
    }
  ]);

  rows.push([
    {
      text: "❌ ¢ℓσꜱє",
      callback_data: "close"
    }
  ]);

  await bot.sendMessage(
    chatId,
    `
╭━━━〔 🎬 ᴍᴇᴅɪᴀ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 〕━━━╮

<blockquote expandable='true'>ᴅᴏᴡɴʟᴏᴀᴅ ᴠɪᴅᴇᴏꜱ, ᴍᴜꜱɪᴄ,
ᴘʜᴏᴛᴏꜱ, ʀᴇᴇʟꜱ, ꜱʜᴏʀᴛꜱ ᴀɴᴅ
ᴏᴛʜᴇʀ ᴍᴇᴅɪᴀ ɪɴ ʜɪɢʜ Qᴜᴀʟɪᴛʏ.</blockquote>

<b>🌐 ꜱυρρσятє∂ ρℓαтƒσямꜱ</b>

<blockquote expandable='true'>
✨ ᴠᴇʀɪꜰɪᴇᴅ • 🧪 ʙᴇᴛᴀ
</blockquote>

<b>📥 нσω ιт ωσякꜱ</b>

• ꜱᴇʟᴇᴄᴛ ᴀ ᴘʟᴀᴛꜰᴏʀᴍ
• ꜱᴇɴᴅ ᴛʜᴇ ᴘᴏꜱᴛ ʟɪɴᴋ
• ꜰᴏʀ ꜱᴘᴏᴛɪꜰʏ & ᴀᴘᴘʟᴇ ᴍᴜꜱɪᴄ,
  ꜱᴇɴᴅ ᴀ ꜱᴏɴɢ ɴᴀᴍᴇ ᴏʀ ʟɪɴᴋ

━━━━━━━━━━━━━━━━━━
⚡ <i>ꜰᴀꜱᴛ • ꜱᴇᴄᴜʀᴇ • ʜᴅ Qᴜᴀʟɪᴛʏ</i>

💖 <i>ᴅᴀᴠᴇ ᴛᴇᴄʜ • ᴍᴇᴅɪᴀ ʜᴜʙ</i>
`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: rows
      }
    }
  );
});
// ============================================================
// CODE ASSISTANT — "code a website for me" style requests
// ============================================================


bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;
  if (msg.chat.type !== "private") return;

  const userId = msg.from.id;

  // Media downloader awaiting a link/query
  const mediaState = mediaPending.get(userId);
  if (mediaState) {
    mediaPending.delete(userId);
    const platform = socialDownloader.PLATFORMS[mediaState.platform];
    await bot.sendChatAction(msg.chat.id, "typing");
    try {
      const data = await platform.fn(msg.text.trim());
      const mediaUrl = socialDownloader.extractMediaUrl(data);
      if (mediaUrl) {
        await bot.sendMessage(msg.chat.id, `Found it:\n${mediaUrl}`);
      } else {
        await bot.sendMessage(
          msg.chat.id,
          `Got a response but couldn't find a direct media link in it. Raw response:\n${JSON.stringify(data).slice(0, 1500)}`
        );
      }
    } catch (err) {
      await bot.sendMessage(
        msg.chat.id,
        `Download failed: ${err.response?.data?.message || err.message}${
          platform.confirmed ? "" : " (this platform's endpoint is unconfirmed — let me know the correct one and I'll fix it)"
        }`
      );
    }
    return;
  }

  // Direct media link mode
  if (msg.__awaitingDirectMedia) return; // placeholder, direct mode handled inline below

  // If we're mid code-flow for this user, ignore here — callbacks drive the rest
  if (codePending.has(userId)) return;

  if (codeAssistant.looksLikeCodeRequest(msg.text)) {
    codePending.set(userId, { request: msg.text, stage: "await_mode" });
    bot.sendMessage(msg.chat.id, "Got it — should I make this a single file/script, or a full project?", {
      reply_markup: {
        inline_keyboard: [[
          { text: "ѕ¢яιρт (σηє ƒιℓє)", callback_data: "code_mode_file",style: 'success' },
          { text: "ƒυℓℓ ρяσjє¢т", callback_data: "code_mode_script" ,style: 'primary'}
        ]]
      }
    });
  }
});

bot.on("callback_query", async (query) => {
  const data = query.data;
  const userId = query.from.id;
  const chatId = query.message.chat.id;

  try {
    // ---- Download center ----
    if (data.startsWith("dl_")) {
      const catId = data.replace("dl_", "");
      await bot.answerCallbackQuery(query.id, { text: "Building archive..." });
      try {
        const filePath = await downloadService.buildArchive(catId);
        await bot.sendDocument(chatId, filePath, {}, { filename: path.basename(filePath) });
      } catch (err) {
        bot.sendMessage(chatId, err.message);
      }
      return;
    }

    // ---- Media downloader ----
    if (data.startsWith("media_")) {
      const platformKey = data.replace("media_", "");
      await bot.answerCallbackQuery(query.id);

      if (platformKey === "direct") {
        mediaPending.set(userId, { platform: "__direct__" });
        bot.sendMessage(chatId, "Send me the direct media link (mp3/mp4/jpg/etc.) and I'll send it back to you.");
        return;
      }

      const platform = socialDownloader.PLATFORMS[platformKey];
      if (!platform) return;

      mediaPending.set(userId, { platform: platformKey });
      bot.sendMessage(
        chatId,
        platform.inputType === "query"
          ? `Send me the search text for ${platform.label} (e.g. song name).`
          : `Send me the ${platform.label} link.`
      );
      return;
    }

    // ---- Code assistant: file vs script ----
    if (data === "code_mode_file" || data === "code_mode_script") {
      const state = codePending.get(userId);
      if (!state) return bot.answerCallbackQuery(query.id);

      const mode = data === "code_mode_file" ? "file" : "script";
      await bot.answerCallbackQuery(query.id, { text: "Generating code..." });

      const files = await codeAssistant.generateCode(state.request, mode);
      codePending.set(userId, { ...state, stage: "generated", mode, files });

      if (mode === "file") {
        const f = files[0];
        await bot.sendDocument(chatId, Buffer.from(f.content, "utf8"), {}, { filename: f.path });
        codePending.delete(userId);
        return;
      }

      bot.sendMessage(
        chatId,
        `Generated ${files.length} file(s):\n${files.map((f) => `- ${f.path}`).join("\n")}\n\nWant me to deploy it?`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "уєѕ, ∂єρℓσу ιт", callback_data: "code_deploy_yes" ,style: 'primary'},
              { text: "ησ, jυѕт zιρ ιт", callback_data: "code_deploy_no",style: 'success' }
            ]]
          }
        }
      );
      return;
    }

    if (data === "code_deploy_no") {
      const state = codePending.get(userId);
      await bot.answerCallbackQuery(query.id);
      if (!state) return;
      for (const f of state.files) {
        await bot.sendDocument(chatId, Buffer.from(f.content, "utf8"), {}, { filename: f.path.replace(/\//g, "_") });
      }
      codePending.delete(userId);
      return;
    }

    if (data === "code_deploy_yes") {
      await bot.answerCallbackQuery(query.id);
      bot.sendMessage(chatId, "Where should I deploy it?", {
        reply_markup: {
          inline_keyboard: [[
            { text: "gιтнυв", callback_data: "code_deploy_github" ,style: 'primary'},
            { text: "яєρℓιт (νια gιтнυв ιмρσят)", callback_data: "code_deploy_replit",style: 'success' }
          ]]
        }
      });
      return;
    }

    if (data === "code_deploy_github" || data === "code_deploy_replit") {
      const state = codePending.get(userId);
      if (!state) return bot.answerCallbackQuery(query.id);

      const token = process.env.GITHUB_TOKEN;
      const username = process.env.GITHUB_USERNAME;

      if (!token || !username) {
        await bot.answerCallbackQuery(query.id);
        bot.sendMessage(
          chatId,
          "GitHub isn't connected on this bot yet — add GITHUB_TOKEN (repo-scope PAT) and GITHUB_USERNAME to .env to enable real deploys. Sending you the files instead."
        );
        for (const f of state.files) {
          await bot.sendDocument(chatId, Buffer.from(f.content, "utf8"), {}, { filename: f.path.replace(/\//g, "_") });
        }
        codePending.delete(userId);
        return;
      }

      await bot.answerCallbackQuery(query.id, { text: "Deploying..." });
      try {
        const repoName = `guardian-gen-${Date.now()}`;
        const result = await codeAssistant.deployToGithub({ token, username, repoName, files: state.files });

        const msgText =
          data === "code_deploy_replit"
            ? `Deployed!\n\nGitHub: ${result.repoUrl}\nOpen in Replit: ${result.replitImportUrl}`
            : `Deployed to GitHub: ${result.repoUrl}`;

        bot.sendMessage(chatId, msgText);
      } catch (err) {
        bot.sendMessage(chatId, `Deploy failed: ${err.message}`);
      }
      codePending.delete(userId);
      return;
    }
  } catch (err) {
    console.error("New-feature callback error:", err.message);
  }
});

// Direct media link handler (separate, simple text listener)

bot.on("message", async (msg) => {
  if (!msg.text || msg.chat.type !== "private") return;
  const state = mediaPending.get(msg.from.id);
  if (!state || state.platform !== "__direct__") return;
  mediaPending.delete(msg.from.id);

  const url = msg.text.trim();
  if (!socialDownloader.isDirectMediaUrl(url)) {
    return bot.sendMessage(msg.chat.id, "That doesn't look like a direct media file link (mp3/mp4/jpg/etc.).");
  }
  try {
    await bot.sendChatAction(msg.chat.id, "upload_document");
    await bot.sendDocument(msg.chat.id, url);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Couldn't fetch that file: ${err.message}`);
  }
});
