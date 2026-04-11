/**
 * cmds/ownertemplates.js
 * /ownertemplates → Owner-only command to deploy a server template (built-in + custom)
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');

const { buildServer } = require('../builder');
const { TEMPLATES }   = require('../data/templates');
const { getGuildTemplates } = require('../data/customTemplates');

const VOID_COLOR = 0x6B48FF;

function resolveTemplate(guildId, value) {
    if (value.startsWith('c:')) {
        return getGuildTemplates(guildId)[value.slice(2)] || null;
    }
    return TEMPLATES[value] || null;
}

module.exports = {
    data: {
        name: 'ownertemplates',
        description: '🔒 (Owner only) Warp your server into a pre-built constellation instantly'
    },

    async execute(interaction) {

        // ── Slash command → show template select menu ─────────────────────────
        if (interaction.isChatInputCommand()) {
            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: '🚫 Only the station commander can deploy constellations.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const builtIn = Object.entries(TEMPLATES).map(([key, tpl]) => ({
                label:       tpl.label,
                description: tpl.description,
                value:       key,
                emoji:       tpl.emoji
            }));

            const custom = Object.entries(getGuildTemplates(interaction.guild.id)).map(([key, tpl]) => ({
                label:       `${tpl.label} ✦`,
                description: tpl.description?.slice(0, 100) || 'Custom constellation',
                value:       `c:${key}`,
                emoji:       tpl.emoji || '🌐'
            }));

            const options = [...builtIn, ...custom];

            if (options.length === 0) {
                return interaction.reply({
                    content: '❌ No constellations charted yet.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('owner_template_select')
                .setPlaceholder('Choose a constellation to deploy…')
                .addOptions(options);

            await interaction.reply({
                content: '### 🔒 Deploy a Constellation\nSelect a template to preview before warping:\n*Custom constellations are marked with ✦*',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── Select menu → show preview embed + confirm/cancel buttons ─────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'owner_template_select') {
            const value = interaction.values[0];
            const tpl   = resolveTemplate(interaction.guild.id, value);

            if (!tpl) {
                return interaction.update({ content: '❌ Unknown constellation.', components: [] });
            }

            const roleList     = tpl.structure.roles.map(r => `• ${r.name}`).join('\n') || '*None*';
            const categoryList = tpl.structure.categories.map(c => {
                const badge = c.staffOnly ? ' *(staff only)*' : c.readOnly ? ' *(read only)*' : '';
                return `• **${c.name}**${badge} — ${c.channels.length} channel${c.channels.length !== 1 ? 's' : ''}`;
            }).join('\n') || '*None*';

            const embed = new EmbedBuilder()
                .setTitle(`${tpl.emoji || '🌐'}  ${tpl.label}`)
                .setDescription(tpl.description || '*No description provided.*')
                .setColor(VOID_COLOR)
                .addFields(
                    { name: `👥 Roles (${tpl.structure.roles.length})`, value: roleList, inline: true },
                    { name: `📁 Categories (${tpl.structure.categories.length})`, value: categoryList, inline: false }
                )
                .setFooter({ text: '⚠️  This will wipe all existing channels and roles — confirm to proceed.' });

            const confirmBtn = new ButtonBuilder()
                .setCustomId(`owner_template_confirm:${value}`)
                .setLabel('Warp Into Constellation')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚀');

            const cancelBtn = new ButtonBuilder()
                .setCustomId('owner_template_cancel')
                .setLabel('Abort Mission')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🌑');

            await interaction.update({
                content: '',
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(confirmBtn, cancelBtn)]
            });
            return;
        }

        // ── Button: cancel ────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'owner_template_cancel') {
            await interaction.update({ content: '🌑 Mission aborted. The void remains undisturbed.', embeds: [], components: [] });
            return;
        }

        // ── Button: confirm deploy ────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('owner_template_confirm:')) {
            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.update({
                    content: '🚫 Only the station commander can execute this warp.',
                    embeds: [],
                    components: []
                });
            }

            const value = interaction.customId.split(':').slice(1).join(':');
            const tpl   = resolveTemplate(interaction.guild.id, value);

            if (!tpl) {
                return interaction.update({ content: '❌ Unknown constellation.', embeds: [], components: [] });
            }

            await interaction.update({
                content: `🚀 Warping into **${tpl.label}**... The server is being rebuilt — you may lose connection briefly!`,
                embeds: [],
                components: []
            });

            try {
                console.log(`\n🌌 Deploying constellation: "${tpl.label}"`);
                await buildServer(interaction.guild, tpl.structure);

                try {
                    await interaction.followUp({
                        content: `✨ **${tpl.structure.serverName}** is live! ${tpl.structure.roles.length} roles and ${tpl.structure.categories.length} categories forged.`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch {
                    console.log('ℹ️ Could not send followUp (channel deleted during rebuild) — this is normal.');
                }
            } catch (error) {
                console.error('❌ Constellation deployment error:', error.message);
                try {
                    await interaction.followUp({
                        content: `❌ Warp failure: ${error.message}`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch {}
            }
        }
    }
};
