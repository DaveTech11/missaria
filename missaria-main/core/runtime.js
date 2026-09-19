const TELEGRAM_BOT_USERNAME =
  process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, '').trim() || 'missariaai_bot';
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
function createRuntime(bot) {
  // ============================================================
  // 🌸 GLOBAL TINY-CAPS OUTPUT STYLE
  // Convert all bot-facing text and button labels to Unicode
  // tiny-caps while preserving HTML tags, URLs and placeholders.
  // ============================================================
  const TINY_CAPS_MAP = {
    a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ғ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",
    n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"
  };

  function tinyCaps(text) {
    if (text === null || text === undefined || typeof text !== "string") return text;
    const saved = [];
    const protect = (value) => {
      const token = `\uE000${saved.length}\uE001`;
      saved.push(value);
      return token;
    };

    // Never alter HTML markup, URLs, Telegram entities or email addresses.
    let out = text.replace(/<[^>]*>|https?:\/\/\S+|tg:\/\/\S+|@[A-Za-z0-9_]{3,}/g, protect);
    out = out.replace(/[A-Za-z]/g, (ch) => TINY_CAPS_MAP[ch.toLowerCase()] || ch);
    return out.replace(/\uE000(\d+)\uE001/g, (_, i) => saved[Number(i)]);
  }

  function tinyCapsMarkup(markup) {
    if (!markup || typeof markup !== "object") return markup;
    const clone = JSON.parse(JSON.stringify(markup));
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) return node.forEach(walk);
      if (typeof node.text === "string") node.text = tinyCaps(node.text);
      if (typeof node.caption === "string") node.caption = tinyCaps(node.caption);
      Object.keys(node).forEach((key) => {
        // Telegram copy_text buttons contain the exact text that should be
        // placed on the user's clipboard. Never tiny-cap or otherwise
        // transform that payload.
        if (key !== "text" && key !== "caption" && key !== "copy_text") walk(node[key]);
      });
    };
    walk(clone);
    return clone;
  }

  // Patch the shared bot instance once. Every handler uses this instance,
  // so normal AI replies, menus, admin panels, games and notifications
  // consistently use the same tiny-caps presentation.
  if (!bot.__ariaTinyCapsPatched) {
    const wrap = (method, transformArgs) => {
      if (typeof bot[method] !== "function") return;
      const original = bot[method].bind(bot);
      bot[method] = (...args) => original(...transformArgs(args));
    };

    wrap("sendMessage", (args) => {
      if (typeof args[1] === "string") args[1] = tinyCaps(args[1]);
      if (args[2]?.reply_markup) args[2] = { ...args[2], reply_markup: tinyCapsMarkup(args[2].reply_markup) };
      return args;
    });
    wrap("editMessageText", (args) => {
      if (typeof args[0] === "string") args[0] = tinyCaps(args[0]);
      if (args[1]?.reply_markup) args[1] = { ...args[1], reply_markup: tinyCapsMarkup(args[1].reply_markup) };
      return args;
    });
    wrap("editMessageCaption", (args) => {
      if (typeof args[0] === "string") args[0] = tinyCaps(args[0]);
      if (args[1]?.reply_markup) args[1] = { ...args[1], reply_markup: tinyCapsMarkup(args[1].reply_markup) };
      return args;
    });
    wrap("sendPhoto", (args) => {
      if (typeof args[2] === "object" && args[2]) {
        args[2] = { ...args[2] };
        if (typeof args[2].caption === "string") args[2].caption = tinyCaps(args[2].caption);
        if (args[2].reply_markup) args[2].reply_markup = tinyCapsMarkup(args[2].reply_markup);
      }
      return args;
    });
    wrap("sendVideo", (args) => {
      if (typeof args[2] === "object" && args[2]) {
        args[2] = { ...args[2] };
        if (typeof args[2].caption === "string") args[2].caption = tinyCaps(args[2].caption);
        if (args[2].reply_markup) args[2].reply_markup = tinyCapsMarkup(args[2].reply_markup);
      }
      return args;
    });
    wrap("sendDocument", (args) => {
      if (typeof args[2] === "object" && args[2]) {
        args[2] = { ...args[2] };
        if (typeof args[2].caption === "string") args[2].caption = tinyCaps(args[2].caption);
        if (args[2].reply_markup) args[2].reply_markup = tinyCapsMarkup(args[2].reply_markup);
      }
      return args;
    });
    wrap("sendAnimation", (args) => {
      if (typeof args[2] === "object" && args[2]) {
        args[2] = { ...args[2] };
        if (typeof args[2].caption === "string") args[2].caption = tinyCaps(args[2].caption);
        if (args[2].reply_markup) args[2].reply_markup = tinyCapsMarkup(args[2].reply_markup);
      }
      return args;
    });
    wrap("answerCallbackQuery", (args) => {
      if (args[1] && typeof args[1] === "object" && typeof args[1].text === "string") {
        args[1] = { ...args[1], text: tinyCaps(args[1].text) };
      }
      return args;
    });
    bot.__ariaTinyCapsPatched = true;
  }
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



const fs = require("fs");
const os = require("os");
const path = require("path");
const PROJECT_ROOT = path.resolve(__dirname, "..");
const MENU_IMAGE_URL = "https://files.catbox.moe/hjdxgx.jpg";
const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const { pipeline } = require("stream/promises");


const TelegramBot = require("node-telegram-bot-api");
const OpenAI = require("openai");
const sharp = require("sharp");
const stickerRecognitionService =
require("../services/stickerRecognitionService");
const gameManager = require("../games/gameLoader");
const downloadService = require("../services/downloadService");
const { searchTrack } = require("../services/musicService");
const codeAssistant = require("../services/codeAssistant");
const { generateTalkingVideoNote } = require("../services/talkingAvatar");
const socialDownloader = require("../services/socialDownloader");
const statsTracker = require("../services/statsTracker");
const ariaPreferences = require("../services/ariaPreferences");
const { generateInfoCard } = require("../utils/infoCard");
const { formatAiReplyForTelegram } = require("../utils/telegramRichText");
const { detectNaturalImageRequest, isNaturalImageQuestion, generateImage: generateNaturalImage } = require("../services/imageGenerator");
const { detectIntent, progressBar, withRetry, isRecoverableTelegramError } = require("../services/smartAssistant");
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
const PersistentUserHistory = require("../memory/userHistoryStore");
const userHistory = new PersistentUserHistory();

function gracefulShutdown(signal) {
    console.log(`${signal} received — flushing user memory to disk before exit...`);
    try { userHistory.flushSync(); } catch (err) { console.error("flushSync failed:", err.message); }
    process.exit(0);
}
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
const PHOTOS_DIR = path.join(PROJECT_ROOT, "photos");

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


const DATA_DIR = path.join(PROJECT_ROOT, "data");
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


// ============================================================
// USAGE ANALYTICS — lightweight, self-contained, never blocks
// ============================================================






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

const EMAIL_USER = String(process.env.EMAIL_USER || process.env.GMAIL_USER || "").trim();
const EMAIL_PASS = String(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || "").trim();

const smtpOptions = {
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    tls: { minVersion: "TLSv1.2", servername: "smtp.gmail.com" }
};

// Gmail supports both STARTTLS (587) and implicit TLS (465). Some hosting
// networks are more reliable with one route than the other, so verification
// email sending can fall back to the second transport on connection errors.
const transporter = nodemailer.createTransport({
    ...smtpOptions,
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true
});
const transporter465 = nodemailer.createTransport({
    ...smtpOptions,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    requireTLS: false
});

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ Gmail verification is not configured. Set EMAIL_USER and EMAIL_PASS in Render Environment Variables.");
} else {
    transporter.verify()
        .then(() => console.log(`📧 Gmail SMTP ready for ${EMAIL_USER}`))
        .catch(err => console.error("❌ Gmail SMTP connection failed:", err.message));
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
            console.error(`[EMAIL] Gmail SMTP 587 failed: ${firstError?.code || 'UNKNOWN'} ${firstError?.message || firstError}`);
            // Only fall back when the first SMTP route failed. Authentication
            // errors are also logged clearly; the second route may still work
            // with the same App Password.
            info = await transporter465.sendMail(mail);
            console.log('[EMAIL] Gmail SMTP 465 fallback succeeded.');
        }

        console.log(`✅ Verification email accepted by SMTP for ${email} (${info?.messageId || 'no-message-id'})`);

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

    // V12: use the user's selected AI mode when the caller did not
    // explicitly choose a category. This keeps mode selection persistent
    // without breaking existing handlers.
    if (!category && userId) {
        const selectedMode = ariaPreferences.getMode(userId);
        if (selectedMode !== "chat") {
            category = selectedMode;
        } else {
            // V12 automatic mode detection for ordinary chat.
            const text = String(userMessage || "").toLowerCase();
            if (/\b(debug|bug|error|javascript|typescript|python|node\.js|react|next\.js|sql|api|code|coding|function|class|regex|stack trace)\b/.test(text)) category = "coding";
            else if (/\b(research|research this|sources|cite|latest|current|compare|investigate|evidence|study)\b/.test(text)) category = "research";
            else if (/\b(explain like|teach me|lesson|quiz me|learn|tutorial|homework|study help)\b/.test(text)) category = "tutor";
            else if (/\b(write a story|poem|lyrics|caption|slogan|creative|character|script|brainstorm)\b/.test(text)) category = "creative";
        }
    }

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


/* ---- /ban ---- */


/* ---- /unban ---- */

// npm install play-dl for your downloader, if you use and external API key a o need to install any downloader packages cuz they’re unreliable .

const play = require('play-dl');
const { getAudioDurationSeconds } = require('../utils/audioDuration');

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

/* ---- /mute [1h/30m/2d] ---- */


/* ---- /unmute ---- */




/* ---- /warn ---- */


/* ---- /unwarn ---- */


/* ---- /warns ---- */


// ============================================================
// /play2 - YouTube MP4 Downloader
// ============================================================

const APIFY_TOKEN = process.env.APIFY_TOKEN || "apify_api_OoonMeQLK7EU8G7eZR496Ab9dtAGd60tfh11";
const ACTOR_ID = process.env.ACTOR_ID || "ZSKNl5eniyeAPcPkf";



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

        
/* ---- /promote ---- */


/* ---- /demote ---- */


// --- temp-admin tracking: chatId:userId -> timeout handle ---
const tempAdminTimers = new Map();

/* ---- /tempadmin @user 5m ---- */


/* ---- /adminlist ---- */


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
  const premium = isPremiumActive(userId);
  const plan = premium ? "⭐ ᴘʀᴇᴍɪᴜᴍ" : "🆓 ғʀᴇᴇ";
  const version = process.env.BOT_VERSION || "V11.0.0";
  const host = process.env.RENDER || process.env.RENDER_SERVICE_NAME ? "RENDER" : (process.env.HOST_NAME || "SERVER");
  return [
    "<blockquote expandable='true'>",
    "🌸 <b>ᴍɪss ᴀʀɪᴀ</b> 🌸",
    "<i>ʏᴏᴜʀ ᴘᴇʀsᴏɴᴀʟ ᴀɪ ᴄᴏᴘɪʟᴏᴛ</i>",
    "",
    "🍫 <b>ᴀʀɪᴀ ᴀɪ</b> — <b>ᴘᴇʀsᴏɴᴀʟ ᴀssɪsᴛᴀɴᴛ</b>",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `👑 <b>ʙᴏᴛ:</b> ᴍɪss ᴀʀɪᴀ`,
    `📦 <b>ᴠᴇʀsɪᴏɴ:</b> ${version}`,
    `🌐 <b>ʜᴏsᴛ:</b> ${host}` ,
    `💎 <b>ᴘʟᴀɴ:</b> ${plan}`,
    "",
    "• 💬 ᴄʜᴀᴛ & ᴄᴏɴᴠᴇʀsᴀᴛɪᴏɴ",
    "• 🧠 ᴀɪ ᴀɢᴇɴᴛ & ᴍᴇᴍᴏʀʏ",
    "• 💻 ᴄᴏᴅᴇ & ᴅᴇᴠᴇʟᴏᴘᴍᴇɴᴛ",
    "• 🎨 ɪᴍᴀɢᴇs • 🎵 ᴍᴜsɪᴄ • 🎬 ᴍᴏᴠɪᴇs",
    "",
    "🧠 <i>ɪ ᴄᴀɴ ᴄᴏɴᴛʀᴏʟ ᴛᴇʟᴇɢʀᴀᴍ ɢʀᴏᴜᴘs, ᴍᴏᴅᴇʀᴀᴛɪᴏɴ, ᴍᴇssᴀɢᴇs, ᴛᴀsᴋs, ᴀᴜᴛᴏ-ᴍᴏᴅ, ᴀɴᴀʟʏᴛɪᴄs, sᴇᴄᴜʀɪᴛʏ, ʙᴀᴄᴋᴜᴘs ᴀɴᴅ ᴍᴇᴍᴏʀʏ. ᴛʀʏ <code>Aria, help</code>.</i>",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "🌸 <i>sᴇʟᴇᴄᴛ ᴀɴ ᴏᴘᴛɪᴏɴ ʙᴇʟᴏᴡ ᴛᴏ ᴄᴏɴᴛɪɴᴜᴇ.</i>",
    "</blockquote>"
  ].join("\n");
}
function mainMenuKeyboard(userId, page = 1) {
  const premium = isPremiumActive(userId);

  const all = [
    { text: "💬 ᴄʜᴀᴛ", callback_data: "v10_chat", style: "success" },
    { text: "👤 ᴘʀᴏғɪʟᴇ", callback_data: "v10_profile", style: "primary" },
    {
      text: premium ? "⭐ ᴘʀᴇᴍɪᴜᴍ ᴏɴ" : "⭐ ᴘʀᴇᴍɪᴜᴍ",
      callback_data: "menu_premium",
      style: "danger"
    },
    { text: "🧠 ᴀɪ ᴀɢᴇɴᴛ", callback_data: "v10_agent", style: "success" },
    { text: "💻 ᴄᴏᴅᴇ sᴛᴜᴅɪᴏ", callback_data: "v10_coding", style: "primary" },
    { text: "🎨 ɪᴍᴀɢᴇ ɢᴇɴ", callback_data: "v10_image", style: "success" },
    { text: "🎬 ᴍᴏᴠɪᴇs", callback_data: "v10_movies", style: "primary" },
    { text: "🎵 ᴍᴜsɪᴄ", callback_data: "v10_music", style: "success" },
    { text: "🌸 ᴀʀɪᴀ ʜᴜʙ", callback_data: "open_media_hub", style: "success" },
    { text: "🔎 ʀᴇsᴇᴀʀᴄʜ", callback_data: "v10_research", style: "primary" },
    { text: "📁 ғɪʟᴇs", callback_data: "v10_files", style: "primary" },
    { text: "🌐 ʙʀᴏᴡsᴇʀ", callback_data: "v10_browser", style: "success" },
    { text: "🎙️ ᴠᴏɪᴄᴇ", callback_data: "v10_voice", style: "primary" },
    { text: "📚 sᴋɪʟʟs", callback_data: "v10_skills", style: "primary" },
    { text: "⏰ ᴀᴜᴛᴏ", callback_data: "v10_jobs", style: "success" },
    { text: "🕘 ʜɪsᴛᴏʀʏ", callback_data: "v10_history", style: "primary" },
    { text: "🧰 ᴀɪ ᴛᴏᴏʟs", callback_data: "v10_tools", style: "primary" },
    { text: "⚙️ sᴇᴛᴛɪɴɢs", callback_data: "menu_settings", style: "success" },
    { text: "🎮 ɢᴀᴍᴇs", callback_data: "menu_games", style: "primary" },
    { text: "⬇️ ᴅᴏᴡɴʟᴏᴀᴅs", callback_data: "menu_downloaders", style: "primary" },
    { text: "🔒 ᴘʀᴏᴛᴇᴄᴛɪᴏɴ", callback_data: "menu_protection", style: "success" },
    { text: "🏆 ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ", callback_data: "menu_leaderboard", style: "primary" },
    { text: "❓ ʜᴇʟᴘ", callback_data: "menu_help", style: "success" },
    { text: "⭐ sᴜᴘᴘᴏʀᴛ", url: SUPPORT_CHANNEL, style: "danger" },
    { text: "👤 ᴅᴇᴠ", url: DEVELOPER_LINK, style: "danger" }
  ];

  // Add to group
  if (TELEGRAM_BOT_USERNAME) {
    all.splice(15, 0, {
      text: "🚀 ᴀᴅᴅ ᴛᴏ ɢʀᴏᴜᴘ",
      url: `https://t.me/${TELEGRAM_BOT_USERNAME}?startgroup=true`,
      style: "success"
    });
  }

  // Admin panel
  if (isBotAdmin(userId)) {
    all.push({
      text: "👑 ᴀᴅᴍɪɴ",
      callback_data: "menu_admin",
      style: "primary"
    });
  }

  // 4 buttons per page
  // 2 buttons per row
  const pageSize = 4;

  const totalPages = Math.max(
    1,
    Math.ceil(all.length / pageSize)
  );

  const safePage = Math.min(
    Math.max(Number(page) || 1, 1),
    totalPages
  );

  const start = (safePage - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  const rows = [];

  // 2 buttons per row
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  // Navigation row
  if (totalPages > 1) {
    const navigation = [];

    if (safePage > 1) {
      navigation.push({
        text: "‹ ᴘʀᴇᴠ",
        callback_data: `menu_page_${safePage - 1}`,
        style: "primary"
      });
    }

    navigation.push({
      text: `🌸 ${safePage}/${totalPages}`,
      callback_data: "menu_page_info",
      style: "primary"
    });

    if (safePage < totalPages) {
      navigation.push({
        text: "ɴᴇxᴛ ›",
        callback_data: `menu_page_${safePage + 1}`,
        style: "success"
      });
    }

    rows.push(navigation);
  }

  return {
    inline_keyboard: rows
  };
}

function mainMenuPageText(userId, page = 1) {
  const base = mainMenuText(userId);

  return `${base}

<blockquote>🌸 <b>ᴘᴀɢᴇ ${page}</b></blockquote>`;
}

/**
 * ============================================================
 * MISS ARIA — INLINE MAIN MENU CALLBACK BRIDGE
 * ============================================================
 *
 * IMPORTANT:
 * - Inline menus MUST use query.inline_message_id
 * - Never call sendMainMenu() for an inline callback
 * - Never send the inline menu to the user's DM
 * - Pagination edits the existing inline message
 * ============================================================
 */

function registerInlineMainMenuCallbacks() {
  if (bot.__ariaInlineMainMenuCallbacksRegistered) {
    return;
  }

  bot.__ariaInlineMainMenuCallbacksRegistered = true;

  bot.on("callback_query", async (query) => {
    /*
     * Only handle callbacks belonging to inline messages.
     *
     * Normal Telegram messages have:
     *   query.message
     *
     * Inline messages have:
     *   query.inline_message_id
     */
    if (!query?.inline_message_id) {
      return;
    }

    /*
     * Prevent this bridge from processing a synthetic callback
     * that may be emitted elsewhere in the runtime.
     */
    if (query.__ariaInlineSynthetic) {
      return;
    }

    const data = String(query?.data || "").trim();

    if (!data) {
      return;
    }

    const userId = Number(query?.from?.id);

    if (!userId) {
      return;
    }

    const inlineMessageId = query.inline_message_id;

    /*
     * ==========================================================
     * HELPER — EDIT THE CURRENT INLINE MESSAGE
     * ==========================================================
     */
    const editInlineMenu = async (page = 1) => {
      const safePage = Math.max(Number(page) || 1, 1);

      const text = mainMenuPageText(
        userId,
        safePage
      );

      const keyboard = mainMenuKeyboard(
        userId,
        safePage
      );

      await bot.editMessageText(text, {
        inline_message_id: inlineMessageId,
        parse_mode: "HTML",
        reply_markup: keyboard
      });
    };

    /*
     * ==========================================================
     * PAGE NAVIGATION
     * ==========================================================
     */

    const pageMatch = data.match(/^menu_page_(\d+)$/);

    if (pageMatch) {
      const requestedPage = Number(pageMatch[1]) || 1;

      try {
        await editInlineMenu(requestedPage);

        await bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(
          "[ARIA INLINE MENU PAGE ERROR]",
          err?.stack || err
        );

        try {
          await bot.answerCallbackQuery(query.id, {
            text: "❌ ᴄᴏᴜʟᴅɴ'ᴛ ᴄʜᴀɴɢᴇ ᴛʜᴇ ᴘᴀɢᴇ.",
            show_alert: false
          });
        } catch {}
      }

      return;
    }

    /*
     * ==========================================================
     * PAGE INFO
     * ==========================================================
     */

    if (data === "menu_page_info") {
      try {
        await bot.answerCallbackQuery(query.id, {
          text: "🌸 ᴜsᴇ ‹ ᴘʀᴇᴠ ᴏʀ ɴᴇxᴛ › ᴛᴏ ɴᴀᴠɪɢᴀᴛᴇ.",
          show_alert: false
        });
      } catch {}

      return;
    }

    /*
     * ==========================================================
     * MAIN MENU BUTTON
     * ==========================================================
     *
     * IMPORTANT:
     *
     * DO NOT DO THIS:
     *
     * sendMainMenu(userId, userId, 1)
     *
     * That sends a new message to the user's DM.
     *
     * Instead, edit the current inline message.
     */

    if (data === "main_menu") {
      try {
        await editInlineMenu(1);

        await bot.answerCallbackQuery(query.id);
      } catch (err) {
        console.error(
          "[ARIA INLINE MAIN MENU ERROR]",
          err?.stack || err
        );

        try {
          await bot.answerCallbackQuery(query.id, {
            text: "❌ ᴄᴏᴜʟᴅɴ'ᴛ ᴏᴘᴇɴ ᴛʜᴇ ᴍᴇɴᴜ.",
            show_alert: false
          });
        } catch {}
      }

      return;
    }

    /*
     * ==========================================================
     * MAIN MENU CALLBACKS
     * ==========================================================
     *
     * These are the callback_data values used by
     * mainMenuKeyboard().
     */

    const mainMenuCallbacks = new Set([
      "v10_chat",
      "v10_profile",
      "menu_premium",
      "v10_agent",
      "v10_coding",
      "v10_image",
      "v10_movies",
      "v10_music",
      "open_media_hub",
      "v10_research",
      "v10_files",
      "v10_browser",
      "v10_voice",
      "v10_skills",
      "v10_jobs",
      "v10_history",
      "v10_tools",
      "menu_settings",
      "menu_games",
      "menu_downloaders",
      "menu_protection",
      "menu_leaderboard",
      "menu_help",
      "menu_admin"
    ]);

    if (!mainMenuCallbacks.has(data)) {
      return;
    }

    /*
     * ==========================================================
     * IMPORTANT
     * ==========================================================
     *
     * Do NOT sendMainMenu() here.
     *
     * Do NOT send a DM.
     *
     * We acknowledge the callback first.
     */
    try {
      await bot.answerCallbackQuery(query.id);
    } catch {}

    /*
     * Some of the existing normal-message callback handlers
     * expect query.message to exist.
     *
     * We provide a safe synthetic message context so those
     * handlers can identify the clicking user.
     *
     * The bridge itself NEVER sends the main menu to this
     * synthetic chat.
     */

    const syntheticQuery = {
      ...query,

      __ariaInlineSynthetic: true,
      __ariaInlineMessageId: inlineMessageId,

      message: {
        message_id: 0,

        chat: {
          id: userId,
          type: "private"
        },

        from: {
          id: userId,
          is_bot: false,
          first_name:
            query?.from?.first_name || "User",
          last_name:
            query?.from?.last_name,
          username:
            query?.from?.username
        },

        text: ""
      }
    };

    /*
     * Pass the callback to the existing callback handlers.
     *
     * The inline bridge itself does not create a DM.
     */
    try {
      bot.emit(
        "callback_query",
        syntheticQuery
      );
    } catch (err) {
      console.error(
        "[ARIA INLINE CALLBACK ROUTER ERROR]",
        err?.stack || err
      );
    }
  });
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
  const host = process.env.RENDER ? "ʀᴇɴᴅᴇʀ" : (process.env.RAILWAY_ENVIRONMENT ? "ʀᴀɪʟᴡᴀʏ" : "ʟᴏᴄᴀʟ");
  return [
    "<blockquote expandable='true'>",
    "👑 <b>ᴍɪss ᴀʀɪᴀ — ᴀᴅᴍɪɴ</b>",
    "━━━━━━━━━━━━━━━━━━",
    "👑 <b>ʙᴏᴛ</b>                 ᴍɪss ᴀʀɪᴀ",
    `📦 <b>ᴠᴇʀsɪᴏɴ</b>            ${BOT_VERSION}`,
    `🌐 <b>ʜᴏsᴛ</b>                ${host}`,
    "━━━━━━━━━━━━━━━━━━",
    "• ᴠɪᴇᴡ ᴀʟʟ sᴇssɪᴏɴs",
    "• sᴇssɪᴏɴ ᴍᴀɴᴀɢᴇʀ",
    "• ʙʀᴏᴀᴅᴄᴀsᴛ",
    "• sʏsᴛᴇᴍ sᴛᴀᴛs",
    "━━━━━━━━━━━━━━━━━━",
    "👑 <b>ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ</b>",
    "</blockquote>"
  ].join("\n");
}
function adminPanelKeyboard() {
  return { inline_keyboard: [
    [
      { text: "👥 ᴜsᴇʀs", callback_data: "v10_admin_users", style: "primary" },
      { text: "📊 sᴛᴀᴛɪsᴛɪᴄs", callback_data: "v10_admin_stats", style: "success" },
      { text: "📢 ʙʀᴏᴀᴅᴄᴀsᴛ", callback_data: "admin_broadcast", style: "primary" },
    ],
    [
      { text: "👥 sᴇssɪᴏɴs", callback_data: "admin_sessions", style: "primary" },
      { text: "📝 ᴀᴜᴅɪᴛ ʟᴏɢs", callback_data: "v10_admin_logs", style: "primary" },
      { text: "🛡️ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ", callback_data: "admin_moderation", style: "success" },
    ],
    [
      { text: "⚙️ sʏsᴛᴇᴍ", callback_data: "v10_admin_system", style: "primary" },
      { text: "⭐ ᴘʀᴇᴍɪᴜᴍ", callback_data: "menu_premium", style: "danger" },
      { text: "ɴᴇxᴛ ›", callback_data: "admin_page2", style: "success" },
    ]
  ]};
}
function adminPanelKeyboard2() {
  return { inline_keyboard: [
    [
      { text: "👑 ᴀᴅᴍɪɴs", callback_data: "v10_admin_admins", style: "primary" },
      { text: "🚫 ʙᴀɴ / ᴜɴʙᴀɴ", callback_data: "v10_admin_ban", style: "danger" },
      { text: "🔇 ᴍᴜᴛᴇ / ᴜɴᴍᴜᴛᴇ", callback_data: "v10_admin_mute", style: "primary" },
    ],
    [
      { text: "🔧 ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ", callback_data: "admin_maintenance", style: "danger" },
      { text: "💾 ʙᴀᴄᴋᴜᴘ", callback_data: "v10_admin_backup", style: "primary" },
      { text: "🧹 ᴄʟᴇᴀʀ ᴄᴀᴄʜᴇ", callback_data: "v10_admin_cache", style: "primary" },
    ],
    [
      { text: "📋 ᴜsᴇʀ ʟᴏɢs", callback_data: "v10_admin_users", style: "primary" },
      { text: "🔐 ᴀᴜᴅɪᴛ", callback_data: "v10_admin_logs", style: "success" },
      { text: "ɴᴇxᴛ ›", callback_data: "admin_page3", style: "success" },
    ],
    [{ text: "‹ ʙᴀᴄᴋ", callback_data: "admin_panel", style: "primary" }]
  ]};
}
function adminPanelKeyboard3() {
  return { inline_keyboard: [
    [
      { text: "🤖 ᴀɪ / ᴘʀᴏᴠɪᴅᴇʀs", callback_data: "v10_admin_ai", style: "success" },
      { text: "💻 ᴄᴏᴅɪɴɢ ᴜsᴀɢᴇ", callback_data: "v10_admin_coding", style: "primary" },
      { text: "⏰ ᴊᴏʙs", callback_data: "v10_admin_jobs", style: "primary" },
    ],
    [
      { text: "🔌 ɪɴᴛᴇɢʀᴀᴛɪᴏɴs", callback_data: "v10_admin_integrations", style: "primary" },
      { text: "🧠 ᴍᴇᴍᴏʀʏ", callback_data: "v10_admin_memory", style: "primary" },
      { text: "🔄 ʀᴇsᴛᴀʀᴛ", callback_data: "v10_admin_restart", style: "danger" },
    ],
    [
      { text: "‹ ʙᴀᴄᴋ", callback_data: "admin_page2", style: "primary" },
      { text: "❓ ʜᴇʟᴘ", callback_data: "menu_help", style: "success" },
      { text: "🏠 ᴍᴀɪɴ", callback_data: "menu_back", style: "success" },
    ]
  ]};
}
async function showAdminPanel(chatId, messageId, userId) {
  const opts={chat_id:chatId,message_id:messageId,parse_mode:"HTML",reply_markup:adminPanelKeyboard()};
  try { await bot.editMessageCaption(adminPanelText(userId),opts); } catch { try { await bot.editMessageText(adminPanelText(userId),opts); } catch { await bot.sendMessage(chatId,adminPanelText(userId),{parse_mode:"HTML",reply_markup:adminPanelKeyboard()}); } }
}
async function showAdminPanel2(chatId, messageId, userId) {
  const opts={chat_id:chatId,message_id:messageId,parse_mode:"HTML",reply_markup:adminPanelKeyboard2()};
  try { await bot.editMessageCaption(adminPanelText(userId),opts); } catch { try { await bot.editMessageText(adminPanelText(userId),opts); } catch { await bot.sendMessage(chatId,adminPanelText(userId),{parse_mode:"HTML",reply_markup:adminPanelKeyboard2()}); } }
}
async function showAdminPanel3(chatId, messageId, userId) {
  const opts={chat_id:chatId,message_id:messageId,parse_mode:"HTML",reply_markup:adminPanelKeyboard3()};
  try { await bot.editMessageCaption(adminPanelText(userId),opts); } catch { try { await bot.editMessageText(adminPanelText(userId),opts); } catch { await bot.sendMessage(chatId,adminPanelText(userId),{parse_mode:"HTML",reply_markup:adminPanelKeyboard3()}); } }
}
            function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function editToMainMenu(query) {
  const menuPath = path.join(PROJECT_ROOT, "menu.jpg");
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
        caption: mainMenuPageText(query.from.id, 1),
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
async function sendMainMenu(chatId, userId, page = 1, replyTo) {
  const caption = mainMenuPageText(userId, page);
  const options = {
    caption,
    parse_mode: "HTML",
    reply_markup: mainMenuKeyboard(userId, page),
  };
  if (replyTo) options.reply_to_message_id = replyTo;
  try {
    await bot.sendPhoto(chatId, MENU_IMAGE_URL, options);
  } catch (err) {
    console.error("[ARIA MENU] photo send failed:", err.message);
    await bot.sendMessage(chatId, caption, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(userId, page),
      ...(replyTo ? { reply_to_message_id: replyTo } : {})
    });
  }
}

/* ============================================================
 * /start — mark reachable, gate on force-join, show the menu
 * ============================================================ */





/* ============================================================
 * ✨ SMART NATURAL AI UX
 * Adds helpful natural-language shortcuts without replacing the
 * existing command system. Image/broadcast requests are left for
 * their dedicated handlers below.
 * ============================================================ */


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


/* ============================================================
 * 📢 NATURAL-LANGUAGE BROADCAST STARTER
 * Admins can say "broadcast this" instead of remembering /broadcast.
 * The existing preview + confirmation system is still used.
 * ============================================================ */



// ==========================================
// VERIFY EMAIL CODE
// ==========================================




// ==========================================
// SET PASSWORD (final step of signup, right after email verification)
// ==========================================




// ==========================================
// RESTART VERIFICATION
// ==========================================


// ==========================================
// RESEND VERIFICATION CODE
// ==========================================





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
    // Chat with Aria is available immediately; no signup wall.
    return true;
}

// Image generation is available to every Telegram user.
// Miss Aria no longer requires signup for free or premium users.
function canGenerateImages(userId) {
    return true;
}

async function sendImageSignupGate(chatId, replyToMessageId) {
    // Signup has been permanently removed from the Telegram user flow.
    // Kept only for backward compatibility with older handler references.
    return;
}

// Sends the "please sign up (or skip)" prompt. Returns nothing; caller
// should `return` right after calling this so the AI never runs.
async function sendSignupGate(chatId, replyToMessageId) {
    // Signup has been permanently removed from the Telegram user flow.
    // Kept only for backward compatibility with older handler references.
    return;
}


const bcrypt = require("bcryptjs");




/* ============================================================
 * "/" alone — quick menu trigger, works in groups and DMs.
 * ============================================================ */


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


/* ============================================================
 * Admin-only slash commands — each also works as a button flow
 * via the Admin Panel. An inline argument (e.g. /addprem 12345)
 * applies immediately; with no argument it starts the guided
 * forward/@username flow.
 * ============================================================ */



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




/* ============================================================
 * /setpersona — premium (or bot-admin) group admins can replace
 * Miss Aria's default personality with their own system prompt
 * for that specific group. /setpersona reset clears it.
 * ============================================================ */


/* ============================================================
 * /exportlogs — premium (or bot-admin) group admins can export this
 * group's moderation history (ban/mute/warn) as a downloadable file.
 * ============================================================ */


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



// NOTE: the old aura/shards /daily handler that used to live here was
// replaced by the cash-economy /daily in wallet.js (wallet + bank + streak
// bonus), so it's removed to avoid double replies to the same command.



/* ============================================================
 * Callback queries — force-join verification + all menu buttons
 * ============================================================ */

/* ============================================================
 * Bot's own membership changes — auto-lock the current chat photo
 * the moment we're promoted to admin somewhere, no manual step needed.
 * ============================================================ */


/* ============================================================
 * New joins — Anti-Raid (mass-join detection), CAPTCHA on Join,
 * and Anti-Bio-Link, each opt-in and per-chat via ⚙️ Settings.
 * ============================================================ */





// ====================================================
// ESCAPE HTML
// ====================================================

// Telegram REQUIRES an answer to pre_checkout_query within 10 seconds or
// the payment is automatically cancelled on the user's end. This was
// missing, which meant the /premium invoice above could never actually
// complete a purchase.




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




/*
|--------------------------------------------------------------------------
| REPORT CONVERSATION
|--------------------------------------------------------------------------
*/




/*
|--------------------------------------------------------------------------
| CALLBACK HANDLER
|--------------------------------------------------------------------------
*/




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







// ============================================================
// /anime Command
// ============================================================



    


const animeSessions = new Map();





// Regenerate





/* ============================================================
 * Main message handler:
 *  - private chat + pending menu flow -> handle add-chat / promote-user
 *  - group message -> force-join gate, then image moderation
 * ============================================================ */

  


/* ============================================================
 * Channels: profile-photo lock + banned-image/rule checks on
 * posts, since channels don't go through the "message" event.
 * ============================================================ */
/* ============================================================
 * Channels: profile-photo lock + banned-image/rule checks on
 * posts, since channels don't go through the "message" event.
 * ============================================================ */
const channelPosts = new Map();


/* ============================================================
 * Edited posts/messages — deleted automatically when Edit Lock
 * is on, since edits after publishing aren't allowed by policy.
 * ============================================================ */
// Store original content






// ============================================================
// DOWNLOAD SYSTEM — /download (saved data exports)
// ============================================================


// ============================================================
// SOCIAL MEDIA DOWNLOADER — /media
// ============================================================

// ============================================================
// CODE ASSISTANT — "code a website for me" style requests
// ============================================================







/*
 * ============================================================
 * REGISTER INLINE MAIN MENU CALLBACKS
 * ============================================================
 */

registerInlineMainMenuCallbacks();

return {
  bot,
  
    // --- shared helpers used by the handler packs (handlers/*.js) ---
    formatAiReplyForTelegram: formatAiReplyForTelegram,
    generateInfoCard: generateInfoCard,
    detectIntent: detectIntent,
    progressBar: progressBar,
    withRetry: withRetry,
    isRecoverableTelegramError: isRecoverableTelegramError,
    isNaturalImageQuestion: isNaturalImageQuestion,
    detectNaturalImageRequest: detectNaturalImageRequest,
    generateNaturalImage: generateNaturalImage,
    ACTOR_ID: ACTOR_ID,
    AIART_API_URL: AIART_API_URL,
    AI_MODELS: AI_MODELS,
    ANILIST_QUERY: ANILIST_QUERY,
    APIFY_TOKEN: APIFY_TOKEN,
    BOT_TOKEN: BOT_TOKEN,
    AGENT_WORKSPACE: process.env.ARIA_AGENT_WORKSPACE || PROJECT_ROOT,
    agentPolicy: { allowLocalTools: String(process.env.ARIA_AGENT_LOCAL_TOOLS || "false").toLowerCase() === "true",
    allowAdvancedIntegrations: String(process.env.ARIA_AGENT_ADVANCED_INTEGRATIONS || "false").toLowerCase() === "true" },
    BOT_VERSION: BOT_VERSION,
    BRAND_NAME: BRAND_NAME,
    CAPTCHA_TIMEOUT_MS: CAPTCHA_TIMEOUT_MS,
    CHARART_API_URL: CHARART_API_URL,
    COPILOT_API_URL: COPILOT_API_URL,
    DATA_DIR: DATA_DIR,
    DATA_FILE: DATA_FILE,
    DEEPSEEK_API_KEY: DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: DEEPSEEK_API_URL,
    DEVELOPER_LINK: DEVELOPER_LINK,
    EMAIL_PASS: EMAIL_PASS,
    EMAIL_USER: EMAIL_USER,
    FLOOD_LIMIT: FLOOD_LIMIT,
    FLOOD_MUTE_MS: FLOOD_MUTE_MS,
    FLOOD_WINDOW_MS: FLOOD_WINDOW_MS,
    FORCE_JOIN_CHANNELS: FORCE_JOIN_CHANNELS,
    FORCE_JOIN_EXEMPT_ADMINS: FORCE_JOIN_EXEMPT_ADMINS,
    GOOGLE_SAFE_BROWSING_API_KEY: GOOGLE_SAFE_BROWSING_API_KEY,
    GPT5_API_URL: GPT5_API_URL,
    GPTLOGIC_API_URL: GPTLOGIC_API_URL,
    HCN_API_KEY: HCN_API_KEY,
    IMAGE_HASH_MATCH_THRESHOLD: IMAGE_HASH_MATCH_THRESHOLD,
    JOIN_RAID_COUNT: JOIN_RAID_COUNT,
    JOIN_RAID_MUTE_MS: JOIN_RAID_MUTE_MS,
    JOIN_RAID_WINDOW_MS: JOIN_RAID_WINDOW_MS,
    MAINTENANCE_MSG: MAINTENANCE_MSG,
    MODEL_CHAINS: MODEL_CHAINS,
    MODERATION_MODEL: MODERATION_MODEL,
    NOT_ADMIN_MSG: NOT_ADMIN_MSG,
    OFFICIAL_EMAIL_REGEX: OFFICIAL_EMAIL_REGEX,
    OFFICIAL_TELEGRAM_PAGES: OFFICIAL_TELEGRAM_PAGES,
    OPENROUTER_API_KEY: OPENROUTER_API_KEY,
    OWNER_ID: OWNER_ID,
    OWNER_USERNAME: OWNER_USERNAME,
    OpenAI: OpenAI,
    PHOTOS_DIR: PHOTOS_DIR,
    PROJECT_ROOT: PROJECT_ROOT,
    PROMPT_TO_CODE_API: PROMPT_TO_CODE_API,
    PersistentUserHistory: PersistentUserHistory,
    SEED_ADMIN_IDS: SEED_ADMIN_IDS,
    SIGHTENGINE_API_SECRET: SIGHTENGINE_API_SECRET,
    SIGHTENGINE_API_USER: SIGHTENGINE_API_USER,
    SIGHTENGINE_MODELS: SIGHTENGINE_MODELS,
    SIGHTENGINE_THRESHOLD: SIGHTENGINE_THRESHOLD,
    SLOWMODE_GAP_MS: SLOWMODE_GAP_MS,
    STT_API_URL: STT_API_URL,
    SUPPORT_CHANNEL: SUPPORT_CHANNEL,
    TOKEN: TOKEN,
    TTS_API_URL: TTS_API_URL,
    TelegramBot: TelegramBot,
    URL_REGEX: URL_REGEX,
    USERS_FILE: USERS_FILE,
    WARN_LIMIT: WARN_LIMIT,
    _origProcessUpdate: _origProcessUpdate,
    acquireGenSlot: acquireGenSlot,
    addBannedImage: addBannedImage,
    addBlacklistWord: addBlacklistWord,
    addBotAdmin: addBotAdmin,
    addChat: addChat,
    addRule: addRule,
    adminPanelKeyboard: adminPanelKeyboard,
    adminPanelKeyboard2: adminPanelKeyboard2,
    adminPanelKeyboard3: adminPanelKeyboard3,
    adminPanelText: adminPanelText,
    aiChatSessions: aiChatSessions,
    animeSessions: animeSessions,
    axios: axios,
    backKeyboard: backKeyboard,
    backToAdminKeyboard: backToAdminKeyboard,
    baselinePhotoPath: baselinePhotoPath,
    bcrypt: bcrypt,
    buildAiConfigSystemPrompt: buildAiConfigSystemPrompt,
    buildReport: buildReport,
    canManageAdmins: canManageAdmins,
    canManageChat: canManageChat,
    canUseAi: canUseAi,
    canGenerateImages: canGenerateImages,
    sendImageSignupGate: sendImageSignupGate,
    captureChatPhotoBaseline: captureChatPhotoBaseline,
    channelPosts: channelPosts,
    chatBlacklistKeyboard: chatBlacklistKeyboard,
    chatBlacklistText: chatBlacklistText,
    chatRulesKeyboard: chatRulesKeyboard,
    chatRulesText: chatRulesText,
    chatSettingsKeyboard: chatSettingsKeyboard,
    chatSettingsKeyboard2: chatSettingsKeyboard2,
    chatSettingsText: chatSettingsText,
    chatSettingsText2: chatSettingsText2,
    chatTitleFor: chatTitleFor,
    checkUrlsWithSafeBrowsing: checkUrlsWithSafeBrowsing,
    classifyImage: classifyImage,
    classifyImageCustomRules: classifyImageCustomRules,
    classifyImageSightengine: classifyImageSightengine,
    classifyLinks: classifyLinks,
    classifyText: classifyText,
    clearAnnouncement: clearAnnouncement,
    clearBannedImages: clearBannedImages,
    clearFloodHistory: clearFloodHistory,
    clearOneWarn: clearOneWarn,
    clearPending: clearPending,
    clearRules: clearRules,
    codeAssistant: codeAssistant,
    codePending: codePending,
    computeImageHash: computeImageHash,
    createRuntime: createRuntime,
    deepseek: deepseek,
    detectLanguage: detectLanguage,
    discoverTelegramEmails: discoverTelegramEmails,
    downloadFileToBuffer: downloadFileToBuffer,
    downloadService: downloadService,
    editMessage: editMessage,
    editToMainMenu: editToMainMenu,
    enforceSevereViolation: enforceSevereViolation,
    ensureAdminsSeeded: ensureAdminsSeeded,
    ensureChatStats: ensureChatStats,
    escapeHTML: escapeHTML,
    escapeHtml: escapeHtml,
    extractTelegramLinks: extractTelegramLinks,
    extractUrls: extractUrls,
    fetchPage: fetchPage,
    findUserByEmail: findUserByEmail,
    floodTracker: floodTracker,
    forceJoinKeyboard: forceJoinKeyboard,
    fs: fs,
    gameManager: gameManager,
    geminiSessions: geminiSessions,
    genQueue: genQueue,
    genQueuePosition: genQueuePosition,
    generateCode: generateCode,
    getAnnouncement: getAnnouncement,
    getBannedImages: getBannedImages,
    getBlacklist: getBlacklist,
    getChatFlags: getChatFlags,
    getChatSettings: getChatSettings,
    getCurrentUser: getCurrentUser,
    getMissingChannels: getMissingChannels,
    getOwnerId: getOwnerId,
    getPending: getPending,
    getPlan: getPlan,
    getPremiumExpiry: getPremiumExpiry,
    getRules: getRules,
    getSystemPrompt: getSystemPrompt,
    getUser: getUser,
    getUserProtectedChats: getUserProtectedChats,
    getWarnCount: getWarnCount,
    gracefulShutdown: gracefulShutdown,
    hammingDistance: hammingDistance,
    handleAdminCommand: handleAdminCommand,
    handleChatPhotoChanged: handleChatPhotoChanged,
    handlePremCommand: handlePremCommand,
    hasSkippedSignup: hasSkippedSignup,
    https: https,
    incrementChatFlags: incrementChatFlags,
    isAntiRaidEnabled: isAntiRaidEnabled,
    isBioLinkLockEnabled: isBioLinkLockEnabled,
    isBotAdmin: isBotAdmin,
    isCaptchaEnabled: isCaptchaEnabled,
    isCodingRequest: isCodingRequest,
    isEditLockEnabled: isEditLockEnabled,
    isFloodLockEnabled: isFloodLockEnabled,
    isFlooding: isFlooding,
    isForwardLockEnabled: isForwardLockEnabled,
    isGroupAdmin: isGroupAdmin,
    isGroupChat: isGroupChat,
    isLinkLockEnabled: isLinkLockEnabled,
    isMaintenanceOn: isMaintenanceOn,
    isMemberOf: isMemberOf,
    isNightModeEnabled: isNightModeEnabled,
    isOwner: isOwner,
    isPhotoLockEnabled: isPhotoLockEnabled,
    isPremiumActive: isPremiumActive,
    isQuietHours: isQuietHours,
    isSignedUp: isSignedUp,
    isSlowModeEnabled: isSlowModeEnabled,
    isStickerLockEnabled: isStickerLockEnabled,
    isWarnSystemEnabled: isWarnSystemEnabled,
    joinTracker: joinTracker,
    lastMessageTime: lastMessageTime,
    listAdmins: listAdmins,
    listChats: listChats,
    loadStore: loadStore,
    lockChat: lockChat,
    log: log,
    logModAction: logModAction,
    loginEmailState: loginEmailState,
    loginPasswordState: loginPasswordState,
    mailer: mailer,
    mainMenuKeyboard: mainMenuKeyboard,
    mainMenuPageText: mainMenuPageText,
    mainMenuText: mainMenuText,
    MENU_IMAGE_URL: MENU_IMAGE_URL,
    markStarted: markStarted,
    matchBannedImage: matchBannedImage,
    matchBlacklist: matchBlacklist,
    mediaPending: mediaPending,
    muteUser: muteUser,
    nodemailer: nodemailer,
    os: os,
    parseDuration: parseDuration,
    passwordSetupState: passwordSetupState,
    path: path,
    pendingCaptchas: pendingCaptchas,
    pendingForceJoin: pendingForceJoin,
    photoRevertInProgress: photoRevertInProgress,
    play: play,
    ariaPreferences: ariaPreferences,
    processWithFailover: processWithFailover,
    protectmainkeyboard: protectmainkeyboard,
    pumpGenQueue: pumpGenQueue,
    releaseGenSlot: releaseGenSlot,
    removeBlacklistWordAt: removeBlacklistWordAt,
    removeBotAdmin: removeBotAdmin,
    removeChat: removeChat,
    removeRuleAt: removeRuleAt,
    reportSessions: reportSessions,
    requireGroupAdmin: requireGroupAdmin,
    resolveGroupTarget: resolveGroupTarget,
    resolveTargetFromMessage: resolveTargetFromMessage,
    runAiConfigTurn: runAiConfigTurn,
    saveStore: saveStore,
    saveUsers: saveUsers,
    sendChatSettingsPanel: sendChatSettingsPanel,
    sendMainMenu: sendMainMenu,
    sendRichMessage: sendRichMessage,
    sendSignupGate: sendSignupGate,
    sendTalkingIntro: sendTalkingIntro,
    sendVerificationEmail: sendVerificationEmail,
    setAnnouncement: setAnnouncement,
    setMaintenance: setMaintenance,
    setPending: setPending,
    setPlan: setPlan,
    setPremiumExpiry: setPremiumExpiry,
    sharp: sharp,
    showAdminPanel: showAdminPanel,
    showAdminPanel2: showAdminPanel2,
    showAdminPanel3: showAdminPanel3,
    showChatSettingsPanel: showChatSettingsPanel,
    showChatSettingsPanel2: showChatSettingsPanel2,
    sightengineMaxScore: sightengineMaxScore,
    signupState: signupState,
    sleep: sleep,
    smtpOptions: smtpOptions,
    sniffAudioExt: sniffAudioExt,
    socialDownloader: socialDownloader,
    speechToText: speechToText,
    splitText: splitText,
    state: state,
    statsTracker: statsTracker,
    stickerRecognitionService: stickerRecognitionService,
    tempAdminTimers: tempAdminTimers,
    textToVoice: textToVoice,
    toggleAntiRaid: toggleAntiRaid,
    toggleBioLinkLock: toggleBioLinkLock,
    toggleCaptcha: toggleCaptcha,
    toggleEditLock: toggleEditLock,
    toggleFloodLock: toggleFloodLock,
    toggleForwardLock: toggleForwardLock,
    toggleLinkLock: toggleLinkLock,
    toggleNightMode: toggleNightMode,
    togglePhotoLock: togglePhotoLock,
    toggleSlowMode: toggleSlowMode,
    toggleStickerLock: toggleStickerLock,
    toggleWarnSystem: toggleWarnSystem,
    transporter: transporter,
    transporter465: transporter465,
    tryDemote: tryDemote,
    userHistory: userHistory,
    users: users,
    verificationState: verificationState,
    warnOwner: warnOwner,
    warnUser: warnUser
  };
}

module.exports = { createRuntime };
