const client = require('../index');

client.on('guildDelete', (guild) => {
    const db = client.db;

    db.query('DELETE FROM guilds WHERE guild_id = ?', [guild.id]).catch(console.error);
})