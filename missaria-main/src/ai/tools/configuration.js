// src/ai/tools/configuration.js
'use strict';

const { ok, fail, PERMISSION, define } = require("./_shared");

/**
 * Real, but deliberately minimal: booleans about whether things are
 * configured, never the configured values themselves — per the explicit
 * rule to never expose secrets/credentials/tokens to a tool result.
 */
define("getBotConfig", {
  permission: PERMISSION.OWNER,
  async run() {
    const whatsappService = require("../../../services/whatsappService");
    return ok({
      ownerConfigured: !!whatsappService.getOwnerNumber(),
    });
  },
});

define("restartBot", {
  permission: PERMISSION.OWNER,
  risk: "HIGH",
  async run({ senderJid }, { chatJid }) {
    try {
      const { writePendingRestartNotice } = require("../../owner/restartRequest");
      writePendingRestartNotice({ ownerJid: senderJid, chatJid, requestedAt: Date.now() });
      setTimeout(() => process.exit(0), 500); // let the confirmation reply flush first
      return ok({ restarting: true });
    } catch (err) {
      return fail("RESTART_FAILED", err.message);
    }
  },
});

// reloadConfig() and reloadPlugins() from the spec are intentionally NOT
// registered here. This project loads its configuration once at process
// start (no watched config file, no hot-reload path I've found) and has no
// plugin system at all yet (that's still on the "not built" list — see
// INTEGRATION.md). Registering tools with those names that don't actually
// reload anything would be exactly the fake API the spec explicitly
// forbids. If a real config-reload or plugin system gets built later,
// these belong here.
