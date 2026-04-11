/**
 * cmds/addowner.js
 * Lets the server owner grant/revoke /deploy access to extra users (co-owners)
 */

const { MessageFlags } = require('discord.js');
const { getCoOwners, addCoOwner, removeCoOwner } = require('../data/owners');

module.exports = {
    data: {
        name: 'addowner',
        description: '🌌 Grant or revoke co-pilot access to Void Builder commands',
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
                description: '🛸 View all current co-pilots aboard this vessel'
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: '❌ Only the server owner can manage co-owners.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const sub    = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === 'add') {
            const user = interaction.options.getUser('user');

            if (user.id === interaction.guild.ownerId) {
                return interaction.reply({
                    content: '⚠️ You are already the server owner.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            if (user.bot) {
                return interaction.reply({
                    content: '❌ Bots cannot be added as co-owners.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const added = addCoOwner(guildId, user.id);
            return interaction.reply({
                content: added
                    ? `✅ ${user} is now a co-owner and can use \`/deploy\`.`
                    : `⚠️ ${user} is already a co-owner.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (sub === 'remove') {
            const user = interaction.options.getUser('user');
            const removed = removeCoOwner(guildId, user.id);
            return interaction.reply({
                content: removed
                    ? `✅ Removed co-owner access from ${user}.`
                    : `⚠️ ${user} is not a co-owner.`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (sub === 'list') {
            const list = getCoOwners(guildId);
            if (list.length === 0) {
                return interaction.reply({
                    content: '📋 No co-owners set. Use `/addowner add @user` to add one.',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            const mentions = list.map(id => `<@${id}>`).join('\n');
            return interaction.reply({
                content: `📋 **Co-owners who can use \`/deploy\`:**\n${mentions}`,
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
