/**
 * appendRuntimeLogEvent service (RuntimeLog server v0).
 *
 * AI-LANDMARK: ROOM_SERVER_APPEND_RUNTIME_LOG_V0
 *
 * Validates and appends one RuntimeLog event. Server-authoritative: eventId /
 * createdAt / seq are server-generated; campaignRef is copied from the room (never
 * read from the client body); actorBindingId is validated against the room's
 * approved lobby bindings (never blindly trusted).
 *
 * Author/role rules (scaffold semantics, NOT real auth): chat.message requires an
 * active author; host.note, hostOnly, and combat.* require an active HOST
 * author; system.note / dice.roll / state.manualChange may be author-less.
 *
 * actorPrivate is rejected because there is no actor-recipient projection yet.
 * hostOnly is stored and delivered only through the authenticated active-host
 * projection used by the HTTP and WebSocket routes.
 */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import type {
  RoomRuntimeLogEvent,
  RoomRuntimeLogEventKind,
  RoomRuntimeLogVisibility,
} from '../protocol/room-protocol.js';
import { ROOM_RUNTIME_LOG_EVENT_KINDS, SERVER_RESOLVED_EVENT_KINDS } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import { requiresLiveRoomDurableAppend } from './liveRoomDurableAppendConfirmation.js';

const VALID_VISIBILITIES: readonly RoomRuntimeLogVisibility[] = ['public', 'hostOnly', 'actorPrivate'];

export interface AppendRuntimeLogEventServiceInput {
  roomId: string;
  authorMemberId?: string;
  actorBindingId?: string;
  kind: RoomRuntimeLogEventKind;
  visibility?: RoomRuntimeLogVisibility;
  text?: string;
  payload?: unknown;
}

export interface AppendRuntimeLogEventResult {
  decision:
    | 'appended'
    | 'roomNotFound'
    | 'roomClosed'
    | 'memberNotFound'
    | 'memberNotActive'
    | 'memberNotAuthorized'
    | 'invalidActorBinding'
    | 'invalidLogEvent'
    | 'unsupportedVisibility'
    | 'serverResolvedKind';
  event?: RoomRuntimeLogEvent;
  message?: string;
}

/** Shared structural context validation; this grants no append capability. */
export function validateRuntimeLogAppendContext(
  roomRegistry: RoomRegistry, input: AppendRuntimeLogEventServiceInput,
): AppendRuntimeLogEventResult | undefined {
  const room = roomRegistry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound' };
  if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') return { decision: 'roomClosed' };
  const visibility = input.visibility ?? 'public';
  if (!VALID_VISIBILITIES.includes(visibility)) return { decision: 'invalidLogEvent' };
  if (visibility === 'actorPrivate') return { decision: 'unsupportedVisibility' };
  if (input.authorMemberId !== undefined) {
    const member = room.members.find((m) => m.memberId === input.authorMemberId);
    if (!member) return { decision: 'memberNotFound' };
    if (member.status !== 'active') return { decision: 'memberNotActive' };
  }
  if (input.actorBindingId !== undefined) {
    const binding = room.lobby?.actorBindings.find((b) => b.bindingId === input.actorBindingId);
    if (!binding || binding.memberId !== input.authorMemberId || binding.status !== 'approved') return { decision: 'invalidActorBinding' };
  }
  return undefined;
}

export function appendRuntimeLogEvent(
  roomRegistry: RoomRegistry, logRegistry: RuntimeLogRegistry, input: AppendRuntimeLogEventServiceInput,
): AppendRuntimeLogEventResult {
  if ((SERVER_RESOLVED_EVENT_KINDS as readonly string[]).includes(input.kind)) return { decision: 'serverResolvedKind' };
  const invalid = validateRuntimeLogAppendContext(roomRegistry, input);
  if (invalid) return invalid;
  if (!(ROOM_RUNTIME_LOG_EVENT_KINDS as readonly string[]).includes(input.kind)) return { decision: 'invalidLogEvent' };
  const room = roomRegistry.get(input.roomId)!;
  const visibility = input.visibility ?? 'public';
  const author = room.members.find((m) => m.memberId === input.authorMemberId);
  const requiresHost = input.kind === 'host.note' || visibility === 'hostOnly' || input.kind.startsWith('combat.');
  if ((requiresHost && author?.role !== 'host') || (input.kind === 'chat.message' && !author)) return { decision: 'memberNotAuthorized' };
  const event = logRegistry.append(input.roomId, {
    eventId: 'logevent_' + randomUUID(), roomId: input.roomId, createdAt: new Date().toISOString(),
    authorMemberId: input.authorMemberId, actorBindingId: input.actorBindingId,
    campaignRef: room.campaignRef, kind: input.kind, visibility, text: input.text, payload: input.payload,
  }, { pending: requiresLiveRoomDurableAppend(room) });
  return { decision: 'appended', event };
}
