import { SlashCommandBuilder, type APIEmbed, type Attachment } from 'discord.js';
import OpenAI from 'openai';
import { env } from '../../env';
import { defineSlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';
import { getChannelName } from '../../utils/interactions';

type ResponseInputItem = OpenAI.Responses.ResponseInputItem;
type ResponseInputContent = OpenAI.Responses.ResponseInputContent;
type ResponseCreateParams = OpenAI.Responses.ResponseCreateParamsNonStreaming;

const PROMPT_ID = 'pmpt_68c801249bd081948cc592b158f1ca2b050ee8a93365a43a';
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

/** Whether the attachment is an image the model can process. */
function isSupportedImage(attachment: Attachment | null): attachment is Attachment {
    if (!attachment) return false;

    const contentType = (attachment.contentType ?? '').toLowerCase();
    if (contentType && SUPPORTED_IMAGE_TYPES.has(contentType)) return true;

    // Fall back to the extension if the content type is missing.
    const name = (attachment.name || attachment.url).toLowerCase();
    return SUPPORTED_IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

export default defineSlashCommand({
    data: anywhere(
        new SlashCommandBuilder()
            .setName('ask')
            .setDescription('Ask any question to answer using GPT-4.1 nano or GPT-4.1')
            .addStringOption((option) => option.setName('question').setDescription('The question you want to ask.').setRequired(true))
            .addBooleanOption((option) => option.setName('gpt5').setDescription('Use GPT-5?'))
            .addAttachmentOption((option) => option.setName('attachment').setDescription('An attachment to provide for context.')),
    ),
    category: 'AI',
    cooldown: 5000,
    ownerOnly: true,
    async execute(interaction) {
        const attachment = interaction.options.getAttachment('attachment');
        const model = interaction.options.getBoolean('gpt5') ? 'gpt-5' : 'gpt-5-mini';
        const question = interaction.options.getString('question', true);

        await interaction.deferReply();

        const openai = new OpenAI({apiKey: env.openAiKey});

        // Context variables with safe fallbacks
        const channelName = getChannelName(interaction.channel) ?? 'Direct Message';
        const guildName = interaction.guild?.name ?? 'Direct Message';
        const username = interaction.user.username;

        const imageUrl = isSupportedImage(attachment) ? attachment.url : null;
        let imageNote: string | null = null;
        if (attachment && !imageUrl) {
            // Don't include unsupported attachment types to avoid API errors
            imageNote = 'Note: The provided attachment is not a supported image format (supported: PNG, JPG/JPEG, WEBP, GIF). Proceeding without the image.';
        }

        const systemMessage: ResponseInputItem = {
            role: 'system',
            content: [{type: 'input_text', text: `Context\n- Guild: ${guildName}\n- Channel: ${channelName}\n- User: ${username}`}],
        };
        const questionContent: ResponseInputContent = {type: 'input_text', text: question};
        const userContent: ResponseInputContent[] = imageUrl ? [questionContent, {type: 'input_image', image_url: imageUrl, detail: 'low'}] : [questionContent];

        const buildRequest = (content: ResponseInputContent[]): ResponseCreateParams => ({
            prompt: {id: PROMPT_ID, variables: {channelName, guildName, username}},
            model,
            input: [systemMessage, {role: 'user', content}],
        });

        const questionEmbed: APIEmbed = {
            description: question,
            author: {name: interaction.user.username, icon_url: interaction.user.displayAvatarURL()},
            color: 0x239fdf,
            image: imageUrl ? {url: imageUrl} : undefined,
        };
        const answerEmbed = (description: string, color: number): APIEmbed => ({
            description,
            author: {name: 'Sun', icon_url: interaction.client.user.displayAvatarURL()},
            color,
            footer: {text: `Model: ${model}`},
        });

        let response: OpenAI.Responses.Response;
        try {
            response = await openai.responses.create(buildRequest(userContent));
        } catch {
            if (!imageUrl) {
                await interaction.editReply({embeds: [questionEmbed, answerEmbed("Sorry, I couldn't process your request right now.", 0xed4245)]});
                return;
            }

            // Retry once without the image
            try {
                response = await openai.responses.create(buildRequest([questionContent]));
                imageNote ??= "Note: I couldn't process the image, so I answered based on text only.";
            } catch {
                await interaction.editReply({
                    embeds: [questionEmbed, answerEmbed("Sorry, I couldn't process your request right now. The attached image may be in an unsupported format.", 0xed4245)],
                });
                return;
            }
        }

        const answerText = response.output_text + (imageNote ? '\n\n' + imageNote : '');

        await interaction.editReply({embeds: [questionEmbed, answerEmbed(answerText, 0xb6babb)]});
    },
});
