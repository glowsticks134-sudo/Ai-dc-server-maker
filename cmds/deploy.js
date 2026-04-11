/**
 * cmds/deploy.js
 * Handles the /deploy command
 */

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');

const { generateServerStructure } = require('../ai-logic');
const { buildServer } = require('../builder');

const SEPARATOR_PRESETS = {
    'default': '-',
    'dash':    '-',
    'bar':     '┃',
    'pipe':    '│',
    'dot':     '•',
    'bullet':  '•',
    'arrow':   '›',
    'chevron': '⟩',
    'wave':    '〜',
    'star':    '✦',
    'cross':   '✖',
    'diamond': '◈',
    'heart':   '♡',
};

function resolveSeparator(input) {
    if (!input || !input.trim()) return '-';
    const lower = input.trim().toLowerCase();
    if (SEPARATOR_PRESETS[lower]) return SEPARATOR_PRESETS[lower];
    return input.trim()[0];
}

module.exports = {
    data: {
        name: 'deploy',
        description: '🤖 Generate and deploy a complete Discord server with AI'
    },

    async execute(interaction) {

        // ── Slash command → show modal ───────────────────────────────────────
        if (interaction.isChatInputCommand()) {
            const modal = new ModalBuilder()
                .setCustomId('deploy_modal')
                .setTitle('🤖 Create a server with AI');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('description')
                        .setLabel('Describe your server')
                        .setPlaceholder('e.g. A French Minecraft prison server with miner, guard and warden ranks...')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(10)
                        .setMaxLength(4000)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('separator')
                        .setLabel('Channel separator (optional)')
                        .setPlaceholder('default(-) bar(┃) pipe(│) dot(•) arrow(›) star(✦) diamond(◈) …or any character')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setMaxLength(20)
                )
            );

            await interaction.showModal(modal);
            return;
        }

        // ── Modal submit ─────────────────────────────────────────────────────
        if (interaction.isModalSubmit() && interaction.customId === 'deploy_modal') {
            const description = interaction.fields.getTextInputValue('description');
            const separatorInput = interaction.fields.getTextInputValue('separator') || '';
            const separator = resolveSeparator(separatorInput);
            const guild = interaction.guild;

            await interaction.reply({
                content: `🧠 AI is generating your server structure... The server will be rebuilt, don't worry if you lose connection!\n> Separator style: **${separator}**`,
                flags: [MessageFlags.Ephemeral]
            });

            try {
                console.log(`\n📥 New deploy request: "${description}" [separator: "${separator}"]`);
                const structure = await generateServerStructure(description, separator);
                console.log(`📐 Structure received:`, JSON.stringify(structure, null, 2));
                await buildServer(guild, structure);

                try {
                    await interaction.followUp({
                        content: `✨ **"${structure.serverName}"** deployed! ${(structure.roles || []).length} roles and ${(structure.categories || []).length} categories created.`,
                        flags: [MessageFlags.Ephemeral]
                    });
                } catch {
                    console.log('ℹ️ Could not send followUp (channel was deleted during cleanup) — this is normal.');
                }

            } catch (error) {
                console.error('❌ Deployment error:', error.message);
                try {
                    await interaction.followUp({ content: `❌ Error: ${error.message}`, flags: [MessageFlags.Ephemeral] });
                } catch {}
            }
        }
    }
};
