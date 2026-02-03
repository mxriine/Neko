/**
 * Configuration centralisée du bot Discord
 */

require('dotenv').config();

module.exports = {
    // Discord Bot
    bot: {
        token: process.env.TOKEN,
        prefix: process.env.PREFIX || '!',
        clientId: process.env.CLIENT_ID,
        ownerId: process.env.OWNER_ID,
    },

    // Base de données
    database: {
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'neko',
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME || 'neko_db',
    },

    // Environnement
    environment: {
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        nodeEnv: process.env.NODE_ENV || 'development',
    },

    // Logs
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableDebug: process.env.NODE_ENV === 'development',
    },

    // Fonctionnalités
    features: {
        levels: {
            enabled: true,
            baseXp: 15,
            maxXp: 25,
            cooldown: 60000, // 1 minute
        },
        moderation: {
            enabled: true,
            maxWarnings: 3,
            autoMod: {
                // Anti-Spam
                spam: {
                    enabled: true,
                    maxMessages: 5,           // Nombre max de messages
                    timeWindow: 5000,         // Dans cette période (ms)
                    muteTime: 300000,         // Durée du timeout (5 min)
                    warnAfter: 2,             // Warn après X infractions
                },
                // Anti-Liens
                links: {
                    enabled: true,
                    allowedDomains: ['discord.gg', 'discord.com'], // Domaines autorisés
                    deleteMessage: true,
                    warnUser: true,
                },
                // Anti-Mentions en masse
                mentions: {
                    enabled: true,
                    maxMentions: 5,           // Max mentions par message
                    deleteMessage: true,
                    warnUser: true,
                },
                // Anti-CAPS
                caps: {
                    enabled: true,
                    percentage: 70,           // % de CAPS max
                    minLength: 10,            // Taille min du message
                    deleteMessage: true,
                },
                // Mots interdits
                badWords: {
                    enabled: true,
                    words: [],                // Liste de mots à bannir
                    deleteMessage: true,
                    warnUser: true,
                },
            },
        },
        tickets: {
            enabled: true,
            maxOpenTickets: 1,
        },
    },

    // Couleurs des embeds
    colors: {
        primary: 0x5865F2,
        success: 0x57F287,
        warning: 0xFEE75C,
        error: 0xED4245,
        info: 0x5865F2,
    },

    // Emojis
    emojis: {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        loading: '⏳',
        info: 'ℹ️',
        level: '⬆️',
        xp: '✨',
    },
};
