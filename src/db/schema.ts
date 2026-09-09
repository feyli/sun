import { sql } from 'drizzle-orm';
import { boolean, check, foreignKey, index, integer, jsonb, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

/** Discord snowflakes are at most 20 digits; 30 leaves headroom and matches the original schema. */
const SNOWFLAKE_LENGTH = 30;

/** JSON document stored in `guilds.mission_brief`. */
export interface MissionBrief {
    title?: string | null;
    description?: string | null;
}

/** One entry of the serialized `interaction.options.data` array stored in `command_logs.options`. */
export interface CommandLogOption {
    name: string;
    type: number;
    value?: string | number | boolean;
    options?: CommandLogOption[];

    [key: string]: unknown;
}

export const deploymentStatus = pgEnum('deployment_status', ['DEV', 'STABLE', 'OUT']);

export const commands = pgTable(
    'commands',
    {
        id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
        type: integer('type').notNull(),
        deploymentStatus: deploymentStatus('deployment_status').notNull().default('STABLE'),
        createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
        name: text('name'),
        description: text('description'),
    },
    (table) => [check('type_value', sql`${table.type} >= 1 AND
    ${table.type}
    <=
    4`)],
);

export const guilds = pgTable(
    'guilds',
    {
        guildId: varchar('guild_id', {length: SNOWFLAKE_LENGTH}).primaryKey(),
        memberCounterChannelId: varchar('member_counter_channel_id', {length: SNOWFLAKE_LENGTH}),
        memberCounterStyle: text('member_counter_style'),
        welcomeChannelId: varchar('welcome_channel_id', {length: SNOWFLAKE_LENGTH}),
        welcomeMessage: varchar('welcome_message', {length: 2000}),
        missionBrief: jsonb('mission_brief').$type<MissionBrief>(),
        briefChannel: varchar('brief_channel', {length: SNOWFLAKE_LENGTH}),
        confessionChannelId: varchar('confession_channel_id', {length: SNOWFLAKE_LENGTH}),
    },
    // The member counter task scans for rows where this is set.
    (table) => [index('guilds_member_counter_channel_id_idx').on(table.memberCounterChannelId)],
);

export const mcstatus = pgTable(
    'mcstatus',
    {
        guildId: varchar('guild_id', {length: SNOWFLAKE_LENGTH}).primaryKey(),
        address: varchar('address', {length: 45}),
        port: integer('port').default(25565),
        counterChannelId: varchar('counter_channel_id', {length: SNOWFLAKE_LENGTH}),
        counterStyle: text('counter_style'),
    },
    (table) => [
        // The Minecraft counter task scans for rows where this is set.
        index('mcstatus_counter_channel_id_idx').on(table.counterChannelId),
        check('mcstatus_port_range', sql`${table.port} BETWEEN 0 AND 65535`),
    ],
);

export const warns = pgTable(
    'warns',
    {
        warnId: varchar('warn_id', {length: 25}).primaryKey(),
        userId: varchar('user_id', {length: SNOWFLAKE_LENGTH}).notNull(),
        guildId: varchar('guild_id', {length: SNOWFLAKE_LENGTH}).notNull(),
        timestamp: timestamp('timestamp', {withTimezone: true}).notNull().defaultNow(),
        reasonTitle: text('reason_title').notNull(),
        reasonDescription: text('reason_description'),
        creatorId: varchar('creator_id', {length: SNOWFLAKE_LENGTH}).notNull(),
    },
    // Every warn lookup is scoped to a guild, most also to a user.
    (table) => [index('warns_guild_id_user_id_idx').on(table.guildId, table.userId)],
);

export const commandLogs = pgTable(
    'command_logs',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        timestamp: timestamp('timestamp', {withTimezone: true}).notNull().defaultNow(),
        interactionToken: text('interaction_token').notNull(),
        commandId: integer('command_id'),
        userId: varchar('user_id', {length: SNOWFLAKE_LENGTH}).notNull(),
        userUsername: varchar('user_username', {length: 32}).notNull(),
        guildId: varchar('guild_id', {length: SNOWFLAKE_LENGTH}),
        guildName: varchar('guild_name', {length: 100}),
        channelId: varchar('channel_id', {length: SNOWFLAKE_LENGTH}),
        channelName: varchar('channel_name', {length: 100}),
        commandName: text('command_name').notNull(),
        options: jsonb('options').$type<CommandLogOption[]>(),
        dm: boolean('dm').notNull(),
        locale: varchar('locale', {length: 10}).notNull(),
    },
    (table) => [
        // Named explicitly to keep the constraint name the database already uses.
        foreignKey({name: 'command_logs_commands_id_fk', columns: [table.commandId], foreignColumns: [commands.id]})
            .onDelete('set null')
            .onUpdate('restrict'),
        index('command_logs_command_id_idx').on(table.commandId),
        index('command_logs_timestamp_idx').on(table.timestamp.desc()),
    ],
);

export type Guild = typeof guilds.$inferSelect;
export type McStatus = typeof mcstatus.$inferSelect;
export type Warn = typeof warns.$inferSelect;
export type NewWarn = typeof warns.$inferInsert;
export type Command = typeof commands.$inferSelect;
export type CommandLog = typeof commandLogs.$inferSelect;
export type NewCommandLog = typeof commandLogs.$inferInsert;
