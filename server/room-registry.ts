/**
 * In-memory Room registry (scaffold v0).
 *
 * AI-LANDMARK: ROOM_SERVER_REGISTRY_V0
 *
 * Minimal Map-based registry of RoomSnapshots. No files, no database, no
 * network, no permissions, no zustand. In-memory only — lost on restart.
 */

import type { RoomSnapshot } from './protocol/room-protocol.js';

export interface RoomRegistry {
  create(snapshot: RoomSnapshot): RoomSnapshot;
  get(roomId: string): RoomSnapshot | undefined;
  getByCode(roomCode: string): RoomSnapshot | undefined;
  update(roomId: string, updater: (room: RoomSnapshot) => RoomSnapshot): RoomSnapshot | undefined;
  list(): RoomSnapshot[];
}

export interface InMemoryRoomRegistryOptions {
  /** Best-effort observer for durable lifecycle adapters. Never affects a live mutation. */
  onRoomUpdated?: (snapshot: RoomSnapshot) => void;
}

export function createInMemoryRoomRegistry(options: InMemoryRoomRegistryOptions = {}): RoomRegistry {
  const byId = new Map<string, RoomSnapshot>();

  return {
    create(snapshot) {
      byId.set(snapshot.identity.roomId, snapshot);
      return snapshot;
    },
    get(roomId) {
      return byId.get(roomId);
    },
    getByCode(roomCode) {
      for (const room of byId.values()) {
        if (room.identity.roomCode === roomCode) return room;
      }
      return undefined;
    },
    update(roomId, updater) {
      const current = byId.get(roomId);
      if (!current) return undefined;
      const next = updater(current);
      byId.set(roomId, next);
      try {
        options.onRoomUpdated?.(next);
      } catch {
        // A persistence observer must never break a live lobby mutation.
      }
      return next;
    },
    list() {
      return [...byId.values()];
    },
  };
}
