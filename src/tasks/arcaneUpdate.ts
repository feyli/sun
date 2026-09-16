import { ChannelType, PermissionFlagsBits, type Client } from 'discord.js';
import { ARCANE_GUILD_ID, ARCANE_IN_GAME_ROLE_ID, ARCANE_PLAYER_ROLE_ID, ARCANE_SERVER_ADDRESS, ARCANE_SERVER_PORT, ARCANE_VOICE_CATEGORY_ID } from '../constants';
import type { PlayerRow } from '../types/database';
import { queryRows } from '../utils/database';
import { pingServer } from '../utils/minecraft';

type LinkedPlayer = Pick<PlayerRow, 'player_uuid'> & { user_id: string };

/**
 * The task runs every few seconds, so anything unconditional here is logged hundreds of times an hour.
 * These hold the last reported state and only let a message through when it actually changes.
 */
let lastMisconfigured: boolean | null = null;
let lastReachable: boolean | null = null;

/** Logs `message` only when `state` differs from what was last reported under `previous`. */
function logOnChange(previous: boolean | null, state: boolean, message: string): boolean {
    if (previous !== state) console.log(message);
    return state;
}

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
        lastMisconfigured = logOnChange(lastMisconfigured, true, '[Arcane Update] Missing guild, inGameRole, playerRole or category; skipping until they resolve.');
        return;
    }
    lastMisconfigured = logOnChange(lastMisconfigured, false, '[Arcane Update] Guild, roles and category resolved; resuming.');

    const removeInGameRoles = (): void => {
        for (const member of guild.members.cache.filter((guildMember) => guildMember.roles.cache.has(ARCANE_IN_GAME_ROLE_ID)).values()) {
            member.roles.remove(inGameRole).catch(console.error);
        }
    };

    const players = await queryRows<LinkedPlayer>(client.arcanePool, "SELECT user_id, REPLACE(player_uuid, '-', '') AS player_uuid FROM players WHERE user_id IS NOT NULL");

    const response = await pingServer(ARCANE_SERVER_ADDRESS, ARCANE_SERVER_PORT);
    if (!response) {
        lastReachable = logOnChange(
            lastReachable,
            false,
            `[Arcane Update] Minecraft server at ${ARCANE_SERVER_ADDRESS}:${ARCANE_SERVER_PORT} is unreachable; removing in-game roles and voice channels.`,
        );
        removeInGameRoles();
        for (const child of category.children.cache.filter((channel) => channel.type === ChannelType.GuildVoice).values()) {
            child.delete().catch(console.error);
        }
        return;
    }
    lastReachable = logOnChange(lastReachable, true, `[Arcane Update] Minecraft server at ${ARCANE_SERVER_ADDRESS}:${ARCANE_SERVER_PORT} is reachable again.`);

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

    for (const child of category.children.cache.filter((channel) => !sample.some((player) => player.name === channel.name)).values()) {
        child.delete().catch(console.error);
    }

    // Every call below is a REST request, so each one is guarded: at a 10 second interval an
    // unconditional add/remove/rename per linked player is thousands of pointless calls a day.
    for (const player of players) {
        const member = guild.members.cache.get(player.user_id);
        if (!member) continue;

        const samplePlayer = sample.find((candidate) => candidate.id === player.player_uuid);
        if (samplePlayer && member.presence && member.presence.status !== 'offline') {
            if (!member.roles.cache.has(ARCANE_IN_GAME_ROLE_ID)) await member.roles.add(inGameRole);
            if (!member.roles.cache.has(ARCANE_PLAYER_ROLE_ID)) await member.roles.add(playerRole);
            if (member.manageable && member.nickname !== samplePlayer.name) {
                await member.setNickname(samplePlayer.name, 'minecraft username check');
            }
        } else if (member.roles.cache.has(ARCANE_IN_GAME_ROLE_ID)) {
            await member.roles.remove(inGameRole);
        }
    }
}
