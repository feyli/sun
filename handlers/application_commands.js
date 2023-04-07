const { REST, Routes } = require('discord.js')
const fs = require('node:fs')
const path = require('node:path')

module.exports = async (client, config) => {
// Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(__dirname, '..', 'commands')
  const categoryFolders = fs.readdirSync(commandsPath)

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const folder of categoryFolders) {
    for (const file of fs.readdirSync(`${commandsPath}/${folder}`).
      filter(file => file.endsWith('.js'))) {
      const command = require(`../commands/${folder}/${file}`)
      await client.commands.set(command.command_data.name, command)
    }
  }

  client.commands.get(
    'help').command_data.options[0].choices = client.commands.filter(
    (command) => !command.owner_only).map((command) => {
    return {
      name: command.command_data.name,
      value: command.command_data.name,
    }
  })

// Construct and prepare an instance of the REST module
  // noinspection all
  const rest = new REST({ version: '10' }).setToken(config.client.token)

// and deploy your commands!
  try {
    console.log(
      `Started refreshing ${client.commands.size} application (/) commands.`)
    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(config.client.id),
      { body: client.commands.map((command) => command.command_data) },
    )

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`)

    client.commands.forEach((command) => {
      command.command_data.id = data.find((cmd) => cmd.name === command.command_data.name).id
      client.cooldowns.set(command.command_data.name, new Map())
    })

    console.log(`Successfully updated command IDs.`)

  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error)
  }
}