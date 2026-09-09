import { Locale, SlashCommandBuilder } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';

const localizedReplies: Partial<Record<Locale, string>> = {
    [Locale.French]: "C'est moi wsh",
    [Locale.ChineseCN]: 'Chong!',
    [Locale.ChineseTW]: 'Chong!',
    [Locale.Italian]: 'Reggiano!',
    [Locale.SpanishES]: 'Amor!',
};

export default defineSlashCommand({
    data: anywhere(
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Returns the current ping for the bot.')
            .setNameLocalizations({
                [Locale.ChineseCN]: 'ching',
                [Locale.ChineseTW]: 'ching',
                [Locale.Italian]: 'parmiggiano',
                [Locale.SpanishES]: 'mi',
            }),
    ),
    category: 'Bot',
    cooldown: 5000,
    async execute(interaction) {
        const now = Date.now();
        await interaction.deferReply();
        await interaction.editReply(`${localizedReplies[interaction.locale] ?? 'Pong!'} \`${Date.now() - now}ms\``);
    },
});
