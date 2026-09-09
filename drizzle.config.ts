import { defineConfig } from 'drizzle-kit';
import { postgresConnection } from './src/db/connection';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        host: postgresConnection.host,
        port: postgresConnection.port,
        user: postgresConnection.user,
        password: postgresConnection.password,
        database: postgresConnection.database,
        ssl: false,
    },
});
