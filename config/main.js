const { GatewayIntentBits, Partials } = require('discord.js');
const { ClientIntents, ClientPartials } = require('discord.js-v14-helper');

module.exports = {
    // Client configuration:
    client: {
        constructor: {
            intents: ClientIntents,
            partials: ClientPartials,
            presence: {
                activities: [
                    {
                        name: 'Hello world!',
                        type: 0
                    }
                ],
                status: 'dnd'
            }
        },
        token: "NzQzODI2MTM1MDYxODg5MDI4.G28d1J.Wm07rQZW2z3UnMAWeLu0EZkpKFcODYF7EgS0W0",
        id: "743826135061889028"
    },

    // Database:
    database: {
        mongodb_uri: "YOUR_MONGODB_URI (Not required)"
    },

    // Users:
    users: {
        developers: [
          "738852700816670822"
        ],
        owner: "738852700816670822"
    },
    
    channels: {
        logging_channel: "1092530776081432606"
    }
};
