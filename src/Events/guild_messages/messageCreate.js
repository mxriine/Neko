const Logger = require("../../Loaders/Logger");
const config = require("../../../config/bot.config");
const { PermissionFlagsBits } = require("discord.js");

// Cooldown pour l'XP (1 minute par utilisateur)
const xpCooldowns = new Map();

// Système anti-spam : stocke les messages récents par utilisateur (avec référence au message)
const spamTracker = new Map();

// Infractions d'auto-modération
const autoModInfractions = new Map();

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message, client) {
        // Vérifications initiales
        if (!message || !message.guild || !message.author || message.author.bot) {
            return;
        }

        const guildSettings = await client.getGuild(message.guild.id, message.guild.name);

        // ═══════════════════════════════════════════════════════
        // SYSTÈME D'AUTO-MODÉRATION
        // ═══════════════════════════════════════════════════════
        if (guildSettings && guildSettings.autoModEnabled) {
            // Fetch member si pas en cache
            let member = message.member;
            if (!member) {
                try {
                    member = await message.guild.members.fetch(message.author.id);
                } catch (error) {
                    Logger.error(`[AutoMod] Impossible de fetch le member: ${error.message}`);
                    return;
                }
            }

            const autoMod = config.features.moderation.autoMod;

            // Ignorer les modérateurs
            const isModerator = member.permissions?.has(PermissionFlagsBits.ModerateMembers) || 
                              (guildSettings.modRole && member.roles.cache.has(guildSettings.modRole));

            if (!isModerator) {
                try {
                    // ─────────────────────────────────────────────
                    // ANTI-SPAM
                    // ─────────────────────────────────────────────
                    if (guildSettings.antiSpam && autoMod.spam.enabled) {
                        const userId = message.author.id;
                        const now = Date.now();

                        if (!spamTracker.has(userId)) {
                            spamTracker.set(userId, []);
                        }

                        const userMessages = spamTracker.get(userId);
                        userMessages.push({ message, timestamp: now });

                        // Garder seulement les messages récents
                        const recentMessages = userMessages.filter(
                            item => now - item.timestamp < autoMod.spam.timeWindow
                        );
                        spamTracker.set(userId, recentMessages);

                        // Détection du spam
                        if (recentMessages.length >= autoMod.spam.maxMessages) {
                            Logger.warn(`[AntiSpam] 🚨 SPAM DÉTECTÉ ! ${message.author.tag} - ${recentMessages.length} messages`);
                            
                            // Nettoyer le tracker IMMÉDIATEMENT pour éviter les doublons
                            spamTracker.delete(userId);
                            
                            // Supprimer TOUS les messages de spam
                            let deletedCount = 0;
                            for (const item of recentMessages) {
                                try {
                                    if (!item.message.deleted) {
                                        await item.message.delete();
                                        deletedCount++;
                                    }
                                } catch (error) {
                                    // Message déjà supprimé, on ignore
                                }
                            }
                            
                            Logger.success(`[AntiSpam] ${deletedCount}/${recentMessages.length} messages supprimés`);

                            // Enregistrer l'infraction
                            const infractions = autoModInfractions.get(userId) || { spam: 0 };
                            infractions.spam = (infractions.spam || 0) + 1;
                            autoModInfractions.set(userId, infractions);

                            // MP à l'utilisateur
                            try {
                                const { EmbedBuilder } = require('discord.js');
                                const dmEmbed = new EmbedBuilder()
                                    .setColor(config.colors.error)
                                    .setTitle(`⚠️ Spam détecté sur ${message.guild.name}`)
                                    .setDescription('Vous avez été mis en timeout pour spam.')
                                    .addFields(
                                        { name: 'Durée', value: `${autoMod.spam.muteTime / 60000} minutes`, inline: true },
                                        { name: 'Infractions', value: `${infractions.spam}/${autoMod.spam.warnAfter}`, inline: true },
                                        { name: 'Attention', value: `Après ${autoMod.spam.warnAfter} infractions, vous recevrez un avertissement officiel.`, inline: false }
                                    )
                                    .setTimestamp()
                                    .setFooter({ text: 'Modérez votre vitesse de messages !' });

                                await message.author.send({ embeds: [dmEmbed] });
                            } catch (error) {
                                Logger.warn(`[AntiSpam] Impossible d'envoyer un MP à ${message.author.tag}`);
                            }

                            // Timeout
                            try {
                                await member.timeout(autoMod.spam.muteTime, '⚠️ Spam détecté');
                            } catch (error) {
                                Logger.error(`[AntiSpam] Erreur timeout: ${error.message}`);
                            }

                            // Warn après X infractions
                            if (infractions.spam >= autoMod.spam.warnAfter) {
                                await client.addWarning(
                                    userId,
                                    message.guild.id,
                                    'Spam répété détecté automatiquement',
                                    client.user.id
                                );
                                infractions.spam = 0; // Reset
                                autoModInfractions.set(userId, infractions);
                            }

                            // Log
                            if (guildSettings.modLogChannel) {
                                const logChannel = message.guild.channels.cache.get(guildSettings.modLogChannel);
                                if (logChannel) {
                                    await logChannel.send({
                                        content: `⚠️ **Anti-Spam** | ${message.author} a été timeout pour spam (${deletedCount} messages supprimés en ${autoMod.spam.timeWindow / 1000}s)`
                                    }).catch(() => {});
                                }
                            }

                            return; // Arrêter le traitement
                        }
                    }

                    // ─────────────────────────────────────────────
                    // ANTI-LIENS
                    // ─────────────────────────────────────────────
                    if (guildSettings.antiLink && autoMod.links.enabled) {
                        const urlRegex = /(https?:\/\/[^\s]+)/gi;
                        const links = message.content.match(urlRegex);

                        if (links) {
                            const hasDisallowedLink = links.some(link => {
                                return !autoMod.links.allowedDomains.some(domain => 
                                    link.toLowerCase().includes(domain.toLowerCase())
                                );
                            });

                            if (hasDisallowedLink) {
                                if (autoMod.links.deleteMessage) {
                                    await message.delete().catch(() => {});
                                }

                                if (autoMod.links.warnUser) {
                                    await client.addWarning(
                                        message.author.id,
                                        message.guild.id,
                                        'Envoi de liens non autorisés',
                                        client.user.id
                                    );
                                }

                                await message.channel.send({
                                    content: `${message.author}, les liens ne sont pas autorisés ici !`
                                }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                                // Log
                                if (guildSettings.modLogChannel) {
                                    const logChannel = message.guild.channels.cache.get(guildSettings.modLogChannel);
                                    if (logChannel) {
                                        await logChannel.send({
                                            content: `🔗 **Anti-Liens** | ${message.author} a envoyé un lien non autorisé : ${links[0]}`
                                        }).catch(() => {});
                                    }
                                }

                                return;
                            }
                        }
                    }

                    // ─────────────────────────────────────────────
                    // ANTI-MENTIONS EN MASSE
                    // ─────────────────────────────────────────────
                    if (autoMod.mentions.enabled) {
                        const mentionCount = message.mentions.users.size + message.mentions.roles.size;

                        if (mentionCount > autoMod.mentions.maxMentions) {
                            if (autoMod.mentions.deleteMessage) {
                                await message.delete().catch(() => {});
                            }

                            if (autoMod.mentions.warnUser) {
                                await client.addWarning(
                                    message.author.id,
                                    message.guild.id,
                                    `Spam de mentions (${mentionCount} mentions)`,
                                    client.user.id
                                );
                            }

                            await message.channel.send({
                                content: `${message.author}, ne mentionnez pas autant de personnes à la fois !`
                            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                            // Log
                            if (guildSettings.modLogChannel) {
                                const logChannel = message.guild.channels.cache.get(guildSettings.modLogChannel);
                                if (logChannel) {
                                    await logChannel.send({
                                        content: `👥 **Anti-Mentions** | ${message.author} a mentionné ${mentionCount} personnes/rôles`
                                    }).catch(() => {});
                                }
                            }

                            return;
                        }
                    }

                    // ─────────────────────────────────────────────
                    // ANTI-CAPS
                    // ─────────────────────────────────────────────
                    if (autoMod.caps.enabled && message.content.length >= autoMod.caps.minLength) {
                        const upperCount = (message.content.match(/[A-Z]/g) || []).length;
                        const capsPercentage = (upperCount / message.content.length) * 100;

                        if (capsPercentage >= autoMod.caps.percentage) {
                            if (autoMod.caps.deleteMessage) {
                                await message.delete().catch(() => {});
                            }

                            await message.channel.send({
                                content: `${message.author}, arrêtez de crier ! (${Math.floor(capsPercentage)}% de CAPS)`
                            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                            return;
                        }
                    }

                    // ─────────────────────────────────────────────
                    // MOTS INTERDITS
                    // ─────────────────────────────────────────────
                    if (autoMod.badWords.enabled && autoMod.badWords.words.length > 0) {
                        const contentLower = message.content.toLowerCase();
                        const hasBadWord = autoMod.badWords.words.some(word => 
                            contentLower.includes(word.toLowerCase())
                        );

                        if (hasBadWord) {
                            if (autoMod.badWords.deleteMessage) {
                                await message.delete().catch(() => {});
                            }

                            if (autoMod.badWords.warnUser) {
                                await client.addWarning(
                                    message.author.id,
                                    message.guild.id,
                                    'Utilisation de langage inapproprié',
                                    client.user.id
                                );
                            }

                            await message.channel.send({
                                content: `${message.author}, ce langage n'est pas autorisé !`
                            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));

                            // Log
                            if (guildSettings.modLogChannel) {
                                const logChannel = message.guild.channels.cache.get(guildSettings.modLogChannel);
                                if (logChannel) {
                                    await logChannel.send({
                                        content: `🚫 **Langage inapproprié** | ${message.author} a utilisé un mot interdit`
                                    }).catch(() => {});
                                }
                            }

                            return;
                        }
                    }

                } catch (error) {
                    Logger.error(`Erreur auto-modération: ${error.message}`);
                }
            }
        }

        // ═══════════════════════════════════════════════════════
        // SYSTÈME D'XP
        // ═══════════════════════════════════════════════════════
        try {
            const guildSettings = await client.getGuild(message.guild.id, message.guild.name);
            
            if (guildSettings && guildSettings.levelEnabled) {
                const userSettings = await client.getUser(message.author.id, message.author.tag, message.guild.id);
                
                if (userSettings) {
                    const userId = message.author.id;
                    const now = Date.now();
                    const cooldownAmount = 60 * 1000; // 1 minute

                    const lastXp = xpCooldowns.get(userId);
                    const timeSinceLastXp = lastXp ? now - lastXp : cooldownAmount;
                    
                    if (!xpCooldowns.has(userId) || now - xpCooldowns.get(userId) >= cooldownAmount) {
                        xpCooldowns.set(userId, now);

                        // Ajouter entre 15 et 25 XP aléatoire
                        const xpGained = Math.floor(Math.random() * 11) + 15;
                        const newXp = userSettings.xp + xpGained;
                        const oldLevel = userSettings.level;
                        const newLevel = Math.floor(newXp / 100);

                        // Mettre à jour la base de données
                        const updated = await client.prisma.user.update({
                            where: {
                                discordId_guildId: {
                                    discordId: userId,
                                    guildId: message.guild.id
                                }
                            },
                            data: {
                                xp: newXp,
                                level: newLevel
                            }
                        });
                        
                        // Notification de level up
                        if (newLevel > oldLevel && guildSettings.levelChannel) {
                            console.log(`[XP] Level UP ! ${oldLevel} → ${newLevel}`);
                            const levelChannel = message.guild.channels.cache.get(guildSettings.levelChannel);
                            if (levelChannel) {
                                levelChannel.send({
                                    content: `🎉 ${message.author} vient de passer au niveau **${newLevel}** !`
                                }).catch(() => {});
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[XP] Erreur:', error.message);
            console.error('[XP] Stack:', error.stack);
        }

        const prefix = process.env.PREFIX || "!";
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        // Trouver la commande
        const command = client.commands.get(commandName) || 
                       client.commands.get(client.aliases.get(commandName));

        if (!command) return;
        if (!command.run && !command.execute) return;

        // Check owner
        if (command.ownerOnly && message.author.id !== process.env.OWNER_ID) {
            return message.reply("Seul le propriétaire du bot peut utiliser cette commande.");
        }

        // Check permissions
        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            return message.reply("Vous n'avez pas les permissions nécessaires.");
        }

        // Exécution
        try {
            if (typeof command.run === "function") {
                await command.run(message, client, args);
            } else if (typeof command.execute === "function") {
                await command.execute(message, client, args);
            }
        } catch (err) {
            Logger.error(`Erreur dans la commande prefix ${commandName}: ${err.message}`);
            console.error(err);
            message.reply("Une erreur s'est produite lors de l'exécution.").catch(() => {});
        }
    }
};
