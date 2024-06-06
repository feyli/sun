module.exports = {
    command_data: {
        name: 'Invite',
        type: 1,
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    run: async (client, interaction) => {
        await interaction.reply({
            content: "Invite me to your **server** or add me to your **account** by clicking [here](https://discord.com/oauth2/authorize?client_id=743826135061889028) or by clicking \"Add App\" under my profile!\n" +
            "After adding me to your account, you'll be able to use me in any server or conversation you're in! Don't worry, I only have access to the message or profile you interact with me in. [Learn more](https://canary.discord.com/oauth2/authorize?client_id=743826135061889028).",
            ephemeral: false,
        });
    },
}