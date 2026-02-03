const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: {
        name: 'ticket-close'
    },

    async execute(client, interaction) {
        try {
            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({
                    content: '❌ Cette commande ne peut être utilisée que dans un ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Extraire l'ownerId du customId (format: ticket-close:userId)
            const [prefix, ownerId] = interaction.customId.split(':');
            
            if (!ownerId) {
                console.error('Erreur ticket-close: ownerId manquant dans customId:', interaction.customId);
                return interaction.reply({
                    content: '❌ Erreur: ID du propriétaire du ticket introuvable.',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Vérifier les permissions (créateur ou staff)
            const guildData = await client.prisma.guild.findUnique({
                where: { id: interaction.guild.id }
            });

            const isCreator = ownerId === interaction.user.id;
            const isStaff = guildData?.ticketRoleSupport 
                ? interaction.member.roles.cache.has(guildData.ticketRoleSupport)
                : interaction.member.permissions.has('ManageChannels');

            if (!isCreator && !isStaff) {
                return interaction.reply({
                    content: '❌ Seul le créateur du ticket ou le staff peut fermer ce ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

        // Embed de confirmation
        const confirmEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('⚠️ Fermeture du Ticket')
            .setDescription(
                '**Êtes-vous sûr de vouloir fermer ce ticket ?**\n\n' +
                'Cette action va :\n' +
                '• Sauvegarder un transcript des messages\n' +
                '• Fermer le salon (visible uniquement par le staff)\n' +
                '• Marquer le ticket comme résolu\n\n' +
                'Confirmez-vous la fermeture ?'
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket-close-confirm:${ownerId}`)
                    .setLabel('Confirmer')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket-close-cancel')
                    .setLabel('Annuler')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [confirmEmbed],
            components: [row]
        });
        } catch (error) {
            console.error('Erreur dans ticket-close:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la fermeture du ticket.',
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }
        }
    }
};
