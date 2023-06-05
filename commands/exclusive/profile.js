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
        const db = client.arcaneDb;

        await interaction.deferReply({ ephemeral: false });

        const userId = interaction.options.getUser('player')?.id || interaction.user.id;

        const [result] = await db.query('SELECT player_uuid FROM players WHERE user_id = ?', [userId]);
        if (!result && interaction.options.getUser('player')) return interaction.editReply(`This player didn't link their Minecraft profile to their Discord profile.`);
        else if (!result) return interaction.editReply(`Your Minecraft profile isn't linked to your Discord profile.`);
        const playerUuid = result.player_uuid;

        const [row] = await db.query('SELECT points, level, points_until_next FROM levels WHERE player_uuid = ?', [playerUuid]);

        if (!row) return interaction.editReply('This player is not in my database because they haven\'t played more than a minute in a row. **Is this wrong? Contact us!**');

        const { name: MCUsername } = await fetch('https://api.mojang.com/user/profile/' + playerUuid).then(res => res.json()).catch(() => null);

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
                }
            ])
            .setFooter({
                text: "Requested by " + interaction.user.username,
                iconURL: interaction.user.avatarURL({ dynamic: true })
            });

        await interaction.editReply({ embeds: [embed] });
    }
};