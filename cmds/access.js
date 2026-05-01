const { SlashCommandBuilder } = require('discord.js');
const { grantAccess, revokeAccess, listGranted } = require('../data/allowedUsers');

const PASSPHRASE = process.env.PASSPHRASE;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('access')
        .setDescription('Manage temporary bot access.')
        .addSubcommand(sub =>
            sub.setName('unlock')
                .setDescription('Enter the passphrase to gain temporary access.')
                .addStringOption(opt =>
                    opt.setName('passphrase')
                        .setDescription('The secret passphrase')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('revoke')
                .setDescription('[Owner only] Revoke a user\'s temporary access.')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('The user to revoke')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('[Owner only] List all users with temporary access.')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const isOwner = interaction.user.id === process.env.OWNER_ID;

        // ── unlock ─────────────────────────────────────────────────────────────
        if (sub === 'unlock') {
            if (!PASSPHRASE) {
                return interaction.reply({ content: '⚠️ No passphrase has been configured.', ephemeral: true });
            }

            const input = interaction.options.getString('passphrase');

            if (input !== PASSPHRASE) {
                return interaction.reply({ content: '❌ Incorrect passphrase.', ephemeral: true });
            }

            grantAccess(interaction.user.id);
            return interaction.reply({
                content: '✅ Access granted! You can use this bot for the next **24 hours**.',
                ephemeral: true
            });
        }

        // ── revoke & list: owner only ──────────────────────────────────────────
        if (!isOwner) {
            return interaction.reply({ content: '🔒 Only the bot owner can use this command.', ephemeral: true });
        }

        if (sub === 'revoke') {
            const target = interaction.options.getUser('user');
            revokeAccess(target.id);
            return interaction.reply({ content: `✅ Revoked access for <@${target.id}>.`, ephemeral: true });
        }

        if (sub === 'list') {
            const granted = listGranted();
            if (granted.length === 0) {
                return interaction.reply({ content: 'No users currently have temporary access.', ephemeral: true });
            }
            const lines = granted.map(g => `<@${g.userId}> — expires <t:${Math.floor(g.expiresAt.getTime() / 1000)}:R>`);
            return interaction.reply({ content: `**Temporarily granted users:**\n${lines.join('\n')}`, ephemeral: true });
        }
    }
};
