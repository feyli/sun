module.exports = {
    command_data: {
        name: 'eval',
        description: 'Evaluates JavaScript code.',
        type: 1,
        integration_types: [0, 1],
        contexts: [0, 1, 2],
        options: [
            {
                name: 'code',
                description: 'The code to evaluate.',
                type: 3,
                required: true,
            },
            {
                name: 'ephemeral',
                description: 'Whether the response should be ephemeral.',
                type: 5,
                required: false,
            },
        ],
    },
    perms: null,
    owner_only: true,
    cooldown: 10000,
    category: 'Owner',
    run: async (client, interaction, config, db) => {
        let code = interaction.options.get('code').value;
        await interaction.deferReply(
            { ephemeral: interaction.options.get('ephemeral') || false },
        );
        if (code.includes('interaction.reply(') || code.includes('interaction.deferReply(')) return await interaction.editReply({ content: "Hey, what you tryna do here? Hopefully I didn't run that cause it would have most likely crashed the whole thing!" });
        if (code.includes('interaction.editReply(')) return await interaction.editReply({ content: "I mean... I can try to edit my reply as you wish so but you'll most likely not see it as I will overwrite that real quickly... Kinda pointless, man."});
        let result;
        try {
            const wrapperFn = new Function('client', 'interaction',
                `return (async () => { try { ${code} } catch (err) { throw err; } })();`);
            result = await wrapperFn(client, interaction, config, db);
        } catch (err) {
            result = err;
        }
        await interaction.editReply({
            content: result
                ? result.length !== 0 ?
                    ('```' + result + '```') : 'The result has a length of 0.'
                : 'This code doesn\'t return anything or returns `false`.',
        });
    },
};