const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thread')
        .setDescription('🧵 Gérer les threads')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer un nouveau thread')
                .addStringOption(option =>
                    option
                        .setName('nom')
                        .setDescription('Nom du thread')
                        .setRequired(true)
                        .setMaxLength(100)
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Message de départ (optionnel)')
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName('prive')
                        .setDescription('Thread privé (par défaut: public)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('archive')
                .setDescription('Archiver ce thread')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unarchive')
                .setDescription('Désarchiver ce thread')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Verrouiller ce thread')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Déverrouiller ce thread')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads)
        .setDMPermission(false),

    category: 'Utility',

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'create': {
                    const name = interaction.options.getString('nom');
                    const message = interaction.options.getString('message');
                    const isPrivate = interaction.options.getBoolean('prive') || false;

                    // Vérifier que le salon supporte les threads
                    if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(interaction.channel.type)) {
                        return interaction.reply({
                            content: '❌ Les threads ne peuvent être créés que dans les salons textuels.',
                            ephemeral: true
                        });
                    }

                    const thread = await interaction.channel.threads.create({
                        name: name,
                        type: isPrivate ? ChannelType.PrivateThread : ChannelType.PublicThread,
                        reason: `Thread créé par ${interaction.user.tag}`
                    });

                    if (message) {
                        await thread.send(message);
                    }

                    await interaction.reply({
                        content: `✅ Thread créé: ${thread}`,
                        ephemeral: true
                    });
                    break;
                }

                case 'archive': {
                    if (!interaction.channel.isThread()) {
                        return interaction.reply({
                            content: '❌ Cette commande ne peut être utilisée que dans un thread.',
                            ephemeral: true
                        });
                    }

                    await interaction.channel.setArchived(true);
                    await interaction.reply({
                        content: '✅ Thread archivé',
                        ephemeral: true
                    });
                    break;
                }

                case 'unarchive': {
                    if (!interaction.channel.isThread()) {
                        return interaction.reply({
                            content: '❌ Cette commande ne peut être utilisée que dans un thread.',
                            ephemeral: true
                        });
                    }

                    await interaction.channel.setArchived(false);
                    await interaction.reply({
                        content: '✅ Thread désarchivé',
                        ephemeral: true
                    });
                    break;
                }

                case 'lock': {
                    if (!interaction.channel.isThread()) {
                        return interaction.reply({
                            content: '❌ Cette commande ne peut être utilisée que dans un thread.',
                            ephemeral: true
                        });
                    }

                    await interaction.channel.setLocked(true);
                    await interaction.reply({
                        content: '🔒 Thread verrouillé',
                        ephemeral: true
                    });
                    break;
                }

                case 'unlock': {
                    if (!interaction.channel.isThread()) {
                        return interaction.reply({
                            content: '❌ Cette commande ne peut être utilisée que dans un thread.',
                            ephemeral: true
                        });
                    }

                    await interaction.channel.setLocked(false);
                    await interaction.reply({
                        content: '🔓 Thread déverrouillé',
                        ephemeral: true
                    });
                    break;
                }
            }
        } catch (error) {
            console.error('Erreur thread:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
                ephemeral: true
            });
        }
    }
};
