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
 * before new live events arrive. Database-backed appends can remain internally
 * pending and invisible until their required durable write is confirmed.
 */

import type { RoomRuntimeLogEvent, RoomRuntimeLogListResult } from './protocol/room-protocol.js';

export interface RuntimeLogRegistry {
  /** Append an event (seq assigned here); returns the stored event with seq. */
  append(roomId: string, event: Omit<RoomRuntimeLogEvent, 'seq'>, options?: { pending?: boolean }): RoomRuntimeLogEvent;
  /** List events; with afterSeq, only events whose seq > afterSeq. */
  list(roomId: string, options?: { afterSeq?: number }): RoomRuntimeLogListResult;
  /** Restore a validated durable stream only when no live events exist yet. */
  restoreRoom(roomId: string, events: RoomRuntimeLogEvent[]): {
    decision: 'restored' | 'skippedNonEmpty';
    restoredCount: number;
    latestSeq: number;
  };
  /** Publishes one append after its required durable write succeeds. */
  confirmPending(roomId: string, eventId: string): 'confirmed' | 'notFound';
  /** Compensates one unpublished append whose required durable write failed. */
  discardPending(roomId: string, eventId: string): 'discarded' | 'notFound' | 'alreadyConfirmed';
  clearRoom(roomId: string): void;
}

export interface InMemoryRuntimeLogRegistryOptions {
  /** Queues a durable mirror; the HTTP boundary may await and confirm it. */
  onEventAppended?: (event: RoomRuntimeLogEvent) => void;
}

function copyEvent(event: RoomRuntimeLogEvent): RoomRuntimeLogEvent {
  return JSON.parse(JSON.stringify(event)) as RoomRuntimeLogEvent;
}

export function createInMemoryRuntimeLogRegistry(options: InMemoryRuntimeLogRegistryOptions = {}): RuntimeLogRegistry {
  const byRoom = new Map<string, RoomRuntimeLogEvent[]>();
  const pendingIds = new Map<string, Set<string>>();
  const nextSequences = new Map<string, number>();

  return {
    append(roomId, event, appendOptions) {
      const events = byRoom.get(roomId) ?? [];
      const seq = nextSequences.get(roomId) ?? (events.length === 0 ? 1 : events[events.length - 1].seq + 1);
      nextSequences.set(roomId, seq + 1);
      const stored: RoomRuntimeLogEvent = { ...event, roomId, seq };
      events.push(stored);
      byRoom.set(roomId, events);
      if (appendOptions?.pending === true) {
        const pending = pendingIds.get(roomId) ?? new Set<string>();
        pending.add(stored.eventId);
        pendingIds.set(roomId, pending);
      }
      try {
        options.onEventAppended?.(copyEvent(stored));
      } catch {
        // Durable observers must never break live RuntimeLog authority.
      }
      return stored;
    },
    list(roomId, options) {
      const events = byRoom.get(roomId) ?? [];
      const pending = pendingIds.get(roomId);
      const confirmed = pending ? events.filter((event) => !pending.has(event.eventId)) : events;
      const latestSeq = confirmed.length === 0 ? 0 : confirmed[confirmed.length - 1].seq;
      const afterSeq = options?.afterSeq;
      const filtered =
        typeof afterSeq === 'number' ? confirmed.filter((e) => e.seq > afterSeq) : confirmed.slice();
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
      if (restored.length > 0) {
        byRoom.set(roomId, restored);
        nextSequences.set(roomId, (restored[restored.length - 1]?.seq ?? 0) + 1);
      }
      return {
        decision: 'restored',
        restoredCount: restored.length,
        latestSeq: restored[restored.length - 1]?.seq ?? 0,
      };
    },
    confirmPending(roomId, eventId) {
      const pending = pendingIds.get(roomId);
      if (!pending?.delete(eventId)) return 'notFound';
      if (pending.size === 0) pendingIds.delete(roomId);
      return 'confirmed';
    },
    discardPending(roomId, eventId) {
      const events = byRoom.get(roomId);
      if (!events) return 'notFound';
      const pending = pendingIds.get(roomId);
      if (!pending?.has(eventId)) {
        return events.some((event) => event.eventId === eventId) ? 'alreadyConfirmed' : 'notFound';
      }
      const index = events.findIndex((event) => event.eventId === eventId);
      if (index < 0) return 'notFound';
      events.splice(index, 1);
      pending.delete(eventId);
      if (pending.size === 0) pendingIds.delete(roomId);
      if (events.length === 0) byRoom.delete(roomId);
      return 'discarded';
    },
    clearRoom(roomId) {
      byRoom.delete(roomId);
      pendingIds.delete(roomId);
      nextSequences.delete(roomId);
    },
  };
}
