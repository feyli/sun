const client = require('../index');

client.on('guildDelete', (guild) => {
    client.sunPool.query('DELETE FROM guilds WHERE guild_id = ?', [guild.id]).catch(console.error);

    client.user.setPresence({
        activities: [
            {
                type: 3,
                name: `${client.guilds.cache.size} servers`
            }
        ]
    });
});