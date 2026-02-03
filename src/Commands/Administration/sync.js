const { 
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

module.exports = {
  name: "sync",
  category: "administration",
  permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: "sync members",
  examples: ["sync members"],
  description: "Synchronise les données du serveur avec la base de données",

  data: new SlashCommandBuilder()
    .setName("sync")
    .setDescription("Synchronise les données du serveur avec la base de données")
    .addSubcommand(subcommand =>
      subcommand
        .setName("members")
        .setDescription("Synchronise tous les membres du serveur avec la base de données")
    ),

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (message, client, args) => {
    const subcommand = args[0]?.toLowerCase();
    
    if (subcommand !== 'members') {
      return message.reply("Usage: `sync members`");
    }

    const msg = await message.reply("🔄 Synchronisation en cours...");

    try {
      // Récupérer tous les membres du serveur
      const members = await message.guild.members.fetch();
      
      // Récupérer tous les utilisateurs de ce serveur dans la BDD
      const dbUsers = await client.prisma.user.findMany({
        where: { guildId: message.guild.id }
      });

      let updated = 0;
      let created = 0;
      let marked = 0;

      // Mettre à jour les membres présents
      for (const [memberId, member] of members) {
        if (member.user.bot) continue; // Ignorer les bots

        const result = await client.prisma.user.upsert({
          where: {
            discordId_guildId: {
              discordId: member.user.id,
              guildId: message.guild.id
            }
          },
          update: {
            inGuild: true,
            leftAt: null,
            username: member.user.username
          },
          create: {
            discordId: member.user.id,
            username: member.user.username,
            guildId: message.guild.id,
            inGuild: true
          }
        });

        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          created++;
        } else {
          updated++;
        }
      }

      // Marquer comme absents ceux qui ne sont plus sur le serveur
      const memberIds = Array.from(members.keys());
      for (const dbUser of dbUsers) {
        if (!memberIds.includes(dbUser.discordId) && dbUser.inGuild) {
          await client.prisma.user.update({
            where: {
              discordId_guildId: {
                discordId: dbUser.discordId,
                guildId: message.guild.id
              }
            },
            data: {
              inGuild: false,
              leftAt: new Date()
            }
          });
          marked++;
        }
      }

      return msg.edit(
        `✅ Synchronisation terminée !\n` +
        `📊 Statistiques :\n` +
        `• Membres mis à jour : **${updated}**\n` +
        `• Nouveaux membres : **${created}**\n` +
        `• Marqués comme absents : **${marked}**\n` +
        `• Total : **${members.size - 1}** membres (bots exclus)`
      );

    } catch (error) {
      console.error('Erreur sync members:', error);
      return msg.edit("❌ Une erreur est survenue lors de la synchronisation.");
    }
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'members') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      try {
        // Récupérer tous les membres du serveur
        const members = await interaction.guild.members.fetch();
        
        // Récupérer tous les utilisateurs de ce serveur dans la BDD
        const dbUsers = await client.prisma.user.findMany({
          where: { guildId: interaction.guild.id }
        });

        let updated = 0;
        let created = 0;
        let marked = 0;

        // Mettre à jour les membres présents
        for (const [memberId, member] of members) {
          if (member.user.bot) continue; // Ignorer les bots

          const existingUser = dbUsers.find(
            u => u.discordId === member.user.id
          );

          const result = await client.prisma.user.upsert({
            where: {
              discordId_guildId: {
                discordId: member.user.id,
                guildId: interaction.guild.id
              }
            },
            update: {
              inGuild: true,
              leftAt: null,
              username: member.user.username
            },
            create: {
              discordId: member.user.id,
              username: member.user.username,
              guildId: interaction.guild.id,
              inGuild: true
            }
          });

          if (!existingUser) {
            created++;
          } else if (!existingUser.inGuild) {
            updated++;
          }
        }

        // Marquer comme absents ceux qui ne sont plus sur le serveur
        const memberIds = Array.from(members.keys());
        for (const dbUser of dbUsers) {
          if (!memberIds.includes(dbUser.discordId) && dbUser.inGuild) {
            await client.prisma.user.update({
              where: {
                discordId_guildId: {
                  discordId: dbUser.discordId,
                  guildId: interaction.guild.id
                }
              },
              data: {
                inGuild: false,
                leftAt: new Date()
              }
            });
            marked++;
          }
        }

        return interaction.editReply(
          `✅ Synchronisation terminée !\n\n` +
          `📊 **Statistiques :**\n` +
          `• Membres mis à jour : **${updated}**\n` +
          `• Nouveaux membres : **${created}**\n` +
          `• Marqués comme absents : **${marked}**\n` +
          `• Total : **${members.size - 1}** membres (bots exclus)`
        );

      } catch (error) {
        console.error('Erreur sync members:', error);
        return interaction.editReply("❌ Une erreur est survenue lors de la synchronisation.");
      }
    }
  },
};
