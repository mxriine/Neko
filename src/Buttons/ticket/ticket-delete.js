const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: {
        name: 'ticket-delete'
    },

    async execute(client, interaction) {
        try {
            if (!interaction.channel.name.startsWith('closed-ticket-')) {
                return interaction.reply({
                    content: '❌ Vous devez d\'abord fermer le ticket avant de le supprimer.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Extraire l'ownerId du customId (format: ticket-delete:userId)
            const [prefix, ownerId] = interaction.customId.split(':');

            if (!ownerId) {
                console.error('Erreur ticket-delete: ownerId manquant dans customId:', interaction.customId);
                return interaction.reply({
                    content: '❌ Erreur: ID du propriétaire du ticket introuvable.',
                    flags: MessageFlags.Ephemeral
                });
            }

        // Vérifier les permissions
        const guildData = await client.prisma.guild.findUnique({
            where: { id: interaction.guild.id }
        });

        const isStaff = guildData?.ticketRoleSupport 
            ? interaction.member.roles.cache.has(guildData.ticketRoleSupport)
            : interaction.member.permissions.has('ManageChannels');

        if (!isStaff) {
            return interaction.reply({
                content: '❌ Seul le staff peut supprimer un ticket.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Embed de confirmation
        const confirmEmbed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('⚠️ Suppression du Ticket')
            .setDescription(
                '**Êtes-vous sûr de vouloir supprimer ce ticket ?**\n\n' +
                '⚠️ **Cette action est irréversible !**\n\n' +
                'Le salon sera définitivement supprimé.\n' +
                'Assurez-vous d\'avoir sauvegardé toutes les informations importantes.\n\n' +
                'Confirmez-vous la suppression ?'
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ticket-delete-confirm:${ownerId}`)
                    .setLabel('Confirmer')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket-delete-cancel')
                    .setLabel('Annuler')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            embeds: [confirmEmbed],
            components: [row]
        });
        } catch (error) {
            console.error('Erreur dans ticket-delete:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue.',
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }
        }
    }
};
