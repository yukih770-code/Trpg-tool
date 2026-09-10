import { randomUUID } from 'node:crypto';
import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import { SERVER_RESOLVED_EVENT_KINDS, type RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import type { SystemResolutionProposal } from '../../src/lib/platform/systemResolutionTypes.js';
import { replayCombatRuntimeEvents } from '../../src/lib/combat/combatRuntimeReplay.js';
import { validateRuntimeLogAppendContext } from './appendRuntimeLogEvent.js';
import { requiresLiveRoomDurableAppend } from './liveRoomDurableAppendConfirmation.js';

export class RuntimeResolutionError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}

// Defense in depth for internal callers outside the HTTP/intent queues. Two
// proposals cannot both validate against an unpublished before-state.
const pendingRooms = new WeakMap<RuntimeLogRegistry, Set<string>>();

export function readAuthoritativeCombat(log: RuntimeLogRegistry, roomId: string) {
  return replayCombatRuntimeEvents(log.list(roomId).events.map((event) => ({
    eventKind: event.kind, payload: event.payload as Record<string, unknown> ?? {}, seq: event.seq, createdAt: event.createdAt,
  })));
}

export interface RuntimeResolutionContext {
  roomId: string; memberId: string; actorBindingId?: string;
  actorCombatantId: string; targetCombatantId: string;
  intentId: string; fingerprint: string; sessionId: string;
  /** Revision of the authoritative history supplied to resolution. */
  expectedSeq: number;
}

/** Partitioned internal append. Only applyRuntimeResolution calls this producer. */
function appendResolvedRuntimeEvent(
  rooms: RoomRegistry, log: RuntimeLogRegistry,
  context: RuntimeResolutionContext, kind: string, proposal: SystemResolutionProposal,
): RoomRuntimeLogEvent {
  if (!(SERVER_RESOLVED_EVENT_KINDS as readonly string[]).includes(kind)) throw new RuntimeResolutionError('invalid_resolved_kind');
  const invalid = validateRuntimeLogAppendContext(rooms, { roomId: context.roomId, authorMemberId: context.memberId,
    actorBindingId: context.actorBindingId, kind: 'combat.attack_resolved', visibility: 'public' });
  if (invalid) throw new RuntimeResolutionError(invalid.decision, 403);
  const room = rooms.get(context.roomId)!;
  if (!room.members.some((m) => m.memberId === context.memberId && (m.role === 'host' || m.role === 'player'))) throw new RuntimeResolutionError('forbidden', 403);
  return log.append(context.roomId, {
    eventId: `logevent_${randomUUID()}`, roomId: context.roomId, createdAt: new Date().toISOString(),
    authorMemberId: context.memberId, actorBindingId: context.actorBindingId, campaignRef: room.campaignRef,
    kind: 'combat.attack_resolved', visibility: 'public', text: proposal.publicSummaryText,
    payload: { schemaVersion: 1, systemId: proposal.systemId, resolutionId: proposal.resolutionId,
      sessionId: context.sessionId, intentId: context.intentId, fingerprint: context.fingerprint,
      actorCombatantId: context.actorCombatantId, targetCombatantId: context.targetCombatantId,
      resolution: proposal.publicFacts, privileged: proposal.privilegedFacts, mutations: proposal.mutations },
  }, { pending: requiresLiveRoomDurableAppend(room) });
}

/** Validates structural transitions independently of the system's fact bags. */
export async function applyRuntimeResolution(input: {
  rooms: RoomRegistry; log: RuntimeLogRegistry; context: RuntimeResolutionContext;
  proposal: SystemResolutionProposal; kind?: string;
  confirm: (event: RoomRuntimeLogEvent) => Promise<boolean>;
}): Promise<RoomRuntimeLogEvent> {
  const { rooms, log, context } = input;
  // A resolver may retain its proposal. Validate and append our own snapshot so
  // later mutation of its objects cannot change the result during durability.
  const proposal = structuredClone(input.proposal);
  const room = rooms.get(context.roomId);
  if (!room) throw new RuntimeResolutionError('roomNotFound', 404);
  if (proposal.systemId !== room.identity.systemId || proposal.systemId !== room.campaignRef?.systemId) throw new RuntimeResolutionError('system_mismatch');
  if (room.identity.sessionId !== context.sessionId) throw new RuntimeResolutionError('invalid_runtime', 409);
  if (log.list(context.roomId).latestSeq !== context.expectedSeq) throw new RuntimeResolutionError('stale_resolution', 409);
  const state = readAuthoritativeCombat(log, context.roomId);
  for (const id of [context.actorCombatantId, context.targetCombatantId]) {
    if (!state.combatants.some((c) => c.id === id && c.status === 'active' && !c.isDefeated)) throw new RuntimeResolutionError('invalid_combatant');
  }
  if (!proposal.resolutionId || !Array.isArray(proposal.mutations) || proposal.mutations.length !== 1) throw new RuntimeResolutionError('invalid_mutation');
  const m = proposal.mutations[0];
  const target = state.combatants.find((c) => c.id === m.combatantId);
  if (m.type !== 'combatantHp' || !target || m.combatantId !== context.targetCombatantId) throw new RuntimeResolutionError('invalid_mutation');
  if (![m.beforeHp, m.afterHp, m.beforeTemporaryHp, m.afterTemporaryHp].every((n) => Number.isSafeInteger(n) && n >= 0)
    || (target.hpMax !== undefined && (!Number.isSafeInteger(target.hpMax) || m.afterHp > target.hpMax))) throw new RuntimeResolutionError('invalid_hp');
  if (m.beforeHp !== target.hpCurrent || m.beforeTemporaryHp !== (target.temporaryHp ?? 0)) throw new RuntimeResolutionError('stale_resolution', 409);
  const pending = pendingRooms.get(log) ?? new Set<string>();
  if (pending.has(context.roomId)) throw new RuntimeResolutionError('resolution_pending', 409);
  pendingRooms.set(log, pending); pending.add(context.roomId);
  let event: RoomRuntimeLogEvent | undefined;
  try {
    event = appendResolvedRuntimeEvent(rooms, log, context, input.kind ?? 'combat.attack_resolved', proposal);
    if (!await input.confirm(event)) throw new RuntimeResolutionError('durableAppendUnavailable', 503);
    // The T7 confirmer publishes pending events. A false/throw never succeeds.
    if (!log.list(context.roomId).events.some((item) => item.eventId === event!.eventId)) throw new RuntimeResolutionError('durableAppendUnavailable', 503);
    return event;
  } catch (error) {
    if (event) log.discardPending(context.roomId, event.eventId);
    throw error;
  } finally {
    pending.delete(context.roomId);
  }
}
