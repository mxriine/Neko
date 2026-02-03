const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    once: false,

    async execute(client, member) {
        try {
            // Mettre à jour le statut de l'utilisateur dans la BDD
            await client.prisma.user.upsert({
                where: {
                    discordId_guildId: {
                        discordId: member.user.id,
                        guildId: member.guild.id
                    }
                },
                update: {
                    inGuild: true,
                    leftAt: null,
                    username: member.user.username
                },
                create: {
                    discordId: member.user.id,
                    username: member.user.username,
                    guildId: member.guild.id,
                    inGuild: true
                }
            });

            const guildData = await client.getGuild(member.guild.id, member.guild.name);
            if (!guildData) return;

            // WELCOME MESSAGE
            if (guildData.welcomeEnabled && guildData.welcomeChannel) {
                const welcomeChannel = client.channels.cache.get(guildData.welcomeChannel);
                if (welcomeChannel) {
                    const message = guildData.welcomeMessage
                        .replace('{user}', `<@${member.user.id}>`)
                        .replace('{server}', member.guild.name)
                        .replace('{memberCount}', member.guild.memberCount.toString());

                    welcomeChannel.send({ content: message }).catch(() => {});
                }
            }

            // LOGS
            if (guildData.logsEnabled && guildData.logsChannel && guildData.logsJoins) {
                const logChannel = client.channels.cache.get(guildData.logsChannel);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor(0x57f287)
                        .setTitle('📥 Membre rejoint')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: '👤 Utilisateur', value: `${member.user} (${member.user.tag})`, inline: true },
                            { name: '🆔 ID', value: member.user.id, inline: true },
                            { name: '📅 Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                            { name: '👥 Membres', value: member.guild.memberCount.toString(), inline: true }
                        )
                        .setTimestamp();

                    logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }

            // AUTO ROLE
            if (guildData.autoRoleEnabled && guildData.autoRoleId) {
                const role = member.guild.roles.cache.get(guildData.autoRoleId);
                if (role) {
                    member.roles.add(role).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Erreur guildMemberAdd:', error);
        }
    }
};
