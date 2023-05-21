// noinspection JSUnresolvedVariable,DuplicatedCode

const { nanoid } = require('nanoid');

module.exports = {
    command_data: {
        name: 'warn',
        description: 'Set of commands for warns.',
        type: 1,
        dm_permission: false,
        options: [
            {
                name: 'add',
                description: 'Add a warn to a user.',
                type: 1,
                options: [
                    {
                        name: 'user',
                        description: 'The user to warn.',
                        type: 6,
                        required: true,
                    },
                    {
                        name: 'title',
                        description: 'The reason title of the warn.',
                        type: 3,
                        required: true,
                        max_length: 200,
                    },
                    {
                        name: 'description',
                        description: 'A description to include in the warn.',
                        type: 3,
                        required: false,
                        max_length: 5000,
                    },
                ],
            },
            {
                name: 'remove',
                description: 'Remove a warn from a user.',
                type: 1,
                options: [
                    {
                        name: 'warn_id',
                        description: 'The warn ID to remove.',
                        type: 3,
                        required: true,
                        min_length: 25,
                        max_length: 25
                    }
                ],
            },
            {
                name: 'clean',
                description: 'Clear all warns of a user.',
                type: 1,
                options: [
                    {
                        name: 'user',
                        description: 'The user to clear warns of.',
                        type: 6,
                        required: true,
                    }
                ]
            },
            {
                name: 'list',
                description: 'List all warns of a user.',
                type: 1,
                options: [
                    {
                        name: 'user',
                        description: 'The user to list warns of.',
                        type: 6,
                        required: true,
                    }
                ]
            },
            {
                name: 'info',
                description: 'Get info about a warn.',
                type: 1,
                options: [
                    {
                        name: 'warn_id',
                        description: 'The warn ID to get info about.',
                        type: 3,
                        required: true,
                        min_length: 25,
                        max_length: 25,
                    }
                ]
            },
            {
                name: 'edit',
                description: 'Edit a warn.',
                type: 1,
                options: [
                    {
                        name: 'warn_id',
                        description: 'The ID of the warn to edit.',
                        type: 3,
                        required: true,
                        min_length: 25,
                        max_length: 25
                    },
                    {
                        name: 'title',
                        description: 'The new title of the warn.',
                        type: 3,
                        required: false,
                        max_length: 200
                    },
                    {
                        name: 'description',
                        description: 'The new description of the warn.',
                        type: 3,
                        required: false,
                        max_length: 5000
                    },
                    {
                        name: 'remove_description',
                        description: 'Remove the description of the warn.',
                        type: 5,
                        required: false
                    }
                ]
            },
            {
                name: 'leaderboard',
                description: 'Get a leaderboard of people with most warns in the server (not really useful, but fun).',
                type: 1,
                options: [
                    {
                        name: 'limit',
                        description: 'The maximum number of people to show in the leaderboard.',
                        type: 4,
                        required: false,
                        max_value: 15,
                        min_value: 1
                    }
                ]
            },
            {
                name: 'reset',
                description: 'Reset the warn system on your server. Be careful, this action is irreversible.',
                type: 1,
                options: [
                    {
                        name: 'confirm',
                        description: 'Enter "I CONFIRM" to proceed.',
                        type: 3,
                        required: true,
                        min_length: 9,
                        max_length: 9
                    }
                ]
            }
        ],
        default_member_permissions: 2,
    },
    cooldown: 1000,
    category: 'Moderation',
    run: async (client, interaction) => {
        await interaction.deferReply();
        const db = client.db;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add': {
                const user = interaction.options.getUser('user');
                const member = interaction.guild.members.cache.get(user.id);
                if (user.bot) return interaction.editReply({ content: 'You can\'t warn a bot.', ephemeral: true });
                if (!member) return interaction.editReply({ content: 'This user is not in this server.', ephemeral: true });
                if (!member.manageable) return interaction.editReply({ content: 'I can\'t warn this user. My highest role is not prior to this member\'s.', ephemeral: true });
                if (member.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.permissions.has('8')) return interaction.editReply({ content: 'You can\'t warn this user. Your highest role is not prior to this member\'s.', ephemeral: true });
                const title = interaction.options.getString('title');
                const description = interaction.options.getString('description');

                const warn = {
                    warnId: nanoid(25),
                    guildId: interaction.guild.id,
                    userId: user.id,
                    title,
                    description,
                    creator: interaction.user.id,
                };

                const IDDoesExist = await db.query('SELECT warn_id FROM warns WHERE warn_id = ?', [warn.warnId]);
                if (IDDoesExist[0]) warn.warnId = nanoid(25);

                await db.query('INSERT INTO warns (warn_id, user_id, guild_id, reason_title, reason_description, creator_id) VALUES (?, ?, ?, ?, ?, ?)', [warn.warnId, warn.userId, warn.guildId, warn.title, warn.description, warn.creator]);

                const interactionEmbed = {
                    title: `Warned ${user.username}!`,
                    footer: {
                        text: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                    fields: [
                        {
                            name: 'Title',
                            value: title,
                            inline: true
                        },
                        {
                            name: 'Description',
                            value: description || 'No description provided.',
                            inline: true
                        },
                        {
                            name: 'Warn ID',
                            value: warn.warnId,
                            inline: true
                        }
                    ]
                };
                const DMEmbed = {
                    title: `You have been warned in **${interaction.guild.name}**!`,
                    footer: {
                        text: interaction.guild.name,
                        icon_url: interaction.guild.iconURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                    fields: [
                        {
                            name: 'Title',
                            value: title,
                            inline: true
                        },
                        {
                            name: 'Description',
                            value: description || 'No description provided.',
                            inline: true
                        },
                        {
                            name: 'Warn ID',
                            value: warn.warnId,
                            inline: true
                        }
                    ],
                };

                await interaction.editReply({ embeds: [interactionEmbed] });
                await user.send({ embeds: [DMEmbed] }).catch(() => {
                    interaction.channel.send({ content: `I couldn't send a DM to ${user}.` });
                });
                break;
            }
            case 'remove': {
                const givenID = interaction.options.getString('warn_id');
                const warn = await db.query('SELECT * FROM warns WHERE warn_id = ?', [givenID]).then((res) => {
                    return res[0];
                });

                if (!warn || warn.guild_id !== interaction.guild.id) return interaction.editReply({ content: 'This warn ID does not exist.', ephemeral: true });

                await db.query('DELETE FROM warns WHERE warn_id = ?', [givenID]);

                const embed = {
                    title: "Warn succesfully deleted",
                    fields: [
                        {
                            name: "Reason of the warn (title)",
                            value: warn.reason_title
                        },
                        {
                            name: "Warned user",
                            value: `<@${warn.user_id}>`
                        },
                        {
                            name: "Warn ID",
                            value: givenID
                        }
                    ]
                };

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'clean': {
                const user = interaction.options.getUser('user');
                const member = interaction.guild.members.cache.get(user.id);
                if (user.bot) return interaction.editReply({ content: 'You cannot warn a bot. Why would you clear its warns?', ephemeral: true });
                if (member.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.permissions.has('8')) return interaction.editReply({ content: 'You can\'t warn this user. Your highest role is not prior to this member\'s.', ephemeral: true });

                const length = await db.query('SELECT * FROM warns WHERE user_id = ? AND guild_id = ?', [user.id, interaction.guild.id]).then((res) => res.length);
                if (length === 0) return interaction.editReply({ content: 'This user has no warns (at least on this server).', ephemeral: true });
                await db.query('DELETE FROM warns WHERE user_id = ? AND guild_id = ?', [user.id, interaction.guild.id]);

                const embed = {
                    title: `Cleared ${length} warns of ${user.username}!`,
                    footer: {
                        text: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                };

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'list': {
                const user = interaction.options.getUser('user');

                const warns = await db.query('SELECT warn_id, reason_description, reason_title, UNIX_TIMESTAMP(timestamp) AS timestamp FROM warns WHERE user_id = ? AND guild_id = ?', [user.id, interaction.guild.id, user.id, interaction.guild.id]);
                if (warns.length === 0) return interaction.editReply({ content: 'This user has no warns (at least on this server).', ephemeral: true });
                warns.sort((a, b) => b.timestamp - a.timestamp);

                const embed = {
                    title: `Warns of ${user.username}`,
                    footer: {
                        text: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                    fields: []
                };

                for (const warn of warns) {
                    console.log(warn);
                    embed.fields.push({
                        name: `Warn ID: \`${warn.warn_id}\``,
                        value: `Title: ${warn.reason_title}${warn.reason_description ? `\nDescription: ${warn.reason_description}` : ""}\nDate and time: <t:${warn.timestamp}:d> <t:${warn.timestamp}:T>`
                    });
                }

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'info': {
                const givenID = interaction.options.getString('warn_id');
                const warn = await db.query('SELECT warn_id, user_id, guild_id, reason_title, reason_description, creator_id, UNIX_TIMESTAMP(timestamp) AS timestamp FROM warns WHERE warn_id = ?', [givenID]).then((res) => {
                    return res[0];
                });
                if (!warn || warn.guild_id !== interaction.guild.id) return interaction.editReply({ content: 'This warn ID does not exist.', ephemeral: true });

                const { warn_id, user_id, guild_id, reason_title, reason_description, timestamp, creator_id } = warn;

                const embed = {
                    title: `Warn ID: \`${warn_id}\``,
                    footer: {
                        text: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                    fields: [
                        {
                            name: "Warned user",
                            value: `<@${user_id}> (\`${user_id}\`)`,
                            inline: true
                        },
                        {
                            name: "Warned by",
                            value: `<@${creator_id}> (\`${creator_id}\`)`,
                            inline: true
                        },
                        {
                            name: "Reason (title)",
                            value: reason_title,
                            inline: true
                        },
                        {
                            name: "Reason (description)",
                            value: reason_description || "No description provided.",
                            inline: true
                        },
                        {
                            name: "Date and time",
                            value: `<t:${timestamp}:d> <t:${timestamp}:T> (\`${timestamp}\`)`,
                            inline: true
                        },
                        {
                            name: "Guild ID",
                            value: `\`${guild_id}\``,
                            inline: true
                        }
                    ],
                };

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'edit': {
                const givenID = interaction.options.getString('warn_id');
                const warn = await db.query('SELECT * FROM warns WHERE warn_id = ?', [givenID]).then((res) => {
                    return res[0];
                });
                if (!warn || warn.guild_id !== interaction.guild.id) return interaction.editReply({ content: 'This warn ID does not exist.', ephemeral: true });

                const newTitle = interaction.options.getString('title');
                const newDescription = interaction.options.getString('description');
                const removeDescription = interaction.options.getBoolean('remove_description');

                if (!newTitle && !newDescription && !removeDescription) return interaction.editReply({ content: 'You must edit at least one thing.', ephemeral: true });
                if (removeDescription && newDescription) return interaction.editReply({ content: 'You cannot **set a new description** and **remove the description** at the same time.\nTo **set a new description** (and __replace__ the old one), set \`remove_description\` to **False**.', ephemeral: true });

                await db.query('UPDATE warns SET reason_title = IF(? IS NOT NULL, ?, reason_title), reason_description = IF(? = true, NULL, IF(? IS NOT NULL, ?, reason_description)) WHERE warn_id = ?', [newTitle, newTitle, removeDescription, newDescription, newDescription, givenID]);

                const embed = {
                    title: `Warn ID: \`${givenID}\``,
                    footer: {
                        text: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                    fields: []
                };

                if (newTitle) embed.fields.push({
                    name: "New title",
                    value: newTitle
                });
                if (newDescription) embed.fields.push({
                    name: "New description",
                    value: newDescription
                });
                if (removeDescription) embed.fields.push({
                    name: "Description removed",
                    value: "Yes"
                });

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'leaderboard': {
                const warns = await db.query('SELECT user_id, COUNT(*) as count FROM warns WHERE guild_id = ? GROUP BY user_id ORDER BY count DESC LIMIT ?', [interaction.guild.id, interaction.options.getInteger('limit') || 10]);
                if (warns.length === 0) return interaction.editReply({ content: 'There are no warns in this server.' });

                const embed = {
                    title: ":trophy: **Warn Leaderboard** :trophy:",
                    footer: {
                        text: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    timestamp: new Date(),
                    color: 0x000000,
                    fields: []
                };

                for (const warn of warns) {
                    // also include index before user mention
                    embed.fields.push({
                        name: `**Top ${warns.indexOf(warn) + 1}**`,
                        value: `${interaction.guild.members.cache.get(warn.user_id) || '`' + warn.user_id + '`'} with ${warn.count} warn${warn.count === 1 ? '' : 's'}`
                    });
                }

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'reset': {
                if (!interaction.memberPermissions.has('8')) return interaction.reply({
                    embeds: [{
                        title: 'Missing Permission',
                        description: 'You are missing the `ADMINISTRATOR` permission.',
                        color: 0xf26448,
                    }], ephemeral: true
                });
                const confirmation = interaction.options.getString('confirm');
                if (confirmation !== 'I CONFIRM') return await interaction.editReply({ content: 'You must enter `I CONFIRM` in the dedicated option to proceed.', ephemeral: true });

                await interaction.editReply({
                    embeds: [{
                        title: "Are you sure?",
                        description: `This action is **irreversible**. All warns will be deleted from the database and **cannot be recovered**.\n\nIf you are sure, click the button below.\nThis will expire <t:${(Date.now() + 30000).toString().slice(0, -3)}:R>.`,
                        color: 0xFF0000,
                        footer: {
                            text: interaction.user.username,
                            icon_url: interaction.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date()
                    }], components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            style: 4,
                            label: "Yes, I am sure",
                            custom_id: "reset_warns_yes"
                        }, {
                            type: 2,
                            style: 3,
                            label: "No, I want to cancel",
                            custom_id: "reset_warns_no"
                        }]
                    }]
                });

                setTimeout(async () => {
                    if (interaction.embeds[0] !== "Are you sure?") return;
                    await interaction.editReply({
                        embeds: [{
                            title: "Operation Cancelled",
                            description: "The operation expired (30 seconds passed).",
                            color: 0xf26440,
                        }], components: []
                    });
                }, 30000);

                break;
            }
        }
    }
};