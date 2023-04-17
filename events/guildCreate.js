const client = require('../index')

client.on('guildCreate', (guild) => {
        const db = client.db;

        db.query('INSERT INTO guilds (guild_id) VALUES (?) ON DUPLICATE KEY UPDATE guild_id=?', [guild.id, guild.id]).catch(console.error);
    }
)