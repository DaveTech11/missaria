
"use strict";

const prefs = require("../services/ariaPreferences");
const formatter = require("../utils/telegramRichText");
const richTelegram = require("../utils/telegramRichMessage");

const MODE_LABELS = {
  auto: "🧠 ᴀᴜᴛᴏ",
  chat: "💬 ᴄʜᴀᴛ",
  coding: "💻 ᴄᴏᴅɪɴɢ",
  research: "🔎 ʀᴇsᴇᴀʀᴄʜ",
  creative: "🎨 ᴄʀᴇᴀᴛɪᴠᴇ",
  tutor: "📚 ᴛᴜᴛᴏʀ"
};

const ARIA_IMAGE =
  "https://files.catbox.moe/hjdxgx.jpg";

const lastPrompts = new Map();
const lastResponses = new Map();
const busy = new Set();
const lastResponseMessageIds = new Map();

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(value) {
  return String(value == null ? "" : value)
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/*
 * ============================================================
 * AI MODE KEYBOARD
 * ============================================================
 */

function modeKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "💬 ᴄʜᴀᴛ",
          callback_data: "aria_mode_chat",
          style: "success"
        },
        {
          text: "💻 ᴄᴏᴅɪɴɢ",
          callback_data: "aria_mode_coding",
          style: "primary"
        }
      ],

      [
        {
          text: "🔎 ʀᴇsᴇᴀʀᴄʜ",
          callback_data: "aria_mode_research",
          style: "primary"
        },
        {
          text: "🎨 ᴄʀᴇᴀᴛɪᴠᴇ",
          callback_data: "aria_mode_creative",
          style: "primary"
        }
      ],

      [
        {
          text: "📚 ᴛᴜᴛᴏʀ",
          callback_data: "aria_mode_tutor",
          style: "primary"
        },
        {
          text: "🧠 ᴀᴜᴛᴏ",
          callback_data: "aria_mode_auto",
          style: "success"
        }
      ],

      [
        {
          text: "🏠 ᴍᴀɪɴ ᴍᴇɴᴜ",
          callback_data: "main_menu",
          style: "success"
        }
      ]
    ]
  };
}

/*
 * ============================================================
 * AI RESPONSE KEYBOARD
 * ============================================================
 */

function responseKeyboard(responseText) {
  const copyText =
    String(responseText || "")
      .slice(0, 256) ||
    "ᴍɪss ᴀʀɪᴀ";

  return {
    inline_keyboard: [
      [
        {
          text: "📋 ᴄᴏᴘʏ",
          copy_text: {
            text: copyText
          },
          style: "success"
        },
        {
          text: "🔄 ʀᴇɢᴇɴᴇʀᴀᴛᴇ",
          callback_data: "aria_regenerate",
          style: "primary"
        }
      ],

      [
        {
          text: "💾 sᴀᴠᴇ",
          callback_data: "aria_save_response",
          style: "success"
        },
        {
          text: "✨ ɪᴍᴘʀᴏᴠᴇ",
          callback_data: "aria_improve",
          style: "primary"
        }
      ],

      [
        {
          text: "➡️ ᴄᴏɴᴛɪɴᴜᴇ",
          callback_data: "aria_continue",
          style: "primary"
        },
        {
          text: "🗑️ ᴅᴇʟᴇᴛᴇ",
          callback_data: "aria_delete_response",
          style: "primary"
        }
      ]
    ]
  };
}

/*
 * ============================================================
 * RESPONSE MESSAGE TRACKING
 * ============================================================
 */

function rememberResponseMessages(
  userId,
  messageIds
) {
  const ids = Array.isArray(messageIds)
    ? messageIds
        .filter(Boolean)
        .map(Number)
    : [];

  lastResponseMessageIds.set(
    String(userId),
    ids
  );
}

async function deletePreviousResponseMessages(
  bot,
  chatId,
  userId
) {
  const key = String(userId);

  const ids =
    lastResponseMessageIds.get(key) || [];

  lastResponseMessageIds.delete(key);

  for (const messageId of ids) {
    try {
      await bot.deleteMessage(
        chatId,
        messageId
      );
    } catch {}
  }
}

/*
 * ============================================================
 * CARD
 * ============================================================
 */

const sendCard = async (
  bot,
  chatId,
  text,
  reply_markup
) => {
  // Rich cards are the primary presentation. If Telegram rejects the
  // Rich Message API, the existing photo + HTML path remains untouched.
  const richSent =
    await richTelegram.trySendRichCard(
      bot,
      chatId,
      {
        imageUrl: ARIA_IMAGE,
        title: "🌸 ᴍɪss ᴀʀɪᴀ",
        text: stripHtml(text),
        replyMarkup: reply_markup
      }
    );

  if (richSent) return richSent;

  return bot
    .sendPhoto(
      chatId,
      ARIA_IMAGE,
      {
        caption: text,
        parse_mode: "HTML",

        ...(reply_markup
          ? {
              reply_markup
            }
          : {})
      }
    )
    .catch(() =>
      bot.sendMessage(
        chatId,
        text,
        {
          parse_mode: "HTML",

          ...(reply_markup
            ? {
                reply_markup
              }
            : {})
        }
      )
    );
};

/*
 * ============================================================
 * REGISTER
 * ============================================================
 */

function register(ctx) {
  const { bot } = ctx;

  /*
   * ============================================================
   * TELEGRAM BOT USERNAME
   * ============================================================
   */

  let ariaMentionUsername =
    String(
      process.env.TELEGRAM_BOT_USERNAME ||
        process.env.BOT_USERNAME ||
        "missariaai_bot"
    )
      .replace(/^@/, "")
      .trim();

  bot
    .getMe()
    .then((me) => {
      if (me?.username) {
        ariaMentionUsername =
          String(me.username)
            .replace(/^@/, "")
            .trim();

        console.log(
          `[ARIA] Telegram username detected: @${ariaMentionUsername}`
        );
      }
    })
    .catch((err) => {
      console.error(
        "[ARIA] getMe failed:",
        err?.message || err
      );
    });

  /*
   * ============================================================
   * REAL MAIN MENU HELPERS
   * ============================================================
   *
   * These MUST come from your existing main bot menu.
   *
   * We do NOT duplicate the menu here.
   */

  function getRealMainMenuKeyboard(
    userId,
    page = 1
  ) {
    if (
      typeof ctx.mainMenuKeyboard ===
      "function"
    ) {
      return ctx.mainMenuKeyboard(
        userId,
        page
      );
    }

    /*
     * If your main menu functions are attached
     * directly to the runtime object instead.
     */

    if (
      typeof ctx.mainMenu?.keyboard ===
      "function"
    ) {
      return ctx.mainMenu.keyboard(
        userId,
        page
      );
    }

    throw new Error(
      "mainMenuKeyboard is not available on ctx"
    );
  }

  function getRealMainMenuText(
    userId,
    page = 1
  ) {
    if (
      typeof ctx.mainMenuPageText ===
      "function"
    ) {
      return ctx.mainMenuPageText(
        userId,
        page
      );
    }

    if (
      typeof ctx.mainMenu?.pageText ===
      "function"
    ) {
      return ctx.mainMenu.pageText(
        userId,
        page
      );
    }

    if (
      typeof ctx.mainMenuText ===
      "function"
    ) {
      return `${ctx.mainMenuText(
        userId
      )}

<blockquote>🌸 <b>ᴘᴀɢᴇ ${page}</b></blockquote>`;
    }

    throw new Error(
      "mainMenuPageText is not available on ctx"
    );
  }

  /*
   * ============================================================
   * INLINE QUERY
   * ============================================================
   */

  bot.on(
    "inline_query",
    async (q) => {
      const userId =
        q?.from?.id;

      try {
        const query =
          String(
            q?.query || ""
          ).trim();

        /*
         * ======================================================
         * EMPTY QUERY
         * ======================================================
         *
         * @missariaai_bot
         *
         * This now displays the REAL MAIN MENU.
         */

        if (!query) {
          let menuKeyboard;
          let menuText;

          try {
            menuKeyboard =
              getRealMainMenuKeyboard(
                userId,
                1
              );

            menuText =
              getRealMainMenuText(
                userId,
                1
              );
          } catch (menuError) {
            console.error(
              "[ARIA INLINE MENU ERROR]",
              menuError?.stack ||
                menuError
            );

            /*
             * Don't silently return an empty result.
             */

            await bot.answerInlineQuery(
              q.id,
              [
                {
                  type: "article",

                  id:
                    `aria_menu_error_${userId}_${Date.now()}`,

                  title:
                    "🌸 ᴍɪss ᴀʀɪᴀ",

                  description:
                    "ᴍᴀɪɴ ᴍᴇɴᴜ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ.",

                  thumb_url:
                    ARIA_IMAGE,

                  input_message_content:
                    {
                      message_text:
                        "<blockquote>" +
                        "<b>🌸 ᴍɪss ᴀʀɪᴀ</b>\n\n" +
                        "ᴍʏ ᴍᴀɪɴ ᴍᴇɴᴜ ɪs ᴛᴇᴍᴘᴏʀᴀʀɪʟʏ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ." +
                        "</blockquote>",

                      parse_mode:
                        "HTML"
                    }
                }
              ],
              {
                cache_time: 0,
                is_personal: true
              }
            );

            return;
          }

          /*
           * ====================================================
           * REAL MENU RESULT
           * ====================================================
           *
           * No copied buttons.
           *
           * This is EXACTLY:
           *
           * mainMenuKeyboard(userId, 1)
           */

          await bot.answerInlineQuery(
            q.id,
            [
              {
                type: "article",

                id:
                  `aria_main_menu_${userId}_${Date.now()}`,

                title:
                  "🌸 ᴍɪss ᴀʀɪᴀ — ᴍᴀɪɴ ᴍᴇɴᴜ",

                description:
                  "ᴄʜᴀᴛ • ᴘʀᴏғɪʟᴇ • ᴀɪ • ɪᴍᴀɢᴇs • ғɪʟᴇs • ᴍᴏʀᴇ",

                thumb_url:
                  ARIA_IMAGE,

                input_message_content:
                  {
                    message_text:
                      menuText,

                    parse_mode:
                      "HTML"
                  },

                reply_markup:
                  menuKeyboard
              }
            ],
            {
              cache_time: 0,

              /*
               * IMPORTANT:
               *
               * Every user gets their own menu
               * based on their premium/admin state.
               */

              is_personal: true
            }
          );

          console.log(
            `[ARIA INLINE] REAL MAIN MENU returned | user=${userId}`
          );

          return;
        }

        /*
         * ======================================================
         * AI INLINE QUERY
         * ======================================================
         *
         * Example:
         *
         * @missariaai_bot hello aria
         */

        if (
          typeof ctx.processWithFailover !==
          "function"
        ) {
          throw new Error(
            "ctx.processWithFailover is not available"
          );
        }

        const history =
          prefs.memoryEnabled(
            userId
          ) &&
          ctx.userHistory?.get
            ? ctx.userHistory.get(
                userId
              ) || []
            : [];

        const result =
          await ctx.processWithFailover(
            userId,
            query,
            history,
            {
              msg: {
                chat: {
                  id: userId,
                  type: "private"
                },

                from: q.from,

                message_id:
                  undefined
              }
            }
          );

        const answer =
          result?.success &&
          result?.response
            ? String(
                result.response
              )
            : "🌸 ᴍɪss ᴀʀɪᴀ ᴄᴏᴜʟᴅɴ'ᴛ ᴘʀᴏᴄᴇss ᴛʜᴀᴛ ʀɪɢʜᴛ ɴᴏᴡ.";

        const plain =
          stripHtml(answer);

        let formatted;

        try {
          const formattedParts =
            formatter.formatAiReplyForTelegram(
              answer
            );

          formatted =
            Array.isArray(
              formattedParts
            )
              ? formattedParts.join(
                  "\n\n"
                )
              : String(
                  formattedParts ||
                    esc(answer)
                );
        } catch {
          formatted =
            esc(answer);
        }

        await bot.answerInlineQuery(
          q.id,
          [
            {
              type: "article",

              id:
                `aria_answer_${userId}_${Date.now()}`,

              title:
                `🌸 ᴍɪss ᴀʀɪᴀ — ${query.slice(
                  0,
                  60
                )}`,

              description:
                plain.slice(
                  0,
                  180
                ),

              thumb_url:
                ARIA_IMAGE,

              input_message_content:
                {
                  message_text:
                    `<blockquote><b>🌸 ᴍɪss ᴀʀɪᴀ</b>\n\n${formatted}</blockquote>`,

                  parse_mode:
                    "HTML"
                }
            }
          ],
          {
            cache_time: 0,
            is_personal: true
          }
        );
      } catch (err) {
        console.error(
          "[ARIA INLINE ERROR]",
          err?.stack || err
        );

        try {
          await bot.answerInlineQuery(
            q.id,
            [
              {
                type: "article",

                id:
                  `aria_error_${userId || "x"}_${Date.now()}`,

                title:
                  "🌸 ᴍɪss ᴀʀɪᴀ",

                description:
                  "ᴛʀʏ ᴀɢᴀɪɴ.",

                thumb_url:
                  ARIA_IMAGE,

                input_message_content:
                  {
                    message_text:
                      "<blockquote>" +
                      "<b>🌸 ᴍɪss ᴀʀɪᴀ</b>\n\n" +
                      "ᴛʀʏ ᴍᴇ ᴀɢᴀɪɴ. 🌸" +
                      "</blockquote>",

                    parse_mode:
                      "HTML"
                  }
              }
            ],
            {
              cache_time: 0,
              is_personal: true
            }
          );
        } catch {}
      }
    }
  );

  /*
   * ============================================================
   * ARIA COMPANION API
   * ============================================================
   */

  ctx.ariaAiCompanion = {
    rememberPrompt(
      id,
      prompt
    ) {
      if (prompt) {
        lastPrompts.set(
          String(id),
          String(prompt)
        );
      }
    },

    rememberResponse(
      id,
      response
    ) {
      if (response) {
        lastResponses.set(
          String(id),
          String(response)
        );
      }
    },

    getLastPrompt(id) {
      return (
        lastPrompts.get(
          String(id)
        ) || ""
      );
    },

    getLastResponse(id) {
      return (
        lastResponses.get(
          String(id)
        ) || ""
      );
    },

    setMode(
      id,
      mode
    ) {
      prefs.setMode(
        id,
        mode
      );
    },

    getMode(id) {
      return prefs.getMode(id);
    },

    label(id) {
      return (
        MODE_LABELS[
          prefs.getMode(id)
        ] ||
        MODE_LABELS.chat
      );
    },

    rememberResponseMessages(
      id,
      messageIds
    ) {
      rememberResponseMessages(
        id,
        messageIds
      );
    },

    deletePreviousResponseMessages(
      chatId,
      id
    ) {
      return deletePreviousResponseMessages(
        bot,
        chatId,
        id
      );
    }
  };

  /*
   * ============================================================
   * TELEGRAM RICH DEMO
   * ============================================================
   *
   * A small Telegram-native showcase: semantic heading, divider,
   * table, photo and normal inline keyboard.
   */
  bot.onText(
    /^\/rich(?:demo)?(?:@\w+)?$/i,
    async (msg) => {
      const sent = await richTelegram.trySendRichCard(
        bot,
        msg.chat.id,
        {
          imageUrl: ARIA_IMAGE,
          title: "🌸 ᴍɪss ᴀʀɪᴀ • ᴛᴇʟᴇɢʀᴀᴍ ʀɪᴄʜ",
          text:
            "ᴛʜɪs ɪs ᴀʀɪᴀ's ᴛᴇʟᴇɢʀᴀᴍ ʀɪᴄʜ ᴍᴏᴅᴇ — ᴄʟᴇᴀɴ ᴄᴀʀᴅs, sᴇᴍᴀɴᴛɪᴄ ᴛᴀʙʟᴇs, ᴀɴᴅ ɪɴʟɪɴᴇ ʙᴜᴛᴛᴏɴs. ✨",
          table: {
            headers: ["Feature", "Status"],
            rows: [
              ["Rich cards", "✓"],
              ["Tables", "✓"],
              ["Inline buttons", "✓"],
              ["HTML fallback", "✓"]
            ],
            options: {
              bordered: true,
              striped: true,
              caption: "Miss Aria Telegram features"
            }
          },
          replyMarkup: {
            inline_keyboard: [
              [
                {
                  text: "💬 ᴄʜᴀᴛ",
                  callback_data: "v10_chat",
                  style: "success"
                },
                {
                  text: "🏠 ᴍᴇɴᴜ",
                  callback_data: "main_menu",
                  style: "primary"
                }
              ]
            ]
          }
        }
      );

      if (!sent) {
        return bot.sendMessage(
          msg.chat.id,
          "<blockquote><b>🌸 ᴍɪss ᴀʀɪᴀ • ᴛᴇʟᴇɢʀᴀᴍ ʀɪᴄʜ</b>\\n\\nʀɪᴄʜ ᴍᴏᴅᴇ ɪsɴ'ᴛ ᴀᴠᴀɪʟᴀʙʟᴇ ʜᴇʀᴇ ʏᴇᴛ — ᴜsɪɴɢ ɴᴏʀᴍᴀʟ ᴛᴇʟᴇɢʀᴀᴍ ᴍᴏᴅᴇ. 🌸</blockquote>",
          {
            parse_mode: "HTML"
          }
        );
      }

      return sent;
    }
  );

  /*
   * ============================================================
   * CLEAR
   * ============================================================
   */

  bot.onText(
    /^\/(?:clear|clearchat|resetai)(?:@\w+)?$/i,
    async (msg) => {
      if (
        ctx.userHistory?.delete
      ) {
        ctx.userHistory.delete(
          msg.from.id
        );
      }

      lastPrompts.delete(
        String(msg.from.id)
      );

      lastResponses.delete(
        String(msg.from.id)
      );

      return sendCard(
        bot,
        msg.chat.id,

        "<blockquote>" +
          "<b>🧹 ᴄʜᴀᴛ ᴄʟᴇᴀʀᴇᴅ</b>\n\n" +
          "ᴀʀɪᴀ's ᴄᴜʀʀᴇɴᴛ ᴄʜᴀᴛ ʜɪsᴛᴏʀʏ ʜᴀs ʙᴇᴇɴ ᴄʟᴇᴀʀᴇᴅ. 🌸" +
          "</blockquote>",

        modeKeyboard()
      );
    }
  );

  /*
   * ============================================================
   * AI MODES
   * ============================================================
   */

  bot.onText(
    /^\/(?:ai|modes)(?:@\w+)?(?:\s+mode)?$/i,
    async (msg) => {
      const mode =
        prefs.getMode(
          msg.from.id
        );

      return sendCard(
        bot,
        msg.chat.id,

        `<blockquote><b>🧠 ᴀʀɪᴀ ᴀɪ ᴍᴏᴅᴇs</b>\n\n` +
          `ᴄᴜʀʀᴇɴᴛ: <b>${
            MODE_LABELS[mode]
          }</b>\n\n` +
          `ᴄʜᴏᴏsᴇ ᴀ ᴍᴏᴅᴇ ᴏʀ ᴜsᴇ ᴀᴜᴛᴏ.</blockquote>`,

        modeKeyboard()
      );
    }
  );

  /*
   * ============================================================
   * MEMORY
   * ============================================================
   */

  bot.onText(
    /^\/memory(?:@\w+)?$/i,
    async (msg) => {
      const enabled =
        prefs.memoryEnabled(
          msg.from.id
        );

      return sendCard(
        bot,
        msg.chat.id,

        `<blockquote><b>🧠 ᴍᴇᴍᴏʀʏ sᴇᴛᴛɪɴɢs</b>\n\n` +
          `ᴄᴜʀʀᴇɴᴛ: <b>${
            enabled
              ? "ᴏɴ"
              : "ᴏғғ"
          }</b></blockquote>`,

        {
          inline_keyboard: [
            [
              {
                text:
                  enabled
                    ? "🔴 ᴛᴜʀɴ ᴏғғ"
                    : "🟢 ᴛᴜʀɴ ᴏɴ",

                callback_data:
                  "aria_memory_toggle",

                style:
                  enabled
                    ? "primary"
                    : "success"
              }
            ],

            [
              {
                text:
                  "🧹 ᴄʟᴇᴀʀ ᴍᴇᴍᴏʀʏ",

                callback_data:
                  "aria_clear_history",

                style:
                  "primary"
              }
            ]
          ]
        }
      );
    }
  );

  /*
   * ============================================================
   * TRANSFORM COMMANDS
   * ============================================================
   */

  bot.onText(
    /^\/improve(?:@\w+)?$/i,
    async (msg) =>
      runTransform(
        ctx,
        msg,
        "Improve the previous answer. Make it clearer, more useful, accurate, and well structured. Return only the improved answer."
      )
  );

  bot.onText(
    /^\/continue(?:@\w+)?$/i,
    async (msg) =>
      runTransform(
        ctx,
        msg,
        "Continue the previous answer naturally from where it stopped. Do not repeat the previous answer. Return only the continuation."
      )
  );

  bot.onText(
    /^\/regenerate(?:@\w+)?$/i,
    async (msg) =>
      runTransform(
        ctx,
        msg,
        "Give a fresh alternative answer to the previous user request. Do not mention that you are regenerating it."
      )
  );

  /*
   * ============================================================
   * NORMAL @MISSARIA MENTIONS
   * ============================================================
   */

  bot.on(
    "message",
    async (msg) => {
      if (
        !msg?.from ||
        !msg.text ||
        /^\//.test(
          msg.text.trim()
        )
      ) {
        return;
      }

      if (
        msg.chat?.type ===
        "private"
      ) {
        lastPrompts.set(
          String(msg.from.id),
          msg.text.trim()
        );
      }

      if (
        !ariaMentionUsername
      ) {
        return;
      }

      const escapedUsername =
        ariaMentionUsername.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      const mentionRe =
        new RegExp(
          `(^|[^\\w])@${escapedUsername}(?=$|[^\\w])`,
          "i"
        );

      if (
        !mentionRe.test(
          msg.text
        )
      ) {
        return;
      }

      const prompt =
        msg.text
          .replace(
            mentionRe,
            "$1"
          )
          .replace(
            /\s{2,}/g,
            " "
          )
          .trim();

      /*
       * Mention only:
       *
       * @missariaai_bot
       *
       * Use the REAL main menu.
       */

      if (!prompt) {
        try {
          /*
           * Prefer your existing sendMainMenu()
           * because that is exactly what /start uses.
           */

          if (
            typeof ctx.sendMainMenu ===
            "function"
          ) {
            return ctx.sendMainMenu(
              msg.chat.id,
              msg.from.id,
              1
            );
          }

          /*
           * Otherwise directly use the real
           * menu functions.
           */

          const keyboard =
            getRealMainMenuKeyboard(
              msg.from.id,
              1
            );

          const text =
            getRealMainMenuText(
              msg.from.id,
              1
            );

          return bot.sendMessage(
            msg.chat.id,
            text,
            {
              parse_mode:
                "HTML",

              reply_markup:
                keyboard
            }
          );
        } catch (err) {
          console.error(
            "[ARIA MAIN MENU]",
            err?.stack || err
          );

          return bot.sendMessage(
            msg.chat.id,
            "<blockquote>❌ ᴍᴀɪɴ ᴍᴇɴᴜ ᴄᴏᴜʟᴅ ɴᴏᴛ ʙᴇ ʟᴏᴀᴅᴇᴅ.</blockquote>",
            {
              parse_mode:
                "HTML"
            }
          );
        }
      }

      const id =
        String(
          msg.from.id
        );

      if (
        busy.has(id)
      ) {
        return;
      }

      busy.add(id);

      try {
        const history =
          prefs.memoryEnabled(
            id
          ) &&
          ctx.userHistory?.get
            ? ctx.userHistory.get(
                msg.from.id
              ) || []
            : [];

        const result =
          await ctx.processWithFailover(
            msg.from.id,
            prompt,
            history,
            {
              msg: {
                chat:
                  msg.chat,

                from:
                  msg.from,

                message_id:
                  msg.message_id
              }
            }
          );

        if (
          !result?.success ||
          !result.response
        ) {
          return bot.sendMessage(
            msg.chat.id,
            "❌ ᴀʀɪᴀ ᴄᴏᴜʟᴅɴ'ᴛ ᴄᴏᴍᴘʟᴇᴛᴇ ᴛʜᴀᴛ ʀᴇǫᴜᴇsᴛ."
          );
        }

        lastPrompts.set(
          id,
          prompt
        );

        lastResponses.set(
          id,
          String(
            result.response
          )
        );

        const richSent =
          await richTelegram.trySendRichCard(
            bot,
            msg.chat.id,
            {
              imageUrl: ARIA_IMAGE,
              title: "🌸 ᴍɪss ᴀʀɪᴀ",
              text: String(result.response),
              replyMarkup: responseKeyboard(result.response),
              replyToMessageId: msg.message_id
            }
          );

        const sentIds =
          [];

        if (richSent?.message_id) {
          sentIds.push(richSent.message_id);
        } else {
          const parts =
            formatter.formatAiReplyForTelegram(
              result.response
            );

          for (
            let i = 0;
            i < parts.length;
            i++
          ) {
            const sent =
              await bot.sendMessage(
                msg.chat.id,
                parts[i],
                {
                  parse_mode:
                    "HTML",

                  reply_to_message_id:
                    msg.message_id,

                  ...(i ===
                  parts.length - 1
                    ? {
                        reply_markup:
                          responseKeyboard(
                            result.response
                          )
                      }
                    : {})
                }
              );

            if (sent?.message_id) {
              sentIds.push(sent.message_id);
            }
          }
        }

        rememberResponseMessages(
          id,
          sentIds
        );

        if (
          ctx.userHistory?.set
        ) {
          history.push(
            {
              role:
                "user",
              content:
                prompt
            },
            {
              role:
                "assistant",
              content:
                result.response
            }
          );

          if (
            history.length >
            40
          ) {
            history.splice(
              0,
              history.length -
                40
            );
          }

          ctx.userHistory.set(
            msg.from.id,
            history
          );
        }
      } catch (err) {
        console.error(
          "[ARIA MENTION]",
          err?.stack || err
        );

        await bot
          .sendMessage(
            msg.chat.id,
            "❌ ᴀʀɪᴀ ʜɪᴛ ᴀ ᴛᴇᴍᴘᴏʀᴀʀʏ ᴘʀᴏʙʟᴇᴍ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ."
          )
          .catch(() => {});
      } finally {
        busy.delete(id);
      }
    }
  );
}

/*
 * ============================================================
 * TRANSFORM
 * ============================================================
 */

async function runTransform(
  ctx,
  msg,
  instruction
) {
  const bot =
    ctx.bot;

  const id =
    String(
      msg.from.id
    );

  if (
    busy.has(id)
  ) {
    return bot.sendMessage(
      msg.chat.id,
      "⏳ ᴀʀɪᴀ ɪs ᴀʟʀᴇᴀᴅʏ ᴡᴏʀᴋɪɴɢ ᴏɴ ʏᴏᴜʀ ʀᴇǫᴜᴇsᴛ."
    );
  }

  const previous =
    lastResponses.get(
      id
    );

  const prompt =
    lastPrompts.get(
      id
    );

  if (
    !prompt &&
    !previous
  ) {
    return sendCard(
      bot,
      msg.chat.id,
      "<blockquote>🌸 sᴇɴᴅ ᴀ ᴍᴇssᴀɢᴇ ᴛᴏ ᴀʀɪᴀ ғɪʀsᴛ.</blockquote>"
    );
  }

  busy.add(id);

  try {
    const history =
      prefs.memoryEnabled(
        id
      ) &&
      ctx.userHistory?.get
        ? ctx.userHistory.get(
            msg.from.id
          ) || []
        : [];

    const request =
      previous
        ? `${instruction}\n\nPrevious answer:\n${previous}`
        : `${instruction}\n\nUser request:\n${prompt}`;

    const result =
      await ctx.processWithFailover(
        msg.from.id,
        request,
        history,
        {
          msg: {
            chat: {
              id:
                msg.chat.id,
              type:
                "private"
            },

            from:
              msg.from
          }
        }
      );

    if (
      !result?.success ||
      !result.response
    ) {
      return sendCard(
        bot,
        msg.chat.id,
        "<blockquote>❌ ᴀʀɪᴀ ᴄᴏᴜʟᴅɴ'ᴛ ᴄᴏᴍᴘʟᴇᴛᴇ ᴛʜᴀᴛ ʀᴇǫᴜᴇsᴛ.</blockquote>"
      );
    }

    lastResponses.set(
      id,
      String(
        result.response
      )
    );

    const richSent =
      await richTelegram.trySendRichCard(
        bot,
        msg.chat.id,
        {
          imageUrl: ARIA_IMAGE,
          title: "🌸 ᴍɪss ᴀʀɪᴀ",
          text: String(result.response),
          replyMarkup: responseKeyboard(result.response)
        }
      );

    const sentIds =
      [];

    if (richSent?.message_id) {
      sentIds.push(richSent.message_id);
    } else {
      const parts =
        formatter.formatAiReplyForTelegram(
          result.response
        );

      for (
        let i = 0;
        i < parts.length;
        i++
      ) {
        const sent =
          await bot.sendMessage(
            msg.chat.id,
            parts[i],
            {
              parse_mode:
                "HTML",

              ...(i ===
              parts.length - 1
                ? {
                    reply_markup:
                      responseKeyboard(
                        result.response
                      )
                  }
                : {})
            }
          );

        if (sent?.message_id) {
          sentIds.push(sent.message_id);
        }
      }
    }

    rememberResponseMessages(
      id,
      sentIds
    );
  } catch (err) {
    console.error(
      "[ARIA TRANSFORM]",
      err?.stack || err
    );

    await sendCard(
      bot,
      msg.chat.id,
      "<blockquote>❌ ᴀʀɪᴀ ʜɪᴛ ᴀ ᴛᴇᴍᴘᴏʀᴀʀʏ ᴘʀᴏʙʟᴇᴍ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.</blockquote>"
    );
  } finally {
    busy.delete(id);
  }
}

module.exports =
  register;
