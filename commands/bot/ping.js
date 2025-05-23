module.exports = {
    command_data: {
        name: 'ping',
        description: 'Returns the current ping for the bot.',
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        type: 1,
        options: [],
        name_localizations: {
            'zh-CN': 'ching',
            'zh-TW': 'ching',
            'it': 'parmiggiano',
            'es-ES': 'mi',
        },
    },
    perms: null,
    owner_only: false,
    cooldown: 5000,
    category: 'Bot',
    run: async (client, interaction) => {
        const locales = {
            'fr': 'C\'est moi wsh',
            'zh-CN': 'Chong!',
            'zh-TW': 'Chong!',
            'it': 'Reggiano!',
            'es-ES': 'Amor!',
        };

        const now = Date.now();
        await interaction.deferReply();
        await interaction.editReply(
            `${locales[interaction.locale] ?? 'Pong!'} \`${Date.now() - now}ms\``);
    },
};
