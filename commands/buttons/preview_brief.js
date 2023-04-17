module.exports = {
  command_data: {
    name: 'preview_brief',
  },
  type: 'button',
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const db = client.db;
    // noinspection JSUnresolvedVariable
    const brief = await db.query('SELECT mission_brief FROM guilds WHERE guild_id=?',
      [interaction.guild.id]).then((res) => res[0].mission_brief);

    if (!brief) return interaction.editReply('There doesn\'t seem to be any mission brief saved.');

    await interaction.editReply({
      embeds: [
        {
          title: brief.title ?? null,
          description: brief.description,
          footer: { text: 'Mission Brief Preview' },
          author: {
            name: 'Campagne War Thunder',
            iconURL: interaction.guild.iconURL({ dynamic: true }),
          },
        },
      ],
    });
  },
};