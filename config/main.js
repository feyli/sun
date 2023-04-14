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
            name: 'I\'m not playing!',
            type: 0,
          },
        ],
        status: 'dnd',
      },
    },
    token: 'NzQzODI2MTM1MDYxODg5MDI4.G28d1J.Wm07rQZW2z3UnMAWeLu0EZkpKFcODYF7EgS0W0',
    id: '743826135061889028',
  },

  // Users:
  users: {
    owner: '738852700816670822',
  },

  channels: {
    logging_channel: '1092552794323550258',
  },
}
