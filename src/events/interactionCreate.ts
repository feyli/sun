import {
    Events,
    MessageFlags,
    type ButtonInteraction,
    type ChatInputCommandInteraction,
    type Client,
    type ContextMenuCommandInteraction,
    type InteractionReplyOptions,
    type ModalSubmitInteraction,
    type Snowflake,
    type User,
} from 'discord.js';
import { commandLogs, type CommandLogOption } from '../db/schema';
import { config } from '../config';
import { defineEvent } from '../types/commands';
import { getChannelName, hoistOptions } from '../utils/interactions';

const IN_DEVELOPMENT_MESSAGE = 'This command is in development phase!';

/** The subset of a repliable interaction needed to enforce cooldowns. */
interface CooldownInteraction {
    user: User;
    client: Client;

    reply(options: InteractionReplyOptions): Promise<unknown>;
}

/**
 * Applies the per-user cooldown of a command or component. Returns `false` (after replying)
 * when the user has to wait. The bot owner is never rate limited.
 */
async function passesCooldown(interaction: CooldownInteraction, identifier: string, cooldown: number): Promise<boolean> {
    if (cooldown <= 0 || interaction.user.id === config.users.owner) return true;

    const usersOnCooldown = interaction.client.cooldowns.ensure(identifier, () => new Set<Snowflake>());
    if (usersOnCooldown.has(interaction.user.id)) {
        await interaction.reply({
            content: 'You are on cooldown! This command has a cooldown of `' + cooldown / 1000 + 's`.',
            flags: MessageFlags.Ephemeral,
        });
        return false;
    }

    usersOnCooldown.add(interaction.user.id);
    setTimeout(() => usersOnCooldown.delete(interaction.user.id), cooldown);
    return true;
}

function logCommandUsage(interaction: ChatInputCommandInteraction): void {
    const name = interaction.commandName;
    const options = hoistOptions(interaction.options.data)
        .map((option) => `${option.name}:${option.value}`)
        .join(' ');
    console.log(
        `${interaction.user.username} (${interaction.user.id}) used ${name} in ${interaction.guild?.name ?? 'DMs'} (${interaction.guild?.id ?? interaction.user.username}). Full command: ${name} ${options}`,
    );

    // database logging
    interaction.client.db
        .insert(commandLogs)
        .values({
            interactionToken: interaction.token,
            userId: interaction.user.id,
            userUsername: interaction.user.username,
            guildId: interaction.guildId,
            guildName: interaction.guild?.name ?? null,
            channelId: interaction.channelId,
            channelName: getChannelName(interaction.channel),
            commandName: name,
            options: interaction.options.data.length > 0 ? (JSON.parse(JSON.stringify(interaction.options.data)) as CommandLogOption[]) : null,
            dm: !interaction.inGuild(),
            locale: interaction.locale,
        })
        .catch(console.error);
}

async function handleCommand(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction): Promise<unknown> {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return interaction.reply({content: IN_DEVELOPMENT_MESSAGE, flags: MessageFlags.Ephemeral});

    if (command.ownerOnly && interaction.user.id !== config.users.owner) {
        return interaction.reply({
            content: 'You do not have permission to use this command! (`owner-only command`)',
            flags: MessageFlags.Ephemeral,
        });
    }

    if (!(await passesCooldown(interaction, command.data.name, command.cooldown ?? 0))) return;

    if (interaction.isChatInputCommand()) {
        logCommandUsage(interaction);
        if (command.kind === 'slash') return command.execute(interaction);
    } else if (interaction.isMessageContextMenuCommand()) {
        if (command.kind === 'message') return command.execute(interaction);
    } else if (interaction.isUserContextMenuCommand()) {
        if (command.kind === 'user') return command.execute(interaction);
    }

    console.warn(`Command "${command.data.name}" was invoked through an interaction type it does not handle.`);
}

async function handleComponent(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<unknown> {
    const handler = interaction.client.components.get(interaction.customId);
    if (!handler) {
        // Modals without a registered handler are awaited by the command that opened them (`awaitModalSubmit`).
        if (interaction.isModalSubmit()) return;
        return interaction.reply({content: IN_DEVELOPMENT_MESSAGE, flags: MessageFlags.Ephemeral});
    }

    if (!(await passesCooldown(interaction, handler.customId, handler.cooldown ?? 0))) return;

    if (interaction.isButton()) {
        if (handler.kind === 'button') return handler.execute(interaction);
    } else if (handler.kind === 'modal') {
        return handler.execute(interaction);
    }

    console.warn(`Component "${handler.customId}" was invoked through an interaction type it does not handle.`);
}

export default defineEvent({
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (command?.kind !== 'slash' || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
            return;
        }

        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) return handleCommand(interaction);
        if (interaction.isButton() || interaction.isModalSubmit()) return handleComponent(interaction);

        // Other component types (select menus, ...) are not used by the bot.
        return interaction.reply({content: IN_DEVELOPMENT_MESSAGE, flags: MessageFlags.Ephemeral});
    },
});
