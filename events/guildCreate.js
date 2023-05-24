const client = require('../index');

client.on('guildCreate', (guild) => {
    client.db.query('INSERT INTO guilds (guild_id) VALUES (?) ON DUPLICATE KEY UPDATE guild_id=?', [guild.id, guild.id]).catch(console.error);

    client.user.setPresence({
        activities: [
            {
                type: 3,
                name: `${client.guilds.cache.size} servers`
            }
        ]
    });
});