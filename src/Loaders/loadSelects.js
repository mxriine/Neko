const { glob } = require("glob");
const path = require("path");
const Logger = require("./Logger");

module.exports = async (client) => {
    try {
        client.selects = new Map();

        const pattern = path.join(process.cwd(), "src", "Selects", "**", "*.js").replace(/\\/g, "/");
        const selectFiles = await glob(pattern);

        for (const file of selectFiles) {
            try {
                delete require.cache[require.resolve(file)];
                const selectMenu = require(file);

                if (!selectMenu.name) {
                    Logger.warn(
                        `[SELECT] Menu ignoré : missing "name"\n Fichier -> ${file}`
                    );
                    continue;
                }

                if (typeof selectMenu.runInteraction !== "function") {
                    Logger.warn(
                        `[SELECT] Menu "${selectMenu.name}" ignoré : missing "runInteraction()" \n Fichier -> ${file}`
                    );
                    continue;
                }

                client.selects.set(selectMenu.name, selectMenu);
                Logger.select(`- ${selectMenu.name}`);

            } catch (err) {
                Logger.error(`[SELECT] Erreur lors du chargement : ${file}`);
                console.error(err);
            }
        }

        if (client.selects.size > 0) {
            Logger.client(`✔ Menus Select chargés : ${client.selects.size}`);
        }
    } catch (error) {
        Logger.error(`Erreur dans loadSelects: ${error.message}`);
        console.error(error);
    }
};
