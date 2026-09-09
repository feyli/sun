import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Deletes the specified amount of messages in the active channel.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
            .addIntegerOption((option) => option.setName('amount').setDescription('The amount of messages to delete.').setRequired(true).setMinValue(1).setMaxValue(100))
            .addUserOption((option) => option.setName('user').setDescription('The user to delete messages from.')),
    ),
    category: 'Utility',
    cooldown: 5000,
    guildOnly: true,
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount', true);
        const user = interaction.options.getUser('user');
        const channel = interaction.channel;
        if (!channel) return interaction.reply({content: 'I cannot access this channel.', flags: MessageFlags.Ephemeral});

        await interaction.deferReply({flags: MessageFlags.Ephemeral});

        const messages = await channel.messages.fetch();

        if (user) {
            const filtered = messages.filter((message) => message.author.id === user.id).first(amount);
            await channel.bulkDelete(filtered, true);
            await interaction.editReply({embeds: [{description: 'Deleted ' + amount + ' messages from ' + user.toString() + '.'}]});
        } else {
            await channel.bulkDelete(amount, true);
            await interaction.editReply({
                embeds: [{description: 'Deleted ' + amount + " messages. Please note that some messages might have escaped the deletion if they're any older than 2 weeks."}],
            });
        }

        setTimeout(() => {
            interaction.deleteReply().catch(console.error);
        }, 5000);
    },
});
