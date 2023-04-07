module.exports = {
  command_data: {
    name: 'eval',
    description: 'Evaluates JavaScript code.',
    type: 1,
    options: [
      {
        name: 'code',
        description: 'The code to evaluate.',
        type: 3,
        required: true,
      },
      {
        name: 'ephemeral',
        description: 'Whether the response should be ephemeral.',
        type: 5,
        required: false,
      },
    ],
  },
  perms: null,
  owner_only: true,
  cooldown: 10000,
  category: 'Owner',
  run: async (client, interaction) => {
    let code = interaction.options.get('code').value
    await interaction.deferReply(
      { ephemeral: interaction.options.get('ephemeral') || false },
    )
    let result
    try {
      const wrapperFn = new Function('client', 'interaction',
        `return (async () => { ${code} })();`)
      result = await wrapperFn(client, interaction)
    } catch (err) {
      result = err
    }
    await interaction.editReply({
      content: result
        ? result.length !== 0 ?
          ('```' + result + '```') : 'The result has a length of 0.'
        : 'This code doesn\'t return anything or returns `false`.',
    })
  },
}