const client = require('../index');
const config = require('../config/main');

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) { // chat input command
        // noinspection JSUnresolvedReference
        console.log(`${interaction.user.username} (${interaction.user.id})} used ${interaction.commandName} in ${interaction.guild?.name || "DMs"} (${interaction.guild?.id || interaction.user.username}). Full command: ${interaction.commandName} ${interaction.options._hoistedOptions.map(x => x.name + ':' + x.value).join(' ')}`);
        // command checking
        if (!client.commands.has(interaction.commandName)) return interaction.reply(
            { content: 'This command is in development phase!', ephemeral: true });
        if (client.commands.get(interaction.commandName).owner_only && interaction.user.id.toString() !==
            config.users.owner) return interaction.reply({
            content: 'You do not have permission to use this command! (`owner-only command`)',
            ephemeral: true,
        });

        // cooldown checking
        if (client.commands.get(interaction.commandName).cooldown !== 0 && interaction.user.id.toString() !== config.users.owner) {
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

        // database logging
        client.db.query('INSERT INTO command_logs (interaction_token, user_id, user_username, guild_id, guild_name, channel_id, channel_name, command_name, options, dm, locale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [interaction.token, interaction.user.id, interaction.user.username, interaction.guildId || null, interaction.guild?.name || null, interaction.channelId, interaction.channel?.name || null, interaction.commandName, interaction.options.data.length > 0 ? JSON.stringify(interaction.options.data) : null, !interaction.inGuild(), interaction.locale]).catch(console.error);
    } else if (interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) { // context command
        if (!client.commands.has(interaction.commandName)) return interaction.reply(
            { content: 'This command is in development phase!', ephemeral: true });
        client.commands.get(interaction.commandName).run(client, interaction, config);
    } else if (interaction.isButton()) { // button interaction
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