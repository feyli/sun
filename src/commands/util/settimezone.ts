import { MessageFlags, SlashCommandBuilder, inlineCode } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';
import { MAX_AUTOCOMPLETE_CHOICES, describeTimeZone, resolveTimeZone, searchTimeZones, setUserTimeZone } from '../../utils/timezones';

/** Discord rejects an autocomplete choice whose name is longer than this. */
const CHOICE_NAME_MAX_LENGTH = 100;

export default defineSlashCommand({
    data: anywhere(
        new SlashCommandBuilder()
            .setName('settimezone')
            .setDescription('Set the timezone I read the dates and times you give me in.')
            .addStringOption((option) =>
                option.setName('timezone').setDescription('Start typing a city or region, e.g. Europe/Paris.').setRequired(true).setAutocomplete(true).setMaxLength(CHOICE_NAME_MAX_LENGTH),
            ),
    ),
    category: 'Utility',
    cooldown: 5000,
    async autocomplete(interaction) {
        // The client's locale is only a hint about where someone is, but it is the one the bot has:
        // it puts the zones of their own region on top instead of whatever sorts first alphabetically.
        const zones = searchTimeZones(interaction.options.getFocused(), interaction.locale, MAX_AUTOCOMPLETE_CHOICES);
        await interaction.respond(zones.map((zone) => ({name: describeTimeZone(zone).slice(0, CHOICE_NAME_MAX_LENGTH), value: zone})));
    },
    async execute(interaction) {
        const input = interaction.options.getString('timezone', true);
        // The autocomplete only suggests: Discord still sends whatever was typed over it.
        const zone = resolveTimeZone(input);

        if (!zone)
            return interaction.reply({
                content: `I don't know a timezone called ${inlineCode(input)}. Pick one from the suggestions — they are IANA names such as ${inlineCode('Europe/Paris')}.`,
                flags: MessageFlags.Ephemeral,
            });

        await setUserTimeZone(interaction.client.db, interaction.user.id, zone);

        const localTime = Temporal.Now.zonedDateTimeISO(zone).toPlainTime().toString({smallestUnit: 'minute'});
        return interaction.reply({
            content: `Your timezone is now **${describeTimeZone(zone)}**, where it is currently ${localTime}. Dates and times you give me are read on that clock from now on.`,
            flags: MessageFlags.Ephemeral,
        });
    },
});
