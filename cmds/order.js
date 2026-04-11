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
        description: '🚀 Transmit an order — opens a private channel with the Void crew',
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
            // Find or create an orders category
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
                    name: '📦 ORDERS',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: overwrites
                });
            }

            // Create private ticket channel for this order
            const channelName = `order-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

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
                .setTitle('📦 New Order')
                .setDescription(`**From:** ${user} (${user.tag})\n\n**Details:**\n${details}`)
                .setColor(VOID_COLOR)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({ text: '⚡ Void Builder Orders' })
                .setTimestamp();

            await channel.send({
                content: `${user} — **Your order has been received!** The team will be with you shortly.\n\nStaff: ${staffRoles.map(r => `<@&${r.id}>`).join(' ') || 'No staff roles found'}`,
                embeds: [embed]
            });

            await interaction.editReply({ content: `✅ **Order placed!** Head over to ${channel} — the team will respond there.` });

            console.log(`📦 Order from ${user.tag} in guild ${guild.id}: "${details}"`);
        } catch (err) {
            console.error('❌ Order error:', err.message);
            await interaction.editReply({ content: `❌ Could not create an order channel: ${err.message}` });
        }
    }
};
