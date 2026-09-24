/**
 * Application connectors.
 * These are intentionally kept out of bot.js so bot.js only boots the app
 * and connects the handler/feature modules.
 */
const premiumify = require("../utils/premiumEmoji").premiumify;

function patchPremiumEmoji(bot) {
  const isHtml = (options) =>
    !!options &&
    typeof options.parse_mode === "string" &&
    options.parse_mode.toLowerCase() === "html";

  const _origSendMessage = bot.sendMessage.bind(bot);
  bot.sendMessage = function (chatId, text, options) {
    if (typeof text === "string" && isHtml(options)) text = premiumify(text);
    return _origSendMessage(chatId, text, options);
  };

  const _origEditMessageText = bot.editMessageText.bind(bot);
  bot.editMessageText = function (text, options) {
    if (typeof text === "string" && isHtml(options)) text = premiumify(text);
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
}

function connectAgent(ctx) {
  try {
    const { createRegistry } = require("../services/telegramToolRegistry");
    const { createAriaAgent } = require("../agent");
    const { createAccessControl } = require("../services/telegramAccessControl");
    const accessControl = typeof createAccessControl === "function" ? createAccessControl({ bot: ctx.bot, state: ctx.state, saveStore: ctx.saveStore }) : null;
    const registry = createRegistry({
      bot: ctx.bot,
      state: ctx.state,
      saveStore: ctx.saveStore,
      ownerId: process.env.OWNER_TELEGRAM_ID || process.env.OWNER_ID || ctx.OWNER_ID,
      knownGroups: async () => ctx.listChats ? ctx.listChats() : [],
      accessControl
    });
    ctx.agentRegistry = registry;
    ctx.agent = createAriaAgent(ctx, registry);
  } catch (err) {
    console.error("[ARIA AGENT] failed to initialize:", err.message);
  }
}

function connectServices(ctx) {
  const {
    bot,
    state,
    saveStore,
    addChat,
    isOwner,
    sleep,
    getUser,
    userHistory,
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
    extractUrls,
    escapeHtml,
    resolveGroupTarget
  } = ctx;

  connectAgent(ctx);

  try {
    require("../server/statusServer").start();
  } catch (err) {
    console.error("statusServer failed to load (continuing without it):", err.message);
  }

  try {
    require("../services/heartbeat").startHeartbeat();
  } catch (err) {
    console.error("heartbeat failed to load (continuing without it):", err.message);
  }

  let TELEGRAM_BOT_USERNAME = String(process.env.TELEGRAM_BOT_USERNAME || "").replace(/^@/, "").trim();
  bot.getMe().then((me) => {
    if (me?.username) TELEGRAM_BOT_USERNAME = me.username;
  }).catch((err) => console.error("[BOT IDENTITY]", err?.message || err));

  const { registerTelegramGroupManager } = require("../services/telegramGroupManager");
  registerTelegramGroupManager({ bot, state, saveStore, addChat });

  const { setup: setupTelegramOwnerCenter } = require("../services/telegramOwnerCenter");
  setupTelegramOwnerCenter({
    bot,
    state,
    saveStore,
    addChat,
    ownerId: String(process.env.OWNER_TELEGRAM_ID || process.env.OWNER_ID || "").trim(),
  });

  const setupSettingsCommand = require("../settings");
  const setupSettingsCallbacks = require("../callbacks/setting");
  setupSettingsCommand(bot);
  setupSettingsCallbacks(bot);

  const registerPlay = require("../commands/play");
  registerPlay(bot);

  // Movie discovery + authorized streaming links.
  require("../commands/movie")(bot);

  // Music search + authorized 30-second previews.
  require("../commands/music")(bot);

  // Text-art / ephoto text-effect image generator (categorized effects + custom id).
  require("../commands/effect")(bot);

  // All-in-one link downloader (TikTok, Facebook, Instagram, X, Pinterest) —
  // auto-detects links pasted anywhere, not just via /aio.
  require("../commands/aio")(bot);

  require("../commands/whatsapp")(bot, { isOwner, state, sleep });

  // Global rich/premium Telegram message patch.
  patchPremiumEmoji(bot);

  // Existing feature modules. They are connectors here because each module
  // owns its own handlers and feature registration.
  require("../features")(bot);
  require("../funcommand")(bot);
  require("../features2")(bot, { getUser, saveStore, userHistory });
  require("../features3")(bot, {
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
  require("../wallet")(bot, { escapeHtml, resolveGroupTarget });
  require("../commands/code")(bot);
  require("../handlers/codeHandler")(bot);
  require("../handlers/tiktokHandler")(bot);
  require("../handlers/09_agent")(ctx);
}

module.exports = { connectServices };
