const { Client, Collection } = require('discord.js')
const fs = require('fs')
const config = require('./config/main')

// noinspection
const client = new Client(config.client.constructor)

client.commands = new Collection()
client.interactions = new Collection()
client.cooldowns = new Collection()

module.exports = client

fs.readdirSync('./handlers').forEach((handler) => {
  console.log('[INFO] Handler loaded: ' + handler)

  require('./handlers/' + handler)(client, config)
})

// noinspection JSIgnoredPromiseFromCall
client.login(config.client.token)