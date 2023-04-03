const config = require('../config/main');
const client = require('../index');

client.on('messageCreate', async (message) => {
    if (message.channel.isDMBased()) {
        const embed = {
            color: 0x5865f2,
            title: "New message in my DMs",
            description: message.content,
            footer: {
                text: message.author.username,
                iconURL: message.author.displayAvatarURL()
            },
            fields: [
                {
                    name: "Creation Date",
                    value: `<t:${message.createdTimestamp.toString().substring(0, 10)}>`,
                    inline: true
                },
                {
                    name: "Author",
                    value: message.author.toString(),
                    inline: true
                }
            ]
        };
        if (message.attachments.size > 0) embed.fields.push({
            name: "File" + (message.attachments.size > 1 ? 's' : ''),
            value: message.attachments.map((attachment) => attachment.url).join(', '),
            inline: true
        });
        client.channels.cache.get(config.channels.logging_channel).send({embeds: [embed]});
    }
});