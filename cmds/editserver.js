const {
    PermissionsBitField,
    ChannelType,
    MessageFlags
} = require('discord.js');
const { isAuthorised } = require('../data/owners');

module.exports = {
    data: {
        name: 'editserver',
        description: '🛸 Modify your server\'s channels and roles without a full re-launch',
        options: [
            {
                type: 1,
                name: 'addchannel',
                description: '✨ Launch a new channel into orbit',
                options: [
                    { type: 3, name: 'name', description: 'Channel name (e.g. general)', required: true },
                    { type: 3, name: 'category', description: 'Category to orbit under (optional)', required: false },
                    {
                        type: 3, name: 'type', description: 'Text or voice — choose your transmission type', required: false,
                        choices: [{ name: 'Text', value: 'text' }, { name: 'Voice', value: 'voice' }]
                    }
                ]
            },
            {
                type: 1,
                name: 'removechannel',
                description: '🌑 Collapse a channel into the void',
                options: [
                    { type: 3, name: 'name', description: 'The exact channel name to collapse', required: true }
                ]
            },
            {
                type: 1,
                name: 'addrole',
                description: '⭐ Forge a new rank in the cosmos',
                options: [
                    { type: 3, name: 'name', description: 'Name for this new cosmic rank', required: true },
                    { type: 3, name: 'color', description: 'Role color in hex (e.g. #6B48FF)', required: false }
                ]
            },
            {
                type: 1,
                name: 'removerole',
                description: '☄️ Disintegrate a role from existence',
                options: [
                    { type: 3, name: 'name', description: 'The exact role name to disintegrate', required: true }
                ]
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
            return interaction.reply({ content: '🚫 Only the station commander or a co-pilot can modify this vessel.', flags: [MessageFlags.Ephemeral] });
        }

        const sub   = interaction.options.getSubcommand();
        const guild = interaction.guild;

        // ── Add Channel ───────────────────────────────────────────────────────
        if (sub === 'addchannel') {
            const name    = interaction.options.getString('name').toLowerCase().replace(/\s+/g, '-');
            const catName = interaction.options.getString('category');
            const type    = interaction.options.getString('type') || 'text';
            const isVoice = type === 'voice';

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            let parent = null;
            if (catName) {
                parent = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === catName.toLowerCase());
                if (!parent) {
                    parent = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory }).catch(() => null);
                }
            }

            const channel = await guild.channels.create({
                name,
                type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
                parent: parent?.id || null
            }).catch(err => { throw new Error(err.message); });

            return interaction.editReply({
                content: `✅ ${isVoice ? '🔊 Voice channel' : '💬 Text channel'} ${channel} **launched into orbit**${parent ? ` under **${parent.name}**` : ''}.`
            });
        }

        // ── Remove Channel ────────────────────────────────────────────────────
        if (sub === 'removechannel') {
            const name    = interaction.options.getString('name').toLowerCase();
            const channel = guild.channels.cache.find(c => c.name.toLowerCase() === name && c.type !== ChannelType.GuildCategory);

            if (!channel) return interaction.reply({ content: `🌑 No channel named **${name}** found in this cosmos.`, flags: [MessageFlags.Ephemeral] });

            await channel.delete('editserver — collapsed into void');
            return interaction.reply({ content: `🌑 Channel **#${name}** has been **collapsed into the void**.`, flags: [MessageFlags.Ephemeral] });
        }

        // ── Add Role ──────────────────────────────────────────────────────────
        if (sub === 'addrole') {
            const name  = interaction.options.getString('name');
            const color = interaction.options.getString('color') || '#99AAB5';

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const role = await guild.roles.create({
                name,
                color,
                reason: 'editserver — forged by Stichachu Builder'
            }).catch(err => { throw new Error(err.message); });

            return interaction.editReply({ content: `⭐ Role **${role.name}** has been **forged in the cosmos**.` });
        }

        // ── Remove Role ───────────────────────────────────────────────────────
        if (sub === 'removerole') {
            const name = interaction.options.getString('name').toLowerCase();
            const role = guild.roles.cache.find(r => r.name.toLowerCase() === name && !r.managed);

            if (!role) return interaction.reply({ content: `☄️ No role named **${name}** found in this dimension (or it's a managed role).`, flags: [MessageFlags.Ephemeral] });

            await role.delete('editserver — disintegrated by Stichachu Builder');
            return interaction.reply({ content: `☄️ Role **${name}** has been **disintegrated from existence**.`, flags: [MessageFlags.Ephemeral] });
        }
    }
};
