# 📋 Changelog

All notable changes to **AI Discord Server Maker** will be documented here.

This project follows [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] — 2025

### 🎉 Initial Release

#### Added

**🧠 AI Integration**
- Groq AI integration using LLaMA and Mixtral models
- Intelligent server structure generation from plain text descriptions
- Multi-model fallback — automatically retries with alternative models if one is unavailable
- Structured JSON output parsing for reliable server deployment

**🏗️ `/deploy` Command**
- Modal input for plain-text server description
- Full server wipe and rebuild (roles, categories, channels)
- Smart role creation with hierarchy, colors, and permissions
- Category creation with correct ordering
- Channel creation with permission overwrites per role
- Handles connection drops gracefully during rebuild

**💡 `/prompt` Command**
- Three modes via dropdown menu:
  - **Generate a prompt** — AI creates a complete server prompt from scratch
  - **Generate from an idea** — Expands rough ideas into full prompts
  - **Improve my prompt** — Refines and enhances existing prompts
- Modal input for idea and prompt improvement modes

**⚙️ Infrastructure**
- Auto-loading command handler from `cmds/` directory
- Slash command auto-registration on startup
- Modular architecture: `ai-logic.js`, `builder.js`, command files
- `.env.example` template for easy configuration

---

## Roadmap

- [ ] `/preview` command — show generated structure before deploying
- [ ] Partial deploy — deploy only roles, or only channels
- [ ] Built-in server templates (gaming, dev, community, crypto, etc.)
- [ ] Export server structure as JSON
- [ ] Support for additional AI providers (OpenAI, Anthropic, Ollama)
- [ ] Undo last deploy (restore previous structure)
- [ ] Sticker and emoji generation suggestions
- [ ] `/describe` command — AI describes an existing server's structure
