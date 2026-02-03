const { EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: {
        name: 'ticket-delete-confirm'
    },

    async execute(client, interaction) {
        await interaction.deferUpdate();

        try {
            // Récupérer la config
            const guildData = await client.prisma.guild.findUnique({
                where: { id: interaction.guild.id }
            });

            // Générer un dernier transcript
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages
                .reverse()
                .map(m => `[${new Date(m.createdTimestamp).toLocaleString('fr-FR')}] ${m.author.tag}: ${m.content}`)
                .join('\n');

            const transcriptBuffer = Buffer.from(transcript, 'utf-8');

            // Log de suppression
            if (guildData?.ticketLogs) {
                const logChannel = await interaction.guild.channels.fetch(guildData.ticketLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('🗑️ Ticket Supprimé')
                        .addFields(
                            { name: '📍 Salon', value: interaction.channel.name, inline: true },
                            { name: '👤 Supprimé par', value: `${interaction.user}`, inline: true },
                            { name: '⏰ Supprimé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setTimestamp();

                    await logChannel.send({ 
                        embeds: [logEmbed],
                        files: [{
                            attachment: transcriptBuffer,
                            name: `transcript-${interaction.channel.name}.txt`
                        }]
                    });
                }
            }

            // Message de suppression
            await interaction.followUp({
                content: '🗑️ **Ce ticket sera supprimé dans 5 secondes...**'
            });

            // Supprimer le salon après 5 secondes
            setTimeout(async () => {
                try {
                    await interaction.channel.delete('Ticket supprimé par le staff');
                } catch (error) {
                    console.error('Erreur suppression ticket:', error);
                }
            }, 5000);

        } catch (error) {
            console.error('Erreur suppression ticket:', error);
            await interaction.followUp({
                content: '❌ Une erreur est survenue lors de la suppression du ticket.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
