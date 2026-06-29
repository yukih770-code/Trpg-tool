/**
 * In-memory RuntimeLog registry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_RUNTIME_LOG_REGISTRY_V0
 *
 * Append-only per-room event store, kept SEPARATE from the RoomSnapshot registry
 * (the log grows unbounded and must not bloat snapshots). Memory-only — lost on
 * restart; no persistence, no Campaign/Runtime store, no projection. seq is
 * server-assigned, monotonic per roomId, starting at 1.
 */

import type { RoomRuntimeLogEvent, RoomRuntimeLogListResult } from './protocol/room-protocol.js';

export interface RuntimeLogRegistry {
  /** Append an event (seq assigned here); returns the stored event with seq. */
  append(roomId: string, event: Omit<RoomRuntimeLogEvent, 'seq'>): RoomRuntimeLogEvent;
  /** List events; with afterSeq, only events whose seq > afterSeq. */
  list(roomId: string, options?: { afterSeq?: number }): RoomRuntimeLogListResult;
  clearRoom(roomId: string): void;
}

export function createInMemoryRuntimeLogRegistry(): RuntimeLogRegistry {
  const byRoom = new Map<string, RoomRuntimeLogEvent[]>();

  return {
    append(roomId, event) {
      const events = byRoom.get(roomId) ?? [];
      const seq = events.length === 0 ? 1 : events[events.length - 1].seq + 1;
      const stored: RoomRuntimeLogEvent = { ...event, roomId, seq };
      events.push(stored);
      byRoom.set(roomId, events);
      return stored;
    },
    list(roomId, options) {
      const events = byRoom.get(roomId) ?? [];
      const latestSeq = events.length === 0 ? 0 : events[events.length - 1].seq;
      const afterSeq = options?.afterSeq;
      const filtered =
        typeof afterSeq === 'number' ? events.filter((e) => e.seq > afterSeq) : events.slice();
      return { roomId, latestSeq, events: filtered };
    },
    clearRoom(roomId) {
      byRoom.delete(roomId);
    },
  };
}
