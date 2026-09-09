import { MessageFlags } from 'discord.js';
import { defineButton } from '../../types/commands';
import { getMissionBrief } from '../../utils/missionBrief';

export default defineButton({
    customId: 'preview_brief',
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        const brief = await getMissionBrief(interaction.client.db, interaction.guild.id);
        if (!brief) return interaction.editReply("There doesn't seem to be any mission brief saved.");

        await interaction.editReply({
            embeds: [
                {
                    title: brief.title ?? undefined,
                    description: brief.description ?? undefined,
                    footer: {text: 'Mission Brief Preview'},
                    author: {name: 'Campagne War Thunder', icon_url: interaction.guild.iconURL() ?? undefined},
                },
            ],
        });
    },
});
