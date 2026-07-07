/**
 * Room Server connection config (frontend, M26 compatibility layer).
 *
 * AI-LANDMARK: ROOM_SERVER_CONFIG_V0
 *
 * The shared resolver lives in roomServerEndpoint.ts. This file keeps the older
 * constant exports working for callers that have not migrated yet.
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
 * This module is transport-agnostic: it exports strings only.
 */

import {
  isLocalRoomServerEndpoint,
  resolveRoomServerHttpUrl,
  resolveRoomServerWsUrl,
} from './roomServerEndpoint';

export {
  deriveRoomServerWsUrl,
  isLocalRoomServerEndpoint,
  resolveRoomServerHttpUrl,
  resolveRoomServerWsUrl,
} from './roomServerEndpoint';

/** Base HTTP URL of the Room Server (no trailing slash normalization here). */
export const roomServerHttpUrl: string = resolveRoomServerHttpUrl();

/** Base WS URL of the Room Server. Derived from the HTTP URL when not set. */
export const roomServerWsUrl: string = resolveRoomServerWsUrl();

/** True when pointing at a localhost Room Server (i.e. local dev, not cloud). */
export const isLocalRoomServer: boolean = isLocalRoomServerEndpoint(roomServerHttpUrl);
