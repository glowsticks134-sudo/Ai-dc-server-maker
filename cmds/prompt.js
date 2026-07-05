/**
 * cmds/prompt.js
 * /prompt → Select Menu éphémère → selon le choix :
 *   1. generate → réponse directe éphémère
 *   2. idea     → Modal → réponse éphémère
 *   3. improve  → Modal → réponse éphémère
 */

const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require('discord.js');

const { generatePrompt } = require('../ai-logic');

module.exports = {
    data: {
        name: 'prompt',
        description: '✨ Generate or enhance prompts using the Stichachu AI engine'
    },

    async execute(interaction) {

        // ── 1. Slash command → Show Select Menu ──────────────────────────────
        if (interaction.isChatInputCommand()) {
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('prompt_select')
                .setPlaceholder('What do you want to do?')
                .addOptions([
                    {
                        label: 'Generate a prompt',
                        description: 'AI generates a ready-to-use prompt for your use case',
                        value: 'generate',
                        emoji: '✨'
                    },
                    {
                        label: 'Generate a prompt from an idea',
                        description: 'Describe a rough idea, AI turns it into a full prompt',
                        value: 'idea',
                        emoji: '💡'
                    },
                    {
                        label: 'Improve my prompt',
                        description: 'Paste your existing prompt, AI improves it',
                        value: 'improve',
                        emoji: '🔧'
                    }
                ]);

            await interaction.reply({
                content: '### ✍️ Prompt Generator\nChoose an action below:',
                components: [new ActionRowBuilder().addComponents(selectMenu)],
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        // ── 2. Select Menu interaction ────────────────────────────────────────
        if (interaction.isStringSelectMenu() && interaction.customId === 'prompt_select') {
            const choice = interaction.values[0];

            // --- Choice 1: generate directly, no extra input needed ----------
            if (choice === 'generate') {
                await interaction.deferUpdate();
                await interaction.editReply({
                    content: '🧠 Generating your prompt...',
                    components: []
                });

                try {
                    const result = await generatePrompt('generate', {
                        useCase: 'a versatile, high-quality AI assistant prompt',
                        tone: 'professional',
                        language: 'English'
                    });

                    await interaction.editReply({
                        content: `${result.header}\n\`\`\`\n${result.prompt}\n\`\`\``,
                        components: []
                    });
                } catch (err) {
                    await interaction.editReply({ content: `❌ Error: ${err.message}`, components: [] });
                }
                return;
            }

            // --- Choice 2: idea → open Modal ---------------------------------
            if (choice === 'idea') {
                const modal = new ModalBuilder()
                    .setCustomId('prompt_idea_modal')
                    .setTitle('💡 Generate a prompt from an idea');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idea')
                            .setLabel('Describe your idea')
                            .setPlaceholder('e.g. An AI that helps students understand math step by step')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMinLength(10)
                            .setMaxLength(500)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('context')
                            .setLabel('Additional context (optional)')
                            .setPlaceholder('e.g. Target audience, tone, constraints...')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setMaxLength(300)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('language')
                            .setLabel('Prompt language')
                            .setPlaceholder('e.g. French, English, Spanish...')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(50)
                    )
                );

                await interaction.showModal(modal);
                return;
            }

            // --- Choice 3: improve → open Modal ------------------------------
            if (choice === 'improve') {
                const modal = new ModalBuilder()
                    .setCustomId('prompt_improve_modal')
                    .setTitle('🔧 Improve my prompt');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('original_prompt')
                            .setLabel('Your current prompt')
                            .setPlaceholder('Paste your existing prompt here...')
                            .setStyle(TextInputStyle.Paragraph)
                            .setMinLength(10)
                            .setMaxLength(1000)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('issues')
                            .setLabel('What should be improved? (optional)')
                            .setPlaceholder('e.g. Too vague, missing context, wrong tone...')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setMaxLength(300)
                    )
                );

                await interaction.showModal(modal);
                return;
            }
        }

        // ── 3. Modal submits ──────────────────────────────────────────────────
        if (interaction.isModalSubmit()) {

            // --- Idea modal --------------------------------------------------
            if (interaction.customId === 'prompt_idea_modal') {
                const idea     = interaction.fields.getTextInputValue('idea');
                const context  = interaction.fields.getTextInputValue('context')  || '';
                const language = interaction.fields.getTextInputValue('language') || 'English';

                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                try {
                    const result = await generatePrompt('idea', { idea, context, language });
                    await sendPromptResult(interaction, result);
                } catch (err) {
                    await interaction.editReply({ content: `❌ Error: ${err.message}` });
                }
                return;
            }

            // --- Improve modal -----------------------------------------------
            if (interaction.customId === 'prompt_improve_modal') {
                const originalPrompt = interaction.fields.getTextInputValue('original_prompt');
                const issues         = interaction.fields.getTextInputValue('issues') || '';

                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                try {
                    const result = await generatePrompt('improve', { originalPrompt, issues });
                    // Strip all Discord markdown characters for plain copiable text
                    const plain = result.prompt
                        .replace(/\*{1,3}|_{1,3}|~~|`{1,3}|>{1,3}|-{3,}|#{1,6}\s/g, '')
                        .trim();

                    const chunks = plain.match(/.{1,1990}/gs) || [plain];
                    await interaction.editReply({ content: chunks[0] });
                    for (let i = 1; i < chunks.length; i++) {
                        await interaction.followUp({ content: chunks[i], flags: [MessageFlags.Ephemeral] });
                    }
                } catch (err) {
                    await interaction.editReply({ content: `❌ Error: ${err.message}` });
                }
                return;
            }
        }
    }
};

// ── Helper: send prompt result, split if too long ─────────────────────────────
async function sendPromptResult(interaction, result) {
    const full = `${result.header}\n\`\`\`\n${result.prompt}\n\`\`\``;

    if (full.length <= 1990) {
        await interaction.editReply({ content: full });
    } else {
        await interaction.editReply({ content: result.header });
        const chunks = result.prompt.match(/.{1,1900}/gs) || [result.prompt];
        for (const chunk of chunks) {
            await interaction.followUp({
                content: `\`\`\`\n${chunk}\n\`\`\``,
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
}