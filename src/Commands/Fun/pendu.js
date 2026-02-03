const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

// Liste de mots pour le jeu
const WORDS = [
  'JAVASCRIPT', 'DISCORD', 'ORDINATEUR', 'PROGRAMMATION', 'CLAVIER',
  'SOURIS', 'ECRAN', 'INTERNET', 'SERVEUR', 'BOUTTON', 'MESSAGE',
  'REACTION', 'MEMBRE', 'ADMINISTRATEUR', 'MODERATION', 'EMOJI',
  'AVATAR', 'PSEUDO', 'VOCAL', 'SALON', 'CATEGORIE', 'ROLE',
  'PERMISSION', 'COMMANDE', 'PREFIX', 'WEBHOOK', 'INTEGRATION',
  'PYTHON', 'DATABASE', 'NODEJS', 'TYPESCRIPT', 'FRAMEWORK'
];

const PENDU_STAGES = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'
];

// Stockage temporaire des parties en cours
const activeGames = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pendu')
    .setDescription('🎮 Jouer au jeu du pendu'),

  async runSlash(client, interaction) {
    try {
      // Vérifier si l'utilisateur a déjà une partie en cours
      const gameKey = `${interaction.user.id}-${interaction.channelId}`;
      if (activeGames.has(gameKey)) {
        return interaction.reply({
          content: '❌ Tu as déjà une partie en cours dans ce salon !',
          flags: MessageFlags.Ephemeral
        });
      }

      // Choisir un mot aléatoire
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      const guessedLetters = [];
      const wrongGuesses = [];

      // Créer la partie
      const gameData = {
        word: word,
        guessedLetters: guessedLetters,
        wrongGuesses: wrongGuesses,
        userId: interaction.user.id,
        startTime: Date.now()
      };

      activeGames.set(gameKey, gameData);

      // Créer l'affichage initial
      const embed = createGameEmbed(gameData);

      await interaction.reply({
        embeds: [embed]
      });

      // Créer un collecteur pour les messages
      const filter = m => m.author.id === interaction.user.id && m.content.length === 1 && /^[A-Za-z]$/.test(m.content);
      const collector = interaction.channel.createMessageCollector({ 
        filter, 
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (message) => {
        const currentGame = activeGames.get(gameKey);
        if (!currentGame) {
          collector.stop();
          return;
        }

        const letter = message.content.toUpperCase();
        
        // Vérifier si la lettre a déjà été utilisée
        if (currentGame.guessedLetters.includes(letter) || currentGame.wrongGuesses.includes(letter)) {
          await message.react('❌');
          return;
        }

        await handleGuess(client, interaction, gameKey, letter, message, collector);
      });

      collector.on('end', () => {
        const game = activeGames.get(gameKey);
        if (game) {
          activeGames.delete(gameKey);
        }
      });

    } catch (error) {
      console.error('Erreur pendu:', error);
      return interaction.reply({
        content: '❌ Une erreur est survenue.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

function createGameEmbed(gameData) {
  const { word, guessedLetters, wrongGuesses } = gameData;
  
  // Afficher le mot avec les lettres trouvées en grand
  const displayWord = word
    .split('')
    .map(letter => guessedLetters.includes(letter) ? `\`${letter}\`` : '`_`')
    .join(' ');

  const stage = PENDU_STAGES[wrongGuesses.length];
  const wrongLettersDisplay = wrongGuesses.length > 0 
    ? wrongGuesses.map(l => `~~${l}~~`).join(' ') 
    : 'Aucune';

  const embed = new EmbedBuilder()
    .setColor(wrongGuesses.length >= 6 ? 0xFF0000 : 0x00FF00)
    .setTitle('🎮 Jeu du Pendu')
    .setDescription(`${stage}\n\n**Mot à trouver :**\n${displayWord}\n\n**Lettres incorrectes :** ${wrongLettersDisplay}\n**Essais restants :** ${7 - wrongGuesses.length}/7`)
    .setFooter({ text: 'Écris une lettre dans le chat pour deviner !' })
    .setTimestamp();

  return embed;
}

// Fonction pour gérer les propositions de lettres
async function handleGuess(client, interaction, gameKey, letter, message, collector) {
  const gameData = activeGames.get(gameKey);

  if (!gameData) {
    collector.stop();
    return;
  }

  // Vérifier si la lettre est dans le mot
  if (gameData.word.includes(letter)) {
    gameData.guessedLetters.push(letter);
    await message.react('✅');
  } else {
    gameData.wrongGuesses.push(letter);
    await message.react('❌');
  }

  // Vérifier si le joueur a gagné
  const allLettersFound = gameData.word.split('').every(l => gameData.guessedLetters.includes(l));
  
  if (allLettersFound) {
    activeGames.delete(gameKey);
    collector.stop();
    
    const timeTaken = Math.round((Date.now() - gameData.startTime) / 1000);
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🎉 Victoire !')
      .setDescription(`Bravo ! Tu as trouvé le mot : **${gameData.word}**\n\n**Temps :** ${timeTaken}s\n**Erreurs :** ${gameData.wrongGuesses.length}`)
      .setTimestamp();

    const reply = await interaction.fetchReply();
    await reply.edit({
      embeds: [embed]
    });
    
    await message.react('🎉');
    return;
  }

  // Vérifier si le joueur a perdu
  if (gameData.wrongGuesses.length >= 6) {
    activeGames.delete(gameKey);
    collector.stop();
    
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('💀 Perdu !')
      .setDescription(`${PENDU_STAGES[6]}\n\nLe mot était : **${gameData.word}**`)
      .setTimestamp();

    const reply = await interaction.fetchReply();
    await reply.edit({
      embeds: [embed]
    });
    
    await message.react('💀');
    return;
  }

  // Mettre à jour l'affichage
  const embed = createGameEmbed(gameData);
  const reply = await interaction.fetchReply();
  await reply.edit({
    embeds: [embed]
  });
}