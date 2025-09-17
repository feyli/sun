const { OpenAI } = require("openai");

module.exports = {
    command_data: {
        name: 'Summarize',
        type: 3,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
    },
    cooldown: 60000,
    run: async (client, interaction, config) => {
        const text = interaction.targetMessage.content;
        if ((text.length < 100) && interaction.user.id.toString() !== config.users.owner) return interaction.reply({ content: 'The text must be at least 100 characters long.', ephemeral: true }) && client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });
        await interaction.deferReply({ ephemeral: false });
        const response = (await openai.responses.create({
            prompt: {
                "id": "pmpt_68c7fdde04d08197b86cc52fc391d26709cbb4becaaa78f1"
            },
            input: text
        })).output_text;

        const jsonRes = JSON.parse(response).catch(e => {
            console.error(e);
            return interaction.editReply({ content: 'Failed to parse the response from the AI.', ephemeral: true });
        });

        await interaction.editReply({
            embeds: [
                {
                    title: ":sparkles: Summary",
                    description: `### Short Summary:\n${jsonRes["short_summary"]}\n\n### Key Points:\n${jsonRes["key_information"].map((point, index) => `${index + 1}. ${point}`).join('\n')}`,
                    color: 0xFFAC32,
                },
            ]
        });
    },
};