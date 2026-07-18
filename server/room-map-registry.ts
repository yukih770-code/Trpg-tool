/**
 * In-memory Room Map event registry (v0).
 *
 * Kept separate from RoomSnapshot and RuntimeLog: maps can grow independently
 * and must not be represented as social log entries. This registry is lost when
 * the Room Server restarts; durable map storage is intentionally deferred.
 */

import type { RoomMapEvent, RoomMapEventListResult } from './protocol/room-protocol.js';

export interface RoomMapRegistry {
  append(roomId: string, event: Omit<RoomMapEvent, 'seq'>): RoomMapEvent;
  list(roomId: string, options?: { afterSeq?: number; mapId?: string }): RoomMapEventListResult;
}

export function createInMemoryRoomMapRegistry(): RoomMapRegistry {
  const byRoom = new Map<string, RoomMapEvent[]>();

  return {
    append(roomId, event) {
      const events = byRoom.get(roomId) ?? [];
      const seq = events.length === 0 ? 1 : events[events.length - 1].seq + 1;
      const stored: RoomMapEvent = { ...event, roomId, seq };
      events.push(stored);
      byRoom.set(roomId, events);
      return stored;
    },
    list(roomId, options) {
      const events = byRoom.get(roomId) ?? [];
      const latestSeq = events.length === 0 ? 0 : events[events.length - 1].seq;
      const filtered = events.filter((event) =>
        (options?.afterSeq === undefined || event.seq > options.afterSeq) &&
        (options?.mapId === undefined || event.mapId === options.mapId),
      );
      return { roomId, mapId: options?.mapId, latestSeq, events: filtered };
    },
  };
}
