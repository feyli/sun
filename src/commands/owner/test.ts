import { SlashCommandBuilder } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';

export default defineSlashCommand({
    data: anywhere(new SlashCommandBuilder().setName('test').setDescription('Test command.')),
    ownerOnly: true,
    category: 'Development',
    async execute(interaction) {
        await interaction.deferReply();
        await interaction.editReply('738852700816670822');
    },
});
