/**
 * Type declarations for the untyped `minecraft-status` package (v1.1.0).
 * Only the API used by this project is declared.
 */
declare module 'minecraft-status' {
    export interface ServerListPingPlayer {
        id: string;
        name: string;
    }

    export interface ServerListPingPlayers {
        max: number;
        online: number;
        sample?: ServerListPingPlayer[];
    }

    export interface ServerListPingVersion {
        name: string;
        protocol: number;
    }

    /** Response of the modern (1.7+) server list ping. */
    export interface ServerListPingResponse {
        version: ServerListPingVersion;
        players: ServerListPingPlayers;
        description: string | Record<string, unknown>;
        /** Base64 data URI (`data:image/png;base64,...`). */
        favicon?: string;
        enforcesSecureChat?: boolean;
        previewsChat?: boolean;
    }

    /** Response of the legacy (pre-1.7) server list pings. */
    export interface LegacyServerListPingResponse {
        version?: ServerListPingVersion;
        players: Pick<ServerListPingPlayers, 'max' | 'online'>;
        description: string;
    }

    export class MinecraftServerListPing {
        static ping(protocol: number, host: string, port?: number, timeout?: number): Promise<ServerListPingResponse>;

        static ping16(protocol: number, host: string, port?: number, timeout?: number): Promise<LegacyServerListPingResponse>;

        static ping15(host: string, port?: number, timeout?: number): Promise<LegacyServerListPingResponse>;

        static ping13(host: string, port?: number, timeout?: number): Promise<LegacyServerListPingResponse>;
    }
}
