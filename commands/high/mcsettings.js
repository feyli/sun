const { ChannelType } = require("discord.js");
module.exports = {
    command_data: {
        name: 'mcsettings',
        description: 'Set of commands related to Minecraft server status system.',
        type: 1,
        default_member_permissions: 16,
        options: [
            {
                name: 'set',
                description: 'Set a Minecraft server that will be used for the mcstatus command.',
                type: 1,
                options: [
                    {
                        name: 'address',
                        description: 'The address of the Minecraft server.',
                        type: 3,
                        required: true,
                        max_length: 45
                    },
                    {
                        name: 'port',
                        description: 'The port of the Minecraft server. Defaults to 25565.',
                        type: 4,
                        required: false,
                        min_value: 0,
                        max_value: 65535
                    }
                ]
            },
            {
                name: 'reset',
                description: 'Reset the Minecraft server that will be used for the mcstatus command.',
                type: 1,
                options: []
            },
            {
                name: 'counter',
                description: 'Set of commands related to Minecraft server status counter.',
                type: 2,
                options: [
                    {
                        name: 'enable',
                        description: 'Enable the Minecraft server status counter.',
                        type: 1,
                        options: []
                    },
                    {
                        name: 'disable',
                        description: 'Disable the Minecraft server status counter.',
                        type: 1,
                        options: []
                    },
                    {
                        name: 'rename',
                        description: 'Set the name of the Minecraft server status counter.',
                        type: 1,
                        options: [
                            {
                                name: 'name',
                                description: 'The name of the channel.',
                                type: 3,
                                required: true,
                                max_length: 75
                            }
                        ]
                    },
                    {
                        name: 'help',
                        description: 'Displays help for the Minecraft server status counter.',
                        type: 1,
                        options: []
                    }
                ]
            }
        ]
    },
    cooldown: 5000,
    category: 'System Management',
    run: async (client, interaction) => {
        const db = client.db;
        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();

        await interaction.deferReply({ ephemeral: false });

        if (subcommandGroup === 'counter') {
            if (subcommand === 'enable' || subcommand === 'disable' || subcommand === 'rename') {
                // noinspection JSUnresolvedVariable
                let dbChannelID = await db.query(
                    'SELECT counter_channel_id FROM mcstatus WHERE guild_id = ?',
                    [interaction.guild.id]).then((res) => res[0].counter_channel_id);

                let counterChannel = interaction.guild.channels.cache.get(dbChannelID);

                switch (subcommand) {
                    case 'enable': {
                        if (counterChannel) return interaction.editReply(
                            `The Minecraft server counter is already enabled (${counterChannel}) and is at position ${counterChannel.position +
                            1} (voice channels only).`);

                        ChannelType.GuildVoice = 2;
                        const channel = await interaction.guild.channels.create(
                            {
                                name: 'Online: ',
                                type: ChannelType.GuildVoice,
                                permissionOverwrites: [{ id: interaction.guild.id, deny: '1048576' }],
                            });
                        db.query(
                            'UPDATE mcstatus SET counter_channel_id = ? WHERE guild_id = ?',
                            [channel.id, interaction.guild.id]);
                        await interaction.editReply(`${channel} has been created and will now update every 15 minutes.`);

                        break;
                    }
                    case 'disable': {
                        if (!dbChannelID) return interaction.editReply(
                            'No Minecraft server counter has been set up in this server!');
                        db.query(
                            'UPDATE mcstatus SET counter_channel_id = ?, counter_style = ? WHERE guild_id = ?',
                            [null, null, interaction.guild.id]);
                        if (counterChannel) counterChannel.delete();
                        await interaction.editReply('Minecraft server counter has been disabled!');

                        break;
                    }
                    case 'rename': {
                        if (!dbChannelID) return interaction.editReply(
                            'No Minecraft server counter has been set up in this server!');
                        const name = interaction.options.getString('name');
                        if (!/\{online|\{max/.test(name)) return interaction.editReply(
                            'The name must include `{online}` or `{max}`.');
                        db.query('UPDATE mcstatus SET counter_style = ? WHERE guild_id = ?',
                            [name, interaction.guild.id]);

                        ChannelType.GuildVoice = 2;
                        if (!counterChannel) {
                            counterChannel = await interaction.guild.channels.create(
                                {
                                    name: 'Online: ',
                                    type: ChannelType.GuildVoice,
                                    permissionOverwrites: [{ id: interaction.guild.id, deny: '1048576' }],
                                });
                            db.query('UPDATE mcstatus SET counter_channel_id = ? WHERE guild_id = ?',
                                [counterChannel.id, interaction.guild.id]);
                        }
                        await interaction.editReply(`The counter name has been set to \`${name}\` and the channel will soon be updated.`);

                        break;
                    }
                }
            } else {
                const embed = {
                    title: 'Minecraft Server Counter Help',
                    description: 'The counter will be updated every 15 minutes. It supports the following variables:',
                    fields: [
                        {
                            name: '`{online}`',
                            value: 'The number of online players in the Minecraft server.',
                            inline: true,
                        },
                        {
                            name: '`{max}`',
                            value: 'The maximum number of players in the Minecraft server.',
                            inline: true,
                        },
                        {
                            name: '`.comma`',
                            value: 'Use a comma to separate thousands (e.g. 128,544).',
                            inline: true,
                        },
                        {
                            name: '`.space`',
                            value: 'Use a space to separate thousands (e.g. 128 544).',
                            inline: true,
                        },
                    ],
                };
                await interaction.editReply({ embeds: [embed] });
            }
        } else {
            switch (subcommand) {
                case 'set': {
                    const address = interaction.options.getString('address');
                    const port = interaction.options.getInteger('port') ?? 25565;

                    await db.query('INSERT INTO mcstatus (guild_id, address, port) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE address = ?, port = ?', [interaction.guild.id, address, port, address, port]);

                    const embed = {
                        title: 'Minecraft server set!',
                        color: 0x2D8B76,
                        fields: [
                            {
                                name: 'Address',
                                value: address,
                                inline: true
                            },
                            {
                                name: 'Port',
                                value: port,
                                inline: true
                            }
                        ],
                        footer: {
                            text: `Set by ${interaction.user.username}`,
                            icon_url: interaction.user.avatarURL({ dynamic: true })
                        }
                    };

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
                case 'reset': {
                    await db.query('DELETE FROM mcstatus WHERE guild_id = ?', [interaction.guild.id]);

                    const embed = {
                        title: 'Minecraft server status system reset!',
                        color: 0x2D8B76,
                        footer: {
                            text: `Reset by ${interaction.user.username}`,
                            icon_url: interaction.user.avatarURL({ dynamic: true })
                        }
                    };

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        }
    }
};