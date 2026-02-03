const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('⚙️ Configurer l\'auto-modération')
        .addSubcommand(sub =>
            sub
                .setName('status')
                .setDescription('Voir l\'état de l\'auto-modération')
        )
        .addSubcommand(sub =>
            sub
                .setName('enable')
                .setDescription('Activer l\'auto-modération')
        )
        .addSubcommand(sub =>
            sub
                .setName('disable')
                .setDescription('Désactiver l\'auto-modération')
        )
        .addSubcommand(sub =>
            sub
                .setName('antispam')
                .setDescription('Activer/Désactiver l\'anti-spam')
                .addBooleanOption(option =>
                    option
                        .setName('actif')
                        .setDescription('Activer ou désactiver')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('antilink')
                .setDescription('Activer/Désactiver l\'anti-liens')
                .addBooleanOption(option =>
                    option
                        .setName('actif')
                        .setDescription('Activer ou désactiver')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('setlogchannel')
                .setDescription('Définir le salon de logs de modération')
                .addChannelOption(option =>
                    option
                        .setName('salon')
                        .setDescription('Salon pour les logs de modération')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('addword')
                .setDescription('Ajouter un mot à la liste des mots interdits')
                .addStringOption(option =>
                    option
                        .setName('mot')
                        .setDescription('Mot à interdire')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            const guildData = await interaction.client.getGuild(
                interaction.guild.id,
                interaction.guild.name
            );

            switch (subcommand) {
                case 'status': {
                    const autoMod = config.features.moderation.autoMod;
                    
                    const embed = new EmbedBuilder()
                        .setColor(config.colors.info)
                        .setTitle('⚙️ État de l\'Auto-Modération')
                        .addFields(
                            {
                                name: 'Auto-Modération',
                                value: guildData.autoModEnabled ? 'Activée' : 'Désactivée',
                                inline: true
                            },
                            {
                                name: 'Anti-Spam',
                                value: guildData.antiSpam ? 'Actif' : 'Inactif',
                                inline: true
                            },
                            {
                                name: 'Anti-Liens',
                                value: guildData.antiLink ? 'Actif' : 'Inactif',
                                inline: true
                            },
                            {
                                name: 'Configuration Anti-Spam',
                                value: `• Max messages: **${autoMod.spam.maxMessages}** en **${autoMod.spam.timeWindow / 1000}s**\n` +
                                       `• Timeout: **${autoMod.spam.muteTime / 60000} minutes**\n` +
                                       `• Warn après: **${autoMod.spam.warnAfter}** infractions`,
                                inline: false
                            },
                            {
                                name: 'Domaines autorisés',
                                value: autoMod.links.allowedDomains.map(d => `\`${d}\``).join(', ') || 'Aucun',
                                inline: false
                            },
                            {
                                name: 'Anti-Mentions',
                                value: `Max **${autoMod.mentions.maxMentions}** mentions par message`,
                                inline: true
                            },
                            {
                                name: 'Anti-CAPS',
                                value: `Max **${autoMod.caps.percentage}%** de CAPS (min ${autoMod.caps.minLength} caractères)`,
                                inline: true
                            },
                            {
                                name: 'Logs',
                                value: guildData.modLogChannel ? `<#${guildData.modLogChannel}>` : '❌ Non configuré',
                                inline: false
                            }
                        )
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                    break;
                }

                case 'enable': {
                    await interaction.client.prisma.guild.update({
                        where: { id: interaction.guild.id },
                        data: { autoModEnabled: true }
                    });

                    await interaction.reply({
                        content: 'Auto-modération activée !',
                        ephemeral: true
                    });
                    break;
                }

                case 'disable': {
                    await interaction.client.prisma.guild.update({
                        where: { id: interaction.guild.id },
                        data: { autoModEnabled: false }
                    });

                    await interaction.reply({
                        content: 'Auto-modération désactivée.',
                        ephemeral: true
                    });
                    break;
                }

                case 'antispam': {
                    const enabled = interaction.options.getBoolean('actif');

                    await interaction.client.prisma.guild.update({
                        where: { id: interaction.guild.id },
                        data: { antiSpam: enabled }
                    });

                    await interaction.reply({
                        content: enabled ? 'Anti-spam activé !' : 'Anti-spam désactivé.',
                        ephemeral: true
                    });
                    break;
                }

                case 'antilink': {
                    const enabled = interaction.options.getBoolean('actif');

                    await interaction.client.prisma.guild.update({
                        where: { id: interaction.guild.id },
                        data: { antiLink: enabled }
                    });

                    await interaction.reply({
                        content: enabled ? 'Anti-liens activé !' : 'Anti-liens désactivé.',
                        ephemeral: true
                    });
                    break;
                }

                case 'setlogchannel': {
                    const channel = interaction.options.getChannel('salon');

                    await interaction.client.prisma.guild.update({
                        where: { id: interaction.guild.id },
                        data: { modLogChannel: channel.id }
                    });

                    await interaction.reply({
                        content: `Salon de logs défini sur ${channel}`,
                        ephemeral: true
                    });
                    break;
                }

                case 'addword': {
                    const word = interaction.options.getString('mot').toLowerCase();

                    // Note: Ceci nécessiterait un champ dans la BDD pour stocker les mots
                    // Pour l'instant, on utilise la config globale
                    if (!config.features.moderation.autoMod.badWords.words.includes(word)) {
                        config.features.moderation.autoMod.badWords.words.push(word);
                    }

                    await interaction.reply({
                        content: `Mot ajouté à la liste des mots interdits : \`${word}\``,
                        ephemeral: true
                    });
                    break;
                }
            }

        } catch (error) {
            console.error('Erreur automod:', error);
            await interaction.reply({
                content: 'Une erreur est survenue.',
                ephemeral: true
            });
        }
    }
};
