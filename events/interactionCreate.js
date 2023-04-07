const client = require('../index')
const config = require('../config/main')

client.on('interactionCreate', (interaction) => {
  if (interaction.isChatInputCommand()) {
    // command checking
    if (!client.commands.has(interaction.commandName)) return interaction.reply(
      { content: 'This command does not exist!', ephemeral: true })
    if (client.commands.get(interaction.commandName).owner_only && interaction.user.id !==
      config.users.owner) return interaction.reply({
      content: 'You do not have permission to use this command! (`owner-only command`)',
      ephemeral: true,
    })

    // cooldown checking
    if (client.commands.get(interaction.commandName).cooldown !== 0 && interaction.user.id !==
      config.users.owner) {
      if (client.cooldowns.get(interaction.commandName).get(interaction.user.id)) {
        return interaction.reply({
          content: 'You are on cooldown! This command has a cooldown of `' +
            client.commands.get(interaction.commandName).cooldown / 1000 + 's`.', ephemeral: true,
        })
      } else {
        client.cooldowns.get(interaction.commandName).set(interaction.user.id, true)
        setTimeout(() => {
          client.cooldowns.get(interaction.commandName).delete(interaction.user.id)
        }, client.commands.get(interaction.commandName).cooldown)
      }
    }

    // final run
    client.commands.get(interaction.commandName).run(client, interaction)
  }
})