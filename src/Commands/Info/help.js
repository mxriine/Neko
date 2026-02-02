const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  name: "help",
  category: "info",
  permissions: PermissionFlagsBits.SendMessages,
  ownerOnly: false,
  usage: "help [commande]",
  examples: ["help", "help say"],
  description: "Affiche l'aide générale ou celle d'une commande précise",

  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche l'aide générale ou celle d'une commande précise")
    .addStringOption(option =>
      option.setName("commande")
        .setDescription("La commande dont vous voulez voir l'aide")
        .setRequired(false)
        .setAutocomplete(true)
    ),

  // ————————————————————————————————————————
  // AUTOCOMPLETE
  // ————————————————————————————————————————
  autocompleteRun: async (interaction) => {
    const client = interaction.client;
    const focused = interaction.options.getFocused();
    
    const commands = Array.from(client.commands.values())
      .filter(cmd => cmd.name.toLowerCase().startsWith(focused.toLowerCase()))
      .slice(0, 25);

    await interaction.respond(
      commands.map(cmd => ({
        name: cmd.name,
        value: cmd.name,
      }))
    );
  },

  // ————————————————————————————————————————
  // PREFIX VERSION
  // ————————————————————————————————————————
  run: async (message, client, args) => {
    const query = args[0]?.toLowerCase() || null;

    // Si l'utilisateur demande une commande spécifique
    if (query) {
      const cmd = client.commands.get(query);

      if (!cmd) {
        return message.reply(`❌ La commande \`${query}\` est introuvable.`);
      }

      const prefix = guildSettings?.prefix || process.env.PREFIX || "!";

      const embed = new EmbedBuilder()
        .setColor(0x202225)
        .setAuthor({
          name: "Neko",
          iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setTitle(`Commande : ${cmd.name}`)
        .setDescription(`> ${cmd.description || "Pas de description."}`)
        .addFields(
          {
            name: "Utilisation",
            value: cmd.usage
              ? `\`\`\`${prefix}${cmd.usage}\`\`\``
              : "`Aucun usage spécifié.`"
          },
          {
            name: "Exemples",
            value: cmd.examples
              ? `\`\`\`${cmd.examples.map(x => `${prefix}${x}`).join("\n")}\`\`\``
              : "`Aucun exemple disponible.`"
          }
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

      return message.channel.send({ embeds: [embed] });
    }

    // Menu principal - Liste de toutes les commandes par catégorie
    const categories = {};
    
    client.commands.forEach(cmd => {
      const category = cmd.category || "Autre";
      if (!categories[category]) categories[category] = [];
      categories[category].push(cmd.name);
    });

    const prefix = guildSettings?.prefix || process.env.PREFIX || "!";
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Neko",
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setTitle("📚 Menu d'aide")
      .setDescription(
        `Utilisez \`${prefix}help <commande>\` pour plus d'informations sur une commande.\n` +
        `Ou utilisez \`/help <commande>\` en slash command.`
      )
      .setColor(0x202225)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

    // Ajouter chaque catégorie
    Object.keys(categories).sort().forEach(category => {
      const commands = categories[category].sort().join(", ");
      embed.addFields({
        name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
        value: `\`${commands}\``,
        inline: false,
      });
    });

    embed.setFooter({
      text: `Total: ${client.commands.size} commandes`,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });

    return message.channel.send({ embeds: [embed] });
  },

  // ————————————————————————————————————————
  // SLASH VERSION
  // ————————————————————————————————————————
  runSlash: async (client, interaction) => {
    const query = interaction.options.getString("commande");

    // Si l'utilisateur demande une commande spécifique
    if (query) {
      const cmd = client.commands.get(query);

      if (!cmd) {
        return interaction.reply({
          content: `❌ La commande \`${query}\` est introuvable.`,
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x202225)
        .setAuthor({
          name: "Neko",
          iconURL: client.user.displayAvatarURL({ dynamic: true })
        })
        .setTitle(`Commande : ${cmd.name}`)
        .setDescription(`> ${cmd.description || "Pas de description."}`)
        .addFields(
          {
            name: "Utilisation Prefix",
            value: cmd.usage
              ? `\`\`\`!${cmd.usage}\`\`\``
              : "`Pas de version prefix.`"
          },
          {
            name: "Utilisation Slash",
            value: cmd.data
              ? `\`\`\`/${cmd.name}\`\`\``
              : "`Pas de version slash.`"
          }
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

      if (cmd.examples) {
        embed.addFields({
          name: "Exemples",
          value: `\`\`\`${cmd.examples.map(x => `!${x}`).join("\n")}\`\`\``
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    // Menu principal - Liste de toutes les commandes par catégorie
    const categories = {};
    
    client.commands.forEach(cmd => {
      const category = cmd.category || "Autre";
      if (!categories[category]) categories[category] = [];
      categories[category].push(cmd.name);
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Neko",
        iconURL: client.user.displayAvatarURL({ dynamic: true }),
      })
      .setTitle("📚 Menu d'aide")
      .setDescription(
        "Utilisez `/help <commande>` pour plus d'informations sur une commande.\n" +
        "Ou utilisez `!help <commande>` en prefix."
      )
      .setColor(0x202225)
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

    // Ajouter chaque catégorie
    Object.keys(categories).sort().forEach(category => {
      const commands = categories[category].sort().join(", ");
      embed.addFields({
        name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
        value: `\`${commands}\``,
        inline: false,
      });
    });

    embed.setFooter({
      text: `Total: ${client.commands.size} commandes`,
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
    });

    return interaction.reply({ embeds: [embed] });
  },
};
