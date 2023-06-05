// noinspection JSUnresolvedVariable

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

        const db = client.arcaneDb;

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'set': {
                const nickname = interaction.options.getString('pseudo');

                const res = await fetch('https://api.mojang.com/users/profiles/minecraft/' + nickname).then(res => res.json()).catch(() => null);
                if (!res) return interaction.editReply(`Je n'ai pu envoyer de requête à Mojang. Veuillez réessayer plus tard.`);

                if (res.errorMessage && res.errorMessage.includes("Couldn't find")) return interaction.editReply(`Le pseudo \`${nickname}\` n'existe pas sur Minecraft. Veuillez indiquer un pseudo valide.`);

                const [result] = await db.query('SELECT user_id FROM players WHERE player_uuid = ?', [res.id]);
                if (result) {
                    if (result.user_id === interaction.user.id) return interaction.editReply(`Ce profil Minecraft est déjà lié à votre profil Discord.`)
                    else return interaction.editReply(`<@${result.user_id}> a déjà lié ce profil Minecraft à son profil Discord.`)
                }

                await db.query('INSERT INTO players (user_id, player_uuid) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_uuid = ?', [interaction.user.id, res.id, res.id])

                await interaction.editReply(`Ton pseudo Minecraft a bien été défini sur : \`${nickname}\` !`);

                break;
            }
            case 'remove': {
                await db.query('DELETE FROM players WHERE user_id = ?', [interaction.user.id]);

                await interaction.editReply({ content: `Ton pseudo Minecraft a bien été supprimé du système !` });

                break;
            }
        }
        await interaction.member.roles.remove('1108870536391565422');
    }
};