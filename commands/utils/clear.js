module.exports = {
  command_data: {
    name: 'clear',
    description: 'Deletes the specified amount of messages in the active channel.',
    type: 1,
    dm_permission: false,
    default_member_permissions: 8192,
    options: [
      {
        name: 'amount',
        description: 'The amount of messages to delete.',
        type: 4,
        min_value: 1,
        max_value: 100,
        required: true,
      },
      {
        name: 'user',
        description: 'The user to delete messages from.',
        type: 6,
        required: false,
      },
    ],
  },
  category: 'Utility',
  cooldown: 5000,
  perms: null,
  owner_only: false,
  run: async (client, interaction) => {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch();

    if (user) {
      let i = 0;
      const filtered = [];

      try {
        (await messages).filter((message) => {
          if (message.author.id === user.id && amount > i) {
            filtered.push(message);
            i++;
          }
        });
      } catch (e) {
        console.error(e);
      }
      await interaction.channel.bulkDelete(filtered, true);
      await interaction.editReply({ embeds: [{ description: 'Deleted ' + amount + ' messages from ' + user.toString() + '.' }] })
    } else {
      await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ embeds: [{ description: 'Deleted ' + amount + ' messages.' }] })
    }

    setTimeout(() => {
      interaction.deleteReply();
    }, 5000)
  },
};