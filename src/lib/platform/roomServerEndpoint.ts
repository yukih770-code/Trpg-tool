/**
 * Frontend Room Server endpoint resolver (v0).
 *
 * AI-LANDMARK: ROOM_SERVER_ENDPOINT_RESOLVER_V0
 *
 * Single frontend boundary for resolving Room Server HTTP / WebSocket endpoints.
 * Components should not read Vite env vars directly or hardcode localhost.
 * This module only resolves endpoint strings; it does not fetch, connect,
 * deploy, authenticate, or know whether the backend runs on Render/Fly/Cloud Run.
 */

const DEFAULT_ROOM_SERVER_HTTP_URL = 'http://localhost:8787';

type ImportMetaWithEnv = ImportMeta & {
  readonly env?: Record<string, unknown>;
};

export type RoomServerEndpointEnv = Record<string, unknown>;

function readEnv(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function getViteEnv(): RoomServerEndpointEnv {
  return (import.meta as ImportMetaWithEnv).env ?? {};
}

export function deriveRoomServerWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
}

export function resolveRoomServerHttpUrl(env: RoomServerEndpointEnv = getViteEnv()): string {
  return readEnv(env.VITE_ROOM_SERVER_HTTP_URL) ?? DEFAULT_ROOM_SERVER_HTTP_URL;
}

export function resolveRoomServerWsUrl(env: RoomServerEndpointEnv = getViteEnv()): string {
  const httpUrl = resolveRoomServerHttpUrl(env);
  return readEnv(env.VITE_ROOM_SERVER_WS_URL) ?? deriveRoomServerWsUrl(httpUrl);
}

export function isLocalRoomServerEndpoint(httpUrl: string = resolveRoomServerHttpUrl()): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(httpUrl);
}
