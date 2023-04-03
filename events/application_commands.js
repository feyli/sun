const client = require('../index');
const config = require('../config/main');
const ms = require('ms');
const { EmbedBuilder } = require('discord.js');

const map_cooldown = new Map();

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand() || interaction.isUserContextMenuCommand() || interaction.isMessageContextMenuCommand()) {
        const command = await client.commands.get(interaction.commandName);

        if (!command) return interaction.reply({
            content: `\`❌\` Invalid command, please try again later.`,
            ephemeral: true
        });

        try {
            if (command.owner_only && typeof command.owner_only === 'boolean') {
                if (config.users.owner !== interaction.user.id) {
                    return interaction.reply({
                        content: `\`❌\` Sorry but this command is restricted for the bot owner only!`,
                        ephemeral: true
                    });
                };
            };

            if (command.developers_only && typeof command.owner_only === 'boolean') {
                if (config.users?.developers && config.users?.developers?.length > 0) {
                    if (!config.users.developers.some((dev) => interaction.user.id === dev)) return interaction.reply({
                        content: `\`❌\` Sorry but this command is restricted for developers only!`,
                        ephemeral: true
                    });
                };
            };

            if (command.role_perms) {
                if (Array.isArray(command.role_perms)) {
                    if (command.role_perms?.length > 0) {
                        let boolean = false;

                        await command.role_perms.forEach((r) => {
                            const role = interaction.guild.roles.cache.get(r);

                            if (!role) return;

                            if (!interaction.member.roles) boolean = false;
                            if (interaction.member.roles.cache.some((r1) => r1.id === role.id)) boolean = true;
                        });

                        if (boolean === false) return interaction.reply({
                            content: `\`❌\` Sorry but you are not allowed to use this command!`,
                            ephemeral: true
                        });
                    };
                } else if (typeof command.role_perms === 'string') {
                    const role = interaction.guild.roles.cache.get(command.role_perms);

                    if (role) {
                        if (!interaction.member.roles.cache.has(role)) return interaction.reply({
                            content: `\`❌\` Sorry but you are not allowed to use this command!`,
                            ephemeral: true
                        });
                    };
                };
            };

            if (command.cooldown && typeof command.cooldown === 'string') {
                const milliseconds = ms(command.cooldown);

                if (map_cooldown.has(interaction.user.id)) {
                    const date_now = new Date().getTime();

                    const data = map_cooldown.get(interaction.user.id);

                    if (data.sent_on < date_now) {
                        const time = new Date(date_now + milliseconds).getTime();

                        return interaction.reply({
                            content: `\`❌\` You are on cooldown! You can use this command again in <t:${Math.floor(time / 1000)}:f>.`,
                            ephemeral: true
                        });
                    };
                } else {
                    const date_now = new Date().getTime();

                    map_cooldown.set(interaction.user.id, {
                        sent_on: date_now
                    });

                    setTimeout(async () => {
                        map_cooldown.delete(interaction.user.id);
                    }, milliseconds);
                };
            };

            command.run(client, interaction, config);

            if (command.logger && typeof command.logger === 'boolean') {
                if (!config.channels?.logging_channel) return;

                const channel = client.channels.cache.get(config.channels.logging_channel);

                if (!channel) return;

                return channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Application command used: ' + interaction.commandName)
                            .setAuthor({
                                name: client.user.username,
                                iconURL: client.user.displayAvatarURL({ dynamic: true })
                            })
                            .setFields(
                                {
                                    name: 'User',
                                    value: `${interaction.member} (\`${interaction.user.id}\`)`
                                },
                                {
                                    name: 'Used on',
                                    value: `<t:${Math.floor(interaction.createdTimestamp / 1000)}> (<t:${Math.floor(interaction.createdTimestamp / 1000)}:R>)`
                                }
                            )
                            .setColor('Blue')
                    ]
                }).catch(() => { });
            };
        } catch (err) {
            console.warn(`[WARN] Failed to run the command \'${interaction.commandName}\'.`);
            console.log(err);
        } finally {
            console.log(`[INFO] ${interaction.user.username} has used the command \'${interaction.commandName}\'.`);
        };
    } else return;
});