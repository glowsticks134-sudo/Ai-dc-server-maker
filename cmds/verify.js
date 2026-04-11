const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');
const { createState } = require('../data/verifyStore');

const VOID_COLOR = 0x6B48FF;
const VERIFIED_ROLE_NAME = 'Verified';

module.exports = {
    data: {
        name: 'verify',
        description: '✅ Set up or use the OAuth2 verification system',
        options: [
            {
                type: 1,
                name: 'setup',
                description: '⚙️ Create the Verified role and this server\'s verify prompt (admin only)'
            },
            {
                type: 1,
                name: 'me',
                description: '🔗 Get your personal verification link'
            }
        ]
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const sub = interaction.options.getSubcommand();

        if (sub === 'setup') return handleSetup(interaction);
        if (sub === 'me') return handleMe(interaction);
    }
};

async function handleSetup(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return interaction.reply({
            content: '❌ You need **Manage Server** permission to run setup.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const guild = interaction.guild;

    // Create or find the Verified role
    let role = guild.roles.cache.find(r => r.name === VERIFIED_ROLE_NAME);
    if (!role) {
        role = await guild.roles.create({
            name: VERIFIED_ROLE_NAME,
            color: VOID_COLOR,
            reason: 'Void Builder – verification system setup'
        });
    }

    // Build the public verification embed + button
    const embed = new EmbedBuilder()
        .setColor(VOID_COLOR)
        .setTitle('🔐 Server Verification')
        .setDescription(
            'To gain access to this server, you must verify your Discord account via OAuth2.\n\n' +
            'Click the button below — you\'ll be redirected to Discord to authorise, ' +
            'then brought straight back. No passwords, no forms.'
        )
        .setFooter({ text: 'Void Builder · OAuth2 Verification' });

    const state = createState(interaction.user.id, guild.id);
    const baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const verifyUrl = `${baseUrl}/verify/start?state=${state}`;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Verify with Discord')
            .setStyle(ButtonStyle.Link)
            .setEmoji('✅')
            .setURL(verifyUrl)
    );

    // Post the public prompt in the channel where setup was run
    await interaction.channel.send({ embeds: [embed], components: [row] });

    await interaction.editReply({
        content: `✅ Verification prompt posted! The **${VERIFIED_ROLE_NAME}** role has been created/confirmed.\n\n` +
                 `> Tip: Use channel permissions to hide server content from members without the **${VERIFIED_ROLE_NAME}** role.`
    });
}

async function handleMe(interaction) {
    const state = createState(interaction.user.id, interaction.guild.id);
    const baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const verifyUrl = `${baseUrl}/verify/start?state=${state}`;

    const embed = new EmbedBuilder()
        .setColor(VOID_COLOR)
        .setTitle('🔗 Your Verification Link')
        .setDescription(
            'Click the button below to verify your account.\n' +
            'This link is personal and expires in **10 minutes**.'
        )
        .setFooter({ text: 'Void Builder · OAuth2 Verification' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Verify with Discord')
            .setStyle(ButtonStyle.Link)
            .setEmoji('✅')
            .setURL(verifyUrl)
    );

    return interaction.reply({ embeds: [embed], components: [row], flags: [MessageFlags.Ephemeral] });
}
