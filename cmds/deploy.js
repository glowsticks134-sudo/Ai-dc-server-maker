/**
 * cmds/deploy.js
 * /deploy — Personality presets + AI generation + Gamified progress + Smart add-on suggestions
 *
 * Flow:
 *   1. /deploy           → separator picker
 *   2. sep_select        → personality picker
 *   3. personality pick  → description modal
 *   4. modal submit      → AI generation → preview embed + suggestion toggles
 *   5. suggestion_toggle → toggle add-on on/off
 *   6. preview_build     → gamified progress bar build
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    PermissionsBitField,
    MessageFlags
} = require('discord.js');

const { generateServerStructure }                                       = require('../ai-logic');
const { buildServer, addTicketSystem, addReactionRoles, addModerationChannels, addWelcomeEmbed } = require('../builder');
const { isAuthorised }                                                  = require('../data/owners');
const { getWizardStep1 }                                                = require('./wizard');

// ── Constants ─────────────────────────────────────────────────────────────────

const SEPARATOR_OPTIONS = [
    { key: 'dash',    char: '-',  label: 'Dash',    example: '📜-rules'    },
    { key: 'bar',     char: '┃',  label: 'Bar',     example: '📜┃rules'    },
    { key: 'pipe',    char: '│',  label: 'Pipe',    example: '📜│rules'    },
    { key: 'dot',     char: '•',  label: 'Dot',     example: '📜•rules'    },
    { key: 'arrow',   char: '›',  label: 'Arrow',   example: '📜›rules'    },
    { key: 'wave',    char: '〜', label: 'Wave',    example: '📜〜rules'   },
    { key: 'star',    char: '✦',  label: 'Star',    example: '📜✦rules'    },
    { key: 'diamond', char: '◈',  label: 'Diamond', example: '📜◈rules'    },
    { key: 'heart',   char: '♡',  label: 'Heart',   example: '📜♡rules'    },
    { key: 'none',    char: '',   label: 'None',    example: '📜rules'     },
];

const PERSONALITIES = {
    toxic:        { name: 'Toxic',        emoji: '😈', color: 0x8B0000, desc: 'Dark, edgy & intimidating vibes'     },
    chill:        { name: 'Chill',        emoji: '🌿', color: 0x2d6a4f, desc: 'Relaxed, cozy & friendly atmosphere' },
    professional: { name: 'Professional', emoji: '💼', color: 0x1a3a5c, desc: 'Formal, clean & corporate style'     },
    aesthetic:    { name: 'Aesthetic',    emoji: '✨', color: 0x7b2d8b, desc: 'Dreamy, poetic & artistic look'      },
    void:         { name: 'Galaxy/Void',  emoji: '🌌', color: 0x6B48FF, desc: 'Cosmic, mysterious & epic energy'   },
};

const ADDON_SUGGESTIONS = [
    { id: 'tickets',      emoji: '🎫', label: 'Support Tickets', keywords: ['support', 'help', 'community', 'public', 'server', 'member'] },
    { id: 'reactionroles',emoji: '🎭', label: 'Reaction Roles',  keywords: ['role', 'member', 'community', 'social', 'club', 'public']    },
    { id: 'moderation',   emoji: '🛡️', label: 'Mod System',      keywords: ['staff', 'mod', 'admin', 'manage', 'community', 'enforce']    },
    { id: 'welcome',      emoji: '👋', label: 'Welcome Embed',   keywords: ['welcome', 'new', 'join', 'member', 'community', 'server']    },
];

const RARE_UPGRADES = [
    '✨ **RARE UNLOCK:** Elite Staff Hierarchy System!',
    '⚡ **EPIC DROP:** Dimensional Voice Cluster!',
    '💎 **LEGENDARY:** Cosmic Permission Matrix!',
    '🌟 **MYTHIC UNLOCK:** Quantum Role Architecture!',
    '🔥 **ULTRA RARE:** Void-Forged Channel Network!',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSeparator(key) {
    return SEPARATOR_OPTIONS.find(o => o.key === key)?.char ?? '-';
}

function makeProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty  = 10 - filled;
    return `\`${'▓'.repeat(filled)}${'░'.repeat(empty)}\` **${percent}%**`;
}

function getSmartSuggestions(description) {
    const lower = description.toLowerCase();
    return ADDON_SUGGESTIONS.filter(s => s.keywords.some(k => lower.includes(k)));
}

function buildPreviewEmbed(structure, personality, smartSuggestions) {
    const pers       = PERSONALITIES[personality] || PERSONALITIES.void;
    const roles      = (structure.roles || []).map(r => r.name).join(' · ') || 'None';
    const categories = (structure.categories || []).map(c => {
        const icon = c.staffOnly ? '🔒' : c.readOnly ? '📖' : '📁';
        return `${icon} **${c.name}** — ${c.channels.length} ch`;
    }).join('\n') || 'None';

    const embed = new EmbedBuilder()
        .setTitle(`🌌 ${structure.serverName}`)
        .setDescription(`*${(structure.welcomeMessage || '').slice(0, 200)}${(structure.welcomeMessage?.length ?? 0) > 200 ? '…' : ''}*`)
        .setColor(pers.color)
        .addFields(
            { name: `${pers.emoji} Personality`, value: `**${pers.name}** — ${pers.desc}`, inline: false },
            { name: `👥 Roles (${(structure.roles || []).length})`, value: roles, inline: false },
            { name: `📁 Categories (${(structure.categories || []).length})`, value: categories, inline: false },
        )
        .setFooter({ text: '⚡ Void Builder • Toggle add-ons below, then hit Build' })
        .setTimestamp();

    if (smartSuggestions && smartSuggestions.length > 0) {
        embed.addFields({
            name: '💡 Smart Suggestions',
            value: smartSuggestions.map(s => `${s.emoji} **${s.label}** — recommended for this server type`).join('\n'),
            inline: false
        });
    }

    return embed;
}

function buildPreviewComponents(addons) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('preview_build').setLabel('Build').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId('preview_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji('✖️'),
        new ButtonBuilder().setCustomId('preview_regen').setLabel('Regenerate').setStyle(ButtonStyle.Primary).setEmoji('🔄')
    );

    const keepRolesActive = addons.has('keeproles');
    const row2 = new ActionRowBuilder().addComponents(
        [
            ...ADDON_SUGGESTIONS.map(s => {
                const active = addons.has(s.id);
                return new ButtonBuilder()
                    .setCustomId(`suggestion_toggle:${s.id}`)
                    .setLabel(s.label)
                    .setStyle(active ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setEmoji(active ? '✅' : s.emoji);
            }),
            new ButtonBuilder()
                .setCustomId('suggestion_toggle:keeproles')
                .setLabel('Keep Roles')
                .setStyle(keepRolesActive ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(keepRolesActive ? '✅' : '🎭')
        ]
    );

    return [row1, row2];
}

// ── In-memory store ───────────────────────────────────────────────────────────
const pendingBuilds = new Map();

// ── Command ───────────────────────────────────────────────────────────────────
module.exports = {
    data: {
        name: 'deploy',
        description: '🚀 Architect and launch a complete Discord server using the Void AI'
    },

    async execute(interaction) {

        // ── Step 0: Slash command → mode picker ──────────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const modeEmbed = new EmbedBuilder()
                .setTitle('🌌 Void Builder — Choose Your Mode')
                .setDescription('How would you like to build your server?')
                .setColor(0x6B48FF)
                .addFields(
                    { name: '✍️  Prompt Mode', value: 'Describe your server in your own words and let the AI generate a unique layout from scratch.', inline: false },
                    { name: '🧙  Wizard Mode', value: 'Choose your server type, size, personality and add-ons using dropdowns and buttons — **zero typing required**.', inline: false }
                )
                .setFooter({ text: '⚡ Void Builder • AI-Powered Discord Server Architect' });

            const modeRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('deploy_mode_prompt').setLabel('Prompt Mode').setStyle(ButtonStyle.Primary).setEmoji('✍️'),
                new ButtonBuilder().setCustomId('deploy_mode_wizard').setLabel('Wizard Mode').setStyle(ButtonStyle.Secondary).setEmoji('🧙')
            );

            return interaction.reply({ embeds: [modeEmbed], components: [modeRow], flags: [MessageFlags.Ephemeral] });
        }

        // ── Mode: Prompt → separator picker ───────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'deploy_mode_prompt') {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('deploy_sep_select')
                .setPlaceholder('Choose a channel separator style…')
                .addOptions(SEPARATOR_OPTIONS.map(o => ({
                    label: `${o.label}  —  ${o.example}`,
                    value: o.key,
                    default: o.key === 'dash'
                })));

            return interaction.update({
                embeds: [],
                content: '### 🌌 Void Builder — Step 1 of 3\nChoose how channel names will look:',
                components: [new ActionRowBuilder().addComponents(selectMenu)]
            });
        }

        // ── Mode: Wizard → hand off to wizard flow ────────────────────────────
        if (interaction.isButton() && interaction.customId === 'deploy_mode_wizard') {
            const key  = `${interaction.guild.id}-${interaction.user.id}`;
            const step = getWizardStep1(key);
            return interaction.update({ embeds: step.embeds, content: '', components: step.components });
        }

        // ── Step 2: Separator chosen → personality picker ─────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'deploy_sep_select') {
            const sepKey = interaction.values[0];

            const personalityMenu = new StringSelectMenuBuilder()
                .setCustomId(`deploy_personality_select:${sepKey}`)
                .setPlaceholder('Choose your server\'s personality…')
                .addOptions(Object.entries(PERSONALITIES).map(([key, p]) => ({
                    label: `${p.emoji}  ${p.name}`,
                    description: p.desc,
                    value: key
                })));

            return interaction.update({
                content: '### 🌌 Void Builder — Step 2 of 3\nChoose the **personality** that defines your server\'s vibe:',
                components: [new ActionRowBuilder().addComponents(personalityMenu)]
            });
        }

        // ── Step 3: Personality chosen → description modal ────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('deploy_personality_select:')) {
            const parts       = interaction.customId.split(':');
            const sepKey      = parts[1];
            const personality = interaction.values[0];
            const pers        = PERSONALITIES[personality] || PERSONALITIES.void;

            const modal = new ModalBuilder()
                .setCustomId(`deploy_modal:${sepKey}:${personality}`)
                .setTitle(`🌌 Void Builder — Step 3 of 3`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('description')
                        .setLabel(`Describe your ${pers.emoji} ${pers.name} server`)
                        .setPlaceholder('e.g. A Minecraft prison server with miner, guard and warden ranks…')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(10)
                        .setMaxLength(4000)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
            return;
        }

        // ── Step 4: Modal submit → generate + preview ─────────────────────────
        if (interaction.isModalSubmit() && interaction.customId.startsWith('deploy_modal:')) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const parts       = interaction.customId.split(':');
            const sepKey      = parts[1];
            const personality = parts[2] || 'void';
            const pers        = PERSONALITIES[personality] || PERSONALITIES.void;
            const separator   = getSeparator(sepKey);
            const description = interaction.fields.getTextInputValue('description');

            await interaction.reply({
                content: `${makeProgressBar(0)}\n🌌 **Void Builder is thinking…** Crafting a **${pers.emoji} ${pers.name}** server from your description…`,
                flags: [MessageFlags.Ephemeral]
            });

            try {
                console.log(`\n📥 Deploy request: "${description}" [sep: "${separator}"] [personality: "${personality}"]`);
                const structure        = await generateServerStructure(description, separator, personality);
                const smartSuggestions = getSmartSuggestions(description);
                const addons           = new Set();

                pendingBuilds.set(`${interaction.guild.id}-${interaction.user.id}`, {
                    structure, separator, description, personality, addons, smartSuggestions
                });

                await interaction.editReply({
                    content: '### 🌌 Server Preview\nReview your generated structure below, then toggle add-ons and hit **Build**:',
                    embeds:  [buildPreviewEmbed(structure, personality, smartSuggestions)],
                    components: buildPreviewComponents(addons)
                });
            } catch (error) {
                console.error('❌ Generation error:', error.message);
                await interaction.editReply({ content: `❌ Generation failed: ${error.message}` });
            }
            return;
        }

        // ── Suggestion toggle ─────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('suggestion_toggle:')) {
            const addonId = interaction.customId.split(':')[1];
            const key     = `${interaction.guild.id}-${interaction.user.id}`;
            const pending = pendingBuilds.get(key);

            if (!pending) return interaction.update({ content: '❌ Preview expired. Please run `/deploy` again.', embeds: [], components: [] });

            if (pending.addons.has(addonId)) {
                pending.addons.delete(addonId);
            } else {
                pending.addons.add(addonId);
            }

            await interaction.update({
                content: '### 🌌 Server Preview\nReview your generated structure below, then toggle add-ons and hit **Build**:',
                embeds: [buildPreviewEmbed(pending.structure, pending.personality, pending.smartSuggestions)],
                components: buildPreviewComponents(pending.addons)
            });
            return;
        }

        // ── Preview: Build ────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'preview_build') {
            const key     = `${interaction.guild.id}-${interaction.user.id}`;
            const pending = pendingBuilds.get(key);

            if (!pending) return interaction.update({ content: '❌ Preview expired. Please run `/deploy` again.', embeds: [], components: [] });

            pendingBuilds.delete(key);

            const rareUpgrade    = Math.random() < 0.6 ? RARE_UPGRADES[Math.floor(Math.random() * RARE_UPGRADES.length)] : null;
            let rareShown        = false;
            const rareThreshold  = 40 + Math.floor(Math.random() * 30);

            await interaction.update({
                content: `${makeProgressBar(0)}\n🚀 **Initializing Void Construction…** Preparing to rebuild **${pending.structure.serverName}**`,
                embeds: [],
                components: []
            });

            let lastContent = '';
            const onProgress = async (percent, message) => {
                let extra = '';
                if (!rareShown && rareUpgrade && percent >= rareThreshold) {
                    rareShown = true;
                    extra = `\n\n🎲 **LOOT DROP →** ${rareUpgrade}`;
                }
                const content = `${makeProgressBar(percent)}\n${message}${extra}`;
                if (content === lastContent) return;
                lastContent = content;
                try { await interaction.editReply({ content }); } catch { }
            };

            try {
                const { roleMap, firstTextChannel } = await buildServer(interaction.guild, pending.structure, onProgress, { keepRoles: pending.addons.has('keeproles') });

                // ── Apply toggled add-ons ─────────────────────────────────────
                const staffRoles = [...roleMap.values()].filter(r =>
                    r.permissions.has(PermissionsBitField.Flags.Administrator) ||
                    r.permissions.has(PermissionsBitField.Flags.KickMembers)
                );

                if (pending.addons.has('tickets'))       await addTicketSystem(interaction.guild, staffRoles);
                if (pending.addons.has('reactionroles')) await addReactionRoles(interaction.guild, roleMap);
                if (pending.addons.has('moderation'))    await addModerationChannels(interaction.guild, staffRoles);
                if (pending.addons.has('welcome'))       await addWelcomeEmbed(interaction.guild, pending.structure, firstTextChannel);

                const deployedAddons = [...pending.addons]
                    .map(id => ADDON_SUGGESTIONS.find(s => s.id === id)?.label)
                    .filter(Boolean);
                const addonSummary = deployedAddons.length > 0
                    ? `\n🔧 Add-ons deployed: ${deployedAddons.join(', ')}`
                    : '';

                const summary = `✅ **"${pending.structure.serverName}"** is live! ${(pending.structure.roles || []).length} roles · ${(pending.structure.categories || []).length} categories${addonSummary}`;

                try { await interaction.followUp({ content: summary, flags: [MessageFlags.Ephemeral] }); }
                catch { console.log('ℹ️ Could not send followUp — channel deleted during rebuild, this is normal.'); }
            } catch (error) {
                console.error('❌ Deploy error:', error.message);
                try { await interaction.followUp({ content: `❌ Error: ${error.message}`, flags: [MessageFlags.Ephemeral] }); } catch { }
            }
            return;
        }

        // ── Preview: Cancel ───────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'preview_cancel') {
            pendingBuilds.delete(`${interaction.guild.id}-${interaction.user.id}`);
            return interaction.update({ content: '❌ Build cancelled.', embeds: [], components: [] });
        }

        // ── Preview: Regenerate ───────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'preview_regen') {
            const key     = `${interaction.guild.id}-${interaction.user.id}`;
            const pending = pendingBuilds.get(key);

            if (!pending) return interaction.update({ content: '❌ Preview expired. Please run `/deploy` again.', embeds: [], components: [] });

            await interaction.update({
                content: `${makeProgressBar(0)}\n🌌 **Regenerating…** Crafting a new **${PERSONALITIES[pending.personality]?.emoji ?? '🌌'} ${PERSONALITIES[pending.personality]?.name ?? 'Void'}** structure…`,
                embeds: [],
                components: []
            });

            try {
                const structure = await generateServerStructure(pending.description, pending.separator, pending.personality);
                pendingBuilds.set(key, { ...pending, structure });
                await interaction.editReply({
                    content: '### 🌌 Server Preview\nReview your generated structure below, then toggle add-ons and hit **Build**:',
                    embeds: [buildPreviewEmbed(structure, pending.personality, pending.smartSuggestions)],
                    components: buildPreviewComponents(pending.addons)
                });
            } catch (error) {
                await interaction.editReply({ content: `❌ Regeneration failed: ${error.message}` });
            }
        }
    }
};
