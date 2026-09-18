import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

const POLL_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('pollsettings')
            .setDescription('Enable polls for this server and select a dedicated channel.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addSubcommand((sub) =>
                sub
                    .setName('channel')
                    .setDescription('Set the channel polls are posted in. If polls are disabled, this will enable them.')
                    .addChannelOption((option) =>
                        option.setName('channel').setDescription('The channel to post polls in.').setRequired(true).addChannelTypes(...POLL_CHANNEL_TYPES),
                    ),
            )
            .addSubcommand((sub) => sub.setName('disable').setDescription('Disable the poll system entirely.'))
            .addSubcommand((sub) => sub.setName('status').setDescription('Show the current poll settings.')),
    ),
    category: 'System Management',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const db = interaction.client.db;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel', true, POLL_CHANNEL_TYPES);
            const me = interaction.guild.members.me;
            const permissions = me ? channel.permissionsFor(me) : null;
            if (!permissions?.has(PermissionFlagsBits.SendMessages)) return interaction.editReply('I do not have permission to send messages in that channel.');

            await db.update(guilds).set({pollChannelId: channel.id}).where(eq(guilds.id, interaction.guild.id));
            return interaction.editReply(`Polls are now enabled and will be posted in ${channel}.`);
        }

        if (subcommand === 'disable') {
            const [row] = await db.select({pollChannelId: guilds.pollChannelId}).from(guilds).where(eq(guilds.id, interaction.guild.id));
            if (!row?.pollChannelId) return interaction.editReply('Polls are already disabled.');
            await db.update(guilds).set({pollChannelId: null}).where(eq(guilds.id, interaction.guild.id));
            return interaction.editReply('Polls are now disabled.');
        }

        const [row] = await db.select({pollChannelId: guilds.pollChannelId}).from(guilds).where(eq(guilds.id, interaction.guild.id));
        const channelId = row?.pollChannelId ?? null;
        const channel = channelId ? interaction.guild.channels.cache.get(channelId) : undefined;

        const embed: APIEmbed = {
            title: 'Poll Settings',
            author: {name: interaction.guild.name, icon_url: interaction.guild.iconURL() ?? undefined},
            fields: [
                {
                    name: 'Status',
                    value: channel && channelId ? 'Enabled' : 'Disabled',
                    inline: true
                },
            ],
        };

        if (channel && channelId && embed.fields) embed.fields.push({
            name: 'Channel',
            value: `${channel} (${channelId})`,
            inline: true
        });

        await interaction.editReply({embeds: [embed]});
    },
});
