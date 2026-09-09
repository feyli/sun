import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('rolesort')
            .setDescription('Displays a list of the members of a role.')
            .addRoleOption((option) => option.setName('role').setDescription('The role to get a list of members for.').setRequired(true)),
    ),
    category: 'Utility',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const role = interaction.options.getRole('role', true);
        const members = role.members.map((member) => member.toString()).join(', ');
        await interaction.editReply({
            embeds: [{title: `Members of \`${role.name}\``, description: members}],
        });
    },
});
