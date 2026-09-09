import { PermissionFlagsBits, SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('status')
            .setDescription("Displays the bot's status.")
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addSubcommand((sub) => sub.setName('membercounter').setDescription('Displays the status of the member counter in this server.'))
            .addSubcommand((sub) => sub.setName('welcome').setDescription('Displays the status of the welcome system in this server.')),
    ),
    category: 'Bot',
    cooldown: 3000,
    guildOnly: true,
    async execute(interaction) {
        const db = interaction.client.db;

        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'membercounter') {
            const [row] = await db
                .select({channelId: guilds.memberCounterChannelId, style: guilds.memberCounterStyle})
                .from(guilds)
                .where(eq(guilds.guildId, interaction.guild.id));
            let dbChannelId = row?.channelId ?? null;
            const counterChannel = dbChannelId ? interaction.guild.channels.cache.get(dbChannelId) : undefined;

            if (dbChannelId && !counterChannel) {
                db.update(guilds)
                    .set({memberCounterChannelId: null, memberCounterStyle: null})
                    .where(eq(guilds.guildId, interaction.guild.id))
                    .catch(console.error);
                dbChannelId = null;
            }

            const embed: APIEmbed = {
                title: 'Member Counter Status',
                author: {name: interaction.guild.name, icon_url: interaction.guild.iconURL() ?? undefined},
                fields: [
                    {name: 'Enabled', value: dbChannelId ? 'Yes' : 'No', inline: true},
                    {name: 'Channel', value: counterChannel?.toString() ?? 'None', inline: true},
                    {
                        name: 'Channel Position',
                        value: counterChannel && !counterChannel.isThread() ? String(counterChannel.position + 1) : 'None',
                        inline: true,
                    },
                    {name: 'Channel ID', value: dbChannelId ?? 'None', inline: true},
                    {name: 'Custom Style', value: row?.style ?? 'None', inline: true},
                ],
            };
            await interaction.editReply({embeds: [embed]});
        }

        if (subcommand === 'welcome') {
            const [row] = await db
                .select({channelId: guilds.welcomeChannelId, message: guilds.welcomeMessage})
                .from(guilds)
                .where(eq(guilds.guildId, interaction.guild.id));
            let dbChannelId = row?.channelId ?? null;
            const welcomeChannel = dbChannelId ? interaction.guild.channels.cache.get(dbChannelId) : undefined;

            if (dbChannelId && !welcomeChannel) {
                db.update(guilds).set({welcomeChannelId: null}).where(eq(guilds.guildId, interaction.guild.id)).catch(console.error);
                dbChannelId = null;
            }

            const embed: APIEmbed = {
                title: 'Welcome System Status',
                author: {name: interaction.guild.name, icon_url: interaction.guild.iconURL() ?? undefined},
                fields: [
                    {name: 'Enabled', value: dbChannelId ? 'Yes' : 'No', inline: true},
                    {name: 'Channel', value: welcomeChannel?.toString() ?? 'None', inline: true},
                    {name: 'Channel ID', value: dbChannelId ?? 'None', inline: true},
                    {name: 'Custom Message', value: row?.message ?? 'None', inline: true},
                ],
            };

            await interaction.editReply({embeds: [embed]});
        }
    },
});
