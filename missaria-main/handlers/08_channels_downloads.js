/**
 * Handler pack 8.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  const { bot, codeAssistant, codePending, downloadService, generateCode, mediaPending, path, socialDownloader, state } = ctx;

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
}

module.exports = register;
