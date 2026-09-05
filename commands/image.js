// ============================================================
// 🎨 ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛᴏʀ — ɴᴏᴅᴇ-ᴛᴇʟᴇɢʀᴀᴍ-ʙᴏᴛ-ᴀᴘɪ
// ============================================================

const axios = require("axios");

// ============================================================
// ⚙️ ᴄᴏɴғɪɢ
// ============================================================

const API_BASE = "https://prexzyapis.com";

// ============================================================
// 🎨 ɪᴍᴀɢᴇ ᴍᴏᴅᴇʟs
// ============================================================

const IMAGE_MODELS = [
  ["3ᴅ ʀᴇɴᴅᴇʀ", "3d-render"],
  ["ᴀʙsᴛʀᴀᴄᴛ", "abstract"],
  ["ᴀɴɪᴍᴇ", "anime"],
  ["ᴀʀᴛ ᴅᴇᴄᴏ", "art-deco"],
  ["ᴀʀᴛ ɴᴏᴜᴠᴇᴀᴜ", "art-nouveau"],
  ["ʙᴀʀᴏǫᴜᴇ", "baroque"],
  ["ʙʟᴜᴇᴘʀɪɴᴛ", "blueprint"],
  ["ᴄᴀʀᴛᴏᴏɴ", "cartoon"],
  ["ᴄʜᴀʀᴄᴏᴀʟ", "charcoal"],
  ["ᴄʟᴀʏᴍᴀᴛɪᴏɴ", "claymation"],
  ["ᴄᴏᴍɪᴄ ʙᴏᴏᴋ", "comic-book"],
  ["ᴄʏʙᴇʀᴘᴜɴᴋ", "cyberpunk"],
  ["ᴇᴍʙʀᴏɪᴅᴇʀʏ", "embroidery"],
  ["ғᴀɴᴛᴀsʏ", "fantasy"],
  ["ғʟᴜx sᴄʜɴᴇʟʟ", "flux-schnell"],
  ["ɢᴏᴛʜɪᴄ", "gothic"],
  ["ɢʀᴀғғɪᴛɪ", "graffiti"],
  ["ʜᴏʀʀᴏʀ", "horror"],
  ["ɪᴍᴘʀᴇssɪᴏɴɪsᴛ", "impressionist"],
  ["ɪɴᴋ ᴡᴀsʜ", "ink-wash"],
  ["ɪsᴏᴍᴇᴛʀɪᴄ", "isometric"],
  ["ʟɪɴᴇ ᴀʀᴛ", "line-art"],
  ["ʟᴏᴡ ᴘᴏʟʏ", "low-poly"],
  ["ᴍᴀᴄʀᴏ ᴘʜᴏᴛᴏ", "macro-photo"],
  ["ᴍɪɴɪᴍᴀʟɪsᴛ", "minimalist"],
  ["ɴᴀɴᴏ ʙᴀɴᴀɴᴀ 2", "nano-banana-2"],
  ["ɴᴀɴᴏ ʙᴀɴᴀɴᴀ", "nano-banana"],
  ["ɴᴀɴᴏ ʙᴀɴᴀɴᴀ ᴘʀᴏ", "nano-banana-pro"],
  ["ɴᴇᴏ ɴᴏɪʀ", "neo-noir"],
  ["ᴏɪʟ ᴘᴀɪɴᴛɪɴɢ", "oil-painting"],
  ["ᴏʀɪɢᴀᴍɪ", "origami"],
  ["ᴘᴀᴘᴇʀᴄʀᴀғᴛ", "papercraft"],
  ["ᴘɪxᴇʟ ᴀʀᴛ", "pixel-art"],
  ["ᴘᴏᴘ ᴀʀᴛ", "pop-art"],
  ["ǫᴡᴇɴ ɪᴍᴀɢᴇ", "qwen-image"],
  ["ʀᴇᴀʟɪsᴛɪᴄ", "realistic"],
  ["ʀɪsᴏɢʀᴀᴘʜ", "risograph"],
  ["sᴄɪ-ғɪ", "sci-fi"],
  ["sᴇᴇᴅʀᴇᴀᴍ 4", "seedream-4"],
  ["sᴋᴇᴛᴄʜ", "sketch"],
  ["sᴛᴀɪɴᴇᴅ ɢʟᴀss", "stained-glass"],
  ["sᴛᴇᴀᴍᴘᴜɴᴋ", "steampunk"],
  ["sᴜʀʀᴇᴀʟ", "surreal"],
  ["sʏɴᴛʜᴡᴀᴠᴇ", "synthwave"],
  ["ᴛᴀᴛᴛᴏᴏ", "tattoo"],
  ["ᴜᴋɪʏᴏ-ᴇ", "ukiyo-e"],
  ["ᴠᴀᴘᴏʀᴡᴀᴠᴇ", "vaporwave"],
  ["ᴠɪɴᴛᴀɢᴇ", "vintage"],
  ["ᴠᴏxᴇʟ", "voxel"],
  ["ᴡᴀᴛᴇʀᴄᴏʟᴏʀ", "watercolor"]
];

// ============================================================
// 🧰 ɪᴍᴀɢᴇ ᴄʀᴇᴀᴛᴏʀ ᴇɴᴅᴘᴏɪɴᴛs
// ============================================================

const IMAGE_CREATORS = [
  ["ғᴀᴋᴇ ɪɢ ɴᴏᴛᴇ", "fakeignote"],
  ["ғᴀᴋᴇ ɪɢ ᴘᴏsᴛ", "fakeigpost"],
  ["ɪɴsᴛᴀɢʀᴀᴍ ǫᴜᴏᴛᴇ", "iqc"],
  ["ɪɢ sᴛᴏʀʏ", "igstory"],
  ["ᴍᴇᴍᴇ ɢᴇɴᴇʀᴀᴛᴏʀ", "meme"],
  ["sᴘᴏɴɢᴇʙᴏʙ ᴍᴇᴍᴇ", "spongebob"],
  ["ᴛᴇxᴛ ᴍᴇᴍᴇ", "memeText"],
  ["ᴛᴇxᴛ ᴛᴏ ɢɪғ", "gif"],
  ["ᴛᴇxᴛ ᴛᴏ ɪᴍᴀɢᴇ", "image"],
  ["ᴛᴇxᴛ ᴛᴏ ᴍᴘ4", "mp4"],
  ["ᴛᴛᴘ", "ttp"],
  ["ᴡɪɴᴅᴏᴡs ᴍᴇssᴀɢᴇ ʙᴏx", "kobaltgen"]
];

// ============================================================
// 🧠 ᴘᴇɴᴅɪɴɢ ᴜsᴇʀs
// ============================================================

const imagePending = new Map();

// ============================================================
// 📄 ᴍᴇɴᴜ ᴛᴇxᴛ
// ============================================================

function imageMenuText(page, totalPages) {
  return [
    "<blockquote>",
    "<b>『 🎨 ᴀɪ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛᴏʀ 』</b>",
    "",
    "✦ ᴄʜᴏᴏsᴇ ᴀ sᴛʏʟᴇ ᴛᴏ ɢᴇɴᴇʀᴀᴛᴇ ʏᴏᴜʀ ɪᴍᴀɢᴇ.",
    `✦ ᴘᴀɢᴇ: ${page + 1}/${totalPages}`,
    "",
    "💡 ᴜsᴇ /image ᴘʀᴏᴍᴘᴛ ᴛᴏ sᴛᴀʀᴛ.",
    "</blockquote>"
  ].join("\n");
}

// ============================================================
// 🔘 ᴍᴇɴᴜ ᴋᴇʏʙᴏᴀʀᴅ
// ============================================================

function imageKeyboard(page = 0) {
  const perPage = 10;
  const totalPages = Math.ceil(IMAGE_MODELS.length / perPage);

  const start = page * perPage;
  const items = IMAGE_MODELS.slice(start, start + perPage);

  const rows = [];

  for (let i = 0; i < items.length; i += 2) {
    const row = [];

    const first = items[i];

    row.push({
      text: `🎨 ${first[0]}`,
      callback_data: `imgstyle:${first[1]}`
    });

    if (items[i + 1]) {
      const second = items[i + 1];

      row.push({
        text: `🎨 ${second[0]}`,
        callback_data: `imgstyle:${second[1]}`
      });
    }

    rows.push(row);
  }

  const navigation = [];

  if (page > 0) {
    navigation.push({
      text: "⬅️ ᴘʀᴇᴠ",
      callback_data: `imgpage:${page - 1}`
    });
  }

  if (page < totalPages - 1) {
    navigation.push({
      text: "ɴᴇxᴛ ➡️",
      callback_data: `imgpage:${page + 1}`
    });
  }

  if (navigation.length) {
    rows.push(navigation);
  }

  rows.push([
    {
      text: "🏠 ᴍᴀɪɴ ᴍᴇɴᴜ",
      callback_data: "main_menu"
    }
  ]);

  return {
    inline_keyboard: rows
  };
}

// ============================================================
// 🚀 /ɪᴍᴀɢᴇ ᴄᴏᴍᴍᴀɴᴅ
// ============================================================

async function imageCommand(bot, msg, match) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const prompt =
    Array.isArray(match)
      ? match.slice(1).join(" ").trim()
      : String(match || "").trim();

  if (!prompt) {
    return bot.sendMessage(
      chatId,
      imageMenuText(0, Math.ceil(IMAGE_MODELS.length / 10)),
      {
        parse_mode: "HTML",
        reply_markup: imageKeyboard(0)
      }
    );
  }

  imagePending.set(userId, {
    prompt,
    page: 0
  });

  return bot.sendMessage(
    chatId,
    [
      "<blockquote>",
      "<b>🎨 ᴄʜᴏᴏsᴇ ʏᴏᴜʀ ɪᴍᴀɢᴇ sᴛʏʟᴇ</b>",
      "",
      `✦ ᴘʀᴏᴍᴘᴛ: <code>${escapeHtml(prompt)}</code>`,
      "",
      "✦ sᴇʟᴇᴄᴛ ᴀ sᴛʏʟᴇ ʙᴇʟᴏᴡ.",
      "</blockquote>"
    ].join("\n"),
    {
      parse_mode: "HTML",
      reply_markup: imageKeyboard(0)
    }
  );
}

// ============================================================
// 🧹 ᴇsᴄᴀᴘᴇ ʜᴛᴍʟ
// ============================================================

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============================================================
// 🌐 ɢᴇɴᴇʀᴀᴛᴇ ɪᴍᴀɢᴇ
// ============================================================

async function generateImage(bot, query, style) {
  const pending = imagePending.get(query.from.id);

  if (!pending) {
    return bot.answerCallbackQuery(query.id, {
      text: "❌ ᴛʜɪs ɢᴇɴᴇʀᴀᴛɪᴏɴ ʜᴀs ᴇxᴘɪʀᴇᴅ."
    });
  }

  const chatId = query.message.chat.id;

  await bot.answerCallbackQuery(query.id, {
    text: "🎨 ɢᴇɴᴇʀᴀᴛɪɴɢ..."
  });

  const waitMessage = await bot.sendMessage(
    chatId,
    "⏳ <b>ɢᴇɴᴇʀᴀᴛɪɴɢ ʏᴏᴜʀ ɪᴍᴀɢᴇ...</b>\n\n✦ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ.",
    {
      parse_mode: "HTML"
    }
  );

  try {
    const endpoint = `${API_BASE}/ai/${style}`;

    // API returns the actual image binary
    const response = await axios.get(endpoint, {
      params: {
        prompt: pending.prompt
      },
      responseType: "arraybuffer",
      timeout: 120000
    });

    const imageBuffer = Buffer.from(response.data);

    console.log(
      `[IMAGE API] ${style}: received ${imageBuffer.length} bytes`
    );

    if (!imageBuffer.length) {
      throw new Error("API returned empty image data");
    }

    await bot.deleteMessage(
      chatId,
      waitMessage.message_id
    ).catch(() => {});

    await bot.sendPhoto(
      chatId,
      imageBuffer,
      {
        caption: [
          "<blockquote>",
          `<b>🎨 ${style.toUpperCase()}</b>`,
          "",
          `✦ <b>ᴘʀᴏᴍᴘᴛ:</b> ${escapeHtml(pending.prompt)}`,
          "",
          "© ᴠɪɴᴇx ᴠ8",
          "</blockquote>"
        ].join("\n"),
        parse_mode: "HTML"
      }
    );

    imagePending.delete(query.from.id);

  } catch (error) {

    console.error(
      `[IMAGE ERROR] ${style}:`,
      error.response?.data
        ? Buffer.isBuffer(error.response.data)
          ? `Binary response (${error.response.data.length} bytes)`
          : error.response.data
        : error.message
    );

    await bot.deleteMessage(
      chatId,
      waitMessage.message_id
    ).catch(() => {});

    await bot.sendMessage(
      chatId,
      [
        "<blockquote>",
        "<b>❌ ɪᴍᴀɢᴇ ɢᴇɴᴇʀᴀᴛɪᴏɴ ғᴀɪʟᴇᴅ</b>",
        "",
        "✦ ᴛʜᴇ ᴀᴘɪ ᴅɪᴅ ɴᴏᴛ ʀᴇᴛᴜʀɴ ᴀ ᴠᴀʟɪᴅ ɪᴍᴀɢᴇ.",
        "✦ ᴛʀʏ ᴀɢᴀɪɴ ᴡɪᴛʜ ᴀɴᴏᴛʜᴇʀ ᴘʀᴏᴍᴘᴛ.",
        "</blockquote>"
      ].join("\n"),
      {
        parse_mode: "HTML"
      }
    );
  }
}
// ============================================================
// 🔎 ᴇxᴛʀᴀᴄᴛ ɪᴍᴀɢᴇ ᴜʀʟ
// ============================================================

function extractImageUrl(data) {
  if (!data) return null;

  if (typeof data === "string") {
    if (/^https?:\/\//i.test(data)) {
      return data;
    }

    try {
      return extractImageUrl(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const result = extractImageUrl(item);
      if (result) return result;
    }
  }

  if (typeof data === "object") {
    const possibleKeys = [
      "url",
      "image",
      "imageUrl",
      "image_url",
      "download",
      "downloadUrl",
      "download_url",
      "result",
      "data",
      "output"
    ];

    for (const key of possibleKeys) {
      if (data[key]) {
        const result = extractImageUrl(data[key]);

        if (result) return result;
      }
    }
  }

  return null;
}

// ============================================================
// 🔘 ʀᴇɢɪsᴛᴇʀ ᴄᴀʟʟʙᴀᴄᴋs
// ============================================================

function registerImageCallbacks(bot) {
  bot.on("callback_query", async (query) => {
    const data = query.data || "";

    try {

      // --------------------------------------------------------
      // 📄 ᴘᴀɢᴇ
      // --------------------------------------------------------

      if (data.startsWith("imgpage:")) {
        const page = Number(data.split(":")[1]) || 0;

        await bot.answerCallbackQuery(query.id);

        return bot.editMessageText(
          imageMenuText(
            page,
            Math.ceil(IMAGE_MODELS.length / 10)
          ),
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: imageKeyboard(page)
          }
        );
      }

      // --------------------------------------------------------
      // 🎨 sᴛʏʟᴇ
      // --------------------------------------------------------

      if (data.startsWith("imgstyle:")) {
        const style = data.substring("imgstyle:".length);

        return generateImage(
          bot,
          query,
          style
        );
      }

    } catch (error) {
      console.error(
        "[IMAGE CALLBACK ERROR]",
        error
      );

      await bot.answerCallbackQuery(
        query.id,
        {
          text: "❌ sᴏᴍᴇᴛʜɪɴɢ ᴡᴇɴᴛ ᴡʀᴏɴɢ."
        }
      ).catch(() => {});
    }
  });
}

// ============================================================
// ✍️ ᴛᴇxᴛ ʜᴀɴᴅʟᴇʀ
// ============================================================

function registerImageTextHandler(bot) {

  bot.onText(
    /^\/image(?:@\w+)?(?:\s+(.+))?$/i,
    async (msg, match) => {

      try {
        await imageCommand(
          bot,
          msg,
          match
        );
      } catch (error) {
        console.error(
          "[IMAGE COMMAND ERROR]",
          error
        );

        await bot.sendMessage(
          msg.chat.id,
          "❌ ɪᴍᴀɢᴇ ᴄᴏᴍᴍᴀɴᴅ ғᴀɪʟᴇᴅ."
        );
      }

    }
  );
}
// ============================================================
// 🔘 ʀᴇɢɪsᴛᴇʀ ᴄᴀʟʟʙᴀᴄᴋs
// ============================================================

function registerImageCallbacks(bot) {

  bot.on("callback_query", async (query) => {

    const data = query.data || "";

    try {

      // --------------------------------------------------------
      // 🏠 MAIN MENU
      // --------------------------------------------------------

      if (data === "main_menu") {

        await bot.answerCallbackQuery(query.id);

        return bot.sendMessage(
          query.message.chat.id,
          "🏠 Main menu"
        );
      }

      // --------------------------------------------------------
      // 📄 IMAGE PAGE
      // --------------------------------------------------------

      if (data.startsWith("imgpage:")) {

        const page = Number(
          data.split(":")[1]
        );

        await bot.answerCallbackQuery(
          query.id
        );

        return bot.editMessageText(
          imageMenuText(
            page,
            Math.ceil(
              IMAGE_MODELS.length / 10
            )
          ),
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: "HTML",
            reply_markup: imageKeyboard(page)
          }
        );
      }

      // --------------------------------------------------------
      // 🎨 IMAGE STYLE
      // --------------------------------------------------------

      if (data.startsWith("imgstyle:")) {

        const style = data.substring(
          "imgstyle:".length
        );

        return generateImage(
          bot,
          query,
          style
        );
      }

    } catch (error) {

      console.error(
        "[IMAGE CALLBACK ERROR]",
        error
      );

      await bot.answerCallbackQuery(
        query.id,
        {
          text: "❌ sᴏᴍᴇᴛʜɪɴɢ ᴡᴇɴᴛ ᴡʀᴏɴɢ."
        }
      ).catch(() => {});

    }

  });

}
// ============================================================
// 📤 ᴇxᴘᴏʀᴛ
// ============================================================

module.exports = {
  imageCommand,
  registerImageCallbacks,
  registerImageTextHandler,
  imageKeyboard,
  IMAGE_MODELS,
  IMAGE_CREATORS,
  imagePending
};