/**
 * ai-logic.js
 * Generates a Discord server structure via Groq (free, fast)
 *
 * Add to your .env:
 *   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
 * Get your free key at: https://console.groq.com
 */

const MODELS = [
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'mixtral-8x7b-32768'
];

async function callGroq(model, prompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 4000
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response');
    return text;
}

const PERSONALITY_PROMPTS = {
    toxic:        `PERSONALITY — TOXIC/EDGY: Use dark, aggressive, edgy naming throughout. Role names should feel intimidating (e.g. "💀 Demon Lord", "🩸 Blood Knight"). Channel names dark and edgy (e.g. "💀-death-pit", "😈-chaos-zone"). Welcome message should be sarcastic, menacing and darkly humorous. Prefer emojis: 💀 🩸 😈 🔥 ⛓️ 🖤 🗡️`,
    chill:        `PERSONALITY — CHILL/RELAXED: Use calm, laid-back, friendly vibes everywhere. Role names warm and inviting (e.g. "🌿 The Crew", "☁️ Cloud Surfer"). Channel names cozy (e.g. "🌿-chill-zone", "☕-coffee-chat"). Welcome message warm, casual and inviting. Prefer emojis: 🌿 ☁️ 🌸 ☕ 🌊 🍃 💚 🌙`,
    professional: `PERSONALITY — PROFESSIONAL/CORPORATE: Use formal, clean, business-appropriate naming. Role names like job titles (e.g. "💼 Executive", "📊 Analyst"). Channel names clean and minimal (e.g. "📋-announcements", "💬-general-discussion"). Welcome message formal and polished. Use minimal professional emojis: 💼 📊 📋 ✅ 🔷 📌`,
    aesthetic:    `PERSONALITY — AESTHETIC/DREAMY: Use elegant, poetic, artistic naming everywhere. Role names dreamy (e.g. "✨ Stardust", "🌸 Cherry Blossom"). Channel names soft and pretty (e.g. "✨-dream-space", "🌸-soft-corner"). Welcome message poetic and enchanting. Prefer emojis: ✨ 🌸 🌙 💫 🦋 🌺 💜 🌟`,
    void:         `PERSONALITY — GALAXY/VOID/COSMIC: Use cosmic, mysterious, space-themed naming. Role names otherworldly (e.g. "🌌 Void Walker", "⭐ Star Forger"). Channel names cosmic (e.g. "🌌-the-void", "⚡-nebula-chat"). Welcome message mysterious, cosmic and epic. Prefer emojis: 🌌 ⭐ 🪐 💫 ⚡ 🌠 🔮 🛸`
};

async function generateServerStructure(userRequest, separator = '-', personality = 'void') {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing from your .env file');
    }

    const personalityInstruction = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.void;

    const prompt = `You are an expert Discord server architect. You must create a COMPLETE and PROFESSIONAL server.

Server description: "${userRequest}"

${personalityInstruction}

CRITICAL LANGUAGE RULE:
- ALWAYS write EVERYTHING in ENGLISH regardless of the input language
- Server name, category names, channel names, role names, and welcome message MUST ALL be in English
- Even if the user's description is in another language, translate and create everything in English

MANDATORY RULES:

1. EMOJIS AND SEPARATORS:
   - Every category name MUST start with a relevant emoji, then a space, then the name in ALL CAPS (e.g. "📋 INFORMATION", "🚪 WELCOME")
   - Every channel name MUST start with a relevant emoji, then the separator character "${separator}", then the name in lowercase (e.g. "📜${separator}rules", "💬${separator}general", "📣${separator}announcements")
   - The separator between emoji and channel name is always: ${separator}

2. ROLE HIERARCHY (from highest to lowest, in this order):
   - 1 Owner role (Administrator)
   - 1-2 Admin roles (Administrator or ManageGuild + ManageChannels + ManageRoles)
   - 1-2 Moderator roles (KickMembers + BanMembers + ManageChannels)
   - 2-4 themed roles adapted to the server topic (basic permissions)
   - 1 basic Member role (SendMessages + ReadMessageHistory + ViewChannel)
   - 1 Unverified role (ViewChannel + ReadMessageHistory only)
   Total: 7 to 10 roles

3. CATEGORIES & CHANNELS (minimum 6 categories, 20+ channels total):
   ALWAYS include these types of categories, translated to the detected language:
   - An "Information" category with: rules, announcements, roles, faq, changelog
   - A "Welcome" category with: welcome, introductions, verification
   - An "Administration" category (staff only, staffOnly: true) with: logs, staff-chat, reports
   - A "General" discussion category with: general, off-topic, media, suggestions
   - 2-3 thematic categories specific to the server topic with relevant channels
   - A "Voice" category with multiple voice channels
   - A "Bots" category with: bot-commands, and music if relevant

4. PERMISSIONS FLAGS per category/channel:
   - staffOnly: true → invisible to regular members, staff only
   - readOnly: true → members can read but not write (for rules, announcements, logs, welcome)
   - Default (no flag) → fully public, everyone can read and write

Available permissions: Administrator, ManageGuild, ManageChannels, ManageRoles, KickMembers, BanMembers, SendMessages, ReadMessageHistory, ViewChannel

Respond ONLY with valid JSON, no backticks, no text before or after:
{
  "serverName": "Server name in English",
  "welcomeMessage": "Warm and detailed welcome message in English",
  "roles": [
    { "name": "👑 Owner", "color": "#F1C40F", "permissions": ["Administrator"], "position": 10 },
    { "name": "⚙️ Admin", "color": "#E74C3C", "permissions": ["Administrator"], "position": 9 },
    { "name": "🛡️ Moderator", "color": "#E67E22", "permissions": ["KickMembers", "BanMembers", "ManageChannels"], "position": 8 },
    { "name": "⭐ Member", "color": "#3498DB", "permissions": ["SendMessages", "ReadMessageHistory", "ViewChannel"], "position": 2 },
    { "name": "👤 Unverified", "color": "#95A5A6", "permissions": ["ViewChannel", "ReadMessageHistory"], "position": 1 }
  ],
  "categories": [
    {
      "name": "📋 INFORMATION",
      "staffOnly": false,
      "readOnly": true,
      "channels": [
        { "name": "📜${separator}rules", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "📣${separator}announcements", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "🎭${separator}roles", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "❓${separator}faq", "type": "GUILD_TEXT", "readOnly": true }
      ]
    },
    {
      "name": "🚪 WELCOME",
      "staffOnly": false,
      "readOnly": false,
      "channels": [
        { "name": "👋${separator}welcome", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "📝${separator}introductions", "type": "GUILD_TEXT", "readOnly": false },
        { "name": "✅${separator}verification", "type": "GUILD_TEXT", "readOnly": false }
      ]
    },
    {
      "name": "⚙️ ADMINISTRATION",
      "staffOnly": true,
      "readOnly": false,
      "channels": [
        { "name": "📋${separator}logs", "type": "GUILD_TEXT", "readOnly": false },
        { "name": "💬${separator}staff-chat", "type": "GUILD_TEXT", "readOnly": false },
        { "name": "🚨${separator}reports", "type": "GUILD_TEXT", "readOnly": false }
      ]
    }
  ]
}`;

    let lastError;

    for (const model of MODELS) {
        try {
            console.log(`🤖 Trying model: ${model}`);
            let text = await callGroq(model, prompt);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON object found in response');
            const structure = JSON.parse(jsonMatch[0]);
            console.log(`✅ Success with: ${model}`);
            return structure;
        } catch (err) {
            console.warn(`⚠️ "${model}" unavailable: ${err.message}`);
            lastError = err;
        }
    }

    throw new Error(`All Groq models are unavailable. Last error: ${lastError.message}`);
}


// ── generatePrompt ────────────────────────────────────────────────────────────
async function generatePrompt(mode, params) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing from your .env file');
    }

    let systemInstruction = '';
    let userInstruction = '';

    if (mode === 'generate') {
        const { useCase, tone, language } = params;
        systemInstruction = `You are an expert prompt engineer. Your job is to write a highly effective, detailed system prompt for an AI assistant.`;
        userInstruction = `Write a complete, professional system prompt for the following use case:

Use case: "${useCase}"
Tone/style: "${tone}"
Language of the prompt to generate: "${language}"

Rules:
- The prompt must be written in ${language}
- It must be detailed, structured, and production-ready
- Include clear instructions, constraints, examples if relevant, and an output format section
- Do NOT add any explanation outside the prompt itself — output ONLY the raw prompt text`;
    }

    if (mode === 'idea') {
        const { idea, context, language } = params;
        systemInstruction = `You are an expert prompt engineer. Your job is to turn rough ideas into polished, professional AI system prompts.`;
        userInstruction = `Turn this rough idea into a complete, professional system prompt:

Idea: "${idea}"
Additional context: "${context || 'None'}"
Language of the prompt to generate: "${language}"

Rules:
- The prompt must be written in ${language}
- Expand the idea into a thorough, structured system prompt
- Include role definition, behavior rules, constraints, output format
- Do NOT add any explanation — output ONLY the raw prompt text`;
    }

    if (mode === 'improve') {
        const { originalPrompt, issues } = params;
        systemInstruction = `You are an expert prompt engineer specializing in rewriting and optimizing existing prompts.`;
        userInstruction = `Improve the following prompt and make it more effective, clear and complete:

Original prompt:
"""
${originalPrompt}
"""

Issues to fix: "${issues || 'General improvement — clarity, structure, completeness'}"

Rules:
- Keep the same language as the original prompt
- Fix all identified issues and general weaknesses
- Add missing context, constraints, format instructions
- Do NOT add any explanation — output ONLY the improved prompt text`;
    }

    const prompt = `${systemInstruction}\n\n${userInstruction}`;
    let lastError;

    for (const model of MODELS) {
        try {
            console.log(`🤖 Trying model: ${model}`);
            const text = await callGroq(model, prompt);
            console.log(`✅ Success with: ${model}`);

            const headers = {
                generate: '✨ **Generated Prompt** — ready to use:',
                idea: '💡 **Prompt from your idea** — ready to use:',
                improve: '🔧 **Improved Prompt** — ready to use:'
            };

            return { header: headers[mode], prompt: text.trim() };
        } catch (err) {
            console.warn(`⚠️ "${model}" unavailable: ${err.message}`);
            lastError = err;
        }
    }

    throw new Error(`All Groq models are unavailable. Last error: ${lastError.message}`);
}

module.exports = { generateServerStructure, generatePrompt };
