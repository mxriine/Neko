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
