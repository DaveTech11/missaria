// ============================================================
// features3.js
// Group management commands (from the Miss Tyra screenshot):
// group info setters, invite links, admin management, warns,
// mute/kick/ban, whole-group + specific locks, member tags,
// and reaction/message cleanup.
//
// Reuses existing bot.js infra (warnUser, muteUser, tryDemote,
// lockChat, the toggleXLock family, getChatSettings, isBotAdmin)
// via ctx instead of re-implementing it.
// ============================================================

module.exports = function registerFeatures3(bot, ctx) {
  const {
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
  } = ctx;

  const WARN_LIMIT = 3;
  const send = (chatId, text, extra) => bot.sendMessage(chatId, text, extra);

  // ------------------------------------------------------------
  // Permission gate: Telegram group admin/creator, OR a bot admin
  // ------------------------------------------------------------
  async function canManageThisGroup(chatId, userId) {
    if (isBotAdmin(userId)) return true;
    try {
      const member = await bot.getChatMember(chatId, userId);
      return member.status === "administrator" || member.status === "creator";
    } catch {
      return false;
    }
  }

  async function requireGroupAdmin(msg) {
    if (msg.chat.type === "private") {
      await send(msg.chat.id, "This only works in a group.");
      return false;
    }
    const ok = await canManageThisGroup(msg.chat.id, msg.from.id);
    if (!ok) await send(msg.chat.id, "You need to be a group admin to use this.");
    return ok;
  }

  // ------------------------------------------------------------
  // Resolve a target user: reply > @username/id in the args
  // ------------------------------------------------------------
  async function resolveTarget(msg, argText) {
    if (msg.reply_to_message) {
      return {
        id: msg.reply_to_message.from.id,
        label: msg.reply_to_message.from.first_name || String(msg.reply_to_message.from.id)
      };
    }
    if (argText) return resolveTargetFromMessage({ text: argText.trim() });
    return null;
  }

  function argAfterCommand(msg) {
    const parts = msg.text.trim().split(/\s+/);
    return parts.slice(1).join(" ");
  }

  // ==========================================================
  // GROUP INFO
  // ==========================================================

  bot.onText(/^\/setgrouppic/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const photo = msg.reply_to_message?.photo;
    if (!photo) return send(msg.chat.id, "Reply to a photo with /setgrouppic.");
    try {
      const fileId = photo[photo.length - 1].file_id;
      const link = await bot.getFileLink(fileId);
      const axios = require("axios");
      const res = await axios.get(link, { responseType: "arraybuffer" });
      await bot.setChatPhoto(msg.chat.id, Buffer.from(res.data));
      send(msg.chat.id, "Group photo updated.");
    } catch (err) {
      send(msg.chat.id, `Couldn't set the photo: ${err.message}`);
    }
  });

  bot.onText(/^\/setgroupname\s+([\s\S]+)/, async (msg, match) => {
    if (!(await requireGroupAdmin(msg))) return;
    try {
      await bot.setChatTitle(msg.chat.id, match[1].trim());
      send(msg.chat.id, "Group name updated.");
    } catch (err) {
      send(msg.chat.id, `Couldn't set the name: ${err.message}`);
    }
  });

  bot.onText(/^\/setgroupdesc\s+([\s\S]+)/, async (msg, match) => {
    if (!(await requireGroupAdmin(msg))) return;
    try {
      await bot.setChatDescription(msg.chat.id, match[1].trim());
      send(msg.chat.id, "Group description updated.");
    } catch (err) {
      send(msg.chat.id, `Couldn't set the description: ${err.message}`);
    }
  });

  bot.onText(/^\/(?:link|linkgc|gclink)/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    try {
      const link = await bot.exportChatInviteLink(msg.chat.id);
      send(msg.chat.id, `Invite link: ${link}`);
    } catch (err) {
      send(msg.chat.id, `Couldn't get an invite link: ${err.message}`);
    }
  });

  bot.onText(/^\/(?:adminlist|admins)/, async (msg) => {
    try {
      const admins = await bot.getChatAdministrators(msg.chat.id);
      const list = admins
        .map((a) => `- ${a.user.first_name || a.user.username || a.user.id}${a.status === "creator" ? " (owner)" : ""}`)
        .join("\n");
      send(msg.chat.id, `Admins:\n${list}`);
    } catch (err) {
      send(msg.chat.id, `Couldn't fetch admins: ${err.message}`);
    }
  });

  bot.onText(/^\/tempadmin\s+(\d+)/, async (msg, match) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, null);
    if (!target) return send(msg.chat.id, "Reply to the user with /tempadmin <minutes>.");
    const minutes = parseInt(match[1], 10);

    try {
      await bot.promoteChatMember(msg.chat.id, target.id, {
        can_delete_messages: true,
        can_restrict_members: true,
        can_invite_users: true,
        can_pin_messages: true
      });
      send(msg.chat.id, `${target.label} is admin for ${minutes} minute(s).`);
      setTimeout(() => tryDemote(msg.chat.id, target.id), minutes * 60000);
    } catch (err) {
      send(msg.chat.id, `Couldn't promote: ${err.message}`);
    }
  });

  bot.onText(/^\/promote/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, argAfterCommand(msg));
    if (!target) return send(msg.chat.id, "Reply to (or @mention) the user to promote.");
    try {
      await bot.promoteChatMember(msg.chat.id, target.id, {
        can_delete_messages: true,
        can_restrict_members: true,
        can_invite_users: true,
        can_pin_messages: true,
        can_manage_chat: true
      });
      send(msg.chat.id, `Promoted ${target.label}.`);
    } catch (err) {
      send(msg.chat.id, `Couldn't promote: ${err.message}`);
    }
  });

  bot.onText(/^\/demote/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, argAfterCommand(msg));
    if (!target) return send(msg.chat.id, "Reply to (or @mention) the user to demote.");
    const ok = await tryDemote(msg.chat.id, target.id);
    send(msg.chat.id, ok ? `Demoted ${target.label}.` : "Couldn't demote them (likely the creator or a higher-ranked admin).");
  });

  // ==========================================================
  // WARNINGS
  // ==========================================================

  bot.onText(/^\/warn(?:\s+([\s\S]+))?/, async (msg, match) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, null);
    if (!target) return send(msg.chat.id, "Reply to the user with /warn [reason].");
    await warnUser(msg.chat.id, target.id, target.label, match[1] || "no reason given");
  });

  bot.onText(/^\/warns/, async (msg) => {
    const target = (await resolveTarget(msg, null)) || { id: msg.from.id, label: msg.from.first_name };
    const settings = getChatSettings(msg.chat.id);
    const count = (settings.warns && settings.warns[target.id]) || 0;
    send(msg.chat.id, `${target.label}: ${count}/${WARN_LIMIT} warnings.`);
  });

  bot.onText(/^\/resetwarns/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, null);
    if (!target) return send(msg.chat.id, "Reply to the user with /resetwarns.");
    const settings = getChatSettings(msg.chat.id);
    if (settings.warns) settings.warns[target.id] = 0;
    saveStore();
    send(msg.chat.id, `Warnings reset for ${target.label}.`);
  });

  // ==========================================================
  // MUTE / KICK / BAN
  // ==========================================================

  bot.onText(/^\/mute(?:\s+(\d+)([mhd]))?/, async (msg, match) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, null);
    if (!target) return send(msg.chat.id, "Reply to the user with /mute [duration, e.g. 10m].");

    let ms = 100 * 365 * 24 * 3600 * 1000; // effectively permanent
    if (match[1]) {
      const n = parseInt(match[1], 10);
      ms = match[2] === "m" ? n * 60000 : match[2] === "h" ? n * 3600000 : n * 86400000;
    }
    const ok = await muteUser(msg.chat.id, target.id, ms);
    send(msg.chat.id, ok ? `Muted ${target.label}.` : "Couldn't mute them (likely an admin).");
  });

  bot.onText(/^\/unmute/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, null);
    if (!target) return send(msg.chat.id, "Reply to the user with /unmute.");
    try {
      await bot.restrictChatMember(msg.chat.id, target.id, {
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
        }
      });
      send(msg.chat.id, `Unmuted ${target.label}.`);
    } catch (err) {
      send(msg.chat.id, `Couldn't unmute: ${err.message}`);
    }
  });

  bot.onText(/^\/kick/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, argAfterCommand(msg));
    if (!target) return send(msg.chat.id, "Reply to (or @mention) the user to kick.");
    try {
      await bot.banChatMember(msg.chat.id, target.id);
      await bot.unbanChatMember(msg.chat.id, target.id);
      send(msg.chat.id, `Kicked ${target.label}.`);
    } catch (err) {
      send(msg.chat.id, `Couldn't kick: ${err.message}`);
    }
  });

  bot.onText(/^\/ban/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, argAfterCommand(msg));
    if (!target) return send(msg.chat.id, "Reply to (or @mention) the user to ban.");
    try {
      await bot.banChatMember(msg.chat.id, target.id);
      send(msg.chat.id, `Banned ${target.label}.`);
    } catch (err) {
      send(msg.chat.id, `Couldn't ban: ${err.message}`);
    }
  });

  bot.onText(/^\/unban/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const target = await resolveTarget(msg, argAfterCommand(msg));
    if (!target) return send(msg.chat.id, "Reply to (or give the ID/@username of) the user to unban.");
    try {
      await bot.unbanChatMember(msg.chat.id, target.id, { only_if_banned: true });
      send(msg.chat.id, `Unbanned ${target.label}.`);
    } catch (err) {
      send(msg.chat.id, `Couldn't unban: ${err.message}`);
    }
  });

  // ==========================================================
  // WHOLE-GROUP LOCK
  // ==========================================================

  bot.onText(/^\/lock$/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    await lockChat(msg.chat.id);
    send(msg.chat.id, "Group locked — only admins can post.");
  });

  bot.onText(/^\/unlock$/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    try {
      await bot.setChatPermissions(msg.chat.id, {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: false
      });
      send(msg.chat.id, "Group unlocked.");
    } catch (err) {
      send(msg.chat.id, `Couldn't unlock: ${err.message}`);
    }
  });

  // ==========================================================
  // SPECIFIC LOCKS
  // ==========================================================

  function isLockTextEnabled(chatId) { return getChatSettings(chatId).lockText === true; }
  function isLockMediaEnabled(chatId) { return getChatSettings(chatId).lockMedia === true; }
  function isLockPollsEnabled(chatId) { return getChatSettings(chatId).lockPolls === true; }

  function toggleFlag(chatId, key) {
    const s = getChatSettings(chatId);
    s[key] = !s[key];
    saveStore();
    return s[key];
  }

  bot.onText(/^\/locktext/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const on = toggleFlag(msg.chat.id, "lockText");
    send(msg.chat.id, `Text lock: ${on ? "ON" : "OFF"}`);
  });
  bot.onText(/^\/unlocktext/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    getChatSettings(msg.chat.id).lockText = false;
    saveStore();
    send(msg.chat.id, "Text lock: OFF");
  });

  bot.onText(/^\/lockmedia/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const on = toggleFlag(msg.chat.id, "lockMedia");
    send(msg.chat.id, `Media lock: ${on ? "ON" : "OFF"}`);
  });
  bot.onText(/^\/unlockmedia/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    getChatSettings(msg.chat.id).lockMedia = false;
    saveStore();
    send(msg.chat.id, "Media lock: OFF");
  });

  bot.onText(/^\/lockpolls/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const on = toggleFlag(msg.chat.id, "lockPolls");
    send(msg.chat.id, `Poll lock: ${on ? "ON" : "OFF"}`);
  });
  bot.onText(/^\/unlockpolls/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    getChatSettings(msg.chat.id).lockPolls = false;
    saveStore();
    send(msg.chat.id, "Poll lock: OFF");
  });

  // Already existed as toggles — just adding the slash-command wrappers
  bot.onText(/^\/lockstickers/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const on = isStickerLockEnabled(msg.chat.id) || toggleStickerLock(msg.chat.id);
    send(msg.chat.id, `Sticker/GIF lock: ${on ? "ON" : "OFF"}`);
  });
  bot.onText(/^\/unlockstickers/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    if (isStickerLockEnabled(msg.chat.id)) toggleStickerLock(msg.chat.id);
    send(msg.chat.id, "Sticker/GIF lock: OFF");
  });

  bot.onText(/^\/locklinks/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    const on = isLinkLockEnabled(msg.chat.id) || toggleLinkLock(msg.chat.id);
    send(msg.chat.id, `Link lock: ${on ? "ON" : "OFF"}`);
  });
  bot.onText(/^\/unlocklinks/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    if (isLinkLockEnabled(msg.chat.id)) toggleLinkLock(msg.chat.id);
    send(msg.chat.id, "Link lock: OFF");
  });

  // Reactions: Telegram's Bot API has no way to strip an individual
  // member's reaction, so real enforcement is chat-wide via
  // setChatAvailableReactions (disables reacting entirely), not
  // per-message deletion like the other locks.
  bot.onText(/^\/lockreactions/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    try {
      await bot.setChatAvailableReactions(msg.chat.id, { type: "empty" });
      send(msg.chat.id, "Reactions disabled for this group.");
    } catch (err) {
      send(msg.chat.id, `Couldn't disable reactions: ${err.message}`);
    }
  });
  bot.onText(/^\/unlockreactions/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    try {
      await bot.setChatAvailableReactions(msg.chat.id, { type: "all" });
      send(msg.chat.id, "Reactions re-enabled for this group.");
    } catch (err) {
      send(msg.chat.id, `Couldn't re-enable reactions: ${err.message}`);
    }
  });

  // ==========================================================
  // MEMBER TAGS
  // ==========================================================

  bot.onText(/^\/tag(?:\s+([\s\S]+))?/, async (msg, match) => {
    const target = await resolveTarget(msg, null);
    if (!target || !match[1]) return send(msg.chat.id, "Reply to a member with /tag <label>.");
    const s = getChatSettings(msg.chat.id);
    if (!s.tags) s.tags = {};
    s.tags[target.id] = match[1].trim();
    saveStore();
    send(msg.chat.id, `Tagged ${target.label} as "${match[1].trim()}".`);
  });

  bot.onText(/^\/untag/, async (msg) => {
    const target = await resolveTarget(msg, null);
    if (!target) return send(msg.chat.id, "Reply to a tagged member with /untag.");
    const s = getChatSettings(msg.chat.id);
    if (s.tags) delete s.tags[target.id];
    saveStore();
    send(msg.chat.id, `Removed ${target.label}'s tag.`);
  });

  // ==========================================================
  // REACTIONS & CLEANUP
  // ==========================================================

  // Real limitation, stated up front: bots can only set/clear their
  // OWN reaction via the Bot API — there's no endpoint to strip a
  // reaction a regular member added. /lockreactions above (chat-wide
  // disable) is the actual enforcement tool; these two are best-effort.
  bot.onText(/^\/clearreactions/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    if (!msg.reply_to_message) return send(msg.chat.id, "Reply to the message with /clearreactions.");
    try {
      await bot.setMessageReaction(msg.chat.id, msg.reply_to_message.message_id, { reaction: [] });
      send(msg.chat.id, "Cleared the bot's reaction on that message. Note: Telegram's Bot API doesn't let bots remove reactions added by other members — use /lockreactions to disable reacting chat-wide instead.");
    } catch (err) {
      send(msg.chat.id, `Couldn't clear: ${err.message}`);
    }
  });

  bot.onText(/^\/delreaction/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    send(msg.chat.id, "Telegram's Bot API doesn't support removing a specific member's reaction — only the bot's own. Use /lockreactions to disable reacting chat-wide instead.");
  });

  bot.onText(/^\/del$/, async (msg) => {
    if (!(await requireGroupAdmin(msg))) return;
    if (!msg.reply_to_message) return send(msg.chat.id, "Reply to the message you want deleted with /del.");
    try {
      await bot.deleteMessage(msg.chat.id, msg.reply_to_message.message_id);
    } catch (err) {
      send(msg.chat.id, `Couldn't delete: ${err.message}`);
    }
  });

  // ==========================================================
  // ENFORCEMENT for the 3 new specific locks (text/media/polls)
  // Mirrors how the existing sticker/link locks are enforced.
  // ==========================================================

  bot.on("message", async (msg) => {
    if (msg.chat.type === "private" || !msg.from) return;
    if (msg.text && msg.text.startsWith("/")) return;

    try {
      const isAdmin = await canManageThisGroup(msg.chat.id, msg.from.id);
      if (isAdmin) return;

      if (isLockTextEnabled(msg.chat.id) && msg.text) {
        await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
        return;
      }
      if (isLockMediaEnabled(msg.chat.id) && (msg.photo || msg.video || msg.document || msg.audio)) {
        await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
        return;
      }
      if (isLockPollsEnabled(msg.chat.id) && msg.poll) {
        await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
        return;
      }
    } catch {
      // fail open — never block normal chat because a permission check errored
    }
  });
};
