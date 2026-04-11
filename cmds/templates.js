/**
 * cmds/templates.js
 * /templates → Public command to browse available server templates
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');

const { TEMPLATES } = require('../data/templates');

module.exports = {
    data: {
        name: 'templates',
        description: '📋 Browse available server templates'
    },

    async execute(interaction) {

        // ── Slash command → show template select menu ─────────────────────────
        if (interaction.isChatInputCommand()) {
            const options = Object.entries(TEMPLATES).map(([key, tpl]) => ({
                label: tpl.label,
                description: tpl.description,
                value: key,
                emoji: tpl.emoji
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('pub_template_select')
                .setPlaceholder('Choose a template to preview...')
                .addOptions(options);

            await interaction.reply({
                content: '### 📋 Server Templates\nPick a template to see what it includes:',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── Select menu → show read-only preview ──────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'pub_template_select') {
            const key = interaction.values[0];
            const tpl = TEMPLATES[key];

            if (!tpl) {
                return interaction.update({ content: '❌ Unknown template.', components: [] });
            }

            const roleList = tpl.structure.roles.map(r => `• ${r.name}`).join('\n');
            const categoryList = tpl.structure.categories.map(c => {
                const badge = c.staffOnly ? ' *(staff only)*' : c.readOnly ? ' *(read only)*' : '';
                return `• ${c.name}${badge} — ${c.channels.length} channels`;
            }).join('\n');

            const preview = [
                `### ${tpl.emoji} ${tpl.label}`,
                `> ${tpl.description}`,
                '',
                `**Roles (${tpl.structure.roles.length})**`,
                roleList,
                '',
                `**Categories (${tpl.structure.categories.length})**`,
                categoryList,
                '',
                '*To deploy this template, the server owner can use `/ownertemplates`.*'
            ].join('\n');

            await interaction.update({
                content: preview,
                components: []
            });
        }
    }
};
