/**
 * Required environment variables. Bun loads `.env` automatically, so no dotenv is needed.
 * Failing fast here gives a clear error instead of an obscure failure later on.
 *
 * The PostgreSQL password is validated separately in `src/db/connection.ts`.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export const env = {
    token: requireEnv('TOKEN'),
    arcaneDatabasePassword: requireEnv('ARCANEDBPASSWORD'),
    openAiKey: requireEnv('OPENAIKEY'),
} as const;
