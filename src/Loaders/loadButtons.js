const { glob } = require("glob");
const path = require("path");
const Logger = require("./Logger");

module.exports = async (client) => {
    try {
        client.buttons = new Map();

        const pattern = path.join(process.cwd(), "src", "Buttons", "**", "*.js").replace(/\\/g, "/");
        const buttonFiles = await glob(pattern);

        for (const file of buttonFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const btn = require(file);

                // Support both formats: btn.name and btn.data.name
                const buttonName = btn.name || btn.data?.name;
                if (!buttonName) {
                    Logger.warn(`[BUTTON] Bouton ignoré : ajouter "name" ou "data.name"\n Fichier -> ${file}`);
                    continue;
                }

                // Support both formats: runInteraction and execute
                const executeFunction = btn.runInteraction || btn.execute;
                if (typeof executeFunction !== "function") {
                    Logger.warn(`[BUTTON] Bouton "${buttonName}" ignoré : ajouter "runInteraction" ou "execute"\n Fichier -> ${file}`);
                    continue;
                }

                // Normalize to have both name and execute
                if (!btn.name) btn.name = buttonName;
                if (!btn.execute) btn.execute = executeFunction;

                client.buttons.set(buttonName, btn);
                Logger.button(`- ${buttonName}`);

            } catch (err) {
                Logger.error(`[BUTTON] Erreur lors du chargement : ${file}`);
                console.error(err);
            }
        }

        if (client.buttons.size > 0) {
            Logger.client(`✔ Boutons chargés : ${client.buttons.size}`);
        }
    } catch (error) {
        Logger.error(`Erreur dans loadButtons: ${error.message}`);
        console.error(error);
    }
};
