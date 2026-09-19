// src/ai/tools/diagnostics.js
'use strict';

const { ok, fail, groupMgr, PERMISSION, define } = require("./_shared");

define("getConnectionStatus", {
  permission: PERMISSION.OWNER,
  async run({ sock }) {
    const connected = !!sock?.user?.id;
    return ok({ state: connected ? "CONNECTED" : "DISCONNECTED", jid: sock?.user?.id || null });
  },
});

define("getMemoryUsage", {
  permission: PERMISSION.OWNER,
  async run() {
    const m = process.memoryUsage();
    return ok({
      rssMb: +(m.rss / 1024 / 1024).toFixed(1),
      heapUsedMb: +(m.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMb: +(m.heapTotal / 1024 / 1024).toFixed(1),
    });
  },
});

define("getUptime", {
  permission: PERMISSION.OWNER,
  async run() {
    return ok({ uptimeSeconds: Math.floor(process.uptime()) });
  },
});

define("getVersion", {
  permission: PERMISSION.OWNER,
  async run() {
    try {
      const pkg = require("../../../package.json");
      return ok({ version: pkg.version, name: pkg.name });
    } catch (err) {
      return fail("VERSION_UNAVAILABLE", "Couldn't read package.json.");
    }
  },
});

define("getBotStatus", {
  permission: PERMISSION.OWNER,
  async run({ sock }) {
    try {
      const { listGroups } = require("../../owner/groupResolver");
      const groups = await listGroups(sock);
      let adminCount = 0;
      for (const g of groups) {
        if (await groupMgr.isBotGroupAdmin(sock, g.jid)) adminCount++;
      }
      return ok({
        connected: !!sock?.user?.id,
        groupCount: groups.length,
        adminGroupCount: adminCount,
        uptimeSeconds: Math.floor(process.uptime()),
      });
    } catch (err) {
      return fail("WHATSAPP_ERROR", err.message);
    }
  },
});

/**
 * Composes the real tools above rather than duplicating their logic —
 * runDiagnostics IS getConnectionStatus + getBotStatus + getMemoryUsage +
 * getVersion, gathered into one report.
 */
define("runDiagnostics", {
  permission: PERMISSION.OWNER,
  async run(ctx) {
    const registry = require("../toolRegistry");
    const [connection, status, memory, version] = await Promise.all([
      registry.get("getConnectionStatus").run(ctx, {}),
      registry.get("getBotStatus").run(ctx, {}),
      registry.get("getMemoryUsage").run(ctx, {}),
      registry.get("getVersion").run(ctx, {}),
    ]);
    return ok({
      connection: connection.data,
      status: status.data,
      memory: memory.data,
      version: version.data,
    });
  },
});
