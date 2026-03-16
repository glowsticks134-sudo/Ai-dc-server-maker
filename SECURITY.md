# 🔒 Security Policy

## ⚠️ Protect Your Credentials

This bot uses a **Discord Bot Token** and a **Groq API Key**. Both grant significant access — treat them like passwords.

---

## 📦 Supported Versions

| Version | Supported |
|---|---|
| `1.x` (latest) | ✅ Yes |

---

## 🐛 Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Contact the maintainer directly:

- **Discord:** `shadowsprint001`
- **Support Server:** [discord.gg/KJGKmk2cR7](https://discord.gg/KJGKmk2cR7)
- **GitHub:** Open a private [Security Advisory](../../security/advisories/new)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

Expected response within **48 hours**. Patch target within **7 days** of a confirmed report.

---

## 🛡️ Security Best Practices

### Discord Bot Token
1. **Never commit `.env`** — it's already in `.gitignore`
2. **Rotate immediately** if you suspect exposure — go to the [Developer Portal](https://discord.com/developers/applications) → Bot → Reset Token
3. **Use a dedicated bot** — don't reuse tokens across projects
4. **Limit permissions** where possible — Administrator is needed for `/deploy`, but consider a separate limited bot for read-only tasks

### Groq API Key
1. **Never hardcode** the key in source files
2. **Rotate the key** in [console.groq.com](https://console.groq.com) if exposed
3. **Monitor usage** in the Groq dashboard for unexpected spikes

### The `/deploy` Command
1. **Test server only** — `/deploy` deletes all channels and roles. Never run on a live production server without a backup plan
2. **Restrict the command** — consider adding a permission check so only administrators can use it
3. **Keep a server backup** — note your current structure before deploying

---

## 🔐 How Credentials Are Handled

- All secrets live in `.env` which is `.gitignore`d
- Tokens and keys are only used server-side in Node.js
- No credentials are logged anywhere in the codebase
- Outbound requests go only to `discord.com`, `discord.js`, and `api.groq.com`

---

## 🚨 What NOT to Do

- ❌ Don't commit `.env` to any repository (public or private)
- ❌ Don't share your bot token or Groq key in screenshots or streams
- ❌ Don't run `/deploy` on a live server without understanding it wipes everything
- ❌ Don't expose the bot's HTTP port to the internet
