const client = require('../index');

module.exports = async () => {
  const db = client.db

  const counterGuilds = await db.query(
    'SELECT member_counter_channel_id, member_counter_style FROM guilds WHERE member_counter_channel_id IS NOT NULL');
  for (const guild of counterGuilds) {
    // noinspection JSUnresolvedVariable
    const channel = client.channels.cache.get(guild.member_counter_channel_id);
    // noinspection JSUnresolvedVariable
    const style = guild.member_counter_style;

    if (!channel) {
      // noinspection JSUnresolvedVariable
      db.query(
        'UPDATE guilds SET member_counter_channel_id = NULL, member_counter_style = NULL WHERE member_counter_channel_id = ?',
        [guild.member_counter_channel_id]);
      return;
    }

    const humanCount = channel.guild.members.cache.filter((member) => !member.user.bot).size;

    channel.setName(style?.replaceAll('{fullLength}', humanCount).
      replaceAll('{thousandLength}', (humanCount / 1000).toFixed(2).toString() + 'k') || 'Members: ' + humanCount);
  }
};