module.exports = {
    command_data: {
        name: 'leaderboard',
        description: 'Returns the leaderboard of Arcane Blades.',
        type: 1,
        options: [
            {
                name: "full",
                description: "Whether to show the full leaderboard or not.",
                type: 5,
                required: false
            }
        ]
    },
    category: 'Minecraft',
    guild_id: '1108029635096223814',
    cooldown: 5000,
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const pool = client.arcanePool;

        const limit = interaction.options.getBoolean('full') ? 15 : 3;

        const res = await pool.query("SELECT player_uuid, player_name, points, level, user_id FROM levels LEFT JOIN players USING (player_uuid) ORDER BY points DESC LIMIT ?", [limit]);
        if (res.length === 0) return interaction.editReply("There doesn't seem to be any player in the database.");

        const embed = {
            title: ":trophy: **Minecraft Leaderboard** :trophy:",
            footer: {
                text: interaction.user.username,
                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
            },
            timestamp: new Date(),
            color: 0x2D8B76,
            description: ""
        };

        for (const player of res) {
            if (!player.user_id && !player.player_name) {
                const res = await fetch("https://sessionserver.mojang.com/session/minecraft/profile/" + player.player_uuid).then(res => res.json()).catch(() => null);
                player.name = res?.name;
            }
            player.name = player.player_name;
            embed.description += `**${(res.indexOf(player) + 1)}.** ${player.user_id ? interaction.guild.members.cache.get(player.user_id) || player.name : player.name}\n<:transparent:1115365589297397771>➥ **Level ${player.level}** (${player.points} points)\n`;
        }

        await interaction.editReply({ embeds: [embed] });
    }
};