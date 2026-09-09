import { MinecraftServerListPing, type ServerListPingResponse } from 'minecraft-status';

const PROTOCOL_VERSION = 4;

/** Pings a Minecraft server; resolves to `null` when the server cannot be reached. */
export function pingServer(address: string, port: number, timeout?: number): Promise<ServerListPingResponse | null> {
    return MinecraftServerListPing.ping(PROTOCOL_VERSION, address, port, timeout).catch(() => null);
}

/** A reachable server reporting a max player count of 0 is treated as offline. */
export function isServerOnline(response: ServerListPingResponse | null): response is ServerListPingResponse {
    return response !== null && response.players.max !== 0;
}
