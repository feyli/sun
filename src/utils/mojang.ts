export interface MojangProfile {
    id: string;
    name: string;
}

/** Response of the name lookup endpoint: a profile on success, an error message otherwise. */
export interface MojangNameLookup extends Partial<MojangProfile> {
    errorMessage?: string;
    error?: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url);
        return (await response.json()) as T;
    } catch {
        return null;
    }
}

/** Resolves a Minecraft username to its profile (UUID without dashes). */
export const fetchProfileByName = (name: string): Promise<MojangNameLookup | null> =>
    fetchJson<MojangNameLookup>('https://api.mojang.com/users/profiles/minecraft/' + name);

/** Resolves a UUID to its profile through the public API. */
export const fetchProfileByUuid = (uuid: string): Promise<Partial<MojangProfile> | null> =>
    fetchJson<Partial<MojangProfile>>('https://api.mojang.com/user/profile/' + uuid);

/** Resolves a UUID to its profile through the session server. */
export const fetchSessionProfile = (uuid: string): Promise<Partial<MojangProfile> | null> =>
    fetchJson<Partial<MojangProfile>>('https://sessionserver.mojang.com/session/minecraft/profile/' + uuid);
