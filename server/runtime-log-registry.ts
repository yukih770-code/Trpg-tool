/**
 * In-memory RuntimeLog registry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_RUNTIME_LOG_REGISTRY_V0
 *
 * Append-only per-room event store, kept SEPARATE from the RoomSnapshot registry
 * (the log grows unbounded and must not bloat snapshots). Memory remains the
 * live authority and this registry owns no persistence or viewer projection.
 * seq is server-assigned, monotonic per roomId, starting at 1. An optional
 * observer may mirror appends, and a validated durable stream may be restored
 * before new live events arrive.
 */

import type { RoomRuntimeLogEvent, RoomRuntimeLogListResult } from './protocol/room-protocol.js';

export interface RuntimeLogRegistry {
  /** Append an event (seq assigned here); returns the stored event with seq. */
  append(roomId: string, event: Omit<RoomRuntimeLogEvent, 'seq'>): RoomRuntimeLogEvent;
  /** List events; with afterSeq, only events whose seq > afterSeq. */
  list(roomId: string, options?: { afterSeq?: number }): RoomRuntimeLogListResult;
  /** Restore a validated durable stream only when no live events exist yet. */
  restoreRoom(roomId: string, events: RoomRuntimeLogEvent[]): {
    decision: 'restored' | 'skippedNonEmpty';
    restoredCount: number;
    latestSeq: number;
  };
  clearRoom(roomId: string): void;
}

export interface InMemoryRuntimeLogRegistryOptions {
  /** Best-effort durable observer. It never changes the live append result. */
  onEventAppended?: (event: RoomRuntimeLogEvent) => void;
}

function copyEvent(event: RoomRuntimeLogEvent): RoomRuntimeLogEvent {
  return JSON.parse(JSON.stringify(event)) as RoomRuntimeLogEvent;
}

export function createInMemoryRuntimeLogRegistry(options: InMemoryRuntimeLogRegistryOptions = {}): RuntimeLogRegistry {
  const byRoom = new Map<string, RoomRuntimeLogEvent[]>();

  return {
    append(roomId, event) {
      const events = byRoom.get(roomId) ?? [];
      const seq = events.length === 0 ? 1 : events[events.length - 1].seq + 1;
      const stored: RoomRuntimeLogEvent = { ...event, roomId, seq };
      events.push(stored);
      byRoom.set(roomId, events);
      try {
        options.onEventAppended?.(copyEvent(stored));
      } catch {
        // Durable observers must never break live RuntimeLog authority.
      }
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
      const restored: RoomRuntimeLogEvent[] = [];
      for (const event of [...events].sort((left, right) => left.seq - right.seq)) {
        if (
          event.roomId !== roomId
          || typeof event.eventId !== 'string'
          || event.eventId.trim() === ''
          || !Number.isSafeInteger(event.seq)
          || event.seq <= 0
          || seenIds.has(event.eventId)
          || seenSequences.has(event.seq)
        ) continue;
        seenIds.add(event.eventId);
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
