import type { ClientOptions, Snowflake } from 'discord.js';

/** Connection settings for the Arcane Blades MariaDB database. */
export interface MariaDbConfig {
    host: string;
    user: string;
    password: string;
    database: string;
}

export interface SunConfig {
    client: {
        options: ClientOptions;
        token: string;
        id: Snowflake;
    };
    users: {
        owner: Snowflake;
    };
    channels: {
        loggingChannel: Snowflake;
    };
    databases: {
        /**
         * The bot's own data lives in PostgreSQL and is reached through Drizzle;
         * its connection settings are in `src/db/connection.ts`.
         */
        arcane: MariaDbConfig;
    };
}
