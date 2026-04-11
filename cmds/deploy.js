/**
 * cmds/deploy.js
 * Handles the /deploy command with separator picker + AI preview mode
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
    MessageFlags
} = require('discord.js');

const { generateServerStructure } = require('../ai-logic');
const { buildServer } = require('../builder');
const { isAuthorised } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

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

function getSeparator(key) {
    return SEPARATOR_OPTIONS.find(o => o.key === key)?.char ?? '-';
}

// In-memory store for pending builds (keyed by guildId-userId)
const pendingBuilds = new Map();

function buildPreviewEmbed(structure) {
    const roles = (structure.roles || []).map(r => r.name).join(' · ') || 'None';
    const categories = (structure.categories || []).map(c => {
        const icon = c.staffOnly ? '🔒' : c.readOnly ? '📖' : '📁';
        return `${icon} **${c.name}** — ${c.channels.length} ch`;
    }).join('\n') || 'None';

    return new EmbedBuilder()
        .setTitle(`🌌 ${structure.serverName}`)
        .setDescription(`*${(structure.welcomeMessage || '').slice(0, 200)}${structure.welcomeMessage?.length > 200 ? '…' : ''}*`)
        .setColor(VOID_COLOR)
        .addFields(
            { name: `👥 Roles (${(structure.roles || []).length})`, value: roles, inline: false },
            { name: `📁 Categories (${(structure.categories || []).length})`, value: categories, inline: false }
        )
        .setFooter({ text: '⚡ Void Builder • Review your structure before building' })
        .setTimestamp();
}

function previewButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('preview_build').setLabel('Build').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId('preview_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji('❌'),
        new ButtonBuilder().setCustomId('preview_regen').setLabel('Regenerate').setStyle(ButtonStyle.Primary).setEmoji('🔄')
    );
}

module.exports = {
    data: {
        name: 'deploy',
        description: '🚀 Architect and launch a complete Discord server using the Void AI'
    },

    async execute(interaction) {

        // ── Step 1: Slash command → show separator picker ─────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('deploy_sep_select')
                .setPlaceholder('Choose a channel separator style…')
                .addOptions(SEPARATOR_OPTIONS.map(o => ({
                    label: `${o.label}  —  ${o.example}`,
                    value: o.key,
                    default: o.key === 'dash'
                })));

            return interaction.reply({
                content: '### 🌌 Void Builder — Step 1 of 2\nChoose how channel names will look:',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
        }

        // ── Step 2: Separator chosen → open description modal ────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'deploy_sep_select') {
            const key = interaction.values[0];
            const sep = getSeparator(key);

            const modal = new ModalBuilder()
                .setCustomId(`deploy_modal:${key}`)
                .setTitle('🌌 Void Builder — Step 2 of 2');

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

        // ── Step 3: Modal submit → generate + show preview ───────────────────
        if (interaction.isModalSubmit() && interaction.customId.startsWith('deploy_modal:')) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const sepKey     = interaction.customId.split(':')[1];
            const separator  = getSeparator(sepKey);
            const description = interaction.fields.getTextInputValue('description');

            await interaction.reply({ content: `🌌 **Initializing Void Construction…** Generating your server structure with **${SEPARATOR_OPTIONS.find(o => o.key === sepKey)?.example ?? '📜-rules'}** style channels…`, flags: [MessageFlags.Ephemeral] });

            try {
                console.log(`\n📥 Deploy request: "${description}" [sep: "${separator}"]`);
                const structure = await generateServerStructure(description, separator);
                pendingBuilds.set(`${interaction.guild.id}-${interaction.user.id}`, { structure, separator, description });

                await interaction.editReply({ content: '### 🌌 Server Preview\nReview your generated structure below, then choose an action:', embeds: [buildPreviewEmbed(structure)], components: [previewButtons()] });
            } catch (error) {
                console.error('❌ Generation error:', error.message);
                await interaction.editReply({ content: `❌ Generation failed: ${error.message}` });
            }
            return;
        }

        // ── Preview: Build ────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'preview_build') {
            const key     = `${interaction.guild.id}-${interaction.user.id}`;
            const pending = pendingBuilds.get(key);

            if (!pending) return interaction.update({ content: '❌ Preview expired. Please run `/deploy` again.', embeds: [], components: [] });

            pendingBuilds.delete(key);
            await interaction.update({ content: `🚀 **Deploying "${pending.structure.serverName}"…** The server will be rebuilt — don't worry if you lose connection!`, embeds: [], components: [] });

            try {
                await buildServer(interaction.guild, pending.structure);
                try {
                    await interaction.followUp({ content: `✨ **"${pending.structure.serverName}"** deployed! ${(pending.structure.roles || []).length} roles and ${(pending.structure.categories || []).length} categories created.`, flags: [MessageFlags.Ephemeral] });
                } catch { console.log('ℹ️ Could not send followUp — channel deleted during rebuild, this is normal.'); }
            } catch (error) {
                console.error('❌ Deploy error:', error.message);
                try { await interaction.followUp({ content: `❌ Error: ${error.message}`, flags: [MessageFlags.Ephemeral] }); } catch {}
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

            await interaction.update({ content: '🌌 **Regenerating…** Crafting a new structure…', embeds: [], components: [] });

            try {
                const structure = await generateServerStructure(pending.description, pending.separator);
                pendingBuilds.set(key, { ...pending, structure });
                await interaction.editReply({ content: '### 🌌 Server Preview\nReview your generated structure below, then choose an action:', embeds: [buildPreviewEmbed(structure)], components: [previewButtons()] });
            } catch (error) {
                await interaction.editReply({ content: `❌ Regeneration failed: ${error.message}` });
            }
        }
    }
};
