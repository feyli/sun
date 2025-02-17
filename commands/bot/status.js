module.exports = {
    command_data: {
        name: 'status',
        description: 'Displays the bot\'s status.',
        type: 1,
        integration_types: [0],
        contexts: [0],
        default_member_permissions: 16,
        options: [
            {
                name: 'membercounter',
                description: 'Displays the status of the member counter in this server.',
                type: 1,
            },
            {
                name: 'welcome',
                description: 'Displays the status of the welcome system in this server.',
                type: 1,
            },
        ],
    },
    category: 'Bot',
    cooldown: 3000,
    run: async (client, interaction) => {
        const pool = client.sunPool;

        await interaction.deferReply({ ephemeral: false });
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'membercounter') {
            // noinspection JSUnresolvedVariable
            let dbChannelID = await pool.query(
                'SELECT member_counter_channel_id FROM guilds WHERE guild_id = ?', [interaction.guild.id]).then((res) => res[0].member_counter_channel_id);
            const counterChannel = interaction.guild.channels.cache.get(dbChannelID);

            // noinspection DuplicatedCode
            if (dbChannelID && !counterChannel) {
                pool.query(
                    'UPDATE guilds SET member_counter_channel_id = NULL, member_counter_style = NULL WHERE guild_id = ?',
                    [interaction.guild.id]);
                dbChannelID = null;
            }

            // noinspection JSUnresolvedVariable
            let embed = {
                title: 'Member Counter Status',
                author: {
                    name: interaction.guild.name,
                    iconURL: interaction.guild.iconURL({ dynamic: true }),
                },
                fields: [
                    {
                        name: 'Enabled',
                        value: dbChannelID ? 'Yes' : 'No',
                        inline: true,
                    },
                    {
                        name: 'Channel',
                        value: counterChannel?.toString() ?? 'None',
                        inline: true,
                    },
                    {
                        name: 'Channel Position',
                        value: counterChannel ? counterChannel.position + 1 : 'None',
                        inline: true,
                    },
                    {
                        name: 'Channel ID',
                        value: dbChannelID ?? 'None',
                        inline: true,
                    },
                    {
                        name: 'Custom Style',
                        value: await pool.query(
                            'SELECT member_counter_style FROM guilds WHERE guild_id = ?',
                            [interaction.guild.id]).then((res) => res[0].member_counter_style) ?? 'None',
                        inline: true,
                    },
                ],
            };
            await interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'welcome') {
            // noinspection JSUnresolvedVariable
            let dbChannelID = await pool.query(
                'SELECT welcome_channel_id FROM guilds WHERE guild_id = ?', [interaction.guild.id]).then((res) => res[0].welcome_channel_id);
            let welcomeChannel = interaction.guild.channels.cache.get(dbChannelID);

            // noinspection DuplicatedCode
            if (dbChannelID && !welcomeChannel) {
                pool.query(
                    'UPDATE guilds SET welcome_channel_id = ? WHERE guild_id = ?',
                    [null, interaction.guild.id]);
                dbChannelID = null;
            }

            // noinspection JSUnresolvedVariable
            let embed = {
                title: 'Welcome System Status',
                author: {
                    name: interaction.guild.name,
                    iconURL: interaction.guild.iconURL({ dynamic: true }),
                },
                fields: [
                    {
                        name: 'Enabled',
                        value: dbChannelID ? 'Yes' : 'No',
                        inline: true,
                    },
                    {
                        name: 'Channel',
                        value: welcomeChannel?.toString() ?? 'None',
                        inline: true,
                    },
                    {
                        name: 'Channel ID',
                        value: dbChannelID ?? 'None',
                        inline: true,
                    },
                    {
                        name: 'Custom Message',
                        value: await pool.query(
                            'SELECT welcome_message FROM guilds WHERE guild_id = ?',
                            [interaction.guild.id]).then((res) => res[0].welcome_message) ?? 'None',
                        inline: true,
                    },
                ],
            };

            await interaction.editReply({ embeds: [embed] });
        }
    },
};