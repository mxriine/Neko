const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    once: false,

    async execute(client, member) {
        try {
            // Mettre à jour le statut de l'utilisateur dans la BDD
            await client.prisma.user.updateMany({
                where: {
                    discordId: member.user.id,
                    guildId: member.guild.id
                },
                data: {
                    inGuild: false,
                    leftAt: new Date()
                }
            });

            const guildData = await client.getGuild(member.guild.id, member.guild.name);
            if (!guildData) return;

            // BYE MESSAGE
            if (guildData.byeEnabled && guildData.byeChannel) {
                const byeChannel = client.channels.cache.get(guildData.byeChannel);
                if (byeChannel) {
                    const message = guildData.byeMessage
                        .replace('{user}', member.user.tag)
                        .replace('{server}', member.guild.name)
                        .replace('{memberCount}', member.guild.memberCount.toString());

                    byeChannel.send({ content: message }).catch(() => {});
                }
            }

            // LOGS
            if (guildData.logsEnabled && guildData.logsChannel && guildData.logsLeaves) {
                const logChannel = client.channels.cache.get(guildData.logsChannel);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor(0xed4245)
                        .setTitle('📤 Membre quitté')
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: '👤 Utilisateur', value: `${member.user} (${member.user.tag})`, inline: true },
                            { name: '🆔 ID', value: member.user.id, inline: true },
                            { name: '📅 A rejoint', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                            { name: '👥 Membres restants', value: member.guild.memberCount.toString(), inline: true }
                        )
                        .setTimestamp();

                    logChannel.send({ embeds: [embed] }).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Erreur guildMemberRemove:', error);
        }
    }
};
