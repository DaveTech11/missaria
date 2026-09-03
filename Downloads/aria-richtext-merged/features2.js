// ============================================================
// features2.js
// Batch 2 of new commands: language/lookup, media fetch,
// AI memory + chat toggle, sticker workflow, and the aura/shard
// economy (steal/duel/luck).
//
// Call registerFeatures2(bot, { getUser, saveStore, userHistory })
// so this can reuse the bot's existing per-user store and AI
// conversation history instead of creating a second one.
// ============================================================

const lookup = require("./services/lookupService");
const economy = require("./services/economyService");

module.exports = function registerFeatures2(bot, ctx) {
  const { getUser, saveStore, userHistory } = ctx;

  const send = (chatId, text, extra) => bot.sendMessage(chatId, text, extra);

  function targetUserId(msg, match) {
    if (msg.reply_to_message) return msg.reply_to_message.from.id;
    if (match && match[1] && /^\d+$/.test(match[1].trim())) return match[1].trim();
    return null;
  }

  // ==========================================================
  // LANGUAGE & LOOKUP
  // ==========================================================

  bot.onText(/^\/tr(?:\s+([\s\S]+))?/, async (msg, match) => {
    const source = msg.reply_to_message?.text || match[1];
    if (!source) return send(msg.chat.id, "Usage: /tr <text>, or reply to a message with /tr [language]");
    // If replying, match[1] (if present) is treated as the target language
    const targetLang = msg.reply_to_message ? (match[1] || "English") : "English";
    try {
      const out = await lookup.translate(source, targetLang);
      send(msg.chat.id, out);
    } catch {
      send(msg.chat.id, "Translation failed.");
    }
  });

  bot.onText(/^\/resetchat/, (msg) => {
    userHistory.set(msg.from.id, []);
    send(msg.chat.id, "Conversation memory wiped — clean slate.");
  });

  bot.onText(/^\/chat\s+(on|off)/, (msg, match) => {
    if (msg.chat.type !== "private") return;
    const user = getUser(msg.from.id);
    user.chatEnabled = match[1] === "on";
    saveStore();
    send(msg.chat.id, `AI DM replies are now ${user.chatEnabled ? "ON" : "OFF"}.`);
  });

  bot.onText(/^\/remember\s+([\s\S]+)/, (msg, match) => {
    if (msg.chat.type !== "private") return send(msg.chat.id, "/remember only works in DM.");
    const user = getUser(msg.from.id);
    user.memories = user.memories || [];
    user.memories.push(match[1].trim());
    saveStore();
    send(msg.chat.id, `Got it, I'll remember: "${match[1].trim()}"`);
  });

  bot.onText(/^\/memories/, (msg) => {
    const user = getUser(msg.from.id);
    const mems = user.memories || [];
    if (!mems.length) return send(msg.chat.id, "I don't have anything remembered about you yet.");
    send(msg.chat.id, mems.map((m, i) => `${i + 1}. ${m}`).join("\n"));
  });

  bot.onText(/^\/forget\s+(\d+)/, (msg, match) => {
    const user = getUser(msg.from.id);
    const idx = parseInt(match[1], 10) - 1;
    if (!user.memories || !user.memories[idx]) return send(msg.chat.id, "No memory with that number.");
    const removed = user.memories.splice(idx, 1);
    saveStore();
    send(msg.chat.id, `Forgot: "${removed[0]}"`);
  });

  bot.onText(/^\/forgetall/, (msg) => {
    const user = getUser(msg.from.id);
    user.memories = [];
    saveStore();
    send(msg.chat.id, "All memories cleared.");
  });

  bot.onText(/^\/age(?:\s|$)/, async (msg, match) => {
    const uid = targetUserId(msg) || msg.from.id;
    const est = lookup.estimateAccountAge(uid);
    send(msg.chat.id, `Estimated account creation: ~${est.estimatedDate}\n(${est.note})`);
  });

  bot.onText(/^\/(?:lyrics|ly)\s+([\s\S]+)/, async (msg, match) => {
    await bot.sendChatAction(msg.chat.id, "typing");
    try {
      const result = await lookup.findLyrics(match[1]);
      if (!result || !result.lyrics) return send(msg.chat.id, "Couldn't find lyrics for that.");
      const text = `${result.title} — ${result.artist}\n\n${result.lyrics}`.slice(0, 4000);
      send(msg.chat.id, text);
    } catch {
      send(msg.chat.id, "Lyrics lookup failed.");
    }
  });

  bot.onText(/^\/(?:song|find)\s+([\s\S]+)/, async (msg, match) => {
    try {
      const song = await lookup.findSong(match[1]);
      if (!song) return send(msg.chat.id, "Couldn't find that song.");
      const caption = `${song.title} — ${song.artist}\n${song.album || ""}\n${song.url || ""}`;
      if (song.artwork) {
        await bot.sendPhoto(msg.chat.id, song.artwork, { caption });
      } else {
        send(msg.chat.id, caption);
      }
    } catch {
      send(msg.chat.id, "Song search failed.");
    }
  });

  // ==========================================================
  // MEDIA FETCH (needs TENOR_API_KEY in .env)
  // ==========================================================

  bot.onText(/^\/gif\s+([\s\S]+)/, async (msg, match) => {
    try {
      const hit = await lookup.findGif(match[1]);
      if (!hit) return send(msg.chat.id, "No gif found.");
      await bot.sendAnimation(msg.chat.id, hit.url);
    } catch (err) {
      send(msg.chat.id, err.message);
    }
  });

  bot.onText(/^\/memes?\s+([\s\S]+)/, async (msg, match) => {
    try {
      const hit = await lookup.findMeme(match[1]);
      if (!hit) return send(msg.chat.id, "No meme found.");
      await bot.sendAnimation(msg.chat.id, hit.url);
    } catch (err) {
      send(msg.chat.id, err.message);
    }
  });

  bot.onText(/^\/clips?\s+([\s\S]+)/, async (msg, match) => {
    try {
      const hit = await lookup.findClip(match[1]);
      if (!hit) return send(msg.chat.id, "No clip found.");
      await bot.sendVideo(msg.chat.id, hit.url);
    } catch (err) {
      send(msg.chat.id, err.message);
    }
  });

  // ==========================================================
  // STICKER WORKFLOW
  // ==========================================================

  bot.onText(/^\/kang/, async (msg) => {
    const src = msg.reply_to_message;
    if (!src || (!src.sticker && !src.photo)) {
      return send(msg.chat.id, "Reply to a sticker or image with /kang to add it to your pack.");
    }
    try {
      const botInfo = await bot.getMe();
      const packName = `pack_${msg.from.id}_by_${botInfo.username}`;
      const packTitle = `${msg.from.first_name || "User"}'s pack`;
      const fileId = src.sticker ? src.sticker.file_id : src.photo[src.photo.length - 1].file_id;
      const emoji = src.sticker?.emoji || "🙂";

      try {
        await bot.addStickerToSet(msg.from.id, packName, { png_sticker: fileId, emojis: emoji });
      } catch {
        await bot.createNewStickerSet(msg.from.id, packName, packTitle, { png_sticker: fileId, emojis: emoji });
      }
      send(msg.chat.id, `Added to your pack: https://t.me/addstickers/${packName}`);
    } catch (err) {
      send(msg.chat.id, `Couldn't kang that: ${err.message}`);
    }
  });

  bot.onText(/^\/pulse/, async (msg) => {
    const t0 = Date.now();
    const sent = await send(msg.chat.id, "Checking...");
    const ms = Date.now() - t0;
    bot.editMessageText(`Latency: ${ms}ms`, { chat_id: msg.chat.id, message_id: sent.message_id });
  });

  // ==========================================================
  // FOCUS (pomodoro timer)
  // ==========================================================

  const focusSessions = new Map();

  bot.onText(/^\/focus\s+reset/, (msg) => {
    const s = focusSessions.get(msg.from.id);
    if (s) clearInterval(s.interval);
    focusSessions.delete(msg.from.id);
    send(msg.chat.id, "Focus session stopped and reset.");
  });

  bot.onText(/^\/focus(?:\s+(\d+))?$/, (msg, match) => {
    const minutes = match[1] ? parseInt(match[1], 10) : 25;
    if (focusSessions.has(msg.from.id)) return send(msg.chat.id, "You already have a focus session running. /focus reset to stop it.");

    const endAt = Date.now() + minutes * 60000;
    send(msg.chat.id, `Focus session started: ${minutes} min. I'll ping you when it's done.`);

    const timeout = setTimeout(() => {
      send(msg.chat.id, "Focus session complete! Take a break.");
      focusSessions.delete(msg.from.id);
    }, minutes * 60000);

    focusSessions.set(msg.from.id, { endAt, interval: timeout });
  });

  // ==========================================================
  // ECONOMY: STEAL / DUEL / LUCK / SHARDS
  // ==========================================================

  bot.onText(/^\/steal(?:\s|$)/, (msg) => {
    const targetId = targetUserId(msg);
    if (!targetId) return send(msg.chat.id, "Reply to the person you want to steal from with /steal.");
    const result = economy.steal(msg.chat.id, msg.from.id, targetId);
    if (!result.ok) return send(msg.chat.id, result.reason);
    send(
      msg.chat.id,
      result.success
        ? `Success! You stole ${result.amount} aura.`
        : `Failed! You lost ${result.penalty} aura trying.`
    );
  });

  bot.onText(/^\/stealoff(?:\s+(\d+)([mhd]))?/, (msg, match) => {
    if (msg.chat.type === "private") return;
    let ms = null;
    if (match[1]) {
      const n = parseInt(match[1], 10);
      const unit = match[2];
      ms = unit === "m" ? n * 60000 : unit === "h" ? n * 3600000 : n * 86400000;
    }
    economy.setStealDisabled(msg.chat.id, ms);
    send(msg.chat.id, ms ? `Steal disabled for ${match[1]}${match[2]}.` : "Steal disabled indefinitely.");
  });

  bot.onText(/^\/stealon/, (msg) => {
    if (msg.chat.type === "private") return;
    economy.setStealEnabled(msg.chat.id);
    send(msg.chat.id, "Steal re-enabled in this group.");
  });

  bot.onText(/^\/duel(?:\s+(\d+))?/, (msg, match) => {
    const amount = match[1] ? parseInt(match[1], 10) : null;
    if (!amount) return send(msg.chat.id, "Usage: /duel <amount>");
    const opponentId = msg.chat.type === "private" ? null : targetUserId(msg);
    const result = economy.duel(msg.from.id, opponentId, amount);
    if (!result.ok) return send(msg.chat.id, result.reason);
    send(
      msg.chat.id,
      result.winner === "challenger"
        ? `You won the duel! +${result.payout} aura.`
        : result.winner === "house"
        ? `The house wins this time. -${amount} aura.`
        : `Your opponent won the duel.`
    );
  });

  bot.onText(/^\/duelboard/, (msg) => {
    const board = economy.leaderboard(10);
    if (!board.length) return send(msg.chat.id, "No duel stats yet.");
    send(msg.chat.id, board.map((b, i) => `${i + 1}. ${b.id} — ${b.aura} aura (${b.wins}W/${b.losses}L)`).join("\n"));
  });

  bot.onText(/^\/duelstats(?:\s|$)/, (msg) => {
    const uid = targetUserId(msg) || msg.from.id;
    const bal = economy.getBalance(uid);
    send(msg.chat.id, `Aura: ${bal.aura}\nShards: ${bal.shards}`);
  });

  bot.onText(/^\/luck\s+(\d+)/, (msg, match) => {
    const stake = parseInt(match[1], 10);
    const result = economy.luck(msg.from.id, stake);
    if (!result.ok) return send(msg.chat.id, result.reason);
    send(msg.chat.id, result.won ? `You won! +${result.winnings} aura.` : `You lost ${result.lost} aura.`);
  });

  bot.onText(/^\/(?:group|fracture)/, (msg) => {
    const board = economy.leaderboard(10);
    if (!board.length) return send(msg.chat.id, "No one on the leaderboard yet.");
    send(msg.chat.id, `Group Leaderboard\n\n${board.map((b, i) => `${i + 1}. ${b.id} — ${b.aura} aura`).join("\n")}`);
  });

  bot.onText(/^\/(?:shard|forge)\s+(\d+)/, (msg, match) => {
    const result = economy.convertToShards(msg.from.id, parseInt(match[1], 10));
    if (!result.ok) return send(msg.chat.id, result.reason);
    send(msg.chat.id, `Converted ${result.spent} aura into ${result.shards} shards.`);
  });

  bot.onText(/^\/privacyon/, (msg) => {
    economy.setPrivacy(msg.from.id, true);
    send(msg.chat.id, "You're now hidden from leaderboards.");
  });

  bot.onText(/^\/privacyoff/, (msg) => {
    economy.setPrivacy(msg.from.id, false);
    send(msg.chat.id, "You're now visible on leaderboards.");
  });

  bot.onText(/^\/stats/, (msg) => {
    const bal = economy.getBalance(msg.from.id);
    send(msg.chat.id, `Your Stats\n\nAura: ${bal.aura}\nShards: ${bal.shards}`);
  });
};
