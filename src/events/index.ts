import type { ClientEvents } from 'discord.js';
import type { SunClient } from '../client';
import type { Event } from '../types/commands';
import clientReady from './clientReady';
import guildCreate from './guildCreate';
import guildDelete from './guildDelete';
import guildMemberAdd from './guildMemberAdd';
import interactionCreate from './interactionCreate';

export const events: Event[] = [clientReady, guildCreate, guildDelete, guildMemberAdd, interactionCreate];

function registerEvent<K extends keyof ClientEvents>(client: SunClient, event: Event<K>): void {
    const listener = (...args: ClientEvents[K]): void => {
        Promise.resolve(event.execute(...args)).catch((error: unknown) => {
            console.error(`[${event.name}] Event handler failed:`, error);
        });
    };

    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);

    console.log('[INFO] Event loaded: ' + event.name);
}

export function registerEvents(client: SunClient, eventList: readonly Event[]): void {
    for (const event of eventList) registerEvent(client, event);
}
