module.exports = {
  command_data: {
    name: 'ntm',
    description: 'Tu sais ce que ça veut dire...',
    type: 1,
    options: [],
  },
  perms: null,
  owner_only: false,
  cooldown: 5000,
  category: 'Fun',
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    if (interaction.channel.isDMBased()) return interaction.editReply(
      '[Click here](https://www.youtube.com/watch?v=TB_SnXD6pSc)')
    await interaction.deleteReply()
    interaction.user.send(
      { embeds: [{ description: '[Click here](https://www.youtube.com/watch?v=TB_SnXD6pSc)' }] })
  },
}