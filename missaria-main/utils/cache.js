
const cache = new Map();

function set(key, value, ttlSeconds = 900) {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    cache.set(key, {
        value,
        expiresAt
    });
}

function get(key) {
    const entry = cache.get(key);

    if (!entry) {
        return null;
    }

    if (Date.now() >= entry.expiresAt) {
        cache.delete(key);
        return null;
    }

    return entry.value;
}

function del(key) {
    cache.delete(key);
}

function clear() {
    cache.clear();
}

module.exports = {
    set,
    get,
    del,
    clear
};

