const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');
const { sendToChannelOrForum } = require('../../Assets/Functions/channelHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Débannir un utilisateur du serveur')
        .addStringOption(option =>
            option
                .setName('user_id')
                .setDescription('L\'ID Discord de l\'utilisateur à débannir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription('Raison du débannissement')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        await interaction.deferReply();

        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';

        // Vérifier si l'utilisateur est banni
        try {
            const ban = await interaction.guild.bans.fetch(userId);
            
            if (!ban) {
                return interaction.editReply({
                    content: 'Cet utilisateur n\'est pas banni.'
                });
            }

            // Débannir
            await interaction.guild.members.unban(userId, reason);

            // Mettre à jour la BDD
            await client.prisma.user.updateMany({
                where: {
                    discordId: userId,
                    guildId: interaction.guild.id
                },
                data: {
                    isBanned: false,
                    bannedAt: null,
                    banReason: null
                }
            });

            // Embed de confirmation
            const embed = new EmbedBuilder()
                .setTitle('Utilisateur débanni')
                .setDescription(`<@${userId}> a été débanni du serveur`)
                .addFields(
                    { name: 'Utilisateur', value: `<@${userId}>`, inline: true },
                    { name: 'Modérateur', value: interaction.user.tag, inline: true },
                    { name: 'Raison', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${userId}` });

            await interaction.editReply({ embeds: [embed] });

            // Log
            const guildData = await client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Utilisateur débanni')
                        .addFields(
                            { name: 'Utilisateur', value: `<@${userId}>`, inline: true },
                            { name: 'Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: 'Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID: ${userId}` });

                    await sendToChannelOrForum(logChannel, { embeds: [logEmbed] }, guildData.modLogThread);
                }
            }

        } catch (error) {
            console.error('Erreur unban:', error);
            
            if (error.code === 10026) {
                return interaction.editReply({
                    content: 'Cet utilisateur n\'est pas banni.'
                });
            }
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: 'Une erreur est survenue lors du débannissement.'
                });
            } else {
                await interaction.reply({
                    content: 'Une erreur est survenue lors du débannissement.',
                    ephemeral: true
                });
            }
        }
    }
};
