const Database = require("better-sqlite3");
const path = require("path");

// ============================================================
// DATABASE
// ============================================================

const db = new Database(
    path.join(__dirname, "aria.sqlite")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,

        email TEXT DEFAULT NULL,

        premium INTEGER DEFAULT 0,
        admin INTEGER DEFAULT 0,

        model TEXT DEFAULT 'gemini',
        personality TEXT DEFAULT 'friendly',
        language TEXT DEFAULT 'en',

        notifications INTEGER DEFAULT 0,
        memory_enabled INTEGER DEFAULT 1,
        privacy_enabled INTEGER DEFAULT 1,

        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,

        created_at INTEGER DEFAULT (strftime('%s', 'now')),

        FOREIGN KEY (user_id)
            REFERENCES users(user_id)
            ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_memories_user_id
    ON memories(user_id);
`);

// ============================================================
// TELEGRAM CUSTOM EMOJIS
// ============================================================

// Keep your Telegram Premium/custom emoji IDs here.

const TG_EMOJI = {
    rocket: '<tg-emoji emoji-id="5368324170671202286">🚀</tg-emoji>',

    trash: '<tg-emoji emoji-id="5368324170671202286">🗑️</tg-emoji>',

    settings: '<tg-emoji emoji-id="5368324170671202286">⚙️</tg-emoji>',

    robot: '<tg-emoji emoji-id="5368324170671202286">🤖</tg-emoji>',

    memory: '<tg-emoji emoji-id="5368324170671202286">💬</tg-emoji>',

    notification: '<tg-emoji emoji-id="5368324170671202286">🔔</tg-emoji>',

    language: '<tg-emoji emoji-id="5368324170671202286">🌐</tg-emoji>',

    account: '<tg-emoji emoji-id="5368324170671202286">👤</tg-emoji>',

    privacy: '<tg-emoji emoji-id="5368324170671202286">🔒</tg-emoji>',

    personality: '<tg-emoji emoji-id="5368324170671202286">🎨</tg-emoji>',

    logout: '<tg-emoji emoji-id="5368324170671202286">🚪</tg-emoji>'
};

// ============================================================
// AI MODELS
// ============================================================

const AI_MODELS = {

    gemini: {
        name: "Gemini 3.0",
        badge: "♊",
        tier: "free"
    },

    gpt: {
        name: "GPT-5.5",
        badge: "🤖",
        tier: "premium"
    },

    claude: {
        name: "Claude",
        badge: "🧠",
        tier: "premium"
    },

    grok: {
        name: "Grok",
        badge: "⚡",
        tier: "premium"
    }
};

// ============================================================
// LANGUAGES
// ============================================================

const LANGUAGES = {

    en: {
        name: "English",
        flag: "🇺🇸"
    },

    fr: {
        name: "French",
        flag: "🇫🇷"
    },

    sp: {
        name: "Spanish",
        flag: "🇪🇸"
    },

    pt: {
        name: "Portuguese",
        flag: "🇵🇹"
    }
};

// ============================================================
// PERSONALITIES
// ============================================================

const PERSONALITIES = {

    friendly: {
        name: "Friendly",
        emoji: "😊"
    },

    tutor: {
        name: "Tutor",
        emoji: "🎓"
    },

    professional: {
        name: "Professional",
        emoji: "💼"
    },

    funny: {
        name: "Funny",
        emoji: "😂"
    }
};

// ============================================================
// DATABASE HELPERS
// ============================================================

function createUser(userId) {

    db.prepare(`
        INSERT OR IGNORE INTO users (user_id)
        VALUES (?)
    `).run(userId);
}


function getUser(userId) {

    createUser(userId);

    return db.prepare(`
        SELECT *
        FROM users
        WHERE user_id = ?
    `).get(userId);
}


function updateUser(userId, field, value) {

    const allowedFields = [
        "email",
        "premium",
        "admin",
        "model",
        "personality",
        "language",
        "notifications",
        "memory_enabled",
        "privacy_enabled"
    ];

    if (!allowedFields.includes(field)) {
        throw new Error(
            `Invalid user field: ${field}`
        );
    }

    createUser(userId);

    db.prepare(`
        UPDATE users

        SET ${field} = ?,
            updated_at = strftime('%s', 'now')

        WHERE user_id = ?
    `).run(value, userId);
}

// ============================================================
// ACCOUNT
// ============================================================

function setEmail(userId, email) {

    updateUser(
        userId,
        "email",
        email
    );
}


function setPremium(userId, enabled) {

    updateUser(
        userId,
        "premium",
        enabled ? 1 : 0
    );
}


function setAdmin(userId, enabled) {

    updateUser(
        userId,
        "admin",
        enabled ? 1 : 0
    );
}


function isPremiumUser(userId) {

    return !!getUser(userId).premium;
}


function isAdmin(userId) {

    return !!getUser(userId).admin;
}

// ============================================================
// MODEL
// ============================================================

function getUserModel(userId) {

    return getUser(userId).model;
}


function setUserModel(userId, model) {

    if (!AI_MODELS[model]) {
        throw new Error(
            `Unknown AI model: ${model}`
        );
    }

    updateUser(
        userId,
        "model",
        model
    );
}

// ============================================================
// PERSONALITY
// ============================================================

function getPersonality(userId) {

    return getUser(userId).personality;
}


function setPersonality(userId, personality) {

    if (!PERSONALITIES[personality]) {
        throw new Error(
            `Unknown personality: ${personality}`
        );
    }

    updateUser(
        userId,
        "personality",
        personality
    );
}

// ============================================================
// LANGUAGE
// ============================================================

function getLanguage(userId) {

    return getUser(userId).language;
}


function setUserLanguage(userId, language) {

    if (!LANGUAGES[language]) {
        throw new Error(
            `Unknown language: ${language}`
        );
    }

    updateUser(
        userId,
        "language",
        language
    );
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function enableNotifications(userId) {

    updateUser(
        userId,
        "notifications",
        1
    );
}


function disableNotifications(userId) {

    updateUser(
        userId,
        "notifications",
        0
    );
}


function hasNotifications(userId) {

    return !!getUser(userId).notifications;
}


function getNotificationUsers() {

    return db.prepare(`
        SELECT user_id
        FROM users
        WHERE notifications = 1
    `).all();
}

// ============================================================
// MEMORY
// ============================================================

function isMemoryEnabled(userId) {

    return !!getUser(userId).memory_enabled;
}


function setMemoryEnabled(userId, enabled) {

    updateUser(
        userId,
        "memory_enabled",
        enabled ? 1 : 0
    );
}


function addMemory(userId, role, content) {

    createUser(userId);

    db.prepare(`
        INSERT INTO memories (
            user_id,
            role,
            content
        )

        VALUES (?, ?, ?)
    `).run(
        userId,
        role,
        content
    );
}


function getMemory(userId, limit = 30) {

    createUser(userId);

    return db.prepare(`
        SELECT role, content
        FROM memories

        WHERE user_id = ?

        ORDER BY id DESC

        LIMIT ?
    `).all(
        userId,
        limit
    ).reverse();
}


function clearMemory(userId) {

    db.prepare(`
        DELETE FROM memories
        WHERE user_id = ?
    `).run(userId);
}

// ============================================================
// PRIVACY
// ============================================================

function isPrivacyEnabled(userId) {

    return !!getUser(userId).privacy_enabled;
}


function setPrivacyEnabled(userId, enabled) {

    updateUser(
        userId,
        "privacy_enabled",
        enabled ? 1 : 0
    );
}

// ============================================================
// DELETE USER
// ============================================================

function deleteUser(userId) {

    db.prepare(`
        DELETE FROM users
        WHERE user_id = ?
    `).run(userId);
}

// ============================================================
// SETTINGS BOT
// ============================================================

module.exports = (bot) => {

    // ========================================================
    // CALLBACK QUERY
    // ========================================================

    bot.on("callback_query", async (query) => {

        const chatId =
            query.message?.chat?.id;

        const messageId =
            query.message?.message_id;

        const userId =
            query.from.id;

        const data =
            query.data;

        if (!chatId || !messageId) {
            return;
        }

        try {

            // Make sure user exists
            createUser(userId);

            // Answer callback
            await bot.answerCallbackQuery(
                query.id
            );

            // ==================================================
            // SETTINGS HOME
            // ==================================================

            if (data === "settings_home") {

                await bot.editMessageCaption(
                    `${TG_EMOJI.settings} <b>мιѕѕ αяια ѕєттιηgѕ</b>

Choose what you'd like to manage.`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text: "👤 α¢¢συηт",
                                        callback_data:
                                            "settings_account",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "🤖 αι мσ∂єℓ",
                                        callback_data:
                                            "settings_model",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🎨 ρєяѕσηαℓιту",
                                        callback_data:
                                            "settings_personality",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "💬 мємσяу",
                                        callback_data:
                                            "settings_memory",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🔒 ρяινα¢у",
                                        callback_data:
                                            "settings_privacy",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "🌐 ℓαηgυαgє",
                                        callback_data:
                                            "settings_language",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🔔 ησтιƒι¢αтισηѕ",
                                        callback_data:
                                            "settings_notifications",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "🚪 ℓσgσυт",
                                        callback_data:
                                            "settings_logout",
                                        style: "danger"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            // ==================================================
            // ACCOUNT
            // ==================================================

            caseSettingsAccount: {

                if (data !== "settings_account") {
                    break caseSettingsAccount;
                }

                const user =
                    getUser(userId);

                await bot.editMessageCaption(
                    `${TG_EMOJI.account} <b>α¢¢συηт ιηƒσямαтιση</b>

📧 <b>ємαιℓ:</b> ${
                        user.email ||
                        "Not linked"
                    }

⭐ <b>ρяємιυм:</b> ${
                        user.premium
                            ? "✅ Active"
                            : "❌ Free"
                    }

🆔 <b>υѕєя ι∂:</b>
<code>${userId}</code>

Your account information is shown above.`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "primary"
                                    }

                                ]

                            ]
                        }
                    }
                );

                return;
            }

            // ==================================================
            // AI MODEL
            // ==================================================

            if (data === "settings_model") {

                const user =
                    getUser(userId);

                let text =
                    `${TG_EMOJI.robot} <b>αι мσ∂єℓ</b>\n\n`;

                text +=
                    `<b>¢υяяєηт мσ∂єℓ:</b> ${
                        AI_MODELS[user.model]?.name ||
                        user.model
                    }\n\n`;

                text +=
                    `Select your AI model:\n\n`;

                for (
                    const [key, model]
                    of Object.entries(AI_MODELS)
                ) {

                    const allowed =
                        model.tier === "free" ||
                        user.premium ||
                        user.admin;

                    text +=
                        `${allowed ? "✅" : "🔒"} `;

                    text +=
                        `${model.badge} `;

                    text +=
                        `<b>${model.name}</b>`;

                    if (user.model === key) {
                        text += " ◀️";
                    }

                    if (!allowed) {
                        text += " 💎";
                    }

                    text += "\n";
                }

                text +=
                    `\n🚧 More models are coming soon.`;

                await bot.editMessageCaption(
                    text,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text: "✨ gємιηι 3.0",
                                        callback_data:
                                            "model_gemini",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🤖 gρт-5.5",
                                        callback_data:
                                            "model_gpt",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "🧠 ¢ℓαυ∂є",
                                        callback_data:
                                            "model_claude",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "⚡ gяσк",
                                        callback_data:
                                            "model_grok",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "⏭️ ηєxт",
                                        callback_data:
                                            "next_model",
                                        style: "danger"
                                    }
                                ],

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            // ==================================================
            // MODEL SELECTION
            // ==================================================

            if (data.startsWith("model_")) {

                const model =
                    data.replace(
                        "model_",
                        ""
                    );

                const modelInfo =
                    AI_MODELS[model];

                if (!modelInfo) {
                    return;
                }

                const user =
                    getUser(userId);

                const allowed =
                    modelInfo.tier === "free" ||
                    user.premium ||
                    user.admin;

                if (!allowed) {

                    await bot.answerCallbackQuery(
                        query.id,
                        {
                            text:
                                "💎 Premium required for this model.",
                            show_alert: true
                        }
                    );

                    return;
                }

                setUserModel(
                    userId,
                    model
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            `✅ ${modelInfo.name} selected!`
                    }
                );

                return;
            }

            // ==================================================
            // PERSONALITY
            // ==================================================

            if (
                data ===
                "settings_personality"
            ) {

                const user =
                    getUser(userId);

                const personality =
                    PERSONALITIES[
                        user.personality
                    ];

                await bot.editMessageCaption(
                    `${TG_EMOJI.personality} <b>ρєяѕσηαℓιту</b>

<b>¢υяяєηт:</b> ${
                        personality?.emoji ||
                        "😊"
                    } ${
                        personality?.name ||
                        "Friendly"
                    }

Choose how Miss Aria responds.`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text: "😊 ƒяιєη∂ℓу",
                                        callback_data:
                                            "personality_friendly",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🎓 тυтσя",
                                        callback_data:
                                            "personality_tutor",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "💼 ρяσƒєѕѕισηαℓ",
                                        callback_data:
                                            "personality_professional",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "😂 ƒυηηу",
                                        callback_data:
                                            "personality_funny",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "success"
                                    }

                                ]

                            ]
                        }
                    }
                );

                return;
            }

            if (
                data.startsWith(
                    "personality_"
                )
            ) {

                const personality =
                    data.replace(
                        "personality_",
                        ""
                    );

                if (
                    !PERSONALITIES[
                        personality
                    ]
                ) {
                    return;
                }

                setPersonality(
                    userId,
                    personality
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            `🎨 ${PERSONALITIES[personality].name} selected!`
                    }
                );

                return;
            }

            // ==================================================
            // MEMORY
            // ==================================================

            if (data === "settings_memory") {

                const enabled =
                    isMemoryEnabled(userId);

                await bot.editMessageCaption(
                    `${TG_EMOJI.memory} <b>мємσяу ѕєттιηgѕ</b>

Your chats are private.

${
    enabled
        ? "✅"
        : "❌"
} <b>мємσяу:</b> ${
                        enabled
                            ? "Enabled"
                            : "Disabled"
                    }`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text:
                                            enabled
                                                ? "🔕 Disable Memory"
                                                : "💾 Enable Memory",

                                        callback_data:
                                            enabled
                                                ? "memory_disable"
                                                : "memory_enable",

                                        style:
                                            enabled
                                                ? "danger"
                                                : "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🗑️ ¢ℓєαя мємσяу",
                                        callback_data:
                                            "clear_memory",
                                        style: "danger"
                                    }
                                ],

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "👨🏻‍💻 σωηєя",
                                        url:
                                            "https://t.me/F3BAN",
                                        style: "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            if (data === "memory_enable") {

                setMemoryEnabled(
                    userId,
                    true
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "💾 Memory enabled!"
                    }
                );

                return;
            }

            if (data === "memory_disable") {

                setMemoryEnabled(
                    userId,
                    false
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🔕 Memory disabled!"
                    }
                );

                return;
            }

            if (data === "clear_memory") {

                clearMemory(userId);

                await bot.editMessageCaption(
                    `<blockquote expandable='true'>${TG_EMOJI.rocket}<b>мємσяу ѕтαтυѕ</b></blockquote>

${TG_EMOJI.trash}<b>уσυя ¢σηνєяѕαтιση мємσяу нαѕ вєєη ¢ℓєαяє∂.</b>`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_memory",
                                        style: "danger"
                                    }
                                ],

                                [
                                    {
                                        text: "👨🏻‍💻 σωηєя",
                                        url:
                                            "https://t.me/F3BAN",
                                        style: "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            // ==================================================
            // PRIVACY
            // ==================================================

            if (data === "settings_privacy") {

                const user =
                    getUser(userId);

                await bot.editMessageCaption(
                    `${TG_EMOJI.privacy} <b>ρяινα¢у ѕєттιηgѕ</b>

Your conversations are private.

🔐 <b>ρяινα¢у:</b> ${
                        user.privacy_enabled
                            ? "✅ Enabled"
                            : "❌ Disabled"
                    }`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text:
                                            user.privacy_enabled
                                                ? "🔓 Disable"
                                                : "🔒 Enable",

                                        callback_data:
                                            user.privacy_enabled
                                                ? "privacy_disable"
                                                : "privacy_enable",

                                        style:
                                            user.privacy_enabled
                                                ? "danger"
                                                : "success"
                                    }
                                ],

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            if (data === "privacy_enable") {

                setPrivacyEnabled(
                    userId,
                    true
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🔒 Privacy enabled!"
                    }
                );

                return;
            }

            if (data === "privacy_disable") {

                setPrivacyEnabled(
                    userId,
                    false
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🔓 Privacy disabled!"
                    }
                );

                return;
            }

            // ==================================================
            // LANGUAGE
            // ==================================================

            if (data === "settings_language") {

                const user =
                    getUser(userId);

                const language =
                    LANGUAGES[user.language] ||
                    LANGUAGES.en;

                await bot.editMessageCaption(
                    `${TG_EMOJI.language} <b>ℓαηgυαgє</b>

<b>¢υяяєηт ℓαηgυαgє:</b>
${language.flag} ${language.name}`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text: "🇺🇸 єηgℓιѕн",
                                        callback_data:
                                            "lang_en",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🇫🇷 ƒяєη¢н",
                                        callback_data:
                                            "lang_fr",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "🇪🇸 ѕραηιѕн",
                                        callback_data:
                                            "lang_sp",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "🇵🇹 ρσятυgυєѕє",
                                        callback_data:
                                            "lang_pt",
                                        style: "primary"
                                    }
                                ],

                                [
                                    {
                                        text: "⏭️ ηєxт",
                                        callback_data:
                                            "settings_next",
                                        style: "success"
                                    }
                                ],

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            if (
                data === "lang_en" ||
                data === "lang_fr" ||
                data === "lang_sp" ||
                data === "lang_pt"
            ) {

                const language =
                    data.replace(
                        "lang_",
                        ""
                    );

                if (!LANGUAGES[language]) {
                    return;
                }

                setUserLanguage(
                    userId,
                    language
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            `${LANGUAGES[language].flag} ${LANGUAGES[language].name} selected!`
                    }
                );

                return;
            }

            // ==================================================
            // NOTIFICATIONS
            // ==================================================

            if (
                data ===
                "settings_notifications"
            ) {

                const enabled =
                    hasNotifications(
                        userId
                    );

                await bot.editMessageCaption(
                    `${TG_EMOJI.notification} <b>ησтιƒι¢αтισηѕ</b>

${
    enabled
        ? "✅"
        : "❌"
} <b>ѕтαтυѕ:</b> ${
                        enabled
                            ? "Enabled"
                            : "Disabled"
                    }`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                enabled

                                    ? [
                                        {
                                            text:
                                                "🔕 ∂ιѕαвℓє",
                                            callback_data:
                                                "disable_notification",
                                            style:
                                                "danger"
                                        }
                                    ]

                                    : [
                                        {
                                            text:
                                                "🔔 єηαвℓє",
                                            callback_data:
                                                "enable_notification",
                                            style:
                                                "success"
                                        }
                                    ],

                                [
                                    {
                                        text: "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style: "primary"
                                    }

                                ]

                            ]
                        }
                    }
                );

                return;
            }

            // ==================================================
            // ENABLE NOTIFICATIONS
            // ==================================================

            if (
                data ===
                "enable_notification"
            ) {

                enableNotifications(
                    userId
                );

                await bot.editMessageCaption(
                    `${TG_EMOJI.notification} <b>ησтιƒι¢αтισηѕ</b>

✅ <b>ѕтαтυѕ:</b> Enabled`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text:
                                            "🔕 ∂ιѕαвℓє",
                                        callback_data:
                                            "disable_notification",
                                        style:
                                            "danger"
                                    }
                                ],

                                [
                                    {
                                        text:
                                            "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style:
                                            "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🔔 Notifications enabled!"
                    }
                );

                return;
            }

            // ==================================================
            // DISABLE NOTIFICATIONS
            // ==================================================

            if (
                data ===
                "disable_notification"
            ) {

                disableNotifications(
                    userId
                );

                await bot.editMessageCaption(
                    `${TG_EMOJI.notification} <b>ησтιƒι¢αтισηѕ</b>

❌ <b>ѕтαтυѕ:</b> Disabled`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text:
                                            "🔔 єηαвℓє",
                                        callback_data:
                                            "enable_notification",
                                        style:
                                            "success"
                                    }
                                ],

                                [
                                    {
                                        text:
                                            "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style:
                                            "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🔕 Notifications disabled!"
                    }
                );

                return;
            }

            // ==================================================
            // LOGOUT
            // ==================================================

            if (
                data ===
                "settings_logout"
            ) {

                deleteUser(
                    userId
                );

                await bot.editMessageCaption(
                    `✅ <b>уσυ нανє вєєη ℓσggє∂ συт.</b>

⚡ Use /start to sign in again.`,

                    {
                        chat_id: chatId,
                        message_id: messageId,

                        parse_mode: "HTML",

                        reply_markup: {

                            inline_keyboard: [

                                [
                                    {
                                        text:
                                            "🔁 яєℓσgιη",
                                        callback_data:
                                            "log_in",
                                        style:
                                            "danger"
                                    }
                                ],

                                [
                                    {
                                        text:
                                            "⬅️ вα¢к",
                                        callback_data:
                                            "settings_home",
                                        style:
                                            "primary"
                                    }
                                ]

                            ]
                        }
                    }
                );

                return;
            }

            // ==================================================
            // NEXT
            // ==================================================

            if (
                data ===
                "settings_next"
            ) {

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🚧 More languages are coming soon!"
                    }
                );

                return;
            }

            // ==================================================
            // NOOP
            // ==================================================

            if (data === "noop") {

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "🚧 Coming soon!"
                    }
                );

                return;
            }

        } catch (error) {

            console.error(
                "Settings callback error:",
                error
            );

            try {

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "❌ Something went wrong.",
                        show_alert:
                            false
                    }
                );

            } catch (_) {}
        }
    });

    // ============================================================
    // CHANNEL POST NOTIFICATIONS
    // ============================================================

    bot.on(
        "channel_post",
        async (post) => {

            const users =
                getNotificationUsers();

            for (
                const user
                of users
            ) {

                try {

                    await bot.copyMessage(
                        user.user_id,
                        post.chat.id,
                        post.message_id
                    );

                } catch (error) {

                    console.error(
                        `Failed to notify ${user.user_id}:`,
                        error.message
                    );

                    const errorCode =
                        error.response
                            ?.body
                            ?.error_code;

                    if (
                        errorCode === 400 ||
                        errorCode === 403
                    ) {

                        disableNotifications(
                            user.user_id
                        );
                    }
                }
            }
        }
    );

    // ============================================================
    // EXPORT
    // ============================================================

    return {

        db,

        createUser,
        getUser,
        deleteUser,

        setEmail,
        setPremium,
        setAdmin,

        isPremiumUser,
        isAdmin,

        getUserModel,
        setUserModel,

        getPersonality,
        setPersonality,

        getLanguage,
        setUserLanguage,

        enableNotifications,
        disableNotifications,
        hasNotifications,
        getNotificationUsers,

        isMemoryEnabled,
        setMemoryEnabled,

        addMemory,
        getMemory,
        clearMemory,

        isPrivacyEnabled,
        setPrivacyEnabled,

        AI_MODELS,
        LANGUAGES,
        PERSONALITIES,
        TG_EMOJI
    };
};