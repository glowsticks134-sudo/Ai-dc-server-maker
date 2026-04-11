/**
 * cmds/templates.js
 * /templates → Select a pre-built server template and deploy it instantly
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const { buildServer } = require('../builder');
const { isAuthorised } = require('../data/owners');
const { TEMPLATES } = require('../data/templates');

module.exports = {
    data: {
        name: 'templates',
        description: '📋 Deploy a pre-built server template instantly — no AI needed'
    },

    async execute(interaction) {

        // ── Slash command → show template select menu ─────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({
                    content: '❌ Only the server owner or a co-owner can use this command.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const options = Object.entries(TEMPLATES).map(([key, tpl]) => ({
                label: tpl.label,
                description: tpl.description,
                value: key,
                emoji: tpl.emoji
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('template_select')
                .setPlaceholder('Choose a template...')
                .addOptions(options);

            await interaction.reply({
                content: '### 📋 Server Templates\nPick a template to preview it before deploying:',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── Select menu → show template preview + confirm button ──────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'template_select') {
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
                '⚠️ **This will delete all existing channels and roles.** Are you sure?'
            ].join('\n');

            const confirmBtn = new ButtonBuilder()
                .setCustomId(`template_confirm:${key}`)
                .setLabel('Deploy Template')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚀');

            const cancelBtn = new ButtonBuilder()
                .setCustomId('template_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);

            await interaction.update({
                content: preview,
                components: [new ActionRowBuilder().addComponents(confirmBtn, cancelBtn)]
            });
            return;
        }

        // ── Button: cancel ────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'template_cancel') {
            await interaction.update({
                content: '❌ Template deployment cancelled.',
                components: []
            });
            return;
        }

        // ── Button: confirm deploy ────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('template_confirm:')) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.update({
                    content: '❌ Only the server owner or a co-owner can use this command.',
                    components: []
                });
            }

            const key = interaction.customId.split(':')[1];
            const tpl = TEMPLATES[key];

            if (!tpl) {
                return interaction.update({ content: '❌ Unknown template.', components: [] });
            }

            await interaction.update({
                content: `🔨 Deploying **${tpl.label}**... The server will be rebuilt — don't worry if you lose connection!`,
                components: []
            });

            try {
                console.log(`\n📋 Deploying template: "${tpl.label}"`);
                await buildServer(interaction.guild, tpl.structure);

                try {
                    await interaction.followUp({
                        content: `✨ **${tpl.structure.serverName}** deployed! ${tpl.structure.roles.length} roles and ${tpl.structure.categories.length} categories created.`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch {
                    console.log('ℹ️ Could not send followUp (channel was deleted during cleanup) — this is normal.');
                }
            } catch (error) {
                console.error('❌ Template deployment error:', error.message);
                try {
                    await interaction.followUp({
                        content: `❌ Error: ${error.message}`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch {}
            }
        }
    }
};
