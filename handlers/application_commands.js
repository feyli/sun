const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config/main');

module.exports = async (client) => {
// Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categoryFolders = fs.readdirSync(commandsPath);

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const folder of categoryFolders) {
    for (const file of fs.readdirSync(`${commandsPath}/${folder}`).
      filter(file => file.endsWith('.js'))) {
      const command = require(`../commands/${folder}/${file}`);
      await client.commands.set(command.command_data.name, command);
    }
  }

// Construct and prepare an instance of the REST module
  // noinspection all
  const rest = new REST({ version: '10' }).setToken(config.client.token);

// and deploy your commands!
  try {
    // noinspection JSUnresolvedVariable
    console.log(
      `Started refreshing ${client.commands.filter(
        (command) => command.type !== 'button').size} application (/) commands.`);
    // The put method is used to fully refresh all commands in the guild with the current set
    let data = await rest.put(
      Routes.applicationCommands(config.client.id),
      {
        body: client.commands.filter(
          (command) => command.type !== 'button' && !command.guild_id).
          map((command) => command.command_data),
      },
    );

    client.commands.filter((command) => command.type !== 'button' && !command.guild_id).forEach((command) => {
      command.command_data.id = data.find((cmd) => cmd.name === command.command_data.name).id;
      client.cooldowns.set(command.command_data.name, new Map());
    });

    console.log(`Successfully updated command IDs.`);

    // sort commands by guilds and deploy them
    const guilds = client.commands.filter(
      (command) => command.type !== 'button' && command.guild_id).
      map((command) => command.guild_id);
    for (const guild of guilds) {
      const guildCommands = client.commands.filter(
        (command) => command.type !== 'button' && command.guild_id === guild).
        map((command) => command.command_data);
      // noinspection JSUnresolvedFunction
      data = await rest.put(
        Routes.applicationGuildCommands(config.client.id, guild),
        { body: guildCommands },
      );
      client.commands.filter((command) => command.type !== 'button' && command.guild_id === guild).forEach((command) => {
        command.command_data.id = data.find((cmd) => cmd.name === command.command_data.name).id;
        client.cooldowns.set(command.command_data.name, new Map());
      });

      console.log(`Successfully updated command IDs.`);
    }

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`);

  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
};