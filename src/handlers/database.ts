import { createPool, type Pool } from 'mariadb';
import { config } from '../config';

/**
 * The Arcane Blades database is still MariaDB and is written to by the Minecraft
 * server plugin, so it is deliberately left outside the Drizzle/PostgreSQL setup.
 */
export function createArcanePool(): Pool {
    const pool = createPool({
        ...config.databases.arcane,
        bigIntAsNumber: true,
    });
    console.log('[INFO] Arcane Database connection established!');
    return pool;
}
