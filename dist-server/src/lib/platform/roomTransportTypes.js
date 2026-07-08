/**
 * Room WebSocket transport contracts (v0, types only).
 *
 * AI-LANDMARK: ROOM_TRANSPORT_TYPES_V0
 *
 * Platform-level message envelopes for the room WebSocket scaffold. Pure types;
 * imports only `RoomSnapshot` (type). No React / store / localStorage / server
 * code, no DND/LAN/localhost hardcoding. The room snapshot rides inside an
 * ENVELOPE (`payload`), so a future projection/filtering layer can replace the
 * payload without changing the envelope shape. No Runtime / RuntimeLog / map /
 * intent payloads here.
 */
export {};
