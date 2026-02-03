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

                // Support both formats: selectMenu.name and selectMenu.data.name
                const selectName = selectMenu.name || selectMenu.data?.name;
                if (!selectName) {
                    Logger.warn(
                        `[SELECT] Menu ignoré : missing "name" or "data.name"\n Fichier -> ${file}`
                    );
                    continue;
                }

                // Support both formats: runInteraction and execute
                const executeFunction = selectMenu.runInteraction || selectMenu.execute;
                if (typeof executeFunction !== "function") {
                    Logger.warn(
                        `[SELECT] Menu "${selectName}" ignoré : missing "runInteraction()" or "execute()"\n Fichier -> ${file}`
                    );
                    continue;
                }

                // Normalize to have both name and execute
                if (!selectMenu.name) selectMenu.name = selectName;
                if (!selectMenu.execute) selectMenu.execute = executeFunction;

                client.selects.set(selectName, selectMenu);
                Logger.select(`- ${selectName}`);

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
