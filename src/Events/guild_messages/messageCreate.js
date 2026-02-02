const Logger = require("../../Loaders/Logger");

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message, client) {
        // Ignorer bots et DM
        if (!message.guild || message.author.bot) return;

        const prefix = process.env.PREFIX || "!";
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        // Trouver la commande
        const command = client.commands.get(commandName) || 
                       client.commands.get(client.aliases.get(commandName));

        if (!command) return;
        if (!command.run && !command.execute) return;

        // Récupérer les settings DB
        let guildSettings = await client.getGuild(message.guild.id, message.guild.name);
        let userSettings = await client.getUser(message.author.id, message.author.tag, message.guild.id);

        // Check owner
        if (command.ownerOnly && message.author.id !== process.env.OWNER_ID) {
            return message.reply("Seul le propriétaire du bot peut utiliser cette commande.");
        }

        // Check permissions
        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            return message.reply("Vous n'avez pas les permissions nécessaires.");
        }

        // Exécution
        try {
            if (typeof command.run === "function") {
                await command.run(client, message, args, guildSettings, userSettings);
            } else if (typeof command.execute === "function") {
                await command.execute(client, message, args, guildSettings, userSettings);
            }
        } catch (err) {
            Logger.error(`Erreur dans la commande prefix ${commandName}: ${err.message}`);
            console.error(err);
            message.reply("Une erreur s'est produite lors de l'exécution.").catch(() => {});
        }
    }
};
