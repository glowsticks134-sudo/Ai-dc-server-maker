/**
 * cmds/invite.js
 * /invite → Shows bot authorization info and invite link
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'invite',
        description: '🔗 Get the link to add Void Builder to your server'
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const clientId = process.env.CLIENT_ID;
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot+applications.commands`;

        const embed = new EmbedBuilder()
            .setTitle('🌌 Add Void Builder to Your Server')
            .setDescription(
                'Void Builder is an **AI-powered Discord server architect** that generates complete server structures ' +
                '— roles, categories, channels, and permissions — from a single description.\n\n' +
                'Click **Add to Server** below to authorize the bot and invite it to your Discord server.'
            )
            .setColor(VOID_COLOR)
            .addFields(
                {
                    name: '🔐 Required Permissions',
                    value: [
                        '`Administrator` — Needed to manage roles, channels, and permissions during server generation.',
                        '',
                        '> ⚠️ The bot only uses these permissions when you explicitly run a command. It does not act on its own.'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '✨ What You Get',
                    value: [
                        '• `/deploy` — AI-generated server from a description',
                        '• `/templates` — Browse pre-built server layouts',
                        '• `/setup` — Deploy tickets, reaction roles & welcome systems',
                        '• `/wipe` — Clean slate your server in seconds',
                        '• `/prompt` — AI prompt engineering tools',
                        '• `/plan` — View your current feature tier'
                    ].join('\n'),
                    inline: false
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ text: '⚡ Void Builder • AI-Powered Discord Server Architect' })
            .setTimestamp();

        const addButton = new ButtonBuilder()
            .setLabel('Add to Server')
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl)
            .setEmoji('🚀');

        const row = new ActionRowBuilder().addComponents(addButton);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
