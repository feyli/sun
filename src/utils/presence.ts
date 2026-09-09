import { ActivityType, type PresenceData } from 'discord.js';

export function watchingServers(count: number): PresenceData {
    return {
        activities: [
            {
                type: ActivityType.Watching,
                name: `${count} servers`,
            },
        ],
    };
}
