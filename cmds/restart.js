const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('[Owner only] Restart the bot to apply updates.'),

    async execute(interaction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '🔒 Only the bot owner can restart the bot.', ephemeral: true });
        }

        await interaction.reply({ content: '🔄 Restarting bot... I\'ll be back in a few seconds.', ephemeral: true });

        setTimeout(() => process.exit(0), 1000);
    }
};
