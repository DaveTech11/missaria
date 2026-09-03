// services/waGames.js
//
// Runs the SAME 30 games from games/gameLoader.js (games/engine.js +
// games/newAdventures.js + the 6 hand-written games) over WhatsApp.
// Nothing about the games themselves is rewritten — this file only
// adapts the interface:
//
//   - Telegram gave players a reply-keyboard of button labels.
//     WhatsApp gets a numbered text list instead (".play" replies with
//     "1) Sail  2) Islands ..." and the player just sends the number,
//     or the exact label text — both work).
//   - Sessions are keyed by WhatsApp jid instead of a Telegram numeric
//     user id; gameManager itself doesn't care what the id looks like.
//
// Registered on the router as ".games" and ".play <name>"; free-text
// continuation (numbers/labels while a session is active) is handled
// by continueIfPlaying(), called from whatsappService for every
// message that isn't itself a recognized command.

const router = require("./waCommandRouter");
const gameManager = require("../games/gameLoader");

function waUser(jid) {
  return { id: jid, username: jid.split("@")[0], first_name: jid.split("@")[0] };
}

function formatKeyboard(keyboard) {
  if (!Array.isArray(keyboard) || !keyboard.length) return "";
  const rows = [];
  let n = 1;
  for (const row of keyboard) {
    for (const label of row) {
      rows.push(`${n}) ${label}`);
      n++;
    }
  }
  return "\n\n" + rows.join("   ");
}

function flatButtons(keyboard) {
  if (!Array.isArray(keyboard)) return [];
  return keyboard.flat();
}

router.register("games", async (ctx) => {
  const meta = gameManager.getAllGamesMeta ? gameManager.getAllGamesMeta() : [];
  const list = meta.length
    ? meta.map((g) => `${g.label} -> .play ${g.name}`).join("\n")
    : "No games loaded.";

  await ctx.sock.sendMessage(ctx.jid, {
    text:
      `🎮 *Miss Aria Adventures — ${meta.length} games*\n\n${list}\n\n` +
      `Start one with: *.play <name>*\nExample: *.play pirate*\n\n` +
      `While playing, send *.endgame* any time to stop and go back to chatting normally.`,
  });
});

router.register("play", async (ctx) => {
  const gameName = (ctx.args || "").trim().toLowerCase();
  if (!gameName) return router.safeSend(ctx, "👉 Usage: .play <name> — send .games to see the list.");

  const user = waUser(ctx.senderJid);
  try {
    const result = gameManager.startGame(user, gameName);
    const handler = gameManager.getGame(gameName);
    const keyboard = handler && typeof handler.getKeyboard === "function" ? handler.getKeyboard() : null;
    await ctx.sock.sendMessage(ctx.jid, { text: `${result.text}${formatKeyboard(keyboard)}` });
  } catch (err) {
    await router.safeSend(ctx, `❌ Game "${gameName}" not found. Send .games to see the list.`);
  }
});

router.register("endgame", async (ctx) => {
  if (!gameManager.hasSession(ctx.senderJid)) {
    return router.safeSend(ctx, "You don't have an active game.");
  }
  gameManager.endSession(ctx.senderJid);
  await router.safeSend(ctx, "🛑 Game ended — back to normal chat.");
}, { aliases: ["stopgame", "quitgame"] });

/**
 * Called from whatsappService for any message that wasn't a recognized
 * '.' command. If the sender has an active game session, treats the
 * message as a game move (either the number shown in the menu, or the
 * exact button label) and returns true. Returns false if there's no
 * active session, so the caller can fall through to normal chat.
 */
async function continueIfPlaying({ sock, jid, senderJid, text }) {
  if (!text) return false;
  if (!gameManager.hasSession(senderJid)) return false;

  // Let people explicitly step out of a game without typing .endgame.
  if (/^(chat ai|talk to ai|exit game|leave game)$/i.test(text.trim())) {
    gameManager.endSession(senderJid);
    await sock.sendMessage(jid, { text: "🛑 Left the game — back to normal chat." });
    return true;
  }

  const session = gameManager.getSession(senderJid);
  const handler = session && gameManager.getGame(session.game);
  const keyboard = handler && typeof handler.getKeyboard === "function" ? handler.getKeyboard() : null;
  const buttons = flatButtons(keyboard);

  let input = text.trim();
  const asNumber = parseInt(input, 10);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= buttons.length) {
    input = buttons[asNumber - 1];
  }

  try {
    const result = await gameManager.continueGame(senderJid, input);
    await sock.sendMessage(jid, { text: `${result.text}${formatKeyboard(keyboard)}` });
  } catch (err) {
    console.error("waGames continueIfPlaying error:", err.message);
    await sock.sendMessage(jid, { text: "❌ That move hit a snag — try again, or send .endgame to stop." });
  }
  return true;
}

function getAllGamesMeta() {
  return gameManager.getAllGamesMeta ? gameManager.getAllGamesMeta() : [];
}

module.exports = {
  continueIfPlaying,
  getAllGamesMeta,
};
