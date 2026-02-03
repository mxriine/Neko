const { ChannelType } = require('discord.js');

/**
 * Envoie un message dans un salon ou un thread spécifique
 * @param {Object} channel - Le salon où envoyer
 * @param {Object} options - Les options du message (content, embeds, etc.)
 * @param {String} threadId - ID du thread spécifique si c'est un forum
 * @returns {Promise<Message>}
 */
async function sendToChannelOrForum(channel, options, threadId = null) {
    if (!channel) return null;

    try {
        // Si c'est un forum et qu'on a un threadId, envoyer dans ce thread
        if (channel.type === ChannelType.GuildForum && threadId) {
            const thread = await channel.threads.fetch(threadId).catch(() => null);
            
            if (thread) {
                // Si le thread est archivé, le désarchiver
                if (thread.archived) {
                    await thread.setArchived(false);
                }
                return await thread.send(options);
            }
            
            // Si le thread n'existe pas/plus, retourner null
            console.error(`Thread ${threadId} introuvable dans le forum ${channel.name}`);
            return null;
        }

        // Sinon, envoyer normalement dans le salon
        if (channel.isTextBased() && !channel.isThread()) {
            return await channel.send(options);
        }

        return null;
    } catch (error) {
        console.error('Erreur sendToChannelOrForum:', error);
        return null;
    }
}

module.exports = { sendToChannelOrForum };
