const config = require('../config/main');
const client = require('../index');

client.on('ready', async () => {
    console.log('Logged in as ' + client.user.tag + '!');
    // noinspection JSUnresolvedFunction
    client.channels.cache.get(config.channels.logging_channel).send({
        embeds: [
            {
                title: 'Bot is online!',
                color: 0x00ff00,
                timestamp: new Date(),
            },
        ],
    });

    await require('../things/arcaneUpdate')();
    setInterval(() => {
        require('../things/arcaneUpdate')();
    }, 10000);
    await require('../things/memberCounter')();
    setInterval(() => {
        require('../things/memberCounter')();
    }, 900000);
    await require('../things/minecraftCounter')();
    setInterval(() => {
        require('../things/minecraftCounter')();
    }, 900000);
});