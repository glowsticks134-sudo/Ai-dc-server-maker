/**
 * server.js
 * Express web server handling Discord OAuth2 verification flow.
 * Runs alongside the Discord bot in the same process.
 */

const express = require('express');
const https   = require('https');
const { consumeState } = require('./data/verifyStore');

const VOID_COLOR  = '#6B48FF';
const VERIFIED_ROLE_NAME = 'Verified';

const SCOPES      = 'identify';
const REDIRECT_URI = () => `https://${process.env.REPLIT_DEV_DOMAIN}/verify/callback`;

// ── HTML helpers ──────────────────────────────────────────────────────────────

function page(title, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} · Stichachu Builder</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;
       background:#0d0d14;font-family:'Segoe UI',system-ui,sans-serif;color:#e0e0f0}
  .card{background:#13131f;border:1px solid #2a2a40;border-radius:16px;
        padding:40px 48px;max-width:480px;width:90%;text-align:center;
        box-shadow:0 8px 40px rgba(107,72,255,.18)}
  .icon{font-size:56px;margin-bottom:16px}
  h1{font-size:1.6rem;font-weight:700;margin-bottom:10px;color:#fff}
  p{color:#9898b8;line-height:1.6;font-size:.97rem}
  .tag{display:inline-block;margin-top:20px;padding:6px 16px;
       border-radius:999px;font-size:.82rem;font-weight:600;letter-spacing:.04em}
  .tag-ok{background:rgba(107,72,255,.18);color:${VOID_COLOR}}
  .tag-err{background:rgba(255,72,72,.12);color:#ff6b6b}
  footer{margin-top:28px;font-size:.75rem;color:#4a4a6a}
</style>
</head>
<body>
<div class="card">${body}<footer>Stichachu Builder · OAuth2 Verification</footer></div>
</body>
</html>`;
}

const successPage = page('Verified', `
  <div class="icon">✅</div>
  <h1>You're Verified!</h1>
  <p>Your Discord account has been confirmed and the <strong>Verified</strong> role has been granted. You can close this tab and return to the server.</p>
  <span class="tag tag-ok">ACCESS GRANTED</span>
`);

const alreadyPage = page('Already Verified', `
  <div class="icon">🔐</div>
  <h1>Already Verified</h1>
  <p>You already have the <strong>Verified</strong> role in this server. No action needed!</p>
  <span class="tag tag-ok">ACCESS GRANTED</span>
`);

function errorPage(msg) {
    return page('Verification Failed', `
  <div class="icon">❌</div>
  <h1>Verification Failed</h1>
  <p>${msg}</p>
  <span class="tag tag-err">ACCESS DENIED</span>
`);
}

// ── OAuth2 helpers ────────────────────────────────────────────────────────────

function exchangeCode(code) {
    return new Promise((resolve, reject) => {
        const body = new URLSearchParams({
            client_id:     process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type:    'authorization_code',
            code,
            redirect_uri:  REDIRECT_URI()
        }).toString();

        const req = https.request({
            hostname: 'discord.com',
            path:     '/api/v10/oauth2/token',
            method:   'POST',
            headers: {
                'Content-Type':   'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('Invalid JSON from token endpoint')); }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getDiscordUser(accessToken) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'discord.com',
            path:     '/api/v10/users/@me',
            method:   'GET',
            headers:  { Authorization: `Bearer ${accessToken}` }
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('Invalid JSON from user endpoint')); }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// ── Routes ────────────────────────────────────────────────────────────────────

function createServer(client) {
    const app = express();

    // Step 1 – redirect to Discord OAuth2 consent screen
    app.get('/verify/start', (req, res) => {
        const { state } = req.query;
        if (!state) return res.status(400).send(errorPage('Missing state parameter. Please use the button in Discord.'));

        const params = new URLSearchParams({
            client_id:     process.env.CLIENT_ID,
            redirect_uri:  REDIRECT_URI(),
            response_type: 'code',
            scope:         SCOPES,
            state
        });

        res.redirect(`https://discord.com/oauth2/authorize?${params}`);
    });

    // Step 2 – Discord redirects back here with a code
    app.get('/verify/callback', async (req, res) => {
        const { code, state, error } = req.query;

        if (error) {
            return res.send(errorPage('You cancelled the authorisation. Please try again from Discord.'));
        }

        if (!code || !state) {
            return res.status(400).send(errorPage('Missing code or state. Please try again from Discord.'));
        }

        // Validate state token
        const entry = consumeState(state);
        if (!entry) {
            return res.status(400).send(errorPage('This link has expired or already been used. Please request a new one with <code>/verify me</code>.'));
        }

        try {
            // Exchange code for access token
            const tokenData = await exchangeCode(code);
            if (!tokenData.access_token) {
                return res.status(500).send(errorPage('Could not exchange authorisation code. Please try again.'));
            }

            // Fetch the Discord user to confirm identity
            const discordUser = await getDiscordUser(tokenData.access_token);
            if (!discordUser.id) {
                return res.status(500).send(errorPage('Could not fetch your Discord profile. Please try again.'));
            }

            // Confirm the user who clicked matches who initiated the flow
            if (discordUser.id !== entry.userId) {
                return res.status(403).send(errorPage('Account mismatch — the Discord account you authorised with does not match the one that ran the command.'));
            }

            // Find the guild and assign the Verified role
            const guild = client.guilds.cache.get(entry.guildId);
            if (!guild) {
                return res.status(500).send(errorPage('Bot is no longer in that server.'));
            }

            const member = await guild.members.fetch(entry.userId).catch(() => null);
            if (!member) {
                return res.status(400).send(errorPage('You don\'t appear to be a member of that server.'));
            }

            let role = guild.roles.cache.find(r => r.name === VERIFIED_ROLE_NAME);
            if (!role) {
                role = await guild.roles.create({
                    name:   VERIFIED_ROLE_NAME,
                    color:  0x6B48FF,
                    reason: 'Stichachu Builder – auto-created for verification'
                });
            }

            if (member.roles.cache.has(role.id)) {
                return res.send(alreadyPage);
            }

            await member.roles.add(role, 'Stichachu Builder – OAuth2 verified');
            return res.send(successPage);

        } catch (err) {
            console.error('❌ Verification error:', err.message);
            return res.status(500).send(errorPage('An unexpected error occurred. Please try again.'));
        }
    });

    // Health checks — Railway pings / and /verify/health
    app.get('/', (_, res) => res.json({ ok: true, bot: 'Stichachu Builder' }));
    app.get('/verify/health', (_, res) => res.json({ ok: true }));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Verification server running on port ${PORT}`);
    });

    return app;
}

module.exports = { createServer };
