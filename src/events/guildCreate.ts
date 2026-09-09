import { Events } from 'discord.js';
import { guilds } from '../db/schema';
import { defineEvent } from '../types/commands';
import { watchingServers } from '../utils/presence';

export default defineEvent({
    name: Events.GuildCreate,
    execute(guild) {
        guild.client.db.insert(guilds).values({guildId: guild.id}).onConflictDoNothing().catch(console.error);

        guild.client.user.setPresence(watchingServers(guild.client.guilds.cache.size));
    },
});
