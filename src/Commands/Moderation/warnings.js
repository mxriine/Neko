const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('📋 Voir les avertissements d\'un membre')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre dont afficher les warnings (vous par défaut)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const target = interaction.options.getUser('membre') || interaction.user;

        try {
            const warnings = await interaction.client.getWarnings(target.id, interaction.guild.id);

            if (warnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle('✅ Aucun avertissement')
                    .setDescription(`${target} n'a aucun avertissement sur ce serveur.`)
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // Créer la liste des warnings
            const warningsList = warnings.map((warn, index) => {
                const moderator = interaction.guild.members.cache.get(warn.moderator);
                const modTag = moderator ? moderator.user.tag : 'Modérateur inconnu';
                const date = new Date(warn.createdAt);
                
                return [
                    `**#${index + 1}** • <t:${Math.floor(date.getTime() / 1000)}:R>`,
                    `**Raison:** ${warn.reason}`,
                    `**Par:** ${modTag}`,
                    ''
                ].join('\n');
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle(`⚠️ Avertissements de ${target.tag}`)
                .setDescription(warningsList)
                .setThumbnail(target.displayAvatarURL())
                .addFields({
                    name: '📊 Total',
                    value: `${warnings.length}/${config.features.moderation.maxWarnings} avertissements`,
                    inline: false
                })
                .setTimestamp()
                .setFooter({ text: `ID: ${target.id}` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur warnings:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de la récupération des avertissements.',
                ephemeral: true
            });
        }
    }
};
