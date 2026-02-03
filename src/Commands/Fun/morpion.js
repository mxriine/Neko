const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Stockage des parties en cours
const activeGames = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('morpion')
    .setDescription('🎮 Jouer au morpion (Tic-Tac-Toe)')
    .addUserOption(option =>
      option.setName('adversaire')
        .setDescription('L\'adversaire (laisse vide pour jouer contre le bot)')
        .setRequired(false)
    ),

  async runSlash(client, interaction) {
    try {
      const opponent = interaction.options.getUser('adversaire');
      const gameKey = interaction.id;

      // Vérifier si l'adversaire est valide
      if (opponent && opponent.id === interaction.user.id) {
        return interaction.reply({
          content: 'Tu ne peux pas jouer contre toi-même !',
          ephemeral: true
        });
      }

      if (opponent && opponent.bot) {
        return interaction.reply({
          content: 'Tu ne peux pas jouer contre un autre bot !',
          ephemeral: true
        });
      }

      // Créer la partie
      const gameData = {
        player1: interaction.user.id,
        player2: opponent ? opponent.id : 'bot',
        currentPlayer: interaction.user.id,
        board: Array(9).fill(null),
        moveCount: 0,
        gameKey: gameKey
      };

      activeGames.set(gameKey, gameData);

      const embed = createGameEmbed(interaction, gameData, opponent);
      const buttons = createGameButtons(gameData);

      await interaction.reply({
        content: opponent ? `${opponent}, tu es défié au morpion par ${interaction.user} !` : null,
        embeds: [embed],
        components: buttons
      });

    } catch (error) {
      console.error('Erreur morpion:', error);
      return interaction.reply({
        content: 'Une erreur est survenue.',
        ephemeral: true
      });
    }
  }
};

function createGameEmbed(interaction, gameData, opponent) {
  const player1Symbol = '❌';
  const player2Symbol = '⭕';
  const currentSymbol = gameData.currentPlayer === gameData.player1 ? player1Symbol : player2Symbol;

  let description = `**Joueur 1:** <@${gameData.player1}> ${player1Symbol}\n`;
  if (gameData.player2 === 'bot') {
    description += `**Joueur 2:** Bot ${player2Symbol}\n\n`;
  } else {
    description += `**Joueur 2:** <@${gameData.player2}> ${player2Symbol}\n\n`;
  }

  description += `Tour de ${currentSymbol} <@${gameData.currentPlayer}>`;

  const embed = new EmbedBuilder()
    .setTitle('🎮 Morpion')
    .setDescription(description)
    .setFooter({ text: 'Clique sur une case pour jouer !' })
    .setTimestamp();

  return embed;
}

function createGameButtons(gameData) {
  const rows = [];

  // Créer 3 rangées de 3 boutons
  for (let i = 0; i < 3; i++) {
    const row = new ActionRowBuilder();
    for (let j = 0; j < 3; j++) {
      const index = i * 3 + j;
      const cell = gameData.board[index];
      
      let emoji = null;
      let label = `${index + 1}`;
      let style = ButtonStyle.Secondary;
      let disabled = false;

      if (cell === 'X') {
        emoji = '❌';
        label = 'X';
        disabled = true;
        style = ButtonStyle.Danger;
      } else if (cell === 'O') {
        emoji = '⭕';
        label = 'O';
        disabled = true;
        style = ButtonStyle.Primary;
      }

      const button = new ButtonBuilder()
        .setCustomId(`morpion_${gameData.gameKey}_${index}`)
        .setLabel(label)
        .setStyle(style)
        .setDisabled(disabled);

      if (emoji) {
        button.setEmoji(emoji);
      }

      row.addComponents(button);
    }
    rows.push(row);
  }

  // Bouton abandonner
  const quitRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`morpion_${gameData.gameKey}_quit`)
        .setLabel('❌ Abandonner')
        .setStyle(ButtonStyle.Danger)
    );

  rows.push(quitRow);

  return rows;
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Lignes
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colonnes
    [0, 4, 8], [2, 4, 6] // Diagonales
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function getBotMove(gameData) {
  const board = gameData.board;
  
  // Vérifier si le bot peut gagner
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'O';
      if (checkWinner(board) === 'O') {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // Vérifier si le joueur peut gagner et bloquer
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = 'X';
      if (checkWinner(board) === 'X') {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // Prendre le centre si disponible
  if (!board[4]) return 4;

  // Prendre un coin si disponible
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => !board[i]);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  // Prendre n'importe quelle case disponible
  const available = board.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
  return available[Math.floor(Math.random() * available.length)];
}

async function handleButtonClick(client, interaction, gameKey, position) {
  const gameData = activeGames.get(gameKey);

  if (!gameData) {
    return interaction.reply({
      content: 'Cette partie n\'existe plus.',
      ephemeral: true
    });
  }

  // Vérifier si c'est le tour du joueur
  if (gameData.currentPlayer !== interaction.user.id) {
    return interaction.reply({
      content: 'Ce n\'est pas ton tour !',
      ephemeral: true
    });
  }

  if (position === 'quit') {
    activeGames.delete(gameKey);
    const embed = new EmbedBuilder()
      .setTitle('🎮 Morpion - Abandonné')
      .setDescription(`<@${interaction.user.id}> a abandonné la partie.`)
      .setTimestamp();

    return interaction.update({
      embeds: [embed],
      components: []
    });
  }

  const pos = parseInt(position);

  // Placer le coup
  const symbol = gameData.currentPlayer === gameData.player1 ? 'X' : 'O';
  gameData.board[pos] = symbol;
  gameData.moveCount++;

  // Vérifier victoire
  const winner = checkWinner(gameData.board);
  if (winner) {
    activeGames.delete(gameKey);
    const winnerSymbol = winner === 'X' ? '❌' : '⭕';
    const embed = new EmbedBuilder()
      .setTitle('🎉 Victoire !')
      .setDescription(`${winnerSymbol} <@${gameData.currentPlayer}> a gagné !`)
      .setTimestamp();

    const finalButtons = createGameButtons(gameData);
    return interaction.update({
      embeds: [embed],
      components: finalButtons
    });
  }

  // Vérifier égalité
  if (gameData.moveCount === 9) {
    activeGames.delete(gameKey);
    const embed = new EmbedBuilder()
      .setTitle('🎮 Morpion - Égalité')
      .setDescription('Match nul ! Aucun joueur n\'a gagné.')
      .setTimestamp();

    return interaction.update({
      embeds: [embed],
      components: []
    });
  }

  // Changer de joueur
  if (gameData.player2 === 'bot') {
    // Tour du bot
    const botMove = getBotMove(gameData);
    gameData.board[botMove] = 'O';
    gameData.moveCount++;

    // Vérifier victoire du bot
    const botWinner = checkWinner(gameData.board);
    if (botWinner) {
      activeGames.delete(gameKey);
      const embed = new EmbedBuilder()
        .setTitle('Défaite !')
        .setDescription('⭕ Le bot a gagné !')
        .setTimestamp();

      const finalButtons = createGameButtons(gameData);
      return interaction.update({
        embeds: [embed],
        components: finalButtons
      });
    }

    // Vérifier égalité
    if (gameData.moveCount === 9) {
      activeGames.delete(gameKey);
      const embed = new EmbedBuilder()
        .setTitle('🎮 Morpion - Égalité')
        .setDescription('Match nul ! Aucun joueur n\'a gagné.')
        .setTimestamp();

      const finalButtons = createGameButtons(gameData);
      return interaction.update({
        embeds: [embed],
        components: finalButtons
      });
    }

    gameData.currentPlayer = gameData.player1;
  } else {
    gameData.currentPlayer = gameData.currentPlayer === gameData.player1 ? gameData.player2 : gameData.player1;
  }

  const embed = createGameEmbed(interaction, gameData);
  const buttons = createGameButtons(gameData);

  await interaction.update({
    embeds: [embed],
    components: buttons
  });
}

module.exports.handleButtonClick = handleButtonClick;
module.exports.activeGames = activeGames;
