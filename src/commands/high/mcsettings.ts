import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { and, eq, isNotNull } from 'drizzle-orm';
import { MINECRAFT_DEFAULT_PORT } from '../../constants';
import { mcstatus } from '../../db/schema';
import { updateMinecraftCounters } from '../../tasks/minecraftCounter';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';
import { isServerOnline, pingServer } from '../../utils/minecraft';

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('mcsettings')
            .setDescription('Set of commands related to Minecraft server status system.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addSubcommand((sub) =>
                sub
                    .setName('set')
                    .setDescription('Set a Minecraft server that will be used for the mcstatus command.')
                    .addStringOption((option) => option.setName('address').setDescription('The address of the Minecraft server.').setRequired(true).setMaxLength(45))
                    .addIntegerOption((option) =>
                        option.setName('port').setDescription('The port of the Minecraft server. Defaults to 25565.').setMinValue(0).setMaxValue(65535),
                    ),
            )
            .addSubcommand((sub) => sub.setName('reset').setDescription('Reset the Minecraft server that will be used for the mcstatus command.'))
            .addSubcommandGroup((group) =>
                group
                    .setName('counter')
                    .setDescription('Set of commands related to Minecraft server status counter.')
                    .addSubcommand((sub) => sub.setName('enable').setDescription('Enable the Minecraft server status counter.'))
                    .addSubcommand((sub) => sub.setName('disable').setDescription('Disable the Minecraft server status counter.'))
                    .addSubcommand((sub) =>
                        sub
                            .setName('rename')
                            .setDescription('Set the name of the Minecraft server status counter.')
                            .addStringOption((option) => option.setName('name').setDescription('The name of the channel.').setRequired(true).setMaxLength(75)),
                    )
                    .addSubcommand((sub) => sub.setName('help').setDescription('Displays help for the Minecraft server status counter.')),
            ),
    ),
    cooldown: 5000,
    category: 'System Management',
    guildOnly: true,
    async execute(interaction) {
        const db = interaction.client.db;
        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();

        await interaction.deferReply();

        if (subcommandGroup === 'counter') {
            if (subcommand === 'enable' || subcommand === 'disable' || subcommand === 'rename') {
                const [settings] = await db
                    .select()
                    .from(mcstatus)
                    .where(and(eq(mcstatus.guildId, interaction.guild.id), isNotNull(mcstatus.address)));
                if (!settings?.address) return interaction.editReply('No Minecraft server has been set up in this server! Use `/mcsettings set` to set one up.');
                const dbChannelId = settings.counterChannelId;

                let counterChannel = dbChannelId ? interaction.guild.channels.cache.get(dbChannelId) : undefined;

                switch (subcommand) {
                    case 'enable': {
                        if (counterChannel) {
                            const position = counterChannel.isThread() ? 'unknown' : counterChannel.position + 1;
                            return interaction.editReply(`The Minecraft server counter is already enabled (${counterChannel}) and is at position ${position} (voice channels only).`);
                        }

                        const response = await pingServer(settings.address, settings.port ?? MINECRAFT_DEFAULT_PORT, 5000);
                        const onlineCount = response ? String(response.players.online) : '0';

                        const channel = await interaction.guild.channels.create({
                            name: isServerOnline(response) ? 'Online: ' + onlineCount : 'Server Offline',
                            type: ChannelType.GuildVoice,
                            permissionOverwrites: [{id: interaction.guild.id, deny: [PermissionFlagsBits.Connect]}],
                        });
                        db.update(mcstatus).set({counterChannelId: channel.id}).where(eq(mcstatus.guildId, interaction.guild.id)).catch(console.error);
                        await interaction.editReply(`${channel} has been created and will now update every 15 minutes.`);
                        break;
                    }
                    case 'disable': {
                        if (!dbChannelId) return interaction.editReply('No Minecraft server counter has been set up in this server!');
                        db.update(mcstatus)
                            .set({counterChannelId: null, counterStyle: null})
                            .where(eq(mcstatus.guildId, interaction.guild.id))
                            .catch(console.error);
                        if (counterChannel) counterChannel.delete().catch(console.error);
                        await interaction.editReply('Minecraft server counter has been disabled!');
                        break;
                    }
                    case 'rename': {
                        if (!dbChannelId) return interaction.editReply('No Minecraft server counter has been set up in this server!');
                        const name = interaction.options.getString('name', true);
                        if (!/\{online|\{max/.test(name)) return interaction.editReply('The name must include `{online}` or `{max}`.');
                        db.update(mcstatus).set({counterStyle: name}).where(eq(mcstatus.guildId, interaction.guild.id)).catch(console.error);

                        if (!counterChannel) {
                            counterChannel = await interaction.guild.channels.create({
                                name: 'Online: ',
                                type: ChannelType.GuildVoice,
                                permissionOverwrites: [{id: interaction.guild.id, deny: [PermissionFlagsBits.Connect]}],
                            });
                            db.update(mcstatus).set({counterChannelId: counterChannel.id}).where(eq(mcstatus.guildId, interaction.guild.id)).catch(console.error);
                        }
                        await interaction.editReply(
                            `The counter name has been set to \`${name}\` and the channel will soon be updated. Note that this may take up to __15 minutes__. If you want to bypass this time, disable and enable the feature again.`,
                        );
                        await updateMinecraftCounters(interaction.client, interaction.guild.id);
                        break;
                    }
                }
            } else {
                const embed: APIEmbed = {
                    title: 'Minecraft Server Counter Help',
                    description: 'The counter will be updated every 15 minutes. It supports the following variables:',
                    fields: [
                        {name: '`{online}`', value: 'The number of online players in the Minecraft server.', inline: true},
                        {name: '`{max}`', value: 'The maximum number of players in the Minecraft server.', inline: true},
                        {name: '`.comma`', value: 'Use a comma to separate thousands (e.g. 128,544).', inline: true},
                        {name: '`.space`', value: 'Use a space to separate thousands (e.g. 128 544).', inline: true},
                    ],
                };
                await interaction.editReply({embeds: [embed]});
            }
            return;
        }

        switch (subcommand) {
            case 'set': {
                const address = interaction.options.getString('address', true);
                const port = interaction.options.getInteger('port') ?? MINECRAFT_DEFAULT_PORT;

                await db
                    .insert(mcstatus)
                    .values({guildId: interaction.guild.id, address, port})
                    .onConflictDoUpdate({target: mcstatus.guildId, set: {address, port}});

                const embed: APIEmbed = {
                    title: 'Minecraft server set!',
                    color: 0x2d8b76,
                    fields: [
                        {name: 'Address', value: address, inline: true},
                        {name: 'Port', value: String(port), inline: true},
                    ],
                    footer: {text: `Set by ${interaction.user.username}`, icon_url: interaction.user.avatarURL() ?? undefined},
                };

                await interaction.editReply({embeds: [embed]});
                await updateMinecraftCounters(interaction.client, interaction.guild.id);
                break;
            }
            case 'reset': {
                await db.delete(mcstatus).where(eq(mcstatus.guildId, interaction.guild.id));

                const embed: APIEmbed = {
                    title: 'Minecraft server status system reset!',
                    color: 0x2d8b76,
                    footer: {text: `Reset by ${interaction.user.username}`, icon_url: interaction.user.avatarURL() ?? undefined},
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
        }
    },
});
