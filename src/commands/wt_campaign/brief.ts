import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { WT_CAMPAIGN_GUILD_ID } from '../../constants';
import { defineSlashCommand } from '../../types/commands';
import { guildsOnly } from '../../utils/commandScopes';
import { buildBriefEmbed, getMissionBrief, sendMissionBrief } from '../../utils/missionBrief';

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('brief')
            .setDescription('Relatif à la mission actuelle.')
            .addSubcommand((sub) => sub.setName('send').setDescription('Envoie le briefing de mission dans le salon prédéfini (admin seulement).'))
            .addSubcommand((sub) => sub.setName('get').setDescription('Envoie le briefing de mission en MP.')),
    ),
    guildId: WT_CAMPAIGN_GUILD_ID,
    category: 'War Thunder Campaign',
    guildOnly: true,
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'send') return sendMissionBrief(interaction);

        if (subcommand === 'get') {
            await interaction.deferReply({flags: MessageFlags.Ephemeral});

            const brief = await getMissionBrief(interaction.client.db, interaction.guild.id);
            if (!brief) return interaction.editReply(":flag_white: | Aucun briefing de mission n'est actuellement disponible mais __restez à l'affût__ !");

            await interaction.user.send({embeds: [buildBriefEmbed(brief, interaction.guild)]});
            await interaction.editReply(':airplane_small: | Le briefing de mission vous a été envoyé en __MP__.');
        }
    },
});
