const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    command_data: {
        name: 'join',
        description: 'Joins the specified voice channel.',
        type: 1,
        dm_permission: false,
        options: [
            {
                name: 'channel',
                description: 'The voice channel to join.',
                type: 7,
                required: false,
                channel_types: [2],
            },
        ],
    },
    category: 'Voice',
    cooldown: 5000,
    run: async (client, interaction) => {
        const voiceChannel = interaction.options.getChannel('channel') || interaction.member.voice?.channel;
        // check if bot is already in voiceChannel (the same as voiceChannel)
        let connection = getVoiceConnection(interaction.guild.id);
        if (!voiceChannel) return interaction.reply('You must be in a voice channel or specify one to join.');

        if (connection?.joinConfig?.channelId === voiceChannel.id) return interaction.reply(`Already in ${voiceChannel}.`);
        if (!voiceChannel.joinable) return interaction.reply('I do not have permission to join that voice channel.');
        await joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await interaction.reply(`Joined the voice channel (${voiceChannel}).`);
    }
};