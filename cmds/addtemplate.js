/**
 * cmds/addtemplate.js
 * /addtemplate → Owner-only: import a Discord server template link and save it
 */

const { REST, Routes, MessageFlags } = require('discord.js');
const { addGuildTemplate, convertDiscordTemplate } = require('../data/customTemplates');

function extractCode(link) {
    const match = link.match(/discord(?:\.new|\.com\/template)s?\/([A-Za-z0-9]+)/);
    return match ? match[1] : link.trim();
}

module.exports = {
    data: {
        name: 'addtemplate',
        description: '🔒 (Owner only) Import a Discord template link as a custom server template',
        options: [
            {
                type: 3,
                name: 'name',
                description: 'A short name for this template (e.g. "My Gaming Server")',
                required: true,
                max_length: 50
            },
            {
                type: 3,
                name: 'link',
                description: 'The Discord template link (discord.new/XXXX or discord.com/template/XXXX)',
                required: true
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: '❌ Only the server owner can add custom templates.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const label = interaction.options.getString('name').trim();
        const link  = interaction.options.getString('link').trim();
        const code  = extractCode(link);

        if (!code) {
            return interaction.reply({
                content: '❌ Invalid template link. Use a link like `https://discord.new/XXXXXXXXXX`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
            const apiData = await rest.get(Routes.template(code));

            const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 40);
            if (!key) {
                return interaction.editReply({ content: '❌ Template name is invalid. Use letters, numbers, or spaces.' });
            }

            const template = convertDiscordTemplate(apiData, label);
            addGuildTemplate(interaction.guild.id, key, template);

            const categoryCount = template.structure.categories.length;
            const roleCount     = template.structure.roles.length;
            const channelCount  = template.structure.categories.reduce((n, c) => n + c.channels.length, 0);

            await interaction.editReply({
                content: [
                    `✅ Custom template **"${label}"** saved!`,
                    `> ${roleCount} roles · ${categoryCount} categories · ${channelCount} channels`,
                    '',
                    'It now appears in `/templates` (browse) and `/ownertemplates` (deploy).'
                ].join('\n')
            });

            console.log(`📋 Custom template added: "${label}" (${code}) in guild ${interaction.guild.id}`);
        } catch (err) {
            console.error('❌ Failed to import template:', err.message);
            await interaction.editReply({
                content: `❌ Could not fetch that template. Make sure the link is valid and the template is public.\n> Error: ${err.message}`
            });
        }
    }
};
