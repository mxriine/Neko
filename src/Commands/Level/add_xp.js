const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'add_xp',
    data: new SlashCommandBuilder()
        .setName('add_xp')
        .setDescription('Ajoute de l\'XP à un utilisateur')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('L\'utilisateur à qui ajouter de l\'XP')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('La quantité d\'XP à ajouter')
                .setRequired(true)
                .setMinValue(1)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async runSlash(client, interaction) {
        const target = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        // Récupérer les données de l'utilisateur
        const userData = await client.getUser(target.id, target.username, interaction.guild.id);

        // Calculer le nouveau XP et niveau
        const newXp = userData.xp + amount;
        const newLevel = Math.floor(newXp / 100);

        // Mettre à jour la base de données
        await client.prisma.user.update({
            where: {
                discordId_guildId: {
                    discordId: target.id,
                    guildId: interaction.guild.id
                }
            },
            data: {
                xp: newXp,
                level: newLevel
            }
        });

        await interaction.reply({
            content: `✅ **${amount} XP** ajoutés à ${target}\nNouveau total : **${newXp} XP** (Niveau ${newLevel})`
        });
    },

    async run(message, client, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        // Récupérer l'utilisateur
        const target = message.mentions.users.first();
        if (!target) {
            return message.reply('❌ Merci de mentionner un utilisateur.');
        }

        // Récupérer le montant
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount < 1) {
            return message.reply('❌ Merci de spécifier un nombre valide supérieur à 0.');
        }

        // Récupérer les données de l'utilisateur
        const userData = await client.getUser(target.id, target.username, message.guild.id);

        // Calculer le nouveau XP et niveau
        const newXp = userData.xp + amount;
        const newLevel = Math.floor(newXp / 100);

        // Mettre à jour la base de données
        await client.prisma.user.update({
            where: {
                discordId_guildId: {
                    discordId: target.id,
                    guildId: message.guild.id
                }
            },
            data: {
                xp: newXp,
                level: newLevel
            }
        });

        await message.reply({
            content: `✅ **${amount} XP** ajoutés à ${target}\nNouveau total : **${newXp} XP** (Niveau ${newLevel})`
        });
    }
};
