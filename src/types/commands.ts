import { MessageFlags } from 'discord.js';
import type {
    ApplicationCommandType,
    AutocompleteInteraction,
    ButtonInteraction,
    CacheType,
    ChatInputCommandInteraction,
    ClientEvents,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    RepliableInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
    Snowflake,
    UserContextMenuCommandInteraction,
} from 'discord.js';

const GUILD_ONLY_MESSAGE = 'This command can only be used in a server.';

/**
 * Any builder that serializes to a chat-input command body. Declared structurally because
 * discord.js does not export the narrowed builder types its chained methods return, so
 * `SlashCommandBuilder` alone would reject a builder that has had options added to it.
 */
interface SlashCommandData {
    readonly name: string;

    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
}

/** Any builder that serializes to a context menu command body. */
interface ContextMenuData {
    readonly name: string;

    toJSON(): RESTPostAPIContextMenuApplicationCommandsJSONBody;
}

/** Narrows an interaction's cache type when the handler is declared guild-only. */
type Cache<GuildOnly extends boolean> = GuildOnly extends true ? 'cached' : CacheType;

/**
 * Runs `handler` only once the interaction is known to come from a cached guild,
 * replying with a notice otherwise. The cast is sound because `inCachedGuild()` is
 * discord.js's own type guard for exactly this narrowing.
 */
function guildGuard<Wide extends RepliableInteraction, Narrow extends Wide>(
    handler: (interaction: Narrow) => Promise<unknown>,
): (interaction: Wide) => Promise<unknown> {
    return async (interaction) =>
        interaction.inCachedGuild()
            ? handler(interaction as Narrow)
            : interaction.reply({content: GUILD_ONLY_MESSAGE, flags: MessageFlags.Ephemeral});
}

interface Shared {
    /** Category displayed by `/help`. */
    category?: string;
    /** Per-user cooldown in milliseconds. Omit or `0` for none. */
    cooldown?: number;
    /** Restricts the command to the bot owner. */
    ownerOnly?: boolean;
    /** Deploys to this guild only instead of globally. */
    guildId?: Snowflake;
}

// ---------------------------------------------------------------------------
// Application commands
// ---------------------------------------------------------------------------

interface CommandBase extends Shared {
    /** Discord's ID for the deployed command, filled in after deployment. */
    id?: Snowflake;
}

export interface SlashCommand extends CommandBase {
    kind: 'slash';
    data: RESTPostAPIChatInputApplicationCommandsJSONBody;

    execute(interaction: ChatInputCommandInteraction): Promise<unknown>;

    autocomplete?(interaction: AutocompleteInteraction): Promise<unknown>;
}

export interface MessageCommand extends CommandBase {
    kind: 'message';
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody & { type: ApplicationCommandType.Message };

    execute(interaction: MessageContextMenuCommandInteraction): Promise<unknown>;
}

export interface UserCommand extends CommandBase {
    kind: 'user';
    data: RESTPostAPIContextMenuApplicationCommandsJSONBody & { type: ApplicationCommandType.User };

    execute(interaction: UserContextMenuCommandInteraction): Promise<unknown>;
}

/** Any application command deployed to Discord. */
export type Command = SlashCommand | MessageCommand | UserCommand;

interface SlashInput<GuildOnly extends boolean> extends Shared {
    data: SlashCommandData;
    /** When true, the handler receives a cached-guild interaction and non-guild uses are rejected. */
    guildOnly?: GuildOnly;

    execute(interaction: ChatInputCommandInteraction<Cache<GuildOnly>>): Promise<unknown>;

    autocomplete?(interaction: AutocompleteInteraction): Promise<unknown>;
}

interface ContextInput<GuildOnly extends boolean, Interaction extends RepliableInteraction> extends Shared {
    data: ContextMenuData;
    guildOnly?: GuildOnly;

    execute(interaction: Interaction): Promise<unknown>;
}

export function defineSlashCommand<GuildOnly extends boolean = false>({data, guildOnly, execute, ...rest}: SlashInput<GuildOnly>): SlashCommand {
    return {
        kind: 'slash',
        ...rest,
        data: data.toJSON(),
        execute: guildOnly ? guildGuard(execute as (interaction: ChatInputCommandInteraction<'cached'>) => Promise<unknown>) : (execute as SlashCommand['execute']),
    };
}

export function defineMessageCommand<GuildOnly extends boolean = false>({
                                                                            data,
                                                                            guildOnly,
                                                                            execute,
                                                                            ...rest
                                                                        }: ContextInput<GuildOnly, MessageContextMenuCommandInteraction<Cache<GuildOnly>>>): MessageCommand {
    return {
        kind: 'message',
        ...rest,
        data: data.toJSON() as MessageCommand['data'],
        execute: guildOnly
            ? guildGuard(execute as (interaction: MessageContextMenuCommandInteraction<'cached'>) => Promise<unknown>)
            : (execute as MessageCommand['execute']),
    };
}

export function defineUserCommand<GuildOnly extends boolean = false>({
                                                                         data,
                                                                         guildOnly,
                                                                         execute,
                                                                         ...rest
                                                                     }: ContextInput<GuildOnly, UserContextMenuCommandInteraction<Cache<GuildOnly>>>): UserCommand {
    return {
        kind: 'user',
        ...rest,
        data: data.toJSON() as UserCommand['data'],
        execute: guildOnly
            ? guildGuard(execute as (interaction: UserContextMenuCommandInteraction<'cached'>) => Promise<unknown>)
            : (execute as UserCommand['execute']),
    };
}

// ---------------------------------------------------------------------------
// Message components and modals
// ---------------------------------------------------------------------------

export interface ButtonHandler {
    kind: 'button';
    customId: string;
    cooldown?: number;

    execute(interaction: ButtonInteraction): Promise<unknown>;
}

export interface ModalHandler {
    kind: 'modal';
    customId: string;
    cooldown?: number;

    execute(interaction: ModalSubmitInteraction): Promise<unknown>;
}

/** A handler for a button or modal, matched by its custom ID. */
export type ComponentHandler = ButtonHandler | ModalHandler;

interface ComponentInput<GuildOnly extends boolean, Interaction extends RepliableInteraction> {
    customId: string;
    cooldown?: number;
    guildOnly?: GuildOnly;

    execute(interaction: Interaction): Promise<unknown>;
}

export function defineButton<GuildOnly extends boolean = false>({
                                                                    guildOnly,
                                                                    execute,
                                                                    ...rest
                                                                }: ComponentInput<GuildOnly, ButtonInteraction<Cache<GuildOnly>>>): ButtonHandler {
    return {
        kind: 'button',
        ...rest,
        execute: guildOnly ? guildGuard(execute as (interaction: ButtonInteraction<'cached'>) => Promise<unknown>) : (execute as ButtonHandler['execute']),
    };
}

export function defineModal<GuildOnly extends boolean = false>({
                                                                   guildOnly,
                                                                   execute,
                                                                   ...rest
                                                               }: ComponentInput<GuildOnly, ModalSubmitInteraction<Cache<GuildOnly>>>): ModalHandler {
    return {
        kind: 'modal',
        ...rest,
        execute: guildOnly ? guildGuard(execute as (interaction: ModalSubmitInteraction<'cached'>) => Promise<unknown>) : (execute as ModalHandler['execute']),
    };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
    name: K;
    once?: boolean;

    execute(...args: ClientEvents[K]): Promise<unknown> | unknown;
}

export const defineEvent = <K extends keyof ClientEvents>(event: Event<K>): Event<K> => event;
