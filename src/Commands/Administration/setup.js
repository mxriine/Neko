const { 
  ApplicationCommandOptionType, 
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags
} = require("discord.js");
const config = require('../../../config/bot.config');
const { createTicketMenu } = require('../../Assets/SelectMenu/TicketMenu');

module.exports = {
  name: "setup",
  category: "administration",
  permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: "setup <type> <#salon>",
  examples: ["setup announces #annonces", "setup logs #logs", "setup welcome #bienvenue"],
  description: "Configure les salons du serveur",

  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure les salons du serveur")
    .addStringOption(option =>
      option.setName("type")
        .setDescription("Type de configuration")
        .setRequired(true)
        .addChoices(
          { name: "Annonces", value: "announces" },
          { name: "Logs", value: "logs" },
          { name: "Welcome", value: "welcome" },
          { name: "Bye", value: "bye" },
          { name: "Tickets", value: "tickets" },
          { name: "Level", value: "level" },
          { name: "Modération", value: "moderation" }
        )
    )
    .addChannelOption(option =>
      option.setName("salon")
        .setDescription("Le salon à configurer")
        .setRequired(true)
    )
    .addChannelOption(option =>
      option.setName("categorie")
        .setDescription("Catégorie pour les tickets (requis si type=tickets)")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName("role_support")
        .setDescription("Rôle du support (optionnel pour tickets)")
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName("logs")
        .setDescription("Salon des logs de tickets (optionnel)")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (message, client, args) => {
    const type = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first();

    if (!type || !channel) {
      return message.reply("Usage : `setup <type> <#salon>`\nTypes : announces, logs, welcome, bye, tickets, level, moderation");
    }

    const validTypes = ["announces", "logs", "welcome", "bye", "tickets", "level", "moderation"];
    if (!validTypes.includes(type)) {
      return message.reply("Type invalide. Types disponibles : " + validTypes.join(", "));
    }

    // Map type to database field
    const fieldMap = {
      announces: "announcesChannel",
      logs: "logsChannel",
      welcome: "welcomeChannel",
      bye: "byeChannel",
      tickets: "ticketChannel",
      level: "levelChannel",
      moderation: "modLogChannel"
    };

    const enabledMap = {
      announces: "announcesEnabled",
      logs: "logsEnabled",
      welcome: "welcomeEnabled",
      bye: "byeEnabled",
      tickets: "ticketEnabled",
      level: "levelEnabled",
      moderation: "modEnabled"
    };

    await client.updateGuild(guildSettings.id, {
      [fieldMap[type]]: channel.id,
      [enabledMap[type]]: true
    });

    return message.reply(`✅ Salon **${type}** configuré sur ${channel}`);
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    const type = interaction.options.getString("type");
    const channel = interaction.options.getChannel("salon");

    // Configuration spéciale pour les tickets
    if (type === "tickets") {
      const category = interaction.options.getChannel("categorie");
      const supportRole = interaction.options.getRole("role_support");
      const logsChannel = interaction.options.getChannel("logs");

      if (!category) {
        return interaction.reply({
          content: '❌ Une catégorie est requise pour configurer les tickets !',
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        // Mettre à jour la BDD
        await client.prisma.guild.update({
          where: { id: interaction.guild.id },
          data: {
            ticketEnabled: true,
            ticketChannel: channel.id,
            ticketCategory: category.id,
            ticketRoleSupport: supportRole?.id || null,
            ticketLogs: logsChannel?.id || null
          }
        });

        // Créer l'embed du panel
        const panelEmbed = new EmbedBuilder()
          .setColor(0x202225)
          .setTitle('・HELP SUPPORT')
          .setDescription(
            '**Comment pouvons-nous vous aider ?**\n' +
            'Si vous avez besoin d\'aide concernant le serveur, sélectionnez une option dans le menu ci-dessous !'
          )
          .setImage('https://cdn.discordapp.com/attachments/1062345825004572743/1097994372638855318/Capture_decran_2023-04-18_231656.png')
          .setFooter({ text: '・Support' });

        // Menu pour créer un ticket
        const ticketMenu = createTicketMenu();

        // Envoyer le panel
        await channel.send({
          embeds: [panelEmbed],
          components: [ticketMenu]
        });

        // Confirmation
        await interaction.reply({
          content: `✅ Système de tickets configuré avec succès !\n` +
                   `📍 Panel: ${channel}\n` +
                   `📁 Catégorie: ${category}\n` +
                   (supportRole ? `👥 Support: ${supportRole}\n` : '') +
                   (logsChannel ? `📋 Logs: ${logsChannel}` : ''),
          flags: MessageFlags.Ephemeral
        });

      } catch (error) {
        console.error('Erreur setup tickets:', error);
        await interaction.reply({
          content: '❌ Une erreur est survenue lors de la configuration.',
          flags: MessageFlags.Ephemeral
        });
      }
      return;
    }

    // Configuration standard pour les autres types
    const fieldMap = {
      announces: "announcesChannel",
      logs: "logsChannel",
      welcome: "welcomeChannel",
      bye: "byeChannel",
      level: "levelChannel",
      moderation: "modLogChannel"
    };

    const enabledMap = {
      announces: "announcesEnabled",
      logs: "logsEnabled",
      welcome: "welcomeEnabled",
      bye: "byeEnabled",
      level: "levelEnabled",
      moderation: "modEnabled"
    };

    try {
      await client.prisma.guild.update({
        where: { id: interaction.guild.id },
        data: {
          [fieldMap[type]]: channel.id,
          [enabledMap[type]]: true
        }
      });

      return interaction.reply({
        content: `✅ Salon **${type}** configuré sur ${channel}`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Erreur setup:', error);
      return interaction.reply({
        content: '❌ Une erreur est survenue lors de la configuration.',
        flags: MessageFlags.Ephemeral
      });
    }
  },
};
