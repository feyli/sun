import { Colors, ComponentType, MessageFlags } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { defineModal } from '../../types/commands';

export default defineModal({
    customId: 'confess_modal',
    guildOnly: true,
    async execute(interaction) {
        const confession = interaction.fields.getTextInputValue('confession_input');
        const anonymous = interaction.fields.getField('confession_anonymous', ComponentType.Checkbox).value;

        const [row] = await interaction.client.db
            .select({confessionChannelId: guilds.confessionChannelId})
            .from(guilds)
            .where(eq(guilds.guildId, interaction.guild.id));

        // Post to the configured confession channel when one is set, otherwise to the current channel.
        const channel = row?.confessionChannelId ? interaction.guild.channels.cache.get(row.confessionChannelId) : undefined;

        if (!channel?.isSendable()) {
            return interaction.reply({content: "It seems like I can't post your confession in the channel that was set up by this server's admins. Please reach out to them directly to get more information.", flags: MessageFlags.Ephemeral});
        }

        await interaction.reply({content: 'Your confession has been sent!', flags: MessageFlags.Ephemeral});

        await channel.send({
            embeds: [
                {
                    title: '✉️ ' + (anonymous ? 'Anonymous Confession' : 'Confession'),
                    description: confession,
                    color: Colors.Red,
                    timestamp: new Date().toISOString(),
                    author: anonymous ? undefined : {name: interaction.user.username, icon_url: interaction.user.displayAvatarURL()},
                },
            ],
        });
    },
});
