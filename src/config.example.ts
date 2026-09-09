// Copy this file to `src/config.ts` and fill in your own values. `src/config.ts` is gitignored.
import { GatewayIntentBits, Partials } from 'discord.js';
import { env } from './env';
import type { SunConfig } from './types/config';

export const config: SunConfig = {
    // Client configuration:
    client: {
        options: {
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildExpressions,
                GatewayIntentBits.GuildIntegrations,
                GatewayIntentBits.GuildWebhooks,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildScheduledEvents,
                GatewayIntentBits.AutoModerationConfiguration,
                GatewayIntentBits.AutoModerationExecution,
                GatewayIntentBits.GuildMessagePolls,
                GatewayIntentBits.DirectMessagePolls,
            ],
            partials: [
                Partials.User,
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.GuildScheduledEvent,
                Partials.ThreadMember,
            ],
            presence: {
                status: 'online',
            },
        },
        token: env.token,
        id: '000000000000000000',
    },

    // Users:
    users: {
        owner: '000000000000000000',
    },

    channels: {
        loggingChannel: '000000000000000000',
    },

    databases: {
        // The bot's own data is in PostgreSQL; see src/db/connection.ts.
        arcane: {
            host: 'db.example.com',
            user: 'arcane',
            password: env.arcaneDatabasePassword,
            database: 'arcane_blades',
        },
    },
};
