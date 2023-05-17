const mslp = require('minecraft-status').MinecraftServerListPing;

module.exports = {
    command_data: {
        name: 'mcstatus',
        description: 'Get the status of the Minecraft server set in this Discord server.',
        type: 1,
        options: []
    },
    cooldown: 5000,
    run: async (client, interaction) => {
        const db = client.db;

        const { address, port } = await db.query('SELECT address, port FROM mcstatus WHERE guild_id = ?', [interaction.guild.id]).then((res) => res[0]);

        if (!address) return interaction.reply({ content: 'No Minecraft server has been set for this Discord server.', ephemeral: true });

        await interaction.deferReply({ ephemeral: false });

        const res = await mslp.ping(4, address, port);

        const embed = {
            title: 'Minecraft Server Status',
            fields: [
                {
                    name: 'Status',
                    value: `${res.players.max !== 0 ? 'Online' : 'Offline'}`,
                    inline: true
                },
                {
                    name: 'Address',
                    value: `${address}`,
                    inline: true
                },
                {
                    name: 'Port',
                    value: `${port}`,
                    inline: true
                }
            ],
            footer: {
                text: `Requested by ${interaction.user.username}`,
                icon_url: interaction.user.avatarURL({ dynamic: true })
            },
            color: res.players.max !== 0 ? 0x65CDB6 : 0xF04251
        };

        if (res.max !== 0) {
            embed.fields.push({
                name: 'Version',
                value: `${res.version.name}`,
                inline: true
            });
            embed.fields.push({
                name: 'Players',
                value: `${res.players.online}/${res.players.max}`,
                inline: true
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};