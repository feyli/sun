import { ApplicationCommandOptionType, MessageFlags, type CommandInteractionOption, type Interaction, type RepliableInteraction, type TextBasedChannel } from 'discord.js';

const UNKNOWN_ERROR_MESSAGE = 'An unknown error has occurred. If this keeps happening, please contact the dev.';

/** A short label identifying what the user was doing, for log lines. */
export function describeInteraction(interaction: Interaction): string {
    if (interaction.isCommand() || interaction.isAutocomplete()) return `/${interaction.commandName}`;
    // Everything else is a component or a modal, and is identified by its custom ID.
    return interaction.customId;
}

/**
 * Logs `error` and tells the user something went wrong. Deliberately never throws: the
 * interaction may already be unusable (expired token, deleted message), and losing the
 * original error to a secondary failure would be worse than the user seeing nothing.
 */
export async function reportInteractionError(interaction: RepliableInteraction, error: unknown): Promise<void> {
    console.error(`[ERROR] ${describeInteraction(interaction)} failed for ${interaction.user.username} (${interaction.user.id}):`, error);

    try {
        const body = {content: UNKNOWN_ERROR_MESSAGE, flags: MessageFlags.Ephemeral} as const;
        // A handler that already answered can only be appended to, not replied to again.
        if (interaction.replied || interaction.deferred) await interaction.followUp(body);
        else await interaction.reply(body);
    } catch (notifyError) {
        console.error('[ERROR] Could not notify the user that their interaction failed:', notifyError);
    }
}

/**
 * Returns the "leaf" options of an interaction, i.e. the options of the invoked subcommand
 * (or subcommand group's subcommand) rather than the subcommand entries themselves.
 */
export function hoistOptions(options: readonly CommandInteractionOption[]): readonly CommandInteractionOption[] {
    const first = options[0];
    if (first?.type === ApplicationCommandOptionType.SubcommandGroup) return hoistOptions(first.options ?? []);
    if (first?.type === ApplicationCommandOptionType.Subcommand) return first.options ?? [];
    return options;
}

/** The channel name, or `null` for channels without one (DMs). */
export function getChannelName(channel: TextBasedChannel | null): string | null {
    return channel && 'name' in channel ? channel.name : null;
}
