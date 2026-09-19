'use strict';

/** Telegram group-controller authorization.
 * Owner keeps global control. Non-owners may control only groups where they are
 * currently administrator/creator and Miss Aria is currently administrator/creator.
 */
function setup({ bot, state, saveStore, ownerId }) {
  const isOwner = id => !!ownerId && String(id) === String(ownerId);
  const isGroup = c => c && (c.type === 'group' || c.type === 'supergroup');

  async function botMember(chatId) {
    const me = await bot.getMe();
    return bot.getChatMember(String(chatId), me.id).catch(() => null);
  }

  async function canControl(userId, chatId) {
    if (isOwner(userId)) return { ok: true, owner: true };
    const id = String(chatId);
    let chat, user, me;
    try {
      chat = await bot.getChat(id);
      if (!isGroup(chat)) return { ok: false, code: 'NOT_A_GROUP', message: 'That chat is not a Telegram group.' };
      user = await bot.getChatMember(id, userId);
      if (!user || !['administrator', 'creator'].includes(user.status)) return { ok: false, code: 'GROUP_ADMIN_REQUIRED', message: 'You must be an admin in that Telegram group.' };
      me = await botMember(id);
      if (!me || !['administrator', 'creator'].includes(me.status)) return { ok: false, code: 'BOT_ADMIN_REQUIRED', message: 'Miss Aria must be an administrator in that group.' };
      return { ok: true, owner: false, chat };
    } catch {
      return { ok: false, code: 'ACCESS_CHECK_FAILED', message: 'I could not verify your admin access to that group.' };
    }
  }

  async function controllableGroups(userId) {
    const out = [];
    const known = state.users?.[String(userId)]?.chats || [];
    for (const c of known.filter(isGroup)) {
      const r = await canControl(userId, c.id);
      if (r.ok) out.push(r.chat || c);
    }
    return out;
  }

  function rememberBotAdded(msg) {
    try {
      const members = msg?.new_chat_members || [];
      const meId = msg?.botId;
      const mine = members.find(x => meId && String(x.id) === String(meId));
      if (!mine || !isGroup(msg.chat)) return;
      state.ariaGroupControllers = state.ariaGroupControllers || {};
      state.ariaGroupControllers[String(msg.chat.id)] = {
        ...(state.ariaGroupControllers[String(msg.chat.id)] || {}),
        addedBy: msg.from?.id ? String(msg.from.id) : null,
        addedAt: new Date().toISOString(),
        title: msg.chat.title || String(msg.chat.id),
      };
      saveStore();
    } catch {}
  }

  return { isOwner, canControl, controllableGroups, rememberBotAdded };
}
module.exports = { setup };
