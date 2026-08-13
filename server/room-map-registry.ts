/**
 * In-memory Room Map event registry.
 *
 * Kept separate from RoomSnapshot and RuntimeLog: maps can grow independently
 * and must not be represented as social log entries. Memory remains the live
 * authority. An optional observer mirrors appends, while a validated durable
 * stream can be restored before new live events arrive. Database-backed
 * appends remain invisible while their required durable write is pending.
 */

import type { RoomMapEvent, RoomMapEventListResult } from './protocol/room-protocol.js';

export interface RoomMapRegistry {
  append(roomId: string, event: Omit<RoomMapEvent, 'seq'>, options?: { pending?: boolean }): RoomMapEvent;
  list(roomId: string, options?: { afterSeq?: number; mapId?: string }): RoomMapEventListResult;
  restoreRoom(roomId: string, events: RoomMapEvent[]): {
    decision: 'restored' | 'skippedNonEmpty';
    restoredCount: number;
    latestSeq: number;
  };
  /** Publishes one append after its required durable write succeeds. */
  confirmPending(roomId: string, mapEventId: string): 'confirmed' | 'notFound';
  /** Compensates one unpublished append whose required durable write failed. */
  discardPending(roomId: string, mapEventId: string): 'discarded' | 'notFound' | 'alreadyConfirmed';
  clearRoom(roomId: string): void;
}

export interface InMemoryRoomMapRegistryOptions {
  /** Queues a durable mirror; the HTTP boundary may await and confirm it. */
  onEventAppended?: (event: RoomMapEvent) => void;
}

function copyEvent(event: RoomMapEvent): RoomMapEvent {
  return JSON.parse(JSON.stringify(event)) as RoomMapEvent;
}

export function createInMemoryRoomMapRegistry(options: InMemoryRoomMapRegistryOptions = {}): RoomMapRegistry {
  const byRoom = new Map<string, RoomMapEvent[]>();
  const pendingIds = new Map<string, Set<string>>();
  const nextSequences = new Map<string, number>();

  return {
    append(roomId, event, appendOptions) {
      const events = byRoom.get(roomId) ?? [];
      const seq = nextSequences.get(roomId) ?? (events.length === 0 ? 1 : events[events.length - 1].seq + 1);
      nextSequences.set(roomId, seq + 1);
      const stored: RoomMapEvent = { ...event, roomId, seq };
      events.push(stored);
      byRoom.set(roomId, events);
      if (appendOptions?.pending === true) {
        const pending = pendingIds.get(roomId) ?? new Set<string>();
        pending.add(stored.mapEventId);
        pendingIds.set(roomId, pending);
      }
      try {
        options.onEventAppended?.(copyEvent(stored));
      } catch {
        // Durable observers must never break live Room Map authority.
      }
      return stored;
    },
    list(roomId, options) {
      const events = byRoom.get(roomId) ?? [];
      const pending = pendingIds.get(roomId);
      const confirmed = pending ? events.filter((event) => !pending.has(event.mapEventId)) : events;
      const latestSeq = confirmed.length === 0 ? 0 : confirmed[confirmed.length - 1].seq;
      const filtered = confirmed.filter((event) =>
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
    confirmPending(roomId, mapEventId) {
      const pending = pendingIds.get(roomId);
      if (!pending?.delete(mapEventId)) return 'notFound';
      if (pending.size === 0) pendingIds.delete(roomId);
      return 'confirmed';
    },
    discardPending(roomId, mapEventId) {
      const events = byRoom.get(roomId);
      if (!events) return 'notFound';
      const pending = pendingIds.get(roomId);
      if (!pending?.has(mapEventId)) {
        return events.some((event) => event.mapEventId === mapEventId) ? 'alreadyConfirmed' : 'notFound';
      }
      const index = events.findIndex((event) => event.mapEventId === mapEventId);
      if (index < 0) return 'notFound';
      events.splice(index, 1);
      pending.delete(mapEventId);
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
