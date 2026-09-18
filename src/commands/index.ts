import { Glob } from 'bun';
import type { Command } from '../types/commands';

/** Every `.ts` file under this folder is a candidate command module, at any nesting depth. */
const COMMAND_FILES = new Glob('**/*.ts');

/**
 * Checks that a module's default export really is a command. `kind` is what the `define*`
 * factories stamp on their result, so it doubles as the discriminator here.
 */
function isCommand(value: unknown): value is Command {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Partial<Command>;
    return (candidate.kind === 'slash' || candidate.kind === 'message' || candidate.kind === 'user') && typeof candidate.execute === 'function';
}

async function loadCommands(): Promise<Command[]> {
    // Sorted so the deploy payload, and therefore `/help`, keeps a stable order across restarts.
    const paths = [...COMMAND_FILES.scanSync({cwd: import.meta.dir, absolute: true})].sort((a, b) => a.localeCompare(b));

    const loaded: Command[] = [];
    for (const path of paths) {
        if (path === import.meta.path) continue;

        const module = (await import(path)) as { default?: unknown };
        // Loud rather than silent: a command that is skipped here never reaches Discord.
        if (!isCommand(module.default)) {
            console.warn(`[WARN] ${path} is in the commands folder but does not default-export a command; skipping.`);
            continue;
        }

        loaded.push(module.default);
    }

    return loaded;
}

/** Every application command of the bot, discovered from the category folders next to this file. */
export const commands: Command[] = await loadCommands();
