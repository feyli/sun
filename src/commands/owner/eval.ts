import { MessageFlags, SlashCommandBuilder, type ChatInputCommandInteraction, type Client } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';

type EvalFunction = (client: Client, interaction: ChatInputCommandInteraction) => Promise<unknown>;

function hasZeroLength(value: unknown): boolean {
    return typeof value === 'object' && value !== null && 'length' in value && value.length === 0;
}

export default defineSlashCommand({
    data: anywhere(
        new SlashCommandBuilder()
            .setName('eval')
            .setDescription('Evaluates JavaScript code.')
            .addStringOption((option) => option.setName('code').setDescription('The code to evaluate.').setRequired(true))
            .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral.')),
    ),
    ownerOnly: true,
    cooldown: 10000,
    category: 'Owner',
    async execute(interaction) {
        const code = interaction.options.getString('code', true);
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        await interaction.deferReply(ephemeral ? {flags: MessageFlags.Ephemeral} : {});

        if (code.includes('interaction.reply(') || code.includes('interaction.deferReply(')) {
            return interaction.editReply({content: "Hey, what you tryna do here? Hopefully I didn't run that cause it would have most likely crashed the whole thing!"});
        }
        if (code.includes('interaction.editReply(')) {
            return interaction.editReply({
                content: "I mean... I can try to edit my reply as you wish but you'll most likely not see it as I will overwrite that real quickly... Kinda pointless, man.",
            });
        }

        let result: unknown;
        try {
            // Owner-only: evaluates arbitrary code. `client` stays in scope so existing eval snippets keep working.
            const wrapperFn = new Function('client', 'interaction', `return (async () => { try { ${code} } catch (err) { throw err; } })();`) as EvalFunction;
            result = await wrapperFn(interaction.client, interaction);
        } catch (error) {
            result = error;
        }

        let content: string;
        if (!result) content = "This code doesn't return anything or returns `false`.";
        else if (hasZeroLength(result)) content = 'The result has a length of 0.';
        else content = '```' + String(result) + '```';

        await interaction.editReply({content});
    },
});
