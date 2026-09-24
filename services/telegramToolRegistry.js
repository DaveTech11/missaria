'use strict';

/**
 * Miss Aria Telegram Tool Registry
 * Every owner-center action goes through this allow-list and the shared
 * node-telegram-bot-api instance. No raw Telegram HTTP calls, eval, shell,
 * arbitrary filesystem access, or arbitrary method dispatch are exposed.
 */

const fs = require('fs');
const path = require('path');

function ok(data) { return { success: true, data }; }
function fail(code, message) { return { success: false, error: { code, message } }; }
function groupType(chat) { return chat && (chat.type === 'group' || chat.type === 'supergroup'); }
function cleanText(v, max = 4000) { return String(v ?? '').trim().slice(0, max); }

function createRegistry({ bot, state, saveStore, ownerId, knownGroups, accessControl }) {
  const ownerOnly = (id) => !!ownerId && String(id) === String(ownerId);

  async function requireOwner(id) {
    if (!ownerOnly(id)) throw Object.assign(new Error('Owner access only.'), { code: 'UNAUTHORIZED' });
  }

  async function requireGroup(id, userId, needBotAdmin = false) {
    if (accessControl) {
      const access = await accessControl.canControl(userId, id);
      if (!access.ok) throw Object.assign(new Error(access.message), { code: access.code });
    } else {
      await requireOwner(userId);
    }
    const chatId = String(id);
    const member = await bot.getChatMember(chatId, userId).catch(() => null);
    if (!member || !['creator', 'administrator'].includes(member.status)) {
      throw Object.assign(new Error('You must be an admin in that Telegram group.'), { code: 'GROUP_ADMIN_REQUIRED' });
    }
    const chat = await bot.getChat(chatId);
    if (!groupType(chat)) throw Object.assign(new Error('That chat is not a Telegram group.'), { code: 'NOT_A_GROUP' });
    if (needBotAdmin) {
      const me = await bot.getMe();
      const bm = await bot.getChatMember(chatId, me.id).catch(() => null);
      if (!bm || !['creator', 'administrator'].includes(bm.status)) {
        throw Object.assign(new Error('Miss Aria must be an administrator in that group.'), { code: 'BOT_ADMIN_REQUIRED' });
      }
    }
    return chat;
  }

  async function setPermissions(chatId, enabled) {
    if (!enabled) {
      await bot.setChatPermissions(chatId, { can_send_messages: false });
      return;
    }
    await bot.setChatPermissions(chatId, {
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
  }

  const tools = {
    status: async ({ userId }) => {
      await requireOwner(userId);
      const me = await bot.getMe();
      return ok({ online: true, botId: me.id, username: me.username || null });
    },

    listGroups: async ({ userId }) => {
      const groups = accessControl && !ownerOnly(userId) ? await accessControl.controllableGroups(userId) : await knownGroups(userId);
      return ok(groups.map(c => ({ id: String(c.id), title: c.title || String(c.id), type: c.type })));
    },

    groupInfo: async ({ userId, chatId }) => {
      const chat = await requireGroup(chatId, userId, false);
      return ok({ id: String(chat.id), title: chat.title || '', type: chat.type, username: chat.username || null, description: chat.description || null });
    },

    groupAdmins: async ({ userId, chatId }) => {
      await requireGroup(chatId, userId, true);
      // Telegram Bot API exposes administrators, not a complete participant list.
      const admins = await bot.getChatAdministrators(chatId);
      return ok(admins.map(m => ({ id: m.user.id, name: [m.user.first_name, m.user.last_name].filter(Boolean).join(' '), username: m.user.username || null, status: m.status })));
    },

    lockGroup: async ({ userId, chatId, locked }) => {
      await requireGroup(chatId, userId, true);
      await setPermissions(chatId, !locked);
      return ok({ chatId: String(chatId), locked: !!locked });
    },

    antiLink: async ({ userId, chatId, enabled }) => {
      await requireGroup(chatId, userId, true);
      state.chatSettings = state.chatSettings || {};
      const key = String(chatId);
      state.chatSettings[key] = state.chatSettings[key] || {};
      state.chatSettings[key].lockLinks = !!enabled;
      saveStore();
      return ok({ chatId: key, enabled: !!enabled });
    },

    setAdminRole: async ({ userId, chatId, targetUserId, promoted }) => {
      await requireGroup(chatId, userId, true);
      const uid = Number(targetUserId);
      if (!Number.isSafeInteger(uid) || uid <= 0) throw Object.assign(new Error('Invalid Telegram user ID.'), { code: 'INVALID_USER' });
      if (promoted) {
        await bot.promoteChatMember(chatId, uid, {
          can_manage_chat: true,
          can_delete_messages: true,
          can_manage_video_chats: true,
          can_restrict_members: true,
          can_promote_members: false,
          can_change_info: true,
          can_invite_users: true,
          can_pin_messages: true,
        });
      } else {
        await bot.promoteChatMember(chatId, uid, {
          can_manage_chat: false, can_delete_messages: false, can_manage_video_chats: false,
          can_restrict_members: false, can_promote_members: false, can_change_info: false,
          can_invite_users: false, can_pin_messages: false,
        });
      }
      return ok({ chatId: String(chatId), targetUserId: uid, promoted: !!promoted });
    },

    moderate: async ({ userId, chatId, targetUserId, action, durationMs, reason }) => {
      await requireGroup(chatId, userId, true);
      const uid = Number(targetUserId);
      if (!Number.isSafeInteger(uid) || uid <= 0) throw Object.assign(new Error('Invalid Telegram user ID.'), { code: 'INVALID_USER' });
      const why = cleanText(reason, 500) || 'Owner action';
      if (['ban', 'kick'].includes(action)) {
        await bot.banChatMember(chatId, uid, durationMs ? { until_date: Math.floor((Date.now() + durationMs) / 1000) } : {});
        if (action === 'kick') await bot.unbanChatMember(chatId, uid).catch(() => {});
      } else if (action === 'unban') {
        await bot.unbanChatMember(chatId, uid, { only_if_banned: true });
      } else if (action === 'mute') {
        const until = durationMs ? Math.floor((Date.now() + durationMs) / 1000) : 0;
        await bot.restrictChatMember(chatId, uid, {
          permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false },
          ...(until ? { until_date: until } : {})
        });
      } else if (action === 'unmute') {
        await bot.restrictChatMember(chatId, uid, { permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true, can_add_web_page_previews: true } });
      } else {
        throw Object.assign(new Error('Unsupported moderation action.'), { code: 'ACTION_NOT_ALLOWED' });
      }
      return ok({ chatId: String(chatId), targetUserId: uid, action, reason: why });
    },

    warn: async ({ userId, chatId, targetUserId, reason }) => {
      await requireGroup(chatId, userId, true);
      const settings = state.chatSettings = state.chatSettings || {};
      const key = String(chatId);
      settings[key] = settings[key] || {};
      settings[key].warns = settings[key].warns || {};
      const uid = String(Number(targetUserId));
      settings[key].warns[uid] = (settings[key].warns[uid] || 0) + 1;
      saveStore();
      const count = settings[key].warns[uid];
      await bot.sendMessage(chatId, `⚠️ Warning ${count}/3 for <code>${uid}</code>\n${cleanText(reason, 500) || 'Owner moderation action'}`, { parse_mode: 'HTML' });
      return ok({ count });
    },

    sendMessage: async ({ userId, chatId, text, options }) => {
      if (!ownerOnly(userId)) await requireGroup(chatId, userId, false);
      else await requireOwner(userId);
      const body = cleanText(text);
      if (!body) throw Object.assign(new Error('Message text is empty.'), { code: 'INVALID_MESSAGE' });
      const sent = await bot.sendMessage(String(chatId), body, options && typeof options === 'object' ? options : {});
      if (!sent || !sent.message_id) throw Object.assign(new Error('Telegram did not confirm the message.'), { code: 'DELIVERY_UNCONFIRMED' });
      return ok({ messageId: sent.message_id, chatId: String(chatId) });
    },

    emergencyLockdown: async ({ userId, enabled }) => {
      await requireOwner(userId);
      const groups = await knownGroups(userId);
      const results = [];
      for (const group of groups) {
        try {
          await requireGroup(group.id, userId, true);
          await setPermissions(group.id, !enabled);
          results.push({ id: String(group.id), title: group.title, success: true });
        } catch (e) {
          results.push({ id: String(group.id), title: group.title, success: false, error: e.message });
        }
      }
      state.ariaEmergencyMode = !!enabled;
      saveStore();
      return ok({ enabled: !!enabled, results });
    },

    updateGroupTitle: async ({ userId, chatId, title }) => {
      await requireGroup(chatId, userId, true);
      const value = cleanText(title, 255);
      if (!value) throw Object.assign(new Error('Group title is empty.'), { code: 'INVALID_TITLE' });
      await bot.setChatTitle(chatId, value);
      return ok({ title: value });
    },

    updateGroupDescription: async ({ userId, chatId, description }) => {
      await requireGroup(chatId, userId, true);
      await bot.setChatDescription(chatId, cleanText(description, 255));
      return ok({ description: cleanText(description, 255) });
    },

    pinMessage: async ({ userId, chatId, messageId, disableNotification }) => {
      await requireGroup(chatId, userId, true);
      await bot.pinChatMessage(chatId, Number(messageId), { disable_notification: !!disableNotification });
      return ok({ messageId: Number(messageId) });
    },

    unpinMessage: async ({ userId, chatId, messageId }) => {
      await requireGroup(chatId, userId, true);
      if (messageId) await bot.unpinChatMessage(chatId, Number(messageId));
      else await bot.unpinAllChatMessages(chatId);
      return ok({ messageId: messageId ? Number(messageId) : null });
    },
  };

  async function execute(name, params = {}) {
    if (!Object.prototype.hasOwnProperty.call(tools, name)) return fail('UNKNOWN_TOOL', `Unknown Telegram tool: ${name}`);
    try { return await tools[name](params); }
    catch (e) { return fail(e.code || 'TELEGRAM_ERROR', e.message || 'Telegram operation failed.'); }
  }

  return { execute, names: Object.keys(tools), ownerOnly, requireGroup };
}

module.exports = { createRegistry };
