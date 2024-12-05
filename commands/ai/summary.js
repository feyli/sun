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
        if ((text.length < 100) && interaction.user.id.toString() !== config.users.owner) return interaction.reply({ content: 'The text must be at least 4 characters long.', ephemeral: true }) && client.cooldowns.get(interaction.commandName).delete(interaction.user.id);
        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });
        await interaction.deferReply({ ephemeral: false });
        const response = await new Promise((resolve) => openai.beta.threads.createAndRunStream({
                assistant_id: "asst_s0HA2zuPSPn0W2fRYspZ3sOt",
                thread: {
                    messages: [
                        {
                            role: "user",
                            content: text
                        }
                    ],
                }
            }).on('textDone', (text) => resolve(text.value))
        );

        await interaction.editReply({
            embeds: [
                {
                    title: ":sparkles: Summary",
                    description: response,
                    color: 0xFFAC32,
                },
            ]
        });
    },
};