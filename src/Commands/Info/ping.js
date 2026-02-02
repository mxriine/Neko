const { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  category: "info",
  permissions: PermissionFlagsBits.KickMembers,
  ownerOnly: false,
  usage: "ping",
  examples: ["ping"],
  description: "Affiche le ping du bot",

  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Affiche le ping du bot"),

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (message, client) => {
    const tempMsg = await message.channel.send(
      "On essaie de pong. . . un instant *!*"
    );

    const embed = new EmbedBuilder()
      .setColor(0x202225)
      .setTitle("🏓 Pong !")
      .setDescription("Affiche le ping du bot")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        {
          name: "Latence API",
          value: `\`\`\`${client.ws.ping}ms\`\`\``,
          inline: true,
        },
        {
          name: "Latence BOT",
          value: `\`\`\`${Math.abs(
            tempMsg.createdTimestamp - message.createdTimestamp
          )}ms\`\`\``,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      });

    await tempMsg.edit({ content: " ", embeds: [embed] });
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    await interaction.deferReply();

    const embed = new EmbedBuilder()
      .setColor(0x202225)
      .setTitle("🏓 Pong !")
      .setDescription("Affiche le ping du bot")
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        {
          name: "Latence API",
          value: `\`\`\`${client.ws.ping}ms\`\`\``,
          inline: true,
        },
        {
          name: "Latence BOT",
          value: `\`\`\`${Date.now() - interaction.createdTimestamp}ms\`\`\``,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
