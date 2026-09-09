import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { defineButton } from '../../types/commands';

/** The user who ran `/warn reset` is identified through the avatar URL stored in the embed footer. */
export function getResetRequesterId(interaction: ButtonInteraction): string | undefined {
    return interaction.message.embeds[0]?.footer?.iconURL?.split('/')[4];
}

// Cancels the warn reset and updates the confirmation message.
export default defineButton({
    customId: 'reset_warns_no',
    guildOnly: true,
    async execute(interaction) {
        if (interaction.user.id !== getResetRequesterId(interaction)) {
            return interaction.reply({content: 'You are not the user who initiated the command.', flags: MessageFlags.Ephemeral});
        }

        await interaction.update({
            embeds: [
                {
                    title: 'Operation Cancelled',
                    description: 'Nothing changed.',
                    color: 0x65cdb6,
                    footer: {text: 'Cancelled by ' + interaction.user.username, icon_url: interaction.user.displayAvatarURL()},
                },
            ],
            components: [],
        });
    },
});
