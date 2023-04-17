const mariadb = require('mariadb')
const config = require('../config/main')

module.exports = async (client) => {
  const pool = mariadb.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
  })

  client.db = await pool.getConnection()

  console.log('[INFO] Database connection established!')

  client.on('ready', async () => {
    client.guilds.cache.forEach((guild) => {
      client.db.query('INSERT INTO guilds (guild_id) VALUES (?) ON DUPLICATE KEY UPDATE guild_id=?',
        [guild.id, guild.id]).catch(console.error)
    })
  })
}