const { ChannelType, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const { createTicketButton } = require("../../Assets/Buttons/TicketButton");
const config = require("../../../config/bot.config");

module.exports = {
    data: {
        name: "ticket-menu"
    },

    async execute(client, interaction) {
        try {
            // Récupérer la config du serveur
            const guildData = await client.prisma.guild.findUnique({
                where: { id: interaction.guild.id }
            });

            if (!guildData || !guildData.ticketEnabled) {
                return interaction.reply({
                    content: '❌ Le système de tickets n\'est pas activé.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Récupérer les données de l'utilisateur
            const userData = await client.prisma.user.findUnique({
                where: {
                    discordId_guildId: {
                        discordId: interaction.user.id,
                        guildId: interaction.guild.id
                    }
                }
            });

            // Vérifier si l'utilisateur a déjà un ticket ouvert
            if (userData?.hasTicket) {
                return interaction.reply({
                    content: `❌ Vous avez déjà un ticket ouvert ! Limite: ${config.tickets.maxOpenTickets} ticket(s) à la fois.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Récupérer la sélection
            const selected = interaction.values[0];
            const option = interaction.component.options.find(o => o.value === selected);
            const label = option?.label || "Autre raison";

            // Récupérer la catégorie
            const category = await interaction.guild.channels.fetch(guildData.ticketCategory);

            if (!category) {
                return interaction.editReply({
                    content: '❌ La catégorie des tickets n\'existe plus.'
                });
            }

            // Créer le nom du ticket
            const ticketName = `ticket-${interaction.user.username}`.substring(0, 30).toLowerCase().replace(/[^a-z0-9-]/g, '-');

            // Permissions du ticket
            const permissions = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.ManageMessages
                    ]
                }
            ];

            // Ajouter le rôle support si configuré
            if (guildData.ticketRoleSupport) {
                permissions.push({
                    id: guildData.ticketRoleSupport,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.EmbedLinks
                    ]
                });
            }

            // Créer le salon
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: permissions,
                topic: `Ticket de ${interaction.user.tag} | ID: ${interaction.user.id}`
            });

            // Embed d'accueil
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0x202225)
                .setTitle(`📨 TICKET | ${interaction.user.username}`)
                .setDescription(
                    `Votre ticket a été créé, ${interaction.user}.\n\n` +
                    `**Raison :** ${label}\n\n` +
                    `Merci de fournir toutes les informations utiles afin que nous puissions vous aider au mieux.`
                );

            // Boutons du ticket avec ownerId
            const components = [createTicketButton({ ownerId: interaction.user.id, isClosed: false })];

            const ticketMessage = await ticketChannel.send({
                content: guildData.ticketRoleSupport ? `<@&${guildData.ticketRoleSupport}>` : '',
                embeds: [welcomeEmbed],
                components
            });

            // Mettre à jour la BDD
            await client.prisma.user.upsert({
                where: {
                    discordId_guildId: {
                        discordId: interaction.user.id,
                        guildId: interaction.guild.id
                    }
                },
                update: {
                    hasTicket: true,
                    ticketMessageId: ticketMessage.id,
                    ticketReason: label
                },
                create: {
                    discordId: interaction.user.id,
                    username: interaction.user.username,
                    guildId: interaction.guild.id,
                    hasTicket: true,
                    ticketMessageId: ticketMessage.id,
                    ticketReason: label
                }
            });

            // Répondre à l'interaction
            await interaction.editReply({
                content: `✅ Votre ticket a été créé: ${ticketChannel}`
            });

            // Log de création
            if (guildData.ticketLogs) {
                const logChannel = await interaction.guild.channels.fetch(guildData.ticketLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle('📬 Ticket Créé')
                        .addFields(
                            { name: '👤 Utilisateur', value: `${interaction.user} (${interaction.user.id})`, inline: true },
                            { name: '📍 Salon', value: `${ticketChannel}`, inline: true },
                            { name: '📋 Raison', value: label, inline: false },
                            { name: '⏰ Créé le', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur création ticket:', error);
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la création du ticket.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la création du ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
