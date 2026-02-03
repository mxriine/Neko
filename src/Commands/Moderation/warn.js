const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Avertir un membre')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre à avertir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription('Raison de l\'avertissement')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const target = interaction.options.getUser('membre');
        const reason = interaction.options.getString('raison');
        const member = interaction.guild.members.cache.get(target.id);

        // Vérifications
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas vous avertir vous-même !',
                ephemeral: true
            });
        }

        if (target.bot) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas avertir un bot !',
                ephemeral: true
            });
        }

        if (member && member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas avertir ce membre (rôle supérieur ou égal) !',
                ephemeral: true
            });
        }

        try {
            // Ajouter le warning dans la base de données
            await interaction.client.addWarning(
                target.id,
                interaction.guild.id,
                reason,
                interaction.user.id
            );

            // Récupérer le nombre total de warnings
            const warnings = await interaction.client.getWarnings(target.id, interaction.guild.id);
            const warnCount = warnings.length;

            // Déterminer l'action automatique
            let autoAction = null;
            if (warnCount >= 12) {
                autoAction = 'ban_permanent';
            } else if (warnCount >= 9) {
                autoAction = 'ban_temporaire';
            } else if (warnCount >= 3) {
                autoAction = 'kick';
            }

            // Embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('⚠️ Avertissement ajouté')
                .setDescription(`${target} a reçu un avertissement`)
                .addFields(
                    { name: '👤 Membre', value: target.tag, inline: true },
                    { name: '📊 Warnings', value: `${warnCount}/12`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '👮 Modérateur', value: interaction.user.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            if (autoAction) {
                const actions = {
                    'kick': '👢 Kick automatique à 3 warnings',
                    'ban_temporaire': '🔨 Ban temporaire (7 jours) à 9 warnings',
                    'ban_permanent': '⛔ Ban permanent à 12 warnings'
                };
                embed.addFields({ 
                    name: '🚨 Action automatique', 
                    value: actions[autoAction], 
                    inline: false 
                });
            }

            await interaction.reply({ embeds: [embed] });

            // MP à l'utilisateur avec avertissement
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setTitle(`⚠️ Avertissement reçu sur ${interaction.guild.name}`)
                    .addFields(
                        { name: '📝 Raison', value: reason, inline: false },
                        { name: '📊 Total', value: `${warnCount}/12 warnings`, inline: true }
                    )
                    .setTimestamp();

                // Ajouter un message selon le nombre de warnings
                if (warnCount >= 12) {
                    dmEmbed.setDescription('⛔ **VOUS ALLEZ ÊTRE BANNI DÉFINITIVEMENT !**');
                } else if (warnCount >= 9) {
                    dmEmbed.setDescription('🔨 **VOUS ALLEZ ÊTRE BANNI TEMPORAIREMENT !**');
                } else if (warnCount >= 3) {
                    dmEmbed.setDescription('👢 **VOUS ALLEZ ÊTRE EXPULSÉ !**');
                } else if (warnCount === 2) {
                    dmEmbed.addFields({
                        name: '⚠️ Attention !',
                        value: 'Au prochain avertissement vous serez expulsé du serveur.',
                        inline: false
                    });
                }

                dmEmbed.setFooter({ text: 'Attention à votre comportement !' });

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                await interaction.followUp({
                    content: '⚠️ Impossible d\'envoyer un MP au membre.',
                    ephemeral: true
                });
            }

            // Actions automatiques selon le nombre de warnings
            if (warnCount >= 12) {
                // Ban permanent
                try {
                    await interaction.guild.members.ban(target, {
                        reason: `12 avertissements atteints - Ban permanent`,
                        deleteMessageSeconds: 0
                    });
                    await interaction.followUp({
                        content: `⛔ ${target} a été **banni définitivement** pour avoir atteint 12 avertissements.`
                    });
                } catch (error) {
                    await interaction.followUp({
                        content: `❌ Impossible de bannir ${target}.`,
                        ephemeral: true
                    });
                }
            } else if (warnCount >= 9) {
                // Ban temporaire (7 jours = 604800000 ms)
                try {
                    await interaction.guild.members.ban(target, {
                        reason: `9 avertissements atteints - Ban temporaire (7 jours)`,
                        deleteMessageSeconds: 0
                    });
                    
                    // Programmer l'unban après 7 jours
                    setTimeout(async () => {
                        try {
                            await interaction.guild.members.unban(target.id, 'Fin du ban temporaire');
                        } catch (error) {
                            console.error('Erreur lors du unban automatique:', error);
                        }
                    }, 7 * 24 * 60 * 60 * 1000);

                    await interaction.followUp({
                        content: `🔨 ${target} a été **banni pour 7 jours** pour avoir atteint 9 avertissements.`
                    });
                } catch (error) {
                    await interaction.followUp({
                        content: `❌ Impossible de bannir ${target}.`,
                        ephemeral: true
                    });
                }
            } else if (warnCount >= 3) {
                // Kick
                try {
                    await member.kick(`3 avertissements atteints`);
                    await interaction.followUp({
                        content: `👢 ${target} a été **expulsé** pour avoir atteint 3 avertissements.`
                    });
                } catch (error) {
                    await interaction.followUp({
                        content: `❌ Impossible d'expulser ${target}.`,
                        ephemeral: true
                    });
                }
            }

            // Log dans le canal de modération si configuré
            const guildData = await interaction.client.getGuild(interaction.guild.id, interaction.guild.name);
            if (guildData.modLogChannel) {
                const logChannel = interaction.guild.channels.cache.get(guildData.modLogChannel);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.colors.warning)
                        .setTitle('📋 Avertissement ajouté')
                        .addFields(
                            { name: '👤 Membre', value: `${target} (${target.tag})`, inline: true },
                            { name: '👮 Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '📊 Warnings', value: `${warnCount}/12`, inline: true },
                            { name: '📝 Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID: ${target.id}` });

                    if (autoAction) {
                        const actions = {
                            'kick': '👢 Expulsé automatiquement',
                            'ban_temporaire': '🔨 Banni 7 jours automatiquement',
                            'ban_permanent': '⛔ Banni définitivement'
                        };
                        logEmbed.addFields({
                            name: '🚨 Action',
                            value: actions[autoAction],
                            inline: false
                        });
                    }

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur warn:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'ajout de l\'avertissement.',
                ephemeral: true
            });
        }
    }
};
