import { Colors, ComponentType, MessageFlags } from 'discord.js';
import { eq } from 'drizzle-orm';
import { awaitingConfessions, guilds } from '../../db/schema';
import { defineModal } from '../../types/commands';

export default defineModal({
    customId: 'confess_modal',
    guildOnly: true,
    async execute(interaction) {
        const confession = interaction.fields.getTextInputValue('confession_input');
        const anonymousField = interaction.fields.getField('confession_anonymous', ComponentType.CheckboxGroup).values[0];
        let anonymousState: 'yes+delayed' | 'yes' | 'no';
        if (!anonymousField || !['yes+delayed', 'yes', 'no'].includes(anonymousField)) return interaction.reply({content: 'An error has occured. Please contact the dev for more information.', flags: MessageFlags.Ephemeral});
        else anonymousState = anonymousField as 'yes+delayed' | 'yes' | 'no';

        const [row] = await interaction.client.db
            .select({confessionChannelId: guilds.confessionChannelId})
            .from(guilds)
            .where(eq(guilds.guildId, interaction.guild.id));

        // Post to the configured confession channel if one is set
        const channel = row?.confessionChannelId ? interaction.guild.channels.cache.get(row.confessionChannelId) : undefined;

        if (!channel?.isSendable()) {
            return interaction.reply({content: "It seems like I can't post your confession in the channel that was set up by this server's admins. Please reach out to them directly to get more information.", flags: MessageFlags.Ephemeral});
        }

        if (anonymousState === 'yes+delayed') {
            const randomDelay = Temporal.Duration.from({
                seconds: Math.floor(Math.random() * (30 * 60 - 15 * 60 + 1) + 15 * 60), // Random delay between 15 and 30 minutes
            });

            await interaction.client.db.insert(awaitingConfessions).values({
                confession,
                guildId: interaction.guild.id,
                publishingDate: new Date(Temporal.Now.instant().add(randomDelay).epochMilliseconds),
            });

            await interaction.reply({content: 'Your confession will be sent anonymously once a random timer anywhere between 15 and 30 minutes has elapsed.', flags: MessageFlags.Ephemeral});
        }

        else {
            await channel.send({
                embeds: [
                    {
                        title: '✉️ ' + (anonymousState === 'no' ? 'Confession' : 'Anonymous Confession'),
                        description: confession,
                        color: Colors.Red,
                        timestamp: new Date().toISOString(),
                        author: anonymousState === 'no' ? {name: interaction.user.username, icon_url: interaction.user.displayAvatarURL()} : undefined,
                    },
                ],
            });

            await interaction.reply({content: 'Your confession has been sent!', flags: MessageFlags.Ephemeral});
        }
    },
});
