require('dotenv').config();
const {Client, Collection} = require('discord.js');
const fs = require('fs');
const config = require('./config/main');

const client = new Client(config.client.constructor);
client.sunPool = null;
client.arcanePool = null;

client.commands = new Collection();
client.interactions = new Collection();
client.cooldowns = new Collection();

module.exports = client;

fs.readdirSync('./handlers').forEach((handler) => {
    console.log('[INFO] Handler loaded: ' + handler);

    require('./handlers/' + handler)(client);
});

// noinspection JSIgnoredPromiseFromCall
client.login(config.client.token);