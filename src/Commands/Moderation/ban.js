const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../../config/bot.config');
const { sendToChannelOrForum } = require('../../Assets/Functions/channelHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Bannir un membre du serveur')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre à bannir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription('Raison du bannissement')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('supprimer_messages')
                .setDescription('Supprimer les messages des X derniers jours (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
        const deleteMessageDays = interaction.options.getInteger('supprimer_messages') || 0;
        const member = interaction.guild.members.cache.get(target.id);

        // Vérifications
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas vous bannir vous-même !',
                flags: MessageFlags.Ephemeral
            });
        }

        if (target.bot) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas bannir un bot !',
                flags: MessageFlags.Ephemeral
            });
        }

        if (member) {
            if (!member.bannable) {
                return interaction.reply({
                    content: '❌ Je ne peux pas bannir ce membre (rôle supérieur ou permissions insuffisantes).',
                    flags: MessageFlags.Ephemeral
                });
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: '❌ Vous ne pouvez pas bannir ce membre (rôle supérieur ou égal).',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        try {
            // MP à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(`🔨 Vous avez été banni de ${interaction.guild.name}`)
                    .addFields(
                        { name: '📝 Raison', value: reason, inline: false },
                        { name: '👮 Par', value: interaction.user.tag, inline: false }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                // L'utilisateur a bloqué les MPs
            }

            // Bannir
            await interaction.guild.members.ban(target, {
                reason: reason,
                deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60
            });

            // Enregistrer le ban dans la BDD
            await client.prisma.user.upsert({
                where: {
                    discordId_guildId: {
                        discordId: target.id,
                        guildId: interaction.guild.id
                    }
                },
                update: {
                    isBanned: true,
                    bannedAt: new Date(),
                    banReason: reason,
                    inGuild: false
                },
                create: {
                    discordId: target.id,
                    username: target.username,
                    guildId: interaction.guild.id,
                    isBanned: true,
                    bannedAt: new Date(),
                    banReason: reason,
                    inGuild: false
                }
            });

            // Embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle('🔨 Membre banni')
                .setDescription(`${target} a été banni du serveur`)
                .addFields(
                    { name: '👤 Membre', value: target.tag, inline: true },
                    { name: '👮 Modérateur', value: interaction.user.tag, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            if (deleteMessageDays > 0) {
                embed.addFields({
                    name: '🗑️ Messages supprimés',
                    value: `${deleteMessageDays} jour(s)`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Log
            const guildData = await client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle('📋 Membre banni')
                        .addFields(
                            { name: '👤 Membre', value: `${target} (${target.tag})`, inline: true },
                            { name: '👮 Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '📝 Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID: ${target.id}` });

                    if (deleteMessageDays > 0) {
                        logEmbed.addFields({
                            name: '🗑️ Messages supprimés',
                            value: `${deleteMessageDays} jour(s)`,
                            inline: true
                        });
                    }

                    await sendToChannelOrForum(logChannel, { embeds: [logEmbed] }, guildData.modLogThread);
                }
            }

        } catch (error) {
            console.error('Erreur ban:', error);
            
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors du bannissement.'
                });
            } else {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors du bannissement.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
