import type { Pool, UpsertResult } from 'mariadb';

/**
 * Helpers for the Arcane Blades MariaDB database. The bot's own database is
 * PostgreSQL and is queried through Drizzle instead (see `src/db`).
 */

/** Runs a SELECT and returns the rows typed as `T`. */
export function queryRows<T>(pool: Pool, sql: string, values?: readonly unknown[]): Promise<T[]> {
    return pool.query<T[]>(sql, values);
}

/** Runs a SELECT and returns the first row, if any. */
export async function queryRow<T>(pool: Pool, sql: string, values?: readonly unknown[]): Promise<T | undefined> {
    const rows = await queryRows<T>(pool, sql, values);
    return rows[0];
}

/** Runs an INSERT / UPDATE / DELETE statement. */
export function execute(pool: Pool, sql: string, values?: readonly unknown[]): Promise<UpsertResult> {
    return pool.query<UpsertResult>(sql, values);
}
