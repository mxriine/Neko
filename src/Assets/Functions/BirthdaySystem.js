const { EmbedBuilder } = require('discord.js');
const config = require('../../../config/bot.config');

/**
 * Système de vérification des anniversaires
 * Vérifie tous les jours à minuit et envoie des messages pour les anniversaires
 */

let birthdayCheckInterval = null;

/**
 * Démarre le système de vérification des anniversaires
 */
function startBirthdaySystem(client) {
  console.log('[BIRTHDAY] Démarrage du système d\'anniversaires...');
  
  // Vérifier immédiatement au démarrage
  checkBirthdays(client);
  
  // Calculer le temps jusqu'à minuit
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;
  
  // Attendre jusqu'à minuit, puis vérifier toutes les 24h
  setTimeout(() => {
    checkBirthdays(client);
    birthdayCheckInterval = setInterval(() => {
      checkBirthdays(client);
    }, 24 * 60 * 60 * 1000); // 24 heures
  }, msUntilMidnight);
}

/**
 * Arrête le système de vérification
 */
function stopBirthdaySystem() {
  if (birthdayCheckInterval) {
    clearInterval(birthdayCheckInterval);
    birthdayCheckInterval = null;
  }
}

/**
 * Vérifie tous les anniversaires du jour
 */
async function checkBirthdays(client) {
  try {
    
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Récupérer toutes les guildes avec le système d'anniversaire activé
    const guilds = await client.prisma.guild.findMany({
      where: {
        birthdayEnabled: true,
        birthdayChannel: { not: null }
      }
    });
    
    if (guilds.length === 0) {
      return;
    }
    let totalBirthdays = 0;
    
    // Pour chaque guilde
    for (const guildData of guilds) {
      try {
        const guild = client.guilds.cache.get(guildData.id);
        if (!guild) continue;
        
        const channel = guild.channels.cache.get(guildData.birthdayChannel);
        if (!channel) {
          console.log(`[BIRTHDAY] ⚠ Salon introuvable pour ${guild.name}`);
          continue;
        }
        
        // Chercher les utilisateurs dont c'est l'anniversaire aujourd'hui
        const users = await client.prisma.user.findMany({
          where: {
            guildId: guild.id,
            birthday: { not: null },
            inGuild: true // Seulement les membres présents sur le serveur
          }
        });
        
        // Filtrer ceux dont c'est l'anniversaire aujourd'hui
        const birthdayUsers = users.filter(user => {
          if (!user.birthday) return false;
          const [year, month, day] = user.birthday.split('-');
          const userDateStr = `${month}-${day}`;
          
          // Vérifier que c'est bien aujourd'hui
          if (userDateStr !== todayStr) return false;
          
          // Vérifier qu'on n'a pas déjà envoyé le message aujourd'hui
          if (user.lastBirthdayMessageSent) {
            const lastSent = new Date(user.lastBirthdayMessageSent);
            const lastSentStr = `${String(lastSent.getMonth() + 1).padStart(2, '0')}-${String(lastSent.getDate()).padStart(2, '0')}`;
            if (lastSentStr === todayStr) {
              return false; // Message déjà envoyé aujourd'hui
            }
          }
          
          return true;
        });
        
        if (birthdayUsers.length === 0) continue;
        
        console.log(`[BIRTHDAY] 🎉 ${birthdayUsers.length} anniversaire(s) dans ${guild.name}`);
        totalBirthdays += birthdayUsers.length;
        
        // Envoyer un message pour chaque anniversaire
        for (const user of birthdayUsers) {
          try {
            const member = await guild.members.fetch(user.discordId).catch(() => null);
            if (!member) continue;
            
            // Calculer l'âge
            const [year] = user.birthday.split('-');
            const age = today.getFullYear() - parseInt(year);
            
            // Créer le message personnalisé
            let message = guildData.birthdayMessage || "🎉 Joyeux anniversaire {user} ! Tu as maintenant {age} ans ! 🎂";
            message = message
              .replace(/{user}/g, member.toString())
              .replace(/{username}/g, member.user.username)
              .replace(/{age}/g, age.toString());
            
            // Créer l'embed
            const embed = new EmbedBuilder()
              .setColor(config.colors.birthday || 0xFF69B4)
              .setTitle('🎂 Joyeux Anniversaire !')
              .setDescription(message)
              .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
              .setImage('https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif')
              .setFooter({ text: `${age} ans aujourd'hui !` })
              .setTimestamp();
            
            // Envoyer le message
            await channel.send({
              content: `@everyone`,
              embeds: [embed]
            });
            
            // Mettre à jour la date d'envoi dans la base de données
            await client.prisma.user.update({
              where: { id: user.id },
              data: { lastBirthdayMessageSent: new Date() }
            });
            
            console.log(`[BIRTHDAY] Message envoyé pour ${member.user.username} (${age} ans)`);
            
          } catch (error) {
            console.error(`[BIRTHDAY] Erreur pour ${user.username}:`, error);
          }
        }
        
      } catch (error) {
        console.error(`[BIRTHDAY] Erreur pour la guilde ${guildData.id}:`, error);
      }
    }
    
    console.log(`[BIRTHDAY] Vérification terminée - ${totalBirthdays} anniversaire(s) trouvé(s)`);
    
  } catch (error) {
    console.error('[BIRTHDAY] Erreur lors de la vérification des anniversaires:', error);
  }
}

/**
 * Vérifie manuellement les anniversaires (pour test)
 */
async function forceCheckBirthdays(client) {
  console.log('[BIRTHDAY] Vérification manuelle forcée');
  await checkBirthdays(client);
}

module.exports = {
  startBirthdaySystem,
  stopBirthdaySystem,
  forceCheckBirthdays
};
