import { MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputStyle } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';
import {
    DEADLINE_FIELD_HINT,
    LABEL_DESCRIPTION_MAX_LENGTH,
    POLL_DEADLINE_INPUT,
    POLL_DESCRIPTION_INPUT,
    POLL_DESCRIPTION_MAX_LENGTH,
    POLL_MODAL_ID,
    POLL_TIMEZONE_SELECT,
    POLL_TITLE_INPUT,
    POLL_TITLE_MAX_LENGTH,
    SELECT_DESCRIPTION_MAX_LENGTH,
} from '../../utils/polls';
import { getUserTimeZone, timeZoneDetail, timeZonesForLocale } from '../../utils/timezones';

export default defineSlashCommand({
    data: guildsOnly(new SlashCommandBuilder().setName('poll').setDescription('Ask the server a question and give people until a deadline to answer.')),
    category: 'Utility',
    cooldown: 30000,
    guildOnly: true,
    ownerOnly: false,
    async execute(interaction) {
        // Both lookups are independent, and the modal needs them together before it can be built.
        const [[row], timeZone] = await Promise.all([
            interaction.client.db.select({pollChannelId: guilds.pollChannelId}).from(guilds).where(eq(guilds.id, interaction.guild.id)),
            getUserTimeZone(interaction.client.db, interaction.user.id),
        ]);

        if (!row?.pollChannelId)
            return interaction.reply({
                content: "It seems like this server hasn't set up a poll channel yet. Please reach out to the server's admins to set up this feature.",
                flags: MessageFlags.Ephemeral,
            });

        const modal = new ModalBuilder()
            .setCustomId(POLL_MODAL_ID)
            .setTitle('New poll')
            .addLabelComponents(
                (label) =>
                    label
                        .setLabel('What are you asking?')
                        .setTextInputComponent((input) =>
                            input.setCustomId(POLL_TITLE_INPUT).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(POLL_TITLE_MAX_LENGTH),
                        ),
                (label) =>
                    label
                        .setLabel('Details (optional)')
                        .setDescription('Anything people should know before they answer.')
                        .setTextInputComponent((input) =>
                            input.setCustomId(POLL_DESCRIPTION_INPUT).setStyle(TextInputStyle.Paragraph).setRequired(false).setMaxLength(POLL_DESCRIPTION_MAX_LENGTH),
                        ),
                (label) =>
                    label
                        .setLabel('When does it end?')
                        // A stored zone is named here so the author can see which clock their date is
                        // read on. The slice is belt and braces: Discord rejects the whole modal over
                        // a description one character too long, which would break the command outright.
                        .setDescription((timeZone ? `${DEADLINE_FIELD_HINT} Read in ${timeZone}.` : DEADLINE_FIELD_HINT).slice(0, LABEL_DESCRIPTION_MAX_LENGTH))
                        .setTextInputComponent((input) =>
                            input.setCustomId(POLL_DEADLINE_INPUT).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50).setPlaceholder('2026-10-01 18:00'),
                        ),
            );

        // Asked once and then remembered, so only a user's first poll costs them this field.
        // Discord caps a select at 25 options and there are hundreds of zones, so the list is cut
        // down to the ones this user's locale makes possible; /settimezone covers everything else.
        if (!timeZone)
            modal.addLabelComponents((label) =>
                label
                    .setLabel('Your timezone')
                    .setDescription('So I read your dates on your clock. Not listed? Set it with /settimezone.')
                    .setStringSelectMenuComponent((select) =>
                        select.setCustomId(POLL_TIMEZONE_SELECT).setRequired(true).setPlaceholder('Pick your timezone').setOptions(
                            timeZonesForLocale(interaction.locale).map((zone) => ({
                                label: zone,
                                value: zone,
                                description: timeZoneDetail(zone).slice(0, SELECT_DESCRIPTION_MAX_LENGTH),
                            })),
                        ),
                    ),
            );

        await interaction.showModal(modal);
    },
});
