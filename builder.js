/**
 * builder.js
 * Deletes everything existing then rebuilds the server with full permissions
 */

const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');

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

async function buildServer(guild, structure) {
    await cleanServer(guild);
    console.log(`🔨 Building: ${structure.serverName}`);

    // Rename the server
    try { await guild.setName(structure.serverName); } catch (err) {
        console.warn(`⚠️ Could not rename server: ${err.message}`);
    }

    // @everyone: view + read only by default
    try {
        await guild.roles.everyone.setPermissions([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory
        ]);
    } catch { }

    // Create roles (sorted by position descending)
    const roleMap = new Map();
    const sortedRoles = [...(structure.roles || [])].sort((a, b) => (b.position || 0) - (a.position || 0));

    for (const r of sortedRoles) {
        try {
            const permissions = (r.permissions || [])
                .map(p => PermissionsBitField.Flags[p])
                .filter(Boolean);

            const role = await guild.roles.create({
                name: r.name,
                color: r.color || '#99AAB5',
                permissions,
                hoist: true,
                reason: 'ServerCreator Bot'
            });

            roleMap.set(r.name, role);
            console.log(`✅ Role: ${r.name}`);
        } catch (err) {
            console.warn(`⚠️ Role "${r.name}": ${err.message}`);
        }
    }

    // Identify staff roles (admin + mod)
    const staffRoles = [...roleMap.values()].filter(r =>
        r.permissions.has(PermissionsBitField.Flags.Administrator) ||
        r.permissions.has(PermissionsBitField.Flags.KickMembers)
    );

    let firstTextChannel = null;

    for (const cat of (structure.categories || [])) {
        try {
            const isStaffOnly = cat.staffOnly === true;
            const isCatReadOnly = cat.readOnly === true;

            // Category permission overwrites
            const catOverwrites = [];

            if (isStaffOnly) {
                catOverwrites.push({
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                });
                for (const role of staffRoles) {
                    catOverwrites.push({
                        id: role.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory,
                            PermissionsBitField.Flags.ManageMessages
                        ]
                    });
                }
            } else {
                catOverwrites.push({
                    id: guild.roles.everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory]
                });
            }

            const category = await guild.channels.create({
                name: cat.name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: catOverwrites,
                reason: 'ServerCreator Bot'
            });

            console.log(`📁 Category: ${cat.name} ${isStaffOnly ? '[staff only]' : isCatReadOnly ? '[read only]' : '[public]'}`);

            for (const ch of cat.channels) {
                try {
                    const isVoice = ch.type === 'GUILD_VOICE';
                    const isReadOnly = ch.readOnly === true || isCatReadOnly ||
                        /annonce|announce|règle|rule|info|log|welcome|bienvenue/.test(ch.name.toLowerCase());

                    let channelOverwrites = [];

                    if (isStaffOnly) {
                        // Inherits from category, no override needed
                    } else if (isVoice) {
                        channelOverwrites.push({
                            id: guild.roles.everyone.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.Connect,
                                PermissionsBitField.Flags.Speak
                            ]
                        });
                    } else if (isReadOnly) {
                        channelOverwrites.push({
                            id: guild.roles.everyone.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                            deny: [PermissionsBitField.Flags.SendMessages]
                        });
                        for (const role of staffRoles) {
                            channelOverwrites.push({
                                id: role.id,
                                allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages]
                            });
                        }
                    } else {
                        channelOverwrites.push({
                            id: guild.roles.everyone.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                                PermissionsBitField.Flags.AddReactions,
                                PermissionsBitField.Flags.AttachFiles,
                                PermissionsBitField.Flags.EmbedLinks
                            ]
                        });
                    }

                    const channel = await guild.channels.create({
                        name: ch.name,
                        type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
                        parent: category.id,
                        permissionOverwrites: isStaffOnly ? undefined : channelOverwrites,
                        reason: 'ServerCreator Bot'
                    });

                    console.log(`  ${isVoice ? '🔊' : isReadOnly ? '📖' : '💬'} ${ch.name}`);

                    if (!firstTextChannel && !isVoice && !isStaffOnly) {
                        firstTextChannel = channel;
                    }
                } catch (err) {
                    console.warn(`  ⚠️ Channel "${ch.name}": ${err.message}`);
                }
            }
        } catch (err) {
            console.warn(`⚠️ Category "${cat.name}": ${err.message}`);
        }
    }

    // Welcome message
    if (firstTextChannel && structure.welcomeMessage) {
        try {
            const embed = new EmbedBuilder()
                .setTitle(`✨ Welcome to ${structure.serverName}!`)
                .setDescription(structure.welcomeMessage)
                .setColor('#5865F2')
                .setFooter({ text: 'Generated by ServerCreator Bot • Powered by Shadow.devs' })
                .setTimestamp();
            await firstTextChannel.send({ embeds: [embed] });
        } catch { }
    }

    console.log('🎉 Build complete!');
    return { roleMap, firstTextChannel };
}

module.exports = { buildServer };
