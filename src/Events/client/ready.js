const Logger = require('../../Loaders/Logger');
const { REST, Routes } = require('discord.js');

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client) {
        Logger.client(`✔ Connecté en tant que ${client.user.tag}`);
        
        // Enregistrer les slash commands
        const commands = Array.from(client.commands.values())
            .filter(cmd => cmd.data)
            .map(cmd => cmd.data.toJSON());
        
        if (commands.length > 0) {
            try {
                const rest = new REST({ version: '10' }).setToken(client.config.bot.token);
                
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                );
                
                Logger.client(`✔ ${commands.length} slash command(s) enregistrée(s)`);
            } catch (error) {
                Logger.error(`Erreur lors de l'enregistrement des slash commands: ${error.message}`);
            }
        }
    }
};
