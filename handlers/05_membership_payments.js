/**
 * Handler pack 5.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  const { bot, AIART_API_URL, CAPTCHA_TIMEOUT_MS, JOIN_RAID_COUNT, JOIN_RAID_MUTE_MS, JOIN_RAID_WINDOW_MS, acquireGenSlot, axios, buildReport, captureChatPhotoBaseline, discoverTelegramEmails, escapeHtml, extractTelegramLinks, extractUrls, genQueue, genQueuePosition, getOwnerId, getPlan, getPremiumExpiry, https, incrementChatFlags, isAntiRaidEnabled, isBioLinkLockEnabled, isBotAdmin, isCaptchaEnabled, isPremiumActive, joinTracker, log, mailer, muteUser, pendingCaptchas, releaseGenSlot, reportSessions, setPlan, setPremiumExpiry, sharp, users } = ctx;

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
}

module.exports = register;
