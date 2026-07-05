/**
 * cmds/addowner.js
 * Lets the server owner grant/revoke /deploy access to extra users (co-owners)
 */

const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getCoOwners, addCoOwner, removeCoOwner } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'addowner',
        description: '🌌 Grant or revoke co-pilot access to Stichachu Builder commands',
        options: [
            {
                type: 1,
                name: 'add',
                description: '🚀 Beam a crew member into co-pilot clearance',
                options: [
                    {
                        type: 6,
                        name: 'user',
                        description: 'The crew member to promote to co-pilot',
                        required: true
                    }
                ]
            },
            {
                type: 1,
                name: 'remove',
                description: '🌑 Revoke a crew member\'s co-pilot clearance',
                options: [
                    {
                        type: 6,
                        name: 'user',
                        description: 'The crew member to demote',
                        required: true
                    }
                ]
            },
            {
                type: 1,
                name: 'list',
                description: '🛸 View all active co-pilots aboard this vessel'
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({
                content: '🚫 Only the station commander can manage co-pilots.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'add') {
            const user = interaction.options.getUser('user');

            if (user.id === process.env.OWNER_ID) {
                return interaction.reply({
                    content: '⚠️ Commander, you already helm this station.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            if (user.bot) {
                return interaction.reply({
                    content: '🤖 Droids cannot serve as co-pilots aboard this vessel.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const added = addCoOwner(guildId, user.id);
            return interaction.reply({
                content: added
                    ? `✅ ${user} has been granted **co-pilot clearance** and can now use \`/deploy\`.`
                    : `⚠️ ${user} is already aboard as a co-pilot.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (sub === 'remove') {
            const user    = interaction.options.getUser('user');
            const removed = removeCoOwner(guildId, user.id);
            return interaction.reply({
                content: removed
                    ? `✅ ${user}'s **co-pilot clearance** has been revoked.`
                    : `⚠️ ${user} holds no co-pilot clearance to revoke.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (sub === 'list') {
            const list = getCoOwners(guildId);

            if (list.length === 0) {
                return interaction.reply({
                    content: '🛸 No co-pilots are aboard this vessel. Use `/addowner add @user` to beam one in.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('🛸 Active Co-Pilots')
                .setDescription(list.map(id => `• <@${id}>`).join('\n'))
                .setColor(VOID_COLOR)
                .setFooter({ text: '⚡ Stichachu Builder • Co-pilots can use /deploy and related commands' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }
    }
};
