/**
 * Handler pack 4.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  const { bot, BRAND_NAME, DEVELOPER_LINK, OWNER_ID, SUPPORT_CHANNEL, adminPanelKeyboard, adminPanelText, aiChatSessions, backKeyboard, backToAdminKeyboard, canManageAdmins, canManageChat, chatBlacklistKeyboard, chatBlacklistText, chatRulesKeyboard, chatRulesText, chatTitleFor, clearBannedImages, clearPending, editMessage, editToMainMenu, fs, gameManager, getBannedImages, getChatFlags, getChatSettings, getMissingChannels, getPending, getPlan, getUserProtectedChats, handleAdminCommand, handlePremCommand, https, isBotAdmin, isMaintenanceOn, isOwner, isPremiumActive, listAdmins, listChats, log, mainMenuKeyboard, mainMenuText, markStarted, path, pendingCaptchas, play, protectmainkeyboard, removeBlacklistWordAt, removeBotAdmin, removeChat, removeRuleAt, requireGroupAdmin, saveStore, sendMainMenu, sendRichMessage, setMaintenance, setPending, showAdminPanel, showAdminPanel2, showAdminPanel3, mainMenuPageText, showChatSettingsPanel, showChatSettingsPanel2, sleep, state, toggleAntiRaid, toggleBioLinkLock, toggleCaptcha, toggleEditLock, toggleFloodLock, toggleForwardLock, toggleLinkLock, toggleNightMode, togglePhotoLock, toggleSlowMode, toggleStickerLock, toggleWarnSystem, users } = ctx;

// Intentionally no bare-slash menu handler. /start and /menu have dedicated handlers.

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

bot.onText(/^\/admin(?:@\w+)?(?:\s|$)/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  if (!isBotAdmin(userId)) {
    await bot.sendMessage(msg.chat.id,
      `<blockquote expandable='true'><b>🔒 ᴀᴅᴍɪɴ ᴀᴄᴄᴇss</b></blockquote>\n\n❌ ʏᴏᴜ ᴀʀᴇ ɴᴏᴛ ᴀᴜᴛʜᴏʀɪᴢᴇᴅ ᴛᴏ ᴏᴘᴇɴ ᴛʜᴇ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ.`,
      { parse_mode: "HTML" }
    );
    return;
  }
  const version = process.env.BOT_VERSION || "V11.0.0";
  const adminCaption = `<blockquote expandable='true'>
🌸 <b>ᴍɪss ᴀʀɪᴀ</b> 🌸
<i>ᴏᴡɴᴇʀ & ᴀᴅᴍɪɴ ᴄᴏɴᴛʀᴏʟ ᴄᴇɴᴛᴇʀ</i>

━━━━━━━━━━━━━━━━━━

👑 <b>ʙᴏᴛ:</b> ᴍɪss ᴀʀɪᴀ
📦 <b>ᴠᴇʀsɪᴏɴ:</b> ${version}
🌐 <b>ʜᴏsᴛ:</b> ${process.env.RENDER || process.env.RENDER_SERVICE_NAME ? "ʀᴇɴᴅᴇʀ" : "sᴇʀᴠᴇʀ"}

• 👥 ᴜsᴇʀs & ᴍᴀɴᴀɢᴇᴍᴇɴᴛ
• 📊 sᴛᴀᴛɪsᴛɪᴄs & ᴀᴜᴅɪᴛs
• 📢 ʙʀᴏᴀᴅᴄᴀsᴛ
• 👥 sᴇssɪᴏɴs
• 🛡️ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ
• ⚙️ sʏsᴛᴇᴍ & ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ

━━━━━━━━━━━━━━━━━━

👑 <b>ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ</b>
🌸 <i>sᴇʟᴇᴄᴛ ᴀ ᴄᴏɴᴛʀᴏʟ ʙᴇʟᴏᴡ.</i>
</blockquote>`;
  try {
    await bot.sendPhoto(msg.chat.id, ctx.MENU_IMAGE_URL || "https://files.catbox.moe/hjdxgx.jpg", {
      caption: adminCaption,
      parse_mode: "HTML",
      reply_markup: adminPanelKeyboard(),
      reply_to_message_id: msg.message_id
    });
  } catch {
    await bot.sendMessage(msg.chat.id, adminCaption, { parse_mode: "HTML", reply_markup: adminPanelKeyboard(), reply_to_message_id: msg.message_id });
  }
});

bot.onText(/^\/addprem(?:@\w+)?(?:\s|$)/, (msg) => handlePremCommand(msg, true));

bot.onText(/^\/removeprem(?:@\w+)?(?:\s|$)/, (msg) => handlePremCommand(msg, false));

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
data.startsWith("menu_page_") ||
data.startsWith("promote_pick_") ||
data.startsWith("remove_chat_") ||
data.startsWith("cs_") ||
data.startsWith("admin_")
);


if(!isMenuAction)
return;

  if (/^menu_page_\d+$/.test(data)) {
    const page = Number(data.split("_").pop());
    try {
      await bot.editMessageCaption(mainMenuPageText(userId, page), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(userId, page),
      });
    } catch (err) {
      await bot.editMessageText(mainMenuPageText(userId, page), {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: mainMenuKeyboard(userId, page),
      });
    }
    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === "menu_page_info") {
    await bot.answerCallbackQuery(query.id, { text: "ᴜsᴇ ɴᴇxᴛ ᴏʀ ᴘʀᴇᴠ ᴛᴏ ɴᴀᴠɪɢᴀᴛᴇ." });
    return;
  }

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

  if (data === "admin_sessions") {
    const activeAi = aiChatSessions.size;
    const pending = Object.keys(state.pending || {}).length;
    const text = `<blockquote expandable='true'><b>👥 ᴀᴅᴍɪɴ sᴇssɪᴏɴs</b>\n━━━━━━━━━━━━━━━━━━\n💬 ᴀɪ sᴇssɪᴏɴs: ${activeAi}\n⏳ ᴘᴇɴᴅɪɴɢ ғʟᴏᴡs: ${pending}\n━━━━━━━━━━━━━━━━━━</blockquote>`;
    try { await bot.editMessageCaption(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: backToAdminKeyboard() }); }
    catch { await bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: backToAdminKeyboard() }); }
    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === "admin_users") {
    const total = Object.keys(state.users || {}).length;
    const started = Object.values(state.users || {}).filter(u => u && u.started).length;
    const premium = Object.values(state.users || {}).filter(u => u && u.plan === "premium").length;
    const text = `<blockquote expandable='true'><b>📋 ᴜsᴇʀ ᴏᴠᴇʀᴠɪᴇᴡ</b>\n━━━━━━━━━━━━━━━━━━\n👥 ᴛᴏᴛᴀʟ: ${total}\n🟢 sᴛᴀʀᴛᴇᴅ: ${started}\n⭐ ᴘʀᴇᴍɪᴜᴍ: ${premium}\n━━━━━━━━━━━━━━━━━━</blockquote>`;
    try { await bot.editMessageCaption(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: backToAdminKeyboard() }); }
    catch { await bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: backToAdminKeyboard() }); }
    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === "admin_maintenance") {
    if (!isOwner(userId)) { await bot.answerCallbackQuery(query.id, { text: "ᴏᴡɴᴇʀ ᴏɴʟʏ.", show_alert: true }); return; }
    const enabled = !isMaintenanceOn();
    setMaintenance(enabled);
    const text = `<blockquote expandable='true'><b>🔧 ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ</b>\n━━━━━━━━━━━━━━━━━━\n${enabled ? "🔴 ᴍᴏᴅᴇ: ᴏɴ" : "🟢 ᴍᴏᴅᴇ: ᴏғғ"}\n━━━━━━━━━━━━━━━━━━</blockquote>`;
    try { await bot.editMessageCaption(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: backToAdminKeyboard() }); }
    catch { await bot.editMessageText(text, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: backToAdminKeyboard() }); }
    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (data === "admin_exportlogs") {
    await bot.answerCallbackQuery(query.id, { text: "ᴜsᴇ /exportlogs ᴛᴏ ᴇxᴘᴏʀᴛ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ ʟᴏɢs.", show_alert: true });
    return;
  }

  if (data === "admin_moderation") {
    await bot.answerCallbackQuery(query.id);
    try {
      await bot.editMessageCaption(`<blockquote expandable='true'><b>🛡️ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ</b>\n━━━━━━━━━━━━━━━━━━\nᴜsᴇ ᴛʜᴇ ᴄʜᴀᴛ sᴇᴛᴛɪɴɢs ᴘᴀɴᴇʟ ᴛᴏ ᴄᴏɴғɪɢᴜʀᴇ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ ғᴇᴀᴛᴜʀᴇs.</blockquote>`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🛡️ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ", callback_data: "menu_protection", style: "success" }, { text: "‹ ʙᴀᴄᴋ", callback_data: "admin_page2", style: "primary" }]] } });
    } catch {}
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
}

module.exports = register;
