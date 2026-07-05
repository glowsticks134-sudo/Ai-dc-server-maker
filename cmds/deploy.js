/**
 * cmds/deploy.js
 * /deploy — AI generation + Gamified progress + Smart add-on suggestions
 *
 * Flow:
 *   1. /deploy           → separator picker
 *   2. sep_select        → Keep Roles? (yes / no)
 *   3. keeproles pick    → description modal
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
    '🔥 **ULTRA RARE:** Stichachu-Forged Channel Network!',
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

function buildPreviewEmbed(structure, keepRoles, smartSuggestions) {
    const roles      = (structure.roles || []).map(r => r.name).join(' · ') || 'None';
    const categories = (structure.categories || []).map(c => {
        const icon = c.staffOnly ? '🔒' : c.readOnly ? '📖' : '📁';
        return `${icon} **${c.name}** — ${c.channels.length} ch`;
    }).join('\n') || 'None';

    const embed = new EmbedBuilder()
        .setTitle(`🌌 ${structure.serverName}`)
        .setDescription(`*${(structure.welcomeMessage || '').slice(0, 200)}${(structure.welcomeMessage?.length ?? 0) > 200 ? '…' : ''}*`)
        .setColor(0x6B48FF)
        .addFields(
            { name: '🎭 Roles', value: keepRoles ? '*(Keeping your existing roles)*' : `${roles}`, inline: false },
            { name: `📁 Categories (${(structure.categories || []).length})`, value: categories, inline: false },
        )
        .setFooter({ text: '⚡ Stichachu Builder • Toggle add-ons below, then hit Build' })
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

    const row2 = new ActionRowBuilder().addComponents(
        ADDON_SUGGESTIONS.map(s => {
            const active = addons.has(s.id);
            return new ButtonBuilder()
                .setCustomId(`suggestion_toggle:${s.id}`)
                .setLabel(s.label)
                .setStyle(active ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setEmoji(active ? '✅' : s.emoji);
        })
    );

    return [row1, row2];
}

// ── In-memory store ───────────────────────────────────────────────────────────
const pendingBuilds = new Map();

// ── Command ───────────────────────────────────────────────────────────────────
module.exports = {
    data: {
        name: 'deploy',
        description: '🚀 Architect and launch a complete Discord server using the Stichachu AI'
    },

    async execute(interaction) {

        // ── Step 0: Slash command → mode picker ──────────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const modeEmbed = new EmbedBuilder()
                .setTitle('🌌 Stichachu Builder — Choose Your Mode')
                .setDescription('How would you like to build your server?')
                .setColor(0x6B48FF)
                .addFields(
                    { name: '✍️  Prompt Mode', value: 'Describe your server in your own words and let the AI generate a unique layout from scratch.', inline: false },
                    { name: '🧙  Wizard Mode', value: 'Choose your server type, size, and add-ons using dropdowns and buttons — **zero typing required**.', inline: false }
                )
                .setFooter({ text: '⚡ Stichachu Builder • AI-Powered Discord Server Architect' });

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
                content: '### 🌌 Stichachu Builder — Step 1 of 3\nChoose how channel names will look:',
                components: [new ActionRowBuilder().addComponents(selectMenu)]
            });
        }

        // ── Mode: Wizard → hand off to wizard flow ────────────────────────────
        if (interaction.isButton() && interaction.customId === 'deploy_mode_wizard') {
            const key  = `${interaction.guild.id}-${interaction.user.id}`;
            const step = getWizardStep1(key);
            return interaction.update({ embeds: step.embeds, content: '', components: step.components });
        }

        // ── Step 2: Separator chosen → Keep Roles? ────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'deploy_sep_select') {
            const sepKey = interaction.values[0];

            const embed = new EmbedBuilder()
                .setTitle('🎭 Keep Existing Roles?')
                .setDescription('Do you want to **keep your current roles** or let the AI generate brand new ones?\n\n**Yes** — Only channels will be rebuilt. Your roles stay exactly as they are.\n**No** — Everything is wiped and rebuilt from scratch, including roles.')
                .setColor(0x6B48FF)
                .setFooter({ text: '⚡ Stichachu Builder • Step 2 of 3' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`deploy_keeproles:${sepKey}:yes`).setLabel('Yes, keep my roles').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`deploy_keeproles:${sepKey}:no`).setLabel('No, rebuild everything').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
            );

            return interaction.update({ embeds: [embed], content: '', components: [row] });
        }

        // ── Step 3: Keep Roles answered → description modal ───────────────────
        if (interaction.isButton() && interaction.customId.startsWith('deploy_keeproles:')) {
            const parts    = interaction.customId.split(':');
            const sepKey   = parts[1];
            const keepRoles = parts[2]; // 'yes' or 'no'

            const modal = new ModalBuilder()
                .setCustomId(`deploy_modal:${sepKey}:${keepRoles}`)
                .setTitle('🌌 Stichachu Builder — Step 3 of 3');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('description')
                        .setLabel('Describe your server')
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
            const keepRoles   = parts[2] === 'yes';
            const separator   = getSeparator(sepKey);
            const description = interaction.fields.getTextInputValue('description');

            await interaction.reply({
                content: `${makeProgressBar(0)}\n🌌 **Stichachu Builder is thinking…** Crafting your server from your description…`,
                flags: [MessageFlags.Ephemeral]
            });

            try {
                console.log(`\n📥 Deploy request: "${description}" [sep: "${separator}"] [keepRoles: ${keepRoles}]`);
                const structure        = await generateServerStructure(description, separator);
                const smartSuggestions = getSmartSuggestions(description);
                const addons           = new Set();

                pendingBuilds.set(`${interaction.guild.id}-${interaction.user.id}`, {
                    structure, separator, description, keepRoles, addons, smartSuggestions
                });

                await interaction.editReply({
                    content: '### 🌌 Server Preview\nReview your generated structure below, then toggle add-ons and hit **Build**:',
                    embeds:  [buildPreviewEmbed(structure, keepRoles, smartSuggestions)],
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
                embeds: [buildPreviewEmbed(pending.structure, pending.keepRoles, pending.smartSuggestions)],
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
                content: `${makeProgressBar(0)}\n🚀 **Initializing Stichachu Construction…** Preparing to rebuild **${pending.structure.serverName}**`,
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
                const { roleMap, firstTextChannel } = await buildServer(
                    interaction.guild,
                    pending.structure,
                    onProgress,
                    { keepRoles: pending.keepRoles }
                );

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

                const roleNote = pending.keepRoles ? ' · roles kept' : ` · ${(pending.structure.roles || []).length} roles`;
                const summary = `✅ **"${pending.structure.serverName}"** is live!${roleNote} · ${(pending.structure.categories || []).length} categories${addonSummary}`;

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
                content: `${makeProgressBar(0)}\n🌌 **Regenerating…** Crafting a new structure…`,
                embeds: [],
                components: []
            });

            try {
                const structure = await generateServerStructure(pending.description, pending.separator);
                pendingBuilds.set(key, { ...pending, structure });
                await interaction.editReply({
                    content: '### 🌌 Server Preview\nReview your generated structure below, then toggle add-ons and hit **Build**:',
                    embeds: [buildPreviewEmbed(structure, pending.keepRoles, pending.smartSuggestions)],
                    components: buildPreviewComponents(pending.addons)
                });
            } catch (error) {
                await interaction.editReply({ content: `❌ Regeneration failed: ${error.message}` });
            }
        }
    }
};
