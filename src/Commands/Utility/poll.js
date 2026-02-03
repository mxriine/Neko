const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('📊 Créer un sondage avec réactions')
        .addStringOption(option =>
            option
                .setName('titre')
                .setDescription('Titre du sondage')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('Question ou contenu du sondage')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Salon où envoyer le sondage (par défaut: salon actuel)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),

    category: 'Utility',

    async execute(client, interaction) {
        const titre = interaction.options.getString('titre');
        const question = interaction.options.getString('question');
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        // Vérifier les permissions dans le salon cible
        if (!targetChannel.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'AddReactions'])) {
            return interaction.reply({
                content: '❌ Je n\'ai pas les permissions nécessaires dans ce salon.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`📊 ${titre}`)
            .setDescription(question)
            .setTimestamp()
            .setFooter({
                text: `Sondage créé par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        try {
            const pollMessage = await targetChannel.send({ embeds: [embed] });

            // Ajout des réactions
            await pollMessage.react('✅');
            await pollMessage.react('❌');

            await interaction.reply({
                content: `✅ Sondage créé dans ${targetChannel}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Erreur poll:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la création du sondage.',
                ephemeral: true
            });
        }
    }
};
