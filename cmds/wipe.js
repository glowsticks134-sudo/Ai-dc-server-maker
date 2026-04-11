const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { isAuthorised } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'wipe',
        description: '🌌 (Owner only) Collapse all channels and roles into the void'
    },

    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const confirm = new ButtonBuilder().setCustomId('wipe_confirm').setLabel('Wipe Everything').setStyle(ButtonStyle.Danger).setEmoji('🌌');
            const cancel  = new ButtonBuilder().setCustomId('wipe_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);

            return interaction.reply({
                content: '## 🌌 Void Wipe\n⚠️ This will **permanently delete all channels and roles** in this server.\nThere is no undo. Are you absolutely sure?',
                components: [new ActionRowBuilder().addComponents(confirm, cancel)],
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (interaction.isButton() && interaction.customId === 'wipe_cancel') {
            return interaction.update({ content: '❌ Wipe cancelled.', components: [] });
        }

        if (interaction.isButton() && interaction.customId === 'wipe_confirm') {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.update({ content: '❌ Only the server owner or a co-owner can do this.', components: [] });
            }

            await interaction.update({ content: '🌌 **Initiating Void Wipe…** Deleting all channels and roles…', components: [] });

            const guild = interaction.guild;
            let deleted = 0;

            for (const [, channel] of guild.channels.cache) {
                try { await channel.delete('Void Wipe'); deleted++; } catch { }
            }
            for (const [, role] of guild.roles.cache) {
                if (role.name === '@everyone' || role.managed) continue;
                try { await role.delete('Void Wipe'); deleted++; } catch { }
            }

            try {
                await interaction.followUp({ content: `✅ **Void Wipe complete.** Removed ${deleted} channels/roles.`, flags: [MessageFlags.Ephemeral] });
            } catch { }

            console.log(`🌌 Void Wipe completed in guild ${guild.id} — ${deleted} items removed`);
        }
    }
};
