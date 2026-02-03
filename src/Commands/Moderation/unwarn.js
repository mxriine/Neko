const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');
const { sendToChannelOrForum } = require('../../Assets/Functions/channelHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Retirer un avertissement')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre dont retirer un avertissement')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('numero')
                .setDescription('Numéro de l\'avertissement à retirer (0 = tous)')
                .setRequired(true)
                .setMinValue(0)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const target = interaction.options.getUser('membre');
        const warningNumber = interaction.options.getInteger('numero');

        try {
            const warnings = await interaction.client.getWarnings(target.id, interaction.guild.id);

            if (warnings.length === 0) {
                return interaction.reply({
                    content: `${target} n'a aucun avertissement.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Retirer tous les warnings
            if (warningNumber === 0) {
                const user = await interaction.client.getUser(target.id, target.tag, interaction.guild.id);
                
                await interaction.client.prisma.warning.deleteMany({
                    where: { userId: user.id }
                });

                const embed = new EmbedBuilder()
                    .setTitle('Avertissements supprimés')
                    .setDescription(`Tous les avertissements de ${target} ont été retirés.`)
                    .addFields(
                        { name: 'Membre', value: target.tag, inline: true },
                        { name: 'Supprimés', value: `${warnings.length} warning(s)`, inline: true },
                        { name: 'Par', value: interaction.user.tag, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `ID: ${target.id}` });

                await interaction.reply({ embeds: [embed] });

                // Log
                const guildData = await interaction.client.getGuild(interaction.guild.id, interaction.guild.name);
                if (guildData.modLogChannel) {
                    const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Avertissements supprimés')
                            .addFields(
                                { name: 'Membre', value: `${target} (${target.tag})`, inline: true },
                                { name: 'Par', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                                { name: 'Supprimés', value: `${warnings.length} warning(s)`, inline: true }
                            )
                            .setTimestamp();

                        await sendToChannelOrForum(logChannel, { embeds: [logEmbed] }, guildData.modLogThread);
                    }
                }

                return;
            }

            // Retirer un warning spécifique
            if (warningNumber > warnings.length) {
                return interaction.reply({
                    content: `${target} n'a que ${warnings.length} avertissement(s).`,
                    flags: MessageFlags.Ephemeral
                });
            }

            const warningToRemove = warnings[warningNumber - 1];

            await interaction.client.prisma.warning.delete({
                where: { id: warningToRemove.id }
            });

            const embed = new EmbedBuilder()
                .setTitle('Avertissement retiré')
                .setDescription(`L'avertissement #${warningNumber} de ${target} a été retiré.`)
                .addFields(
                    { name: 'Membre', value: target.tag, inline: true },
                    { name: 'Warnings restants', value: `${warnings.length - 1}/${config.features.moderation.maxWarnings}`, inline: true },
                    { name: 'Raison supprimée', value: warningToRemove.reason, inline: false },
                    { name: 'Retiré par', value: interaction.user.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            await interaction.reply({ embeds: [embed] });

            // Log
            const guildData = await interaction.client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Avertissement retiré')
                        .addFields(
                            { name: 'Membre', value: `${target} (${target.tag})`, inline: true },
                            { name: 'Par', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: 'Warning #', value: `${warningNumber}`, inline: true },
                            { name: 'Raison', value: warningToRemove.reason, inline: false }
                        )
                        .setTimestamp();

                    await sendToChannelOrForum(logChannel, { embeds: [logEmbed] }, guildData.modLogThread);
                }
            }

        } catch (error) {
            console.error('Erreur unwarn:', error);
            await interaction.reply({
                content: 'Une erreur est survenue lors de la suppression de l\'avertissement.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
