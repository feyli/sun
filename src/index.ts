import { SunClient } from './client';
import { commands } from './commands';
import { components } from './components';
import { config } from './config';
import { runMigrations } from './db/migrate';
import { events, registerEvents } from './events';
import { deployCommands } from './handlers/deployCommands';

// Before anything touches the database, and before the bot is reachable on Discord.
await runMigrations();

const client = new SunClient();

client.registerCommands(commands);
client.registerComponents(components);
registerEvents(client, events);

await deployCommands(client);
await client.login(config.client.token);
