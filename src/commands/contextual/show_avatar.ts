import { ApplicationCommandType, ContextMenuCommandBuilder, MessageFlags } from 'discord.js';
import { defineUserCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';

export default defineUserCommand({
    data: anywhere(new ContextMenuCommandBuilder().setName('Show Avatar').setType(ApplicationCommandType.User)),
    async execute(interaction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const target = await interaction.client.users.fetch(interaction.targetId);
        const avatar = target.displayAvatarURL({size: 4096});
        await interaction.editReply({
            embeds: [
                {
                    title: `${target.username}'s Avatar`,
                    image: {url: avatar},
                    url: avatar,
                    color: 0x000000,
                    timestamp: new Date().toISOString(),
                },
            ],
        });
    },
});
