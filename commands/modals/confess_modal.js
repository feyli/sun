module.exports = {
    command_data: {
        name: 'confess_modal',
    },
    type: 'button',
    cooldown: 0,
    run: async (client, interaction) => {
        const confession = interaction.fields.getTextInputValue('confession_input');
        // discord.js has no getCheckboxValue() helper yet, so read the raw field.
        const anonymous = interaction.fields.getField('confession_anonymous').value === true;

        await interaction.reply({ content: 'Your confession has been sent!', ephemeral: true });

        await interaction.channel.send({
            embeds: [
                {
                    title: anonymous ? 'Anonymous confession' : 'Confession',
                    description: confession,
                    color: 0xffcc4d,
                    timestamp: new Date(),
                    author: anonymous ? null : {
                        name: interaction.user.username,
                        iconURL: interaction.user.displayAvatarURL(),
                    },
                },
            ],
        });
    },
};
