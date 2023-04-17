const client = require('../index');

client.on('guildMemberRemove', async () => {
  await require('../things/memberCounter')();
});