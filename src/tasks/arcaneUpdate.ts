import { ChannelType, PermissionFlagsBits, type Client } from 'discord.js';
import { inspect } from 'node:util';
import { ARCANE_GUILD_ID, ARCANE_IN_GAME_ROLE_ID, ARCANE_PLAYER_ROLE_ID, ARCANE_SERVER_ADDRESS, ARCANE_SERVER_PORT, ARCANE_VOICE_CATEGORY_ID } from '../constants';
import type { PlayerRow } from '../types/database';
import { queryRows } from '../utils/database';
import { pingServer } from '../utils/minecraft';

type LinkedPlayer = Pick<PlayerRow, 'player_uuid'> & { user_id: string };

/**
 * Synchronizes the Arcane Blades guild with the Minecraft server: one voice channel per online player,
 * the "in game" role for linked members currently playing, and their nickname set to their Minecraft name.
 */
export async function arcaneUpdate(client: Client): Promise<void> {
    const guild = client.guilds.cache.get(ARCANE_GUILD_ID);
    const inGameRole = guild?.roles.cache.get(ARCANE_IN_GAME_ROLE_ID);
    const playerRole = guild?.roles.cache.get(ARCANE_PLAYER_ROLE_ID);
    const category = guild?.channels.cache.get(ARCANE_VOICE_CATEGORY_ID);

    if (!guild || !inGameRole || !playerRole || !category || category.type !== ChannelType.GuildCategory) {
        console.log('Arcane Update: Something went wrong. (guild, inGameRole, playerRole, category)');
        return;
    }

    const removeInGameRoles = (): void => {
        for (const member of guild.members.cache.filter((guildMember) => guildMember.roles.cache.has(ARCANE_IN_GAME_ROLE_ID)).values()) {
            member.roles.remove(inGameRole).catch(console.error);
        }
    };

    const players = await queryRows<LinkedPlayer>(client.arcanePool, "SELECT user_id, REPLACE(player_uuid, '-', '') AS player_uuid FROM players WHERE user_id IS NOT NULL");

    const response = await pingServer(ARCANE_SERVER_ADDRESS, ARCANE_SERVER_PORT);
    if (!response) {
        console.log(`[Arcane Update] Failed to connect to Minecraft server at ${ARCANE_SERVER_ADDRESS}:${ARCANE_SERVER_PORT}`);
        console.log('[Arcane Update] Cleaning up: Removing in-game roles and voice channels');
        removeInGameRoles();
        for (const child of category.children.cache.filter((channel) => channel.type === ChannelType.GuildVoice).values()) {
            child.delete().catch(console.error);
        }
        return;
    }

    if (!response.players.sample) {
        for (const child of category.children.cache.values()) child.delete().catch(console.error);
        removeInGameRoles();
        return;
    }

    const sample = response.players.sample.map((player) => ({id: player.id.replace(/-/g, ''), name: player.name}));

    for (const player of sample) {
        if (!category.children.cache.find((channel) => channel.name === player.name)) {
            await category.children.create({
                name: player.name,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [{id: guild.id, deny: [PermissionFlagsBits.Connect]}],
            });
        }
    }

    console.log('Sample:' + inspect(sample, false, null, true));

    for (const child of category.children.cache.filter((channel) => !sample.some((player) => player.name === channel.name)).values()) {
        child.delete().catch(console.error);
    }

    for (const player of players) {
        const member = guild.members.cache.get(player.user_id);
        if (!member) continue;

        const samplePlayer = sample.find((candidate) => candidate.id === player.player_uuid);
        if (samplePlayer && member.presence && member.presence.status !== 'offline') {
            console.log(member.user.username + ' is in the sample');
            await member.roles.add(inGameRole);
            await member.roles.add(playerRole);
            if (member.manageable) await member.setNickname(samplePlayer.name, 'minecraft username check');
        } else {
            console.log(member.user.username + ' is not in the sample');
            await member.roles.remove(inGameRole);
        }
    }
}
