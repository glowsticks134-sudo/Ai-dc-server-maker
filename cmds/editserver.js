const {
    PermissionsBitField,
    ChannelType,
    MessageFlags
} = require('discord.js');
const { isAuthorised } = require('../data/owners');

module.exports = {
    data: {
        name: 'editserver',
        description: '✏️ Add or remove channels and roles without rebuilding the whole server',
        options: [
            {
                type: 1,
                name: 'addchannel',
                description: 'Add a new channel to the server',
                options: [
                    { type: 3, name: 'name', description: 'Channel name (e.g. general)', required: true },
                    { type: 3, name: 'category', description: 'Category name to add it under (optional)', required: false },
                    {
                        type: 3, name: 'type', description: 'text or voice (default: text)', required: false,
                        choices: [{ name: 'Text', value: 'text' }, { name: 'Voice', value: 'voice' }]
                    }
                ]
            },
            {
                type: 1,
                name: 'removechannel',
                description: 'Delete a channel by name',
                options: [
                    { type: 3, name: 'name', description: 'The exact channel name to delete', required: true }
                ]
            },
            {
                type: 1,
                name: 'addrole',
                description: 'Add a new role to the server',
                options: [
                    { type: 3, name: 'name', description: 'Role name', required: true },
                    { type: 3, name: 'color', description: 'Role color in hex (e.g. #FF0000)', required: false }
                ]
            },
            {
                type: 1,
                name: 'removerole',
                description: 'Delete a role by name',
                options: [
                    { type: 3, name: 'name', description: 'The exact role name to delete', required: true }
                ]
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
            return interaction.reply({ content: '❌ Only the server owner or a co-owner can edit the server.', flags: [MessageFlags.Ephemeral] });
        }

        const sub   = interaction.options.getSubcommand();
        const guild = interaction.guild;

        // ── Add Channel ───────────────────────────────────────────────────────
        if (sub === 'addchannel') {
            const name     = interaction.options.getString('name').toLowerCase().replace(/\s+/g, '-');
            const catName  = interaction.options.getString('category');
            const type     = interaction.options.getString('type') || 'text';
            const isVoice  = type === 'voice';

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

            return interaction.editReply({ content: `✅ ${isVoice ? '🔊' : '💬'} Channel ${channel} created${parent ? ` under **${parent.name}**` : ''}.` });
        }

        // ── Remove Channel ────────────────────────────────────────────────────
        if (sub === 'removechannel') {
            const name = interaction.options.getString('name').toLowerCase();
            const channel = guild.channels.cache.find(c => c.name.toLowerCase() === name && c.type !== ChannelType.GuildCategory);

            if (!channel) return interaction.reply({ content: `❌ No channel named **${name}** found.`, flags: [MessageFlags.Ephemeral] });

            await channel.delete('editserver command');
            return interaction.reply({ content: `✅ Channel **#${name}** deleted.`, flags: [MessageFlags.Ephemeral] });
        }

        // ── Add Role ──────────────────────────────────────────────────────────
        if (sub === 'addrole') {
            const name  = interaction.options.getString('name');
            const color = interaction.options.getString('color') || '#99AAB5';

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const role = await guild.roles.create({
                name,
                color,
                reason: 'editserver command'
            }).catch(err => { throw new Error(err.message); });

            return interaction.editReply({ content: `✅ Role **${role.name}** created.` });
        }

        // ── Remove Role ───────────────────────────────────────────────────────
        if (sub === 'removerole') {
            const name = interaction.options.getString('name').toLowerCase();
            const role = guild.roles.cache.find(r => r.name.toLowerCase() === name && !r.managed);

            if (!role) return interaction.reply({ content: `❌ No role named **${name}** found (or it's a managed role).`, flags: [MessageFlags.Ephemeral] });

            await role.delete('editserver command');
            return interaction.reply({ content: `✅ Role **${name}** deleted.`, flags: [MessageFlags.Ephemeral] });
        }
    }
};
