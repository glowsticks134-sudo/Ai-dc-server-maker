/**
 * data/customTemplates.js
 * Persist and retrieve per-guild custom templates saved via /addtemplate
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'custom_templates.json');

function load() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getGuildTemplates(guildId) {
    return load()[guildId] || {};
}

function addGuildTemplate(guildId, key, template) {
    const all = load();
    if (!all[guildId]) all[guildId] = {};
    all[guildId][key] = template;
    save(all);
}

function removeGuildTemplate(guildId, key) {
    const all = load();
    if (!all[guildId] || !all[guildId][key]) return false;
    delete all[guildId][key];
    save(all);
    return true;
}

// ── Discord template → bot structure conversion ───────────────────────────────

const PERM_MAP = {
    Administrator:      8n,
    ManageGuild:        32n,
    ManageChannels:     16n,
    ManageRoles:        268435456n,
    KickMembers:        2n,
    BanMembers:         4n,
    SendMessages:       2048n,
    ReadMessageHistory: 65536n,
    ViewChannel:        1024n
};

function getPermNames(permInt) {
    const bits = BigInt(permInt || 0);
    return Object.entries(PERM_MAP)
        .filter(([, flag]) => (bits & flag) === flag)
        .map(([name]) => name);
}

function intToHex(color) {
    if (!color) return '#99AAB5';
    return '#' + color.toString(16).padStart(6, '0');
}

function isStaffOnly(channel) {
    const ow = (channel.permission_overwrites || []).find(o => o.id === 0);
    if (!ow) return false;
    return (BigInt(ow.deny || 0) & 1024n) === 1024n;
}

function isReadOnly(channel) {
    const ow = (channel.permission_overwrites || []).find(o => o.id === 0);
    if (!ow) return false;
    return (BigInt(ow.deny || 0) & 2048n) === 2048n;
}

function convertDiscordTemplate(apiData, label, emoji = '🌐') {
    const guild = apiData.serialized_source_guild;

    const roles = (guild.roles || [])
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => (b.position || 0) - (a.position || 0))
        .map((r, i, arr) => ({
            name: r.name,
            color: intToHex(r.color),
            permissions: getPermNames(r.permissions),
            position: arr.length - i
        }));

    const allChannels = guild.channels || [];
    const categoryChannels = allChannels
        .filter(c => c.type === 4)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

    const categories = categoryChannels.map(cat => {
        const channels = allChannels
            .filter(c => c.parent_id === cat.id && c.type !== 4)
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map(ch => ({
                name: ch.name,
                type: ch.type === 2 ? 'GUILD_VOICE' : 'GUILD_TEXT',
                readOnly: isReadOnly(ch)
            }));

        return {
            name: cat.name,
            staffOnly: isStaffOnly(cat),
            readOnly: isReadOnly(cat),
            channels
        };
    });

    // Channels without a category
    const orphanChannels = allChannels.filter(c => !c.parent_id && c.type !== 4);
    if (orphanChannels.length > 0) {
        categories.unshift({
            name: '💬 GENERAL',
            staffOnly: false,
            readOnly: false,
            channels: orphanChannels.map(ch => ({
                name: ch.name,
                type: ch.type === 2 ? 'GUILD_VOICE' : 'GUILD_TEXT',
                readOnly: isReadOnly(ch)
            }))
        });
    }

    return {
        label,
        emoji,
        description: apiData.description || guild.description || `Custom template: ${label}`,
        structure: {
            serverName: guild.name || label,
            welcomeMessage: `Welcome to ${guild.name || label}!`,
            roles,
            categories
        }
    };
}

module.exports = { getGuildTemplates, addGuildTemplate, removeGuildTemplate, convertDiscordTemplate };
