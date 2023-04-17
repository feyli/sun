const {getVoiceConnection} = require('@discordjs/voice');

module.exports = {
    command_data: {
        name: 'leave',
        description: 'Leaves any voice channel.',
        type: 1,
        options: [],
    },
    category: 'Voice',
    cooldown: 5000,
    run: async (client, interaction) => {
        const connection = getVoiceConnection(interaction.guild.id);
        if (!connection) return interaction.reply('Not in a voice channel.');
        connection.disconnect();
        await interaction.reply(`Left the voice channel./join`);
    }
};