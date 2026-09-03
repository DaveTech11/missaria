// server/statusServer.js
//
// Miss Aria is a background WhatsApp process with no HTTP server of its
// own — most hosting platforms this is being made deployable to (Railway,
// Pterodactyl-style panels) expect something bound to a port, either for
// their own health checks or so the host doesn't consider the service
// "not listening" and restart-loop it. This is a real, minimal server —
// no framework dependency added — reporting genuinely live data pulled
// from whatsappService's real exports, not placeholder text.
//
// Deliberately defensive: if this server fails to start (e.g. the port is
// already in use), it logs and the bot keeps running — nothing about
// Miss Aria's actual WhatsApp functionality depends on this.

const http = require("http");

let server = null;

function safeGetStatus() {
  try {
    // Lazy require: whatsappService.js pulls in the rest of the bot's
    // service tree, and this module may load before that's ready during
    // boot — falling back to a minimal response rather than crashing.
    const whatsappService = require("../services/whatsappService");
    const activeAgentIds = whatsappService.getActiveAgentIds ? whatsappService.getActiveAgentIds() : [];
    return {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      activeAgents: activeAgentIds.length,
    };
  } catch (err) {
    return { status: "starting", uptimeSeconds: Math.floor(process.uptime()), error: err.message };
  }
}

function start(port = process.env.PORT || 3000) {
  if (server) return server; // already running — idempotent

  server = http.createServer((req, res) => {
    if (req.url === "/health") {
      const body = safeGetStatus();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Miss Aria is running. See /health for status.\n");
  });

  server.on("error", (err) => {
    console.error(`statusServer: failed to bind port ${port} — continuing without it (${err.message})`);
    server = null;
  });

  server.listen(port, () => {
    console.log(`statusServer: listening on port ${port} (/health for status)`);
  });

  return server;
}

module.exports = { start };
