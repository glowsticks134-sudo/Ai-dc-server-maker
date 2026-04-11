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

// ── Register slash commands ───────────────────────────────────────────────────
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
const commandBodies = [...client.commands.values()].map(cmd => cmd.data);

async function registerCommandsInGuild(guildId) {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body: commandBodies });
        console.log(`✅ Commands registered in guild ${guildId}`);
    } catch (error) {
        console.error(`❌ Failed to register commands in guild ${guildId}:`, error.message);
    }
}

async function clearGlobalCommands() {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('🧹 Global commands cleared.');
    } catch (error) {
        console.error('❌ Failed to clear global commands:', error.message);
    }
}

async function registerAllGuilds() {
    const guilds = client.guilds.cache;
    console.log(`⏳ Registering ${commandBodies.length} command(s) on ${guilds.size} server(s)...`);
    for (const [guildId] of guilds) {
        await registerCommandsInGuild(guildId);
    }
    console.log('🚀 All commands registered successfully!');
}

// ── Route table: customId → command name ──────────────────────────────────────
const MODAL_ROUTES = {
    deploy_modal:        'deploy',
    prompt_idea_modal:   'prompt',
    prompt_improve_modal:'prompt'
};

const SELECT_ROUTES = {
    prompt_select:    'prompt',
    template_select:  'templates'
};

const BUTTON_ROUTES = {
    template_cancel: 'templates'
};

// ── Events ────────────────────────────────────────────────────────────────────
client.once('ready', async () => {
    console.log(`\n✅ Bot connected: ${client.user.tag}`);
    await clearGlobalCommands();
    await registerAllGuilds();
});

// Register commands whenever the bot joins a new server
client.on('guildCreate', async guild => {
    console.log(`📥 Joined new server: ${guild.name} (${guild.id})`);
    await registerCommandsInGuild(guild.id);
});

client.on('interactionCreate', async interaction => {
    let cmdName;

    if (interaction.isChatInputCommand()) {
        cmdName = interaction.commandName;
    } else if (interaction.isModalSubmit()) {
        cmdName = MODAL_ROUTES[interaction.customId];
    } else if (interaction.isStringSelectMenu()) {
        cmdName = SELECT_ROUTES[interaction.customId];
    } else if (interaction.isButton()) {
        const baseId = interaction.customId.split(':')[0];
        cmdName = BUTTON_ROUTES[baseId] || BUTTON_ROUTES[interaction.customId];
        if (!cmdName && interaction.customId.startsWith('template_confirm:')) cmdName = 'templates';
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
