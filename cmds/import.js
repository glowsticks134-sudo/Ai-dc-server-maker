/**
 * cmds/import.js
 * /import — Paste a Void Builder JSON export to preview and rebuild the server
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

const { buildServer } = require('../builder');
const { isAuthorised } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

const pendingImports = new Map();

function makeProgressBar(percent) {
    const filled = Math.round(percent / 10);
    return `\`${'▓'.repeat(filled)}${'░'.repeat(10 - filled)}\` **${percent}%**`;
}

function buildImportPreview(structure) {
    const roles = (structure.roles || []).map(r => r.name).join(' · ') || 'None';
    const categories = (structure.categories || []).map(c => {
        const icon = c.staffOnly ? '🔒' : c.readOnly ? '📖' : '📁';
        return `${icon} **${c.name}** — ${c.channels.length} ch`;
    }).join('\n') || 'None';

    const totalChannels = (structure.categories || []).reduce((n, c) => n + (c.channels?.length || 0), 0);

    const embed = new EmbedBuilder()
        .setTitle(`📥 Import Preview — ${structure.serverName}`)
        .setDescription(
            `*${(structure.welcomeMessage || '').slice(0, 200)}${(structure.welcomeMessage?.length ?? 0) > 200 ? '…' : ''}*\n\n` +
            `⚠️ **This will replace your entire server.** All existing channels and roles will be deleted.`
        )
        .setColor(VOID_COLOR)
        .addFields(
            { name: `👥 Roles (${(structure.roles || []).length})`, value: roles, inline: false },
            { name: `📁 Categories (${(structure.categories || []).length}) — ${totalChannels} channels`, value: categories, inline: false }
        )
        .setFooter({ text: '⚡ Void Builder • Plugin System — Import' })
        .setTimestamp();

    if (structure._meta) {
        embed.addFields({
            name: '🏷️ Export Info',
            value: [
                structure._meta.originalName ? `Originally: **${structure._meta.originalName}**` : null,
                structure._meta.exportedAt   ? `Exported: ${new Date(structure._meta.exportedAt).toLocaleDateString()}` : null,
            ].filter(Boolean).join('\n') || 'No metadata',
            inline: false
        });
    }

    return embed;
}

module.exports = {
    data: {
        name: 'import',
        description: '📥 Import a server structure from a Void Builder JSON export'
    },

    async execute(interaction) {

        // ── Slash: Open modal ─────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const modal = new ModalBuilder()
                .setCustomId('import_modal')
                .setTitle('📥 Import Server Structure');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('import_json')
                        .setLabel('Paste your exported JSON here')
                        .setPlaceholder('{"serverName": "My Server", "roles": [...], "categories": [...]}')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(10)
                        .setMaxLength(4000)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
            return;
        }

        // ── Modal submit: Validate + preview ──────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'import_modal') {
            if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const raw = interaction.fields.getTextInputValue('import_json').trim();
            let structure;

            try {
                structure = JSON.parse(raw);
            } catch {
                return interaction.reply({ content: '❌ Invalid JSON. Make sure you paste the full contents of the exported file.', flags: [MessageFlags.Ephemeral] });
            }

            if (!structure.serverName || !Array.isArray(structure.categories)) {
                return interaction.reply({ content: '❌ Invalid structure: missing `serverName` or `categories`. Export your server with `/export` first.', flags: [MessageFlags.Ephemeral] });
            }

            const key = `${interaction.guild.id}-${interaction.user.id}`;
            pendingImports.set(key, structure);

            const confirmBtn = new ButtonBuilder()
                .setCustomId('import_build').setLabel('Import & Build').setStyle(ButtonStyle.Success).setEmoji('📥');
            const cancelBtn = new ButtonBuilder()
                .setCustomId('import_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji('✖️');

            await interaction.reply({
                content: '### 📥 Import Preview\nReview the structure below — confirm to import:',
                embeds: [buildImportPreview(structure)],
                components: [new ActionRowBuilder().addComponents(confirmBtn, cancelBtn)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── Cancel ────────────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'import_cancel') {
            pendingImports.delete(`${interaction.guild.id}-${interaction.user.id}`);
            return interaction.update({ content: '❌ Import cancelled.', embeds: [], components: [] });
        }

        // ── Build ─────────────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'import_build') {
            const key       = `${interaction.guild.id}-${interaction.user.id}`;
            const structure = pendingImports.get(key);

            if (!structure) {
                return interaction.update({ content: '❌ Import expired. Please run `/import` again.', embeds: [], components: [] });
            }

            pendingImports.delete(key);

            await interaction.update({
                content: `${makeProgressBar(0)}\n📥 **Importing "${structure.serverName}"…** Rebuilding your server now.`,
                embeds: [],
                components: []
            });

            try {
                await buildServer(interaction.guild, structure, async (percent, message) => {
                    try { await interaction.editReply({ content: `${makeProgressBar(percent)}\n${message}` }); } catch { }
                });

                const totalChannels = (structure.categories || []).reduce((n, c) => n + (c.channels?.length || 0), 0);

                try {
                    await interaction.followUp({
                        content: `✅ **"${structure.serverName}"** imported! ${(structure.roles || []).length} roles · ${(structure.categories || []).length} categories · ${totalChannels} channels`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch { console.log('ℹ️ Could not send import followUp — channel deleted during rebuild, this is normal.'); }

            } catch (err) {
                console.error('❌ Import build error:', err.message);
                try { await interaction.followUp({ content: `❌ Import failed: ${err.message}`, flags: [MessageFlags.Ephemeral] }); } catch { }
            }
        }
    }
};
