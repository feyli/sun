import { MessageFlags, PermissionFlagsBits, type APIEmbed, type ButtonInteraction, type ChatInputCommandInteraction, type Guild, type Snowflake } from 'discord.js';
import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { guilds, type MissionBrief } from '../db/schema';

export async function getMissionBrief(db: Database, guildId: Snowflake): Promise<MissionBrief | null> {
    const [row] = await db.select({missionBrief: guilds.missionBrief}).from(guilds).where(eq(guilds.guildId, guildId));
    return row?.missionBrief ?? null;
}

export function buildBriefEmbed(brief: MissionBrief, guild: Guild): APIEmbed {
    return {
        title: brief.title ?? undefined,
        description: brief.description ?? undefined,
        author: {name: 'Campagne War Thunder', icon_url: guild.iconURL() ?? undefined},
        footer: {text: 'Briefing de mission'},
    };
}

/** Sends the saved mission brief to the configured brief channel (shared by `/brief send` and the "Send Mission Brief" button). */
export async function sendMissionBrief(interaction: ChatInputCommandInteraction<'cached'> | ButtonInteraction<'cached'>): Promise<unknown> {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral});
    }

    await interaction.deferReply({flags: MessageFlags.Ephemeral});

    const [row] = await interaction.client.db
        .select({briefChannel: guilds.briefChannel, missionBrief: guilds.missionBrief})
        .from(guilds)
        .where(eq(guilds.guildId, interaction.guild.id));

    const briefChannelId = row?.briefChannel;
    if (!briefChannelId) return interaction.editReply('The mission brief channel has not been set.');

    const channel = interaction.guild.channels.cache.get(briefChannelId);
    if (!channel?.isSendable()) {
        return interaction.editReply("The mission brief channel has been deleted. You'll have to set a new one.");
    }

    const brief = row.missionBrief;
    if (!brief) return interaction.editReply('There is no mission brief to send. Please set one first.');

    await channel.send({embeds: [buildBriefEmbed(brief, interaction.guild)]});
    await interaction.editReply(':airplane_small: | Mission brief __sent__.');
}
