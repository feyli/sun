// reset warns of the entire server

module.exports = {
    command_data: {
        name: 'reset_warns_yes',
    },
    type: 'button',
    run: async (client, interaction) => {
        if (interaction.user.id !== interaction.message.embeds[0].footer.iconURL.split('/')[4]) return interaction.reply({ content: 'You are not the user who initiated the command.', ephemeral: true });
        if (!interaction.memberPermissions.has('8')) return interaction.reply({
            embeds: [{
                title: 'Missing Permission',
                description: 'You are missing the `ADMINISTRATOR` permission.',
                color: 0xf26448,
            }], ephemeral: true
        });

        const db = client.db;

        await db.query('DELETE FROM warns WHERE guild_id = ?', [interaction.guild.id]);

        await interaction.message.edit({
            embeds: [{
                title: 'Warns Reset',
                description: 'All warns have been reset.',
                color: 0x4caf50,
                footer: {
                    text: 'Requested by ' + interaction.user.username,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                }
            }], components: []
        });
    }
};