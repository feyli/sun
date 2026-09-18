import { MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputStyle } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';
import { guilds } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { CONFESSION_MAX_LENGTH, TRIGGER_WARNING_MAX_LENGTH } from '../../utils/confessions';

export default defineSlashCommand({
    data: guildsOnly(new SlashCommandBuilder().setName('confess').setDescription('Confess (anonymously or not) your feelings to the world.')),
    category: 'Utility',
    cooldown: 30000,
    guildOnly: true,
    ownerOnly: false,
    async execute(interaction) {
        const [row] = await interaction.client.db
            .select({confessionChannelId: guilds.confessionChannelId})
            .from(guilds)
            .where(eq(guilds.id, interaction.guild.id));

        if (!row?.confessionChannelId) return interaction.reply({content: "It seems like this server hasn't set up a confession channel yet. Please reach out to the server's admins to set up this feature.", flags: MessageFlags.Ephemeral});

        const modal = new ModalBuilder()
            .setCustomId('confess_modal')
            .setTitle('Confession')
            .addLabelComponents(
                (label) =>
                    label
                        .setLabel('What would you like to confess?')
                        // Capped short of the 4096-character embed description limit, which also has
                        // to fit the trigger warning and the spoiler markers wrapped around this.
                        .setTextInputComponent((input) =>
                            input.setCustomId('confession_input').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(CONFESSION_MAX_LENGTH),
                        ),
                (label) =>
                    label
                        .setLabel('Trigger warning (optional)')
                        .setDescription('Naming a subject here hides your confession behind a spoiler, so people can choose to read it.')
                        .setTextInputComponent((input) =>
                            input
                                .setCustomId('trigger_warning_input')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                                .setMaxLength(TRIGGER_WARNING_MAX_LENGTH)
                                .setPlaceholder('e.g. self-harm, eating disorders'),
                        ),
                (label) =>
                    label
                        .setLabel('Post anonymously')
                        .setDescription('Uncheck this to show your name on the confession.')
                        .setStringSelectMenuComponent((select) =>
                            select.setCustomId('confession_privacy')
                                .setRequired(true)
                                .setOptions([
                                    {
                                        label: 'Anonymous with random delay',
                                        value: 'yes+delayed',
                                        description: 'Check this to ensure maximum anonymity with a random timer (between 15 and 30 minutes).',
                                    },
                                    {
                                        label: 'Anonymous',
                                        value: 'yes',
                                        description: 'Your confession will immediately be posted, anonymously.',
                                        default: true
                                    },
                                    {
                                        label: 'Not anonymous',
                                        value: 'no',
                                        description: 'Your confession will immediately be posted and your username will be referenced on the post.'
                                    }
                                ]))
            );

        await interaction.showModal(modal);
    },
});
