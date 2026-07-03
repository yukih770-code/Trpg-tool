/**
 * Room Server connection config (frontend, M26).
 *
 * AI-LANDMARK: ROOM_SERVER_CONFIG_V0
 *
 * Single source of truth for WHERE the frontend reaches the Room Server, so no
 * component hardcodes `http://localhost:8787`. Values come from Vite env vars at
 * build time and fall back to localhost for local dev:
 *
 *   VITE_ROOM_SERVER_HTTP_URL   e.g. https://your-room-server.onrender.com
 *   VITE_ROOM_SERVER_WS_URL     e.g. wss://your-room-server.onrender.com
 *
 * Netlify (or any host) sets these at build time to point the deployed frontend
 * at a standalone cloud Room Server. HTTP and WS are configured separately
 * because production uses https/wss. When the WS var is omitted it is derived
 * from the HTTP URL (http→ws, https→wss), which is correct for the common case
 * where the Room Server serves HTTP and WebSocket on the same origin.
 *
 * This module is transport-agnostic: it exports strings only. The HTTP client
 * still takes an explicit `baseUrl`, and the socket client still derives its
 * ws URL from the base it is given — callers pass these values in.
 */

const DEFAULT_HTTP_URL = 'http://localhost:8787';

type ImportMetaWithEnv = ImportMeta & {
  readonly env?: Record<string, unknown>;
};

/** Derive a ws(s) origin from an http(s) origin (no path appended here). */
function deriveWsUrl(httpUrl: string): string {
  return httpUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
}

function readEnv(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

const viteEnv = (import.meta as ImportMetaWithEnv).env ?? {};
const envHttpUrl = readEnv(viteEnv.VITE_ROOM_SERVER_HTTP_URL);
const envWsUrl = readEnv(viteEnv.VITE_ROOM_SERVER_WS_URL);

/** Base HTTP URL of the Room Server (no trailing slash normalization here). */
export const roomServerHttpUrl: string = envHttpUrl ?? DEFAULT_HTTP_URL;

/** Base WS URL of the Room Server. Derived from the HTTP URL when not set. */
export const roomServerWsUrl: string = envWsUrl ?? deriveWsUrl(roomServerHttpUrl);

/** True when pointing at a localhost Room Server (i.e. local dev, not cloud). */
export const isLocalRoomServer: boolean = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(roomServerHttpUrl);
