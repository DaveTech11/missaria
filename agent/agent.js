'use strict';
const fs = require('fs');
const path = require('path');
const askDeepSeek = require('../services/deepseek');
const askClaudeHaiku = require('../services/claudeHaiku');
const { AgentMemory } = require('./memory');
const { SkillStore } = require('./skills');
const { createAgentTools } = require('./tools');
const { extractJson, buildPlannerPrompt } = require('./planner');
const { executePlan } = require('./executor');
const { AgentTaskStore } = require('./taskStore');
const { AgentSessionStore } = require('./session');

class AriaAgent {
  constructor(ctx, registry) {
    this.ctx = ctx;
    this.registry = registry;
    this.memories = new Map();
    this.skills = new SkillStore(path.join(ctx.PROJECT_ROOT || process.cwd(), 'agent', 'skills'));
    this.registryAdapter = registry;
    this.tasks = new AgentTaskStore(ctx.DATA_DIR);
    this.sessions = new AgentSessionStore(ctx.DATA_DIR);
  }
  memory(userId) {
    const k=String(userId);
    if (!this.memories.has(k)) this.memories.set(k, new AgentMemory({ dataDir:this.ctx.DATA_DIR, userId:k }));
    return this.memories.get(k);
  }
  tools(userId) { return createAgentTools({ registry:this.registryAdapter, memory:this.memory(userId), ctx:this.ctx }); }

  async run({ userId, chatId, text, confirm=false }) {
    const codingRequest = /\b(code|coding|program|programming|debug|debugging|developer|develop|script|javascript|typescript|python|node(?:\.js)?|html|css|react|next(?:\.js)?|api|repository|repo|github|git|write.*code|fix.*code|build.*app|create.*app)\b/i.test(String(text || ''));
    if (codingRequest) {
      const codingAccess = require('../services/codingAccess');
      const economy = require('../services/economyService');
      const premium = typeof this.ctx.isPremiumActive === 'function' ? this.ctx.isPremiumActive(userId) : (typeof this.ctx.getPlan === 'function' && this.ctx.getPlan(userId) === 'premium');
      if (!premium && !codingAccess.isCodingUnlocked(userId)) {
        return { status:'coding_locked', message:`🔒 Premium Coding is locked. Unlock it for 5 hours with ${codingAccess.CODING_UNLOCK_POINTS} points. You currently have ${economy.getPoints(userId)} points. Use /coding unlock.` };
      }
    }
    const task = this.tasks.create({ userId, chatId, prompt: text });
    this.sessions.add({ userId, chatId, role: 'user', content: text });
    const mem=this.memory(userId);
    const tools=this.tools(userId);
    const recalled=mem.search(text,8);
    const conversation=this.sessions.recent(userId,10);
    const skills=this.skills.find(text).slice(0,3);
    const personality=fs.readFileSync(path.join(__dirname,'personality.md'),'utf8');
    const prompt=buildPlannerPrompt({
      personality,
      memories:recalled,
      conversation,
      skills,
      tools:tools.list(),
      userText:text
    });
    // All coding-related agent requests use Claude Haiku through the
    // dedicated Rebix endpoint. Non-coding agent requests keep DeepSeek.
    const askAgentModel = codingRequest ? askClaudeHaiku : askDeepSeek;
    const llm = await askAgentModel({
      system: 'You are Miss Aria. You are the planning/reasoning engine behind her Telegram agent. Output valid JSON only.',
      prompt,
      temperature: 0.2,
      maxTokens: 2600
    });
    if (!llm.success) { this.tasks.update(task.id, 'failed', { message: llm.message }); return { status:'error', message:llm.message }; }
    const plan=extractJson(llm.message);
    if (!plan) { this.tasks.update(task.id, 'failed', { message: 'Invalid plan' }); return { status:'error', message:'I could not build a safe action plan.' }; }

    if (Array.isArray(plan.remember)) {
      for (const item of plan.remember.slice(0,3)) mem.add(item,'agent');
    }
    if (plan.skill && typeof plan.skill==='object' && plan.skill.name && plan.skill.body) {
      this.skills.save(plan.skill.name, plan.skill.body);
    }

    const executed=await executePlan({ plan, tools, userId, confirm });
    if (executed.status==='confirmation_required') {
      return {
        status:'confirmation_required',
        originalText: text,
        message: plan.reply || 'I have a high-impact action ready. Please confirm.',
        step: executed.step,
        taskId: task.id
      };
    }
    this.tasks.update(task.id, executed.status, { message: plan.reply, results: executed.results });
    this.sessions.add({ userId, chatId, role: 'assistant', content: String(plan.reply || 'Done.') });
    return {
      status: executed.status,
      message: plan.reply || 'Done.',
      results: executed.results,
      plan
    };
  }

  listSkills() {
    return this.skills.list();
  }

  recentTasks(userId, limit=10) {
    return this.tasks.recent(userId, limit);
  }

  recentConversation(userId, limit=12) {
    return this.sessions.recent(userId, limit);
  }

  remember(userId, content, kind='user') {
    return this.memory(userId).add(content, kind);
  }

  clearMemory(userId) {
    const m=this.memory(userId);
    const n=m.db.prepare('DELETE FROM memories WHERE user_id=?').run(String(userId)).changes;
    return n;
  }

  clearConversation(userId) {
    return this.sessions.clear(userId);
  }
}
module.exports = { AriaAgent };
