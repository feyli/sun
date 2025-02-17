// noinspection JSUnresolvedVariable

const { EmbedBuilder } = require("discord.js");

module.exports = {
    command_data: {
        name: 'profile',
        description: 'Returns the profile of an Arcane Blades player.',
        type: 1,
        options: [
            {
                name: 'player',
                description: 'The player you want to get the profile of.',
                type: 6,
                required: false
            }
        ],
    },
    category: 'Minecraft',
    cooldown: 2000,
    guild_id: '1108029635096223814',
    run: async (client, interaction) => {
        const conn = await client.arcanePool.getConnection();

        await interaction.deferReply({ ephemeral: false });

        const userId = interaction.options.getUser('player')?.id || interaction.user.id;

        const [result] = await conn.query('SELECT player_uuid FROM players WHERE user_id = ?', [userId]);
        if (!result && interaction.options.getUser('player')) return interaction.editReply(`This player didn't link their Minecraft profile to their Discord profile.`);
        else if (!result) return interaction.editReply(`Your Minecraft profile isn't linked to your Discord profile.`);
        const playerUuid = result.player_uuid;

        const [row] = await conn.query('SELECT points, level, points_until_next FROM levels WHERE player_uuid = ?', [playerUuid]);

        if (!row) return interaction.editReply('This player is not in my database because they haven\'t played more than a minute in a row. **Is this wrong? Contact us!**');

        const { name: MCUsername } = await fetch('https://api.mojang.com/user/profile/' + playerUuid).then(res => res.json()).catch(() => null);

        const [player] = await conn.query('SELECT total_playtime, UNIX_TIMESTAMP(last_played) AS last_played FROM players WHERE player_uuid = ?', [playerUuid]);
        const totalPlaytime = player.total_playtime;
        const lastPlayed = player.last_played;
        // format seconds in hours, minutes and seconds (only show hours if there are any, same for minutes) and show an s if there is only one hour/minute/second
        const hours = Math.floor(totalPlaytime / 3600);
        const minutes = Math.floor((totalPlaytime % 3600) / 60);
        const seconds = Math.floor(totalPlaytime % 60);
        const formattedTime = [];
        if (hours > 0) formattedTime.push(hours + ' hour' + (hours > 1 ? 's' : ''));
        if (minutes > 0) formattedTime.push(minutes + ' minute' + (minutes > 1 ? 's' : ''));
        if (seconds > 0) formattedTime.push(seconds + ' second' + (seconds > 1 ? 's' : ''));

        const embed = new EmbedBuilder()
            .setTitle("__" + (MCUsername ?? client.users.cache.get(userId).username) + '__\'s profile')
            .setColor(0x2D8B76)
            .setThumbnail('https://mc-heads.net/avatar/' + playerUuid)
            .addFields([
                {
                    name: "Level",
                    value: row.level.toString()
                },
                {
                    name: "Total points",
                    value: row.points.toString()
                },
                {
                    name: "Points required for next level",
                    value: row.points_until_next.toString()
                },
                {
                    name: "Total playtime",
                    value: formattedTime.join(' ')
                },
                {
                    name: "Last played",
                    value: Math.floor(Date.now() / 1000) - lastPlayed < 5 ? ":green_circle: Now" : `<t:${lastPlayed}:R>`
                }
            ])
            .setFooter({
                text: "Requested by " + interaction.user.username,
                iconURL: interaction.user.avatarURL({ dynamic: true })
            });

        await interaction.editReply({ embeds: [embed] });
    }
};