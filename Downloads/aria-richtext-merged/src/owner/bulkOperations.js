// src/owner/bulkOperations.js
'use strict';

const groupMgr = require("../../services/waGroupManager");
const toolExecutor = require("../ai/toolExecutor");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Real groups the bot is an admin in — the only set a bulk group-setting
 * operation could ever legitimately apply to.
 */
async function listAdminGroups(sock) {
  const { listGroups } = require("./groupResolver");
  const groups = await listGroups(sock);
  const adminGroups = [];
  for (const g of groups) {
    if (await groupMgr.isBotGroupAdmin(sock, g.jid)) adminGroups.push(g);
  }
  return adminGroups;
}

/**
 * Applies one tool call per group sequentially, with a real delay between
 * each call — this delay is the actual point of this module. Firing
 * dozens of group-setting changes back-to-back is a real way to get a
 * WhatsApp number flagged/banned; spacing them out is a genuine mitigation,
 * not decoration. Never claims total success on partial failure — returns
 * a per-group result list so the caller can report exactly what happened.
 */
async function applyToGroups({ sock, senderJid, groups, toolName, buildArgs, delayMs = 1200 }) {
  const results = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const args = buildArgs(group);
    const result = await toolExecutor.execute(toolName, { sock, senderJid, groupJid: group.jid }, args);
    results.push({ group, success: result.success, error: result.success ? null : result.error });
    if (i < groups.length - 1) await sleep(delayMs); // no delay needed after the last call
  }
  return results;
}

function summarizeResults(results) {
  const successCount = results.filter((r) => r.success).length;
  const lines = [`Completed ${successCount}/${results.length} operations.`];
  for (const r of results) {
    lines.push(r.success ? `✅ ${r.group.subject}` : `❌ ${r.group.subject}: ${r.error?.message || "failed"}`);
  }
  return lines.join("\n");
}

module.exports = { listAdminGroups, applyToGroups, summarizeResults, sleep };
