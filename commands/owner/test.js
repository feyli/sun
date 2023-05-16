const { getVoiceConnection, createAudioPlayer, createAudioResource, generateDependencyReport } = require('@discordjs/voice');

module.exports = {
    command_data: {
        name: 'test',
        description: 'Test command.',
        type: 1,
        default_member_permissions: 276824066,
        options: [],
    },
    owner_only: true,
    cooldown: 0,
    category: 'Development',
    run: async (client, interaction) => {
        generateDependencyReport()

        const connection = getVoiceConnection(interaction.guild.id);

        const player = createAudioPlayer();

        connection.subscribe(player);

        const resource = createAudioResource('https://cdn.discordapp.com/attachments/1092532455954727075/1102350292881789091/40000_Feet_over_the_Prairies.mp3');

        player.play(resource);

        interaction.reply('Test command.');
    }
};