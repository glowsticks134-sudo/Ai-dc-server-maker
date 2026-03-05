# 🤖 ServerCreator Bot

An AI-powered Discord bot that automatically generates and deploys complete Discord server structures — including roles, categories, channels, permissions, and a welcome message — all from a simple text description.

---

## ✨ Features

- **AI-Generated Server Structures** — Describe your ideal server and the bot builds it using Groq AI (LLaMA / Mixtral models).
- **Full Server Deployment** — Automatically creates roles (with hierarchy & colors), categories, channels, and permission overwrites.
- **Prompt Generator** — Generate, refine, or improve AI prompts directly within Discord.
- **Slash Commands** — Clean, modern Discord slash command interface.
- **Multi-Model Fallback** — Automatically retries with alternative AI models if one is unavailable.

---

## 📋 Prerequisites

- **Node.js** v16.9.0 or higher
- **A Discord Bot** with a token and application (client) ID
- **A Groq API Key** (free) — Get one at [https://console.groq.com](https://console.groq.com)

---

## 🚀 How to Use

### Step 1: Clone or Download the Project

Download or clone this project to your local machine.

### Step 2: Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install `discord.js` and `dotenv`.

### Step 3: Configure Environment Variables

A `.env.example` file is included in the project as a template. Copy it to create your `.env` file:

```bash
cp .env.example .env
```

Then open the `.env` file and fill in the values:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GROQ_API_KEY=your_groq_api_key
```

**How to get each value:**

- **DISCORD_TOKEN** — Go to the [Discord Developer Portal](https://discord.com/developers/applications) → select your application → **Bot** tab → click **Reset Token** and copy it.
- **CLIENT_ID** — In the same portal → select your application → **General Information** tab → copy the **Application ID**.
- **GROQ_API_KEY** — Sign up at [console.groq.com](https://console.groq.com) → go to **API Keys** → create a new key and copy it.

### Step 4: Invite the Bot to Your Server

Generate an invite link from the Discord Developer Portal with the following permissions:
- **Administrator** (recommended for full server creation capabilities)
- Scopes: `bot`, `applications.commands`

Use the invite link to add the bot to your Discord server.

### Step 5: Start the Bot

```bash
npm start
```

or

```bash
node index.js
```

You should see output like:
```
📦 Loaded command: /deploy
📦 Loaded command: /prompt
✅ Bot connected: YourBot#1234
🚀 All commands registered successfully!
```

### Step 6: Use the Bot Commands

#### `/deploy` — Generate & Deploy a Server
1. Type `/deploy` in any channel.
2. A modal will appear — describe the server you want (e.g., *"A gaming community with competitive ranks, tournament channels, and voice lobbies"*).
3. The AI generates the full structure and **rebuilds the server** automatically.

> ⚠️ **Warning:** This command **deletes all existing channels and roles** before rebuilding. Use it on a fresh or test server.

#### `/prompt` — AI Prompt Generator
1. Type `/prompt` in any channel.
2. Choose from the dropdown menu:
   - **✨ Generate a prompt** — AI creates a ready-to-use prompt automatically.
   - **💡 Generate from an idea** — Describe a rough idea, and AI expands it into a full prompt.
   - **🔧 Improve my prompt** — Paste an existing prompt, and AI enhances it.

---

## 📁 Project Structure

```
servercreator_update_3/
├── index.js          # Bot entry point, command loader, event handler
├── ai-logic.js       # Groq AI integration (server structure + prompt generation)
├── builder.js        # Server builder (cleans & rebuilds guild with roles/channels)
├── cmds/
│   ├── deploy.js     # /deploy command handler
│   └── prompt.js     # /prompt command handler
├── .env              # Environment variables (tokens & API keys)
├── package.json      # Node.js project config & dependencies
└── README.md         # This file
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|---|---|
| `❌ Missing variables in .env` | Make sure `DISCORD_TOKEN`, `CLIENT_ID`, and `GROQ_API_KEY` are all set in your `.env` file. |
| `GROQ_API_KEY is missing` | Add your Groq API key to the `.env` file. Get one free at [console.groq.com](https://console.groq.com). |
| Bot doesn't respond to commands | Ensure the bot has **Administrator** permissions and the slash commands have been registered (restart the bot). |
| `All Groq models are unavailable` | Groq may be experiencing downtime. Try again in a few minutes. |
| Lost connection during deploy | This is expected — the bot deletes and recreates all channels. Rejoin via the server invite. |

---

## 💬 Support Server

Need help or have questions? Join our Discord support server:

👉 [https://discord.gg/KJGKmk2cR7](https://discord.gg/KJGKmk2cR7)

---

## 📝 Credits

Built by author, shadow.dev
