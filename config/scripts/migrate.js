/**
 * Script de migration MongoDB -> PostgreSQL
 * Migrer les données de Neko 1.0 vers Neko 2.0
 */

const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Anciens modèles Mongoose (Neko 1.0)
const OldGuild = require('../../Neko1.0/src/Models/guild');
const OldUser = require('../../Neko1.0/src/Models/user');

async function migrateGuilds() {
    console.log('🔄 Migration des guildes...');
    
    const oldGuilds = await OldGuild.find({});
    let migratedCount = 0;

    for (const oldGuild of oldGuilds) {
        try {
            await prisma.guild.upsert({
                where: { id: oldGuild.id },
                update: {
                    name: oldGuild.name,
                    prefix: oldGuild.prefix,
                    // Logs
                    logsEnabled: oldGuild.logs?.enabled || false,
                    logsChannel: oldGuild.logs?.channel,
                    logsMessages: oldGuild.logs?.types?.messages || false,
                    logsModeration: oldGuild.logs?.types?.moderation || false,
                    logsJoins: oldGuild.logs?.types?.joins || false,
                    logsLeaves: oldGuild.logs?.types?.leaves || false,
                    logsRoles: oldGuild.logs?.types?.roles || false,
                    logsChannels: oldGuild.logs?.types?.channels || false,
                    logsBans: oldGuild.logs?.types?.bans || false,
                    logsBoosts: oldGuild.logs?.types?.boosts || false,
                    // Welcome
                    welcomeEnabled: oldGuild.welcome?.enabled || false,
                    welcomeChannel: oldGuild.welcome?.channel,
                    welcomeMessage: oldGuild.welcome?.message || "Bienvenue {user} 👋",
                    welcomeImage: oldGuild.welcome?.image,
                    // Bye
                    byeEnabled: oldGuild.bye?.enabled || false,
                    byeChannel: oldGuild.bye?.channel,
                    byeMessage: oldGuild.bye?.message || "{user} nous a quitté… 😢",
                    byeImage: oldGuild.bye?.image,
                    // Annonces
                    announcesEnabled: oldGuild.annonces?.enabled || false,
                    announcesChannel: oldGuild.annonces?.channel,
                    // Tickets
                    ticketEnabled: oldGuild.ticket?.enabled || false,
                    ticketChannel: oldGuild.ticket?.channel,
                    ticketCategory: oldGuild.ticket?.category,
                    ticketMessage: oldGuild.ticket?.message,
                    ticketRoleSupport: oldGuild.ticket?.role,
                    ticketLogs: oldGuild.ticket?.logs,
                    // Levels
                    levelEnabled: oldGuild.level?.enabled || false,
                    levelChannel: oldGuild.level?.channel,
                    levelMessage: oldGuild.level?.message || "🎉 Bravo {user} ! Tu passes au niveau {level} !",
                    levelMultiplier: oldGuild.level?.multiplier || 1.0,
                    // Moderation
                    modEnabled: oldGuild.moderation?.enabled || false,
                    modRole: oldGuild.moderation?.role,
                    modLogChannel: oldGuild.moderation?.logChannel,
                    autoModEnabled: oldGuild.automod?.enabled || false,
                    antiSpam: oldGuild.automod?.antiSpam || false,
                    antiLink: oldGuild.automod?.antiLink || false,
                    // Auto Role
                    autoRoleEnabled: oldGuild.autoRole?.enabled || false,
                    autoRoleId: oldGuild.autoRole?.roleId,
                },
                create: {
                    id: oldGuild.id,
                    name: oldGuild.name,
                    prefix: oldGuild.prefix,
                },
            });

            migratedCount++;
            console.log(`✓ Guilde migrée: ${oldGuild.name}`);
        } catch (error) {
            console.error(`✗ Erreur migration guilde ${oldGuild.name}:`, error.message);
        }
    }

    console.log(`✅ ${migratedCount}/${oldGuilds.length} guildes migrées\n`);
}

async function migrateUsers() {
    console.log('🔄 Migration des utilisateurs...');
    
    const oldUsers = await OldUser.find({});
    let migratedCount = 0;

    for (const oldUser of oldUsers) {
        try {
            // Trouver la guilde associée (vous devrez adapter selon votre logique)
            // Pour cet exemple, on suppose que vous avez une référence de guilde
            const guildId = oldUser.guildId || 'default_guild_id'; // À adapter!

            const newUser = await prisma.user.upsert({
                where: {
                    discordId_guildId: {
                        discordId: oldUser.id,
                        guildId: guildId,
                    },
                },
                update: {
                    username: oldUser.user,
                    birthday: oldUser.birthday,
                    hasTicket: oldUser.ticket,
                    ticketMessageId: oldUser.ticketMessageId,
                    level: oldUser.level,
                    xp: oldUser.xp,
                    nextLevel: oldUser.nextNiveau,
                    rank: oldUser.rank,
                    inGuild: oldUser.inGuild,
                    leftAt: oldUser.leftAt ? new Date(oldUser.leftAt) : null,
                },
                create: {
                    discordId: oldUser.id,
                    username: oldUser.user,
                    guildId: guildId,
                    birthday: oldUser.birthday,
                    hasTicket: oldUser.ticket,
                    ticketMessageId: oldUser.ticketMessageId,
                    level: oldUser.level,
                    xp: oldUser.xp,
                    nextLevel: oldUser.nextNiveau,
                    rank: oldUser.rank,
                    inGuild: oldUser.inGuild,
                    leftAt: oldUser.leftAt ? new Date(oldUser.leftAt) : null,
                },
            });

            // Migrer les warnings
            if (oldUser.warnings && oldUser.warnings.length > 0) {
                for (const warning of oldUser.warnings) {
                    await prisma.warning.create({
                        data: {
                            userId: newUser.id,
                            reason: warning.reason,
                            moderator: warning.moderator,
                            createdAt: warning.date || new Date(),
                        },
                    });
                }
            }

            migratedCount++;
            console.log(`✓ Utilisateur migré: ${oldUser.user} (${oldUser.warnings?.length || 0} warnings)`);
        } catch (error) {
            console.error(`✗ Erreur migration utilisateur ${oldUser.user}:`, error.message);
        }
    }

    console.log(`✅ ${migratedCount}/${oldUsers.length} utilisateurs migrés\n`);
}

async function main() {
    console.log('🚀 Début de la migration Neko 1.0 → Neko 2.0\n');

    try {
        // Connexion MongoDB (Neko 1.0)
        console.log('📦 Connexion à MongoDB...');
        const mongoUri = process.env.MONGO_URI || process.env.OLD_DATABASE_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI ou OLD_DATABASE_URI manquant dans .env');
        }
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Connecté à MongoDB\n');

        // Connexion PostgreSQL (Neko 2.0)
        console.log('🐘 Connexion à PostgreSQL...');
        await prisma.$connect();
        console.log('✓ Connecté à PostgreSQL\n');

        // Migrations
        await migrateGuilds();
        await migrateUsers();

        console.log('✅ Migration terminée avec succès!');
    } catch (error) {
        console.error('❌ Erreur durant la migration:', error);
    } finally {
        await mongoose.disconnect();
        await prisma.$disconnect();
        console.log('\n👋 Déconnexion des bases de données');
    }
}

// Exécuter la migration
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { migrateGuilds, migrateUsers };
