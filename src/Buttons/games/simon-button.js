const simonCommand = require('../../Commands/Fun/simon');

module.exports = {
  name: 'simon',
  
  async execute(client, interaction) {
    const parts = interaction.customId.split('_');
    const gameKey = parts[1];
    const color = parts[2];
    
    await simonCommand.handleButtonClick(client, interaction, gameKey, color);
  }
};
