const { OpenAI } = require("openai");
const difference = require('../../complex_functions/difference');

module.exports = {
    command_data: {
        name: 'Fix Spelling',
        type: 3,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        cooldown: 60000,
    },
    run: async (client, interaction) => {
        const text = interaction.targetMessage.content;
        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });
        await interaction.deferReply({ ephemeral: false });
        let response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an expert copywriter, grammatician, and linguist, emulating an AP Literature and grammar teacher. Your task is to proofread the provided text, maintaining the same style and intent, while focusing on:\n" +
                        "Proper spelling\n" +
                        "Better grammar\n" +
                        "Improved readability\n" +
                        "Identify and fix technical errors, then review again for any missed mistakes. Use verified language conventions. Preserve the original meaning without adding unnecessary language.\n" +
                        "Your ultimate goal is to produce the optimal version of the text grammatically while retaining the same style and meaning. Immediately begin proofreading and editing when provided with the essay.\n" +
                        "Check, review, and correct my grammar. Do not correct style issues. Focus on identifying and correcting common grammatical mistakes, such as major punctuation errors, subject-verb agreement issues, and improper use of tenses. Maintain the original tone and style, avoiding assumptions about the intended meaning. Reply with the corrected version of the text, without any comment."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.5,
            top_p: 1,
        });
        response = response.choices[0].message.content;
        const { crossedText, highlightedText } = difference(text, response);
        await interaction.editReply({
            embeds: [
                {
                    title: "Original Text",
                    description: crossedText,
                },
                {
                    title: "Corrected Text",
                    description: highlightedText,
                },
            ]
        });
    },
};