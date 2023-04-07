module.exports = {
  command_data: {
    name: 'test',
    description: 'Test command.',
    type: 1,
    default_member_permissions: 276824066,
    options: [],
  },
  owner_only: true,
  cooldown: 0,
  category: 'Development',
  run: async (client, interaction) => {
    interaction.reply('Test command.');
  }
}