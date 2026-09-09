import { ApplicationCommandOptionType, type CommandInteractionOption, type TextBasedChannel } from 'discord.js';

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
