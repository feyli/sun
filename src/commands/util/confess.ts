import { ModalBuilder, SlashCommandBuilder, TextInputStyle } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

export default defineSlashCommand({
    data: guildsOnly(new SlashCommandBuilder().setName('confess').setDescription('Confess (anonymously or not) your feelings to the world.')),
    category: 'Utility',
    cooldown: 30000,
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('confess_modal')
            .setTitle('Confession')
            .addLabelComponents(
                (label) =>
                    label
                        .setLabel('What would you like to confess?')
                        .setTextInputComponent((input) => input.setCustomId('confession_input').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                (label) =>
                    label
                        .setLabel('Post anonymously')
                        .setDescription('Uncheck this to show your name on the confession.')
                        .setCheckboxComponent((checkbox) => checkbox.setCustomId('confession_anonymous').setDefault(true)),
            );

        await interaction.showModal(modal);
    },
});
