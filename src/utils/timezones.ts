import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { users } from '../db/schema';

/**
 * Every IANA zone the runtime's own time zone data knows about — the source of truth for what
 * we accept and display. Reading it from the runtime rather than a hard-coded list means the
 * bot follows the IANA database as it is updated (zones renamed, created or merged) instead of
 * drifting away from it.
 */
export const TIME_ZONES: readonly string[] = Intl.supportedValuesOf('timeZone');

/** Shown when someone opens the autocomplete without typing anything. */
const SUGGESTED_TIME_ZONES: readonly string[] = [
    'UTC',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Moscow',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
];

/** Discord never displays more than 25 autocomplete choices, nor more than 25 select options. */
export const MAX_AUTOCOMPLETE_CHOICES = 25;
export const MAX_SELECT_OPTIONS = 25;

const TIME_ZONES_BY_KEY = new Map(TIME_ZONES.map((zone) => [zone.toLowerCase(), zone]));

/** How a zone is typed versus how it is stored: people write spaces where IANA writes underscores. */
function normalize(input: string): string {
    return input.trim().toLowerCase().replaceAll(' ', '_');
}

/**
 * Turns whatever the user typed into a canonical zone name, or `null` if it is not a zone.
 * Matching is case-insensitive and tolerates spaces so `europe/paris` and `America/New York`
 * both land on the real thing.
 */
export function resolveTimeZone(input: string): string | null {
    return TIME_ZONES_BY_KEY.get(normalize(input)) ?? null;
}

/**
 * What a zone is currently on: `Central European Summer Time (UTC+02:00)`. The offset comes from
 * Temporal and the long name from the runtime's locale data, so both follow the zone's current
 * DST state rather than a stored guess.
 */
export function timeZoneDetail(zone: string): string {
    const offset = Temporal.Now.zonedDateTimeISO(zone).offset;
    const longName = new Intl.DateTimeFormat('en-US', {timeZone: zone, timeZoneName: 'long'}).formatToParts(new Date()).find((part) => part.type === 'timeZoneName')?.value;

    return longName && longName !== zone ? `${longName} (UTC${offset})` : `UTC${offset}`;
}

/** A zone with its detail: `Europe/Paris — Central European Summer Time (UTC+02:00)`. */
export function describeTimeZone(zone: string): string {
    return `${zone} — ${timeZoneDetail(zone)}`;
}

/** Minutes east of UTC, right now — the sort key that puts a zone list in clock order. */
function offsetMinutes(zone: string): number {
    return Temporal.Now.zonedDateTimeISO(zone).offsetNanoseconds / 60_000_000_000;
}

const SUGGESTED_RANKS = new Map(SUGGESTED_TIME_ZONES.map((zone, index) => [zone, index]));

/**
 * How likely a zone is to be the one someone means, lowest first. Zones sharing a clock are
 * usually a famous one and its administrative offshoots, so `America/New_York` has to come out
 * ahead of the seven `America/Indiana/*` zones that read exactly the same time.
 */
function prominence(zone: string): number {
    if (SUGGESTED_RANKS.has(zone)) return 0;
    // A third path segment marks a zone carved out of a larger one: `America/Indiana/Knox`.
    return zone.split('/').length > 2 ? 2 : 1;
}

/**
 * Trims a zone list to what a select can hold, keeping one zone per distinct current offset
 * first. A country with more zones than options is one that has near-duplicates (the seven
 * `America/Indiana/*` zones all read the same clock), so dropping those before dropping a
 * genuinely different offset such as `Pacific/Honolulu` loses the least.
 */
function trimToDistinctOffsets(zones: readonly string[], limit: number): string[] {
    if (zones.length <= limit) return [...zones];

    const seen = new Set<number>();
    const distinct: string[] = [];
    const duplicates: string[] = [];

    for (const zone of zones) {
        const offset = offsetMinutes(zone);
        if (seen.has(offset)) duplicates.push(zone);
        else {
            seen.add(offset);
            distinct.push(zone);
        }
    }

    return [...distinct, ...duplicates].slice(0, limit);
}

/**
 * The zones the region behind a Discord locale uses, unordered and possibly empty — the raw
 * material both the picker and the autocomplete rank against.
 */
function localeZones(locale: string): string[] {
    let candidates: readonly string[] = [];

    try {
        // `maximize()` fills in the region a bare language implies: `fr` -> `fr-Latn-FR`.
        candidates = new Intl.Locale(locale).maximize().getTimeZones() ?? [];
    } catch {
        // An unknown or malformed locale is not worth a log line: callers treat this as "no guess".
        return [];
    }

    // The region data can name zones this runtime's zone list does not carry.
    return candidates.filter((zone) => TIME_ZONES_BY_KEY.has(zone.toLowerCase()));
}

/**
 * The zones someone with this Discord locale could plausibly be in, in clock order.
 *
 * `Intl.Locale` knows which zones a region uses, so a French client is offered `Europe/Paris`
 * rather than 445 zones nobody will scroll through. It is a guess — a locale is a language, not
 * an address — so this only ever narrows a picker that also points at /settimezone for the rest.
 * Falls back to {@link SUGGESTED_TIME_ZONES} when the locale carries no usable region.
 */
export function timeZonesForLocale(locale: string, limit: number = MAX_SELECT_OPTIONS): string[] {
    const known = localeZones(locale);
    const zones = known.length > 0 ? known : SUGGESTED_TIME_ZONES.filter((zone) => TIME_ZONES_BY_KEY.has(zone.toLowerCase()));

    // Ordered by prominence before trimming so the zones that survive a cut are the recognisable
    // ones, then by clock so the picker reads like a map from west to east.
    const ordered = [...zones].sort((a, b) => prominence(a) - prominence(b) || a.localeCompare(b));

    return trimToDistinctOffsets(ordered, limit).sort((a, b) => offsetMinutes(a) - offsetMinutes(b) || prominence(a) - prominence(b) || a.localeCompare(b));
}

/**
 * The zones to offer for a partially typed query.
 *
 * The zones the user's locale makes possible come first, which is what makes an autocomplete over
 * 445 entries usable: a French user typing `e` is shown `Europe/Paris` rather than `Africa/Abidjan`.
 * Within that, a query matching the city (the part after the last slash) beats one matching the
 * region, which beats a match anywhere in the name. An empty query is answered with the locale's
 * own zones, since that is the best guess available before a single character is typed.
 */
export function searchTimeZones(query: string, locale: string, limit: number = MAX_AUTOCOMPLETE_CHOICES): string[] {
    const needle = normalize(query);
    if (!needle) return timeZonesForLocale(locale, limit);

    // Empty for a locale with no region data, which simply leaves the ranking to the query alone.
    const plausible = new Set(localeZones(locale));

    const matchRank = (zone: string): number => {
        const lowercase = zone.toLowerCase();
        const city = lowercase.slice(lowercase.lastIndexOf('/') + 1);
        if (city.startsWith(needle)) return 0;
        if (lowercase.startsWith(needle)) return 1;
        return 2;
    };

    return TIME_ZONES.filter((zone) => zone.toLowerCase().includes(needle))
        .sort(
            (a, b) =>
                Number(plausible.has(b)) - Number(plausible.has(a)) || matchRank(a) - matchRank(b) || prominence(a) - prominence(b) || a.localeCompare(b),
        )
        .slice(0, limit);
}

/** The zone this user has set, or `null` when they never set one. */
export async function getUserTimeZone(db: Database, userId: string): Promise<string | null> {
    const [row] = await db.select({timezone: users.timezone}).from(users).where(eq(users.id, userId));
    return row?.timezone ?? null;
}

/** Stores (or replaces) a user's zone. Creates the row on first use, so callers never have to. */
export async function setUserTimeZone(db: Database, userId: string, timezone: string): Promise<void> {
    await db.insert(users).values({id: userId, timezone}).onConflictDoUpdate({target: users.id, set: {timezone}});
}
