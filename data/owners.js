const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'owners.json');

function load() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getCoOwners(guildId) {
    return load()[guildId] || [];
}

function isAuthorised(guildId, userId, ownerId) {
    return userId === ownerId || getCoOwners(guildId).includes(userId);
}

function addCoOwner(guildId, userId) {
    const data = load();
    if (!data[guildId]) data[guildId] = [];
    if (data[guildId].includes(userId)) return false;
    data[guildId].push(userId);
    save(data);
    return true;
}

function removeCoOwner(guildId, userId) {
    const data = load();
    if (!data[guildId]) return false;
    const idx = data[guildId].indexOf(userId);
    if (idx === -1) return false;
    data[guildId].splice(idx, 1);
    if (data[guildId].length === 0) delete data[guildId];
    save(data);
    return true;
}

module.exports = { getCoOwners, isAuthorised, addCoOwner, removeCoOwner };
