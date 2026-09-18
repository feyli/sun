/** Custom IDs the poll modal and its handler agree on. */
export const POLL_MODAL_ID = 'poll_modal';
export const POLL_TITLE_INPUT = 'poll_title_input';
export const POLL_DESCRIPTION_INPUT = 'poll_description_input';
export const POLL_DEADLINE_INPUT = 'poll_deadline_input';
/** A string select, so the handler reads it with `getStringSelectValues()`. */
export const POLL_TIMEZONE_SELECT = 'poll_timezone_select';

export const POLL_TITLE_MAX_LENGTH = 120;
export const POLL_DESCRIPTION_MAX_LENGTH = 300;

/** A poll that ends in seconds is a mistake, not an intention. */
export const POLL_MIN_DURATION = Temporal.Duration.from({minutes: 1});
/** Discord's own ceiling for a poll, kept here so a poll we post can always be a real one. */
export const POLL_MAX_DURATION = Temporal.Duration.from({days: 32});

/** The format of the deadline field, written once so the modal and its errors cannot disagree. */
export const DEADLINE_HINT = 'A date and time (2026-10-01 18:00) or a duration (2h30m, 3 days, PT45M).';

/** Discord's cap on the description of a modal label. Exceeding it makes `showModal()` throw. */
export const LABEL_DESCRIPTION_MAX_LENGTH = 100;
/** The same cap, on the description of a single select option. */
export const SELECT_DESCRIPTION_MAX_LENGTH = 100;

/**
 * The same hint, terse enough that appending ` Read in <zone>.` still fits the cap above — the
 * longest IANA zone name is 30 characters, which leaves this 59-character form 1 to spare.
 */
export const DEADLINE_FIELD_HINT = 'Date (2026-10-01 18:00) or duration (2h30m, 3 days, PT45M).';

export type PollDeadline = { ok: true; endsAt: Temporal.ZonedDateTime } | { ok: false; error: string };

/** `yyyy-MM-dd HH:mm`, seconds optional, `T` accepted so a pasted ISO timestamp still works. */
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[ tT](\d{2}:\d{2}(?::\d{2})?)$/;

/**
 * One `<amount><unit>` pair of a shorthand duration. Sticky so the whole input can be walked
 * token by token: anything the walk does not consume is not a duration, which is what keeps
 * `2h tomorrow` from silently being read as two hours.
 */
const DURATION_TOKEN_PATTERN = /\s*(\d+)\s*(weeks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\s*,?\s*/giy;

/** Months and years are deliberately absent: nothing here may outlive {@link POLL_MAX_DURATION}. */
type DurationUnit = 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds';

function unitOf(token: string): DurationUnit {
    const unit = token.toLowerCase();
    if (unit.startsWith('w')) return 'weeks';
    if (unit.startsWith('d')) return 'days';
    if (unit.startsWith('h')) return 'hours';
    if (unit.startsWith('m')) return 'minutes';
    return 'seconds';
}

/** `1d2h30m`, `3 days`, `90 min` — the way people actually write a duration in chat. */
function parseShorthandDuration(input: string): Temporal.Duration | null {
    const fields: Partial<Record<DurationUnit, number>> = {};
    let consumed = 0;
    let match: RegExpExecArray | null;

    DURATION_TOKEN_PATTERN.lastIndex = 0;
    while ((match = DURATION_TOKEN_PATTERN.exec(input)) !== null) {
        const [, amount, unit] = match;
        if (!amount || !unit) return null;

        const field = unitOf(unit);
        fields[field] = (fields[field] ?? 0) + Number(amount);
        // A failed `exec()` resets `lastIndex`, so the position has to be remembered here.
        consumed = DURATION_TOKEN_PATTERN.lastIndex;
    }

    if (consumed !== input.length || Object.keys(fields).length === 0) return null;

    try {
        return Temporal.Duration.from(fields);
    } catch {
        return null;
    }
}

/** ISO-8601 (`P1DT12H`) first, shorthand second — Temporal reads the standard form natively. */
function parseDuration(input: string): Temporal.Duration | null {
    if (/^[+-]?p/i.test(input)) {
        try {
            return Temporal.Duration.from(input);
        } catch {
            return null;
        }
    }

    return parseShorthandDuration(input);
}

/** `P1DT2H30M` as `1d 2h 30m`, for error messages about the bounds. */
function describeDuration(duration: Temporal.Duration): string {
    const units: [number, string][] = [
        [duration.days, 'd'],
        [duration.hours, 'h'],
        [duration.minutes, 'min'],
        [duration.seconds, 's'],
    ];
    const parts = units.filter(([amount]) => amount > 0).map(([amount, unit]) => `${amount}${unit}`);
    return parts.length > 0 ? parts.join(' ') : '0s';
}

/**
 * Resolves what someone typed into the moment their poll ends, reading both accepted forms —
 * an absolute `yyyy-MM-dd HH:mm` and a relative duration — through Temporal.
 *
 * `timeZone` is what makes the absolute form unambiguous: the same wall clock time is a
 * different instant in every zone, so the author's own zone decides which one they meant.
 * Bad input is a result rather than an exception, since every failure here is something the
 * user has to be told about rather than something the bot can recover from.
 */
export function parsePollDeadline(input: string, timeZone: string): PollDeadline {
    const value = input.trim();
    const now = Temporal.Now.zonedDateTimeISO(timeZone);
    let endsAt: Temporal.ZonedDateTime;

    const [, date, time] = DATE_TIME_PATTERN.exec(value) ?? [];
    const absolute = Boolean(date && time);

    if (date && time) {
        let wallClock: Temporal.PlainDateTime;

        try {
            // `reject` rather than the default `constrain`, which would quietly turn a typo like
            // 2026-02-31 into the 28th and end the poll on a day nobody asked for.
            wallClock = Temporal.PlainDateTime.from(`${date}T${time}`, {overflow: 'reject'});
        } catch {
            return {ok: false, error: `\`${value}\` is not a real date.`};
        }

        // 'compatible' is what a calendar does with the two days a year a wall clock is ambiguous:
        // the earlier of two repeated times, and the first valid time after a DST gap.
        endsAt = wallClock.toZonedDateTime(timeZone, {disambiguation: 'compatible'});
    } else {
        const duration = parseDuration(value);
        if (!duration) return {ok: false, error: `I could not read \`${value}\` as a deadline. ${DEADLINE_HINT}`};
        if (duration.sign < 0) return {ok: false, error: 'A poll cannot end in the past.'};

        endsAt = now.add(duration);
    }

    // Told apart from "too short" so someone who typed last year's date is not left wondering
    // why a deadline months away is being called a one-minute poll.
    if (Temporal.ZonedDateTime.compare(endsAt, now) <= 0) {
        return {ok: false, error: absolute ? `\`${value}\` has already passed in ${timeZone}.` : 'A poll cannot end in the past.'};
    }

    if (Temporal.ZonedDateTime.compare(endsAt, now.add(POLL_MIN_DURATION)) < 0) {
        return {ok: false, error: `A poll has to run for at least ${describeDuration(POLL_MIN_DURATION)}.`};
    }

    if (Temporal.ZonedDateTime.compare(endsAt, now.add(POLL_MAX_DURATION)) > 0) {
        return {ok: false, error: `A poll cannot run for longer than ${POLL_MAX_DURATION.days} days.`};
    }

    return {ok: true, endsAt};
}
