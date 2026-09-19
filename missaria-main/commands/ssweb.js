// ============================================================
// 📸 ᴠɪɴᴇx — sᴄʀᴇᴇɴsʜᴏᴛ ɢᴇɴᴇʀᴀᴛᴏʀ
// ============================================================

const axios = require("axios");

const API_BASE = "https://prexzyapis.com";

const sswebPending = new Map();


// ============================================================
// 📸 sᴄʀᴇᴇɴsʜᴏᴛ ᴘʀᴏᴠɪᴅᴇʀs
// ============================================================

const screenshotProviders = [
  {
    name: "ᴀᴘɪ ꜰʟᴀsʜ",
    emoji: "⚡",
    slug: "apiFlash"
  },
  {
    name: "sᴄʀᴇᴇɴsʜᴏᴛ ʟᴀʏᴇʀ",
    emoji: "📸",
    slug: "screenshotLayer"
  },
  {
    name: "ᴡᴇʙss",
    emoji: "🌐",
    slug: "webss"
  }
];


// ============================================================
// 📋 sᴄʀᴇᴇɴsʜᴏᴛ ᴍᴇɴᴜ
// ============================================================

function screenshotKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "⚡ ᴀᴘɪ ꜰʟᴀsʜ",
          callback_data: "ssweb_apiFlash"
        }
      ],
      [
        {
          text: "📸 sᴄʀᴇᴇɴsʜᴏᴛ ʟᴀʏᴇʀ",
          callback_data: "ssweb_screenshotLayer"
        }
      ],
      [
        {
          text: "🌐 ᴡᴇʙss",
          callback_data: "ssweb_webss"
        }
      ],
      [
        {
          text: "🏠 ᴍᴀɪɴ ᴍᴇɴᴜ",
          callback_data: "main_menu"
        }
      ]
    ]
  };
}


// ============================================================
// 📸 /screenshot
// ============================================================

async function screenshotCommand(msg) {

  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
`<blockquote>
<b>『 📸 ᴡᴇʙ sᴄʀᴇᴇɴsʜᴏᴛ 』</b>

✧ ᴛᴀᴋᴇ ᴀ sᴄʀᴇᴇɴsʜᴏᴛ ᴏꜰ ᴀɴʏ ᴡᴇʙsɪᴛᴇ.

✧ ᴄʜᴏᴏsᴇ ʏᴏᴜʀ sᴄʀᴇᴇɴsʜᴏᴛ ᴘʀᴏᴠɪᴅᴇʀ ʙᴇʟᴏᴡ.

➤ sᴇʟᴇᴄᴛ ᴀ ᴘʀᴏᴠɪᴅᴇʀ 👇
</blockquote>`,
    {
      parse_mode: "HTML",
      reply_markup: screenshotKeyboard()
    }
  );
}


// ============================================================
// 🔘 ᴄᴀʟʟʙᴀᴄᴋ ʜᴀɴᴅʟᴇʀ
// ============================================================

function registerScreenshotCallbacks(bot) {

  bot.on("callback_query", async (query) => {

    const data = query.data;
    const userId = query.from.id;

    if (
      !/^ssweb_(apiFlash|screenshotLayer|webss)$/.test(data)
    ) {
      return;
    }

    await bot.answerCallbackQuery(query.id);

    const provider = data.replace("ssweb_", "");

    const info = screenshotProviders.find(
      x => x.slug === provider
    );

    if (!info) {
      return bot.sendMessage(
        query.message.chat.id,
        "❌ ɪɴᴠᴀʟɪᴅ sᴄʀᴇᴇɴsʜᴏᴛ ᴘʀᴏᴠɪᴅᴇʀ."
      );
    }

    sswebPending.set(userId, {
      provider,
      name: info.name,
      emoji: info.emoji
    });

    await bot.sendMessage(
      query.message.chat.id,
`<blockquote>
<b>『 ${info.emoji} ${info.name} 』</b>

✧ sᴇɴᴅ ᴛʜᴇ ᴡᴇʙsɪᴛᴇ ᴜʀʟ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ sᴄʀᴇᴇɴsʜᴏᴛ.

<b>ᴇxᴀᴍᴘʟᴇ:</b>

<code>https://example.com</code>

➤ sᴇɴᴅ ᴛʜᴇ ᴜʀʟ ɴᴏᴡ.
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );

  });
}


// ============================================================
// 🌐 ᴜʀʟ ʜᴀɴᴅʟᴇʀ
// ============================================================

function registerScreenshotTextHandler(bot) {

  bot.on("message", async (msg) => {

    if (!msg.text) return;

    // Don't process /commands
    if (msg.text.startsWith("/")) return;

    const userId = msg.from.id;

    const pending = sswebPending.get(userId);

    if (!pending) return;

    const chatId = msg.chat.id;
    const url = msg.text.trim();

    // ========================================================
    // 🔎 VALIDATE URL
    // ========================================================

    if (!/^https?:\/\/\S+$/i.test(url)) {

      return bot.sendMessage(
        chatId,
`❌ ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ᴠᴀʟɪᴅ ᴜʀʟ.

ᴇxᴀᴍᴘʟᴇ:
https://example.com`
      );

    }

    // Remove pending state
    sswebPending.delete(userId);

    // ========================================================
    // ⏳ LOADING
    // ========================================================

    const loading = await bot.sendMessage(
      chatId,
`<blockquote>
⏳ <b>ᴛᴀᴋɪɴɢ sᴄʀᴇᴇɴsʜᴏᴛ...</b>

✧ ᴘʀᴏᴠɪᴅᴇʀ:
${pending.emoji} ${pending.name}

✧ ᴜʀʟ:
${url}

✧ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );


    try {

      // ======================================================
      // 🌐 API REQUEST
      // ======================================================

      const response = await axios.get(
        `${API_BASE}/ssweb/${pending.provider}`,
        {
          params: {
            url
          },
          timeout: 120000
        }
      );

      console.log(
        "sᴄʀᴇᴇɴsʜᴏᴛ ʀᴇsᴘᴏɴsᴇ:",
        JSON.stringify(response.data, null, 2)
      );

      const data = response.data;


      // ======================================================
      // 🔎 FIND IMAGE URL
      // ======================================================

      let imageUrl =
        typeof data === "string"
          ? data
          : (
              data?.url ||
              data?.image ||
              data?.imageUrl ||
              data?.image_url ||
              data?.result ||
              data?.data?.url ||
              data?.data?.image ||
              data?.data?.imageUrl ||
              data?.data?.image_url ||
              data?.result?.url
            );


      // ======================================================
      // ❌ NO IMAGE
      // ======================================================

      if (!imageUrl) {

        console.error(
          "ɴᴏ sᴄʀᴇᴇɴsʜᴏᴛ ᴜʀʟ:",
          data
        );

        await bot.editMessageText(
`❌ <b>sᴄʀᴇᴇɴsʜᴏᴛ ꜰᴀɪʟᴇᴅ</b>

✧ ᴛʜᴇ ᴀᴘɪ ᴅɪᴅ ɴᴏᴛ ʀᴇᴛᴜʀɴ ᴀɴ ɪᴍᴀɢᴇ ᴜʀʟ.`,
          {
            chat_id: chatId,
            message_id: loading.message_id,
            parse_mode: "HTML"
          }
        ).catch(() => {});

        return;
      }


      // ======================================================
      // 🗑 DELETE LOADING
      // ======================================================

      await bot.deleteMessage(
        chatId,
        loading.message_id
      ).catch(() => {});


      // ======================================================
      // 📸 SEND SCREENSHOT
      // ======================================================

      await bot.sendPhoto(
        chatId,
        imageUrl,
        {
          caption:
`<blockquote>
<b>『 ${pending.emoji} sᴄʀᴇᴇɴsʜᴏᴛ ᴄᴏᴍᴘʟᴇᴛᴇ 』</b>

✧ ᴘʀᴏᴠɪᴅᴇʀ:
${pending.name}

✧ ᴜʀʟ:
${url}

✧ sᴛᴀᴛᴜs: sᴜᴄᴄᴇss ✅

© 🌺 ᴍɪss ᴀʀɪᴀ • ᴠ² ₊.ᐟ
</blockquote>`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📸 ᴛᴀᴋᴇ ᴀɢᴀɪɴ",
                  callback_data:
                    `ssweb_${pending.provider}`
                }
              ],
              [
                {
                  text: "‹ ᴄʜᴏᴏsᴇ ᴘʀᴏᴠɪᴅᴇʀ",
                  callback_data: "ssweb_menu"
                }
              ]
            ]
          }
        }
      );

    } catch (error) {

      console.error(
        "sᴄʀᴇᴇɴsʜᴏᴛ ᴇʀʀᴏʀ:",
        error.response?.data ||
        error.message ||
        error
      );


      await bot.editMessageText(
`❌ <b>sᴄʀᴇᴇɴsʜᴏᴛ ꜰᴀɪʟᴇᴅ</b>

✧ ᴛʜᴇ ᴘʀᴏᴠɪᴅᴇʀ ᴍᴀʏ ʙᴇ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.

✧ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.`,
        {
          chat_id: chatId,
          message_id: loading.message_id,
          parse_mode: "HTML"
        }
      ).catch(() => {});

    }

  });
}


// ============================================================
// 📋 ᴘʀᴏᴠɪᴅᴇʀ ᴍᴇɴᴜ ʙᴀᴄᴋ
// ============================================================

function registerScreenshotMenu(bot) {

  bot.on("callback_query", async (query) => {

    if (query.data !== "ssweb_menu") {
      return;
    }

    await bot.answerCallbackQuery(query.id);

    const chatId = query.message.chat.id;

    await bot.editMessageText(
`<blockquote>
<b>『 📸 ᴡᴇʙ sᴄʀᴇᴇɴsʜᴏᴛ 』</b>

✧ ᴄʜᴏᴏsᴇ ᴀ ᴘʀᴏᴠɪᴅᴇʀ ᴛᴏ ᴛᴀᴋᴇ ᴀ sᴄʀᴇᴇɴsʜᴏᴛ.
</blockquote>`,
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: "HTML",
        reply_markup: screenshotKeyboard()
      }
    );

  });
}


// ============================================================
// 📦 ᴇxᴘᴏʀᴛ
// ============================================================

module.exports = {

  screenshotCommand,

  screenshotKeyboard,

  registerScreenshotCallbacks,

  registerScreenshotTextHandler,

  registerScreenshotMenu

};