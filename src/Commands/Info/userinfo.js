const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  name: "userinfo",
  category: "info",
  permissions: PermissionFlagsBits.KickMembers,
  ownerOnly: false,
  usage: "userinfo [@user]",
  examples: ["userinfo @user", "userinfo 123456789012345678", "userinfo"],
  description: "Affiche les informations d'un utilisateur",

  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Affiche les informations d'un utilisateur")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("L'utilisateur à afficher")
        .setRequired(false)
    ),

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (client, message, args) => {
    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]) ||
      message.member;

    if (!member) {
      return message.reply("Impossible de trouver cet utilisateur.");
    }

    const roles = member.roles.cache
      .filter((r) => r.id !== message.guild.id)
      .map((r) => r.toString())
      .join(", ");

    const embed = new EmbedBuilder()
      .setColor(0x202225)
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`<@${member.id}>`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "ID",
          value: `${member.id}`,
          inline: false,
        },
        {
          name: "Créé le",
          value: `<t:${Math.floor(
            member.user.createdTimestamp / 1000
          )}:f> (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`,
          inline: false,
        },
        {
          name: "Rejoint le",
          value: `<t:${Math.floor(
            member.joinedTimestamp / 1000
          )}:f> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
          inline: false,
        },
        {
          name: "Modérateur",
          value: member.kickable ? "Non" : "Oui",
          inline: true,
        },
        {
          name: "Bot",
          value: member.user.bot ? "Oui" : "Non",
          inline: true,
        },
        {
          name: `Rôles [${member.roles.cache.size - 1}]`,
          value: roles || "Aucun rôle",
          inline: false,
        }
      )
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    const user = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    if (!member) {
      return interaction.reply({
        content: "Impossible de trouver cet utilisateur.",
        ephemeral: true,
      });
    }

    const roles = member.roles.cache
      .filter((r) => r.id !== interaction.guild.id)
      .map((r) => r.toString())
      .join(", ");

    const embed = new EmbedBuilder()
      .setColor(0x202225)
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`<@${member.id}>`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "ID",
          value: `${member.id}`,
          inline: false,
        },
        {
          name: "Créé le",
          value: `<t:${Math.floor(
            member.user.createdTimestamp / 1000
          )}:f> (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`,
          inline: false,
        },
        {
          name: "Rejoint le",
          value: `<t:${Math.floor(
            member.joinedTimestamp / 1000
          )}:f> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
          inline: false,
        },
        {
          name: "Modérateur",
          value: member.kickable ? "Non" : "Oui",
          inline: true,
        },
        {
          name: "Bot",
          value: member.user.bot ? "Oui" : "Non",
          inline: true,
        },
        {
          name: `Rôles [${member.roles.cache.size - 1}]`,
          value: roles || "Aucun rôle",
          inline: false,
        }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
