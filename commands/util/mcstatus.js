// noinspection JSUnresolvedVariable

const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
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

        // await interaction.deferReply({ ephemeral: false });

        const res = await mslp.ping(4, address, port).catch(() => {
            return { players: { max: 0 } };
        });

        let buffer;
        let attachment;
        if (res.favicon) {
            buffer = Buffer.from(res.favicon.split(',')[1], 'base64');
            attachment = new AttachmentBuilder(buffer, { name: 'favicon.png' });
        }

        const embed = new EmbedBuilder()
            .setTitle('Minecraft Server Status')
            .addFields([
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
            ])
            .setFooter({
                text: `Requested by ${interaction.user.username}`,
                iconURL: interaction.user.avatarURL({ dynamic: true })
            })
            .setColor(res.players.max !== 0 ? 0x65CDB6 : 0xF04251)
            .setThumbnail(attachment ? 'attachment://favicon.png' : 'https://media.minecraftforum.net/attachments/300/619/636977108000120237.png');

        if (res.players.max !== 0) {
            embed.addFields(
                [
                    {
                        name: 'Version',
                        value: `${res.version.name}`,
                        inline: true
                    },
                    {
                        name: 'Players',
                        value: `${res.players.online}/${res.players.max}`,
                        inline: true
                    }
                ]);
        }

        // only include attachment if not null
        await interaction.reply({ embeds: [embed], files: attachment ? [attachment] : [] });
    }
};