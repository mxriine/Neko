const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');
const { createTicketButton } = require('../../Assets/Buttons/TicketButton');

module.exports = {
    data: {
        name: 'ticket-close-confirm'
    },

    async execute(client, interaction) {
        await interaction.deferUpdate();

        try {
            // Extraire l'ownerId du customId (format: ticket-close-confirm:userId)
            const [prefix, creatorId] = interaction.customId.split(':');

            if (!creatorId) {
                return interaction.followUp({
                    content: '❌ Impossible de trouver le créateur du ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Récupérer la config
            const guildData = await client.prisma.guild.findUnique({
                where: { id: interaction.guild.id }
            });

            // Générer le transcript
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const transcript = messages
                .reverse()
                .map(m => `[${new Date(m.createdTimestamp).toLocaleString('fr-FR')}] ${m.author.tag}: ${m.content}`)
                .join('\n');

            const transcriptBuffer = Buffer.from(transcript, 'utf-8');

            // Modifier les permissions (fermer le ticket)
            await interaction.channel.permissionOverwrites.edit(creatorId, {
                ViewChannel: false,
                SendMessages: false
            });

            // Embed de fermeture
            const closedEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('🔒 Ticket Fermé')
                .setDescription(
                    `**Ticket fermé par ${interaction.user}**\n\n` +
                    'Ce ticket a été fermé et archivé.\n' +
                    'Le créateur ne peut plus voir ce salon.\n\n' +
                    'Le staff peut toujours accéder à ce salon pour consultation.'
                )
                .setFooter({ text: 'Ticket fermé' })
                .setTimestamp();

            const reopenRow = createTicketButton({ ownerId: creatorId, isClosed: true });

            await interaction.channel.send({
                embeds: [closedEmbed],
                components: [reopenRow]
            });

            // Mettre à jour la BDD
            await client.prisma.user.update({
                where: {
                    discordId_guildId: {
                        discordId: creatorId,
                        guildId: interaction.guild.id
                    }
                },
                data: {
                    hasTicket: false,
                    ticketMessageId: null,
                    ticketReason: null
                }
            });

            // Renommer le salon
            await interaction.channel.setName(`closed-${interaction.channel.name}`);

            // Log de fermeture
            if (guildData?.ticketLogs) {
                const logChannel = await interaction.guild.channels.fetch(guildData.ticketLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('🔒 Ticket Fermé')
                        .addFields(
                            { name: '📍 Salon', value: `${interaction.channel}`, inline: true },
                            { name: '👤 Fermé par', value: `${interaction.user}`, inline: true },
                            { name: '⏰ Fermé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
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

            // Notifier le créateur
            try {
                const creator = await client.users.fetch(creatorId);
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle('🔒 Ticket Fermé')
                    .setDescription(
                        `Votre ticket **${interaction.channel.name}** a été fermé par ${interaction.user}.\n\n` +
                        `Si vous avez encore besoin d'aide, n'hésitez pas à ouvrir un nouveau ticket.`
                    )
                    .setTimestamp();

                await creator.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Impossible d\'envoyer le DM au créateur du ticket');
            }

        } catch (error) {
            console.error('Erreur fermeture ticket:', error);
            await interaction.followUp({
                content: '❌ Une erreur est survenue lors de la fermeture du ticket.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
