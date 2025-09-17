const { OpenAI } = require("openai");

module.exports = {
    command_data: {
        name: 'ask',
        description: 'Ask any question to answer using GPT-4.1 nano or GPT-4.1',
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
                name: 'gpt5',
                description: 'Use GPT-5?',
                type: 5,
                required: false,
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
        const model = interaction.options.getBoolean('gpt5') ? 'gpt-5' : 'gpt-5-mini';
        const question = interaction.options.getString('question');

        await interaction.deferReply({ ephemeral: false });

        const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });

        // Gather context variables with safe fallbacks
        const channelName = interaction?.channel?.name ?? 'Direct Message';
        const guildName = interaction?.guild?.name ?? 'Direct Message';
        const username = interaction?.user?.username ?? 'Unknown User';

        // Helper: check if the provided attachment is a supported image
        const isSupportedImage = (att) => {
            if (!att) return false;
            const allowedMime = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
            const ct = (att.contentType || att.content_type || '').toLowerCase();
            if (ct && allowedMime.has(ct)) return true;
            // fallback by extension if contentType is missing
            const name = (att.name || att.filename || att.url || '').toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => name.endsWith(ext));
        };

        let input = [
            {
                role: 'system',
                content: [
                    { type: 'input_text', text: `Context\n- Guild: ${guildName}\n- Channel: ${channelName}\n- User: ${username}` }
                ]
            },
            {
                role: 'user',
                content: [
                    { type: "input_text", text: question }
                ]
            }
        ];

        // Track whether we attempted to include an image and whether it's valid
        let includedImage = false;
        let imageUnsupportedNote = null;

        if (attachment) {
            if (isSupportedImage(attachment)) {
                input[1].content.push({
                    type: 'input_image',
                    image_url: attachment.url,
                    detail: 'low'
                });
                includedImage = true;
            } else {
                // Don't include unsupported image types to avoid API errors
                imageUnsupportedNote = 'Note: The provided attachment is not a supported image format (supported: PNG, JPG/JPEG, WEBP, GIF). Proceeding without the image.';
            }
        }

        let response;
        try {
            response = await openai.responses.create({
                prompt: {
                    "id": "pmpt_68c801249bd081948cc592b158f1ca2b050ee8a93365a43a",
                    variables: {
                        channelName: channelName,
                        guildName: guildName,
                        username: username
                    }
                },
                model: model,
                input
            });
        } catch (err) {
            if (includedImage) {
                // Retry once without the image
                try {
                    const textOnlyInput = [input[0], { role: 'user', content: [{ type: 'input_text', text: question }] }];
                    response = await openai.responses.create({
                        prompt: {
                            "id": "pmpt_68c801249bd081948cc592b158f1ca2b050ee8a93365a43a",
                            variables: {
                                channelName: channelName,
                                guildName: guildName,
                                username: username
                            }
                        },
                        model: model,
                        input: textOnlyInput
                    });
                    imageUnsupportedNote = imageUnsupportedNote || 'Note: I couldn\'t process the image, so I answered based on text only.';
                } catch (retryErr) {
                    const safeMessage = 'Sorry, I couldn\'t process your request right now. The attached image may be in an unsupported format.';
                    await interaction.editReply({
                        embeds: [
                            {
                                description: question,
                                author: {
                                    name: interaction.user.username,
                                    icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                                },
                                color: 0x239FDF,
                                image: attachment && isSupportedImage(attachment) ? { url: attachment.url } : null,
                            },
                            {
                                description: safeMessage,
                                author: {
                                    name: 'Sun',
                                    icon_url: client.user.displayAvatarURL({ dynamic: true }),
                                },
                                color: 0xED4245,
                                footer: { text: `Model: ${model}` }
                            }
                        ]
                    });
                    return;
                }
            } else {
                // No image involved, reply gracefully
                const safeMessage = 'Sorry, I couldn\'t process your request right now.';
                await interaction.editReply({
                    embeds: [
                        {
                            description: question,
                            author: {
                                name: interaction.user.username,
                                icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                            },
                            color: 0x239FDF
                        },
                        {
                            description: safeMessage,
                            author: {
                                name: 'Sun',
                                icon_url: client.user.displayAvatarURL({ dynamic: true }),
                            },
                            color: 0xED4245,
                            footer: { text: `Model: ${model}` }
                        }
                    ]
                });
                return;
            }
        }

        // Compose the answer text with any note about unsupported image
        const answerText = [response?.output_text || '']
            .concat(imageUnsupportedNote ? ['\n\n' + imageUnsupportedNote] : [])
            .join('');

        await interaction.editReply({
            embeds: [
                {
                    description: question,
                    author: {
                        name: interaction.user.username,
                        icon_url: interaction.user.displayAvatarURL({ dynamic: true }),
                    },
                    color: 0x239FDF,
                    image: attachment && isSupportedImage(attachment) ? { url: attachment.url } : null,
                },
                {
                    description: answerText,
                    author: {
                        name: 'Sun',
                        icon_url: client.user.displayAvatarURL({ dynamic: true }),
                    },
                    color: 0xB6BABB,
                    footer: { text: `Model: ${model}` }
                }
            ]
        });
    }
};
