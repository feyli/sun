const client = require('../index');

client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;

  const conn = await client.sunPool.getConnection();

  // noinspection JSUnresolvedVariable
  const welcomeChannelID = await conn.query(
    'SELECT welcome_channel_id FROM guilds WHERE guild_id = ?',
    [member.guild.id]).then((res) => res[0].welcome_channel_id);
  if (welcomeChannelID) {
    if (!member.guild.channels.cache.get(welcomeChannelID)) {
      await conn.query('UPDATE guilds SET welcome_channel_id = NULL WHERE guild_id = ?',
        [member.guild.id]);
      return;
    }

    // noinspection JSUnresolvedVariable
    let welcomeMessage = await conn.query('SELECT welcome_message FROM guilds WHERE guild_id = ?',
      [member.guild.id]).then((res) => res[0].welcome_message);
    welcomeMessage = welcomeMessage.replaceAll('{userMention}', member.toString()).
      replaceAll('{userUsername}', member.user.username).
      replaceAll('{userTag}', member.user.tag).
      replaceAll('{serverName}', member.guild.name).
      replaceAll('{memberCount}',
        member.guild.members.cache.filter((member) => !member.user.bot).size.toString());
    // noinspection JSUnresolvedFunction
    member.guild.channels.cache.get(welcomeChannelID).
      send(welcomeMessage ?? 'Welcome to the server, ' + member.toString() + '!');
  }
});