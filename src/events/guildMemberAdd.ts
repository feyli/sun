import { Events } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../db/schema';
import { defineEvent } from '../types/commands';

export default defineEvent({
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return;

        const db = member.client.db;
        const [row] = await db
            .select({welcomeChannelId: guilds.welcomeChannelId, welcomeMessage: guilds.welcomeMessage})
            .from(guilds)
            .where(eq(guilds.guildId, member.guild.id));

        const welcomeChannelId = row?.welcomeChannelId;
        if (!welcomeChannelId) return;

        const channel = member.guild.channels.cache.get(welcomeChannelId);
        if (!channel?.isSendable()) {
            await db.update(guilds).set({welcomeChannelId: null}).where(eq(guilds.guildId, member.guild.id));
            return;
        }

        const template = row.welcomeMessage ?? 'Welcome to the server, ' + member.toString() + '!';
        const welcomeMessage = template
            .replaceAll('{userMention}', member.toString())
            .replaceAll('{userUsername}', member.user.username)
            .replaceAll('{userTag}', member.user.tag)
            .replaceAll('{serverName}', member.guild.name)
            .replaceAll('{memberCount}', member.guild.members.cache.filter((guildMember) => !guildMember.user.bot).size.toString());

        await channel.send(welcomeMessage);
    },
});
