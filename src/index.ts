import { SunClient } from './client';
import { commands } from './commands';
import { components } from './components';
import { config } from './config';
import { startQueue, stopQueue } from './db/boss';
import { runMigrations } from './db/migrate';
import { events, registerEvents } from './events';
import { deployCommands } from './handlers/deployCommands';
import { anonymousConfessionsQueue } from './tasks/anonConfessions';

// Before anything touches the database, and before the bot is reachable on Discord.
await runMigrations();

// pg-boss applies its own migrations here, so it has to be up before anything sends a job.
await startQueue([anonymousConfessionsQueue]);

// Let a job that is mid-publish finish instead of leaving it to expire and be retried.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => void stopQueue().finally(() => process.exit(0)));
}

const client = new SunClient();

client.registerCommands(commands);
client.registerComponents(components);
registerEvents(client, events);

await deployCommands(client);
await client.login(config.client.token);
