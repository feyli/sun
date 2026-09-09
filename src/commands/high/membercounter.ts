import { ChannelType, PermissionFlagsBits, SlashCommandBuilder, type APIEmbed } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

const STYLE_VARIABLES = ['{fullLength}', '{thousandLength}', '{fullLength.space}', '{fullLength.comma}'];

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('membercounter')
            .setDescription('Member counter-related commands.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
            .addSubcommand((sub) => sub.setName('enable').setDescription('Enables the member counter.'))
            .addSubcommand((sub) => sub.setName('disable').setDescription('Disables the member counter.'))
            .addSubcommand((sub) =>
                sub
                    .setName('rename')
                    .setDescription('Sets the name of the member counter.')
                    .addStringOption((option) => option.setName('name').setDescription('The name of the channel.').setRequired(true).setMaxLength(75)),
            )
            .addSubcommand((sub) => sub.setName('help').setDescription('Displays help for the member counter.')),
    ),
    category: 'System Management',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const db = interaction.client.db;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'help') {
            const embed: APIEmbed = {
                title: 'Member Counter Help',
                description: 'The counter will be updated every 15 minutes (due to Discord limitations). It supports the following variables:',
                fields: [
                    {name: '`{fullLength}`', value: 'The full length of the counter (e.g. 128 544).', inline: true},
                    {name: '`{thousandLength}`', value: 'The length of the counter, showing only per thousands (e.g. 128k).', inline: true},
                    {name: '`.comma`', value: 'Use a comma to separate thousands (e.g. 128,544).', inline: true},
                    {name: '`.space`', value: 'Use a space to separate thousands (e.g. 128 544).', inline: true},
                ],
            };
            return interaction.editReply({embeds: [embed]});
        }

        const [row] = await db.select({memberCounterChannelId: guilds.memberCounterChannelId}).from(guilds).where(eq(guilds.guildId, interaction.guild.id));
        const dbChannelId = row?.memberCounterChannelId ?? null;
        let counterChannel = dbChannelId ? interaction.guild.channels.cache.get(dbChannelId) : undefined;

        if (subcommand === 'enable') {
            const humanCount = interaction.guild.members.cache.filter((member) => !member.user.bot).size;
            if (counterChannel) {
                const position = counterChannel.isThread() ? 'unknown' : counterChannel.position + 1;
                return interaction.editReply(`The member counter is already enabled (${counterChannel}) and is at position ${position} (voice channels only).`);
            }

            const channel = await interaction.guild.channels.create({
                name: 'Members: ' + humanCount,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [{id: interaction.guild.id, deny: [PermissionFlagsBits.Connect]}],
            });
            db.update(guilds).set({memberCounterChannelId: channel.id}).where(eq(guilds.guildId, interaction.guild.id)).catch(console.error);
            await interaction.editReply(`${channel} has been created and will now update every 15 minutes.`);
        }

        if (subcommand === 'disable') {
            if (!dbChannelId) return interaction.editReply('No member counter has been set up in this server!');
            db.update(guilds)
                .set({memberCounterChannelId: null, memberCounterStyle: null})
                .where(eq(guilds.guildId, interaction.guild.id))
                .catch(console.error);
            if (counterChannel) counterChannel.delete().catch(console.error);
            await interaction.editReply('Member counter has been disabled!');
        }

        if (subcommand === 'rename') {
            if (!dbChannelId) return interaction.editReply('No member counter has been set up in this server!');
            const name = interaction.options.getString('name', true);
            if (!STYLE_VARIABLES.some((variable) => name.includes(variable))) return interaction.editReply('The name must include `{fullLength}` or `{thousandLength}`.');
            db.update(guilds).set({memberCounterStyle: name}).where(eq(guilds.guildId, interaction.guild.id)).catch(console.error);

            if (!counterChannel) {
                counterChannel = await interaction.guild.channels.create({
                    name: 'Members: ' + interaction.guild.memberCount,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [{id: interaction.guild.id, deny: [PermissionFlagsBits.Connect]}],
                });
                db.update(guilds).set({memberCounterChannelId: counterChannel.id}).where(eq(guilds.guildId, interaction.guild.id)).catch(console.error);
            }
            await interaction.editReply(
                `The member counter style has been set to \`${name}\` and the channel will soon be updated (remember that due to Discord limitations, counters are updated every 15 minutes).`,
            );
        }
    },
});
