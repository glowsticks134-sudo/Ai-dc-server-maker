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

async function generateServerStructure(userRequest) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is missing from your .env file');
    }

    const prompt = `You are an expert Discord server architect. You must create a COMPLETE and PROFESSIONAL server.

Server description: "${userRequest}"

CRITICAL LANGUAGE RULE:
- ALWAYS write EVERYTHING in ENGLISH regardless of the input language
- Server name, category names, channel names, role names, and welcome message MUST ALL be in English
- Even if the user's description is in another language, translate and create everything in English

MANDATORY RULES:

1. EMOJIS:
   - Every category name MUST start with a relevant emoji (e.g. "📋 INFORMATION", "📋 INFORMATIONS")
   - Every channel name MUST start with a relevant emoji followed by a dash (e.g. "📜-rules", "📜-règles", "💬-general")

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
  "serverName": "Server name in detected language",
  "welcomeMessage": "Warm and detailed welcome message in detected language",
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
        { "name": "📜-rules", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "📣-announcements", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "🎭-roles", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "❓-faq", "type": "GUILD_TEXT", "readOnly": true }
      ]
    },
    {
      "name": "🚪 WELCOME",
      "staffOnly": false,
      "readOnly": false,
      "channels": [
        { "name": "👋-welcome", "type": "GUILD_TEXT", "readOnly": true },
        { "name": "📝-introductions", "type": "GUILD_TEXT", "readOnly": false },
        { "name": "✅-verification", "type": "GUILD_TEXT", "readOnly": false }
      ]
    },
    {
      "name": "⚙️ ADMINISTRATION",
      "staffOnly": true,
      "readOnly": false,
      "channels": [
        { "name": "📋-logs", "type": "GUILD_TEXT", "readOnly": false },
        { "name": "💬-staff-chat", "type": "GUILD_TEXT", "readOnly": false },
        { "name": "🚨-reports", "type": "GUILD_TEXT", "readOnly": false }
      ]
    }
  ]
}`;

    let lastError;

    for (const model of MODELS) {
        try {
            console.log(`🤖 Trying model: ${model}`);
            let text = await callGroq(model, prompt);
            text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const structure = JSON.parse(text);
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
