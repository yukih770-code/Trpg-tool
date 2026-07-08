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
export function createInMemoryRuntimeLogRegistry() {
    const byRoom = new Map();
    return {
        append(roomId, event) {
            const events = byRoom.get(roomId) ?? [];
            const seq = events.length === 0 ? 1 : events[events.length - 1].seq + 1;
            const stored = { ...event, roomId, seq };
            events.push(stored);
            byRoom.set(roomId, events);
            return stored;
        },
        list(roomId, options) {
            const events = byRoom.get(roomId) ?? [];
            const latestSeq = events.length === 0 ? 0 : events[events.length - 1].seq;
            const afterSeq = options?.afterSeq;
            const filtered = typeof afterSeq === 'number' ? events.filter((e) => e.seq > afterSeq) : events.slice();
            return { roomId, latestSeq, events: filtered };
        },
        clearRoom(roomId) {
            byRoom.delete(roomId);
        },
    };
}
