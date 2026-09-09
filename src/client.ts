import { Client, Collection } from 'discord.js';
import { config } from './config';
import { db } from './db';
import { createArcanePool } from './handlers/database';
import type { Command, ComponentHandler } from './types/commands';

export class SunClient extends Client {
    constructor() {
        super(config.client.options);

        this.commands = new Collection();
        this.components = new Collection();
        this.cooldowns = new Collection();
        this.db = db;
        this.arcanePool = createArcanePool();
    }

    registerCommands(commands: readonly Command[]): void {
        for (const command of commands) this.commands.set(command.data.name, command);
    }

    registerComponents(handlers: readonly ComponentHandler[]): void {
        for (const handler of handlers) this.components.set(handler.customId, handler);
    }
}
