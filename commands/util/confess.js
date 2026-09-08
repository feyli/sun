const { ModalBuilder } = require("discord.js");

module.exports = {
    command_data: {
        name: 'confess',
        description: 'Confess (anonymously or not) your feelings to the world.',
        type: 1,
        integration_types: [0],
        contexts: [0],
    },
    category: 'Utility',
    cooldown: 30000,
    perms: null,
    owner_only: false,
    run: async (client, interaction) => {
        const modal = new ModalBuilder().setCustomId('confess_modal').setTitle('Confession').addLabelComponents(
            (label) => label.setLabel('What would you like to confess?').setTextInputComponent(
                (input) => input.setCustomId('confession_input').setStyle(2).setRequired(true)),
            (label) => label.setLabel('Post anonymously').setDescription('Uncheck this to show your name on the confession.').setCheckboxComponent(
                (checkbox) => checkbox.setCustomId('confession_anonymous').setDefault(true)));

        await interaction.showModal(modal);
    },
};
