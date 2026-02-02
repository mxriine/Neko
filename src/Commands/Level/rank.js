const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'rank',
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Affiche la carte de niveau d\'un utilisateur')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('L\'utilisateur dont afficher le rang')
                .setRequired(false)
        ),

    async runSlash(client, interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        // Récupérer les données de l'utilisateur
        const userData = await client.getUser(target.id, target.username, interaction.guild.id);

        // Calculer le rang
        const allUsers = await client.prisma.user.findMany({
            where: { guildId: interaction.guild.id },
            orderBy: { xp: 'desc' }
        });

        const rank = allUsers.findIndex(u => u.discordId === target.id) + 1;

        // Calculer l'XP nécessaire pour le prochain niveau
        const xpNeeded = userData.level * 100;
        const xpProgress = userData.xp % 100;
        const percentage = Math.floor((xpProgress / 100) * 100);

        // Créer la barre de progression
        const barLength = 20;
        const filledBars = Math.floor((percentage / 100) * barLength);
        const emptyBars = barLength - filledBars;
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ 
                name: target.tag, 
                iconURL: target.displayAvatarURL() 
            })
            .addFields(
                { name: 'Rang', value: `#${rank}`, inline: true },
                { name: 'Niveau', value: `${userData.level}`, inline: true },
                { name: 'XP Total', value: `${userData.xp}`, inline: true },
                { 
                    name: 'Progression', 
                    value: `\`${progressBar}\` ${xpProgress}/${xpNeeded} XP (${percentage}%)`,
                    inline: false 
                }
            )
            .setThumbnail(member.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `${allUsers.length} utilisateurs au total` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async run(message, client, args) {
        let target = message.author;

        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) {
                target = mention;
            } else if (args[0].match(/^\d+$/)) {
                try {
                    target = await message.client.users.fetch(args[0]);
                } catch (error) {
                    return message.reply('Utilisateur introuvable.');
                }
            }
        }

        const member = await message.guild.members.fetch(target.id);

        // Récupérer les données de l'utilisateur
        const userData = await client.getUser(target.id, target.username, message.guild.id);

        // Calculer le rang
        const allUsers = await message.client.prisma.user.findMany({
            where: { guildId: message.guild.id },
            orderBy: { xp: 'desc' }
        });

        const rank = allUsers.findIndex(u => u.discordId === target.id) + 1;

        // Calculer l'XP nécessaire pour le prochain niveau
        const xpNeeded = userData.level * 100;
        const xpProgress = userData.xp % 100;
        const percentage = Math.floor((xpProgress / 100) * 100);

        // Créer la barre de progression
        const barLength = 20;
        const filledBars = Math.floor((percentage / 100) * barLength);
        const emptyBars = barLength - filledBars;
        const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setAuthor({ 
                name: target.tag, 
                iconURL: target.displayAvatarURL() 
            })
            .addFields(
                { name: 'Rang', value: `#${rank}`, inline: true },
                { name: 'Niveau', value: `${userData.level}`, inline: true },
                { name: 'XP Total', value: `${userData.xp}`, inline: true },
                { 
                    name: 'Progression', 
                    value: `\`${progressBar}\` ${xpProgress}/${xpNeeded} XP (${percentage}%)`,
                    inline: false 
                }
            )
            .setThumbnail(member.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `${allUsers.length} utilisateurs au total` })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
