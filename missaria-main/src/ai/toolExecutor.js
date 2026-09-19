// src/ai/toolExecutor.js
//
// Section 3: "every tool must independently verify authorization... do not
// rely on the AI prompt for security." This is that check. ownerRouter.js
// decides WHICH tool to call from natural language, but this is the only
// place a tool actually runs — and it re-derives permission from the raw
// sender JID every single time, never from anything the router or an LLM
// concluded.
//
// Section 19: minimal audit log. Records what happened, never credentials.

const fs = require("fs");
const path = require("path");
const toolRegistry = require("./toolRegistry");
const { isOwner, PERMISSION } = require("../owner/ownerAuth");

const AUDIT_LOG_PATH = path.join(__dirname, "..", "..", "data", "owner_audit.log");

function auditLog(entry) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + "\n";
  try {
    fs.appendFileSync(AUDIT_LOG_PATH, line);
  } catch (err) {
    console.error("toolExecutor: audit log write failed:", err.message);
  }
}

/**
 * Runs a named tool for a given sender. `senderJid` is the raw JID off the
 * incoming message (msg.key.participant for groups, msg.key.remoteJid for
 * DMs) — never a value supplied by the router's parsed intent, so a tool
 * can't be tricked into running as someone it wasn't actually sent by.
 */
async function execute(toolName, { sock, senderJid, groupJid }, args = {}) {
  const tool = toolRegistry.get(toolName);
  const startedAt = Date.now();

  if (!tool) {
    return { success: false, data: null, error: { code: "UNKNOWN_TOOL", message: `No such tool: ${toolName}` } };
  }

  let granted = true;
  if (tool.permission === PERMISSION.OWNER) {
    granted = isOwner(senderJid);
  } else if (tool.permission === PERMISSION.GROUP_ADMIN) {
    if (!groupJid) {
      return { success: false, data: null, error: { code: "GROUP_REQUIRED", message: "This operation requires a specific group." } };
    }
    granted = await require("../../services/waGroupManager").isSenderGroupAdmin(sock, groupJid, senderJid);
  }
  if (!granted) {
    auditLog({ action: toolName, owner: senderJid, target: args.groupJid || args.jid || null, result: "unauthorized" });
    return {
      success: false,
      data: null,
      error: { code: "UNAUTHORIZED", message: "That operation is restricted to the owner." },
    };
  }

  try {
    const result = await tool.run({ sock, senderJid, groupJid }, args);
    auditLog({
      action: toolName,
      owner: senderJid,
      target: args.groupJid || args.jid || args.participantJid || null,
      result: result.success ? "success" : "failure",
      errorCode: result.error?.code || null,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (err) {
    auditLog({ action: toolName, owner: senderJid, result: "exception", errorCode: "UNCAUGHT", durationMs: Date.now() - startedAt });
    return { success: false, data: null, error: { code: "UNCAUGHT_EXCEPTION", message: err.message } };
  }
}

module.exports = { execute, auditLog };
