import argon2 from 'argon2';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, Message, TextChannel, type User } from "discord.js";
import type { Database } from '../db';
import { deletableConfessions } from '../db/schema';

/**
 * Turns a confessing user into a token that proves nothing but "this person wrote it".
 *
 * The message ID used to be part of the input, which tied a hash to a message that did not
 * exist yet and so made delayed confessions undeletable. Dropping it costs no secrecy: a
 * message ID is public, so it never hid anything from someone holding the hash. Argon2 salts
 * every hash individually, so two confessions by the same user cannot be linked to each other.
 */
export async function generateDeleteHash(userId: string): Promise<string> {
    return await argon2.hash(userId, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
    });
}

export async function checkDeleteAuth(userId: string, storedHash: string): Promise<boolean> {
    return await argon2.verify(storedHash, userId);
}

/**
 * Records who may delete a posted confession. Called once the message exists, by whichever
 * path posted it — the immediate one, or the queue worker publishing a delayed confession.
 */
export async function registerDeletableConfession(db: Database, messageId: string, authorHash: string): Promise<void> {
    await db.insert(deletableConfessions).values({messageId, hash: authorHash});
}

export async function sendConfession(channel: TextChannel, confession: string, anonymous: boolean, interactionUser?: User): Promise<Message<true>> {
    // `anonymous` and `interactionUser` have to agree: a signed confession needs a name to sign it
    // with, and an anonymous one must never be handed the identity it is supposed to hide.
    if (!anonymous && !interactionUser) throw new Error('sendConfession() was called for a signed confession without the confessing user.');
    if (anonymous && interactionUser) throw new Error('sendConfession() was called for an anonymous confession with the confessing user, which would leak their identity.');

    const deleteButton = new ButtonBuilder()
        .setLabel('Delete')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
        // Static: authorship is proven against the stored hash, so the ID carries no state and
        // needs no prefix routing in the interaction dispatcher.
        .setCustomId('confession_delete')
        .setDisabled(false);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);

    const message = await channel.send({
        embeds: [
            {
                title: '✉️ ' + (anonymous ? 'Anonymous Confession' : 'Confession'),
                description: confession,
                color: Colors.Red,
                timestamp: new Date().toISOString(),
                author: (!anonymous && interactionUser) ? {name: interactionUser.username, icon_url: interactionUser.displayAvatarURL()} : undefined
            },
        ],
        components: [actionRow]
    });

    // Give people somewhere to react to the confession that isn't the confession channel itself.
    await message.startThread({
        name: (anonymous ? 'Anonymous Confession' : `Confession from ${interactionUser?.username}`).slice(0, 100),
        reason: 'Automatic discussion thread for a new confession.',
    });

    return message;
}
