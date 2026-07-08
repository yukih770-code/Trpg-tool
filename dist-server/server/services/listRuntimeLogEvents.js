/**
 * listRuntimeLogEvents service (RuntimeLog server v0).
 *
 * AI-LANDMARK: ROOM_SERVER_LIST_RUNTIME_LOG_V0
 *
 * Reads events from the RuntimeLog registry. v0 returns PUBLIC events only (no
 * real projection); latestSeq still reflects the true latest seq so afterSeq
 * cursors advance correctly past withheld (hostOnly) events. NO auth / projection.
 */
export function listRuntimeLogEvents(roomRegistry, logRegistry, input) {
    const room = roomRegistry.get(input.roomId);
    if (!room)
        return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
    if (input.afterSeq !== undefined && (!Number.isInteger(input.afterSeq) || input.afterSeq < 0)) {
        // isInteger also rejects NaN / Infinity / decimals.
        return { decision: 'invalidAfterSeq', message: 'afterSeq must be a non-negative integer.' };
    }
    const raw = logRegistry.list(input.roomId, { afterSeq: input.afterSeq });
    // v0 projection: public only. latestSeq stays the true latest for cursors.
    const events = raw.events.filter((e) => e.visibility === 'public');
    return { decision: 'ok', result: { roomId: raw.roomId, latestSeq: raw.latestSeq, events } };
}
