import { Events } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../db/schema';
import { defineEvent } from '../types/commands';
import { watchingServers } from '../utils/presence';

export default defineEvent({
    name: Events.GuildDelete,
    execute(guild) {
        guild.client.db.delete(guilds).where(eq(guilds.guildId, guild.id)).catch(console.error);

        guild.client.user.setPresence(watchingServers(guild.client.guilds.cache.size));
    },
});
