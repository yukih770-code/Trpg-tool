/**
 * getRoom service (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_GET_ROOM_V0
 *
 * Returns the full RoomSnapshot for a roomId, or undefined. Debug/scaffold read
 * — NO projection / permission filtering (that is a future server slice).
 */

import type { RoomRegistry } from '../room-registry.js';
import type { RoomSnapshot } from '../protocol/room-protocol.js';

export function getRoom(registry: RoomRegistry, roomId: string): RoomSnapshot | undefined {
  return registry.get(roomId);
}
