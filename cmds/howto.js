/**
 * cmds/howto.js
 * /howto → Paginated guide to all Void Builder commands (public)
 */

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const VOID_COLOR = 0x6B48FF;
const TOTAL_PAGES = 4;

function buildPage(page, thumbnailUrl) {
    const base = new EmbedBuilder()
        .setColor(VOID_COLOR)
        .setThumbnail(thumbnailUrl)
        .setFooter({ text: `⚡ Void Builder • AI-Powered Discord Server Architect  |  Page ${page} of ${TOTAL_PAGES}` });

    if (page === 1) {
        return base
            .setTitle('🌌 Void Builder — How To Use  (1/4)')
            .setDescription(
                'Welcome aboard. **Void Builder** is an AI-powered Discord server architect — it builds complete ' +
                'server structures (roles, categories, channels, permissions) for you in seconds.\n\n' +
                'Use the **Next** button below to explore all commands.'
            )
            .addFields(
                {
                    name: '✍️  /deploy — AI Server Generator',
                    value: [
                        'The flagship command. Run it and choose a mode:',
                        '• **Prompt Mode** — Describe your server in your own words (e.g. *"a chill gaming server for friends"*) and the AI builds it from scratch.',
                        '• **Wizard Mode** — Pick server type, size, personality and add-ons using dropdowns and buttons — **zero typing required**.'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🧙  /wizard — Standalone Wizard',
                    value: 'The full button-driven wizard on its own. Choose from 10 server types, 3 sizes, 5 personalities and 4 add-on packs — then hit **Build** and watch it go.',
                    inline: false
                }
            );
    }

    if (page === 2) {
        return base
            .setTitle('🌌 Void Builder — How To Use  (2/4)')
            .setDescription('**Templates, Snapshots & Restoration**')
            .addFields(
                {
                    name: '📋  /templates — Browse Constellations',
                    value: 'View all pre-built server layouts with a live preview (roles, categories, channels). Browse only — no changes made.',
                    inline: false
                },
                {
                    name: '🔒  /ownertemplates — Deploy a Constellation',
                    value: 'Owner-only. Pick a built-in or custom template, preview it, then deploy it. **Replaces all existing channels and roles.**',
                    inline: false
                },
                {
                    name: '🗂️  /addtemplate — Chart a Custom Star Map',
                    value: 'Owner-only. Paste any `discord.new/XXXX` template link and save it to your personal constellation library — it then appears in `/templates` and `/ownertemplates`.',
                    inline: false
                },
                {
                    name: '📤  /export — Snapshot Your Server',
                    value: 'Scans your live server and downloads a `.json` file containing every role, category and channel. Use it to back up or share your layout.',
                    inline: false
                },
                {
                    name: '📥  /import — Restore From a Snapshot',
                    value: 'Paste the JSON from an `/export` file, preview what will be built, then hit **Build** to restore the server layout.',
                    inline: false
                }
            );
    }

    if (page === 3) {
        return base
            .setTitle('🌌 Void Builder — How To Use  (3/4)')
            .setDescription('**Server Management & Setup**')
            .addFields(
                {
                    name: '🛸  /editserver — Live Edits',
                    value: [
                        'Add or remove individual channels and roles without a full rebuild:',
                        '• `/editserver addchannel` — Launch a new text or voice channel into orbit',
                        '• `/editserver removechannel` — Collapse a channel into the void',
                        '• `/editserver addrole` — Forge a new rank in the cosmos',
                        '• `/editserver removerole` — Disintegrate a role from existence'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️  /setup — Add-On Systems',
                    value: [
                        'Deploy ready-made utility systems to your server:',
                        '• **Ticket System** — A support channel with Open/Close buttons',
                        '• **Reaction Roles** — A channel where members self-assign roles',
                        '• **Moderation Channels** — Logs and audit channels for your mod team',
                        '• **Welcome Embed** — A beautiful welcome message for new arrivals'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '💥  /wipe — Clean Slate',
                    value: 'Owner-only. **Deletes every channel and role** on your server (except @everyone) so you can start fresh. Requires confirmation — irreversible.',
                    inline: false
                }
            );
    }

    if (page === 4) {
        return base
            .setTitle('🌌 Void Builder — How To Use  (4/4)')
            .setDescription('**Utility & Account Commands**')
            .addFields(
                {
                    name: '🔑  /addowner — Manage Co-Pilots',
                    value: [
                        'Grant or revoke `/deploy` access to other crew members:',
                        '• `/addowner add @user` — Beam a member into co-pilot clearance',
                        '• `/addowner remove @user` — Revoke their access',
                        '• `/addowner list` — View all active co-pilots'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🧠  /prompt — AI Prompt Tools',
                    value: 'Helpers for working with AI prompts — generate ideas, improve descriptions, or explore what makes a great server concept.',
                    inline: false
                },
                {
                    name: '🛸  /order — Commission the Void Crew',
                    value: 'Open a private commission channel between you and the server staff. Describe what you need (custom bot, server architecture, etc.) and the team will respond.',
                    inline: false
                },
                {
                    name: '📊  /plan — Your Orbit Tier',
                    value: 'Check your current feature tier and what\'s available at each level.',
                    inline: false
                },
                {
                    name: '🔗  /invite — Invite Void Builder',
                    value: 'Get the link to add Void Builder to any server you own.',
                    inline: false
                }
            );
    }
}

function buildRow(page) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`howto_page:${page - 1}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
            .setDisabled(page <= 1),
        new ButtonBuilder()
            .setCustomId(`howto_page:${page + 1}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('➡️')
            .setDisabled(page >= TOTAL_PAGES)
    );
}

module.exports = {
    data: {
        name: 'howto',
        description: '📖 Learn how to use every Void Builder command — interactive guide'
    },

    async execute(interaction) {

        // ── Slash command → page 1 ─────────────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            await interaction.deferReply();
            const embed = buildPage(1, interaction.client.user.displayAvatarURL());
            return interaction.editReply({ embeds: [embed], components: [buildRow(1)] });
        }

        // ── Button: navigate pages ─────────────────────────────────────────────
        if (interaction.isButton() && interaction.customId.startsWith('howto_page:')) {
            const page = parseInt(interaction.customId.split(':')[1], 10);
            if (isNaN(page) || page < 1 || page > TOTAL_PAGES) return;
            const embed = buildPage(page, interaction.client.user.displayAvatarURL());
            return interaction.update({ embeds: [embed], components: [buildRow(page)] });
        }
    }
};
