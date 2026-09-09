import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

const CONFESSION_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread] as const;

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('confessionsettings')
            .setDescription('Configure confession settings for this server.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addSubcommand((sub) =>
                sub
                    .setName('channel')
                    .setDescription('Set the channel confessions are posted in.')
                    .addChannelOption((option) =>
                        option.setName('channel').setDescription('The channel to post confessions in.').setRequired(true).addChannelTypes(...CONFESSION_CHANNEL_TYPES),
                    ),
            )
            .addSubcommand((sub) => sub.setName('reset').setDescription('Post confessions in the channel they were sent from again.'))
            .addSubcommand((sub) => sub.setName('status').setDescription('Show the current confession settings.')),
    ),
    category: 'System Management',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const db = interaction.client.db;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel', true, CONFESSION_CHANNEL_TYPES);
            const me = interaction.guild.members.me;
            const permissions = me ? channel.permissionsFor(me) : null;
            if (!permissions?.has(PermissionFlagsBits.SendMessages)) return interaction.editReply('I do not have permission to send messages in that channel.');

            await db.update(guilds).set({confessionChannelId: channel.id}).where(eq(guilds.guildId, interaction.guild.id));
            return interaction.editReply(`Confessions will now be posted in ${channel}.`);
        }

        if (subcommand === 'reset') {
            await db.update(guilds).set({confessionChannelId: null}).where(eq(guilds.guildId, interaction.guild.id));
            return interaction.editReply('Confessions will now be posted in the channel they were sent from.');
        }

        const [row] = await db.select({confessionChannelId: guilds.confessionChannelId}).from(guilds).where(eq(guilds.guildId, interaction.guild.id));
        const channelId = row?.confessionChannelId ?? null;
        const channel = channelId ? interaction.guild.channels.cache.get(channelId) : undefined;

        const embed: APIEmbed = {
            title: 'Confession Settings',
            author: {name: interaction.guild.name, icon_url: interaction.guild.iconURL() ?? undefined},
            fields: [
                {name: 'Dedicated channel', value: channel?.toString() ?? 'None (posted where sent)', inline: true},
                {name: 'Channel ID', value: channelId ?? 'None', inline: true},
            ],
        };
        await interaction.editReply({embeds: [embed]});
    },
});
