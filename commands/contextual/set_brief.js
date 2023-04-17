const {ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder} = require('discord.js');

module.exports = {
    command_data: {
        name: 'Set Mission Brief',
        type: 3,
        default_member_permissions: 8,
        dm_permission: false,
    },
    guild_id: '1097431302338256977',
    run: async (client, interaction) => {
        const date = Date.now().toString();
        const db = client.db;

        // noinspection JSCheckFunctionSignatures
        const modal = new ModalBuilder().setCustomId('set_brief_modal_' + date).setTitle('Create a Mission Brief').setComponents(new ActionRowBuilder().setComponents(
                new TextInputBuilder().setCustomId('title').setLabel('Mission Briefing Title').setStyle(1).setPlaceholder('Enter brief title here').setRequired(false)),
            new ActionRowBuilder().setComponents(
                new TextInputBuilder().setCustomId('description').setLabel('Mission Briefing Description').setStyle(2).setPlaceholder('Enter brief description here').setValue(interaction.targetMessage.content)));

        interaction.showModal(modal);
        const modalInteraction = await interaction.awaitModalSubmit({
            filter: (i) => {
                return i.customId.endsWith(date);
            },
            time: 120_000,
        }).catch((err) => {
            console.log(err);
        });

        let json = JSON.stringify({
            title: modalInteraction.fields.getTextInputValue('title'),
            description: modalInteraction.fields.getTextInputValue('description'),
        });
        console.log(json);

        db.query('UPDATE guilds SET mission_brief=? WHERE guild_id=?',
            [json, interaction.guild.id]).catch((err) => console.error(err));

        // noinspection JSCheckFunctionSignatures
        await modalInteraction.reply({
            embeds: [
                {
                    title: 'Mission Brief Set',
                    description: 'Preview the brief in this channel or send it to everyone!',
                }], components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder().setCustomId('preview_brief').setLabel('Preview Mission Brief').setStyle(1),
                    new ButtonBuilder().setCustomId('send_brief').setLabel('Send Mission Brief').setStyle(2),
                ),
            ],
        });
    },
};