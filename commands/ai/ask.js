const { OpenAI } = require("openai");

module.exports = {
    command_data: {
        name: 'ask',
        description: 'Ask any question to answer through GPT-3.5 Turbo or GPT-4o',
        type: 1,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: 'question',
                description: 'The question you want to ask.',
                type: 3,
                required: true,
            },
            {
                name: 'model',
                description: 'The model to use.',
                type: 3,
                required: false,
                choices: [
                    {
                        name: 'GPT-3.5 Turbo',
                        value: 'gpt-3.5-turbo',
                    },
                    {
                        name: 'GPT-4o',
                        value: 'gpt-4o',
                    },
                ],
            },
            {
                name: 'attachment',
                description: 'An attachment to provide for context.',
                type: 11,
                required: false,
            }
        ],
    },
    category: 'AI',
    cooldown: 5000,
    owner_only: true,
    run: async (client, interaction) => {
        const attachment = interaction.options.getAttachment('attachment');
        const question = interaction.options.getString('question');

        await interaction.deferReply({ ephemeral: false });

        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });

        let messages = [
            {
                role: 'assistant',
                content: 'Model: ' + 'gpt-4o mini' + '\n' +
                    'Date and time: ' + new Date().toLocaleString() + '\n' +
                    'User: ' + interaction.user.username
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: question,
                    },
                ],
            },
        ];

        if (attachment) {
            messages[1].content.push({
                type: 'image_url',
                image_url: {
                    url: attachment.url,
                    detail: 'low',
                },
            },);
        }

        const response = await new Promise((resolve) =>
            openai.beta.threads.createAndRunStream({
                assistant_id: "asst_yCOmJA2njcZzjIoko4lrIJqI",
                thread: {
                    messages: messages,
                },
            }).on('textDone', (text) => resolve(text.value))
        );

        await interaction.editReply({
            embeds: [
                {
                    description: question,
                    author: {
                        name: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    color: 0x239FDF,
                    image: attachment ? { url: attachment.url } : null,
                },
                {
                    description: response,
                    author: {
                        name: 'Sun',
                        icon_url: client.user.displayAvatarURL({ dynamic: true }),
                    },
                    color: 0xB6BABB,
                }
            ]
        });
    }
};