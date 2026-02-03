const morpionCommand = require('../../Commands/Fun/morpion');

module.exports = {
  name: 'morpion',
  
  async execute(client, interaction) {
    const parts = interaction.customId.split('_');
    const gameKey = parts[1];
    const position = parts[2];
    
    await morpionCommand.handleButtonClick(client, interaction, gameKey, position);
  }
};
