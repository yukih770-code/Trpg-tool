/**
 * In-memory Room Map event registry.
 *
 * Kept separate from RoomSnapshot and RuntimeLog: maps can grow independently
 * and must not be represented as social log entries. Memory remains the live
 * authority. An optional observer mirrors appends, while a validated durable
 * stream can be restored before new live events arrive.
 */

import type { RoomMapEvent, RoomMapEventListResult } from './protocol/room-protocol.js';

export interface RoomMapRegistry {
  append(roomId: string, event: Omit<RoomMapEvent, 'seq'>): RoomMapEvent;
  list(roomId: string, options?: { afterSeq?: number; mapId?: string }): RoomMapEventListResult;
  restoreRoom(roomId: string, events: RoomMapEvent[]): {
    decision: 'restored' | 'skippedNonEmpty';
    restoredCount: number;
    latestSeq: number;
  };
  clearRoom(roomId: string): void;
}

export interface InMemoryRoomMapRegistryOptions {
  /** Best-effort durable observer. It never changes the live append result. */
  onEventAppended?: (event: RoomMapEvent) => void;
}

function copyEvent(event: RoomMapEvent): RoomMapEvent {
  return JSON.parse(JSON.stringify(event)) as RoomMapEvent;
}

export function createInMemoryRoomMapRegistry(options: InMemoryRoomMapRegistryOptions = {}): RoomMapRegistry {
  const byRoom = new Map<string, RoomMapEvent[]>();

  return {
    append(roomId, event) {
      const events = byRoom.get(roomId) ?? [];
      const seq = events.length === 0 ? 1 : events[events.length - 1].seq + 1;
      const stored: RoomMapEvent = { ...event, roomId, seq };
      events.push(stored);
      byRoom.set(roomId, events);
      try {
        options.onEventAppended?.(copyEvent(stored));
      } catch {
        // Durable observers must never break live Room Map authority.
      }
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
    restoreRoom(roomId, events) {
      const current = byRoom.get(roomId) ?? [];
      if (current.length > 0) {
        return {
          decision: 'skippedNonEmpty',
          restoredCount: 0,
          latestSeq: current[current.length - 1]?.seq ?? 0,
        };
      }
      const seenIds = new Set<string>();
      const seenSequences = new Set<number>();
      const restored: RoomMapEvent[] = [];
      for (const event of [...events].sort((left, right) => left.seq - right.seq)) {
        if (
          event.roomId !== roomId
          || typeof event.mapEventId !== 'string'
          || event.mapEventId.trim() === ''
          || !Number.isSafeInteger(event.seq)
          || event.seq <= 0
          || seenIds.has(event.mapEventId)
          || seenSequences.has(event.seq)
        ) continue;
        seenIds.add(event.mapEventId);
        seenSequences.add(event.seq);
        restored.push(copyEvent(event));
      }
      if (restored.length > 0) byRoom.set(roomId, restored);
      return {
        decision: 'restored',
        restoredCount: restored.length,
        latestSeq: restored[restored.length - 1]?.seq ?? 0,
      };
    },
    clearRoom(roomId) {
      byRoom.delete(roomId);
    },
  };
}
