const Logger = require("./Logger");

/**
 * Enregistre les fonctions de base de données sur le client Discord
 * Utilise Prisma pour interagir avec PostgreSQL
 */
module.exports = (client) => {
  const prisma = client.prisma;

  // ═══════════════════════════════════════════════════════
  // GUILDS
  // ═══════════════════════════════════════════════════════

  /**
   * Récupère ou crée une guilde
   * @param {string} guildId - ID Discord de la guilde
   * @param {string} guildName - Nom de la guilde
   * @returns {Promise<Guild>}
   */
  client.getGuild = async (guildId, guildName) => {
    try {
      let guild = await prisma.guild.findUnique({
        where: { id: guildId },
      });

      if (!guild) {
        guild = await prisma.guild.create({
          data: {
            id: guildId,
            name: guildName,
            prefix: process.env.PREFIX || "!",
          },
        });
        Logger.db(`Nouvelle guilde créée: ${guildName} (${guildId})`);
      }

      return guild;
    } catch (error) {
      Logger.error(`Erreur getGuild: ${error.message}`);
      throw error;
    }
  };

  /**
   * Met à jour une guilde
   * @param {string} guildId - ID Discord de la guilde
   * @param {object} data - Données à mettre à jour
   * @returns {Promise<Guild>}
   */
  client.updateGuild = async (guildId, data) => {
    try {
      const guild = await prisma.guild.update({
        where: { id: guildId },
        data,
      });
      Logger.db(`Guilde mise à jour: ${guildId}`);
      return guild;
    } catch (error) {
      Logger.error(`Erreur updateGuild: ${error.message}`);
      throw error;
    }
  };

  /**
   * Supprime une guilde
   * @param {string} guildId - ID Discord de la guilde
   * @returns {Promise<void>}
   */
  client.deleteGuild = async (guildId) => {
    try {
      await prisma.guild.delete({
        where: { id: guildId },
      });
      Logger.db(`Guilde supprimée: ${guildId}`);
    } catch (error) {
      Logger.error(`Erreur deleteGuild: ${error.message}`);
      throw error;
    }
  };

  // ═══════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════

  /**
   * Récupère ou crée un utilisateur
   * @param {string} discordId - ID Discord de l'utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} guildId - ID de la guilde
   * @returns {Promise<User>}
   */
  client.getUser = async (discordId, username, guildId) => {
    try {
      let user = await prisma.user.findUnique({
        where: {
          discordId_guildId: {
            discordId,
            guildId,
          },
        },
        include: {
          warnings: true,
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            discordId,
            username,
            guildId,
          },
          include: {
            warnings: true,
          },
        });
        Logger.db(`Nouvel utilisateur créé: ${username} (${discordId})`);
      }

      return user;
    } catch (error) {
      Logger.error(`Erreur getUser: ${error.message}`);
      throw error;
    }
  };

  /**
   * Met à jour un utilisateur
   * @param {string} discordId - ID Discord de l'utilisateur
   * @param {string} guildId - ID de la guilde
   * @param {object} data - Données à mettre à jour
   * @returns {Promise<User>}
   */
  client.updateUser = async (discordId, guildId, data) => {
    try {
      const user = await prisma.user.update({
        where: {
          discordId_guildId: {
            discordId,
            guildId,
          },
        },
        data,
      });
      Logger.db(`Utilisateur mis à jour: ${discordId}`);
      return user;
    } catch (error) {
      Logger.error(`Erreur updateUser: ${error.message}`);
      throw error;
    }
  };

  /**
   * Ajoute XP à un utilisateur
   * @param {string} discordId - ID Discord de l'utilisateur
   * @param {string} guildId - ID de la guilde
   * @param {number} xpAmount - Montant d'XP à ajouter
   * @returns {Promise<{user: User, levelUp: boolean, newLevel: number}>}
   */
  client.addXp = async (discordId, guildId, xpAmount) => {
    try {
      const user = await client.getUser(discordId, "Unknown", guildId);
      const newXp = user.xp + xpAmount;
      let levelUp = false;
      let newLevel = user.level;

      // Vérifier si level up
      if (newXp >= user.nextLevel) {
        newLevel = user.level + 1;
        levelUp = true;
        const nextLevelXp = Math.floor(300 * Math.pow(1.5, newLevel));

        await client.updateUser(discordId, guildId, {
          xp: newXp,
          level: newLevel,
          nextLevel: nextLevelXp,
        });
      } else {
        await client.updateUser(discordId, guildId, { xp: newXp });
      }

      return {
        user: await client.getUser(discordId, "Unknown", guildId),
        levelUp,
        newLevel,
      };
    } catch (error) {
      Logger.error(`Erreur addXp: ${error.message}`);
      throw error;
    }
  };

  /**
   * Récupère le classement des utilisateurs par XP
   * @param {string} guildId - ID de la guilde
   * @param {number} limit - Nombre d'utilisateurs à récupérer
   * @returns {Promise<User[]>}
   */
  client.getLeaderboard = async (guildId, limit = 10) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          guildId,
          inGuild: true,
        },
        orderBy: [{ level: "desc" }, { xp: "desc" }],
        take: limit,
      });
      return users;
    } catch (error) {
      Logger.error(`Erreur getLeaderboard: ${error.message}`);
      throw error;
    }
  };

  // ═══════════════════════════════════════════════════════
  // WARNINGS
  // ═══════════════════════════════════════════════════════

  /**
   * Ajoute un avertissement à un utilisateur
   * @param {string} discordId - ID Discord de l'utilisateur
   * @param {string} guildId - ID de la guilde
   * @param {string} reason - Raison de l'avertissement
   * @param {string} moderator - ID du modérateur
   * @returns {Promise<Warning>}
   */
  client.addWarning = async (discordId, guildId, reason, moderator) => {
    try {
      const user = await client.getUser(discordId, "Unknown", guildId);
      
      const warning = await prisma.warning.create({
        data: {
          userId: user.id,
          reason,
          moderator,
        },
      });

      Logger.db(`Avertissement ajouté pour ${discordId}`);
      return warning;
    } catch (error) {
      Logger.error(`Erreur addWarning: ${error.message}`);
      throw error;
    }
  };

  /**
   * Récupère les avertissements d'un utilisateur
   * @param {string} discordId - ID Discord de l'utilisateur
   * @param {string} guildId - ID de la guilde
   * @returns {Promise<Warning[]>}
   */
  client.getWarnings = async (discordId, guildId) => {
    try {
      const user = await client.getUser(discordId, "Unknown", guildId);
      
      const warnings = await prisma.warning.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      return warnings;
    } catch (error) {
      Logger.error(`Erreur getWarnings: ${error.message}`);
      throw error;
    }
  };
};
