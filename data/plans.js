const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'plans.json');

const PLANS = {
    free: {
        name: '🪐 Free',
        price: 'Free',
        features: [
            '✅ AI server generation (/deploy)',
            '✅ 6 built-in templates',
            '✅ Up to 3 custom templates',
            '✅ Server wipe (/wipe)',
            '❌ Preview mode before building',
            '❌ Edit mode (/editserver)',
            '❌ Ticket system setup',
            '❌ Reaction roles setup',
            '❌ Moderation setup',
            '❌ Order system'
        ]
    },
    premium: {
        name: '✨ Premium',
        price: 'Boost our support server',
        features: [
            '✅ Everything in Free',
            '✅ Preview mode before building',
            '✅ Up to 10 custom templates',
            '✅ Edit mode (/editserver)',
            '✅ Ticket system setup',
            '✅ Reaction roles setup',
            '✅ Moderation & welcome setup',
            '✅ Order system (/order)',
            '❌ Priority AI generation',
            '❌ Unlimited custom templates'
        ]
    },
    ultra: {
        name: '🌌 Ultra',
        price: 'Contact us',
        features: [
            '✅ Everything in Premium',
            '✅ Priority AI generation',
            '✅ Unlimited custom templates',
            '✅ All setup systems',
            '✅ Early access to new features',
            '✅ Dedicated support'
        ]
    }
};

function load() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch { return {}; }
}

function save(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getGuildPlan(guildId) {
    return load()[guildId] || { plan: 'free' };
}

function setGuildPlan(guildId, plan) {
    const all = load();
    all[guildId] = { plan, set_at: new Date().toISOString() };
    save(all);
}

function hasFeature(guildId, feature) {
    const { plan } = getGuildPlan(guildId);
    const tiers = { free: 0, premium: 1, ultra: 2 };
    const required = { preview: 1, editserver: 1, tickets: 1, reactionroles: 1, moderation: 1, order: 1, customtemplates_10: 1, customtemplates_unlimited: 2 };
    return (tiers[plan] || 0) >= (required[feature] || 0);
}

module.exports = { PLANS, getGuildPlan, setGuildPlan, hasFeature };
