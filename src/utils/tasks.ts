/**
 * Runs `task` immediately, then every `intervalMs`. Errors are logged so a failing task
 * never prevents the other tasks from starting or running. A tick is skipped while the
 * previous run is still in flight, so a run slower than `intervalMs` cannot pile up.
 */
export async function startRecurringTask(name: string, task: () => Promise<void>, intervalMs: number): Promise<void> {
    let running = false;

    const run = async (): Promise<void> => {
        if (running) return;
        running = true;
        try {
            await task();
        } catch (error) {
            console.error(`[${name}] Task failed:`, error);
        } finally {
            running = false;
        }
    };

    await run();
    setInterval(() => void run(), intervalMs);
}
