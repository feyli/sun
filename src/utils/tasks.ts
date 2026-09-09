/**
 * Runs `task` immediately, then every `intervalMs`. Errors are logged so a failing task
 * never prevents the other tasks from starting or running.
 */
export async function startRecurringTask(name: string, task: () => Promise<void>, intervalMs: number): Promise<void> {
    const run = async (): Promise<void> => {
        try {
            await task();
        } catch (error) {
            console.error(`[${name}] Task failed:`, error);
        }
    };

    await run();
    setInterval(() => void run(), intervalMs);
}
