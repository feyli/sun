// noinspection DuplicatedCode

const { PermissionsBitField } = require('discord.js');

module.exports = {
    command_data: {
        name: 'help',
        description: 'Shows a list of Sun commands or some info about a specific command.',
        type: 1,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
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
        const focusedValue = interaction.options.getFocused() || '';
        let commands = client.commands.filter((command) => command.command_data.type === 1 && !command.owner_only &&
            (!command.guild_id || command.guild_id === interaction.guild?.id)).map((command) => {
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
        // Case-insensitive, startsWith match, limit to 25 results
        const filtered = choices.filter((choice) => choice.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25);
        await interaction.respond(filtered.map((choice) => {
            return { name: choice, value: choice };
        }));
    },
    run: async (client, interaction) => {
        // Only proceed if deferReply is available (i.e., this is a command interaction)
        if (typeof interaction.deferReply !== 'function') {
            // Optionally, you can log or reply with an error, but for now just return
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        let commands = client.commands.filter((command) => command.command_data.type === 1 && !command.owner_only &&
            (!command.guild_id || command.guild_id === interaction.guild?.id)).map((command) => {
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
                color: 0x00ff00,
                fields: [
                    {
                        name: 'Category',
                        value: command.category || 'Unknown',
                        inline: true,
                    },
                    {
                        name: 'Cooldown',
                        value: command.cooldown === 0 || !command.cooldown ? 'None' : command.cooldown / 1000 + 's',
                        inline: true,
                    },
                    {
                        name: 'Required permissions',
                        value: command.perms ? '`' +
                            new PermissionsBitField(command.perms.toString()).toArray().join('`, `') + '`' : 'None',
                        inline: true,
                    },
                ],
            };
            if (command.options?.length > 0) {
                let options = command.options.map((option) => {
                    return `\`${option.name}\` - ${option.description} ${
                        (option.type === 1 ? '(subcommand)' : option.type === 2 ? '(subcommand group)' : option.required ? '(required)' : '(optional)')}`;
                });
                let optionsValue = options.join('\n');
                // Ensure field value doesn't exceed Discord's 1024 character limit
                if (optionsValue.length > 1024) {
                    optionsValue = optionsValue.substring(0, 1021) + '...';
                }
                embed.fields.push(
                    { name: 'Options', value: optionsValue, inline: true });
            }
            await interaction.editReply({ embeds: [embed] });
        } else {
            let categories = commands.filter(
                (command) => command.guild_id === interaction.guild?.id || !interaction.guild_id).map((command) => command.category);
            categories = [...new Set(categories)].filter(Boolean); // Remove null/undefined categories
            let embeds = [];
            for (let category of categories) {
                let categoryCommands = commands.filter(
                    (command) => command.category === category).map((command) => `</${command.name}:${command.id}>`);

                if (categoryCommands.length === 0) continue; // Skip empty categories

                let commandsValue = categoryCommands.join(', ');
                // Ensure field value doesn't exceed Discord's 1024 character limit
                if (commandsValue.length > 1024) {
                    commandsValue = commandsValue.substring(0, 1021) + '...';
                }

                let embed = {
                    title: `\`${category}\` category`,
                    color: 0x00ff00,
                    fields: [
                        {
                            name: 'Commands',
                            value: commandsValue,
                        }],
                };
                embeds.push(embed);
            }

            // Ensure we have at least one embed to send
            if (embeds.length === 0) {
                embeds.push({
                    title: 'No commands available',
                    description: 'No commands are available in this context.',
                    color: 0xff0000
                });
            }

            await interaction.editReply({ embeds: embeds });
        }
    },
}
;