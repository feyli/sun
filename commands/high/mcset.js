module.exports = {
    command_data: {
        name: 'mcset',
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
            }
        ]
    },
    cooldown: 5000,
    category: 'System Management',
    run: async (client, interaction) => {
        const db = client.db;
        const subcommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: false });

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
};