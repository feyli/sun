module.exports = {
  command_data: {
    name: 'send_brief',
  },
  type: 'button',
  run: async (client, interaction) => {
    // noinspection DuplicatedCode
    const db = client.db;

    if (!interaction.memberPermissions.has(8)) return interaction.reply(
      { content: 'You do not have permission to use this command.', ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    // noinspection JSUnresolvedVariable
    const briefChannel = await db.query('SELECT brief_channel FROM guilds WHERE guild_id = ?',
      [interaction.guild.id]).then((res) => res[0].brief_channel);

    if (!briefChannel) return interaction.editReply('The mission brief channel has not been set.');

    const channel = interaction.guild.channels.cache.get(briefChannel);

    if (!channel) return interaction.editReply(
      'The mission brief channel has been deleted. You\'ll have to set a new one.');

    // noinspection JSUnresolvedVariable
    const brief = await db.query('SELECT mission_brief FROM guilds WHERE guild_id = ?',
      [interaction.guild.id]).then((res) => res[0].mission_brief);

    if (!brief) return interaction.editReply(
      'There is no mission brief to send. Please set one first.');

    brief.author = {
      name: 'Campagne War Thunder',
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    };
    brief.footer = { text: 'Briefing de mission' };

    await channel.send({ embeds: [brief] });
    await interaction.editReply(':airplane_small: | Mission brief __sent__.');
  },
};