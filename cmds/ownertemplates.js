/**
 * cmds/ownertemplates.js
 * /ownertemplates → Owner-only command to deploy a server template (built-in + custom)
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const { buildServer } = require('../builder');
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
        name: 'ownertemplates',
        description: '🔒 (Owner only) Warp your server into a pre-built constellation instantly'
    },

    async execute(interaction) {

        // ── Slash command → show template select menu ─────────────────────────
        if (interaction.isChatInputCommand()) {
            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.reply({
                    content: '❌ Only the server owner can use this command.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

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
                .setCustomId('owner_template_select')
                .setPlaceholder('Choose a template to deploy...')
                .addOptions(options);

            await interaction.reply({
                content: '### 🔒 Deploy a Server Template\nPick a template to preview it before deploying:\n*Custom templates are marked with ✦*',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── Select menu → show preview + confirm/cancel buttons ───────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'owner_template_select') {
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
                '⚠️ **This will delete all existing channels and roles.** Are you sure?'
            ].join('\n');

            const confirmBtn = new ButtonBuilder()
                .setCustomId(`owner_template_confirm:${value}`)
                .setLabel('Deploy Template')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚀');

            const cancelBtn = new ButtonBuilder()
                .setCustomId('owner_template_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);

            await interaction.update({
                content: preview,
                components: [new ActionRowBuilder().addComponents(confirmBtn, cancelBtn)]
            });
            return;
        }

        // ── Button: cancel ────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'owner_template_cancel') {
            await interaction.update({ content: '❌ Template deployment cancelled.', components: [] });
            return;
        }

        // ── Button: confirm deploy ────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('owner_template_confirm:')) {
            if (interaction.user.id !== interaction.guild.ownerId) {
                return interaction.update({
                    content: '❌ Only the server owner can deploy templates.',
                    components: []
                });
            }

            // Preserve colons in value (e.g. "c:my_template")
            const value = interaction.customId.split(':').slice(1).join(':');
            const tpl   = resolveTemplate(interaction.guild.id, value);

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
