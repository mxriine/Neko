const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('🎫 Gérer les tickets')
        .addSubcommand(sub =>
            sub
                .setName('add')
                .setDescription('Ajouter un membre au ticket')
                .addUserOption(option =>
                    option
                        .setName('membre')
                        .setDescription('Membre à ajouter')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('remove')
                .setDescription('Retirer un membre du ticket')
                .addUserOption(option =>
                    option
                        .setName('membre')
                        .setDescription('Membre à retirer')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),

    category: 'Utility',

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const member = interaction.options.getMember('membre');

            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({
                    content: 'Cette commande ne peut être utilisée que dans un ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                await interaction.channel.permissionOverwrites.create(member, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });

                await interaction.reply({
                    content: `${member} a été ajouté au ticket.`
                });

            } catch (error) {
                console.error('Erreur ticket add:', error);
                await interaction.reply({
                    content: 'Impossible d\'ajouter ce membre.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        else if (subcommand === 'remove') {
            const member = interaction.options.getMember('membre');

            if (!interaction.channel.name.startsWith('ticket-')) {
                return interaction.reply({
                    content: 'Cette commande ne peut être utilisée que dans un ticket.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                await interaction.channel.permissionOverwrites.delete(member);

                await interaction.reply({
                    content: `${member} a été retiré du ticket.`
                });

            } catch (error) {
                console.error('Erreur ticket remove:', error);
                await interaction.reply({
                    content: 'Impossible de retirer ce membre.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
