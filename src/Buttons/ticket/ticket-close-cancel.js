module.exports = {
    data: {
        name: 'ticket-close-cancel'
    },

    async execute(client, interaction) {
        await interaction.update({
            content: '❌ Fermeture du ticket annulée.',
            embeds: [],
            components: []
        });

        setTimeout(() => {
            interaction.deleteReply().catch(() => {});
        }, 3000);
    }
};
