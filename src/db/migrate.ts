import { migrate } from 'drizzle-orm/bun-sql/migrator';
import { fileURLToPath } from 'node:url';
import { db } from './index';

/**
 * The migrations live at the repository root, so resolve them from this module rather than
 * from the working directory: the container runs `bun run start` from /usr/src/app, but a
 * local `bun src/index.ts` may be invoked from anywhere.
 */
const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * Applies every pending migration. Run on start-up so a deployment is always on the latest
 * schema; drizzle-kit is a devDependency and is absent from the production image, so this
 * uses the runtime migrator from drizzle-orm instead of the CLI.
 */
export async function runMigrations(): Promise<void> {
    console.log('[INFO] Applying database migrations...');
    await migrate(db, {migrationsFolder});
    console.log('[INFO] Database is up to date.');
}
