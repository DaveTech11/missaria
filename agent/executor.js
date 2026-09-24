'use strict';

async function executePlan({ plan, tools, userId, confirm }) {
  const results = [];
  for (const step of Array.isArray(plan?.steps) ? plan.steps : []) {
    if (!step || !step.tool) continue;
    if (step.requiresConfirmation && !confirm) {
      return { status:'confirmation_required', step, results };
    }
    const result = await tools.execute(step.tool, step.args || {}, userId);
    results.push({ tool: step.tool, result });
    if (!result?.success) return { status:'tool_failed', results };
  }
  return { status:'completed', results };
}
module.exports = { executePlan };
