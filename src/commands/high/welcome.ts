import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

const WELCOME_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread] as const;

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('welcome')
            .setDescription('Welcome system-related commands')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addSubcommand((sub) =>
                sub
                    .setName('enable')
                    .setDescription('Enables the welcome system.')
                    .addChannelOption((option) =>
                        option.setName('channel').setDescription('The channel to send the welcome message in.').setRequired(true).addChannelTypes(...WELCOME_CHANNEL_TYPES),
                    ),
            )
            .addSubcommand((sub) => sub.setName('disable').setDescription('Disables the welcome system.'))
            .addSubcommand((sub) =>
                sub
                    .setName('setmessage')
                    .setDescription('Sets the welcome message.')
                    .addStringOption((option) => option.setName('message').setDescription('The message to send when a user joins.').setRequired(true).setMaxLength(2000)),
            )
            .addSubcommand((sub) => sub.setName('help').setDescription('Displays further detail regarding variable usage.')),
    ),
    category: 'System Management',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const db = interaction.client.db;

        const [row] = await db.select({welcomeChannelId: guilds.welcomeChannelId}).from(guilds).where(eq(guilds.guildId, interaction.guild.id));
        const welcomeChannelId = row?.welcomeChannelId ?? null;

        if (subcommand === 'enable') {
            const channel = interaction.options.getChannel('channel', true, WELCOME_CHANNEL_TYPES);
            const me = interaction.guild.members.me;
            const permissions = me ? channel.permissionsFor(me) : null;
            if (!permissions?.has(PermissionFlagsBits.SendMessages)) return interaction.editReply('I do not have permission to send messages in that channel.');
            if (!permissions.has(PermissionFlagsBits.ViewChannel)) return interaction.editReply('I do not have permission to view that channel.');

            await db.update(guilds).set({welcomeChannelId: channel.id}).where(eq(guilds.guildId, interaction.guild.id));
            await interaction.editReply(`Successfully enabled the welcome system in ${channel}.`);
        } else if (subcommand === 'disable') {
            if (!welcomeChannelId) return interaction.editReply('The welcome system is already disabled.');

            await db.update(guilds).set({welcomeChannelId: null, welcomeMessage: null}).where(eq(guilds.guildId, interaction.guild.id));
            await interaction.editReply('Successfully disabled the welcome system.');
        } else if (subcommand === 'setmessage') {
            if (!welcomeChannelId) return interaction.editReply('The welcome system is disabled. Enable it with `/welcome enable`.');

            const message = interaction.options.getString('message', true);
            await db.update(guilds).set({welcomeMessage: message}).where(eq(guilds.guildId, interaction.guild.id));
            await interaction.editReply('Successfully set the welcome message.');
        } else if (subcommand === 'help') {
            const embed: APIEmbed = {
                title: 'Welcome System Help',
                description: 'The welcome system allows you to send a message when a user joins your server. You can use the following variables in your message:',
                fields: [
                    {name: '`{userMention}`', value: "The user's mention.", inline: true},
                    {name: '`{userTag}`', value: "The user's tag.", inline: true},
                    {name: '`{userUsername}`', value: "The user's username.", inline: true},
                    {name: '`{serverName}`', value: "The server's name.", inline: true},
                    {name: '`{memberCount}`', value: 'The number of human members in the server.', inline: true},
                ],
                footer: {text: 'Note: You can use the /welcome setmessage command to set the welcome message.'},
            };

            await interaction.editReply({embeds: [embed]});
        }
    },
});
