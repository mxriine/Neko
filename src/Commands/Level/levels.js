const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'levels',
    data: new SlashCommandBuilder()
        .setName('levels')
        .setDescription('Affiche le classement des niveaux du serveur'),

    async runSlash(client, interaction) {
        // Récupérer tous les utilisateurs du serveur triés par XP
        const users = await client.prisma.user.findMany({
            where: { guildId: interaction.guild.id },
            orderBy: { xp: 'desc' },
            take: 10
        });

        if (users.length === 0) {
            return interaction.reply({
                content: 'Aucun utilisateur n\'a d\'XP sur ce serveur.',
                ephemeral: true
            });
        }

        // Créer le texte du classement
        let description = '';
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const member = await interaction.guild.members.fetch(user.discordId).catch(() => null);
            const username = member ? member.user.tag : user.username;

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
            description += `${medal} ${username}\n`;
            description += `└ Niveau ${user.level} • ${user.xp.toLocaleString()} XP\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🏆 Classement des Niveaux')
            .setDescription(description)
            .setFooter({ 
                text: `Top ${users.length} utilisateurs`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async run(message, client) {
        // Récupérer tous les utilisateurs du serveur triés par XP
        const users = await client.prisma.user.findMany({
            where: { guildId: message.guild.id },
            orderBy: { xp: 'desc' },
            take: 10
        });

        if (users.length === 0) {
            return message.reply('Aucun utilisateur n\'a d\'XP sur ce serveur.');
        }

        // Créer le texte du classement
        let description = '';
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const member = await message.guild.members.fetch(user.discordId).catch(() => null);
            const username = member ? member.user.tag : user.username;

            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
            description += `${medal} ${username}\n`;
            description += `└ Niveau ${user.level} • ${user.xp.toLocaleString()} XP\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Classement des Niveaux')
            .setDescription(description)
            .setFooter({ 
                text: `Top ${users.length} utilisateurs`,
                iconURL: message.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
