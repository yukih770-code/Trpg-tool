/**
 * Room Server boundary markers (v0, types only).
 *
 * AI-LANDMARK: ROOM_SERVER_BOUNDARY_MARKERS_V0
 *
 * The existing server/room-server.ts remains the local development entry. This
 * marker reserves the long-term Room Server module boundary without moving
 * runtime code or changing protocol behavior.
 */
export const ROOM_SERVER_BOUNDARY = {
    kind: 'room-server-boundary',
    authority: 'runtime-room-authority',
};
