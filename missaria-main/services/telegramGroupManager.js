'use strict';

/**
 * Secure Telegram group management layer for Miss Aria.
 * Uses only allow-listed Telegram Bot API operations; no eval/shell/filesystem execution.
 */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isGroupChat(chat) {
  return chat && (chat.type === 'group' || chat.type === 'supergroup');
}

function isAdminStatus(status) {
  return status === 'administrator' || status === 'creator';
}

async function userIsGroupAdmin(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return isAdminStatus(member.status);
  } catch {
    return false;
  }
}

async function botIsAdmin(bot, chatId) {
  try {
    const me = await bot.getMe();
    const member = await bot.getChatMember(chatId, me.id);
    return isAdminStatus(member.status);
  } catch {
    return false;
  }
}

function manageKeyboard(chatId) {
  const id = String(chatId);
  return {
    inline_keyboard: [
      [
        { text: '🛡 Moderation', callback_data: `tg_group_mod_${id}` },
        { text: '👥 Admins', callback_data: `tg_group_admins_${id}` },
      ],
      [
        { text: '👤 Participants', callback_data: `tg_group_participants_${id}` },
        { text: '🔗 Anti-Link', callback_data: `tg_group_antlink_${id}` },
      ],
      [
        { text: '🔒 Lock', callback_data: `tg_group_lock_${id}` },
        { text: '🔓 Unlock', callback_data: `tg_group_unlock_${id}` },
      ],
    ],
  };
}

function ownerGroupMenu(botUsername) {
  const addUrl = botUsername ? `https://t.me/${botUsername}?startgroup=true` : null;
  return {
    inline_keyboard: [
      [
        ...(addUrl ? [{ text: '➕ Add to Group', url: addUrl }] : []),
        { text: '🛡 Manage My Groups', callback_data: 'tg_my_groups' },
      ],
    ],
  };
}

async function sendGroupIntentMenu(bot, chatId) {
  const me = await bot.getMe();
  return bot.sendMessage(
    chatId,
    '<b>👥 Telegram Group Control</b>\n\n' +
      'I can manage supported Telegram groups where I am present and where you have admin rights.\n\n' +
      'Choose an option below.\n\n' +
      '<i>Note: Telegram does not expose an API that lets a bot enumerate every group a user personally belongs to. ' +
      'The manager therefore lists groups Miss Aria knows about and verifies your admin status live.</i>',
    { parse_mode: 'HTML', reply_markup: ownerGroupMenu(me.username) }
  );
}

async function sendMyGroups(bot, state, saveStore, addChat, userId, destinationChatId) {
  const known = state.users?.[String(userId)]?.chats || [];
  const groups = [];

  for (const chat of known) {
    if (!chat || !isGroupChat(chat)) continue;
    if (await userIsGroupAdmin(bot, chat.id, userId)) {
      groups.push(chat);
    }
  }

  if (!groups.length) {
    return bot.sendMessage(
      destinationChatId,
      '🛡 <b>No managed groups found.</b>\n\nAdd Miss Aria to a group first, then make sure you are a Telegram admin there.',
      { parse_mode: 'HTML' }
    );
  }

  const rows = groups.slice(0, 50).map((chat, index) => [
    { text: `${index + 1}. ${String(chat.title || chat.id).slice(0, 40)}`, callback_data: `tg_manage_${chat.id}` },
  ]);

  return bot.sendMessage(
    destinationChatId,
    `👥 <b>Your managed groups</b>\n\nI verified that you are an admin in <b>${groups.length}</b> group${groups.length === 1 ? '' : 's'}.\n\nTap a group to manage it.`,
    { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } }
  );
}

function registerTelegramGroupManager({ bot, state, saveStore, addChat }) {
  if (!bot) throw new Error('Telegram group manager requires bot');

  // Natural-language entry point. The existing command handlers remain untouched.
  bot.on('message', async (msg) => {
    try {
      if (!msg?.from || !msg.text || msg.text.startsWith('/')) return;
      const text = msg.text.trim().toLowerCase();
      if (!/(manage|control).*(telegram|group)|telegram.*group.*(manage|control)|manage my group|manage my groups/.test(text)) return;
      await sendGroupIntentMenu(bot, msg.chat.id);
    } catch (err) {
      console.error('[TG GROUP INTENT]', err?.message || err);
    }
  });

  // When Miss Aria is added, notify the person who added her in DM.
  bot.on('new_chat_members', async (msg) => {
    try {
      if (!isGroupChat(msg.chat) || !msg.new_chat_members?.length) return;
      const me = await bot.getMe();
      if (!msg.new_chat_members.some((m) => m.id === me.id)) return;

      if (msg.from?.id) {
        // Track the group for this user; admin status is always re-verified before control.
        if (typeof addChat === 'function') addChat(msg.from.id, msg.chat);

        const botAdmin = await botIsAdmin(bot, msg.chat.id);
        const groupTitle = escapeHtml(msg.chat.title || 'this group');
        const keyboard = botAdmin
          ? { inline_keyboard: [[{ text: '🛡 Manage Group', callback_data: `tg_manage_${msg.chat.id}` }], [{ text: 'Later', callback_data: 'tg_later' }]] }
          : { inline_keyboard: [[{ text: '👑 Make Me Admin', callback_data: `tg_make_admin_${msg.chat.id}` }], [{ text: 'Later', callback_data: 'tg_later' }]] };

        await bot.sendMessage(
          msg.from.id,
          `🌸 <b>Miss Aria was added to ${groupTitle}</b>\n\n` +
            (botAdmin
              ? 'I already have admin access there. You can manage the group directly from this DM.'
              : 'I am a member, but I do not have admin rights yet. Make me an administrator to unlock supported moderation controls.'),
          { parse_mode: 'HTML', reply_markup: keyboard }
        ).catch(() => {});
      }
    } catch (err) {
      console.error('[TG GROUP JOIN]', err?.message || err);
    }
  });

  bot.on('callback_query', async (query) => {
    const data = String(query.data || '');
    if (!data.startsWith('tg_')) return;

    try {
      await bot.answerCallbackQuery(query.id);
      const userId = query.from.id;
      const destination = query.message?.chat?.id || userId;

      if (data === 'tg_later') {
        return bot.editMessageText('👍 No problem. You can manage the group from this DM whenever you are ready.', {
          chat_id: destination,
          message_id: query.message.message_id,
          parse_mode: 'HTML',
        }).catch(() => {});
      }

      if (data === 'tg_my_groups') {
        return sendMyGroups(bot, state, saveStore, addChat, userId, destination);
      }

      if (data.startsWith('tg_make_admin_')) {
        const groupId = data.slice('tg_make_admin_'.length);
        if (!(await userIsGroupAdmin(bot, groupId, userId))) {
          return bot.sendMessage(destination, '❌ I could not verify that you are an admin of this group. Only a group admin can authorize this setup.');
        }
        const chat = await bot.getChat(groupId).catch(() => null);
        const title = escapeHtml(chat?.title || groupId);
        return bot.sendMessage(
          destination,
          `👑 <b>Make Miss Aria an admin in ${title}</b>\n\n` +
            'Telegram does not allow a bot to promote itself. Open the group, go to <b>Administrators</b>, add <b>Miss Aria</b>, and grant the permissions you want her to use.\n\n' +
            'After that, send me <b>Manage my groups</b> here and I will verify the permissions live.',
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🛡 Check Again', callback_data: `tg_manage_${groupId}` }]] } }
        );
      }

      if (data.startsWith('tg_manage_')) {
        const groupId = data.slice('tg_manage_'.length);
        if (!(await userIsGroupAdmin(bot, groupId, userId))) {
          return bot.sendMessage(destination, '🔒 Access denied. You must be an admin in that Telegram group.');
        }
        if (!(await botIsAdmin(bot, groupId))) {
          return bot.sendMessage(destination, '⚠️ I am not an admin in that group yet. Tap <b>Make Me Admin</b> in the setup message first.', { parse_mode: 'HTML' });
        }
        const chat = await bot.getChat(groupId).catch(() => null);
        const title = escapeHtml(chat?.title || groupId);
        return bot.sendMessage(destination, `🛡 <b>Managing ${title}</b>\n\nChoose a supported operation:`, { parse_mode: 'HTML', reply_markup: manageKeyboard(groupId) });
      }

      const parts = data.split('_');
      const action = parts[2];
      const groupId = parts.slice(3).join('_');
      if (!groupId) return;
      if (!(await userIsGroupAdmin(bot, groupId, userId))) {
        return bot.sendMessage(destination, '🔒 Access denied. You must be an admin in that group.');
      }
      if (!(await botIsAdmin(bot, groupId))) {
        return bot.sendMessage(destination, '⚠️ Miss Aria is not an admin in that group, so Telegram will not allow this operation.');
      }

      if (action === 'admins') {
        const admins = await bot.getChatAdministrators(groupId);
        const lines = admins.map((a, i) => `${i + 1}. ${escapeHtml([a.user.first_name, a.user.last_name].filter(Boolean).join(' ') || a.user.username || a.user.id)}`);
        return bot.sendMessage(destination, `👑 <b>Group admins</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
      }

      if (action === 'participants') {
        // Telegram Bot API does not expose a complete participant-list endpoint.
        return bot.sendMessage(destination, '⚠️ Telegram Bot API does not expose a complete group participant list. I can manage known participants when their user IDs are available, but I will not invent a list.');
      }

      if (action === 'lock') {
        await bot.setChatPermissions(groupId, { can_send_messages: false });
        return bot.sendMessage(destination, '🔒 <b>Group locked.</b> Non-admin members can no longer send messages.', { parse_mode: 'HTML' });
      }

      if (action === 'unlock') {
        await bot.setChatPermissions(groupId, {
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
        });
        return bot.sendMessage(destination, '🔓 <b>Group unlocked.</b>', { parse_mode: 'HTML' });
      }

      if (action === 'antlink') {
        // Reuse the project's existing, per-chat link-lock setting when available.
        const settings = state.chatSettings || (state.chatSettings = {});
        const key = String(groupId);
        settings[key] = settings[key] || {};
        settings[key].lockLinks = !settings[key].lockLinks;
        saveStore();
        return bot.sendMessage(destination, `🔗 <b>Anti-link:</b> ${settings[key].lockLinks ? 'ON 🟢' : 'OFF 🔴'}`, { parse_mode: 'HTML' });
      }

      if (action === 'mod') {
        const admins = await bot.getChatAdministrators(groupId);
        return bot.sendMessage(destination,
          `🛡 <b>Moderation status</b>\n\n` +
          `Bot Admin: ${isAdminStatus((await bot.getChatMember(groupId, (await bot.getMe()).id)).status) ? '🟢 YES' : '🔴 NO'}\n` +
          `Anti-Link: ${(state.chatSettings?.[String(groupId)]?.lockLinks === true) ? '🟢 ON' : '🔴 OFF'}\n` +
          `Admins: ${admins.length}`,
          { parse_mode: 'HTML' }
        );
      }
    } catch (err) {
      console.error('[TG GROUP MANAGER]', err?.response?.body || err?.message || err);
      try {
        await bot.sendMessage(query.message?.chat?.id || query.from.id, '❌ I could not complete that operation. Telegram rejected or does not support the requested action.');
      } catch {}
    }
  });
}

module.exports = { registerTelegramGroupManager, sendGroupIntentMenu };
