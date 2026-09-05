// ============================================================
// 🌺 ᴍɪss ᴀʀɪᴀ — ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
// ᴛɪᴋᴛᴏᴋ • ɪɴsᴛᴀɢʀᴀᴍ • ᴛᴡɪᴛᴛᴇʀ/𝕏 • ꜰᴀᴄᴇʙᴏᴏᴋ • ᴘɪɴᴛᴇʀᴇsᴛ
// ============================================================

const aioPending = new Map();

const API_BASE = "https://prexzyapis.com";
// ============================================================
// 🌐 AIO DOWNLOADER
// ============================================================




// ============================================================
// 🌐 ᴘʀᴇxᴢʏ ᴀɪᴏ
// ============================================================

async function prexzyAIO(url) {
  if (!url) {
    throw new Error("URL is required");
  }

  const apiUrl =
    `${API_BASE}/download/aiov2?url=${encodeURIComponent(url)}`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(
      `Prexzy API returned HTTP ${response.status}`
    );
  }

  return await response.json();
}

// ============================================================
// 🔎 ᴄᴏʟʟᴇᴄᴛ ᴜʀʟs
// ============================================================

function collectUrls(value, path = "", results = []) {
  if (!value) return results;

  if (typeof value === "string") {
    const matches = value.match(
      /https?:\/\/[^\s"'<>]+/gi
    );

    if (matches) {
      for (const url of matches) {
        results.push({
          url: url.replace(/[),]+$/, ""),
          path: path.toLowerCase()
        });
      }
    }

    return results;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectUrls(
        item,
        `${path}[${index}]`,
        results
      );
    });

    return results;
  }

  if (typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      collectUrls(
        val,
        path ? `${path}.${key}` : key,
        results
      );
    }
  }

  return results;
}

// ============================================================
// 🎵 🖼 🎬 ꜰɪɴᴅ ᴍᴇᴅɪᴀ
// ============================================================

function findMediaUrl(data, type) {
  const urls = collectUrls(data);

  const patterns = {
    audio: [
      "audio",
      "music",
      "mp3",
      "m4a",
      "aac",
      "ogg",
      "wav",
      "sound",
      "song"
    ],

    image: [
      "image",
      "images",
      "photo",
      "photos",
      "picture",
      "pictures",
      "thumbnail",
      "cover"
    ],

    video: [
      "video",
      "videos",
      "mp4",
      "mov",
      "webm",
      "mkv",
      "download",
      "play"
    ]
  };

  const keywords = patterns[type] || [];

  const scored = urls.map(item => {
    let score = 0;

    const path = item.path.toLowerCase();
    const url = item.url.toLowerCase();

    for (const keyword of keywords) {
      if (path.includes(keyword)) {
        score += 10;
      }
    }

    if (
      type === "audio" &&
      /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(url)
    ) {
      score += 30;
    }

    if (
      type === "image" &&
      /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)
    ) {
      score += 30;
    }

    if (
      type === "video" &&
      /\.(mp4|mov|webm|mkv)(\?|$)/i.test(url)
    ) {
      score += 30;
    }

    return {
      ...item,
      score
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.length
    ? scored[0].url
    : null;
}

// ============================================================
// 🖼 ᴄᴏʟʟᴇᴄᴛ ᴀʟʟ ɪᴍᴀɢᴇs
// ============================================================

function findImageUrls(data) {
  const urls = collectUrls(data);

  const images = urls.filter(item => {
    const path = item.path.toLowerCase();
    const url = item.url.toLowerCase();

    return (
      path.includes("image") ||
      path.includes("images") ||
      path.includes("photo") ||
      path.includes("photos") ||
      path.includes("picture") ||
      path.includes("pictures") ||
      /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)
    );
  });

  return [
    ...new Map(
      images.map(item => [item.url, item.url])
    ).values()
  ];
}

// ============================================================
// ⌨️ ᴀɪᴏ ᴋᴇʏʙᴏᴀʀᴅ
// ============================================================

function aioKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "🎵 ᴀᴜᴅɪᴏ / ᴘʟᴀʏ",
          callback_data: "aio_audio"
        },
        {
          text: "🖼️ ɪᴍᴀɢᴇ",
          callback_data: "aio_image"
        }
      ],

      [
        {
          text: "🎬 ᴠɪᴅᴇᴏ / ᴍᴘ4",
          callback_data: "aio_video"
        },
        {
          text: "🖼️ ᴄᴀʀᴏᴜsᴇʟ",
          callback_data: "aio_carousel"
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
// 📥 /ᴀɪᴏ
// ============================================================

async function aioCommand(ctx) {
  const text = ctx.message?.text || "";

  const url = text
    .split(/\s+/)
    .slice(1)
    .join(" ")
    .trim();

  if (!url) {
    return ctx.reply(
      `<blockquote>
<b>『 🌐 ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 』</b>

✧ sᴇɴᴅ ᴀ sᴏᴄɪᴀʟ ᴍᴇᴅɪᴀ ʟɪɴᴋ.

<b>ᴜsᴀɢᴇ:</b>
<code>/aio https://example.com/...</code>

<b>sᴜᴘᴘᴏʀᴛᴇᴅ:</b>

🎵 ᴛɪᴋᴛᴏᴋ
📸 ɪɴsᴛᴀɢʀᴀᴍ
🐦 ᴛᴡɪᴛᴇʀ / 𝕏
📘 ꜰᴀᴄᴇʙᴏᴏᴋ
📌 ᴘɪɴᴛᴇʀᴇsᴛ
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }

  if (!/^https?:\/\/\S+$/i.test(url)) {
    return ctx.reply(
      "❌ ᴘʟᴇᴀsᴇ sᴇɴᴅ ᴀ ᴠᴀʟɪᴅ ʟɪɴᴋ."
    );
  }

  const waitMsg = await ctx.reply(
    `<blockquote>
⏳ <b>ᴘʀᴏᴄᴇssɪɴɢ ʟɪɴᴋ...</b>

🌺 ᴍɪss ᴀʀɪᴀ ɪs ᴄʜᴇᴄᴋɪɴɢ ᴛʜᴇ ᴍᴇᴅɪᴀ...
</blockquote>`,
    {
      parse_mode: "HTML"
    }
  );

  try {
    const data = await prexzyAIO(url);

    console.log(
      "========== ᴀɪᴏ ʀᴇsᴘᴏɴsᴇ =========="
    );

    console.log(
      JSON.stringify(data, null, 2)
    );

    console.log(
      "===================================="
    );

    const title =
      data?.title ||
      data?.result?.title ||
      data?.data?.title ||
      data?.result?.caption ||
      data?.data?.caption ||
      "ᴠɪʀᴀʟ ᴍᴇᴅɪᴀ";

    const thumbnail =
      data?.thumbnail ||
      data?.cover ||
      data?.coverUrl ||
      data?.result?.thumbnail ||
      data?.result?.cover ||
      data?.data?.thumbnail ||
      data?.data?.cover ||
      null;

    aioPending.set(
      ctx.from.id,
      {
        url,
        data,
        title,
        thumbnail,
        createdAt: Date.now()
      }
    );

    await ctx.telegram
      .deleteMessage(
        ctx.chat.id,
        waitMsg.message_id
      )
      .catch(() => {});

    const caption = `
<blockquote>
<b>『 ✧ 🌐 ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ ✧ 』</b>

<b>╭─「 ᴍᴇᴅɪᴀ ᴅᴇᴛᴇᴄᴛᴇᴅ 」</b>
│
│ 🌐 <b>ᴘʟᴀᴛꜰᴏʀᴍ:</b> ᴀɪᴏ
│ 📡 <b>sᴛᴀᴛᴜs:</b> ʟɪɴᴋ ᴅᴇᴛᴇᴄᴛᴇᴅ
│ 🎬 <b>ꜰᴏʀᴍᴀᴛs:</b> ᴀᴜᴅɪᴏ • ɪᴍᴀɢᴇ • ᴠɪᴅᴇᴏ
│
│ 📝 <b>ᴛɪᴛʟᴇ:</b>
│ ${escapeHtml(String(title).substring(0, 300))}
│
<b>╰────────────────────</b>

<b>➤ ᴄʜᴏᴏsᴇ ᴀ ꜰᴏʀᴍᴀᴛ ʙᴇʟᴏᴡ.</b>

© 🌺 ᴍɪss ᴀʀɪᴀ • ᴠ² ₊.ᐟ
</blockquote>
`.trim();

    if (thumbnail) {
      await ctx.replyWithPhoto(
        {
          url: thumbnail
        },
        {
          caption,
          parse_mode: "HTML",
          reply_markup: aioKeyboard()
        }
      );
    } else {
      await ctx.reply(
        caption,
        {
          parse_mode: "HTML",
          reply_markup: aioKeyboard()
        }
      );
    }

  } catch (error) {

    console.error(
      "ᴀɪᴏ ᴇʀʀᴏʀ:",
      error.response?.data ||
      error.message ||
      error
    );

    await ctx.telegram
      .deleteMessage(
        ctx.chat.id,
        waitMsg.message_id
      )
      .catch(() => {});

    await ctx.reply(
      `<blockquote>
❌ <b>ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ</b>

✧ ᴛʜᴇ ʟɪɴᴋ ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴇ ᴘʀᴏᴄᴇssᴇᴅ.

✧ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  }
}

// ============================================================
// 🔘 ᴀɪᴏ ᴄᴀʟʟʙᴀᴄᴋs
// ============================================================

function registerAioCallbacks(bot) {

  // 🎵 ᴀᴜᴅɪᴏ
  bot.action("aio_audio", async ctx => {

    await ctx.answerCbQuery(
      "🎵 ᴘʀᴏᴄᴇssɪɴɢ ᴀᴜᴅɪᴏ..."
    );

    const pending =
      aioPending.get(ctx.from.id);

    if (!pending) {
      return ctx.reply(
        "❌ ᴛʜɪs ᴅᴏᴡɴʟᴏᴀᴅ ʜᴀs ᴇxᴘɪʀᴇᴅ."
      );
    }

    try {

      const audioUrl =
        findMediaUrl(
          pending.data,
          "audio"
        );

      if (!audioUrl) {
        return ctx.reply(
          "❌ ɴᴏ ᴀᴜᴅɪᴏ ꜰɪʟᴇ ᴡᴀs ꜰᴏᴜɴᴅ."
        );
      }

      await ctx.replyWithAudio(
        {
          url: audioUrl
        },
        {
          caption:
            "🎵 <b>ᴀᴜᴅɪᴏ ʀᴇᴀᴅʏ</b>\n\n" +
            "© 🌺 ᴍɪss ᴀʀɪᴀ • ᴠ² ₊.ᐟ",
          parse_mode: "HTML"
        }
      );

    } catch (error) {

      console.error(
        "ᴀᴜᴅɪᴏ ᴇʀʀᴏʀ:",
        error.message
      );

      await ctx.reply(
        "❌ ᴜɴᴀʙʟᴇ ᴛᴏ sᴇɴᴅ ᴀᴜᴅɪᴏ."
      );
    }
  });

  // 🖼️ ɪᴍᴀɢᴇ
  bot.action("aio_image", async ctx => {

    await ctx.answerCbQuery(
      "🖼️ ᴘʀᴏᴄᴇssɪɴɢ ɪᴍᴀɢᴇ..."
    );

    const pending =
      aioPending.get(ctx.from.id);

    if (!pending) {
      return ctx.reply(
        "❌ ᴛʜɪs ᴅᴏᴡɴʟᴏᴀᴅ ʜᴀs ᴇxᴘɪʀᴇᴅ."
      );
    }

    try {

      const imageUrl =
        findMediaUrl(
          pending.data,
          "image"
        );

      if (!imageUrl) {
        return ctx.reply(
          "❌ ɴᴏ ɪᴍᴀɢᴇ ꜰɪʟᴇ ᴡᴀs ꜰᴏᴜɴᴅ."
        );
      }

      await ctx.replyWithPhoto(
        {
          url: imageUrl
        },
        {
          caption:
            "🖼️ <b>ɪᴍᴀɢᴇ ʀᴇᴀᴅʏ</b>\n\n" +
            "© 🌺 ᴍɪss ᴀʀɪᴀ • ᴠ² ₊.ᐟ",
          parse_mode: "HTML"
        }
      );

    } catch (error) {

      console.error(
        "ɪᴍᴀɢᴇ ᴇʀʀᴏʀ:",
        error.message
      );

      await ctx.reply(
        "❌ ᴜɴᴀʙʟᴇ ᴛᴏ sᴇɴᴅ ɪᴍᴀɢᴇ."
      );
    }
  });

  // 🎬 ᴠɪᴅᴇᴏ
  bot.action("aio_video", async ctx => {

    await ctx.answerCbQuery(
      "🎬 ᴘʀᴏᴄᴇssɪɴɢ ᴠɪᴅᴇᴏ..."
    );

    const pending =
      aioPending.get(ctx.from.id);

    if (!pending) {
      return ctx.reply(
        "❌ ᴛʜɪs ᴅᴏᴡɴʟᴏᴀᴅ ʜᴀs ᴇxᴘɪʀᴇᴅ."
      );
    }

    try {

      const videoUrl =
        findMediaUrl(
          pending.data,
          "video"
        );

      if (!videoUrl) {
        return ctx.reply(
          "❌ ɴᴏ ᴠɪᴅᴇᴏ ꜰɪʟᴇ ᴡᴀs ꜰᴏᴜɴᴅ."
        );
      }

      await ctx.replyWithVideo(
        {
          url: videoUrl
        },
        {
          caption:
            "🎬 <b>ᴠɪᴅᴇᴏ / ᴍᴘ4 ʀᴇᴀᴅʏ</b>\n\n" +
            "© 🌺 ᴍɪss ᴀʀɪᴀ • ᴠ² ₊.ᐟ",
          parse_mode: "HTML",
          supports_streaming: true
        }
      );

    } catch (error) {

      console.error(
        "ᴠɪᴅᴇᴏ ᴇʀʀᴏʀ:",
        error.message
      );

      await ctx.reply(
        "❌ ᴜɴᴀʙʟᴇ ᴛᴏ sᴇɴᴅ ᴠɪᴅᴇᴏ."
      );
    }
  });

  // 🖼️ ᴄᴀʀᴏᴜsᴇʟ
  bot.action("aio_carousel", async ctx => {

    await ctx.answerCbQuery(
      "🖼️ ʟᴏᴀᴅɪɴɢ ᴄᴀʀᴏᴜsᴇʟ..."
    );

    const pending =
      aioPending.get(ctx.from.id);

    if (!pending) {
      return ctx.reply(
        "❌ ᴛʜɪs ᴅᴏᴡɴʟᴏᴀᴅ ʜᴀs ᴇxᴘɪʀᴇᴅ."
      );
    }

    try {

      const images =
        findImageUrls(
          pending.data
        );

      if (!images.length) {
        return ctx.reply(
          "❌ ɴᴏ ᴄᴀʀᴏᴜsᴇʟ ɪᴍᴀɢᴇs ᴡᴇʀᴇ ꜰᴏᴜɴᴅ."
        );
      }

      const selected =
        images.slice(0, 10);

      const media =
        selected.map((url, index) => ({
          type: "photo",
          media: url,

          ...(index === 0
            ? {
                caption:
                  "🖼️ <b>ᴄᴀʀᴏᴜsᴇʟ ʀᴇᴀᴅʏ</b>\n\n" +
                  "© 🌺 ᴍɪss ᴀʀɪᴀ • ᴠ² ₊.ᐟ",
                parse_mode: "HTML"
              }
            : {})
        }));

      await ctx.replyWithMediaGroup(
        media
      );

    } catch (error) {

      console.error(
        "ᴄᴀʀᴏᴜsᴇʟ ᴇʀʀᴏʀ:",
        error.message
      );

      await ctx.reply(
        "❌ ᴜɴᴀʙʟᴇ ᴛᴏ sᴇɴᴅ ᴄᴀʀᴏᴜsᴇʟ."
      );
    }
  });

  // 🔄 ᴀɢᴀɪɴ
  bot.action("aio_again", async ctx => {

    await ctx.answerCbQuery();

    return ctx.reply(
      `<blockquote>
<b>『 🌐 ᴀɪᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ 』</b>

✧ sᴇɴᴅ ᴀɴᴏᴛʜᴇʀ sᴏᴄɪᴀʟ ᴍᴇᴅɪᴀ ʟɪɴᴋ.

ᴜsᴇ:
<code>/aio https://example.com/...</code>
</blockquote>`,
      {
        parse_mode: "HTML"
      }
    );
  });
}

// ============================================================
// 🔧 ᴄᴏᴍᴍᴀɴᴅ ʀᴇɢɪsᴛᴇʀ
// ============================================================

function registerAioCommand(bot) {

  bot.onText(
    /^\/(?:aio|download|dl)(?:\s+([\s\S]+))?$/i,
    async (msg, match) => {

      try {

        await aioCommand(
          bot,
          msg,
          match
        );

      } catch (error) {

        console.error(
          "AIO COMMAND ERROR:",
          error
        );

        try {
          await bot.sendMessage(
            msg.chat.id,
            "❌ AIO command failed."
          );
        } catch (sendError) {
          console.error(
            "AIO ERROR MESSAGE FAILED:",
            sendError
          );
        }

      }

    }
  );
}


// ============================================================
// 🧹 ᴄʟᴇᴀɴᴜᴘ
// ============================================================

setInterval(() => {

  const now = Date.now();

  for (
    const [userId, item]
    of aioPending.entries()
  ) {

    if (
      !item.createdAt ||
      now - item.createdAt >
      10 * 60 * 1000
    ) {
      aioPending.delete(userId);
    }
  }

}, 60 * 1000);

// ============================================================
// 🛠️ ᴇsᴄᴀᴘᴇ ʜᴛᴍʟ
// ============================================================

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// 📦 ᴇxᴘᴏʀᴛs
// ============================================================

module.exports = {
  aioCommand,
  registerAioCommand,
  registerAioCallbacks,
  prexzyAIO,
  aioPending,
  aioKeyboard,
  findMediaUrl,
  findImageUrls
};