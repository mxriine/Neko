const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vocal')
        .setDescription('🔊 Gérer ton salon vocal')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rename')
                .setDescription('Renommer ton salon vocal')
                .addStringOption(option =>
                    option
                        .setName('nom')
                        .setDescription('Nouveau nom du salon')
                        .setRequired(true)
                        .setMaxLength(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('limit')
                .setDescription('Définir une limite d\'utilisateurs')
                .addIntegerOption(option =>
                    option
                        .setName('nombre')
                        .setDescription('Nombre maximum d\'utilisateurs (0 = illimité)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(99)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Verrouiller ton salon (personne ne peut entrer)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Déverrouiller ton salon (ouvert à tous)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Expulser un membre de ton salon vocal')
                .addUserOption(option =>
                    option
                        .setName('membre')
                        .setDescription('Membre à expulser')
                        .setRequired(true)
                )
        )
        .setDMPermission(false),

    category: 'Utility',

    async execute(client, interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;

        // Vérification: membre dans un vocal
        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Tu n\'es pas dans un salon vocal !',
                ephemeral: true
            });
        }

        // Vérification: permissions de gérer le salon
        const perms = voiceChannel.permissionsFor(member);
        if (!perms?.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: '❌ Tu n\'as pas la permission de gérer ce salon vocal.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'rename': {
                    const newName = interaction.options.getString('nom');
                    await voiceChannel.setName(newName);
                    await interaction.reply({
                        content: `✅ Nom du salon changé en **${newName}**`,
                        ephemeral: true
                    });
                    break;
                }

                case 'limit': {
                    const limit = interaction.options.getInteger('nombre');
                    await voiceChannel.setUserLimit(limit);
                    await interaction.reply({
                        content: limit === 0 
                            ? '✅ Limite d\'utilisateurs retirée (illimité)'
                            : `✅ Limite d\'utilisateurs définie à **${limit}**`,
                        ephemeral: true
                    });
                    break;
                }

                case 'lock': {
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                        Connect: false
                    });
                    await interaction.reply({
                        content: '🔒 Salon verrouillé',
                        ephemeral: true
                    });
                    break;
                }

                case 'unlock': {
                    await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                        Connect: true
                    });
                    await interaction.reply({
                        content: '🔓 Salon déverrouillé',
                        ephemeral: true
                    });
                    break;
                }

                case 'kick': {
                    const targetUser = interaction.options.getUser('membre');
                    const targetMember = voiceChannel.members.get(targetUser.id);

                    if (!targetMember) {
                        return interaction.reply({
                            content: '❌ Ce membre n\'est pas dans ton salon vocal.',
                            ephemeral: true
                        });
                    }

                    if (targetMember.id === member.id) {
                        return interaction.reply({
                            content: '❌ Tu ne peux pas t\'expulser toi-même !',
                            ephemeral: true
                        });
                    }

                    await targetMember.voice.disconnect('Expulsé du salon vocal');
                    await interaction.reply({
                        content: `✅ ${targetUser.username} a été expulsé du salon`,
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Erreur vocal:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                ephemeral: true
            });
        }
    }
};
