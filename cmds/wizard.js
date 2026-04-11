/**
 * cmds/wizard.js
 * /wizard — Fully button & menu-driven server builder. Zero typing required.
 *
 * Flow:
 *   Step 1 → Server type (select menu, 10 types)
 *   Step 2 → Server size (3 buttons)
 *   Step 3 → Personality (select menu, 5 options)
 *   Step 4 → Add-on toggles + Build
 */

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    PermissionsBitField,
    MessageFlags
} = require('discord.js');

const { generateServerStructure }                                                        = require('../ai-logic');
const { buildServer, addTicketSystem, addReactionRoles, addModerationChannels, addWelcomeEmbed } = require('../builder');
const { isAuthorised }                                                                   = require('../data/owners');

// ── Data ──────────────────────────────────────────────────────────────────────

const SERVER_TYPES = {
    gaming:    { label: 'Gaming',           emoji: '🎮', desc: 'A competitive gaming community server'            },
    community: { label: 'Community',        emoji: '🌍', desc: 'A general community gathering place'              },
    study:     { label: 'Study / School',   emoji: '📚', desc: 'A study group and academic learning server'       },
    business:  { label: 'Business',         emoji: '💼', desc: 'A professional business workspace server'         },
    roleplay:  { label: 'Roleplay',         emoji: '🎭', desc: 'An immersive roleplay and storytelling server'    },
    music:     { label: 'Music',            emoji: '🎵', desc: 'A music lovers and artists community server'      },
    art:       { label: 'Art & Creative',   emoji: '🎨', desc: 'An art, design and creative community server'     },
    tech:      { label: 'Tech / Dev',       emoji: '💻', desc: 'A programming and technology server'              },
    anime:     { label: 'Anime',            emoji: '🌸', desc: 'An anime and manga fan community server'          },
    support:   { label: 'Support Hub',      emoji: '🤝', desc: 'A community support and help server'              },
};

const SIZES = {
    small:  { label: 'Small / Cozy',     emoji: '🏠', modifier: 'small and cozy with around 15 channels total'      },
    medium: { label: 'Medium',           emoji: '🏙️', modifier: 'medium-sized with around 25-30 channels total'     },
    large:  { label: 'Large / Thriving', emoji: '🌆', modifier: 'large and thriving with 40+ channels and categories' },
};

const PERSONALITIES = {
    toxic:        { name: 'Toxic',        emoji: '😈', color: 0x8B0000, desc: 'Dark, edgy & intimidating vibes'     },
    chill:        { name: 'Chill',        emoji: '🌿', color: 0x2d6a4f, desc: 'Relaxed, cozy & friendly atmosphere' },
    professional: { name: 'Professional', emoji: '💼', color: 0x1a3a5c, desc: 'Formal, clean & corporate style'     },
    aesthetic:    { name: 'Aesthetic',    emoji: '✨', color: 0x7b2d8b, desc: 'Dreamy, poetic & artistic look'      },
    void:         { name: 'Galaxy/Void',  emoji: '🌌', color: 0x6B48FF, desc: 'Cosmic, mysterious & epic energy'   },
};

const ADDONS = [
    { id: 'tickets',       emoji: '🎫', label: 'Support Tickets' },
    { id: 'reactionroles', emoji: '🎭', label: 'Reaction Roles'  },
    { id: 'moderation',    emoji: '🛡️', label: 'Mod System'      },
    { id: 'welcome',       emoji: '👋', label: 'Welcome Embed'   },
];

const VOID_COLOR = 0x6B48FF;

// ── State store ───────────────────────────────────────────────────────────────
const pendingWizard = new Map();

// ── UI builders ───────────────────────────────────────────────────────────────

function makeProgressBar(percent) {
    const filled = Math.round(percent / 10);
    return `\`${'▓'.repeat(filled)}${'░'.repeat(10 - filled)}\` **${percent}%**`;
}

function stepEmbed(step, state) {
    const type = SERVER_TYPES[state.typeKey];
    const size = SIZES[state.size];
    const pers = PERSONALITIES[state.personality];
    const color = pers?.color || VOID_COLOR;

    const choices = [];
    if (type) choices.push(`${type.emoji} **Type:** ${type.label}`);
    if (size) choices.push(`${size.emoji} **Size:** ${size.label}`);
    if (pers) choices.push(`${pers.emoji} **Personality:** ${pers.name}`);
    if (state.addons?.size > 0) {
        const addonLabels = [...state.addons].map(id => ADDONS.find(a => a.id === id)?.label).join(', ');
        choices.push(`🔧 **Add-ons:** ${addonLabels}`);
    }

    const stepLabels = ['', 'Server Type', 'Server Size', 'Personality', 'Add-ons & Build'];
    const stepDescriptions = [
        '',
        'Choose what kind of server you\'re building:',
        'How big should your server be?',
        'What vibe should your server have?',
        'Toggle optional systems, then hit **Build** — no typing required!',
    ];

    return new EmbedBuilder()
        .setTitle(`🧙 Void Wizard — ${stepLabels[step] || 'Building…'}`)
        .setDescription(stepDescriptions[step] || '')
        .setColor(color)
        .addFields(
            { name: `Step ${step} of 4`, value: choices.length > 0 ? choices.join('\n') : '*No selections yet*', inline: false }
        )
        .setFooter({ text: '⚡ Void Builder • Zero typing required' })
        .setTimestamp();
}

function typeSelectRow() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('wizard_type_select')
            .setPlaceholder('What kind of server are you building?')
            .addOptions(Object.entries(SERVER_TYPES).map(([key, t]) => ({
                label: `${t.emoji}  ${t.label}`,
                description: t.desc,
                value: key
            })))
    );
}

function sizeButtonRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('wizard_size_btn:small').setLabel('Small / Cozy').setStyle(ButtonStyle.Secondary).setEmoji('🏠'),
        new ButtonBuilder().setCustomId('wizard_size_btn:medium').setLabel('Medium').setStyle(ButtonStyle.Secondary).setEmoji('🏙️'),
        new ButtonBuilder().setCustomId('wizard_size_btn:large').setLabel('Large / Thriving').setStyle(ButtonStyle.Secondary).setEmoji('🌆')
    );
}

function personalitySelectRow() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('wizard_pers_select')
            .setPlaceholder('Choose your server\'s personality…')
            .addOptions(Object.entries(PERSONALITIES).map(([key, p]) => ({
                label: `${p.emoji}  ${p.name}`,
                description: p.desc,
                value: key
            })))
    );
}

function addonRows(addons) {
    const toggleRow = new ActionRowBuilder().addComponents(
        ADDONS.map(a => {
            const active = addons.has(a.id);
            return new ButtonBuilder()
                .setCustomId(`wizard_addon:${a.id}`)
                .setLabel(a.label)
                .setStyle(active ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(active ? '✅' : a.emoji);
        })
    );
    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('wizard_build').setLabel('Build My Server').setStyle(ButtonStyle.Success).setEmoji('🚀'),
        new ButtonBuilder().setCustomId('wizard_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger).setEmoji('✖️')
    );
    return [toggleRow, actionRow];
}

// ── Command ───────────────────────────────────────────────────────────────────
module.exports = {
    data: {
        name: 'wizard',
        description: '🧙 Build a server using buttons & menus — zero typing required'
    },

    async execute(interaction) {

        // ── Slash: Start wizard ───────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const key = `${interaction.guild.id}-${interaction.user.id}`;
            pendingWizard.set(key, { typeKey: null, size: null, personality: null, addons: new Set() });

            return interaction.reply({
                embeds: [stepEmbed(1, {})],
                components: [typeSelectRow()],
                flags: [MessageFlags.Ephemeral]
            });
        }

        const key     = `${interaction.guild.id}-${interaction.user.id}`;
        const state   = pendingWizard.get(key);

        // ── Type selected (Step 1 → 2) ────────────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'wizard_type_select') {
            if (!state) return interaction.update({ content: '❌ Wizard expired. Run `/wizard` again.', embeds: [], components: [] });

            state.typeKey = interaction.values[0];

            return interaction.update({
                embeds: [stepEmbed(2, state)],
                components: [sizeButtonRow()]
            });
        }

        // ── Size chosen (Step 2 → 3) ──────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('wizard_size_btn:')) {
            if (!state) return interaction.update({ content: '❌ Wizard expired. Run `/wizard` again.', embeds: [], components: [] });

            state.size = interaction.customId.split(':')[1];

            return interaction.update({
                embeds: [stepEmbed(3, state)],
                components: [personalitySelectRow()]
            });
        }

        // ── Personality selected (Step 3 → 4) ─────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'wizard_pers_select') {
            if (!state) return interaction.update({ content: '❌ Wizard expired. Run `/wizard` again.', embeds: [], components: [] });

            state.personality = interaction.values[0];

            return interaction.update({
                embeds: [stepEmbed(4, state)],
                components: addonRows(state.addons)
            });
        }

        // ── Add-on toggle (Step 4, in-place) ──────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('wizard_addon:')) {
            if (!state) return interaction.update({ content: '❌ Wizard expired. Run `/wizard` again.', embeds: [], components: [] });

            const addonId = interaction.customId.split(':')[1];
            if (state.addons.has(addonId)) {
                state.addons.delete(addonId);
            } else {
                state.addons.add(addonId);
            }

            return interaction.update({
                embeds: [stepEmbed(4, state)],
                components: addonRows(state.addons)
            });
        }

        // ── Cancel ────────────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'wizard_cancel') {
            pendingWizard.delete(key);
            return interaction.update({ content: '❌ Wizard cancelled.', embeds: [], components: [] });
        }

        // ── Build ─────────────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'wizard_build') {
            if (!state || !state.typeKey || !state.size || !state.personality) {
                return interaction.update({ content: '❌ Please complete all steps before building.', embeds: [], components: [] });
            }

            pendingWizard.delete(key);

            const type        = SERVER_TYPES[state.typeKey];
            const size        = SIZES[state.size];
            const pers        = PERSONALITIES[state.personality];
            const description = `${type.desc}, ${size.modifier}`;

            await interaction.update({
                content: `${makeProgressBar(0)}\n🧙 **Void Wizard is conjuring your ${pers.emoji} ${pers.name} ${type.emoji} ${type.label} server…**`,
                embeds: [],
                components: []
            });

            try {
                console.log(`\n🧙 Wizard build: type=${state.typeKey} size=${state.size} personality=${state.personality}`);
                const structure = await generateServerStructure(description, '-', state.personality);

                const { roleMap, firstTextChannel } = await buildServer(
                    interaction.guild,
                    structure,
                    async (percent, message) => {
                        try { await interaction.editReply({ content: `${makeProgressBar(percent)}\n${message}` }); } catch { }
                    }
                );

                const staffRoles = [...roleMap.values()].filter(r =>
                    r.permissions.has(PermissionsBitField.Flags.Administrator) ||
                    r.permissions.has(PermissionsBitField.Flags.KickMembers)
                );

                if (state.addons.has('tickets'))       await addTicketSystem(interaction.guild, staffRoles);
                if (state.addons.has('reactionroles')) await addReactionRoles(interaction.guild, roleMap);
                if (state.addons.has('moderation'))    await addModerationChannels(interaction.guild, staffRoles);
                if (state.addons.has('welcome'))       await addWelcomeEmbed(interaction.guild, structure, firstTextChannel);

                const addonSummary = state.addons.size > 0
                    ? `\n🔧 Add-ons: ${[...state.addons].map(id => ADDONS.find(a => a.id === id)?.label).join(', ')}`
                    : '';

                try {
                    await interaction.followUp({
                        content: `✅ **"${structure.serverName}"** is live! ${(structure.roles || []).length} roles · ${(structure.categories || []).length} categories${addonSummary}`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch { console.log('ℹ️ Could not send wizard followUp — channel deleted during rebuild, this is normal.'); }

            } catch (error) {
                console.error('❌ Wizard build error:', error.message);
                try { await interaction.followUp({ content: `❌ Build failed: ${error.message}`, flags: [MessageFlags.Ephemeral] }); } catch { }
            }
        }
    }
};
