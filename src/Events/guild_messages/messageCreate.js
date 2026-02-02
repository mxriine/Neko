const Logger = require("../../Loaders/Logger");

// Cooldown pour l'XP (1 minute par utilisateur)
const xpCooldowns = new Map();

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message, client) {
        // Vérifications initiales
        if (!message || !message.guild || !message.author || message.author.bot) {
            return;
        }

        // Système d'XP automatique
        try {
            const guildSettings = await client.getGuild(message.guild.id, message.guild.name);
            console.log('[XP] levelEnabled:', guildSettings?.levelEnabled);
            
            if (guildSettings && guildSettings.levelEnabled) {
                const userSettings = await client.getUser(message.author.id, message.author.tag, message.guild.id);
                console.log('[XP] UserSettings:', userSettings ? 'OK' : 'NULL');
                
                if (userSettings) {
                    const userId = message.author.id;
                    const now = Date.now();
                    const cooldownAmount = 60 * 1000; // 1 minute

                    const lastXp = xpCooldowns.get(userId);
                    const timeSinceLastXp = lastXp ? now - lastXp : cooldownAmount;
                    console.log('[XP] Cooldown:', Math.floor(timeSinceLastXp / 1000), 'secondes écoulées');

                    if (!xpCooldowns.has(userId) || now - xpCooldowns.get(userId) >= cooldownAmount) {
                        xpCooldowns.set(userId, now);

                        // Ajouter entre 15 et 25 XP aléatoire
                        const xpGained = Math.floor(Math.random() * 11) + 15;
                        const newXp = userSettings.xp + xpGained;
                        const oldLevel = userSettings.level;
                        const newLevel = Math.floor(newXp / 100);

                        console.log(`[XP] ${message.author.tag} gagne ${xpGained} XP (${userSettings.xp} → ${newXp})`);

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
                        
                        console.log('[XP] Update DB réussi:', updated.xp, 'XP');

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
