const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');
const { sendToChannelOrForum } = require('../../Assets/Functions/channelHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulser un membre du serveur')
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
        await interaction.deferReply();

        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
        const member = interaction.guild.members.cache.get(target.id);

        // Vérifications
        if (target.id === interaction.user.id) {
            return interaction.editReply({
                content: 'Vous ne pouvez pas vous expulser vous-même !'
            });
        }

        if (target.bot) {
            return interaction.editReply({
                content: 'Vous ne pouvez pas expulser un bot !'
            });
        }

        if (!member) {
            return interaction.editReply({
                content: 'Ce membre n\'est pas sur le serveur.'
            });
        }

        if (!member.kickable) {
            return interaction.editReply({
                content: 'Je ne peux pas expulser ce membre (rôle supérieur ou permissions insuffisantes).'
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply({
                content: 'Vous ne pouvez pas expulser ce membre (rôle supérieur ou égal).'
            });
        }

        try {
            // MP à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`Vous avez été expulsé de ${interaction.guild.name}`)
                    .addFields(
                        { name: 'Raison', value: reason, inline: false },
                        { name: 'Par', value: interaction.user.tag, inline: false }
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
                .setTitle('Membre expulsé')
                .setDescription(`${target} a été expulsé du serveur`)
                .addFields(
                    { name: 'Membre', value: target.tag, inline: true },
                    { name: 'Modérateur', value: interaction.user.tag, inline: true },
                    { name: 'Raison', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            await interaction.editReply({ embeds: [embed] });

            // Log
            const guildData = await client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Membre expulsé')
                        .addFields(
                            { name: 'Membre', value: `${target} (${target.tag})`, inline: true },
                            { name: 'Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: 'Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID: ${target.id}` });

                    await sendToChannelOrForum(logChannel, { embeds: [logEmbed] }, guildData.modLogThread);
                }
            }

        } catch (error) {
            console.error('Erreur kick:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: 'Une erreur est survenue lors de l\'expulsion.'
                });
            } else {
                await interaction.reply({
                    content: 'Une erreur est survenue lors de l\'expulsion.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
