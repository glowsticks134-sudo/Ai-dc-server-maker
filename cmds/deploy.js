/**
 * cmds/deploy.js
 * Handles the /deploy command with AI preview mode
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const { generateServerStructure } = require('../ai-logic');
const { buildServer } = require('../builder');
const { isAuthorised } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

const SEPARATOR_PRESETS = {
    'default': '-', 'dash': '-', 'bar': '┃', 'pipe': '│', 'dot': '•',
    'bullet': '•', 'arrow': '›', 'chevron': '⟩', 'wave': '〜',
    'star': '✦', 'cross': '✖', 'diamond': '◈', 'heart': '♡'
};

function resolveSeparator(input) {
    if (!input || !input.trim()) return '-';
    const lower = input.trim().toLowerCase();
    if (SEPARATOR_PRESETS[lower]) return SEPARATOR_PRESETS[lower];
    return input.trim()[0];
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
        description: '🤖 Generate and deploy a complete Discord server with AI'
    },

    async execute(interaction) {

        // ── Slash command → show modal ────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const modal = new ModalBuilder().setCustomId('deploy_modal').setTitle('🌌 Void Builder — Create a Server');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('description').setLabel('Describe your server')
                        .setPlaceholder('e.g. A Minecraft prison server with miner, guard and warden ranks…')
                        .setStyle(TextInputStyle.Paragraph).setMinLength(10).setMaxLength(4000).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('separator').setLabel('Channel separator (optional)')
                        .setPlaceholder('default(-) bar(┃) pipe(│) dot(•) arrow(›) star(✦) diamond(◈) …or any character')
                        .setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(20)
                )
            );
            await interaction.showModal(modal);
            return;
        }

        // ── Modal submit → generate + show preview ────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'deploy_modal') {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const description    = interaction.fields.getTextInputValue('description');
            const separatorInput = interaction.fields.getTextInputValue('separator') || '';
            const separator      = resolveSeparator(separatorInput);

            await interaction.reply({ content: '🌌 **Initializing Void Construction…** Generating your server structure…', flags: [MessageFlags.Ephemeral] });

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
