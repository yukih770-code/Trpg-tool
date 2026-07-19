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
 * active author; host.note and hostOnly require an active HOST author;
 * system.note / dice.roll / state.manualChange may be author-less.
 *
 * visibility is a forward-compat field, NOT security isolation in v0: actorPrivate
 * is rejected; hostOnly is STORED BUT NOT PROJECTED (not broadcast, not returned by
 * the public list) — no client may rely on it for privacy until real auth /
 * projection exists. NO host projection / recipient filtering implemented here.
 */

import { randomUUID } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import type {
  RoomRuntimeLogEvent,
  RoomRuntimeLogEventKind,
  RoomRuntimeLogVisibility,
} from '../protocol/room-protocol.js';

const VALID_KINDS: readonly RoomRuntimeLogEventKind[] = [
  'system.note',
  'chat.message',
  'dice.roll',
  'host.note',
  'state.manualChange',
];
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
    | 'unsupportedVisibility';
  event?: RoomRuntimeLogEvent;
  message?: string;
}

export function appendRuntimeLogEvent(
  roomRegistry: RoomRegistry,
  logRegistry: RuntimeLogRegistry,
  input: AppendRuntimeLogEventServiceInput,
): AppendRuntimeLogEventResult {
  const room = roomRegistry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
  if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') {
    return { decision: 'roomClosed', message: 'The room is closed.' };
  }

  if (!VALID_KINDS.includes(input.kind)) {
    return { decision: 'invalidLogEvent', message: `Invalid kind "${String(input.kind)}".` };
  }

  const visibility: RoomRuntimeLogVisibility = input.visibility ?? 'public';
  if (!VALID_VISIBILITIES.includes(visibility)) {
    return { decision: 'invalidLogEvent', message: `Invalid visibility "${String(input.visibility)}".` };
  }
  // v0: actorPrivate has no real projection backing — reject rather than imply
  // privacy that does not exist.
  if (visibility === 'actorPrivate') {
    return { decision: 'unsupportedVisibility', message: 'actorPrivate is not supported in v0.' };
  }

  // Resolve the author (if named) and enforce existence + active. Best-effort
  // scaffold semantics — NOT a real auth/permission system.
  const authorMember =
    input.authorMemberId !== undefined
      ? room.members.find((m) => m.memberId === input.authorMemberId)
      : undefined;
  if (input.authorMemberId !== undefined) {
    if (!authorMember) return { decision: 'memberNotFound', message: `No member "${input.authorMemberId}".` };
    if (authorMember.status !== 'active') {
      return { decision: 'memberNotActive', message: `Member status is "${authorMember.status}".` };
    }
  }

  // Author/role requirements per kind/visibility (scaffold semantics, NOT auth):
  //  - chat.message requires an active author (no anonymous chat).
  //  - host.note and hostOnly require an active HOST author.
  //  - system.note / dice.roll / state.manualChange may be author-less (and are
  //    already active-checked above when an author is present).
  const requiresHostAuthor = input.kind === 'host.note' || visibility === 'hostOnly';
  const requiresAuthor = requiresHostAuthor || input.kind === 'chat.message';
  if (requiresAuthor && !authorMember) {
    return {
      decision: 'memberNotAuthorized',
      message: requiresHostAuthor
        ? 'host.note / hostOnly requires an active host author.'
        : 'chat.message requires an active author.',
    };
  }
  if (requiresHostAuthor && authorMember && authorMember.role !== 'host') {
    return { decision: 'memberNotAuthorized', message: 'host.note / hostOnly requires a host author.' };
  }

  // actorBindingId is never blindly trusted: it must be an approved lobby binding
  // owned by the author.
  if (input.actorBindingId !== undefined) {
    const binding = room.lobby?.actorBindings.find((b) => b.bindingId === input.actorBindingId);
    if (!binding || binding.memberId !== input.authorMemberId || binding.status !== 'approved') {
      return { decision: 'invalidActorBinding', message: 'actorBindingId is not an approved binding for this author.' };
    }
  }

  const event = logRegistry.append(input.roomId, {
    eventId: `logevent_${randomUUID()}`,
    roomId: input.roomId,
    createdAt: new Date().toISOString(),
    authorMemberId: input.authorMemberId,
    actorBindingId: input.actorBindingId,
    // Read-only copy from the room — never from the client body.
    campaignRef: room.campaignRef,
    kind: input.kind,
    visibility,
    text: input.text,
    payload: input.payload,
  });

  return { decision: 'appended', event };
}
