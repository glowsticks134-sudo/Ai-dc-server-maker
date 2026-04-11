const TEMPLATES = {
    gaming: {
        label: 'Gaming Community',
        emoji: '🎮',
        description: 'Competitive ranks, game channels & voice lobbies',
        structure: {
            serverName: '🎮 Gaming Community',
            welcomeMessage: 'Welcome to the Gaming Community! Whether you\'re here to compete, chill, or find teammates — you\'re in the right place. Check out the rules, grab your roles, and jump into the action!',
            roles: [
                { name: '👑 Owner', color: '#F1C40F', permissions: ['Administrator'], position: 10 },
                { name: '⚙️ Admin', color: '#E74C3C', permissions: ['Administrator'], position: 9 },
                { name: '🛡️ Moderator', color: '#E67E22', permissions: ['KickMembers', 'BanMembers', 'ManageChannels'], position: 8 },
                { name: '🏆 Champion', color: '#9B59B6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 5 },
                { name: '⚔️ Veteran', color: '#3498DB', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 4 },
                { name: '🎮 Gamer', color: '#2ECC71', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 3 },
                { name: '🌱 Newcomer', color: '#95A5A6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 2 },
                { name: '👤 Unverified', color: '#7F8C8D', permissions: ['ViewChannel', 'ReadMessageHistory'], position: 1 }
            ],
            categories: [
                {
                    name: '📋 INFORMATION',
                    staffOnly: false, readOnly: true,
                    channels: [
                        { name: '📜-rules', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📣-announcements', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🎭-roles', type: 'GUILD_TEXT', readOnly: true },
                        { name: '❓-faq', type: 'GUILD_TEXT', readOnly: true }
                    ]
                },
                {
                    name: '🚪 WELCOME',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '👋-welcome', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📝-introductions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '✅-verification', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💬 GENERAL',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬-general', type: 'GUILD_TEXT', readOnly: false },
                        { name: '😂-memes', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🖼️-media', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💡-suggestions', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🎮 GAMING',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🏆-leaderboard', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🤝-looking-for-group', type: 'GUILD_TEXT', readOnly: false },
                        { name: '📊-stats', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🎯-clips', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🔊 VOICE',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🎮 General Gaming', type: 'GUILD_VOICE' },
                        { name: '🏆 Competitive', type: 'GUILD_VOICE' },
                        { name: '🎉 Party', type: 'GUILD_VOICE' },
                        { name: '🎵 Music', type: 'GUILD_VOICE' }
                    ]
                },
                {
                    name: '🤖 BOTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🤖-bot-commands', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🎵-music', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '⚙️ ADMINISTRATION',
                    staffOnly: true, readOnly: false,
                    channels: [
                        { name: '📋-logs', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💬-staff-chat', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-reports', type: 'GUILD_TEXT', readOnly: false }
                    ]
                }
            ]
        }
    },

    developer: {
        label: 'Developer Hub',
        emoji: '💻',
        description: 'Language channels, code reviews & project showcases',
        structure: {
            serverName: '💻 Developer Hub',
            welcomeMessage: 'Welcome to the Developer Hub! A place for coders of all levels to share, learn, and build together. Read the rules, introduce yourself, and don\'t hesitate to ask questions — we\'re all here to grow.',
            roles: [
                { name: '👑 Owner', color: '#F1C40F', permissions: ['Administrator'], position: 10 },
                { name: '⚙️ Admin', color: '#E74C3C', permissions: ['Administrator'], position: 9 },
                { name: '🛡️ Moderator', color: '#E67E22', permissions: ['KickMembers', 'BanMembers', 'ManageChannels'], position: 8 },
                { name: '🚀 Senior Dev', color: '#8E44AD', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 5 },
                { name: '💡 Developer', color: '#2980B9', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 4 },
                { name: '🌱 Junior Dev', color: '#27AE60', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 3 },
                { name: '👤 Member', color: '#95A5A6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 2 },
                { name: '🔒 Unverified', color: '#7F8C8D', permissions: ['ViewChannel', 'ReadMessageHistory'], position: 1 }
            ],
            categories: [
                {
                    name: '📋 INFORMATION',
                    staffOnly: false, readOnly: true,
                    channels: [
                        { name: '📜-rules', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📣-announcements', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🗺️-server-guide', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🎭-roles', type: 'GUILD_TEXT', readOnly: true }
                    ]
                },
                {
                    name: '🚪 WELCOME',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '👋-welcome', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📝-introductions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '✅-verification', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💬 GENERAL',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬-general', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🔗-resources', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💼-jobs-and-hiring', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💡-suggestions', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💻 CODING',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🆘-help-and-questions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🔍-code-review', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚀-project-showcase', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🐛-debugging', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🌐 LANGUAGES',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🐍-python', type: 'GUILD_TEXT', readOnly: false },
                        { name: '☕-javascript', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🦀-rust-and-go', type: 'GUILD_TEXT', readOnly: false },
                        { name: '☕-java-and-kotlin', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🔧-other-languages', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🔊 VOICE',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬 General', type: 'GUILD_VOICE' },
                        { name: '🤝 Pair Programming', type: 'GUILD_VOICE' },
                        { name: '📚 Study Room', type: 'GUILD_VOICE' }
                    ]
                },
                {
                    name: '🤖 BOTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🤖-bot-commands', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '⚙️ ADMINISTRATION',
                    staffOnly: true, readOnly: false,
                    channels: [
                        { name: '📋-logs', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💬-staff-chat', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-reports', type: 'GUILD_TEXT', readOnly: false }
                    ]
                }
            ]
        }
    },

    community: {
        label: 'General Community',
        emoji: '🌍',
        description: 'All-purpose community server with social channels',
        structure: {
            serverName: '🌍 Community Server',
            welcomeMessage: 'Welcome to the Community! We\'re thrilled to have you here. Make sure to read the rules, grab some roles, and introduce yourself. This is a friendly space for everyone — enjoy your stay!',
            roles: [
                { name: '👑 Owner', color: '#F1C40F', permissions: ['Administrator'], position: 10 },
                { name: '⚙️ Admin', color: '#E74C3C', permissions: ['Administrator'], position: 9 },
                { name: '🛡️ Moderator', color: '#E67E22', permissions: ['KickMembers', 'BanMembers', 'ManageChannels'], position: 8 },
                { name: '⭐ Veteran', color: '#9B59B6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 5 },
                { name: '🌟 Regular', color: '#3498DB', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 4 },
                { name: '🌱 Member', color: '#2ECC71', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 3 },
                { name: '👤 Newcomer', color: '#95A5A6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 2 },
                { name: '🔒 Unverified', color: '#7F8C8D', permissions: ['ViewChannel', 'ReadMessageHistory'], position: 1 }
            ],
            categories: [
                {
                    name: '📋 INFORMATION',
                    staffOnly: false, readOnly: true,
                    channels: [
                        { name: '📜-rules', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📣-announcements', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🎭-roles', type: 'GUILD_TEXT', readOnly: true },
                        { name: '❓-faq', type: 'GUILD_TEXT', readOnly: true }
                    ]
                },
                {
                    name: '🚪 WELCOME',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '👋-welcome', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📝-introductions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '✅-verification', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💬 GENERAL',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬-general', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🌙-off-topic', type: 'GUILD_TEXT', readOnly: false },
                        { name: '😂-memes', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🖼️-media', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💡-suggestions', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🎉 SOCIAL',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🎂-birthdays', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🌟-achievements', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🎁-giveaways', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🗳️-polls', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🔊 VOICE',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬 General', type: 'GUILD_VOICE' },
                        { name: '🎵 Music', type: 'GUILD_VOICE' },
                        { name: '🎮 Gaming', type: 'GUILD_VOICE' },
                        { name: '📚 Chill', type: 'GUILD_VOICE' }
                    ]
                },
                {
                    name: '🤖 BOTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🤖-bot-commands', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🎵-music', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '⚙️ ADMINISTRATION',
                    staffOnly: true, readOnly: false,
                    channels: [
                        { name: '📋-logs', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💬-staff-chat', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-reports', type: 'GUILD_TEXT', readOnly: false }
                    ]
                }
            ]
        }
    },

    study: {
        label: 'Study Group',
        emoji: '📚',
        description: 'Subject channels, study rooms & resource sharing',
        structure: {
            serverName: '📚 Study Group',
            welcomeMessage: 'Welcome to the Study Group! This is your calm corner for learning, sharing resources, and helping each other out. Introduce yourself, find your subjects, and let\'s grow together!',
            roles: [
                { name: '👑 Owner', color: '#F1C40F', permissions: ['Administrator'], position: 10 },
                { name: '⚙️ Admin', color: '#E74C3C', permissions: ['Administrator'], position: 9 },
                { name: '🛡️ Moderator', color: '#E67E22', permissions: ['KickMembers', 'BanMembers', 'ManageChannels'], position: 8 },
                { name: '🎓 Graduate', color: '#8E44AD', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 5 },
                { name: '📖 Senior', color: '#2980B9', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 4 },
                { name: '✏️ Student', color: '#27AE60', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 3 },
                { name: '👤 Member', color: '#95A5A6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 2 },
                { name: '🔒 Unverified', color: '#7F8C8D', permissions: ['ViewChannel', 'ReadMessageHistory'], position: 1 }
            ],
            categories: [
                {
                    name: '📋 INFORMATION',
                    staffOnly: false, readOnly: true,
                    channels: [
                        { name: '📜-rules', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📣-announcements', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🎭-roles', type: 'GUILD_TEXT', readOnly: true }
                    ]
                },
                {
                    name: '🚪 WELCOME',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '👋-welcome', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📝-introductions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '✅-verification', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💬 GENERAL',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬-general', type: 'GUILD_TEXT', readOnly: false },
                        { name: '😂-off-topic', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💡-suggestions', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '📚 STUDY',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🆘-homework-help', type: 'GUILD_TEXT', readOnly: false },
                        { name: '📎-resources', type: 'GUILD_TEXT', readOnly: false },
                        { name: '📝-notes-sharing', type: 'GUILD_TEXT', readOnly: false },
                        { name: '📅-study-schedule', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🧠 SUBJECTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🔢-mathematics', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🔬-science', type: 'GUILD_TEXT', readOnly: false },
                        { name: '📖-literature', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🌐-languages', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💻-computer-science', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🔊 VOICE',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '📚 Study Room 1', type: 'GUILD_VOICE' },
                        { name: '📚 Study Room 2', type: 'GUILD_VOICE' },
                        { name: '💬 General', type: 'GUILD_VOICE' }
                    ]
                },
                {
                    name: '🤖 BOTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🤖-bot-commands', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '⚙️ ADMINISTRATION',
                    staffOnly: true, readOnly: false,
                    channels: [
                        { name: '📋-logs', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💬-staff-chat', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-reports', type: 'GUILD_TEXT', readOnly: false }
                    ]
                }
            ]
        }
    },

    creator: {
        label: 'Content Creator',
        emoji: '🎨',
        description: 'Fan channels, media sharing & creator updates',
        structure: {
            serverName: '🎨 Content Creator',
            welcomeMessage: 'Welcome to the official server! So glad you\'re here — this is the place to stay up to date, chat with the community, and share your own creations. Grab your roles and say hi!',
            roles: [
                { name: '👑 Owner', color: '#F1C40F', permissions: ['Administrator'], position: 10 },
                { name: '⚙️ Admin', color: '#E74C3C', permissions: ['Administrator'], position: 9 },
                { name: '🛡️ Moderator', color: '#E67E22', permissions: ['KickMembers', 'BanMembers', 'ManageChannels'], position: 8 },
                { name: '💎 VIP Fan', color: '#9B59B6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 5 },
                { name: '🌟 Super Fan', color: '#E91E63', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 4 },
                { name: '❤️ Fan', color: '#3498DB', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 3 },
                { name: '👤 Member', color: '#95A5A6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 2 },
                { name: '🔒 Unverified', color: '#7F8C8D', permissions: ['ViewChannel', 'ReadMessageHistory'], position: 1 }
            ],
            categories: [
                {
                    name: '📋 INFORMATION',
                    staffOnly: false, readOnly: true,
                    channels: [
                        { name: '📜-rules', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📣-announcements', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🆕-updates', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🎭-roles', type: 'GUILD_TEXT', readOnly: true }
                    ]
                },
                {
                    name: '🚪 WELCOME',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '👋-welcome', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📝-introductions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '✅-verification', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💬 COMMUNITY',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬-general', type: 'GUILD_TEXT', readOnly: false },
                        { name: '😂-memes', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🖼️-fan-art', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💡-suggestions', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🎬 CONTENT',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🎥-new-videos', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📸-behind-the-scenes', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🎵-music-and-clips', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🗳️-polls-and-votes', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🔊 VOICE',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬 Fan Lounge', type: 'GUILD_VOICE' },
                        { name: '🎵 Music', type: 'GUILD_VOICE' },
                        { name: '🎮 Gaming', type: 'GUILD_VOICE' }
                    ]
                },
                {
                    name: '🤖 BOTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🤖-bot-commands', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🎵-music', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '⚙️ ADMINISTRATION',
                    staffOnly: true, readOnly: false,
                    channels: [
                        { name: '📋-logs', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💬-staff-chat', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-reports', type: 'GUILD_TEXT', readOnly: false }
                    ]
                }
            ]
        }
    },

    crypto: {
        label: 'Crypto & Trading',
        emoji: '💰',
        description: 'Market channels, signal alerts & VIP tiers',
        structure: {
            serverName: '💰 Crypto & Trading',
            welcomeMessage: 'Welcome to the trading server! Stay up to date with markets, share signals, and discuss strategies. Remember: nothing here is financial advice. DYOR and trade responsibly!',
            roles: [
                { name: '👑 Owner', color: '#F1C40F', permissions: ['Administrator'], position: 10 },
                { name: '⚙️ Admin', color: '#E74C3C', permissions: ['Administrator'], position: 9 },
                { name: '🛡️ Moderator', color: '#E67E22', permissions: ['KickMembers', 'BanMembers', 'ManageChannels'], position: 8 },
                { name: '💎 VIP Trader', color: '#9B59B6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 5 },
                { name: '🐋 Whale', color: '#1ABC9C', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 4 },
                { name: '📈 Trader', color: '#3498DB', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 3 },
                { name: '👤 Member', color: '#95A5A6', permissions: ['SendMessages', 'ReadMessageHistory', 'ViewChannel'], position: 2 },
                { name: '🔒 Unverified', color: '#7F8C8D', permissions: ['ViewChannel', 'ReadMessageHistory'], position: 1 }
            ],
            categories: [
                {
                    name: '📋 INFORMATION',
                    staffOnly: false, readOnly: true,
                    channels: [
                        { name: '📜-rules', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📣-announcements', type: 'GUILD_TEXT', readOnly: true },
                        { name: '⚠️-disclaimer', type: 'GUILD_TEXT', readOnly: true },
                        { name: '🎭-roles', type: 'GUILD_TEXT', readOnly: true }
                    ]
                },
                {
                    name: '🚪 WELCOME',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '👋-welcome', type: 'GUILD_TEXT', readOnly: true },
                        { name: '📝-introductions', type: 'GUILD_TEXT', readOnly: false },
                        { name: '✅-verification', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '💬 GENERAL',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬-general', type: 'GUILD_TEXT', readOnly: false },
                        { name: '😂-memes', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💡-suggestions', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '📈 MARKETS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '₿-bitcoin', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💠-ethereum', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🔥-altcoins', type: 'GUILD_TEXT', readOnly: false },
                        { name: '📊-charts-and-analysis', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-signals', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🧠 STRATEGY',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '📖-education', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🛠️-tools-and-resources', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🗳️-polls', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '🔊 VOICE',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '💬 Trading Lounge', type: 'GUILD_VOICE' },
                        { name: '📊 Analysis Room', type: 'GUILD_VOICE' }
                    ]
                },
                {
                    name: '🤖 BOTS',
                    staffOnly: false, readOnly: false,
                    channels: [
                        { name: '🤖-bot-commands', type: 'GUILD_TEXT', readOnly: false }
                    ]
                },
                {
                    name: '⚙️ ADMINISTRATION',
                    staffOnly: true, readOnly: false,
                    channels: [
                        { name: '📋-logs', type: 'GUILD_TEXT', readOnly: false },
                        { name: '💬-staff-chat', type: 'GUILD_TEXT', readOnly: false },
                        { name: '🚨-reports', type: 'GUILD_TEXT', readOnly: false }
                    ]
                }
            ]
        }
    }
};

module.exports = { TEMPLATES };
