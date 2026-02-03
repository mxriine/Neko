const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function createTicketButton({ ownerId, isClosed = false }) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`ticket-close:${ownerId}`)
            .setLabel("🔒 Fermer")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isClosed),

        new ButtonBuilder()
            .setCustomId(`ticket-reopen:${ownerId}`)
            .setLabel("🔓 Réouvrir")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!isClosed),

        new ButtonBuilder()
            .setCustomId(`ticket-delete:${ownerId}`)
            .setLabel("🗑️ Supprimer")
            .setStyle(ButtonStyle.Danger)
    );
}

module.exports = { createTicketButton };
