// src/ai/toolRegistry.js
//
// Pure registration engine — section 4/17/21. Holds no tool definitions
// itself; every actual tool lives in src/ai/tools/<category>/, organized
// the way the spec asked for (groups/messaging/moderation/participants/
// automation/diagnostics/configuration/memory). Requiring this file
// triggers ./tools/index.js, which requires every category file — each of
// those calls define() as a side effect of being loaded, so requiring
// toolRegistry.js (as toolExecutor.js already does) is enough to get every
// tool registered. No other file needs to change because of this reorg.

const tools = new Map();

function define(name, { permission, risk = "LOW", run }) {
  if (tools.has(name)) {
    throw new Error(`toolRegistry: duplicate tool name "${name}" — every tool must have a unique name across all categories.`);
  }
  tools.set(name, { name, permission, risk, run });
}

function get(name) {
  return tools.get(name);
}

function list() {
  return Array.from(tools.values()).map((t) => ({ name: t.name, permission: t.permission, risk: t.risk }));
}

module.exports = { define, get, list };

// Triggers registration of every real tool. Placed at the bottom so
// `define` exists on module.exports before the category files (which
// `require("../toolRegistry")` themselves) run.
require("./tools");
