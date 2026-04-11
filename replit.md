# AI Discord Server Maker

## Overview
A Discord bot that uses AI (Groq API) to automatically generate and deploy complete Discord server structures based on natural language descriptions.

## Tech Stack
- **Runtime:** Node.js 20
- **Package Manager:** npm
- **Bot Framework:** discord.js v14
- **AI Engine:** Groq AI (LLaMA/Mixtral models)
- **Environment Management:** dotenv

## Project Structure
```
.
├── index.js          # Entry point: initializes bot, loads commands, handles events
├── ai-logic.js       # Groq AI integration: structure and prompt generation logic
├── builder.js        # Server builder: creates roles and channels in Discord
├── cmds/             # Slash command handlers
│   ├── deploy.js     # /deploy command (server generation)
│   └── prompt.js     # /prompt command (AI prompt assistance)
├── package.json
└── README.md
```

## Required Secrets
- `DISCORD_TOKEN` - Discord bot token
- `CLIENT_ID` - Discord application/client ID
- `GROQ_API_KEY` - Groq API key for AI generation

## Running the Bot
```bash
npm start
```

## Workflow
- **Start application** - Console workflow running `npm start`

## Slash Commands
- `/deploy` - Wipes existing channels/roles and rebuilds based on AI-generated structure
- `/prompt` - Helps refine ideas into better prompts for AI server generation
