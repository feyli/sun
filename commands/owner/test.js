module.exports = {
    command_data: {
        name: 'test',
        description: 'Test command.',
        type: 1,
        options: []
    },
    owner_only: true,
    cooldown: 0,
    category: 'Development',
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        await interaction.editReply("<@738852700816670822>");
    }
};