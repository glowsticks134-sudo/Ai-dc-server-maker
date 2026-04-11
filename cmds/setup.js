/**
 * cmds/setup.js
 * /setup → Built-in system setup: tickets, reaction roles, moderation, welcome
 * Also handles ticket_open / ticket_close / rr: button interactions
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChannelType,
    MessageFlags
} = require('discord.js');
const { isAuthorised } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'setup',
        description: '⚙️ Set up built-in systems: tickets, reaction roles, moderation, welcome',
        options: [
            { type: 1, name: 'tickets',      description: '🎫 Create a ticket system with open/close buttons' },
            { type: 1, name: 'reactionroles', description: '🎭 Post a role-picker with buttons in a roles channel' },
            { type: 1, name: 'moderation',   description: '🛡️ Create moderation log channels' },
            { type: 1, name: 'welcome',      description: '👋 Post a welcome embed in the first public channel' }
        ]
    },

    async execute(interaction) {

        // ── Slash commands ────────────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            if (!isAuthorised(interaction.guild.id, interaction.user.id, interaction.guild.ownerId)) {
                return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
            }

            const sub = interaction.options.getSubcommand();

            if (sub === 'tickets')      return setupTickets(interaction);
            if (sub === 'reactionroles') return setupReactionRoles(interaction);
            if (sub === 'moderation')   return setupModeration(interaction);
            if (sub === 'welcome')      return setupWelcome(interaction);
        }

        // ── Ticket: open ──────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ticket_open') {
            const guild  = interaction.guild;
            const user   = interaction.user;
            const name   = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}`;

            const existing = guild.channels.cache.find(c => c.name === name);
            if (existing) {
                return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, flags: [MessageFlags.Ephemeral] });
            }

            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const category = interaction.channel.parent;
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
                name,
                type: ChannelType.GuildText,
                parent: category?.id || null,
                permissionOverwrites: overwrites
            });

            const closeBtn = new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒');

            const embed = new EmbedBuilder()
                .setTitle('🎫 Support Ticket')
                .setDescription(`Hello ${user}! Describe your issue and a staff member will assist you shortly.`)
                .setColor(VOID_COLOR)
                .setFooter({ text: '⚡ Void Builder • Click Close Ticket when resolved' })
                .setTimestamp();

            await channel.send({ content: `${user}`, embeds: [embed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
            await interaction.editReply({ content: `✅ Ticket opened: ${channel}` });
        }

        // ── Ticket: close ─────────────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'ticket_close') {
            await interaction.reply({ content: '🔒 Closing ticket...', flags: [MessageFlags.Ephemeral] });
            await interaction.channel.delete('Ticket closed').catch(() => {});
        }

        // ── Reaction roles toggle ─────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('rr:')) {
            const roleId = interaction.customId.slice(3);
            const member = interaction.member;
            const role   = interaction.guild.roles.cache.get(roleId);

            if (!role) return interaction.reply({ content: '❌ This role no longer exists.', flags: [MessageFlags.Ephemeral] });

            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                return interaction.reply({ content: `✅ Removed **${role.name}** from you.`, flags: [MessageFlags.Ephemeral] });
            } else {
                await member.roles.add(role);
                return interaction.reply({ content: `✅ Gave you **${role.name}**.`, flags: [MessageFlags.Ephemeral] });
            }
        }
    }
};

// ── Setup: Ticket System ──────────────────────────────────────────────────────
async function setupTickets(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const guild = interaction.guild;

    const staffRoles = guild.roles.cache.filter(r =>
        !r.managed && r.name !== '@everyone' &&
        (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.KickMembers))
    );

    const catOverwrites = [
        { id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
        ...staffRoles.map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] }))
    ];

    const category = await guild.channels.create({ name: '🎫 SUPPORT', type: ChannelType.GuildCategory, permissionOverwrites: catOverwrites });

    const openChannel = await guild.channels.create({ name: '📩-open-a-ticket', type: ChannelType.GuildText, parent: category.id, permissionOverwrites: catOverwrites });

    const openBtn = new ButtonBuilder().setCustomId('ticket_open').setLabel('Open a Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫');

    const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription('Need help? Click the button below to open a private support ticket.\nA staff member will assist you as soon as possible.')
        .setColor(VOID_COLOR)
        .setFooter({ text: '⚡ Void Builder • Ticket System' })
        .setTimestamp();

    await openChannel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(openBtn)] });
    await interaction.editReply({ content: `✅ **Ticket system set up!** Users can open tickets in ${openChannel}.` });
}

// ── Setup: Reaction Roles ─────────────────────────────────────────────────────
async function setupReactionRoles(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const guild = interaction.guild;

    const assignableRoles = guild.roles.cache.filter(r =>
        !r.managed && r.name !== '@everyone' &&
        !r.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !r.permissions.has(PermissionsBitField.Flags.KickMembers)
    ).first(25);

    if (!assignableRoles.size && !Array.isArray(assignableRoles)) {
        return interaction.editReply({ content: '❌ No assignable roles found. Create some non-admin roles first.' });
    }

    const roles = Array.isArray(assignableRoles) ? assignableRoles : [...assignableRoles.values()];
    if (roles.length === 0) return interaction.editReply({ content: '❌ No assignable roles found.' });

    let rolesChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name.toLowerCase().includes('role'));
    if (!rolesChannel) {
        rolesChannel = await guild.channels.create({ name: '🎭-roles', type: ChannelType.GuildText });
    }

    const rows = [];
    for (let i = 0; i < roles.length; i += 5) {
        const batch = roles.slice(i, i + 5);
        const row = new ActionRowBuilder().addComponents(
            batch.map(r => new ButtonBuilder().setCustomId(`rr:${r.id}`).setLabel(r.name).setStyle(ButtonStyle.Secondary))
        );
        rows.push(row);
    }

    const embed = new EmbedBuilder()
        .setTitle('🎭 Role Selection')
        .setDescription('Click a button below to add or remove a role.\nClick again to remove it.')
        .setColor(VOID_COLOR)
        .setFooter({ text: '⚡ Void Builder • Reaction Roles' })
        .setTimestamp();

    await rolesChannel.send({ embeds: [embed], components: rows });
    await interaction.editReply({ content: `✅ **Reaction roles set up!** Role buttons posted in ${rolesChannel}.` });
}

// ── Setup: Moderation ─────────────────────────────────────────────────────────
async function setupModeration(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const guild = interaction.guild;

    const staffRoles = guild.roles.cache.filter(r =>
        !r.managed && r.name !== '@everyone' &&
        (r.permissions.has(PermissionsBitField.Flags.Administrator) || r.permissions.has(PermissionsBitField.Flags.KickMembers))
    );

    const overwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        ...staffRoles.map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
    ];

    const category = await guild.channels.create({ name: '🛡️ MODERATION', type: ChannelType.GuildCategory, permissionOverwrites: overwrites });

    const channels = ['📋-mod-log', '🚫-ban-log', '⚠️-warn-log', '💬-staff-chat', '📊-audit-log'];
    const created  = [];
    for (const name of channels) {
        const ch = await guild.channels.create({ name, type: ChannelType.GuildText, parent: category.id }).catch(() => null);
        if (ch) created.push(ch);
    }

    await interaction.editReply({ content: `✅ **Moderation system set up!** Created ${created.length} channels under **🛡️ MODERATION** (staff only).` });
}

// ── Setup: Welcome ────────────────────────────────────────────────────────────
async function setupWelcome(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const guild = interaction.guild;

    const channel = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        c.permissionsFor(guild.roles.everyone)?.has(PermissionsBitField.Flags.ViewChannel)
    );

    if (!channel) return interaction.editReply({ content: '❌ No public text channel found to post in.' });

    const embed = new EmbedBuilder()
        .setTitle(`🌌 Welcome to ${guild.name}!`)
        .setDescription([
            `We're thrilled to have you here. This server was crafted with **Void Builder** — AI-powered Discord server architecture.`,
            '',
            '**Getting Started**',
            '→ Read the rules',
            '→ Grab your roles',
            '→ Introduce yourself',
            '',
            '*Enjoy your stay! 🚀*'
        ].join('\n'))
        .setColor(VOID_COLOR)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: '⚡ Void Builder • AI-Powered Discord Server Architect' })
        .setTimestamp();

    await channel.send({ embeds: [embed] });
    await interaction.editReply({ content: `✅ **Welcome embed posted** in ${channel}.` });
}
