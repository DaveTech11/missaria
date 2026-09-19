/**
 * Handler pack 7.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  const { bot, channelPosts, classifyImage, classifyLinks, classifyText, computeImageHash, downloadFileToBuffer, extractUrls, getOwnerId, getRules, handleChatPhotoChanged, incrementChatFlags, isEditLockEnabled, isForwardLockEnabled, isLinkLockEnabled, isStickerLockEnabled, log, matchBannedImage, stickerRecognitionService } = ctx;

bot.on("polling_error", (err) => console.error("Polling error:", err.message));

bot.on("channel_post", async (post) => {
  // Save original content for edit lock
  channelPosts.set(`${post.chat.id}:${post.message_id}`, {
    text: post.text || "",
    caption: post.caption || "",
    timestamp: Date.now()
  });


  try {
    if (post.new_chat_photo || post.delete_chat_photo) {
      await handleChatPhotoChanged(
        post.chat.id,
        post.message_id,
        post.chat.title
      );
      return;
    }

    // Rest of your moderation code goes here...

    // --- Forward Lock: blocks forwarded posts from other channels/bots ---
    if (isForwardLockEnabled(post.chat.id) && post.forward_from_chat) {
      log("Flagged forwarded post in channel", post.chat.id);
      try {
        await bot.deleteMessage(post.chat.id, post.message_id);
      } catch (err) {
        console.error("Failed to delete forwarded channel post", err.message);
      }
      incrementChatFlags(post.chat.id, post.chat.title);
      return;
    }

    // --- Link Lock: strips every link from channel posts (all channel posts come from admins) ---
    if (post.text && isLinkLockEnabled(post.chat.id) && extractUrls(post.text).length > 0) {
      log("Flagged link (Link Lock) in channel post in", post.chat.id);
      try {
        await bot.deleteMessage(post.chat.id, post.message_id);
      } catch (err) {
        console.error("Failed to delete channel post with link", err.message);
      }
      incrementChatFlags(post.chat.id, post.chat.title);
      return;
    }

    if (post.text && getRules(post.chat.id).length > 0) {
      const flaggedText = await classifyText(post.text, post.chat.id);
      if (flaggedText) {
        log("Flagged channel post text (custom rule) in", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete rule-violating channel post", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
      }
      return;
    }

    if (post.text) {
      const flaggedLink = await classifyLinks(post.text);
      if (flaggedLink) {
        log("Flagged malicious link in channel post in", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete channel post with malicious link", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
        return;
      }
    }

    // --- AI Sticker Recognition (unsafe content) ---
    if (post.sticker) {

  // Skip animated and video stickers
  if (post.sticker.is_animated || post.sticker.is_video) {
    return;
  }

  try {
    const result = await stickerRecognitionService.analyzeSticker({
      bot,
      stickerFileId: post.sticker.file_id,
      userId: post.from?.id || null,
    });

    const analysis = (result.text || "").toLowerCase();

    const unsafe = [
      "contains nudity",
      "contains explicit sexual",
      "contains pornography",
      "contains gore",
      "contains graphic violence",
      "unsafe content"
    ];

    const safe = [
      "safe",
      "appropriate",
      "clean",
      "no nudity",
      "no nsfw",
      "no sexual content",
      "no violence"
    ];

    const isUnsafe = unsafe.some(x => analysis.includes(x));
    const isSafe = safe.some(x => analysis.includes(x));

    if (isUnsafe && !isSafe) {
      log("🚫 Unsafe sticker removed", analysis);

      await bot.deleteMessage(post.chat.id, post.message_id);

      incrementChatFlags(post.chat.id, post.chat.title);

      return;
    }

  } catch (err) {
    console.error("Sticker AI moderation failed:", err.message);
  }
}

    // --- Sticker/GIF Lock: channel posts are always from admins, so this only
    // applies if you want to block ALL stickers/GIFs regardless of who posts ---
// --- Sticker/GIF Lock ---
if (isStickerLockEnabled(post.chat.id)) {

  // Allow animated (.tgs) and video (.webm) stickers
  if (
    post.sticker &&
    (post.sticker.is_animated || post.sticker.is_video)
  ) {
    return;
  }

  // Block static stickers and GIFs
  if (
    (post.sticker && !post.sticker.is_animated && !post.sticker.is_video) ||
    post.animation
  ) {
    log("Flagged sticker/GIF (Sticker Lock) in channel", post.chat.id);

    try {
      await bot.deleteMessage(post.chat.id, post.message_id);
    } catch (err) {
      console.error("Failed to delete sticker/GIF channel post:", err.message);
    }

    incrementChatFlags(post.chat.id, post.chat.title);
    return;
  }
}
    if (post.photo) {
      const photo = post.photo[post.photo.length - 1];
      const buf = await downloadFileToBuffer(photo.file_id);

      const hash = await computeImageHash(buf);
      const match = matchBannedImage(hash);
      if (match) {
        log("Banned reference image matched (", match.label, ") in channel", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete banned-image channel post", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
        return;
      }

      const base64Data = buf.toString("base64");
      const flagged = await classifyImage(buf, base64Data, "image/jpeg", post.chat.id);
      if (flagged) {
        log("Flagged image (Sightengine/custom rule) in channel", post.chat.id);
        try {
          await bot.deleteMessage(post.chat.id, post.message_id);
        } catch (err) {
          console.error("Failed to delete flagged channel post image", err.message);
        }
        incrementChatFlags(post.chat.id, post.chat.title);
      }
    }
  } catch (err) {
    console.error("Error handling channel_post", err.message);
  }
});

bot.on("edited_channel_post", async (post) => {
  if (!isEditLockEnabled(post.chat.id)) return;

  try {
    await bot.deleteMessage(post.chat.id, post.message_id);

    log("Deleted edited channel post", post.chat.id);

    const ownerId = await getOwnerId(post.chat.id).catch(() => null);

    if (ownerId) {
      await bot.sendMessage(
        ownerId,
        `✏️🚫 *Edited post auto-deleted*\n\n*Chat:* ${
          post.chat.title || post.chat.id
        }\n\nEditing published posts isn't allowed here.`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    console.error("Failed to delete edited channel post:", err.message);
  }
});

bot.on("edited_message", async (msg) => {
  if (
    msg.chat.type !== "group" &&
    msg.chat.type !== "supergroup"
  ) {
    return;
  }

  if (!isEditLockEnabled(msg.chat.id)) return;

  try {
    const admins = await bot.getChatAdministrators(msg.chat.id);

    const isAdmin = admins.some(
      (admin) => admin.user.id === msg.from.id
    );

    // Only delete edits made by admins
    if (!isAdmin) return;

    await bot.deleteMessage(msg.chat.id, msg.message_id);

    log("Deleted admin-edited message in", msg.chat.id);
  } catch (err) {
    console.error("Failed to delete edited message:", err.message);
  }
});
}

module.exports = register;
