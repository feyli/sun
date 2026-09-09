import { SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { ARCANE_GUILD_ID, TRANSPARENT_EMOJI } from '../../constants';
import { defineSlashCommand } from '../../types/commands';
import type { LevelRow, PlayerRow } from '../../types/database';
import { queryRows } from '../../utils/database';
import { guildsOnly } from '../../utils/commandScopes';
import { fetchSessionProfile } from '../../utils/mojang';

type LeaderboardRow = Pick<LevelRow, 'player_uuid' | 'points' | 'level'> & Pick<PlayerRow, 'player_name' | 'user_id'>;

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('Returns the leaderboard of Arcane Blades.')
            .addBooleanOption((option) => option.setName('full').setDescription('Whether to show the full leaderboard or not.')),
    ),
    category: 'Minecraft',
    guildId: ARCANE_GUILD_ID,
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const limit = interaction.options.getBoolean('full') ? 15 : 3;

        const players = await queryRows<LeaderboardRow>(
            interaction.client.arcanePool,
            'SELECT player_uuid, player_name, points, level, user_id FROM levels LEFT JOIN players USING (player_uuid) ORDER BY points DESC LIMIT ?',
            [limit],
        );
        if (players.length === 0) return interaction.editReply("There doesn't seem to be any player in the database.");

        let description = '';
        for (const [index, player] of players.entries()) {
            const playerName = player.player_name ?? (await fetchSessionProfile(player.player_uuid))?.name ?? 'Unknown player';
            const member = player.user_id ? interaction.guild.members.cache.get(player.user_id) : undefined;
            description += `**${index + 1}.** ${member?.toString() ?? playerName}\n${TRANSPARENT_EMOJI}➥ **Level ${player.level}** (${player.points} points)\n`;
        }

        const embed: APIEmbed = {
            title: ':trophy: **Minecraft Leaderboard** :trophy:',
            footer: {text: interaction.user.username, icon_url: interaction.user.displayAvatarURL()},
            timestamp: new Date().toISOString(),
            color: 0x2d8b76,
            description,
        };

        await interaction.editReply({embeds: [embed]});
    },
});
