// Per-Telegram-user TikTok OAuth tokens. In-memory only — like codeState.js,
// this resets on process restart, which just means the user re-runs
// /linktiktok once after a redeploy. Nothing sensitive is written to disk.
class TikTokTokens {
    constructor() {
        this.users = new Map();
    }

    set(userId, data) {
        this.users.set(String(userId), {
            ...this.users.get(String(userId)),
            ...data,
            updatedAt: Date.now()
        });
    }

    get(userId) {
        return this.users.get(String(userId));
    }

    has(userId) {
        return this.users.has(String(userId));
    }

    delete(userId) {
        this.users.delete(String(userId));
    }
}

module.exports = new TikTokTokens();
