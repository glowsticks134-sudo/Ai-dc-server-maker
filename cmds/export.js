/**
 * cmds/export.js
 * /export — Scans the current server and exports its full structure as a .json file
 */

const { EmbedBuilder, AttachmentBuilder, ChannelType, MessageFlags } = require('discord.js');
const { isAuthorised } = require('../data/owners');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'export',
        description: '📤 Export this server\'s structure as a shareable JSON file'
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (!isAuthorised(interaction.guild.id, interaction.user.id)) {
            return interaction.reply({ content: '❌ Only the server owner or a co-owner can use this command.', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guild = interaction.guild;
        await guild.channels.fetch();
        await guild.roles.fetch();

        // ── Roles ─────────────────────────────────────────────────────────────
        const roles = [...guild.roles.cache.values()]
            .filter(r => r.name !== '@everyone' && !r.managed)
            .sort((a, b) => b.position - a.position)
            .map(r => ({
                name:        r.name,
                color:       r.hexColor === '#000000' ? '#99AAB5' : r.hexColor,
                position:    r.position,
                permissions: []
            }));

        // ── Categories + channels ─────────────────────────────────────────────
        const categories = [...guild.channels.cache.values()]
            .filter(c => c.type === ChannelType.GuildCategory)
            .sort((a, b) => a.position - b.position)
            .map(cat => {
                const channels = [...guild.channels.cache.values()]
                    .filter(c => c.parentId === cat.id)
                    .sort((a, b) => a.position - b.position)
                    .map(ch => ({
                        name: ch.name,
                        type: ch.type === ChannelType.GuildVoice ? 'GUILD_VOICE' : 'GUILD_TEXT'
                    }));

                const everyoneOverwrite = cat.permissionOverwrites.cache.get(guild.roles.everyone.id);
                const staffOnly = everyoneOverwrite
                    ? everyoneOverwrite.deny.has('ViewChannel')
                    : false;

                return { name: cat.name, staffOnly, readOnly: false, channels };
            });

        // ── Orphan channels (no category) ─────────────────────────────────────
        const orphans = [...guild.channels.cache.values()]
            .filter(c => !c.parentId && c.type !== ChannelType.GuildCategory)
            .sort((a, b) => a.position - b.position)
            .map(ch => ({ name: ch.name, type: ch.type === ChannelType.GuildVoice ? 'GUILD_VOICE' : 'GUILD_TEXT' }));

        if (orphans.length > 0) {
            categories.unshift({ name: '📋 GENERAL', staffOnly: false, readOnly: false, channels: orphans });
        }

        // ── Build structure ───────────────────────────────────────────────────
        const structure = {
            serverName:     guild.name,
            welcomeMessage: `Welcome to ${guild.name}! Exported and rebuilt with Void Builder.`,
            roles,
            categories,
            _meta: {
                exportedAt:   new Date().toISOString(),
                exportedBy:   'Void Builder',
                originalName: guild.name,
                roleCount:    roles.length,
                categoryCount: categories.length,
                channelCount: categories.reduce((n, c) => n + c.channels.length, 0)
            }
        };

        // ── File attachment ───────────────────────────────────────────────────
        const json       = JSON.stringify(structure, null, 2);
        const buffer     = Buffer.from(json, 'utf-8');
        const filename   = `${guild.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-void-export.json`;
        const attachment = new AttachmentBuilder(buffer, { name: filename });

        const totalChannels = categories.reduce((n, c) => n + c.channels.length, 0);

        const embed = new EmbedBuilder()
            .setTitle('📤 Server Structure Exported')
            .setDescription(
                `**${guild.name}** has been fully exported.\n\n` +
                `Use \`/import\` on any server to rebuild this exact layout with Void Builder.`
            )
            .setColor(VOID_COLOR)
            .addFields(
                { name: '📊 What\'s included',
                  value: [
                      `• **${roles.length}** custom roles`,
                      `• **${categories.length}** categories`,
                      `• **${totalChannels}** channels`,
                  ].join('\n'),
                  inline: true
                },
                { name: '💡 How to use',
                  value: [
                      '1. Download the JSON file below',
                      '2. Go to your target server',
                      '3. Run `/import` and paste the contents',
                  ].join('\n'),
                  inline: true
                }
            )
            .setThumbnail(guild.iconURL())
            .setFooter({ text: '⚡ Void Builder • Plugin System — Export & Import' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    }
};
