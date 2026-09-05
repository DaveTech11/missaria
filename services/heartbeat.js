// Miss Aria heartbeat / health monitor.
//
// This is intentionally an OPTIONAL monitoring heartbeat. It does not pretend
// to defeat Render's Free-tier idle policy: Render requires inbound traffic
// to keep a free web service awake. Set HEARTBEAT_URL to an external monitor
// or another endpoint if you want periodic health checks.
const axios = require('axios');

let timer = null;
let running = false;

function startHeartbeat() {
  if (timer || running) return;

  const url = String(process.env.HEARTBEAT_URL || '').trim();
  if (!url) {
    console.log('💓 Heartbeat: disabled (set HEARTBEAT_URL to enable health pings).');
    return;
  }

  const intervalMs = Math.max(
    60_000,
    Number(process.env.HEARTBEAT_INTERVAL_MS || 600_000)
  );

  const ping = async () => {
    if (running) return;
    running = true;
    try {
      const response = await axios.get(url, { timeout: 15_000 });
      console.log(`💓 Heartbeat OK: ${response.status} ${url}`);
    } catch (error) {
      console.error(`💓 Heartbeat failed: ${error.message}`);
    } finally {
      running = false;
    }
  };

  ping();
  timer = setInterval(ping, intervalMs);
  timer.unref?.();
  console.log(`💓 Heartbeat enabled: every ${Math.round(intervalMs / 60_000)} minute(s)`);
}

module.exports = { startHeartbeat };
