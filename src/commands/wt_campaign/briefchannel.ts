import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { eq } from 'drizzle-orm';
import { WT_CAMPAIGN_GUILD_ID } from '../../constants';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

const BRIEF_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.GuildAnnouncement,
    ChannelType.AnnouncementThread,
    ChannelType.PublicThread,
    ChannelType.PrivateThread,
] as const;

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('briefchannel')
            .setDescription('Sets the channel to use for mission briefs.')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addSubcommand((sub) =>
                sub
                    .setName('set')
                    .setDescription('Sets the channel to use for mission briefs.')
                    .addChannelOption((option) =>
                        option.setName('channel').setDescription('The channel to set as the mission brief channel.').setRequired(true).addChannelTypes(...BRIEF_CHANNEL_TYPES),
                    ),
            )
            .addSubcommand((sub) => sub.setName('reset').setDescription('Resets the channel to use for mission briefs.')),
    ),
    category: 'War Thunder Campaign',
    guildId: WT_CAMPAIGN_GUILD_ID,
    guildOnly: true,
    async execute(interaction) {
        const db = interaction.client.db;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'reset') {
            await db.update(guilds).set({briefChannel: null}).where(eq(guilds.guildId, interaction.guild.id));
            await interaction.reply({content: 'Reset the mission brief channel.'});
        } else if (subcommand === 'set') {
            const channel = interaction.options.getChannel('channel', true, BRIEF_CHANNEL_TYPES);
            await db.update(guilds).set({briefChannel: channel.id}).where(eq(guilds.guildId, interaction.guild.id));
            await interaction.reply({content: `Set the mission brief channel to <#${channel.id}>.`});
        }
    },
});
