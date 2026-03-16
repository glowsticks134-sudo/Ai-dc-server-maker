# 🤝 Contributing to AI Discord Server Maker

Thanks for your interest in contributing! Whether it's a new feature, bug fix, better AI prompts, or docs — all contributions help.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Adding a New Command](#adding-a-new-command)
- [Pull Request Process](#pull-request-process)
- [Commit Message Convention](#commit-message-convention)
- [Style Guidelines](#style-guidelines)

---

## 📜 Code of Conduct

Be respectful and constructive. Keep discussions focused on the project. Harassment won't be tolerated.

---

## 💡 How Can I Contribute?

### 🐛 Reporting Bugs

Before reporting:
- Check [existing issues](../../issues) for duplicates
- Confirm your `.env` is correctly filled in
- Try with a fresh bot token and Groq key

When reporting, include:
- Which command triggered the issue (`/deploy` or `/prompt`)
- The prompt/description you used (if applicable)
- Full console error output
- Node.js version (`node --version`)

Use the [Bug Report template](../../issues/new?template=bug_report.md).

### ✨ Suggesting Features

Good ideas for this project:
- New `/prompt` dropdown options (e.g. generate from a theme)
- Server templates for specific use cases (gaming, dev, community, etc.)
- Ability to preview the generated structure before deploying
- Partial deploy (only channels, or only roles)
- Export server structure as JSON
- Support for additional AI providers

Use the [Feature Request template](../../issues/new?template=feature_request.md).

---

## 🛠️ Development Setup

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Ai-dc-server-maker.git
cd Ai-dc-server-maker

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your DISCORD_TOKEN, CLIENT_ID, GROQ_API_KEY

# Start the bot
npm start
```

> ⚠️ **Always test on a dedicated test server.** The `/deploy` command deletes all existing channels and roles.

---

## ➕ Adding a New Command

1. Create a new file in the `cmds/` folder: `cmds/yourcommand.js`
2. Follow this structure:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('What this command does'),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    // Your logic here
    await interaction.editReply({ content: 'Done!' });
  },
};
```

3. The command loader in `index.js` auto-picks up all files in `cmds/` — no manual registration needed
4. Restart the bot to register the new slash command
5. Test thoroughly on a test server before submitting

---

## 🔄 Pull Request Process

1. **Fork** the repo and create your branch from `main`

   ```bash
   git checkout -b feature/your-feature
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** — keep them focused

3. **Test** — run `/deploy` and `/prompt` end-to-end on a test server

4. **Commit** following the [convention below](#commit-message-convention)

5. **Push** and open a PR against `main`

### PR Checklist

- [ ] Tested on a live Discord test server
- [ ] `/deploy` and `/prompt` still work correctly
- [ ] No unhandled promise rejections or console errors
- [ ] Code follows existing style
- [ ] `.env.example` updated if new variables were added
- [ ] README updated if new commands or features were added
- [ ] Branch is up to date with `main`

---

## 📝 Commit Message Convention

```
<type>: <short description>
```

| Type | When to use |
|---|---|
| `feat` | New command or feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure |
| `perf` | Performance improvement |
| `ai` | Changes to AI prompts or model logic |
| `chore` | Deps, config, tooling |

**Examples:**
```
feat: add /templates command with preset server types
fix: handle Groq rate limit gracefully in ai-logic.js
ai: improve system prompt for more structured role generation
docs: add troubleshooting section to README
```

---

## 🎨 Style Guidelines

### JavaScript
- Use `const` / `let` — no `var`
- `async/await` over raw `.then()` chains
- Always `deferReply` on commands that make API calls (they can take time)
- Wrap all AI calls and Discord API calls in `try/catch`
- Keep AI prompt logic in `ai-logic.js` — don't put it in command files

### AI Prompts (ai-logic.js)
- Keep system prompts clear and structured — the AI must return valid JSON
- Always include a JSON schema example in the system prompt
- Test prompt changes with multiple different user inputs before submitting

---

## 🙏 Thank You

Every contribution helps make this bot faster, smarter, and more useful for every Discord community.

— **Bruce** (`shadowsprint001`) / ShadowByte01
