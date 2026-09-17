import { Message, MessageFlags, messageLink, TextChannel } from 'discord.js';
import { eq } from 'drizzle-orm';
import { guilds } from '../../db/schema';
import { queueAnonymousConfession } from '../../tasks/anonConfessions';
import { defineModal } from '../../types/commands';
import { generateDeleteHash, registerDeletableConfession, sendConfession } from "../../utils/confessions.ts";

export default defineModal({
    customId: 'confess_modal',
    guildOnly: true,
    async execute(interaction) {
        const confession = interaction.fields.getTextInputValue('confession_input');
        const anonymousField = interaction.fields.getStringSelectValues('confession_privacy')?.[0];
        let anonymousState: 'yes+delayed' | 'yes' | 'no';

        if (!anonymousField || !['yes+delayed', 'yes', 'no'].includes(anonymousField)) return interaction.reply({content: 'An error has occured. Please contact the dev for more information.', flags: MessageFlags.Ephemeral});
        else anonymousState = anonymousField as 'yes+delayed' | 'yes' | 'no';

        const [row] = await interaction.client.db
            .select({confessionChannelId: guilds.confessionChannelId})
            .from(guilds)
            .where(eq(guilds.guildId, interaction.guild.id));

        // Post to the configured confession channel if one is set
        const channel = row?.confessionChannelId ? interaction.guild.channels.cache.get(row.confessionChannelId) : undefined;

        if (!channel?.isSendable()) return interaction.reply({content: "It seems like I can't post your confession in the channel that was set up by this server's admins. Please reach out to them directly to get more information.", flags: MessageFlags.Ephemeral});

        if (!channel?.isTextBased() || !(channel instanceof TextChannel)) return interaction.reply({content: "The configured confession channel is not a text channel. Please refer to the admins for more information.", flags: MessageFlags.Ephemeral});

        let confessionMessage: Message<true>;

        switch (anonymousState) {
            case 'yes+delayed': {
                const delaySeconds = Math.floor(Math.random() * (30 * 60 - 15 * 60 + 1) + 15 * 60); // Random delay between 15 and 30 minutes

                // Committed to PostgreSQL by pg-boss before this reply is sent, so the confession
                // is published even if the bot restarts in the meantime.
                await queueAnonymousConfession(
                    {
                        guildId: interaction.guild.id,
                        confession,
                        authorHash: await generateDeleteHash(interaction.user.id),
                    },
                    delaySeconds,
                );

                return await interaction.reply({content: 'Your confession will be sent anonymously once a random timer anywhere between 15 and 30 minutes has elapsed.', flags: MessageFlags.Ephemeral});
            }
            case 'yes':
                confessionMessage = await sendConfession(channel, confession, true);
                break;
            case 'no':
                confessionMessage = await sendConfession(channel, confession, false, interaction.user);
                break;
            default:
                return await interaction.reply({content: 'An error has occured. Please contact the dev for more information.', flags: MessageFlags.Ephemeral});
        }

        await registerDeletableConfession(interaction.client.db, confessionMessage.id, await generateDeleteHash(interaction.user.id));

        return await interaction.reply({content: `Your confession has been sent! Check it out here: ${messageLink(confessionMessage.channelId, confessionMessage.id, confessionMessage.guildId)}.`, flags: MessageFlags.Ephemeral});
    },
});
