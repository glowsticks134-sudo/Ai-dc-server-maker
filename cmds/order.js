const {
    EmbedBuilder,
    PermissionsBitField,
    ChannelType,
    MessageFlags
} = require('discord.js');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'order',
        description: '🛸 Transmit a commission — opens a private channel with the Stichachu crew',
        options: [
            {
                type: 3,
                name: 'details',
                description: 'What would you like commissioned? (e.g. custom bot, server architecture)',
                required: true,
                max_length: 500
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const details = interaction.options.getString('details');
        const guild   = interaction.guild;
        const user    = interaction.user;

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('order'));

            if (!category) {
                const staffRoles = guild.roles.cache.filter(r =>
                    !r.managed && r.name !== '@everyone' &&
                    (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.KickMembers))
                );

                const overwrites = [
                    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    ...staffRoles.map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
                ];

                category = await guild.channels.create({
                    name: '🛸 COMMISSIONS',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: overwrites
                });
            }

            const channelName = `commission-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

            const staffRoles = guild.roles.cache.filter(r =>
                !r.managed && r.name !== '@everyone' &&
                (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.KickMembers))
            );

            const overwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                ...staffRoles.map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }))
            ];

            const channel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: overwrites
            });

            const embed = new EmbedBuilder()
                .setTitle('🛸 New Commission Incoming')
                .setDescription(`**Transmitted by:** ${user} (${user.tag})\n\n**Mission Details:**\n${details}`)
                .setColor(VOID_COLOR)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: '⚡ Stichachu Builder • Commission System' })
                .setTimestamp();

            await channel.send({
                content: `${user} — **Your transmission has been received!** The Stichachu crew will respond shortly.\n\nCrew: ${staffRoles.map(r => `<@&${r.id}>`).join(' ') || '*No staff roles found*'}`,
                embeds: [embed]
            });

            await interaction.editReply({
                content: `✅ **Transmission sent!** Head to ${channel} — the Stichachu crew will respond there.`
            });

            console.log(`🛸 Commission from ${user.tag} in guild ${guild.id}: "${details}"`);
        } catch (err) {
            console.error('❌ Commission error:', err.message);
            await interaction.editReply({ content: `❌ Could not open a commission channel: ${err.message}` });
        }
    }
};
