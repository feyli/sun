import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { ARCANE_GUILD_ID } from '../../constants';
import { defineSlashCommand } from '../../types/commands';
import type { LevelRow, PlayerRow } from '../../types/database';
import { guildsOnly } from '../../utils/commandScopes';
import { queryRow } from '../../utils/database';
import { fetchProfileByUuid } from '../../utils/mojang';

/** Formats seconds as `X hours Y minutes Z seconds`, omitting empty units. */
function formatPlaytime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(hours + ' hour' + (hours > 1 ? 's' : ''));
    if (minutes > 0) parts.push(minutes + ' minute' + (minutes > 1 ? 's' : ''));
    if (seconds > 0) parts.push(seconds + ' second' + (seconds > 1 ? 's' : ''));
    return parts.join(' ');
}

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('profile')
            .setDescription('Returns the profile of an Arcane Blades player.')
            .addUserOption((option) => option.setName('player').setDescription('The player you want to get the profile of.')),
    ),
    category: 'Minecraft',
    cooldown: 2000,
    guildId: ARCANE_GUILD_ID,
    async execute(interaction) {
        const pool = interaction.client.arcanePool;

        await interaction.deferReply();

        const requestedUser = interaction.options.getUser('player');
        const targetUser = requestedUser ?? interaction.user;

        const link = await queryRow<Pick<PlayerRow, 'player_uuid'>>(pool, 'SELECT player_uuid FROM players WHERE user_id = ?', [targetUser.id]);
        if (!link) {
            return interaction.editReply(
                requestedUser ? "This player didn't link their Minecraft profile to their Discord profile." : "Your Minecraft profile isn't linked to your Discord profile.",
            );
        }
        const playerUuid = link.player_uuid;

        const level = await queryRow<Pick<LevelRow, 'points' | 'level' | 'points_until_next'>>(pool, 'SELECT points, level, points_until_next FROM levels WHERE player_uuid = ?', [
            playerUuid,
        ]);
        if (!level) {
            return interaction.editReply("This player is not in my database because they haven't played more than a minute in a row. **Is this wrong? Contact us!**");
        }

        const minecraftUsername = (await fetchProfileByUuid(playerUuid))?.name;

        const player = await queryRow<Pick<PlayerRow, 'total_playtime' | 'last_played'>>(
            pool,
            'SELECT total_playtime, UNIX_TIMESTAMP(last_played) AS last_played FROM players WHERE player_uuid = ?',
            [playerUuid],
        );
        const totalPlaytime = player?.total_playtime ?? 0;
        const lastPlayed = player?.last_played ?? null;

        const embed = new EmbedBuilder()
            .setTitle('__' + (minecraftUsername ?? targetUser.username) + "__'s profile")
            .setColor(0x2d8b76)
            .setThumbnail('https://mc-heads.net/avatar/' + playerUuid)
            .addFields([
                {name: 'Level', value: level.level.toString()},
                {name: 'Total points', value: level.points.toString()},
                {name: 'Points required for next level', value: level.points_until_next.toString()},
                {name: 'Total playtime', value: formatPlaytime(totalPlaytime)},
                {
                    name: 'Last played',
                    value: lastPlayed === null ? 'Never' : Math.floor(Date.now() / 1000) - lastPlayed < 5 ? ':green_circle: Now' : `<t:${lastPlayed}:R>`,
                },
            ])
            .setFooter({text: 'Requested by ' + interaction.user.username, iconURL: interaction.user.avatarURL() ?? undefined});

        await interaction.editReply({embeds: [embed]});
    },
});
