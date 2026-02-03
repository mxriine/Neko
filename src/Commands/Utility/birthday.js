const { 
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags
} = require("discord.js");
const config = require('../../../config/bot.config');

module.exports = {
  name: "birthday",
  category: "utility",
  permissions: [],
  ownerOnly: false,
  usage: "birthday <set/remove/info> [date]",
  examples: ["birthday set 15/03/2000", "birthday info", "birthday remove"],
  description: "Gère ton anniversaire sur le serveur",

  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Gère ton anniversaire sur le serveur")
    .addSubcommand(subcommand =>
      subcommand
        .setName("set")
        .setDescription("Définir ta date d'anniversaire")
        .addStringOption(option =>
          option.setName("date")
            .setDescription("Ta date de naissance (format: JJ/MM/AAAA)")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("info")
        .setDescription("Voir ta date d'anniversaire")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("remove")
        .setDescription("Supprimer ta date d'anniversaire")
    ),

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (message, client, args) => {
    const subcommand = args[0]?.toLowerCase();
    
    if (!subcommand || !['set', 'info', 'remove'].includes(subcommand)) {
      return message.reply("Usage: `birthday <set/remove/info> [date]`\nExemple: `birthday set 15/03/2000`");
    }

    if (subcommand === 'set') {
      const dateStr = args[1];
      if (!dateStr) {
        return message.reply("Merci de fournir une date au format JJ/MM/AAAA\nExemple: `birthday set 15/03/2000`");
      }

      // Valider et parser la date
      const result = parseBirthday(dateStr);
      if (!result.valid) {
        return message.reply(`❌ ${result.error}`);
      }

      try {
        // Enregistrer dans la base de données
        await client.prisma.user.upsert({
          where: {
            discordId_guildId: {
              discordId: message.author.id,
              guildId: message.guild.id
            }
          },
          update: {
            birthday: result.formatted
          },
          create: {
            discordId: message.author.id,
            username: message.author.username,
            guildId: message.guild.id,
            birthday: result.formatted
          }
        });

        return message.reply(`🎂 Ta date d'anniversaire a été enregistrée : **${result.displayDate}**\nTu auras **${result.nextAge} ans** lors de ton prochain anniversaire !`);
      } catch (error) {
        console.error('Erreur birthday set:', error);
        return message.reply("❌ Une erreur est survenue lors de l'enregistrement.");
      }
    }

    if (subcommand === 'info') {
      try {
        const user = await client.prisma.user.findUnique({
          where: {
            discordId_guildId: {
              discordId: message.author.id,
              guildId: message.guild.id
            }
          }
        });

        if (!user || !user.birthday) {
          return message.reply("❌ Tu n'as pas encore défini ta date d'anniversaire.\nUtilise `birthday set JJ/MM/AAAA`");
        }

        const info = getBirthdayInfo(user.birthday);
        const embed = new EmbedBuilder()
          .setColor(config.colors.birthday || 0xFF69B4)
          .setTitle("🎂 Ton anniversaire")
          .setDescription(
            `📅 **Date :** ${info.displayDate}\n` +
            `🎉 **Âge actuel :** ${info.currentAge} ans\n` +
            `⏰ **Prochain anniversaire :** ${info.daysUntil === 0 ? "Aujourd'hui ! 🎉" : `Dans ${info.daysUntil} jour${info.daysUntil > 1 ? 's' : ''}`}`
          )
          .setFooter({ text: `Tu auras ${info.nextAge} ans !` })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur birthday info:', error);
        return message.reply("❌ Une erreur est survenue.");
      }
    }

    if (subcommand === 'remove') {
      try {
        const user = await client.prisma.user.findUnique({
          where: {
            discordId_guildId: {
              discordId: message.author.id,
              guildId: message.guild.id
            }
          }
        });

        if (!user || !user.birthday) {
          return message.reply("❌ Tu n'as pas de date d'anniversaire enregistrée.");
        }

        await client.prisma.user.update({
          where: {
            discordId_guildId: {
              discordId: message.author.id,
              guildId: message.guild.id
            }
          },
          data: {
            birthday: null
          }
        });

        return message.reply("✅ Ta date d'anniversaire a été supprimée.");
      } catch (error) {
        console.error('Erreur birthday remove:', error);
        return message.reply("❌ Une erreur est survenue.");
      }
    }
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      const dateStr = interaction.options.getString("date");

      // Valider et parser la date
      const result = parseBirthday(dateStr);
      if (!result.valid) {
        return interaction.reply({
          content: `❌ ${result.error}`,
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        // Enregistrer dans la base de données
        await client.prisma.user.upsert({
          where: {
            discordId_guildId: {
              discordId: interaction.user.id,
              guildId: interaction.guild.id
            }
          },
          update: {
            birthday: result.formatted
          },
          create: {
            discordId: interaction.user.id,
            username: interaction.user.username,
            guildId: interaction.guild.id,
            birthday: result.formatted
          }
        });

        return interaction.reply({
          content: `🎂 Ta date d'anniversaire a été enregistrée : **${result.displayDate}**\nTu auras **${result.nextAge} ans** lors de ton prochain anniversaire !`,
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error('Erreur birthday set:', error);
        return interaction.reply({
          content: "❌ Une erreur est survenue lors de l'enregistrement.",
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (subcommand === 'info') {
      try {
        const user = await client.prisma.user.findUnique({
          where: {
            discordId_guildId: {
              discordId: interaction.user.id,
              guildId: interaction.guild.id
            }
          }
        });

        if (!user || !user.birthday) {
          return interaction.reply({
            content: "❌ Tu n'as pas encore défini ta date d'anniversaire.\nUtilise `/birthday set JJ/MM/AAAA`",
            flags: MessageFlags.Ephemeral
          });
        }

        const info = getBirthdayInfo(user.birthday);
        const embed = new EmbedBuilder()
          .setColor(config.colors.birthday || 0xFF69B4)
          .setTitle("🎂 Ton anniversaire")
          .setDescription(
            `📅 **Date :** ${info.displayDate}\n` +
            `🎉 **Âge actuel :** ${info.currentAge} ans\n` +
            `⏰ **Prochain anniversaire :** ${info.daysUntil === 0 ? "Aujourd'hui ! 🎉" : `Dans ${info.daysUntil} jour${info.daysUntil > 1 ? 's' : ''}`}`
          )
          .setFooter({ text: `Tu auras ${info.nextAge} ans !` })
          .setTimestamp();

        return interaction.reply({ 
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error('Erreur birthday info:', error);
        return interaction.reply({
          content: "❌ Une erreur est survenue.",
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (subcommand === 'remove') {
      try {
        const user = await client.prisma.user.findUnique({
          where: {
            discordId_guildId: {
              discordId: interaction.user.id,
              guildId: interaction.guild.id
            }
          }
        });

        if (!user || !user.birthday) {
          return interaction.reply({
            content: "❌ Tu n'as pas de date d'anniversaire enregistrée.",
            flags: MessageFlags.Ephemeral
          });
        }

        await client.prisma.user.update({
          where: {
            discordId_guildId: {
              discordId: interaction.user.id,
              guildId: interaction.guild.id
            }
          },
          data: {
            birthday: null
          }
        });

        return interaction.reply({
          content: "✅ Ta date d'anniversaire a été supprimée.",
          flags: MessageFlags.Ephemeral
        });
      } catch (error) {
        console.error('Erreur birthday remove:', error);
        return interaction.reply({
          content: "❌ Une erreur est survenue.",
          flags: MessageFlags.Ephemeral
        });
      }
    }
  },
};

// ————————————————————————————————————————
// HELPER FUNCTIONS
// ————————————————————————————————————————

/**
 * Parse et valide une date d'anniversaire
 * @param {string} dateStr - Format JJ/MM/AAAA
 * @returns {Object} { valid, formatted, displayDate, nextAge, error }
 */
function parseBirthday(dateStr) {
  // Format attendu: JJ/MM/AAAA
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(regex);

  if (!match) {
    return { 
      valid: false, 
      error: "Format invalide. Utilise le format JJ/MM/AAAA (ex: 15/03/2000)" 
    };
  }

  const [, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  // Vérifications basiques
  if (m < 1 || m > 12) {
    return { valid: false, error: "Mois invalide (1-12)" };
  }

  if (d < 1 || d > 31) {
    return { valid: false, error: "Jour invalide (1-31)" };
  }

  // Vérifier que la date est valide
  const date = new Date(y, m - 1, d);
  if (date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) {
    return { valid: false, error: "Date invalide" };
  }

  // Vérifier que la date n'est pas dans le futur
  if (date > new Date()) {
    return { valid: false, error: "La date de naissance ne peut pas être dans le futur" };
  }

  // Vérifier que l'âge est raisonnable (< 120 ans)
  const age = new Date().getFullYear() - y;
  if (age < 0 || age > 120) {
    return { valid: false, error: "Âge invalide" };
  }

  // Format pour la base de données: AAAA-MM-DD
  const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  
  // Format d'affichage: JJ/MM/AAAA
  const displayDate = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;

  // Calculer l'âge au prochain anniversaire
  const nextAge = calculateNextAge(date);

  return {
    valid: true,
    formatted,
    displayDate,
    nextAge
  };
}

/**
 * Calcule l'âge au prochain anniversaire
 */
function calculateNextAge(birthDate) {
  const today = new Date();
  const thisYear = today.getFullYear();
  const birthdayThisYear = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
  
  if (today >= birthdayThisYear) {
    return thisYear - birthDate.getFullYear() + 1;
  } else {
    return thisYear - birthDate.getFullYear();
  }
}

/**
 * Obtient les informations sur un anniversaire
 */
function getBirthdayInfo(birthdayStr) {
  // Format en DB: AAAA-MM-DD
  const [year, month, day] = birthdayStr.split('-').map(Number);
  const birthDate = new Date(year, month - 1, day);
  
  const today = new Date();
  const currentAge = today.getFullYear() - year;
  const nextAge = calculateNextAge(birthDate);
  
  // Calculer les jours jusqu'au prochain anniversaire
  const thisYear = today.getFullYear();
  let nextBirthday = new Date(thisYear, month - 1, day);
  
  if (nextBirthday < today) {
    nextBirthday = new Date(thisYear + 1, month - 1, day);
  }
  
  const diffTime = nextBirthday - today;
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    displayDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
    currentAge,
    nextAge,
    daysUntil: daysUntil === 1 && today.getDate() === day && today.getMonth() === month - 1 ? 0 : daysUntil
  };
}
