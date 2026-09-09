import type { Client } from 'discord.js';
import type { PlayerRow } from '../types/database';
import { queryRows } from '../utils/database';
import { fetchSessionProfile } from '../utils/mojang';

/** Refreshes the stored Minecraft username of every known player from Mojang's session server. */
export async function updatePlayerNames(client: Client): Promise<void> {
    const pool = client.arcanePool;
    const players = await queryRows<Pick<PlayerRow, 'player_uuid'>>(pool, 'SELECT player_uuid FROM players');

    const values: [string, string, string][] = [];
    for (const player of players) {
        const profile = await fetchSessionProfile(player.player_uuid);
        if (!profile?.name) continue;
        values.push([player.player_uuid, profile.name, profile.name]);
    }
    if (values.length === 0) return;

    await pool.batch('INSERT INTO players (player_uuid, player_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_name=?', values);
}
