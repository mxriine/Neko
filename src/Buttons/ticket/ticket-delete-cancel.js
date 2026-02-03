module.exports = {
    data: {
        name: 'ticket-delete-cancel'
    },

    async execute(client, interaction) {
        await interaction.update({
            content: '❌ Suppression du ticket annulée.',
            embeds: [],
            components: []
        });

        setTimeout(() => {
            interaction.deleteReply().catch(() => {});
        }, 3000);
    }
};
