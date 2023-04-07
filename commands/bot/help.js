const { PermissionsBitField } = require('discord.js')

module.exports = {
  command_data: {
    name: 'help',
    description: 'Shows a list of Sun commands or some info about a specific command.',
    type: 1,
    options: [
      {
        name: 'command',
        description: 'The command to get help for',
        type: 3,
        required: false,
      },
    ],
  },
  perms: null,
  owner_only: false,
  cooldown: 5000,
  category: 'Bot',
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    let commands = client.commands.filter((command) => !command.owner_only).map((command) => {
      return {
        name: command.command_data.name,
        description: command.command_data.description,
        id: command.command_data.id,
        category: command.category,
        perms: command.command_data.default_member_permissions,
        cooldown: command.cooldown,
        options: command.command_data.options,
      }
    })

    if (interaction.options.get('command')) {
      let command = commands.find(
        (command) => command.name === interaction.options.get('command').value)
      let embed = {
        title: `Help for </${command.name}:${command.id}>`,
        description: command.description,
        fields: [
          {
            name: 'Category',
            value: command.category,
            inline: true,
          },
          {
            name: 'Cooldown',
            value: command.cooldown === 0 ? 'None' : command.cooldown / 1000 + 's',
            inline: true,
          },
          {
            name: 'Required permissions',
            value: command.perms ? '`' +
              new PermissionsBitField(command.perms.toString()).toArray().
                join('`, `') + '`' : 'None',
            inline: true,
          },
        ],
      }
      if (command.options.length > 0) {
        let options = command.options.map((option) => {
          return `\`${option.name}\` - ${option.description}` +
            (option.required ? ' (required)' : ' (optional)')
        })
        embed.fields.push(
          { name: 'Options', value: options.join('\n'), inline: true })
      }
      await interaction.editReply({ embeds: [embed] })
    } else {
      let categories = commands.map((command) => command.category)
      categories = [...new Set(categories)]
      let embeds = []
      for (let category of categories) {
        let embed = {
          title: `\`${category}\` category`,
          fields: [
            {
              name: 'Commands',
              value: commands.filter(
                (command) => command.category === category).
                map((command) => `</${command.name}:${command.id}>`).join(', '),
            }],
        }
        embeds.push(embed)
      }
      await interaction.editReply({ embeds: embeds })
    }
  },
}