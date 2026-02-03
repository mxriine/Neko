const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🗑️ Supprimer des messages')
        .addIntegerOption(option =>
            option
                .setName('nombre')
                .setDescription('Nombre de messages à supprimer (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option
                .setName('utilisateur')
                .setDescription('Supprimer uniquement les messages de cet utilisateur')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const amount = interaction.options.getInteger('nombre');
        const targetUser = interaction.options.getUser('utilisateur');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Récupérer les messages
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            let messagesToDelete = Array.from(messages.values());

            // Filtrer par utilisateur si spécifié
            if (targetUser) {
                messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
            }

            // Limiter au nombre demandé
            messagesToDelete = messagesToDelete.slice(0, amount);

            // Filtrer les messages de plus de 14 jours (limitation Discord)
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const oldMessages = messagesToDelete.filter(msg => msg.createdTimestamp < twoWeeksAgo);
            messagesToDelete = messagesToDelete.filter(msg => msg.createdTimestamp >= twoWeeksAgo);

            if (messagesToDelete.length === 0) {
                return interaction.editReply({
                    content: '❌ Aucun message à supprimer (les messages de plus de 14 jours ne peuvent pas être supprimés en masse).'
                });
            }

            // Supprimer les messages
            await interaction.channel.bulkDelete(messagesToDelete, true);

            // Embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🗑️ Messages supprimés')
                .addFields(
                    { name: '📊 Supprimés', value: `${messagesToDelete.length} message(s)`, inline: true },
                    { name: '📍 Salon', value: interaction.channel.toString(), inline: true }
                )
                .setTimestamp();

            if (targetUser) {
                embed.addFields({
                    name: '👤 Utilisateur',
                    value: targetUser.tag,
                    inline: true
                });
            }

            if (oldMessages.length > 0) {
                embed.addFields({
                    name: '⚠️ Non supprimés',
                    value: `${oldMessages.length} message(s) de plus de 14 jours`,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Log
            const guildData = await client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel && logChannel.id !== interaction.channel.id) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.info)
                        .setTitle('📋 Messages supprimés')
                        .addFields(
                            { name: '👮 Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '📍 Salon', value: interaction.channel.toString(), inline: true },
                            { name: '📊 Quantité', value: `${messagesToDelete.length} message(s)`, inline: true }
                        )
                        .setTimestamp();

                    if (targetUser) {
                        logEmbed.addFields({
                            name: '👤 Utilisateur filtré',
                            value: targetUser.tag,
                            inline: true
                        });
                    }

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur clear:', error);
            await interaction.editReply({
                content: '❌ Une erreur est survenue lors de la suppression des messages.'
            });
        }
    }
};
