import { SunClient } from './client';
import { commands } from './commands';
import { components } from './components';
import { config } from './config';
import { events, registerEvents } from './events';
import { deployCommands } from './handlers/deployCommands';

const client = new SunClient();

client.registerCommands(commands);
client.registerComponents(components);
registerEvents(client, events);

await deployCommands(client);
await client.login(config.client.token);
