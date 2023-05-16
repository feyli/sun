module.exports = {
  command_data: {
    name: 'rolesort',
    description: 'Displays a list of the members of a role.',
    type: 1,
    dm_permission: false,
    options: [
      {
        name: 'role',
        description: 'The role to get a list of members for.',
        type: 8,
        required: true,
      },
    ],
  },
  category: 'Utility',
  cooldown: 5000,
  perms: null,
  owner_only: false,
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    let role = interaction.options.get('role').role
    let members = role.members.map((member) => member).join(', ')
    let embed = {
      title: `Members of \`${role.name}\``,
      description: members,
    }
    await interaction.editReply({ embeds: [embed] })
  },
}