<div align="center">

```
 █████╗ ██╗    ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗
██╔══██╗██║    ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
███████║██║    ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
██╔══██║██║    ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
██║  ██║██║    ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
╚═╝  ╚═╝╚═╝    ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝
              M A K E R   🤖  ✨
```

# 🤖 AI Discord Server Maker

**Describe your ideal Discord server. The AI builds it — instantly.**

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org)
[![Groq AI](https://img.shields.io/badge/Groq_AI-LLaMA%2FMixtral-f55036?style=for-the-badge&logo=groq&logoColor=white)](https://console.groq.com)
[![Node.js](https://img.shields.io/badge/Node.js-16.9%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-7c6af7?style=for-the-badge)](LICENSE)
[![Made by Bruce](https://img.shields.io/badge/Made_by-Bruce_(shadowsprint001)-f76af0?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/shadowsprint001)

<br/>

> ⚡ An intelligent Discord bot powered by **Groq AI (LLaMA / Mixtral)** that generates and deploys a complete server structure — roles with hierarchy & colors, categories, channels, and permission overwrites — all from a single text description.

<br/>

[![Support Server](https://img.shields.io/badge/💬_Support_Server-Join_Now-5865F2?style=for-the-badge)](https://discord.gg/KJGKmk2cR7)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI-Generated Structures** | Describe your server in plain English — Groq AI designs the full layout |
| 🏗️ **Full Server Deployment** | Creates roles (with hierarchy & colors), categories, channels, and permission overwrites automatically |
| 💡 **Prompt Generator** | Generate, refine, or improve AI prompts directly inside Discord |
| 🔄 **Multi-Model Fallback** | Automatically retries with alternative Groq models if one is unavailable |
| ⚡ **Slash Commands** | Clean, modern `/deploy` and `/prompt` slash command interface |
| 🎨 **Smart Role Colors** | AI assigns contextually appropriate colors to each role |
| 🔒 **Permission Overwrites** | Auto-configures channel permissions per role |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) **v16.9.0 or higher**
- A Discord Bot Token from the [Developer Portal](https://discord.com/developers/applications)
- A **Groq API Key** (free) — get one at [console.groq.com](https://console.groq.com)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ShadowByte01/Ai-dc-server-maker.git
cd Ai-dc-server-maker

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Open .env and fill in your values

# 4. Start the bot
npm start
```

You should see:
```
📦 Loaded command: /deploy
📦 Loaded command: /prompt
✅ Bot connected: YourBot#1234
🚀 All commands registered successfully!
```

---

## ⚙️ Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `DISCORD_TOKEN` | Your Discord bot token | [Developer Portal](https://discord.com/developers/applications) → Bot → Reset Token |
| `CLIENT_ID` | Your bot's application ID | Developer Portal → General Information → Application ID |
| `GROQ_API_KEY` | Your Groq AI API key | [console.groq.com](https://console.groq.com) → API Keys → Create Key |

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GROQ_API_KEY=your_groq_api_key
```

---

## 🤖 Bot Permissions

When inviting the bot, use these scopes and permissions:

- **Scopes:** `bot`, `applications.commands`
- **Permissions:** `Administrator` *(required for full server creation)*

> Administrator is needed so the bot can create/delete roles, channels, and categories during deployment.

---

## 📖 Commands

### `/deploy` — Generate & Deploy a Server

1. Type `/deploy` in any channel
2. A modal appears — describe your ideal server in plain text
3. The AI generates the full structure and **rebuilds the server automatically**

**Example prompts:**
```
A gaming community with competitive ranks, tournament channels, and voice lobbies
A developer hub with language-specific channels, project showcases, and code review rooms
A crypto trading server with market channels, signal alerts, and VIP tiers
```

> ⚠️ **Important:** `/deploy` **deletes all existing channels and roles** before rebuilding. Always use this on a **fresh or test server** first. You may lose connection briefly — this is expected, just rejoin via invite.

---

### `/prompt` — AI Prompt Generator

Type `/prompt` and choose from the dropdown:

| Option | What it does |
|---|---|
| ✨ **Generate a prompt** | AI creates a complete, ready-to-use server prompt from scratch |
| 💡 **Generate from an idea** | Describe a rough idea — AI expands it into a detailed prompt |
| 🔧 **Improve my prompt** | Paste an existing prompt — AI enhances and refines it |

Use `/prompt` to craft the perfect description before running `/deploy`.

---

## 📁 Project Structure

```
Ai-dc-server-maker/
├── index.js          ← Bot entry point, command loader, event handler
├── ai-logic.js       ← Groq AI integration (structure gen + prompt gen)
├── builder.js        ← Server builder (clean rebuild with roles/channels)
├── cmds/
│   ├── deploy.js     ← /deploy command handler
│   └── prompt.js     ← /prompt command handler
├── .env.example      ← Environment variable template
├── package.json      ← Dependencies and scripts
└── README.md
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| `❌ Missing variables in .env` | Ensure `DISCORD_TOKEN`, `CLIENT_ID`, and `GROQ_API_KEY` are all set |
| `GROQ_API_KEY is missing` | Add your key from [console.groq.com](https://console.groq.com) |
| Bot doesn't respond to commands | Confirm the bot has Administrator permissions and restart it to re-register slash commands |
| `All Groq models are unavailable` | Groq may have brief downtime — wait a few minutes and retry |
| Lost connection during `/deploy` | Expected behavior — the bot deletes and recreates all channels. Rejoin via server invite |

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 💬 Support

Need help? Join the support server:

[![Support Server](https://img.shields.io/badge/Discord-Join_Support_Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/KJGKmk2cR7)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

<div align="center">

**Bruce** — `shadowsprint001` on Discord

*Built with ❤️ by [ShadowByte01](https://github.com/ShadowByte01) / Shadow.dev*

[![Discord](https://img.shields.io/badge/Discord-shadowsprint001-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/shadowsprint001)
[![GitHub](https://img.shields.io/badge/GitHub-ShadowByte01-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ShadowByte01)

</div>

---

<div align="center">

⭐ **If this saved you hours of server setup, drop a star!** ⭐

</div>
