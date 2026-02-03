const { EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');
const { createTicketButton } = require('../../Assets/Buttons/TicketButton');

module.exports = {
    data: {
        name: 'ticket-reopen'
    },

    async execute(client, interaction) {
        try {
            if (!interaction.channel.name.startsWith('closed-ticket-')) {
                return interaction.reply({
                    content: '❌ Ce ticket n\'est pas fermé.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Extraire l'ownerId du customId (format: ticket-reopen:userId)
            const [prefix, creatorId] = interaction.customId.split(':');

            if (!creatorId) {
                console.error('Erreur ticket-reopen: ownerId manquant dans customId:', interaction.customId);
                return interaction.reply({
                    content: '❌ Impossible de trouver le créateur du ticket.',
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
                    content: '❌ Seul le staff peut réouvrir un ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Restaurer les permissions
            await interaction.channel.permissionOverwrites.edit(creatorId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            // Renommer le salon
            const newName = interaction.channel.name.replace('closed-', '');
            await interaction.channel.setName(newName);

            // Mettre à jour la BDD
            await client.prisma.user.update({
                where: {
                    discordId_guildId: {
                        discordId: creatorId,
                        guildId: interaction.guild.id
                    }
                },
                data: {
                    hasTicket: true
                }
            });

            // Embed de réouverture
            const reopenEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🔓 Ticket Réouvert')
                .setDescription(
                    `**Ticket réouvert par ${interaction.user}**\n\n` +
                    `<@${creatorId}> peut à nouveau accéder à ce ticket.`
                )
                .setFooter({ text: 'Ticket réouvert' })
                .setTimestamp();

            const components = [createTicketButton({ ownerId: creatorId, isClosed: false })];

            await interaction.reply({ 
                embeds: [reopenEmbed],
                components
            });

            // Log de réouverture
            if (guildData?.ticketLogs) {
                const logChannel = await interaction.guild.channels.fetch(guildData.ticketLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle('🔓 Ticket Réouvert')
                        .addFields(
                            { name: '📍 Salon', value: `${interaction.channel}`, inline: true },
                            { name: '👤 Réouvert par', value: `${interaction.user}`, inline: true },
                            { name: '⏰ Réouvert le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

            // Notifier le créateur
            try {
                const creator = await client.users.fetch(creatorId);
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('🔓 Ticket Réouvert')
                    .setDescription(
                        `Votre ticket **${interaction.channel.name}** a été réouvert par ${interaction.user}.\n\n` +
                        `Vous pouvez à nouveau y accéder.`
                    )
                    .setTimestamp();

                await creator.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Impossible d\'envoyer le DM au créateur du ticket');
            }

        } catch (error) {
            console.error('Erreur réouverture ticket:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la réouverture du ticket.',
                    flags: MessageFlags.Ephemeral
                }).catch(() => {});
            }
        }
    }
};
