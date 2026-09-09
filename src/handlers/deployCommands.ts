import {
    REST, Routes, type APIApplicationCommand, type Collection, type RESTPutAPIApplicationCommandsResult, type RESTPostAPIApplicationGuildCommandsJSONBody,
    type RESTPutAPIApplicationGuildCommandsResult, type Snowflake
} from 'discord.js';
import type { SunClient } from '../client';
import { config } from '../config';
import type { Command } from '../types/commands';

/**
 * Guild commands are always installed to that guild and usable only there, so Discord's
 * guild route rejects the `contexts`, `integration_types` and `dm_permission` fields.
 */
function toGuildPayload(command: Command): RESTPostAPIApplicationGuildCommandsJSONBody {
    const {contexts, integration_types, dm_permission, ...body} = command.data;
    return body;
}

/** Stores the IDs Discord assigned to the deployed commands (used for `</command:id>` mentions in `/help`). */
function assignCommandIds(commands: Collection<string, Command>, deployed: readonly APIApplicationCommand[]): void {
    for (const command of commands.values()) {
        command.id = deployed.find((deployedCommand) => deployedCommand.name === command.data.name)?.id;
    }
}

/** Deploys global commands, then the commands restricted to specific guilds. */
export async function deployCommands(client: SunClient): Promise<void> {
    const rest = new REST({version: '10'}).setToken(config.client.token);

    try {
        console.log(`Started refreshing ${client.commands.size} application (/) commands.`);

        const globalCommands = client.commands.filter((command) => !command.guildId);
        const globalResult = (await rest.put(Routes.applicationCommands(config.client.id), {
            body: globalCommands.map((command) => command.data),
        })) as RESTPutAPIApplicationCommandsResult;
        assignCommandIds(globalCommands, globalResult);
        console.log('Successfully updated command IDs.');

        let deployedCount = globalResult.length;

        const guildIds = new Set<Snowflake>();
        for (const command of client.commands.values()) {
            if (command.guildId) guildIds.add(command.guildId);
        }

        for (const guildId of guildIds) {
            const guildCommands = client.commands.filter((command) => command.guildId === guildId);
            const guildResult = (await rest.put(Routes.applicationGuildCommands(config.client.id, guildId), {
                body: guildCommands.map(toGuildPayload),
            })) as RESTPutAPIApplicationGuildCommandsResult;
            assignCommandIds(guildCommands, guildResult);
            console.log(`Successfully updated command IDs for guild ${guildId}.`);

            deployedCount += guildResult.length;
        }

        console.log(`Successfully reloaded ${deployedCount} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}
