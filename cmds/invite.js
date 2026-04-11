/**
 * cmds/invite.js
 * /invite → Shows bot authorization info and invite link (public — visible to everyone)
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'invite',
        description: '🛸 Beam Void Builder into your own server — get the invite link'
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const clientId  = process.env.CLIENT_ID;
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;

        const embed = new EmbedBuilder()
            .setTitle('🌌 Add Void Builder to Your Server')
            .setDescription(
                '**Void Builder** is an AI-powered Discord server architect that generates complete server structures ' +
                '— roles, categories, channels, and permissions — from a single description or a guided wizard.\n\n' +
                'Click **Beam Me In** below to authorize the bot and invite it to your Discord server.'
            )
            .setColor(VOID_COLOR)
            .addFields(
                {
                    name: '🔐 Required Permissions',
                    value: [
                        '`Administrator` — Required to forge roles, construct channels, and configure permissions during server generation.',
                        '',
                        '> ⚠️ The bot only activates when you run a command. It never acts on its own.'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🚀 Command Arsenal',
                    value: [
                        '• `/deploy` — AI-generate a server from a description or the wizard',
                        '• `/wizard` — Build a server using buttons & menus — zero typing',
                        '• `/templates` — Browse pre-built server constellations',
                        '• `/export` — Snapshot your server as a shareable JSON file',
                        '• `/import` — Restore a server from an exported file',
                        '• `/setup` — Deploy tickets, reaction roles & welcome systems',
                        '• `/editserver` — Launch channels and forge roles on the fly',
                        '• `/wipe` — Collapse your server into the void and start fresh',
                        '• `/prompt` — AI prompt engineering tools',
                        '• `/plan` — View your current orbit tier',
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: '⚡ Void Builder • AI-Powered Discord Server Architect' })
            .setTimestamp();

        const addButton = new ButtonBuilder()
            .setLabel('Beam Me In')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl)
            .setEmoji('🚀');

        await interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(addButton)]
        });
    }
};
