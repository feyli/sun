const client = require('../index');

client.on('guildMemberAdd', async () => {
  await require('../things/memberCounter')();
});