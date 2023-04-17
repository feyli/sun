// noinspection DuplicatedCode

const { PermissionsBitField } = require('discord.js');

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
        autocomplete: true,
        required: false,
      },
    ],
  },
  owner_only: false,
  cooldown: 5000,
  category: 'Bot',
  autocomplete: async (client, interaction) => {
    const focusedValue = interaction.options.getFocused();
    let commands = client.commands.filter((command) => command.command_data.type === 1 && !command.owner_only &&
      (!command.guild_id || command.guild_id === interaction.guild.id)).map((command) => {
      return {
        name: command.command_data.name,
        description: command.command_data.description,
        id: command.command_data.id,
        category: command.category,
        perms: command.command_data.default_member_permissions,
        cooldown: command.cooldown,
        options: command.command_data.options,
        guild_id: command.command_data.guild_id,
      };
    });
    const choices = commands.map((command) => command.name);
    const filtered = choices.filter((choice) => choice.includes(focusedValue));
    await interaction.respond(filtered.map((choice) => { return { name: choice, value: choice }; },
    ));
  },
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });
    let commands = client.commands.filter((command) => command.command_data.type === 1 && !command.owner_only &&
      (!command.guild_id || command.guild_id === interaction.guild.id)).map((command) => {
      return {
        name: command.command_data.name,
        description: command.command_data.description,
        id: command.command_data.id,
        category: command.category,
        perms: command.command_data.default_member_permissions,
        cooldown: command.cooldown,
        options: command.command_data.options,
        guild_id: command.command_data.guild_id,
      };
    });

    if (interaction.options.get('command')) {
      let command = commands.find(
        (command) => command.name === interaction.options.get('command').value);
      if (!command) return interaction.editReply('Command not found. Please use given choices.');

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
      };
      if (command.options.length > 0) {
        let options = command.options.map((option) => {
          return `\`${option.name}\` - ${option.description} ${
            (option.type === 1 ? '(subcommand)' : option.type === 2 ? '(subcommand group)' : option.required ? '(required)' : '(optional)')}`;
        });
        embed.fields.push(
          { name: 'Options', value: options.join('\n'), inline: true });
      }
      await interaction.editReply({ embeds: [embed] });
    } else {
      let categories = commands.filter(
        (command) => command.guild_id === interaction.guild.id || !interaction.guild_id).
        map((command) => command.category);
      categories = [...new Set(categories)];
      let embeds = [];
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
        };
        embeds.push(embed);
      }
      await interaction.editReply({ embeds: embeds });
    }
  },
}
;