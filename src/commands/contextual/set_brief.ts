import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, ContextMenuCommandBuilder, ModalBuilder, TextInputStyle } from 'discord.js';
import { eq } from 'drizzle-orm';
import { WT_CAMPAIGN_GUILD_ID } from '../../constants';
import { guilds, type MissionBrief } from '../../db/schema';
import { defineMessageCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

export default defineMessageCommand({
    data: guildsOnly(new ContextMenuCommandBuilder().setName('Set Mission Brief').setType(ApplicationCommandType.Message)),
    guildId: WT_CAMPAIGN_GUILD_ID,
    guildOnly: true,
    async execute(interaction) {
        const date = Date.now().toString();

        const modal = new ModalBuilder()
            .setCustomId('set_brief_modal_' + date)
            .setTitle('Create a Mission Brief')
            .addLabelComponents(
                (label) =>
                    label
                        .setLabel('Mission Briefing Title')
                        .setTextInputComponent((input) => input.setCustomId('title').setStyle(TextInputStyle.Short).setPlaceholder('Enter brief title here').setRequired(false)),
                (label) =>
                    label
                        .setLabel('Mission Briefing Description')
                        .setTextInputComponent((input) =>
                            input.setCustomId('description').setStyle(TextInputStyle.Paragraph).setPlaceholder('Enter brief description here').setValue(interaction.targetMessage.content),
                        ),
            );

        await interaction.showModal(modal);
        const modalInteraction = await interaction
            .awaitModalSubmit({filter: (submission) => submission.customId.endsWith(date), time: 120_000})
            .catch((error: unknown) => {
                console.log(error);
                return null;
            });
        if (!modalInteraction) return;

        const brief: MissionBrief = {
            title: modalInteraction.fields.getTextInputValue('title'),
            description: modalInteraction.fields.getTextInputValue('description'),
        };
        console.log(JSON.stringify(brief));

        interaction.client.db.update(guilds).set({missionBrief: brief}).where(eq(guilds.guildId, interaction.guild.id)).catch(console.error);

        await modalInteraction.reply({
            embeds: [{title: 'Mission Brief Set', description: 'Preview the brief in this channel or send it to everyone!'}],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder().setCustomId('preview_brief').setLabel('Preview Mission Brief').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('send_brief').setLabel('Send Mission Brief').setStyle(ButtonStyle.Secondary),
                ),
            ],
        });
    },
});
