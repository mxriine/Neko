/**
 * Configuration de la base de données PostgreSQL
 */

const { PrismaClient } = require('@prisma/client');
const Logger = require('../src/Loaders/Logger');

/**
 * Crée et configure une instance Prisma Client
 * @returns {PrismaClient}
 */
function createPrismaClient() {
    const prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
            ? ['query', 'error', 'warn'] 
            : ['error'],
        errorFormat: 'pretty',
    });

    // Middleware pour logger les requêtes lentes
    prisma.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        
        const queryTime = after - before;
        if (queryTime > 1000) { // Si > 1 seconde
            Logger.warn(`Requête lente: ${params.model}.${params.action} (${queryTime}ms)`);
        }
        
        return result;
    });

    return prisma;
}

/**
 * Teste la connexion à la base de données
 * @param {PrismaClient} prisma
 * @returns {Promise<boolean>}
 */
async function testConnection(prisma) {
    try {
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        Logger.client('✔ Connecté à la base de données');
        return true;
    } catch (error) {
        Logger.error(`Erreur de connexion PostgreSQL: ${error.message}`);
        return false;
    }
}

/**
 * Ferme proprement la connexion
 * @param {PrismaClient} prisma
 */
async function disconnectPrisma(prisma) {
    try {
        await prisma.$disconnect();
        Logger.info('Déconnexion PostgreSQL');
    } catch (error) {
        Logger.error(`Erreur lors de la déconnexion: ${error.message}`);
    }
}

module.exports = {
    createPrismaClient,
    testConnection,
    disconnectPrisma,
};
