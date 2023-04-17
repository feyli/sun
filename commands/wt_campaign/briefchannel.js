module.exports = {
  command_data: {
    name: 'briefchannel',
    type: 1,
    options: [
      {
        name: 'set',
        description: 'Sets the channel to use for mission briefs.',
        type: 1,
        options: [
          {
            name: 'channel',
            description: 'The channel to set as the mission brief channel.',
            type: 7,
            required: true,
            channel_types: [0, 5, 10, 11, 12],
          },
        ],
      },
      {
        name: 'reset',
        description: 'Resets the channel to use for mission briefs.',
        type: 1,
      },
    ],
    description: 'Sets the channel to use for mission briefs.',
    default_member_permissions: 8,
  },
  category: 'War Thunder Campaign',
  guild_id: '1097431302338256977',
  run: async (client, interaction) => {
    if (interaction.options.getSubcommand() === 'reset') {
      const db = client.db;

      await db.query('UPDATE guilds SET brief_channel = ? WHERE guild_id = ?',
        [null, interaction.guild.id]);

      interaction.reply(
        { content: 'Reset the mission brief channel.', ephemeral: false });
    } else if (interaction.options.getSubcommand() === 'set') {
      const db = client.db;

      const channel = interaction.options.getChannel('channel');

      await db.query('UPDATE guilds SET brief_channel = ? WHERE guild_id = ?',
        [channel.id, interaction.guild.id]);

      interaction.reply(
        { content: `Set the mission brief channel to <#${channel.id}>.`, ephemeral: false });
    }
  },
};