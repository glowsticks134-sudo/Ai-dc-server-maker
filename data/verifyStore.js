/**
 * verifyStore.js
 * In-memory store for pending OAuth2 verifications.
 * Each entry maps a random state token -> { userId, guildId, expires }
 */

const store = new Map();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function createState(userId, guildId) {
    const state = require('crypto').randomBytes(24).toString('hex');
    store.set(state, { userId, guildId, expires: Date.now() + TTL_MS });
    return state;
}

function consumeState(state) {
    const entry = store.get(state);
    if (!entry) return null;
    store.delete(state);
    if (Date.now() > entry.expires) return null;
    return entry;
}

// Prune expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of store) {
        if (now > val.expires) store.delete(key);
    }
}, 5 * 60 * 1000);

module.exports = { createState, consumeState };
