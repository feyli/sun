const { OpenAI } = require("openai");
const difference = require('../../complex_functions/difference');

module.exports = {
    command_data: {
        name: 'Fix Spelling',
        type: 3,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
    },
    cooldown: 60000,
    run: async (client, interaction, config) => {
        const text = interaction.targetMessage.content;
        if ((text.length < 4 || text.length > 1000) && interaction.user.id.toString() !== config.users.owner) return interaction.reply({ content: 'The text must be between 4 and 1000 characters.', ephemeral: true }) && client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });
        await interaction.deferReply({ ephemeral: false });

        const response = (await openai.responses.create({
            prompt: {
                "id": "pmpt_68c7fe146b808193aeec5143b21b07070fd4695495b8360e"
            },
            input: text
        })).output_text;

        const { crossedText, highlightedText } = difference(text, response);
        await interaction.editReply({
            embeds: [
                {
                    title: "Original Text",
                    description: crossedText,
                    color: 0xFF6961,
                },
                {
                    title: "Corrected Text",
                    description: highlightedText,
                    color: 0x77DD77,
                },
            ]
        });
    },
};