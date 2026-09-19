'use strict';

module.exports = function registerAgent(ctx) {
  if (!ctx.agent || !ctx.agentRegistry) return;

  const pending = new Map();
  const enabled = String(process.env.ARIA_AGENT_MODE || '').toLowerCase() === 'true';
  const economy = require('../services/economyService');
  const codingAccess = require('../services/codingAccess');
  const isCodingRequest = (value) => /\b(code|coding|program|programming|debug|debugging|developer|develop|script|javascript|typescript|python|node(?:\.js)?|html|css|react|next(?:\.js)?|api|repository|repo|github|git|write.*code|fix.*code|build.*app|create.*app)\b/i.test(String(value || ''));
  const isPremium = (userId) => typeof ctx.isPremiumActive === 'function' ? ctx.isPremiumActive(userId) : (typeof ctx.getPlan === 'function' && ctx.getPlan(userId) === 'premium');

  const send = (chatId, text) => ctx.bot.sendMessage(chatId, text, { parse_mode: 'HTML' });

  if (!enabled) return;

  ctx.bot.onText(/^\/coding(?:\s+(.*))?$/i, async (msg, match) => {
    const userId = String(msg.from?.id || '');
    const sub = String(match?.[1] || '').trim().toLowerCase();
    if (sub === 'status') {
      if (isPremium(userId)) return send(msg.chat.id, '🌸 <b>Coding</b> is included with your Premium plan.');
      const remaining = codingAccess.getRemainingMs(userId);
      if (remaining > 0) return send(msg.chat.id, `🌸 <b>Coding unlocked</b> for <b>${Math.ceil(remaining / 3600000)}h ${Math.ceil((remaining % 3600000) / 60000)}m</b>.`);
      return send(msg.chat.id, `🔒 <b>Premium Coding</b>

Unlock coding for <b>5 hours</b> with <b>${codingAccess.CODING_UNLOCK_POINTS} points</b>.

Your points: <b>${economy.getPoints(userId)}</b>

Use <code>/coding unlock</code>.`);
    }
    if (sub === 'unlock') {
      if (isPremium(userId)) return send(msg.chat.id, '🌸 You already have coding through <b>Premium</b>.');
      const result = codingAccess.unlockCoding(userId, economy.spendPoints);
      if (!result.ok) return send(msg.chat.id, `🔒 <b>Coding unlock failed</b>

${escape(result.reason)}`);
      return send(msg.chat.id, `💻 <b>Coding unlocked!</b>

${codingAccess.CODING_UNLOCK_POINTS} points used.
Access lasts <b>5 hours</b>.

You can now ask Miss Aria to code, debug, build, or work on development tasks.`);
    }
    return send(msg.chat.id, `💻 <b>Premium Coding</b>

• Premium users: <b>included</b>
• Free users: <b>${codingAccess.CODING_UNLOCK_POINTS} points = 5 hours</b>

<code>/coding status</code>
<code>/coding unlock</code>`);
  });

  ctx.bot.onText(/^\/(?:agent|aria)(?:\s+(.+))?$/i, async (msg, match) => {
    const text=String(match?.[1]||'').trim();
    const userId=String(msg.from?.id||'');
    if (!text) {
      return send(msg.chat.id,
        '🌸 <b>Miss Aria Agent</b>\n\n' +
        '<b>Try:</b>\n' +
        '<code>/agent list my groups</code>\n' +
        '<code>/agent check my bot status</code>\n' +
        '<code>/agent remember that I prefer short replies</code>\n\n' +
        '<b>Utilities:</b> <code>/agent skills</code> · <code>/agent tasks</code> · <code>/agent memory</code> · <code>/agent clear</code>');
    }

    if (/^(?:help|about)$/i.test(text)) { return send(msg.chat.id, '🌸 <b>Miss Aria Agent</b>\n\nI can plan multi-step tasks, use approved tools, remember useful details, research public pages, manage files in my safe workspace, create reminders, and help with Telegram groups.'); }
    if (/^tools?$/i.test(text)) { const tools=ctx.agent.tools(userId).list(); return send(msg.chat.id, `🛠️ <b>Agent tools</b>\n\n${tools.map(t=>`• <code>${escape(t.name)}</code> — ${escape(t.risk)}`).join('\n')}`); }
    if (/^skills?$/i.test(text)) {
      const skills=ctx.agent.listSkills();
      return send(msg.chat.id, `🧠 <b>Skills</b>\n\n${skills.length ? skills.map(s=>`• ${s.name}`).join('\n') : 'No skills loaded.'}`);
    }
    if (/^tasks?$/i.test(text)) {
      const tasks=ctx.agent.recentTasks(userId,10);
      return send(msg.chat.id, `📋 <b>Recent agent tasks</b>\n\n${tasks.length ? tasks.map(t=>`#${t.id} — <b>${t.status}</b> — ${escape(String(t.prompt).slice(0,100))}`).join('\n') : 'No tasks yet.'}`);
    }
    if (/^memory$/i.test(text)) {
      const rows=ctx.agent.memory(userId).recent(10);
      return send(msg.chat.id, `🧠 <b>Your Aria memory</b>\n\n${rows.length ? rows.map(r=>`• ${escape(r.content)}`).join('\n') : 'No saved memories.'}`);
    }
    if (/^clear(?:\s+memory)?$/i.test(text)) {
      const count=ctx.agent.clearMemory(userId);
      ctx.agent.clearConversation(userId);
      return send(msg.chat.id, `🧹 Cleared <b>${count}</b> saved memories and recent agent conversation.`);
    }

    if (isCodingRequest(text) && !isPremium(userId) && !codingAccess.isCodingUnlocked(userId)) {
      return send(msg.chat.id, `🔒 <b>Premium Coding</b>

Coding is a Premium Agent ability.

You can unlock it for <b>5 hours</b> using <b>${codingAccess.CODING_UNLOCK_POINTS} points</b>.

Your points: <b>${economy.getPoints(userId)}</b>

Use <code>/coding unlock</code> to unlock it.`);
    }

    try {
      const r=await ctx.agent.run({userId, chatId:msg.chat.id, text, confirm:false});
      if (r.status==='confirmation_required') {
        pending.set(userId, { originalText:text, taskId:r.taskId });
        return send(msg.chat.id, `🌸 <b>Miss Aria has a plan ready</b>\n\n${escape(String(r.message||'Confirm this action.'))}\n\n⚠️ <b>${escape(r.step?.tool||'action')}</b> requires confirmation.\n\nReply <b>confirm</b> or <b>cancel</b>.`);
      }
      return send(msg.chat.id, String(r.message||'Done.'));
    } catch (err) {
      console.error('[ARIA AGENT]', err?.stack || err);
      return send(msg.chat.id, '🌸 I hit a temporary problem while planning that. Please try again.');
    }
  });

  ctx.bot.on('message', async msg => {
    if (!msg?.text || /^\//.test(msg.text)) return;
    const userId=String(msg.from?.id||'');
    const previous=pending.get(userId);
    if (!previous || !/^\s*(confirm|yes|cancel|no)\s*$/i.test(msg.text)) return;
    pending.delete(userId);
    if (/cancel|no/i.test(msg.text)) return send(msg.chat.id,'🌸 Okay, I cancelled that action.');
    try {
      const r=await ctx.agent.run({userId, chatId:msg.chat.id, text:previous.originalText, confirm:true});
      return send(msg.chat.id, String(r.message||'Done.'));
    } catch (err) {
      console.error('[ARIA AGENT CONFIRM]', err?.stack || err);
      return send(msg.chat.id, '🌸 The confirmed action failed safely. Nothing else was executed.');
    }
  });
};

function escape(value) {
  return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
