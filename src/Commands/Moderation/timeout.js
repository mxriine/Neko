const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../../config/bot.config');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('⏱️ Mettre un membre en timeout')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Le membre à timeout')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('duree')
                .setDescription('Durée du timeout (ex: 10m, 1h, 2d)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('raison')
                .setDescription('Raison du timeout')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),

    category: 'Moderation',

    async execute(client, interaction) {
        const target = interaction.options.getUser('membre');
        const duration = interaction.options.getString('duree');
        const reason = interaction.options.getString('raison') || 'Aucune raison spécifiée';
        const member = interaction.guild.members.cache.get(target.id);

        // Vérifications
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas vous timeout vous-même !',
                ephemeral: true
            });
        }

        if (target.bot) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas timeout un bot !',
                ephemeral: true
            });
        }

        if (!member) {
            return interaction.reply({
                content: '❌ Ce membre n\'est pas sur le serveur.',
                ephemeral: true
            });
        }

        if (!member.moderatable) {
            return interaction.reply({
                content: '❌ Je ne peux pas timeout ce membre (rôle supérieur ou permissions insuffisantes).',
                ephemeral: true
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ Vous ne pouvez pas timeout ce membre (rôle supérieur ou égal).',
                ephemeral: true
            });
        }

        // Parser la durée
        const timeMs = ms(duration);
        if (!timeMs || timeMs < 1000 || timeMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                content: '❌ Durée invalide ! Utilisez un format comme `10m`, `1h`, `2d` (max 28 jours).',
                ephemeral: true
            });
        }

        try {
            // MP à l'utilisateur
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setTitle(`⏱️ Vous avez été timeout sur ${interaction.guild.name}`)
                    .addFields(
                        { name: '⏰ Durée', value: duration, inline: true },
                        { name: '📝 Raison', value: reason, inline: false },
                        { name: '👮 Par', value: interaction.user.tag, inline: false }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                // L'utilisateur a bloqué les MPs
            }

            // Timeout
            await member.timeout(timeMs, reason);

            // Embed de confirmation
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('⏱️ Membre en timeout')
                .setDescription(`${target} a été mis en timeout`)
                .addFields(
                    { name: '👤 Membre', value: target.tag, inline: true },
                    { name: '⏰ Durée', value: duration, inline: true },
                    { name: '👮 Modérateur', value: interaction.user.tag, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '⏳ Fin', value: `<t:${Math.floor((Date.now() + timeMs) / 1000)}:R>`, inline: false }
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
                        .setColor(config.colors.warning)
                        .setTitle('📋 Membre en timeout')
                        .addFields(
                            { name: '👤 Membre', value: `${target} (${target.tag})`, inline: true },
                            { name: '👮 Modérateur', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                            { name: '⏰ Durée', value: duration, inline: true },
                            { name: '📝 Raison', value: reason, inline: false }
                        )
                        .setTimestamp()
                        .setFooter({ text: `ID: ${target.id}` });

                    await logChannel.send({ embeds: [logEmbed] });
                }
            }

        } catch (error) {
            console.error('Erreur timeout:', error);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors du timeout.',
                ephemeral: true
            });
        }
    }
};
