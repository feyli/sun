import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { eq } from 'drizzle-orm';
import { Socket } from 'node:net';
import { MINECRAFT_DEFAULT_PORT } from '../../constants';
import { mcstatus } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';
import { isServerOnline, pingServer } from '../../utils/minecraft';

const OFFLINE_THUMBNAIL = 'https://media.minecraftforum.net/attachments/300/619/636977108000120237.png';

/** Measures the TCP connection time to the server, as a human-readable string. */
function measureLatency(address: string, port: number): Promise<string> {
    return new Promise((resolve) => {
        const socket = new Socket();
        socket.setTimeout(10000);
        const start = Date.now();
        socket
            .on('connect', () => {
                resolve(`${Date.now() - start}ms`);
                socket.destroy();
            })
            .on('error', () => resolve('N/A (unknown)'))
            .on('timeout', () => {
                resolve('N/A (timeout)');
                socket.destroy();
            })
            .connect(port, address);
    });
}

export default defineSlashCommand({
    data: guildsOnly(new SlashCommandBuilder().setName('mcstatus').setDescription('Get the status of the Minecraft server set in this Discord server.')),
    category: 'Utility',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const [settings] = await interaction.client.db
            .select({address: mcstatus.address, port: mcstatus.port})
            .from(mcstatus)
            .where(eq(mcstatus.guildId, interaction.guild.id));
        const address = settings?.address;
        if (!address) return interaction.editReply({content: 'No Minecraft server has been set for this Discord server.'});
        const port = settings.port ?? MINECRAFT_DEFAULT_PORT;

        const response = await pingServer(address, port, 6000);
        const online = isServerOnline(response);
        const latency = online ? await measureLatency(address, port) : undefined;

        const files: AttachmentBuilder[] = [];
        if (response?.favicon) {
            const base64 = response.favicon.split(',')[1] ?? '';
            files.push(new AttachmentBuilder(Buffer.from(base64, 'base64'), {name: 'favicon.png'}));
        }

        const embed = new EmbedBuilder()
            .setTitle('Minecraft Server Status')
            .addFields([
                {name: 'Status', value: online ? 'Online' : 'Offline', inline: true},
                {name: 'Address', value: address, inline: true},
            ])
            .setFooter({text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.avatarURL() ?? undefined})
            .setColor(online ? 0x65cdb6 : 0xf04251)
            .setThumbnail(files.length > 0 ? 'attachment://favicon.png' : OFFLINE_THUMBNAIL);

        if (online) {
            embed.addFields([
                {name: 'Version', value: response.version.name, inline: true},
                {name: 'Players', value: `${response.players.online}/${response.players.max}`, inline: true},
                {name: 'Latency', value: `${latency}`, inline: true},
            ]);
        }

        await interaction.editReply({embeds: [embed], files});
    },
});
