const { ClientIntents, ClientPartials } = require('discord.js-v14-helper')

module.exports = {
  // Client configuration:
  client: {
    constructor: {
      intents: ClientIntents,
      partials: ClientPartials,
      presence: {
        activities: [
          {
            name: `Preparing the presence...`,
            type: 0,
          },
        ],
        status: 'online',
      },
    },
    token: process.env.TOKEN,
    id: '743826135061889028',
  },

  // Users:
  users: {
    owner: '738852700816670822',
  },

  channels: {
    logging_channel: '1092552794323550258',
  },
  databases: [
      {
    host: '185.142.53.15',
    user: 'feyli',
    password: process.env.DBPASSWORD,
    database: 'sunbot',
  },
    {
      host: '185.142.53.15',
      user: 'arcane',
      password: process.env.ARCANEDBPASSWORD,
      database: 'arcane_blades',
    }
  ]
}
