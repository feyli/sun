import { Events } from 'discord.js';
import { config } from '../config';
import { guilds } from '../db/schema';
import { arcaneUpdate } from '../tasks/arcaneUpdate';
import { updateMemberCounters } from '../tasks/memberCounter';
import { updateMinecraftCounters } from '../tasks/minecraftCounter';
import { updatePlayerNames } from '../tasks/playerNamesUpdate';
import { defineEvent } from '../types/commands';
import { watchingServers } from '../utils/presence';
import { startRecurringTask } from '../utils/tasks';

export default defineEvent({
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log('Logged in as ' + client.user.tag + '!');

        const loggingChannel = client.channels.cache.get(config.channels.loggingChannel);
        if (loggingChannel?.isSendable()) {
            await loggingChannel.send({
                embeds: [
                    {
                        title: 'Bot is online!',
                        color: 0x00ff00,
                        timestamp: new Date().toISOString(),
                    },
                ],
            });
        }

        client.user.setPresence(watchingServers(client.guilds.cache.size));

        // Make sure every guild the bot is in has a row in the database.
        const rows = client.guilds.cache.map((guild) => ({guildId: guild.id}));
        if (rows.length > 0) {
            await client.db.insert(guilds).values(rows).onConflictDoNothing().catch(console.error);
        }

        await startRecurringTask('Arcane Update', () => arcaneUpdate(client), 10_000);
        await startRecurringTask('Member Counter', () => updateMemberCounters(client), 900_000);
        await startRecurringTask('Minecraft Counter', () => updateMinecraftCounters(client), 900_000);
        await startRecurringTask('Player Names Update', () => updatePlayerNames(client), 43_200_000);
    },
});
