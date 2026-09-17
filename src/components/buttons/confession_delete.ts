import { MessageFlags } from 'discord.js';
import { eq } from 'drizzle-orm';
import { deletableConfessions } from '../../db/schema';
import { defineButton } from '../../types/commands';
import { checkDeleteAuth } from '../../utils/confessions';

// Deletes a confession. The author is never named publicly: authorship is
// proven against the hash stored when the confession was posted and every reply here is ephemeral.
export default defineButton({
    customId: 'confession_delete',
    guildOnly: true,
    // Verifying the hash is deliberately expensive, so clicks are rate limited.
    cooldown: 5_000,
    async execute(interaction) {
        const messageId = interaction.message.id;

        const [row] = await interaction.client.db
            .select({hash: deletableConfessions.hash})
            .from(deletableConfessions)
            .where(eq(deletableConfessions.messageId, messageId));

        if (!row) {
            return interaction.reply({content: 'This confession can no longer be deleted.', flags: MessageFlags.Ephemeral});
        }

        if (!(await checkDeleteAuth(interaction.user.id, row.hash))) {
            return interaction.reply({content: 'Only the author of this confession can delete it.', flags: MessageFlags.Ephemeral});
        }

        try {
            await interaction.message.delete();
        } catch (error) {
            console.error(error);
            return interaction.reply({content: "I couldn't delete this confession. Please reach out to this server's admins.", flags: MessageFlags.Ephemeral});
        }

        await interaction.client.db.delete(deletableConfessions).where(eq(deletableConfessions.messageId, messageId));

        return interaction.reply({content: 'This confession was confirmed to be yours. Your confession has been deleted.', flags: MessageFlags.Ephemeral});
    },
});
