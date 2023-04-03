const client = require('../index');
const config = require('../config/main');

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        const interactionModuleCustomId = await client.interactions.get(interaction.customId);

        if (!interactionModuleCustomId) return;

        interactionModuleCustomId.run(client, interaction);
    } else return;
});