import { MessageFlags, ModalBuilder, SlashCommandBuilder, TextInputStyle } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';
import { guilds } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export default defineSlashCommand({
    data: guildsOnly(new SlashCommandBuilder().setName('confess').setDescription('Confess (anonymously or not) your feelings to the world.')),
    category: 'Utility',
    cooldown: 30000,
    guildOnly: true,
    async execute(interaction) {
        const [row] = await interaction.client.db
            .select({confessionChannelId: guilds.confessionChannelId})
            .from(guilds)
            .where(eq(guilds.guildId, interaction.guild.id));

        if (!row?.confessionChannelId) return interaction.reply({content: "It seems like this server hasn't set up a confession channel yet. Please reach out to the server's admins to set up this feature.", flags: MessageFlags.Ephemeral});

        const modal = new ModalBuilder()
            .setCustomId('confess_modal')
            .setTitle('Confession')
            .addLabelComponents(
                (label) =>
                    label
                        .setLabel('What would you like to confess?')
                        .setTextInputComponent((input) => input.setCustomId('confession_input').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                (label) =>
                    label
                        .setLabel('Post anonymously')
                        .setDescription('Uncheck this to show your name on the confession.')
                        .setCheckboxComponent((checkbox) => checkbox.setCustomId('confession_anonymous').setDefault(true)),
            );

        await interaction.showModal(modal);
    },
});
