/**
 * PostgreSQL connection settings for the bot's database.
 *
 * Every value comes from the environment; there are no defaults, so nothing about the
 * deployment is baked into the repository. Lives apart from `src/config.ts` so that
 * `drizzle.config.ts` can import it without pulling in discord.js or the bot's secrets.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

function requirePort(name: string): number {
    const raw = requireEnv(name);
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`Environment variable ${name} must be a port number between 1 and 65535, got "${raw}"`);
    }
    return port;
}

export const postgresConnection = {
    host: requireEnv('POSTGRES_HOST'),
    port: requirePort('POSTGRES_PORT'),
    database: requireEnv('POSTGRES_DATABASE'),
    user: requireEnv('POSTGRES_USER'),
    password: requireEnv('POSTGRES_PASSWORD'),
} as const;
