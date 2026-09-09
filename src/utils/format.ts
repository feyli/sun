/** Inserts `separator` between thousands groups (e.g. `128544` -> `128 544`). */
export function formatWithSeparator(value: number, separator: string): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/** Truncates a string to Discord's embed field value limit. */
export function truncateFieldValue(value: string, limit = 1024): string {
    return value.length > limit ? value.substring(0, limit - 3) + '...' : value;
}
