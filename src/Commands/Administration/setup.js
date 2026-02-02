const { 
  ApplicationCommandOptionType, 
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder 
} = require("discord.js");

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
    const guildSettings = await client.getGuild(interaction.guild.id, interaction.guild.name);

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

    return interaction.reply(`✅ Salon **${type}** configuré sur ${channel}`);
  },
};
