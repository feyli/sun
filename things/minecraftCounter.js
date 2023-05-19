// noinspection JSUnresolvedVariable

const client = require('../index');
const { MinecraftServerListPing: mslp } = require("minecraft-status");

module.exports = async (guildID = null) => {
    console.log("Starting to update Minecraft server counters.");
    const db = client.db;

    if (guildID) {
        // only update the guild with the given ID

    }

    const counterGuilds = await db.query('SELECT address, port, counter_channel_id, counter_style FROM mcstatus WHERE counter_channel_id IS NOT NULL AND address IS NOT NULL');
    for (const guild of counterGuilds) {
        const channel = await client.channels.fetch(guild.counter_channel_id).catch(() => console.log(`Failed to fetch channel ${guild.counter_channel_id}`));
        const style = guild.counter_style;

        if (!channel) {
            db.query(
                'UPDATE mcstatus SET counter_channel_id = NULL, counter_style = NULL WHERE counter_channel_id = ?',
                [guild.counter_channel_id]);
            return;
        }

        const { address, port } = guild;
        const res = await mslp.ping(4, address, port).catch(() => {
            return { players: { max: 0 } };
        });

        if (!res.players.max) return channel.setName('Server Offline');

        const onlineCount = res.players.online;
        const maxCount = res.players.max;
        const onlineSpaceFormat = style && style.includes('{online.space}') ? onlineCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : onlineCount;
        const onlineCommaFormat = style && style.includes('{online.comma}') ? onlineCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : onlineCount;
        const maxSpaceFormat = style && style.includes('{max.space}') ? maxCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") : maxCount;
        const maxCommaFormat = style && style.includes('{max.comma}') ? maxCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : maxCount;
        const channelName = style
            ?.replaceAll('{online.space}', onlineSpaceFormat)
            .replaceAll('{online.comma}', onlineCommaFormat)
            .replaceAll('{max.space}', maxSpaceFormat)
            .replaceAll('{max.comma}', maxCommaFormat)
            .replaceAll('{online}', onlineCount)
            .replaceAll('{max}', maxCount) || `Online: ${onlineCount}`;

        await channel.setName(channelName);
        console.log(`Updated ${address}:${port} to ${channelName}`);
    }

    console.log("Finished updating Minecraft server counters.");
};