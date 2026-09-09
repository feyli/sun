import { SlashCommandBuilder } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { anywhere } from '../../utils/commandScopes';

export default defineSlashCommand({
    data: anywhere(new SlashCommandBuilder().setName('invite').setDescription("I'll write a cool message to let people know how to add me.")),
    category: 'Bot',
    async execute(interaction) {
        await interaction.reply({
            content:
                'Invite me to your **server** or add me to your **account** by clicking [here](https://discord.com/oauth2/authorize?client_id=743826135061889028) or by clicking "Add App" under my profile!\n' +
                "After adding me to your account, you'll be able to use me in __any__ server or conversation you're in!\n" +
                "**Don't worry**, I only have access to the **message** or **profile** you interact with me in. [Learn more](https://canary.discord.com/oauth2/authorize?client_id=743826135061889028).",
        });
    },
});
