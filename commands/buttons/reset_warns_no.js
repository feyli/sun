// cancel the operation of resetting warns and delete the message

module.exports = {
    command_data: {
        name: 'reset_warns_no',
    },
    type: 'button',
    run: async (client, interaction) => {
        if (interaction.user.id !== interaction.message.embeds[0].footer.iconURL.split('/')[4]) return interaction.reply({ content: 'You are not the user who initiated the command.', ephemeral: true });

        await interaction.message.edit({
            embeds: [{
                title: 'Operation Cancelled',
                description: 'Nothing changed.',
                color: 0x65cdb6,
                footer: {
                    text: 'Cancelled by ' + interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                }
            }], components: []
        });
    }
};