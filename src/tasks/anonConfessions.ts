import { TextChannel, type Client, type Snowflake } from 'discord.js';
import { eq } from 'drizzle-orm';
import type { Queue } from 'pg-boss';
import { boss } from '../db/boss';
import { guilds } from '../db/schema';
import { registerDeletableConfession, sendConfession } from '../utils/confessions';

const QUEUE_NAME = 'anonymous-confessions';

/**
 * What a queued confession carries. Deliberately no user ID: `authorHash` is an argon2 hash
 * of the confessing user, which is enough to authorise a later deletion but cannot be read
 * back into an identity, so a queued confession is anonymous even to someone with the database.
 */
interface DelayedConfession {
    guildId: Snowflake;
    confession: string;
    /** Subject the author warned about, or `null` when they gave none. */
    triggerWarning: string | null;
    authorHash: string;
}

/**
 * pg-boss owns both the schedule and the payload, which is what makes this survive restarts:
 * the job is committed to PostgreSQL before `/confess` even replies, so a confession queued a
 * second before the bot dies is delivered whenever the bot comes back.
 */
export const anonymousConfessionsQueue: Queue = {
    name: QUEUE_NAME,
    // A confession is one channel.send() and one insert. If it takes longer than this the
    // worker is wedged, and the job is better off retried than left active.
    expireInSeconds: 60,
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
    // The payload holds the confession text, so a delivered job is purged promptly rather
    // than sitting in the queue's history for pg-boss's 7-day default.
    deleteAfterSeconds: 60,
};

/** Queues an anonymous confession for publication after `delaySeconds`. */
export async function queueAnonymousConfession(data: DelayedConfession, delaySeconds: number): Promise<string | null> {
    return await boss.send(QUEUE_NAME, data, {startAfter: delaySeconds});
}

/**
 * Publishes one queued confession. Throwing hands the job back to pg-boss, which retries it
 * with backoff — the right outcome for a Discord outage or a channel that is briefly
 * unreachable, and the reason this does not swallow its own errors.
 */
async function publishConfession(client: Client, {guildId, confession, triggerWarning, authorHash}: DelayedConfession): Promise<void> {
    const [row] = await client.db.select({channelId: guilds.confessionChannelId}).from(guilds).where(eq(guilds.id, guildId));

    // No channel configured, or the guild is gone: nothing to retry towards, so the job is
    // completed rather than failed. Retrying could only republish it hours later, long after
    // the author stopped expecting it.
    if (!row?.channelId) {
        console.warn(`[Anonymous Confessions] Dropped a confession for guild ${guildId}: no confession channel is configured.`);
        return;
    }

    const channel = await client.channels.fetch(row.channelId);
    if (!(channel instanceof TextChannel) || !channel.isSendable()) {
        throw new Error(`Confession channel ${row.channelId} of guild ${guildId} is not a sendable text channel.`);
    }

    const message = await sendConfession(channel, confession, true, undefined, triggerWarning);
    await registerDeletableConfession(client.db, message.id, authorHash);
}

/** Starts consuming the queue. Call once the client is ready, since publishing needs Discord. */
export async function startAnonymousConfessionWorker(client: Client): Promise<void> {
    await boss.work<DelayedConfession>(QUEUE_NAME, async (jobs) => {
        for (const job of jobs) await publishConfession(client, job.data);
    });
    console.log('[INFO] Worker started: Anonymous Confessions');
}
