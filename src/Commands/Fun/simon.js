const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Stockage des parties en cours
const activeGames = new Map();

const COLORS = {
  red: { emoji: '🔴', style: ButtonStyle.Danger },
  blue: { emoji: '🔵', style: ButtonStyle.Primary },
  green: { emoji: '🟢', style: ButtonStyle.Success },
  yellow: { emoji: '🟡', style: ButtonStyle.Secondary }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('simon')
    .setDescription('🎮 Jeu de mémoire Simon - Reproduis la séquence !'),

  async runSlash(client, interaction) {
    try {
      const gameKey = `${interaction.user.id}-${interaction.channelId}`;

      // Vérifier si l'utilisateur a déjà une partie en cours
      if (activeGames.has(gameKey)) {
        return interaction.reply({
          content: '❌ Tu as déjà une partie en cours dans ce salon !',
          ephemeral: true
        });
      }

      // Créer la première séquence
      const colorKeys = Object.keys(COLORS);
      const firstColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];

      const gameData = {
        sequence: [firstColor],
        playerSequence: [],
        level: 1,
        userId: interaction.user.id,
        isShowingSequence: true,
        startTime: Date.now()
      };

      activeGames.set(gameKey, gameData);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('🎮 Simon - Jeu de Mémoire')
        .setDescription('**Mémorise la séquence de couleurs !**\n\nLa séquence va s\'afficher dans 2 secondes...')
        .addFields(
          { name: '📊 Niveau', value: '1', inline: true },
          { name: '🎯 Séquence', value: '1 couleur', inline: true }
        )
        .setFooter({ text: 'Observe bien et reproduis la séquence !' })
        .setTimestamp();

      const buttons = createGameButtons(gameKey, true);

      await interaction.reply({
        embeds: [embed],
        components: buttons
      });

      // Attendre 2 secondes puis montrer la séquence
      setTimeout(() => showSequence(client, interaction, gameKey), 2000);

    } catch (error) {
      console.error('Erreur simon:', error);
      return interaction.reply({
        content: '❌ Une erreur est survenue.',
        ephemeral: true
      });
    }
  }
};

function createGameButtons(gameKey, disabled = false) {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`simon_${gameKey}_red`)
        .setLabel(COLORS.red.emoji)
        .setStyle(COLORS.red.style)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`simon_${gameKey}_blue`)
        .setLabel(COLORS.blue.emoji)
        .setStyle(COLORS.blue.style)
        .setDisabled(disabled)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`simon_${gameKey}_green`)
        .setLabel(COLORS.green.emoji)
        .setStyle(COLORS.green.style)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`simon_${gameKey}_yellow`)
        .setLabel(COLORS.yellow.emoji)
        .setStyle(COLORS.yellow.style)
        .setDisabled(disabled)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`simon_${gameKey}_quit`)
        .setLabel('❌ Abandonner')
        .setStyle(ButtonStyle.Danger)
    );

  return [row1, row2, row3];
}

async function showSequence(client, interaction, gameKey) {
  const gameData = activeGames.get(gameKey);
  if (!gameData) return;

  const reply = await interaction.fetchReply().catch(() => null);
  if (!reply) return;

  // Afficher chaque couleur de la séquence
  for (let i = 0; i < gameData.sequence.length; i++) {
    const color = gameData.sequence[i];
    
    const embed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle('🎮 Simon - Jeu de Mémoire')
      .setDescription(`**👀 Observe la séquence !**\n\n${COLORS[color].emoji} **${color.toUpperCase()}** ${COLORS[color].emoji}`)
      .addFields(
        { name: '📊 Niveau', value: `${gameData.level}`, inline: true },
        { name: '🎯 Position', value: `${i + 1}/${gameData.sequence.length}`, inline: true }
      )
      .setTimestamp();

    await reply.edit({
      embeds: [embed],
      components: createGameButtons(gameKey, true)
    }).catch(() => null);

    await new Promise(resolve => setTimeout(resolve, 800));
  }

  // Passer en mode joueur
  gameData.isShowingSequence = false;
  gameData.playerSequence = [];

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🎮 Simon - Jeu de Mémoire')
    .setDescription('**À toi de jouer !**\n\nReproduis la séquence que tu as vue.')
    .addFields(
      { name: '📊 Niveau', value: `${gameData.level}`, inline: true },
      { name: '🎯 Progression', value: `0/${gameData.sequence.length}`, inline: true }
    )
    .setFooter({ text: 'Clique sur les couleurs dans le bon ordre !' })
    .setTimestamp();

  await reply.edit({
    embeds: [embed],
    components: createGameButtons(gameKey, false)
  }).catch(() => null);
}

async function handleButtonClick(client, interaction, gameKey, color) {
  const gameData = activeGames.get(gameKey);

  if (!gameData) {
    return interaction.reply({
      content: '❌ Cette partie n\'existe plus.',
      ephemeral: true
    });
  }

  if (gameData.userId !== interaction.user.id) {
    return interaction.reply({
      content: '❌ Ce n\'est pas ta partie !',
      ephemeral: true
    });
  }

  if (color === 'quit') {
    activeGames.delete(gameKey);
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🎮 Simon - Abandonné')
      .setDescription(`Tu as atteint le niveau **${gameData.level}** !`)
      .setTimestamp();

    return interaction.update({
      embeds: [embed],
      components: []
    });
  }

  if (gameData.isShowingSequence) {
    return interaction.reply({
      content: '⏳ Attends que la séquence se termine !',
      ephemeral: true
    });
  }

  // Ajouter la couleur à la séquence du joueur
  gameData.playerSequence.push(color);

  // Vérifier si c'est correct
  const currentIndex = gameData.playerSequence.length - 1;
  if (gameData.sequence[currentIndex] !== color) {
    // ERREUR !
    activeGames.delete(gameKey);
    const timeTaken = Math.round((Date.now() - gameData.startTime) / 1000);
    
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('💀 Perdu !')
      .setDescription(`Tu as fait une erreur !\n\n**Niveau atteint:** ${gameData.level}\n**Temps:** ${timeTaken}s\n\n**Séquence correcte:**\n${gameData.sequence.map(c => COLORS[c].emoji).join(' ')}`)
      .setTimestamp();

    return interaction.update({
      embeds: [embed],
      components: []
    });
  }

  // Mettre à jour l'affichage
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🎮 Simon - Jeu de Mémoire')
    .setDescription(`**À toi de jouer !**\n\n${gameData.playerSequence.map(c => COLORS[c].emoji).join(' ')}`)
    .addFields(
      { name: '📊 Niveau', value: `${gameData.level}`, inline: true },
      { name: '🎯 Progression', value: `${gameData.playerSequence.length}/${gameData.sequence.length}`, inline: true }
    )
    .setFooter({ text: 'Continue la séquence !' })
    .setTimestamp();

  await interaction.update({
    embeds: [embed],
    components: createGameButtons(gameKey, false)
  });

  // Vérifier si le joueur a complété la séquence
  if (gameData.playerSequence.length === gameData.sequence.length) {
    // Niveau réussi !
    gameData.level++;
    const colorKeys = Object.keys(COLORS);
    const newColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    gameData.sequence.push(newColor);
    gameData.playerSequence = [];
    gameData.isShowingSequence = true;

    // Afficher un message de succès
    const successEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✨ Niveau réussi !')
      .setDescription(`**Bravo !** Tu passes au niveau **${gameData.level}**\n\nLa nouvelle séquence va s'afficher...`)
      .addFields(
        { name: '📊 Niveau', value: `${gameData.level}`, inline: true },
        { name: '🎯 Longueur', value: `${gameData.sequence.length} couleurs`, inline: true }
      )
      .setTimestamp();

    const reply = await interaction.fetchReply();
    await reply.edit({
      embeds: [successEmbed],
      components: createGameButtons(gameKey, true)
    });

    // Montrer la nouvelle séquence après 2 secondes
    setTimeout(() => showSequence(client, interaction, gameKey), 2000);
  }
}

module.exports.handleButtonClick = handleButtonClick;
module.exports.activeGames = activeGames;
