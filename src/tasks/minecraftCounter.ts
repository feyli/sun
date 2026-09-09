import type { Client, Snowflake } from 'discord.js';
import { and, eq, isNotNull } from 'drizzle-orm';
import { MINECRAFT_DEFAULT_PORT } from '../constants';
import { mcstatus } from '../db/schema';
import { formatWithSeparator } from '../utils/format';
import { isServerOnline, pingServer } from '../utils/minecraft';

interface MinecraftCounterRow {
    address: string | null;
    port: number | null;
    counterChannelId: string | null;
    counterStyle: string | null;
}

/** Applies the guild's custom style (`{online}`, `{max}`, ...) to the player counts. */
export function formatMinecraftCounterName(style: string | null, onlineCount: number, maxCount: number): string {
    if (!style) return `Online: ${onlineCount}`;

    const onlineSpace = style.includes('{online.space}') ? formatWithSeparator(onlineCount, ' ') : String(onlineCount);
    const onlineComma = style.includes('{online.comma}') ? formatWithSeparator(onlineCount, ',') : String(onlineCount);
    const maxSpace = style.includes('{max.space}') ? formatWithSeparator(maxCount, ' ') : String(maxCount);
    const maxComma = style.includes('{max.comma}') ? formatWithSeparator(maxCount, ',') : String(maxCount);

    return (
        style
            .replaceAll('{online.space}', onlineSpace)
            .replaceAll('{online.comma}', onlineComma)
            .replaceAll('{max.space}', maxSpace)
            .replaceAll('{max.comma}', maxComma)
            .replaceAll('{online}', String(onlineCount))
            .replaceAll('{max}', String(maxCount)) || `Online: ${onlineCount}`
    );
}

async function updateCounter(client: Client, row: MinecraftCounterRow): Promise<void> {
    const {address, counterChannelId} = row;
    if (!address || !counterChannelId) return;

    const channel = await client.channels.fetch(counterChannelId).catch(() => {
        console.log(`Failed to fetch channel ${counterChannelId}`);
        return null;
    });

    if (!channel || channel.isDMBased()) {
        client.db
            .update(mcstatus)
            .set({counterChannelId: null, counterStyle: null})
            .where(eq(mcstatus.counterChannelId, counterChannelId))
            .catch(console.error);
        return;
    }

    const port = row.port ?? MINECRAFT_DEFAULT_PORT;
    const response = await pingServer(address, port);

    if (!isServerOnline(response)) {
        channel.setName('Server Offline', 'counter update').catch(console.error);
        console.log(`Checked ${address}:${port} (offline)`);
        return;
    }

    const channelName = formatMinecraftCounterName(row.counterStyle, response.players.online, response.players.max);
    channel.setName(channelName, 'counter update').catch(console.error);
    console.log(`Updated ${address}:${port} to ${channelName}`);
}

/** Renames the Minecraft counter channels; restricted to one guild when `guildId` is given. */
export async function updateMinecraftCounters(client: Client, guildId?: Snowflake): Promise<void> {
    console.log('Starting to update Minecraft server counters.');

    const configured = and(isNotNull(mcstatus.counterChannelId), isNotNull(mcstatus.address));
    const rows = await client.db
        .select({
            address: mcstatus.address,
            port: mcstatus.port,
            counterChannelId: mcstatus.counterChannelId,
            counterStyle: mcstatus.counterStyle,
        })
        .from(mcstatus)
        .where(guildId ? and(configured, eq(mcstatus.guildId, guildId)) : configured);

    for (const row of rows) await updateCounter(client, row);

    console.log('Finished updating Minecraft server counters.');
}
