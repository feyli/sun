const client = require('../index');
const config = require('../config/main');

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        console.log(`${interaction.user.username} (${interaction.user.id})} used ${interaction.commandName} in ${interaction.guild.name} (${interaction.guild.id}). Full command: ${interaction.commandName} ${interaction.options._hoistedOptions.map(x => x.name + ':' + x.value).join(' ')}`);
        // command checking
        if (!client.commands.has(interaction.commandName)) return interaction.reply(
            { content: 'This command is in development phase!', ephemeral: true });
        if (client.commands.get(interaction.commandName).owner_only && interaction.user.id !==
            config.users.owner) return interaction.reply({
            content: 'You do not have permission to use this command! (`owner-only command`)',
            ephemeral: true,
        });

        // cooldown checking
        if (client.commands.get(interaction.commandName).cooldown !== 0 && interaction.user.id !==
            config.users.owner) {
            if (client.cooldowns.get(interaction.commandName).get(interaction.user.id)) {
                return interaction.reply({
                    content: 'You are on cooldown! This command has a cooldown of `' +
                        client.commands.get(interaction.commandName).cooldown / 1000 + 's`.', ephemeral: true,
                });
            } else {
                client.cooldowns.get(interaction.commandName).set(interaction.user.id, true);
                setTimeout(() => {
                    client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
                }, client.commands.get(interaction.commandName).cooldown);
            }
        }

        // final run
        client.commands.get(interaction.commandName).run(client, interaction, config);
    } else if (interaction.isMessageContextMenuCommand()) {
        if (!client.commands.has(interaction.commandName)) return interaction.reply(
            { content: 'This command is in development phase!', ephemeral: true });
        client.commands.get(interaction.commandName).run(client, interaction, config);
    } else if (interaction.isButton()) {
        if (!client.commands.has(interaction.customId)) return interaction.reply(
            { content: 'This interaction is in development phase!', ephemeral: true });
        client.commands.get(interaction.customId).run(client, interaction, config);
    }

    // noinspection JSUnresolvedVariable
    else if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.autocomplete(client, interaction);
        } catch (error) {
            console.error(error);
        }
    }
});