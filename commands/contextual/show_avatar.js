module.exports = {
    command_data: {
        name: 'Show Avatar',
        type: 2,
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });
        const target = await client.users.fetch(interaction.targetId);
        const avatar = target.displayAvatarURL({ size: 4096 });
        await interaction.editReply({
            embeds: [{
                title: `${target.username}'s Avatar`,
                image: { url: avatar },
                url: avatar,
                color: 0x000000,
                timestamp: new Date()
            }]
        });
    },
};