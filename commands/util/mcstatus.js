// noinspection JSUnresolvedVariable

const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const mslp = require('minecraft-status').MinecraftServerListPing;
const net = require('net');
const Jimp = require('jimp');

module.exports = {
    command_data: {
        name: 'mcstatus',
        description: 'Get the status of the Minecraft server set in this Discord server.',
        type: 1,
        dm_permission: false,
        options: [],
    },
    category: 'Utility',
    cooldown: 5000,
    run: async (client, interaction) => {
        await interaction.deferReply();
        const db = client.db;

        const { address, port } = await db.query('SELECT address, port FROM mcstatus WHERE guild_id = ?', [interaction.guild.id]).then((res) => res[0]);

        if (!address) return interaction.editReply({ content: 'No Minecraft server has been set for this Discord server.', ephemeral: true });

        // await interaction.deferReply({ ephemeral: false });

        const res = await mslp.ping(4, address, port, 6000).catch(() => {
            return { players: { max: 0 } };
        });

        let latency;

        if (res.players && res.players.max !== 0) {
            const pingPromise = new Promise((resolve, reject) => {
                const sock = new net.Socket();
                sock.setTimeout(10000);
                const first = Date.now();
                sock.on('connect', () => {
                    latency = `${Date.now() - first}ms`;
                    sock.destroy();
                    resolve();
                }).on('error', () => {
                    latency = "N/A (unknown)";
                    reject();
                }).on('timeout', () => {
                    latency = "N/A (timeout)";
                    reject();
                }).connect(port, address);
            });

            await pingPromise.catch();
        }


        let buffer;
        let favicon;
        if (res.favicon) {
            buffer = Buffer.from(res.favicon.split(',')[1], 'base64');
            favicon = new AttachmentBuilder(buffer, { name: 'favicon.png' });
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
            .setThumbnail(favicon ? 'attachment://favicon.png' : 'https://media.minecraftforum.net/attachments/300/619/636977108000120237.png');

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
                    },
                    {
                        name: 'Latency',
                        value: `${latency}`,
                        inline: true
                    }
                ]);
        }

        // only include attachment if not null
        await interaction.editReply({ embeds: [embed], files: favicon ? [favicon] : [] });

        if (res.players.max !== 0) {
            const motdImage = `https://sr-api.sfirew.com/server/${address}:${port}/banner/motd.png?hl=en&v=67DvWb4tVJ`;
            const image = await Jimp.read(motdImage);
            image.crop(230, 66, 1580, 150);
            const motdBanner = new AttachmentBuilder(await image.getBufferAsync(Jimp.MIME_PNG), { name: 'motd.png' });
            embed.setImage('attachment://motd.png');
            await interaction.editReply({ embeds: [embed], files: favicon ? [favicon, motdBanner] : [motdBanner] });
        }
    }
};