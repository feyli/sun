import { fromBunSql, PgBoss, type Queue } from 'pg-boss';
import { client } from './index';

/**
 * The bot's job queue, living in the `pgboss` schema of the bot's own database.
 *
 * It runs on the existing `Bun.SQL` client instead of pg-boss's bundled `pg` pool, so the bot
 * keeps one connection pool and one set of credentials. pg-boss owns its schema and applies
 * its own migrations, which is why `startQueue()` has to run before any job is sent.
 */
export const boss = new PgBoss({db: fromBunSql(client)});

// Queue-level failures (a dropped connection, a maintenance error) are emitted rather than thrown.
boss.on('error', (error) => console.error('[ERROR] Job queue:', error));

/** Brings the queue up and creates every queue the bot sends to. Both are required by pg-boss. */
export async function startQueue(queues: readonly Queue[]): Promise<void> {
    console.log('[INFO] Starting the job queue...');
    await boss.start();
    for (const {name, ...options} of queues) await boss.createQueue(name, options);
    console.log(`[INFO] Job queue ready (${queues.length} queue(s)).`);
}

/** Lets in-flight jobs finish before the process exits, so they are not left to expire. */
export async function stopQueue(): Promise<void> {
    await boss.stop({graceful: true});
}
