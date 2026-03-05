/**
 * index.js
 * Required environment variables in .env:
 *   DISCORD_TOKEN=your_discord_token
 *   CLIENT_ID=your_application_id
 *   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
 */

require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { DISCORD_TOKEN, CLIENT_ID, GROQ_API_KEY } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GROQ_API_KEY) {
    console.error('❌ Missing variables in .env. Check DISCORD_TOKEN, CLIENT_ID, GROQ_API_KEY.');
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ── Load commands from cmds/ ──────────────────────────────────────────────────
client.commands = new Collection();
const cmdsPath = path.join(__dirname, 'cmds');
const cmdFiles = fs.readdirSync(cmdsPath).filter(f => f.endsWith('.js'));

for (const file of cmdFiles) {
    const cmd = require(path.join(cmdsPath, file));
    client.commands.set(cmd.data.name, cmd);
    console.log(`📦 Loaded command: /${cmd.data.name}`);
}

// ── Register slash commands on Discord ────────────────────────────────────────
async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    const commandBodies = [...client.commands.values()].map(cmd => cmd.data);

    try {
        const guilds = client.guilds.cache;
        console.log(`⏳ Registering ${commandBodies.length} command(s) on ${guilds.size} server(s)...`);
        for (const [guildId] of guilds) {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commandBodies });
        }
        console.log('🚀 All commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error.message);
    }
}

// ── Route table: customId → command name ──────────────────────────────────────
const MODAL_ROUTES = {
    deploy_modal:        'deploy',
    prompt_idea_modal:   'prompt',
    prompt_improve_modal:'prompt'
};

const SELECT_ROUTES = {
    prompt_select: 'prompt'
};

// ── Events ────────────────────────────────────────────────────────────────────
client.once('ready', async () => {
    console.log(`\n✅ Bot connected: ${client.user.tag}`);
    await registerCommands();
});

client.on('interactionCreate', async interaction => {
    let cmdName;

    if (interaction.isChatInputCommand()) {
        cmdName = interaction.commandName;
    } else if (interaction.isModalSubmit()) {
        cmdName = MODAL_ROUTES[interaction.customId];
    } else if (interaction.isStringSelectMenu()) {
        cmdName = SELECT_ROUTES[interaction.customId];
    }

    if (!cmdName) return;

    const cmd = client.commands.get(cmdName);
    if (!cmd) return;

    try {
        await cmd.execute(interaction);
    } catch (err) {
        console.error(`❌ Error routing "${interaction.customId ?? interaction.commandName}":`, err.message);
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
client.login(DISCORD_TOKEN).catch(err => {
    console.error('❌ Could not connect to Discord:', err.message);
    process.exit(1);
});
