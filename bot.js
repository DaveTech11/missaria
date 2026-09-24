/**
 * Miss Aria / TG-Guard bootstrap.
 *
 * Keep this file intentionally small:
 * 1. load configuration
 * 2. create the Telegram client
 * 3. create the application runtime
 * 4. connect services/features
 * 5. register handlers
 * 6. start
 */
require("dotenv").config();

process.on("unhandledRejection", (err) => {
  console.error("[UNHANDLED REJECTION]", err?.stack || err);
});
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err?.stack || err);
});

const TelegramBot = require("node-telegram-bot-api");
const { createRuntime } = require("./core/runtime");
const { connectServices } = require("./connectors");
const { registerHandlers } = require("./handlers");
const { start: startDashboard } = require("./server/ariaDashboard");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

if (!BOT_TOKEN) {
  console.error("FATAL: TELEGRAM_BOT_TOKEN (or BOT_TOKEN) is not set.");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
bot.on("polling_error", (err) => { console.error("[TELEGRAM POLLING ERROR]", err?.code || "", err?.message || err); });
const ctx = createRuntime(bot);

connectServices(ctx);
registerHandlers(ctx);
startDashboard(ctx);

console.log("tg-guard / Miss Aria started.");
console.log("Using model:", ctx.MODERATION_MODEL);
console.log("DeepSeek key loaded:", !!ctx.DEEPSEEK_API_KEY);
console.log("Total games loaded:", ctx.gameManager.getGames().length);

module.exports = { bot, ctx };
