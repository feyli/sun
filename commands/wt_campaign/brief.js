module.exports = {
    command_data: {
        name: 'brief',
        description: 'Relatif à la mission actuelle.',
        type: 1,
        options: [
            {
                name: 'send',
                description: 'Envoie le briefing de mission dans le salon prédéfini (admin seulement).',
                type: 1,
            },
            {
                name: 'get',
                description: 'Envoie le briefing de mission en MP.',
                type: 1,
            },
        ],
    },
    guild_id: '1097431302338256977',
    category: 'War Thunder Campaign',
    run: async (client, interaction) => {
        const conn = client.sunPool.getConnection();

        if (interaction.options.getSubcommand() === 'send') {
            if (!interaction.memberPermissions.has(8)) return interaction.reply(
                { content: 'You do not have permission to use this command.', ephemeral: true });

            await interaction.deferReply({ ephemeral: true });

            // noinspection JSUnresolvedVariable
            const briefChannel = await conn.query('SELECT brief_channel FROM guilds WHERE guild_id = ?',
                [interaction.guild.id]).then((res) => res[0].brief_channel);

            if (!briefChannel) return interaction.editReply(
                'The mission brief channel has not been set.');

            const channel = interaction.guild.channels.cache.get(briefChannel);

            if (!channel) return interaction.editReply(
                'The mission brief channel has been deleted. You\'ll have to set a new one.');

            // noinspection JSUnresolvedVariable
            const brief = await conn.query('SELECT mission_brief FROM guilds WHERE guild_id = ?',
                [interaction.guild.id]).then((res) => res[0].mission_brief);

            if (!brief) return interaction.editReply(
                'There is no mission brief to send. Please set one first.');

            brief.author = {
                iconURL: interaction.guild.iconURL({ dynamic: true }),
                name: 'Campagne War Thunder',
            };
            brief.footer = { text: 'Briefing de mission' };

            await channel.send({ embeds: [brief] });
            await interaction.editReply(':airplane_small: | Mission brief __sent__.');
        } else if (interaction.options.getSubcommand() === 'get') {
            await interaction.deferReply({ ephemeral: true });

            // noinspection JSUnresolvedVariable
            const brief = await conn.query('SELECT mission_brief FROM guilds WHERE guild_id = ?',
                [interaction.guild.id]).then((res) => res[0].mission_brief);

            if (!brief) return interaction.editReply(
                ':flag_white: | Aucun briefing de mission n\'est actuellement disponible mais __restez à l\'affût__ !');

            brief.author = {
                iconURL: interaction.guild.iconURL({ dynamic: true }),
                name: 'Campagne War Thunder',
            };
            brief.footer = { text: 'Briefing de mission' };

            await interaction.user.send({ embeds: [brief] });
            await interaction.editReply(
                ':airplane_small: | Le briefing de mission vous a été envoyé en __MP__.');
        }
    },
};