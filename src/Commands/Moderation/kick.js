const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Expulser un membre du serveur')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre à expulser')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription('Raison de l\'expulsion')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
        const member = interaction.guild.members.cache.get(target.id);

        // Vérifications
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas vous expulser vous-même !',
                ephemeral: true
            });
        }

        if (target.bot) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas expulser un bot !',
                ephemeral: true
            });
        }

        if (!member) {
            return interaction.reply({
                content: '❌ Ce membre n\'est pas sur le serveur.',
                ephemeral: true
            });
        }

        if (!member.kickable) {
            return interaction.reply({
                content: '❌ Je ne peux pas expulser ce membre (rôle supérieur ou permissions insuffisantes).',
                ephemeral: true
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas expulser ce membre (rôle supérieur ou égal).',
                ephemeral: true
            });
        }

        try {
            // MP à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(`👢 Vous avez été expulsé de ${interaction.guild.name}`)
                    .addFields(
                        { name: '📝 Raison', value: reason, inline: false },
                        { name: '👮 Par', value: interaction.user.tag, inline: false }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                // L'utilisateur a bloqué les MPs
            }

            // Expulser
            await member.kick(reason);

            // Embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('👢 Membre expulsé')
                .setDescription(`${target} a été expulsé du serveur`)
                .addFields(
                    { name: '👤 Membre', value: target.tag, inline: true },
                    { name: '👮 Modérateur', value: interaction.user.tag, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            await interaction.reply({ embeds: [embed] });

            // Log
            const guildData = await client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('📋 Membre expulsé')
                        .addFields(
                            { name: '👤 Membre', value: `${target} (${target.tag})`, inline: true },
                            { name: '👮 Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '📝 Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID: ${target.id}` });

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur kick:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'expulsion.',
                ephemeral: true
            });
        }
    }
};
