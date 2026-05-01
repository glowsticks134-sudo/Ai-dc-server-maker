/**
 * In-memory store for temporarily granted users.
 * Entries expire after GRANT_DURATION_MS (default: 24 hours).
 */

const GRANT_DURATION_MS = 24 * 60 * 60 * 1000;

const grantedUsers = new Map(); // userId → expiry timestamp

function grantAccess(userId) {
    grantedUsers.set(userId, Date.now() + GRANT_DURATION_MS);
}

function revokeAccess(userId) {
    grantedUsers.delete(userId);
}

function isGranted(userId) {
    const expiry = grantedUsers.get(userId);
    if (!expiry) return false;
    if (Date.now() > expiry) {
        grantedUsers.delete(userId);
        return false;
    }
    return true;
}

function listGranted() {
    const now = Date.now();
    const active = [];
    for (const [userId, expiry] of grantedUsers.entries()) {
        if (now > expiry) {
            grantedUsers.delete(userId);
        } else {
            active.push({ userId, expiresAt: new Date(expiry) });
        }
    }
    return active;
}

module.exports = { grantAccess, revokeAccess, isGranted, listGranted };
