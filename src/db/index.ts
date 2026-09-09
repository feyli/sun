import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { postgresConnection } from './connection';

/**
 * Bun's native PostgreSQL client, wrapped by Drizzle.
 * Discrete credentials avoid percent-encoding problems in a connection URL.
 */
const client = new SQL({
    hostname: postgresConnection.host,
    port: postgresConnection.port,
    database: postgresConnection.database,
    username: postgresConnection.user,
    password: postgresConnection.password,
    max: 10,
});

export const db = drizzle({client});

export type Database = typeof db;

export * as schema from './schema';
