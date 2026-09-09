import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { eq } from 'drizzle-orm';
import { warns } from '../../db/schema';
import { defineButton } from '../../types/commands';
import { getResetRequesterId } from './reset_warns_no';

// Resets the warns of the entire server.
export default defineButton({
    customId: 'reset_warns_yes',
    guildOnly: true,
    async execute(interaction) {
        if (interaction.user.id !== getResetRequesterId(interaction)) {
            return interaction.reply({content: 'You are not the user who initiated the command.', flags: MessageFlags.Ephemeral});
        }
        if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [{title: 'Missing Permission', description: 'You are missing the `ADMINISTRATOR` permission.', color: 0xf26448}],
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.client.db.delete(warns).where(eq(warns.guildId, interaction.guild.id));

        await interaction.update({
            embeds: [
                {
                    title: 'Warns Reset',
                    description: 'All warns have been reset.',
                    color: 0x4caf50,
                    footer: {text: 'Requested by ' + interaction.user.username, icon_url: interaction.user.displayAvatarURL()},
                },
            ],
            components: [],
        });
    },
});
