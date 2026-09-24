/**
 * Handler pack 1.
 * Extracted from the original bot.js without changing handler order.
 */
function register(ctx) {
  const { bot, statsTracker } = ctx;

bot.on("message", (msg) => {
  if (!msg.from) return;
  statsTracker.trackMessage(msg.from.id);
  if (msg.text && msg.text.startsWith("/")) {
    statsTracker.trackCommand(msg.text.split(/[\s@]/)[0]);
  }
  if (msg.voice) statsTracker.trackFeature("voice_note");
  if (msg.document) statsTracker.trackFeature("document_upload");
  if (msg.photo) statsTracker.trackFeature("photo");
});

bot.on("callback_query", (query) => {
  if (query.data && query.data.startsWith("code_")) statsTracker.trackFeature("code_studio:" + query.data);
});
}

module.exports = register;
