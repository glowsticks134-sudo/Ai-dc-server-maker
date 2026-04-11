const { EmbedBuilder, MessageFlags } = require('discord.js');
const { PLANS, getGuildPlan, setGuildPlan } = require('../data/plans');

const VOID_COLOR = 0x6B48FF;

module.exports = {
    data: {
        name: 'plan',
        description: '🌠 View your current orbit tier and available upgrades'
    },

    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const guild      = interaction.guild;
        const member     = await guild.members.fetch(interaction.user.id).catch(() => null);
        const { plan }   = getGuildPlan(guild.id);

        // Auto-upgrade to premium if user is boosting the current server
        let boostNote = '';
        if (plan === 'free' && member?.premiumSince) {
            setGuildPlan(guild.id, 'premium');
            boostNote = '\n\n🎉 **You\'re boosting this server — your plan has been upgraded to Premium!**';
        }

        const currentPlan = getGuildPlan(guild.id).plan;
        const planData    = PLANS[currentPlan];

        const embed = new EmbedBuilder()
            .setTitle('🌌 Void Builder — Plan Overview')
            .setDescription(`**This server\'s current plan: ${planData.name}**${boostNote}`)
            .setColor(VOID_COLOR)
            .setFooter({ text: '⚡ Void Builder • Boost this server for Premium' })
            .setTimestamp();

        for (const [key, p] of Object.entries(PLANS)) {
            const isCurrent = key === currentPlan;
            embed.addFields({
                name: `${p.name}${isCurrent ? ' ← current' : ''} — ${p.price}`,
                value: p.features.join('\n'),
                inline: false
            });
        }

        embed.addFields({
            name: '⬆️ How to Upgrade',
            value: [
                '**Premium** — Boost this server with Nitro',
                '**Ultra** — Join our [support server](https://discord.gg/KJGKmk2cR7) and contact us'
            ].join('\n'),
            inline: false
        });

        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
    }
};
