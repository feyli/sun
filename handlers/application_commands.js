const fs = require('fs');
const { Colors, ApplicationCommandsRegister, BetterConsoleLogger } = require('discord.js-v14-helper');

module.exports = (client, config) => {
    let commands = [];

    fs.readdirSync('./src/commands/').forEach((dir) => {
        const files = fs.readdirSync('./src/commands/' + dir)
            .filter((file) => file.endsWith('.js'))

        for (let file of files) {
            let pulled = require('../commands/' + dir + '/' + file);

            if (pulled.command_data && typeof pulled.command_data === 'object') {
                new BetterConsoleLogger('Loaded application command: ' + file + '.')
                    .setTextColor(Colors.Green)
                    .log(true);

                commands.push(pulled.command_data);
                
                client.commands.set(pulled.command_data.name, pulled);
            } else {
                new BetterConsoleLogger('[WARN] Received empty property \'command_data\' invalid type (Object) in ' + file + '.')
                    .setTextColor(Colors.Red)
                    .log(true);

                continue;
            };
        };
    });

    const register = new ApplicationCommandsRegister(config.client.token, config.client.id)
        .setApplicationCommands(commands)
        .setRestVersion(10);

    register.start().catch((data) => console.error(data.errors));
};
