// src/owner/restartRequest.js
//
// Supports spec §25's "notify the owner when online again" after a
// restart. This only writes/reads/clears a small JSON flag file — it does
// NOT hook into your boot sequence itself (see toolRegistry.js's
// restartBot comment for why that's a separate step).
//
// Expected use at boot, once the WhatsApp connection reaches "open":
//
//   const { takePendingRestartNotice } = require("./src/owner/restartRequest");
//   const notice = takePendingRestartNotice();
//   if (notice) await sock.sendMessage(notice.chatJid, { text: "🌸 Back online." });

const fs = require("fs");
const path = require("path");

const FLAG_PATH = path.join(__dirname, "..", "..", "data", "pending_restart_notice.json");

function writePendingRestartNotice({ ownerJid, chatJid, requestedAt }) {
  fs.mkdirSync(path.dirname(FLAG_PATH), { recursive: true });
  fs.writeFileSync(FLAG_PATH, JSON.stringify({ ownerJid, chatJid, requestedAt }));
}

/** Reads the notice AND clears it, so it only ever fires once. */
function takePendingRestartNotice() {
  if (!fs.existsSync(FLAG_PATH)) return null;
  try {
    const notice = JSON.parse(fs.readFileSync(FLAG_PATH, "utf8"));
    fs.unlinkSync(FLAG_PATH);
    return notice;
  } catch {
    return null;
  }
}

module.exports = { writePendingRestartNotice, takePendingRestartNotice };
