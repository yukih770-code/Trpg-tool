/**
 * listRuntimeLogEvents service (RuntimeLog server v0).
 *
 * AI-LANDMARK: ROOM_SERVER_LIST_RUNTIME_LOG_V0
 *
 * Reads raw stored events for a verified route. Viewer projection happens after
 * this service because it needs the resolved room member and map/combat context.
 */

import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import type { RoomRuntimeLogListResult } from '../protocol/room-protocol.js';

export interface ListRuntimeLogEventsServiceInput {
  roomId: string;
  afterSeq?: number;
  includeHostOnly?: boolean;
}

export interface ListRuntimeLogEventsResult {
  decision: 'ok' | 'roomNotFound' | 'invalidAfterSeq';
  result?: RoomRuntimeLogListResult;
  message?: string;
}

export function listRuntimeLogEvents(
  roomRegistry: RoomRegistry,
  logRegistry: RuntimeLogRegistry,
  input: ListRuntimeLogEventsServiceInput,
): ListRuntimeLogEventsResult {
  const room = roomRegistry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };

  if (input.afterSeq !== undefined && (!Number.isInteger(input.afterSeq) || input.afterSeq < 0)) {
    // isInteger also rejects NaN / Infinity / decimals.
    return { decision: 'invalidAfterSeq', message: 'afterSeq must be a non-negative integer.' };
  }

  const raw = logRegistry.list(input.roomId, { afterSeq: input.afterSeq });
  const events = raw.events.filter((event) => event.visibility === 'public' || (input.includeHostOnly === true && event.visibility === 'hostOnly'));
  return { decision: 'ok', result: { roomId: raw.roomId, latestSeq: raw.latestSeq, events } };
}
