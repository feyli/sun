module.exports = {
    command_data: {
        name: 'welcome',
        description: 'Welcome system-related commands',
        type: 1,
        integration_types: [0],
        contexts: [0],
        default_member_permissions: 16,
        options: [
            {
                name: 'enable',
                description: 'Enables the welcome system.',
                type: 1,
                options: [
                    {
                        name: 'channel',
                        description: 'The channel to send the welcome message in.',
                        type: 7,
                        required: true,
                        channel_types: [0, 5, 11],
                    },
                ],
            },
            {
                name: 'disable',
                description: 'Disables the welcome system.',
                type: 1,
            },
            {
                name: 'setmessage',
                description: 'Sets the welcome message.',
                type: 1,
                options: [
                    {
                        name: 'message',
                        description: 'The message to send when a user joins.',
                        type: 3,
                        required: true,
                        max_length: 2000,
                    },
                ],
            },
            {
                name: 'help',
                description: 'Displays further detail regarding variable usage.',
                type: 1,
            },
        ],
    },
    category: 'System Management',
    cooldown: 5000,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const conn = await client.sunPool.getConnection();

        // noinspection JSUnresolvedVariable
        const welcomeChannelID = await conn.query(
            'SELECT welcome_channel_id FROM guilds WHERE guild_id = ?', [interaction.guild.id]).then((res) => res[0].welcome_channel_id);

        if (subcommand === 'enable') {
            const channel = interaction.options.getChannel('channel');
            if (!channel.permissionsFor(interaction.guild.members.me).has('SEND_MESSAGES')) return interaction.reply(
                'I do not have permission to send messages in that channel.');
            if (!channel.permissionsFor(interaction.guild.members.me).has('VIEW_CHANNEL')) return interaction.reply(
                'I do not have permission to view that channel.');

            await conn.query('UPDATE guilds SET welcome_channel_id = ? WHERE guild_id = ?',
                [channel.id, interaction.guild.id]);
            await interaction.editReply(`Successfully enabled the welcome system in ${channel}.`);
        } else if (subcommand === 'disable') {
            if (!welcomeChannelID) return interaction.editReply(
                'The welcome system is already disabled.');

            await conn.query(
                'UPDATE guilds SET welcome_channel_id = NULL, welcome_message = NULL WHERE guild_id = ?',
                [interaction.guild.id]);
            await interaction.editReply('Successfully disabled the welcome system.');
        } else if (subcommand === 'setmessage') {
            if (!welcomeChannelID) return interaction.editReply(
                'The welcome system is disabled. Enable it with `/welcome enable`.');

            const message = interaction.options.getString('message');
            await conn.query('UPDATE guilds SET welcome_message = ? WHERE guild_id = ?',
                [message, interaction.guild.id]);
            await interaction.editReply('Successfully set the welcome message.');
        } else if (subcommand === 'help') {
            let embed = {
                title: 'Welcome System Help',
                description: 'The welcome system allows you to send a message when a user joins your server. ' +
                    'You can use the following variables in your message:',
                fields: [
                    {
                        name: '`{userMention}`',
                        value: 'The user\'s mention.',
                        inline: true,
                    },
                    {
                        name: '`{userTag}`',
                        value: 'The user\'s tag.',
                        inline: true,
                    },
                    {
                        name: '`{userUsername}`',
                        value: 'The user\'s username.',
                        inline: true,
                    },
                    {
                        name: '`{serverName}`',
                        value: 'The server\'s name.',
                        inline: true,
                    },
                    {
                        name: '`{memberCount}`',
                        value: 'The number of human members in the server.',
                        inline: true,
                    },
                ],
                footer: {
                    text: 'Note: You can use the /welcome setmessage command to set the welcome message.',
                },
            };

            await interaction.editReply({ embeds: [embed] });
        }
    },
};