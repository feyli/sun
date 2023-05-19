module.exports = {
    command_data: {
        name: 'mcpseudo',
        description: 'Permet de définir son pseudo Minecraft (pour le rôle "En jeu").',
        type: 1,
        dm_permission: false,
        options: [
            {
                name: 'set',
                description: 'Définis ton pseudo Minecraft.',
                type: 1,
                options: [
                    {
                        name: 'pseudo',
                        description: 'Le pseudo Minecraft.',
                        type: 3,
                        required: true,
                        max_length: 16
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Supprime ton pseudo du système.',
                type: 1,
                options: []
            }
        ]
    },
    category: 'Minecraft',
    cooldown: 10000,
    guild_id: '1108029635096223814',
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: false });

        const db = client.db;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'set': {
                const pseudo = interaction.options.getString('pseudo');

                await db.query('INSERT INTO arcane_players (user_id, player_username) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_username = ?', [interaction.user.id, pseudo, pseudo]);

                await interaction.editReply({ content: `Ton pseudo Minecraft a bien été défini sur : \`${pseudo}\` !` });

                break;
            }
            case 'remove': {
                await db.query('DELETE FROM arcane_players WHERE user_id = ?', [interaction.user.id]);

                await interaction.editReply({ content: `Ton pseudo Minecraft a bien été supprimé du système !` });

                break;
            }
        }
        await interaction.member.roles.remove('1108870536391565422');
    }
};