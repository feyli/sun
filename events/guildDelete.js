const client = require('../index');

client.on('guildDelete', (guild) => {
    client.db.query('DELETE FROM guilds WHERE guild_id = ?', [guild.id]).catch(console.error);

    client.user.setPresence({
        activities: [
            {
                type: 0,
                name: `${client.guilds.cache.size} servers`
            }
        ]
    });
});