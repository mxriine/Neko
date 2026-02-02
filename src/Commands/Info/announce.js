const {
  PermissionFlagsBits,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  name: "announce",
  category: "info",
  permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: "announce <message>",
  examples: ["announce Serveur en maintenance"],
  description: "Envoie une annonce dans le salon",

  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Envoie une annonce dans le salon")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Le message de l'annonce")
        .setRequired(true)
    ),

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (client, message, args) => {
    if (!args.length) {
      return message.reply("Vous devez fournir un message d'annonce.");
    }

    const content = args.join(" ");

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📢 Annonce")
      .setDescription(content)
      .setTimestamp()
      .setFooter({
        text: `Par ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      });

    await message.delete().catch(() => {});
    return message.channel.send({ embeds: [embed] });
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    const content = interaction.options.getString("message");

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📢 Annonce")
      .setDescription(content)
      .setTimestamp()
      .setFooter({
        text: `Par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.reply({ content: "Annonce envoyée !", ephemeral: true });
    return interaction.channel.send({ embeds: [embed] });
  },
};
