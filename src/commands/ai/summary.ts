import { ApplicationCommandType, ContextMenuCommandBuilder, MessageFlags } from 'discord.js';
import OpenAI from 'openai';
import { config } from '../../config';
import { env } from '../../env';
import { defineMessageCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';

const PROMPT_ID = 'pmpt_68c7fdde04d08197b86cc52fc391d26709cbb4becaaa78f1';

interface SummaryResponse {
    short_summary: string;
    key_information: string[];
}

function isSummaryResponse(value: unknown): value is SummaryResponse {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.short_summary === 'string' && Array.isArray(candidate.key_information);
}

export default defineMessageCommand({
    data: anywhere(new ContextMenuCommandBuilder().setName('Summarize').setType(ApplicationCommandType.Message)),
    cooldown: 60000,
    async execute(interaction) {
        const text = interaction.targetMessage.content;
        if (text.length < 100 && interaction.user.id !== config.users.owner) {
            interaction.client.cooldowns.get(interaction.commandName)?.delete(interaction.user.id);
            return interaction.reply({content: 'The text must be at least 100 characters long.', flags: MessageFlags.Ephemeral});
        }

        const openai = new OpenAI({apiKey: env.openAiKey});
        await interaction.deferReply();

        const response = await openai.responses.create({prompt: {id: PROMPT_ID}, input: text});

        let summary: unknown;
        try {
            summary = JSON.parse(response.output_text);
        } catch (error) {
            console.error(error);
            return interaction.editReply({content: 'Failed to parse the response from the AI.'});
        }
        if (!isSummaryResponse(summary)) return interaction.editReply({content: 'Failed to parse the response from the AI.'});

        const keyPoints = summary.key_information.map((point, index) => `${index + 1}. ${point}`).join('\n');
        await interaction.editReply({
            embeds: [
                {
                    title: ':sparkles: Summary',
                    description: `### Short Summary:\n${summary.short_summary}\n\n### Key Points:\n${keyPoints}`,
                    color: 0xffac32,
                },
            ],
        });
    },
});
