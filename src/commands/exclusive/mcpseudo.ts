import { SlashCommandBuilder } from 'discord.js';
import { ARCANE_GUILD_ID, ARCANE_IN_GAME_ROLE_ID } from '../../constants';
import { defineSlashCommand } from '../../types/commands';
import type { PlayerRow } from '../../types/database';
import { guildsOnly } from '../../utils/commandScopes';
import { execute, queryRow } from '../../utils/database';
import { fetchProfileByName } from '../../utils/mojang';

export default defineSlashCommand({
    data: guildsOnly(
        new SlashCommandBuilder()
            .setName('mcpseudo')
            .setDescription('Permet de définir son pseudo Minecraft (pour le rôle "En jeu").')
            .addSubcommand((sub) =>
                sub
                    .setName('set')
                    .setDescription('Définis ton pseudo Minecraft.')
                    .addStringOption((option) => option.setName('pseudo').setDescription('Le pseudo Minecraft.').setRequired(true).setMaxLength(16)),
            )
            .addSubcommand((sub) => sub.setName('remove').setDescription('Supprime ton pseudo du système.')),
    ),
    category: 'Minecraft',
    cooldown: 10000,
    guildId: ARCANE_GUILD_ID,
    guildOnly: true,
    async execute(interaction) {
        await interaction.deferReply();

        const pool = interaction.client.arcanePool;

        switch (interaction.options.getSubcommand()) {
            case 'set': {
                const nickname = interaction.options.getString('pseudo', true);

                const profile = await fetchProfileByName(nickname);
                if (!profile) return interaction.editReply("Je n'ai pu envoyer de requête à Mojang. Veuillez réessayer plus tard.");

                if (profile.errorMessage?.includes("Couldn't find")) {
                    return interaction.editReply(`Le pseudo \`${nickname}\` n'existe pas sur Minecraft. Veuillez indiquer un pseudo valide.`);
                }
                if (!profile.id) return interaction.editReply("Je n'ai pu envoyer de requête à Mojang. Veuillez réessayer plus tard.");

                const existing = await queryRow<Pick<PlayerRow, 'user_id'>>(pool, 'SELECT user_id FROM players WHERE player_uuid = ?', [profile.id]);
                if (existing) {
                    if (existing.user_id === interaction.user.id) return interaction.editReply('Ce profil Minecraft est déjà lié à votre profil Discord.');
                    return interaction.editReply(`<@${existing.user_id}> a déjà lié ce profil Minecraft à son profil Discord.`);
                }

                await execute(pool, 'INSERT INTO players (user_id, player_uuid) VALUES (?, ?) ON DUPLICATE KEY UPDATE player_uuid = ?', [interaction.user.id, profile.id, profile.id]);

                await interaction.editReply(`Ton pseudo Minecraft a bien été défini sur : \`${nickname}\` !`);
                break;
            }
            case 'remove': {
                await execute(pool, 'DELETE FROM players WHERE user_id = ?', [interaction.user.id]);

                await interaction.editReply({content: 'Ton pseudo Minecraft a bien été supprimé du système !'});
                break;
            }
        }

        await interaction.member.roles.remove(ARCANE_IN_GAME_ROLE_ID);
    },
});
