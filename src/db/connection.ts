/**
 * PostgreSQL connection settings for the `sunbot` database.
 *
 * Lives apart from `src/config.ts` so that `drizzle.config.ts` can import it without
 * pulling in discord.js or requiring the bot's runtime secrets.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export const postgresConnection = {
    host: process.env.POSTGRES_HOST ?? 'dumbo.feyli.dev',
    port: Number(process.env.POSTGRES_PORT ?? '5432'),
    database: process.env.POSTGRES_DATABASE ?? 'sunbot',
    user: process.env.POSTGRES_USER ?? 'sunbot',
    password: requireEnv('POSTGRES_PASSWORD'),
} as const;
