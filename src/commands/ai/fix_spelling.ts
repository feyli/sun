import { ApplicationCommandType, ContextMenuCommandBuilder, MessageFlags } from 'discord.js';
import OpenAI from 'openai';
import { config } from '../../config';
import { env } from '../../env';
import { defineMessageCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';
import { difference } from '../../utils/difference';

const PROMPT_ID = 'pmpt_68c7fe146b808193aeec5143b21b07070fd4695495b8360e';

export default defineMessageCommand({
    data: anywhere(new ContextMenuCommandBuilder().setName('Fix Spelling').setType(ApplicationCommandType.Message)),
    cooldown: 60000,
    async execute(interaction) {
        const text = interaction.targetMessage.content;
        if ((text.length < 4 || text.length > 1000) && interaction.user.id !== config.users.owner) {
            interaction.client.cooldowns.get(interaction.commandName)?.delete(interaction.user.id);
            return interaction.reply({content: 'The text must be between 4 and 1000 characters.', flags: MessageFlags.Ephemeral});
        }

        const openai = new OpenAI({apiKey: env.openAiKey});
        await interaction.deferReply();

        const response = await openai.responses.create({prompt: {id: PROMPT_ID}, input: text});

        const {crossedText, highlightedText} = difference(text, response.output_text);
        await interaction.editReply({
            embeds: [
                {title: 'Original Text', description: crossedText, color: 0xff6961},
                {title: 'Corrected Text', description: highlightedText, color: 0x77dd77},
            ],
        });
    },
});
