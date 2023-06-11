const mariadb = require('mariadb');
const config = require('../config/main');

module.exports = async (client) => {
    const pool = mariadb.createPool({
        host: config.databases[0].host,
        user: config.databases[0].user,
        password: config.databases[0].password,
        database: config.databases[0].database,
        bigIntAsNumber: true
    });

    client.db = await pool.getConnection();
    console.log('[INFO] Database connection established!');

    client.on('ready', async () => {
        client.guilds.cache.forEach((guild) => {
            client.db.query('INSERT INTO guilds (guild_id) VALUES (?) ON DUPLICATE KEY UPDATE guild_id=?',
                [guild.id, guild.id]).catch(console.error);
        });
    });

    const pool2 = mariadb.createPool({
        host: config.databases[1].host,
        user: config.databases[1].user,
        password: config.databases[1].password,
        database: config.databases[1].database,
        bigIntAsNumber: true
    });

    client.arcaneDb = await pool2.getConnection();
    console.log('[INFO] Arcane Database connection established!');

    // add repeating keepAlive to both databases
    setInterval(async () => {
        await client.db.query('SELECT 1');
        await client.arcaneDb.query('SELECT 1');
    });
};