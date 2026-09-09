import { ApplicationCommandOptionType, MessageFlags, PermissionsBitField, SlashCommandBuilder, type APIApplicationCommandOption, type APIEmbed, type Client, type Snowflake } from 'discord.js';
import { defineSlashCommand, type SlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';
import { truncateFieldValue } from '../../utils/format';

/** Slash commands a regular user can see in the given guild (or in DMs when `guildId` is undefined). */
function visibleCommands(client: Client, guildId: Snowflake | undefined): SlashCommand[] {
    return [...client.commands.values()].filter(
        (command): command is SlashCommand => command.kind === 'slash' && !command.ownerOnly && (!command.guildId || command.guildId === guildId),
    );
}

function describeOption(option: APIApplicationCommandOption): string {
    if (option.type === ApplicationCommandOptionType.Subcommand) return '(subcommand)';
    if (option.type === ApplicationCommandOptionType.SubcommandGroup) return '(subcommand group)';
    return option.required ? '(required)' : '(optional)';
}

export default defineSlashCommand({
    data: anywhere(
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Shows a list of Sun commands or some info about a specific command.')
            .addStringOption((option) => option.setName('command').setDescription('The command to get help for').setAutocomplete(true)),
    ),
    cooldown: 5000,
    category: 'Bot',
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const choices = visibleCommands(interaction.client, interaction.guild?.id).map((command) => command.data.name);
        // Case-insensitive match, limited to 25 results
        const filtered = choices.filter((choice) => choice.toLowerCase().includes(focusedValue)).slice(0, 25);
        await interaction.respond(filtered.map((choice) => ({name: choice, value: choice})));
    },
    async execute(interaction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const commands = visibleCommands(interaction.client, interaction.guild?.id);

        const requestedName = interaction.options.getString('command');
        if (requestedName) {
            const command = commands.find((candidate) => candidate.data.name === requestedName);
            if (!command) return interaction.editReply('Command not found. Please use given choices.');

            const permissions = command.data.default_member_permissions;
            const embed: APIEmbed = {
                title: `Help for </${command.data.name}:${command.id}>`,
                description: command.data.description,
                color: 0x00ff00,
                fields: [
                    {name: 'Category', value: command.category ?? 'Unknown', inline: true},
                    {name: 'Cooldown', value: command.cooldown ? command.cooldown / 1000 + 's' : 'None', inline: true},
                    {
                        name: 'Required permissions',
                        value: permissions ? '`' + new PermissionsBitField(BigInt(permissions)).toArray().join('`, `') + '`' : 'None',
                        inline: true,
                    },
                ],
            };

            const options = command.data.options ?? [];
            if (options.length > 0) {
                const optionsValue = options.map((option) => `\`${option.name}\` - ${option.description} ${describeOption(option)}`).join('\n');
                embed.fields?.push({name: 'Options', value: truncateFieldValue(optionsValue), inline: true});
            }
            return interaction.editReply({embeds: [embed]});
        }

        const categories = [...new Set(commands.map((command) => command.category))].filter((category): category is string => Boolean(category));
        const embeds: APIEmbed[] = [];
        for (const category of categories) {
            const categoryCommands = commands.filter((command) => command.category === category).map((command) => `</${command.data.name}:${command.id}>`);
            if (categoryCommands.length === 0) continue;

            embeds.push({
                title: `\`${category}\` category`,
                color: 0x00ff00,
                fields: [{name: 'Commands', value: truncateFieldValue(categoryCommands.join(', '))}],
            });
        }

        if (embeds.length === 0) {
            embeds.push({title: 'No commands available', description: 'No commands are available in this context.', color: 0xff0000});
        }

        await interaction.editReply({embeds});
    },
});
