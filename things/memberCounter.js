// noinspection JSUnresolvedVariable

const client = require('../index');

module.exports = async () => {
    const db = client.db;

    const counterGuilds = await db.query(
        'SELECT member_counter_channel_id, member_counter_style FROM guilds WHERE member_counter_channel_id IS NOT NULL');
    for (const guild of counterGuilds) {
        const channel = client.channels.cache.get(guild.member_counter_channel_id);
        const style = guild.member_counter_style;

        if (!channel) {
            db.query(
                'UPDATE guilds SET member_counter_channel_id = NULL, member_counter_style = NULL WHERE member_counter_channel_id = ?',
                [guild.member_counter_channel_id]);
            return;
        }

        const humanCount = channel.guild.members.cache.filter((member) => !member.user.bot).size;
        const fullLengthSpaceFormat = style && style.includes('{fullLength.space}') ? humanCount.toString().padStart(humanCount.toString().length) : humanCount.toString();
        const fullLengthCommaFormat = style && style.includes('{fullLength.comma}') ? humanCount.toLocaleString() : humanCount.toString();
        const thousandLengthValue = (humanCount / 1000).toFixed(2);
        const thousandLengthFormat = `${thousandLengthValue}${style && style.includes('{thousandLength.comma}') ? 'k' : ' k'}`;
        const channelName = style?.replaceAll('{fullLength.space}', fullLengthSpaceFormat)
                .replaceAll('{fullLength.comma}', fullLengthCommaFormat)
                .replaceAll('{thousandLength}', thousandLengthFormat)
            || `Members: ${humanCount}`;
        channel.setName(channelName);
    }
};