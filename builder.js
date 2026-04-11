/**
 * builder.js
 * Deletes everything existing then rebuilds the server with full permissions.
 * Accepts an optional onProgress(percent, message) callback for live updates.
 */

const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');

const VOID_COLOR = 0x6B48FF;

async function cleanServer(guild) {
    console.log('🧹 Cleaning existing server...');
    for (const [, channel] of guild.channels.cache) {
        try { await channel.delete('Cleanup before deploy'); } catch { }
    }
    for (const [, role] of guild.roles.cache) {
        if (role.name === '@everyone' || role.managed) continue;
        try { await role.delete('Cleanup before deploy'); } catch { }
    }
    console.log('✅ Cleanup done!');
}

async function buildServer(guild, structure, onProgress = null) {
    const progress = async (percent, message) => {
        if (onProgress) {
            try { await onProgress(percent, message); } catch { }
        }
    };

    await progress(5, '🌌 Collapsing old dimensions…');
    await cleanServer(guild);
    await progress(12, '🔨 Initializing construction protocols…');

    console.log(`🔨 Building: ${structure.serverName}`);

    try { await guild.setName(structure.serverName); } catch (err) {
        console.warn(`⚠️ Could not rename server: ${err.message}`);
    }

    try {
        await guild.roles.everyone.setPermissions([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ]);
    } catch { }

    const roleMap     = new Map();
    const sortedRoles = [...(structure.roles || [])].sort((a, b) => (b.position || 0) - (a.position || 0));
    const roleTotal   = sortedRoles.length || 1;

    for (let i = 0; i < sortedRoles.length; i++) {
        const r = sortedRoles[i];
        try {
            const permissions = (r.permissions || []).map(p => PermissionsBitField.Flags[p]).filter(Boolean);
            const role = await guild.roles.create({ name: r.name, color: r.color || '#99AAB5', permissions, hoist: true, reason: 'Void Builder' });
            roleMap.set(r.name, role);
            console.log(`✅ Role: ${r.name}`);
        } catch (err) {
            console.warn(`⚠️ Role "${r.name}": ${err.message}`);
        }
        const pct = 12 + Math.round(((i + 1) / roleTotal) * 28);
        await progress(pct, `⚙️ Forging role **${r.name}**… (${i + 1}/${roleTotal})`);
    }

    const staffRoles = [...roleMap.values()].filter(r =>
        r.permissions.has(PermissionsBitField.Flags.Administrator) ||
        r.permissions.has(PermissionsBitField.Flags.KickMembers)
    );

    await progress(42, '📐 Laying out channel architecture…');

    const categories  = structure.categories || [];
    const catTotal    = categories.length || 1;
    let firstTextChannel = null;

    for (let ci = 0; ci < categories.length; ci++) {
        const cat = categories[ci];
        try {
            const isStaffOnly   = cat.staffOnly === true;
            const isCatReadOnly = cat.readOnly  === true;
            const catOverwrites = [];

            if (isStaffOnly) {
                catOverwrites.push({ id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] });
                for (const role of staffRoles) {
                    catOverwrites.push({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages] });
                }
            } else {
                catOverwrites.push({ id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory] });
            }

            const category = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory, permissionOverwrites: catOverwrites, reason: 'Void Builder' });
            console.log(`📁 Category: ${cat.name} ${isStaffOnly ? '[staff only]' : isCatReadOnly ? '[read only]' : '[public]'}`);

            for (const ch of cat.channels) {
                try {
                    const isVoice    = ch.type === 'GUILD_VOICE';
                    const isReadOnly = ch.readOnly === true || isCatReadOnly ||
                        /annonce|announce|règle|rule|info|log|welcome|bienvenue/.test(ch.name.toLowerCase());

                    let channelOverwrites = [];
                    if (!isStaffOnly) {
                        if (isVoice) {
                            channelOverwrites.push({ id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak] });
                        } else if (isReadOnly) {
                            channelOverwrites.push({ id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] });
                            for (const role of staffRoles) {
                                channelOverwrites.push({ id: role.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] });
                            }
                        } else {
                            channelOverwrites.push({ id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks] });
                        }
                    }

                    const channel = await guild.channels.create({
                        name: ch.name,
                        type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
                        parent: category.id,
                        permissionOverwrites: isStaffOnly ? undefined : channelOverwrites,
                        reason: 'Void Builder'
                    });

                    console.log(`  ${isVoice ? '🔊' : isReadOnly ? '📖' : '💬'} ${ch.name}`);
                    if (!firstTextChannel && !isVoice && !isStaffOnly) firstTextChannel = channel;
                } catch (err) {
                    console.warn(`  ⚠️ Channel "${ch.name}": ${err.message}`);
                }
            }
        } catch (err) {
            console.warn(`⚠️ Category "${cat.name}": ${err.message}`);
        }

        const pct = 42 + Math.round(((ci + 1) / catTotal) * 45);
        await progress(pct, `📁 Building **${cat.name}**… (${ci + 1}/${catTotal})`);
    }

    await progress(90, '✨ Sending welcome transmission…');

    if (firstTextChannel && structure.welcomeMessage) {
        try {
            const embed = new EmbedBuilder()
                .setTitle(`🌌 Welcome to ${structure.serverName}`)
                .setDescription(structure.welcomeMessage)
                .setColor(VOID_COLOR)
                .setFooter({ text: '⚡ Void Builder • AI-Powered Discord Server Architect' })
                .setTimestamp();
            await firstTextChannel.send({ embeds: [embed] });
        } catch { }
    }

    await progress(100, '🎉 Construction complete!');
    console.log('🎉 Build complete!');
    return { roleMap, firstTextChannel };
}

// ── Addon: Ticket System ──────────────────────────────────────────────────────
async function addTicketSystem(guild, staffRoles) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder: EB } = require('discord.js');
    try {
        const catOverwrites = [
            { id: guild.roles.everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
            ...staffRoles.map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] }))
        ];
        const category   = await guild.channels.create({ name: '🎫 SUPPORT', type: ChannelType.GuildCategory, permissionOverwrites: catOverwrites });
        const openChannel = await guild.channels.create({ name: '📩-open-a-ticket', type: ChannelType.GuildText, parent: category.id, permissionOverwrites: catOverwrites });
        const openBtn     = new ButtonBuilder().setCustomId('ticket_open').setLabel('Open a Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫');
        const embed       = new EB().setTitle('🎫 Support Tickets').setDescription('Need help? Click the button below to open a private support ticket.\nA staff member will assist you as soon as possible.').setColor(VOID_COLOR).setFooter({ text: '⚡ Void Builder • Ticket System' }).setTimestamp();
        await openChannel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(openBtn)] });
        console.log('🎫 Ticket system addon deployed');
    } catch (err) {
        console.warn('⚠️ Ticket addon failed:', err.message);
    }
}

// ── Addon: Reaction Roles ─────────────────────────────────────────────────────
async function addReactionRoles(guild, roleMap) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder: EB } = require('discord.js');
    try {
        const assignable = [...roleMap.values()].filter(r =>
            !r.permissions.has(PermissionsBitField.Flags.Administrator) &&
            !r.permissions.has(PermissionsBitField.Flags.KickMembers)
        ).slice(0, 20);

        if (assignable.length === 0) return;

        let rolesChannel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name.toLowerCase().includes('role'));
        if (!rolesChannel) {
            rolesChannel = await guild.channels.create({ name: '🎭-roles', type: ChannelType.GuildText });
        }

        const rows = [];
        for (let i = 0; i < assignable.length; i += 5) {
            const batch = assignable.slice(i, i + 5);
            rows.push(new ActionRowBuilder().addComponents(
                batch.map(r => new ButtonBuilder().setCustomId(`rr:${r.id}`).setLabel(r.name).setStyle(ButtonStyle.Secondary))
            ));
        }

        const embed = new EB().setTitle('🎭 Role Selection').setDescription('Click a button below to add or remove a role.\nClick again to remove it.').setColor(VOID_COLOR).setFooter({ text: '⚡ Void Builder • Reaction Roles' }).setTimestamp();
        await rolesChannel.send({ embeds: [embed], components: rows });
        console.log('🎭 Reaction roles addon deployed');
    } catch (err) {
        console.warn('⚠️ Reaction roles addon failed:', err.message);
    }
}

// ── Addon: Moderation Channels ────────────────────────────────────────────────
async function addModerationChannels(guild, staffRoles) {
    try {
        const overwrites = [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            ...staffRoles.map(r => ({ id: r.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
        ];
        const category = await guild.channels.create({ name: '🛡️ MODERATION', type: ChannelType.GuildCategory, permissionOverwrites: overwrites });
        for (const name of ['📋-mod-log', '🚫-ban-log', '⚠️-warn-log', '💬-staff-chat', '📊-audit-log']) {
            await guild.channels.create({ name, type: ChannelType.GuildText, parent: category.id }).catch(() => null);
        }
        console.log('🛡️ Moderation addon deployed');
    } catch (err) {
        console.warn('⚠️ Moderation addon failed:', err.message);
    }
}

// ── Addon: Welcome Embed ──────────────────────────────────────────────────────
async function addWelcomeEmbed(guild, structure, firstTextChannel) {
    const { EmbedBuilder: EB } = require('discord.js');
    if (!firstTextChannel) return;
    try {
        const embed = new EB()
            .setTitle(`🌌 Welcome to ${structure.serverName}!`)
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
        await firstTextChannel.send({ embeds: [embed] });
        console.log('🌌 Welcome embed addon deployed');
    } catch (err) {
        console.warn('⚠️ Welcome embed addon failed:', err.message);
    }
}

module.exports = { buildServer, cleanServer, addTicketSystem, addReactionRoles, addModerationChannels, addWelcomeEmbed };
