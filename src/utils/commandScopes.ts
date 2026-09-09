import { ApplicationIntegrationType, InteractionContextType } from 'discord.js';

/**
 * The slice of a command builder these helpers touch. Declared structurally because
 * discord.js does not export the narrowed builder types (`SlashCommandOptionsOnlyBuilder`
 * and friends) that its chained methods actually return.
 */
interface Scopable {
    setContexts(...contexts: InteractionContextType[]): unknown;

    setIntegrationTypes(...integrationTypes: ApplicationIntegrationType[]): unknown;
}

/** Installable to servers and user accounts, and usable in guilds, DMs and group DMs. */
export function anywhere<B extends Scopable>(builder: B): B {
    builder.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);
    builder.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel);
    return builder;
}

/** Installable to servers only, and usable only inside a guild. */
export function guildsOnly<B extends Scopable>(builder: B): B {
    builder.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
    builder.setContexts(InteractionContextType.Guild);
    return builder;
}
