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
        const model = attachment ? 'gpt-4o' : interaction.options.getString('model') || 'gpt-3.5-turbo';
        const question = interaction.options.getString('question');

        await interaction.deferReply({ ephemeral: false });

        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });

        let params = {
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant answering questions sent through Discord. Your name as a Discord application is Sun (which you do not state at the beginning of your response). You must include both Discord text formatting and emojis. Unless user states otherwise, make concise but precise answers and do not repeat yourself.' + '\n' +
                        'Model: ' + model + '\n' +
                        'Date and time: ' + new Date().toLocaleString() + '\n' +
                        'User: ' + interaction.user.username + '\n'
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
            ],
            model: model,
        };

        if (attachment) {
            params.messages[1].content.push({
                type: 'image_url',
                image_url: {
                    url: attachment.url,
                    detail: 'low',
                },
            },);
        }

        let response = await openai.chat.completions.create(params);
        response = response.choices[0].message.content;
        await interaction.editReply({
            embeds: [
                {
                    description: question,
                    author: {
                        name: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    color: 0x000000,
                },
                {
                    description: response,
                    author: {
                        name: 'Sun',
                        icon_url: client.user.displayAvatarURL({ dynamic: true }),
                        color: 0x000000,
                    }
                }
            ]
        });
    }
};