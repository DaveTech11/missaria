/**
 * Handler pack 3.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
const imageAnimation = require("../services/imageGenerationAnimation");
  const { bot, detectIntent, isNaturalImageQuestion, detectNaturalImageRequest, generateNaturalImage: generateNaturalImage, withRetry, backToAdminKeyboard, bcrypt, escapeHtml, findUserByEmail, generateCode, https, isBotAdmin, log, loginEmailState, loginPasswordState, passwordSetupState, saveUsers, sendMainMenu, sendVerificationEmail, setPending, signupState, users, verificationState } = ctx;

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
                    text: "🏠 ᴍᴀɪɴ ᴍᴇɴᴜ",
                    callback_data: "main_menu",
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

    // Signup is permanently disabled for Telegram users.
    await bot.answerCallbackQuery(query.id, {
        text: "🌸 sɪɢɴ ᴜᴘ ɪs ɴᴏ ʟᴏɴɢᴇʀ ʀᴇǫᴜɪʀᴇᴅ.",
        show_alert: false
    }).catch(() => {});
    await bot.sendMessage(query.message.chat.id,
        "🌸 <b>ᴍɪss ᴀʀɪᴀ ɪs ʀᴇᴀᴅʏ ᴛᴏ ᴜsᴇ.</b>\n\n💬 ᴄʜᴀᴛ, ɪᴍᴀɢᴇs, ᴄᴏᴅɪɴɢ ᴀɴᴅ ᴍᴏʀᴇ — ɴᴏ sɪɢɴᴜᴘ ɪs ɴᴇᴇᴅᴇᴅ.",
        { parse_mode: "HTML" }
    ).catch(() => {});
    return;

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

bot.on("message", async (msg) => {
  try {
    if (!msg.text || msg.text.startsWith("/") || !msg.from) return;
    if (isNaturalImageQuestion(msg.text)) return;

    const request = detectNaturalImageRequest(msg.text);
    if (!request.isImageRequest) return;

    const chatId = msg.chat.id;
    const prompt = request.prompt;
    if (!prompt) {
      await bot.sendMessage(chatId,
        "🎨 ᴛᴇʟʟ ᴍᴇ ᴡʜᴀᴛ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴄʀᴇᴀᴛᴇ — ᴇxᴀᴍᴘʟᴇ: <code>ɢᴇɴᴇʀᴀᴛᴇ ᴀ ғᴜᴛᴜʀɪsᴛɪᴄ ᴄɪᴛʏ</code>.",
        { parse_mode: "HTML", reply_to_message_id: msg.message_id }).catch(() => {});
      return;
    }

    try {
      const animated = await imageAnimation.start(bot, chatId, msg.from.id, async () =>
        withRetry(() => generateNaturalImage(prompt), { retries: 1, baseDelay: 1200 }),
        { subtitle: `📝 ᴘʀᴏᴍᴘᴛ: ${escapeHtml(prompt.slice(0, 100))}`, reply_to_message_id: msg.message_id }
      );

      const result = animated.result;
      imageAnimation.remember(msg.from.id, { prompt, style: "natural", natural: true });

      await bot.sendPhoto(chatId, result.image, {
        caption: `<b>✨ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛᴇᴅ</b>\n\n<blockquote>📝 <b>ᴘʀᴏᴍᴘᴛ</b>\n<code>${escapeHtml(prompt)}</code>\n\n⚡ <b>ᴇɴɢɪɴᴇ:</b> ${escapeHtml(result.engine)}\n🌸 <b>ᴍɪss ᴀʀɪᴀ</b></blockquote>`,
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id,
        reply_markup: { inline_keyboard: [
          [
            { text: "🎨 ɢᴇɴᴇʀᴀᴛᴇ ᴀɢᴀɪɴ", callback_data: "img_regen", style: "success" },
            { text: "✏️ ᴄʜᴀɴɢᴇ ᴘʀᴏᴍᴘᴛ", callback_data: "img_change", style: "primary" }
          ],
          [{ text: "🖼️ ɴᴇᴡ ɪᴍᴀɢᴇ", callback_data: "img_new", style: "primary" }]
        ] }
      });
    } catch (err) {
      console.error("[NATURAL IMAGE ERROR]", err?.message || err);
    }
  } catch (err) {
    console.error("[NATURAL IMAGE HANDLER]", err?.message || err);
  }
});

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

bot.on("callback_query", async (query) => {
    if (query.data !== "skip_signup") return;

    await bot.answerCallbackQuery(query.id, {
        text: "🌸 sɪɢɴᴜᴘ ɪs ɴᴏᴛ ʀᴇǫᴜɪʀᴇᴅ.",
        show_alert: false
    }).catch(() => {});
    await bot.sendMessage(query.message.chat.id,
        "🌸 <b>ɢᴜᴇsᴛ ᴀᴄᴄᴇss ɪs ɴᴏᴡ ᴜɴʟɪᴍɪᴛᴇᴅ.</b>\n\n💬 ʏᴏᴜ ᴄᴀɴ ᴜsᴇ ᴍɪss ᴀʀɪᴀ ᴡɪᴛʜᴏᴜᴛ ᴀɴ ᴀᴄᴄᴏᴜɴᴛ.",
        { parse_mode: "HTML" }
    ).catch(() => {});
    return;

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
}

module.exports = register;
