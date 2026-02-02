require("dotenv").config();
const { ChannelType, PermissionsBitField } = require("discord.js");

const TEMPLATE_VC_IDS = (process.env.VC_IDS ?? "")
  .split(",")
  .map(id => id.trim())
  .filter(id => id.length > 0);

// Stocker les timestamps de connexion
const voiceJoinTimes = new Map();

module.exports = {
  name: "voiceStateUpdate",

  async execute(client, oldState, newState) {
    if (!oldState || !newState) return;

    const guild = newState.guild;
    const member = newState.member;
    
    if (!member || !guild) return;

    const userId = member.id;

    // Récupérer les settings du serveur
    const guildSettings = await client.getGuild(guild.id, guild.name);

    // ==========================================
    // SYSTÈME D'XP VOCAL
    // ==========================================
    if (guildSettings && guildSettings.levelEnabled) {
      // L'utilisateur rejoint un vocal
      if (!oldState.channelId && newState.channelId) {
        // Pas AFK et pas muted/deafened
        if (!newState.selfMute && !newState.selfDeaf) {
          voiceJoinTimes.set(userId, Date.now());
        }
      }

      // L'utilisateur quitte un vocal
      if (oldState.channelId && !newState.channelId) {
        const joinTime = voiceJoinTimes.get(userId);
        if (joinTime && member && member.user) {
          const timeSpent = Math.floor((Date.now() - joinTime) / 1000 / 60); // Minutes
          
          if (timeSpent >= 1) {
            // 5 XP par minute passée en vocal
            const xpGained = timeSpent * 5;

            try {
              const userSettings = await client.getUser(userId, member.user.tag, guild.id);
              
              if (userSettings) {
                const newXp = userSettings.xp + xpGained;
                const oldLevel = userSettings.level;
                const newLevel = Math.floor(newXp / 100);

                await client.prisma.user.update({
                  where: {
                    discordId_guildId: {
                      discordId: userId,
                      guildId: guild.id
                    }
                  },
                  data: {
                    xp: newXp,
                    level: newLevel
                  }
                });

                // Notification de level up
                if (newLevel > oldLevel && guildSettings.levelChannel) {
                  const levelChannel = guild.channels.cache.get(guildSettings.levelChannel);
                  if (levelChannel) {
                    levelChannel.send({
                      content: `🎉 ${member} vient de passer au niveau **${newLevel}** ! (+${xpGained} XP vocal)`
                    }).catch(() => {});
                  }
                }
              }
            } catch (error) {
              console.error('[XP VOCAL] Erreur:', error.message);
              console.error('[XP VOCAL] Stack:', error.stack);
            }
          }

          voiceJoinTimes.delete(userId);
        }
      }

      // L'utilisateur se mute/deafen
      if (oldState.channelId && newState.channelId && 
          (!oldState.selfMute && newState.selfMute || !oldState.selfDeaf && newState.selfDeaf)) {
        voiceJoinTimes.delete(userId);
      }

      // L'utilisateur se unmute/undeafen
      if (oldState.channelId && newState.channelId && 
          (oldState.selfMute && !newState.selfMute || oldState.selfDeaf && !newState.selfDeaf)) {
        if (!newState.selfMute && !newState.selfDeaf) {
          voiceJoinTimes.set(userId, Date.now());
        }
      }
    }

    // ==========================================
    // SYSTÈME DE VOCAL DYNAMIQUE
    // ==========================================
    if (TEMPLATE_VC_IDS.length === 0) return;

    // CRÉATION
    if (newState.channelId && TEMPLATE_VC_IDS.includes(newState.channelId)) {
      if (!member || !member.user) return;

      const newChannel = await guild.channels.create({
        name: `・ ${member.user.username}`,
        type: ChannelType.GuildVoice,
        parent: newState.channel.parentId,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.MoveMembers,
              PermissionsBitField.Flags.ManageChannels
            ]
          }
        ]
      });

      if (member.voice.channelId === newState.channelId) {
        member.voice.setChannel(newChannel).catch(() => {});
      }
    }

    // SUPPRESSION
    if (
      oldState.channel &&
      oldState.channel.members.size === 0 &&
      oldState.channel.name.startsWith("・") &&
      !TEMPLATE_VC_IDS.includes(oldState.channel.id)
    ) {
      setTimeout(() => {
        if (
          oldState.channel &&
          oldState.channel.members.size === 0 &&
          !TEMPLATE_VC_IDS.includes(oldState.channel.id)
        ) {
          oldState.channel.delete().catch(() => {});
        }
      }, 1500);
    }
  }
};
