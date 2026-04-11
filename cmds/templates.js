/**
 * cmds/templates.js
 * /templates → Public command to browse available server templates (built-in + custom)
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');

const { TEMPLATES } = require('../data/templates');
const { getGuildTemplates } = require('../data/customTemplates');

function resolveTemplate(guildId, value) {
    if (value.startsWith('c:')) {
        return getGuildTemplates(guildId)[value.slice(2)] || null;
    }
    return TEMPLATES[value] || null;
}

module.exports = {
    data: {
        name: 'templates',
        description: '📋 Browse available server templates'
    },

    async execute(interaction) {

        // ── Slash command → show template select menu ─────────────────────────
        if (interaction.isChatInputCommand()) {
            const builtIn = Object.entries(TEMPLATES).map(([key, tpl]) => ({
                label: tpl.label,
                description: tpl.description,
                value: key,
                emoji: tpl.emoji
            }));

            const custom = Object.entries(getGuildTemplates(interaction.guild.id)).map(([key, tpl]) => ({
                label: `${tpl.label} ✦`,
                description: tpl.description?.slice(0, 100) || 'Custom template',
                value: `c:${key}`,
                emoji: tpl.emoji || '🌐'
            }));

            const options = [...builtIn, ...custom];

            if (options.length === 0) {
                return interaction.reply({
                    content: '❌ No templates available yet.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('pub_template_select')
                .setPlaceholder('Choose a template to preview...')
                .addOptions(options);

            await interaction.reply({
                content: '### 📋 Server Templates\nPick a template to see what it includes:\n*Custom templates are marked with ✦*',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── Select menu → show read-only preview ──────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'pub_template_select') {
            const value = interaction.values[0];
            const tpl   = resolveTemplate(interaction.guild.id, value);

            if (!tpl) {
                return interaction.update({ content: '❌ Unknown template.', components: [] });
            }

            const roleList = tpl.structure.roles.map(r => `• ${r.name}`).join('\n');
            const categoryList = tpl.structure.categories.map(c => {
                const badge = c.staffOnly ? ' *(staff only)*' : c.readOnly ? ' *(read only)*' : '';
                return `• ${c.name}${badge} — ${c.channels.length} channels`;
            }).join('\n');

            const preview = [
                `### ${tpl.emoji || '🌐'} ${tpl.label}`,
                `> ${tpl.description || ''}`,
                '',
                `**Roles (${tpl.structure.roles.length})**`,
                roleList,
                '',
                `**Categories (${tpl.structure.categories.length})**`,
                categoryList,
                '',
                '*To deploy this template, the server owner can use `/ownertemplates`.*'
            ].join('\n');

            await interaction.update({ content: preview, components: [] });
        }
    }
};
