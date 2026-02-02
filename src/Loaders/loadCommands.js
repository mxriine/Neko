const { glob } = require("glob");
const path = require("path");
const Logger = require("./Logger");
const { Collection, ApplicationCommandType } = require("discord.js");

module.exports = async (client) => {
    try {
        client.commands = new Collection();       // Slash & Context Menu
        client.prefixCommands = new Collection(); // Prefix
        client.aliases = new Collection();

        const pattern = path.join(process.cwd(), "src", "Commands", "**", "*.js").replace(/\\/g, "/");
        const commandFiles = await glob(pattern);

        for (const file of commandFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const cmd = require(file);

                if (!cmd.name) {
                    Logger.warn(`[CMD] Commande ignorée : ajouter "name".\n Fichier -> ${file}`);
                    continue;
                }

                // Validation du type
                const isContextMenu =
                    cmd.type === ApplicationCommandType.User ||
                    cmd.type === ApplicationCommandType.Message;

                const isSlash = cmd.type === ApplicationCommandType.ChatInput;

                // Gestion des descriptions
                if (isSlash) {
                    if (!cmd.description) {
                        Logger.warn(`[CMD] Commande Slash ignorée : ajouter "description".\n Fichier -> ${file}`);
                        continue;
                    }
                } else if (isContextMenu) {
                    if (cmd.description) {
                        Logger.warn(
                            `[CMD] Le context menu "${cmd.name}" ne doit PAS avoir de "description". Elle a été supprimée.`
                        );
                        delete cmd.description;
                    }
                }

                // Vérification de la fonction execute
                if (typeof cmd.runSlash !== "function" && 
                    typeof cmd.execute !== "function" && 
                    typeof cmd.runInteraction !== "function" &&
                    typeof cmd.run !== "function") {
                    Logger.warn(`[CMD] Commande "${cmd.name}" ignorée : ajouter "runSlash", "execute", "runInteraction" ou "run".\n Fichier -> ${file}`);
                    continue;
                }

                // Enregistrement de la commande
                client.commands.set(cmd.name, cmd);

                // Gestion des alias (pour prefix commands)
                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                    cmd.aliases.forEach((alias) => {
                        client.aliases.set(alias, cmd.name);
                    });
                }

                Logger.command(`- ${cmd.name}`);
            } catch (err) {
                Logger.error(`[CMD] Erreur lors du chargement : ${file}`);
                console.error(err);
            }
        }

        const slashCount = Array.from(client.commands.values()).filter(cmd => cmd.data).length;
        const prefixCount = Array.from(client.commands.values()).filter(cmd => 
            typeof cmd.run === "function"
        ).length;
        
        if (client.commands.size > 0) {
            Logger.client(`✔ Commandes enregistrées : ${slashCount} slash | ${prefixCount} prefix`);
        }
    } catch (error) {
        Logger.error(`Erreur dans loadCommands: ${error.message}`);
        console.error(error);
    }
};
