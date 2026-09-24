# Fix: "formatAiReplyForTelegram is not defined" + silent AI handlers

## What was wrong
`core/runtime.js` required these helpers at the top...

    utils/telegramRichText   -> formatAiReplyForTelegram
    utils/infoCard           -> generateInfoCard
    services/smartAssistant  -> detectIntent, progressBar, withRetry, isRecoverableTelegramError
    services/imageGenerator  -> isNaturalImageQuestion, detectNaturalImageRequest, generateImage (as generateNaturalImage)

...but never put them on the `ctx` object it returns. The handler packs are
plain functions that only see what they destructure out of `ctx`, so inside
them those names resolved to nothing:

* `handlers/06_reports_ai.js` (lines 2455 / 3486) -> **crash**
  `ReferenceError: formatAiReplyForTelegram is not defined`, thrown from an
  async Telegram callback, i.e. an unhandled rejection after the AI had
  already produced a reply. The user saw nothing.
* `handlers/03_group_flow.js` -> both `bot.on("message")` handlers threw on
  their first line and were swallowed by their own try/catch, which is why
  the logs showed `[SMART AI UX] detectIntent is not defined` and
  `[NATURAL IMAGE HANDLER] isNaturalImageQuestion is not defined` on every
  single message. Natural-language image generation was completely dead.
* `handlers/02_moderation_admin.js` -> same latent bug with
  `generateInfoCard` (3 call sites), not yet in your logs.

## Changes
1. **core/runtime.js** — added the 9 helpers to the returned `ctx` object.
2. **handlers/06_reports_ai.js** — destructure `formatAiReplyForTelegram`.
3. **handlers/03_group_flow.js** — destructure `detectIntent`,
   `isNaturalImageQuestion`, `detectNaturalImageRequest`,
   `generateNaturalImage`, `withRetry`.
4. **handlers/02_moderation_admin.js** — destructure `generateInfoCard`.
5. **services/deepseek.js** — return early when `DEEPSEEK_API_KEY` is unset
   instead of sending `Authorization: Bearer undefined` and logging
   "Authentication Fails, Your api key: ****ined is invalid" on every turn.
   Warns once, then fails over quietly to Gemini.
6. **services/aiService.js** — same guard for `analyzeImage`.

`handlers/13_aria_ai_companion.js` and `handlers/16_v14_workspace.js` were
already fine — 13 requires the formatter module directly, 16 goes through
`ctx.formatAiReplyForTelegram`, which now exists.

## Verified
* `node --check` across every .js file in the project: clean.
* Static re-scan of all handler packs for ctx names used but not
  destructured: clean.

## Still worth doing on Render
`DEEPSEEK_API_KEY` is genuinely unset in your environment. Set it in the
Render dashboard, or leave it out — DeepSeek will now be skipped cleanly and
Gemini serves the reply, which is what was already happening in your logs.
