class CodeState {
    constructor() {
        this.users = new Map();
    }

    set(userId, data) {
        this.users.set(userId, {
            ...this.users.get(userId),
            ...data,
            updatedAt: Date.now()
        });
    }

    get(userId) {
        return this.users.get(userId);
    }

    has(userId) {
        return this.users.has(userId);
    }

    delete(userId) {
        this.users.delete(userId);
    }

    clear() {
        this.users.clear();
    }
}

module.exports = new CodeState();