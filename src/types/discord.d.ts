import type { Collection, Snowflake } from 'discord.js';
import type { Pool } from 'mariadb';
import type { Database } from '../db';
import type { Command, ComponentHandler } from './commands';

/**
 * Teaches discord.js about the properties `SunClient` adds, so that every
 * `interaction.client` / `guild.client` is typed without threading the client
 * through each handler's parameters.
 */
declare module 'discord.js' {
    interface Client {
        /** Application commands, keyed by command name. */
        commands: Collection<string, Command>;
        /** Button and modal handlers, keyed by custom ID. */
        components: Collection<string, ComponentHandler>;
        /** Users currently on cooldown, keyed by command name or custom ID. */
        cooldowns: Collection<string, Set<Snowflake>>;
        /** The bot's own data: PostgreSQL through Drizzle. */
        db: Database;
        /** Arcane Blades data: still MariaDB, shared with the Minecraft server plugin. */
        arcanePool: Pool;
    }
}
