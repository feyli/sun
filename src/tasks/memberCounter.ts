import type { Client } from 'discord.js';
import { eq, isNotNull } from 'drizzle-orm';
import { guilds } from '../db/schema';
import { formatWithSeparator } from '../utils/format';

/** Applies the guild's custom style (`{fullLength}`, `{thousandLength}`, ...) to the human member count. */
export function formatMemberCounterName(style: string | null, humanCount: number): string {
    const fullLength = humanCount.toString();
    if (!style) return `Members: ${humanCount}`;

    const fullLengthSpace = style.includes('{fullLength.space}') ? formatWithSeparator(humanCount, ' ') : fullLength;
    const fullLengthComma = style.includes('{fullLength.comma}') ? humanCount.toLocaleString() : fullLength;
    const thousandLength = `${(humanCount / 1000).toFixed(2)}${style.includes('{thousandLength.comma}') ? 'k' : ' k'}`;

    return (
        style
            .replaceAll('{fullLength.space}', fullLengthSpace)
            .replaceAll('{fullLength.comma}', fullLengthComma)
            .replaceAll('{thousandLength}', thousandLength)
            .replaceAll('{fullLength}', fullLength) || `Members: ${humanCount}`
    );
}

/** Renames every member counter channel with the current human member count. */
export async function updateMemberCounters(client: Client): Promise<void> {
    const rows = await client.db
        .select({channelId: guilds.memberCounterChannelId, style: guilds.memberCounterStyle})
        .from(guilds)
        .where(isNotNull(guilds.memberCounterChannelId));

    for (const row of rows) {
        const channelId = row.channelId;
        if (!channelId) continue;

        const channel = client.channels.cache.get(channelId);
        if (!channel || channel.isDMBased()) {
            client.db
                .update(guilds)
                .set({memberCounterChannelId: null, memberCounterStyle: null})
                .where(eq(guilds.memberCounterChannelId, channelId))
                .catch(console.error);
            continue;
        }

        const humanCount = channel.guild.members.cache.filter((member) => !member.user.bot).size;
        channel.setName(formatMemberCounterName(row.style, humanCount)).catch(console.error);
    }
}
