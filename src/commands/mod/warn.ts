import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder, type APIEmbed, type APIEmbedField } from 'discord.js';
import { and, count, desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { warns, type NewWarn } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

const WARN_ID_LENGTH = 25;
const CONFIRMATION_TEXT = 'I CONFIRM';
const RESET_TIMEOUT_MS = 30_000;

/** Discord's `<t:...>` markup takes whole seconds since the epoch. */
const toUnixSeconds = (date: Date): number => Math.floor(date.getTime() / 1000);

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Set of commands for warns.')
            .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
            .addSubcommand((sub) =>
                sub
                    .setName('add')
                    .setDescription('Add a warn to a user.')
                    .addUserOption((option) => option.setName('user').setDescription('The user to warn.').setRequired(true))
                    .addStringOption((option) => option.setName('title').setDescription('The reason title of the warn.').setRequired(true).setMaxLength(200))
                    .addStringOption((option) => option.setName('description').setDescription('A description to include in the warn.').setMaxLength(5000)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('remove')
                    .setDescription('Remove a warn from a user.')
                    .addStringOption((option) =>
                        option.setName('warn_id').setDescription('The warn ID to remove.').setRequired(true).setMinLength(WARN_ID_LENGTH).setMaxLength(WARN_ID_LENGTH),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('clean')
                    .setDescription('Clear all warns of a user.')
                    .addUserOption((option) => option.setName('user').setDescription('The user to clear warns of.').setRequired(true)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('list')
                    .setDescription('List all warns of a user.')
                    .addUserOption((option) => option.setName('user').setDescription('The user to list warns of.').setRequired(true)),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('info')
                    .setDescription('Get info about a warn.')
                    .addStringOption((option) =>
                        option.setName('warn_id').setDescription('The warn ID to get info about.').setRequired(true).setMinLength(WARN_ID_LENGTH).setMaxLength(WARN_ID_LENGTH),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('edit')
                    .setDescription('Edit a warn.')
                    .addStringOption((option) =>
                        option.setName('warn_id').setDescription('The ID of the warn to edit.').setRequired(true).setMinLength(WARN_ID_LENGTH).setMaxLength(WARN_ID_LENGTH),
                    )
                    .addStringOption((option) => option.setName('title').setDescription('The new title of the warn.').setMaxLength(200))
                    .addStringOption((option) => option.setName('description').setDescription('The new description of the warn.').setMaxLength(5000))
                    .addBooleanOption((option) => option.setName('remove_description').setDescription('Remove the description of the warn.')),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('leaderboard')
                    .setDescription('Get a leaderboard of people with most warns in the server (not really useful, but fun).')
                    .addIntegerOption((option) =>
                        option.setName('limit').setDescription('The maximum number of people to show in the leaderboard.').setMinValue(1).setMaxValue(15),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName('reset')
                    .setDescription('Reset the warn system on your server. Be careful, this action is irreversible.')
                    .addStringOption((option) =>
                        option
                            .setName('confirm')
                            .setDescription(`Enter "${CONFIRMATION_TEXT}" to proceed.`)
                            .setRequired(true)
                            .setMinLength(CONFIRMATION_TEXT.length)
                            .setMaxLength(CONFIRMATION_TEXT.length),
                    ),
            ),
    ),
    cooldown: 1000,
    category: 'Moderation',
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();
        const db = interaction.client.db;
        const guild = interaction.guild;

        const requesterFooter = {text: interaction.user.username, icon_url: interaction.user.displayAvatarURL()};

        switch (interaction.options.getSubcommand()) {
            case 'add': {
                const user = interaction.options.getUser('user', true);
                const member = guild.members.cache.get(user.id);
                if (user.bot) return interaction.editReply({content: "You can't warn a bot."});
                if (!member) return interaction.editReply({content: 'This user is not in this server.'});
                if (!member.manageable) return interaction.editReply({content: "I can't warn this user. My highest role is not prior to this member's."});
                if (member.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.editReply({content: "You can't warn this user. Your highest role is not prior to this member's."});
                }
                const title = interaction.options.getString('title', true);
                const description = interaction.options.getString('description');

                let warnId = nanoid(WARN_ID_LENGTH);
                const [existing] = await db.select({warnId: warns.warnId}).from(warns).where(eq(warns.warnId, warnId));
                if (existing) warnId = nanoid(WARN_ID_LENGTH);

                await db.insert(warns).values({
                    warnId,
                    userId: user.id,
                    guildId: guild.id,
                    reasonTitle: title,
                    reasonDescription: description,
                    creatorId: interaction.user.id,
                });

                const fields: APIEmbedField[] = [
                    {name: 'Title', value: title, inline: true},
                    {name: 'Description', value: description || 'No description provided.', inline: true},
                    {name: 'Warn ID', value: warnId, inline: true},
                ];
                const interactionEmbed: APIEmbed = {
                    title: `Warned ${user.username}!`,
                    footer: requesterFooter,
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                    fields,
                };
                const dmEmbed: APIEmbed = {
                    title: `You have been warned in **${guild.name}**!`,
                    footer: {text: guild.name, icon_url: guild.iconURL() ?? undefined},
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                    fields,
                };

                await interaction.editReply({embeds: [interactionEmbed]});
                await user.send({embeds: [dmEmbed]}).catch(() => {
                    interaction.channel?.send({content: `I couldn't send a DM to ${user}.`}).catch(console.error);
                });
                break;
            }
            case 'remove': {
                const givenId = interaction.options.getString('warn_id', true);
                const [warn] = await db
                    .select({userId: warns.userId, guildId: warns.guildId, reasonTitle: warns.reasonTitle})
                    .from(warns)
                    .where(eq(warns.warnId, givenId));

                if (!warn || warn.guildId !== guild.id) return interaction.editReply({content: 'This warn ID does not exist.'});

                await db.delete(warns).where(eq(warns.warnId, givenId));

                const embed: APIEmbed = {
                    title: 'Warn succesfully deleted',
                    fields: [
                        {name: 'Reason of the warn (title)', value: warn.reasonTitle},
                        {name: 'Warned user', value: `<@${warn.userId}>`},
                        {name: 'Warn ID', value: givenId},
                    ],
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
            case 'clean': {
                const user = interaction.options.getUser('user', true);
                const member = guild.members.cache.get(user.id);
                if (user.bot) return interaction.editReply({content: 'You cannot warn a bot. Why would you clear its warns?'});
                if (!member) return interaction.editReply({content: 'This user is not in this server.'});
                if (member.roles.highest.position >= interaction.member.roles.highest.position && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.editReply({content: "You can't warn this user. Your highest role is not prior to this member's."});
                }

                const existingWarns = await db
                    .select({warnId: warns.warnId})
                    .from(warns)
                    .where(and(eq(warns.userId, user.id), eq(warns.guildId, guild.id)));
                if (existingWarns.length === 0) return interaction.editReply({content: 'This user has no warns (at least on this server).'});
                await db.delete(warns).where(and(eq(warns.userId, user.id), eq(warns.guildId, guild.id)));

                const embed: APIEmbed = {
                    title: `Cleared ${existingWarns.length} warns of ${user.username}!`,
                    footer: requesterFooter,
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
            case 'list': {
                const user = interaction.options.getUser('user', true);

                const userWarns = await db
                    .select({warnId: warns.warnId, reasonDescription: warns.reasonDescription, reasonTitle: warns.reasonTitle, timestamp: warns.timestamp})
                    .from(warns)
                    .where(and(eq(warns.userId, user.id), eq(warns.guildId, guild.id)))
                    .orderBy(desc(warns.timestamp));
                if (userWarns.length === 0) return interaction.editReply({content: 'This user has no warns (at least on this server).'});

                const embed: APIEmbed = {
                    title: `Warns of ${user.username}`,
                    footer: requesterFooter,
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                    fields: userWarns.map((warn) => {
                        const seconds = toUnixSeconds(warn.timestamp);
                        return {
                            name: `Warn ID: \`${warn.warnId}\``,
                            value: `Title: ${warn.reasonTitle}${warn.reasonDescription ? `\nDescription: ${warn.reasonDescription}` : ''}\nDate and time: <t:${seconds}:d> <t:${seconds}:T>`,
                        };
                    }),
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
            case 'info': {
                const givenId = interaction.options.getString('warn_id', true);
                const [warn] = await db.select().from(warns).where(eq(warns.warnId, givenId));
                if (!warn || warn.guildId !== guild.id) return interaction.editReply({content: 'This warn ID does not exist.'});
                const seconds = toUnixSeconds(warn.timestamp);

                const embed: APIEmbed = {
                    title: `Warn ID: \`${warn.warnId}\``,
                    footer: requesterFooter,
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                    fields: [
                        {name: 'Warned user', value: `<@${warn.userId}> (\`${warn.userId}\`)`, inline: true},
                        {name: 'Warned by', value: `<@${warn.creatorId}> (\`${warn.creatorId}\`)`, inline: true},
                        {name: 'Reason (title)', value: warn.reasonTitle, inline: true},
                        {name: 'Reason (description)', value: warn.reasonDescription || 'No description provided.', inline: true},
                        {name: 'Date and time', value: `<t:${seconds}:d> <t:${seconds}:T> (\`${seconds}\`)`, inline: true},
                        {name: 'Guild ID', value: `\`${warn.guildId}\``, inline: true},
                    ],
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
            case 'edit': {
                const givenId = interaction.options.getString('warn_id', true);
                const [warn] = await db.select({guildId: warns.guildId}).from(warns).where(eq(warns.warnId, givenId));
                if (!warn || warn.guildId !== guild.id) return interaction.editReply({content: 'This warn ID does not exist.'});

                const newTitle = interaction.options.getString('title');
                const newDescription = interaction.options.getString('description');
                const removeDescription = interaction.options.getBoolean('remove_description');

                if (!newTitle && !newDescription && !removeDescription) return interaction.editReply({content: 'You must edit at least one thing.'});
                if (removeDescription && newDescription) {
                    return interaction.editReply({
                        content:
                            'You cannot **set a new description** and **remove the description** at the same time.\nTo **set a new description** (and __replace__ the old one), set `remove_description` to **False**.',
                    });
                }

                const changes: Partial<NewWarn> = {};
                if (newTitle) changes.reasonTitle = newTitle;
                if (removeDescription) changes.reasonDescription = null;
                else if (newDescription) changes.reasonDescription = newDescription;

                await db.update(warns).set(changes).where(eq(warns.warnId, givenId));

                const fields: APIEmbedField[] = [];
                if (newTitle) fields.push({name: 'New title', value: newTitle});
                if (newDescription) fields.push({name: 'New description', value: newDescription});
                if (removeDescription) fields.push({name: 'Description removed', value: 'Yes'});

                const embed: APIEmbed = {
                    title: `Warn ID: \`${givenId}\``,
                    footer: requesterFooter,
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                    fields,
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
            case 'leaderboard': {
                const leaderboard = await db
                    .select({userId: warns.userId, total: count()})
                    .from(warns)
                    .where(eq(warns.guildId, guild.id))
                    .groupBy(warns.userId)
                    .orderBy(desc(count()))
                    .limit(interaction.options.getInteger('limit') ?? 10);
                if (leaderboard.length === 0) return interaction.editReply({content: 'There are no warns in this server.'});

                const embed: APIEmbed = {
                    title: ':trophy: **Warn Leaderboard** :trophy:',
                    footer: requesterFooter,
                    timestamp: new Date().toISOString(),
                    color: 0x000000,
                    fields: leaderboard.map((entry, index) => ({
                        name: `**Top ${index + 1}**`,
                        value: `${guild.members.cache.get(entry.userId)?.toString() ?? '`' + entry.userId + '`'} with ${entry.total} warn${entry.total === 1 ? '' : 's'}`,
                    })),
                };

                await interaction.editReply({embeds: [embed]});
                break;
            }
            case 'reset': {
                if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.editReply({
                        embeds: [{title: 'Missing Permission', description: 'You are missing the `ADMINISTRATOR` permission.', color: 0xf26448}],
                    });
                }
                const confirmation = interaction.options.getString('confirm', true);
                if (confirmation !== CONFIRMATION_TEXT) return interaction.editReply({content: `You must enter \`${CONFIRMATION_TEXT}\` in the dedicated option to proceed.`});

                const expiresAt = Math.floor((Date.now() + RESET_TIMEOUT_MS) / 1000);
                await interaction.editReply({
                    embeds: [
                        {
                            title: 'Are you sure?',
                            description: `This action is **irreversible**. All warns will be deleted from the database and **cannot be recovered**.\n\nIf you are sure, click the button below.\nThis will expire <t:${expiresAt}:R>.`,
                            color: 0xff0000,
                            footer: requesterFooter,
                            timestamp: new Date().toISOString(),
                        },
                    ],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().setComponents(
                            new ButtonBuilder().setCustomId('reset_warns_yes').setLabel('Yes, I am sure').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('reset_warns_no').setLabel('No, I want to cancel').setStyle(ButtonStyle.Success),
                        ),
                    ],
                });

                // Expire the confirmation if no button has been clicked in time.
                setTimeout(() => {
                    void (async () => {
                        try {
                            const reply = await interaction.fetchReply();
                            if (reply.embeds[0]?.title !== 'Are you sure?') return;
                            await interaction.editReply({
                                embeds: [{title: 'Operation Cancelled', description: 'The operation expired (30 seconds passed).', color: 0xf26440}],
                                components: [],
                            });
                        } catch (error) {
                            console.error(error);
                        }
                    })();
                }, RESET_TIMEOUT_MS);
                break;
            }
        }
    },
});
