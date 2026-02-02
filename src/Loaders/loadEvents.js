const { glob } = require("glob");
const path = require("path");
const Logger = require("./Logger");

module.exports = async (client) => {
    try {
        const pattern = path.join(process.cwd(), "src", "Events", "**", "*.js").replace(/\\/g, "/");
        const eventFiles = await glob(pattern);

        for (const file of eventFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const event = require(file);

                // Vérifications de base
                if (!event.name) {
                    Logger.warn(`[EVT] Ignoré : missing "name"\n Fichier -> ${file}`);
                    continue;
                }

                if (typeof event.execute !== "function") {
                    Logger.warn(`[EVT] Ignoré : missing "execute()" \n Fichier -> ${file}`);
                    continue;
                }

                // Enregistrement event
                let handler;
                if (event.name === "messageCreate") {
                    handler = (...args) => event.execute(...args, client);
                } else {
                    handler = (...args) => event.execute(client, ...args);
                }

                if (event.once) client.once(event.name, handler);
                else client.on(event.name, handler);

                Logger.event(`- ${event.name}`);

            } catch (err) {
                Logger.error(`[EVT] Erreur lors du chargement : ${file}`);
                console.error(err);
            }
        }

        Logger.client('✔ Évènements chargés');
    } catch (error) {
        Logger.error(`Erreur dans loadEvents: ${error.message}`);
        console.error(error);
    }
};
