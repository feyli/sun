const mariadb = require('mariadb');
const config = require('../config/main');

module.exports = async (client) => {
    client.sunPool = mariadb.createPool({
        host: config.databases[0].host,
        user: config.databases[0].user,
        password: config.databases[0].password,
        database: config.databases[0].database,
        connectionLimit: 10,
        bigIntAsNumber: true
    });
    console.log('[INFO] Database connection established!');

    client.on('ready', async () => {
        client.guilds.cache.forEach((guild) => {
            client.sunPool.query('INSERT INTO guilds (guild_id) VALUES (?) ON DUPLICATE KEY UPDATE guild_id=?',
                [guild.id, guild.id]).catch(console.error);
        });
    });

    client.arcanePool = mariadb.createPool({
        host: config.databases[1].host,
        user: config.databases[1].user,
        password: config.databases[1].password,
        database: config.databases[1].database,
        bigIntAsNumber: true
    });
    console.log('[INFO] Arcane Database connection established!');
};