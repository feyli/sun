/**
 * Row shapes for the Arcane Blades MariaDB database.
 * The bot's own tables are typed by Drizzle in `src/db/schema.ts`.
 */

export interface PlayerRow {
    player_uuid: string;
    user_id: string | null;
    player_name: string | null;
    total_playtime: number | null;
    /** Only present when selected as `UNIX_TIMESTAMP(last_played) AS last_played`. */
    last_played: number | null;
}

export interface LevelRow {
    player_uuid: string;
    points: number;
    level: number;
    points_until_next: number;
}
