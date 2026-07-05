# Stichachu Builder

## Overview
A Discord bot that uses AI (Groq API) to automatically generate and deploy complete Discord server structures based on natural language descriptions.

## Tech Stack
- **Runtime:** Node.js 20
- **Package Manager:** npm
- **Bot Framework:** discord.js v14
- **AI Engine:** Groq AI (LLaMA/Mixtral models)
- **Web Server:** Express (OAuth2 verification + health checks)
- **Environment Management:** dotenv

## Project Structure
```
.
├── index.js          # Entry point: initializes bot, loads commands, handles events
├── ai-logic.js       # Groq AI integration: structure and prompt generation logic
├── builder.js        # Server builder: creates roles and channels in Discord
├── server.js         # Express web server: OAuth2 verification + health check
├── cmds/             # Slash command handlers
│   ├── deploy.js     # /deploy — AI-generated server from a prompt
│   ├── wizard.js     # /wizard — button-driven server builder
│   ├── prompt.js     # /prompt — AI prompt assistance
│   ├── wipe.js       # /wipe — owner-only full server wipe
│   └── ...           # other commands
├── data/             # Persistent data (owners, templates, allowed users)
└── package.json
```

## Required Secrets
- `DISCORD_TOKEN` — Discord bot token
- `CLIENT_ID` — Discord application/client ID
- `GROQ_API_KEY` — Groq API key for AI generation
- `OWNER_ID` — Your Discord user ID (bot is private; only this ID has full access)
- `CLIENT_SECRET` — Discord OAuth2 client secret (only needed for /verify command)

## Running the Bot
```bash
npm start
```

## Running on Railway
The Express server binds to `process.env.PORT` (with fallback to 3000) and listens on `0.0.0.0` so Railway's health checks reach it. Set all five secrets above as Railway environment variables.

## Slash Commands
- `/deploy` — Wipe and rebuild a server from an AI-generated structure
- `/wizard` — Button-driven server builder (no typing required)
- `/prompt` — Generate or refine AI prompts
- `/wipe` — Owner-only: collapse all channels and roles
- `/import` — Rebuild from a Stichachu Builder JSON export
- `/export` — Export current server structure to JSON
- `/verify` — OAuth2 member verification system
- `/howto` — Paginated command guide
