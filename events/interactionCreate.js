const client = require('../index');
const config = require('../config/main');

client.on('interactionCreate', async (interaction) => {
    const identifier = interaction.commandName || interaction.customId;

    // command checking
    if (!client.commands.has(identifier)) return interaction.reply(
        { content: 'This command is in development phase!', ephemeral: true });
    if (client.commands.get(identifier).owner_only && interaction.user.id.toString() !==
        config.users.owner) return interaction.reply({
        content: 'You do not have permission to use this command! (`owner-only command`)',
        ephemeral: true,
    });

    // cooldown checking
    if (client.commands.get(identifier).cooldown !== 0 && interaction.user.id.toString() !== config.users.owner) {
        if (client.cooldowns.get(identifier).get(interaction.user.id)) {
            return interaction.reply({
                content: 'You are on cooldown! This command has a cooldown of `' +
                    client.commands.get(identifier).cooldown / 1000 + 's`.', ephemeral: true,
            });
        } else {
            client.cooldowns.get(identifier).set(interaction.user.id, true);
            setTimeout(() => {
                client.cooldowns.get(identifier).delete(interaction.user.id);
            }, client.commands.get(identifier).cooldown);
        }
    }

    client.commands.get(identifier).run(client, interaction, config);

    if (interaction.isChatInputCommand()) { // chat input command
        // noinspection JSUnresolvedReference
        console.log(`${interaction.user.username} (${interaction.user.id})} used ${identifier} in ${interaction.guild?.name || "DMs"} (${interaction.guild?.id || interaction.user.username}). Full command: ${identifier} ${interaction.options._hoistedOptions.map(x => x.name + ':' + x.value).join(' ')}`);

        // database logging
        client.db.query('INSERT INTO command_logs (interaction_token, user_id, user_username, guild_id, guild_name, channel_id, channel_name, command_name, options, dm, locale) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [interaction.token, interaction.user.id, interaction.user.username, interaction.guildId || null, interaction.guild?.name || null, interaction.channelId, interaction.channel?.name || null, identifier, interaction.options.data.length > 0 ? JSON.stringify(interaction.options.data) : null, !interaction.inGuild(), interaction.locale]).catch(console.error);
    }

    // noinspection JSUnresolvedVariable
    else if (interaction.isAutocomplete()) {
        const command = client.commands.get(identifier);

        if (!command) return;

        try {
            await command.autocomplete(client, interaction);
        } catch (error) {
            console.error(error);
        }
    }
});