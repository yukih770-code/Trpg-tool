import { randomInt, randomUUID } from 'node:crypto';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import type { RoomMapRegistry } from '../room-map-registry.js';
import type { PostgresRuntimeEventRepository } from '../adapters/postgresRuntimeEventRepository.js';
import type { RoomRuntimeActorProjectionRepository } from './projectRoomRuntimeActorProjections.js';
import type { DndAttackIntent } from '../../src/lib/dnd/dndAttackIntent.js';
import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import { resolveRoomRuntimePermission } from '../room/roomRuntimePermissionGuard.js';
import { applyRuntimeResolution, readAuthoritativeCombat, RuntimeResolutionError } from './applyRuntimeResolution.js';
import { resolveDndAttackAction, readAuthoredDndAttack } from './resolveDndAttackAction.js';
import { ResolvedIntentIndex } from './resolvedIntentIndex.js';

/** Uniform over 2^32 points, not a perfectly uniform mapping to every die.
 * floor(u*sides) has < sides/2^32 relative bias (d20 worst ~3.7e-9).
 * T1's reviewed dice engine is deliberately reused unchanged. */
export const cryptoDndUnitInterval = () => randomInt(0, 2 ** 32) / (2 ** 32);

export interface DndAttackDependencies {
  rooms: RoomRegistry; log: RuntimeLogRegistry; maps: RoomMapRegistry;
  repository: RoomRuntimeActorProjectionRepository;
  sessions: Pick<PostgresRuntimeEventRepository, 'getRuntimeSessionById'>;
  intents: ResolvedIntentIndex;
  confirm: (event: RoomRuntimeLogEvent) => Promise<boolean>;
  random?: () => number;
}

function fail(code: string, status = 400): never { throw new RuntimeResolutionError(code, status); }
function requiredId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) fail('invalid_request');
  return value;
}
export function readDndAttackIntent(body: Record<string, unknown>): DndAttackIntent {
  const intentId = requiredId(body.intentId);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intentId)) fail('invalid_intent_id');
  const mode = body.mode ?? 'normal';
  if (mode !== 'normal' && mode !== 'advantage' && mode !== 'disadvantage') fail('invalid_mode');
  // No object spread from the request: authoritative-looking extras are ignored.
  return { intentId, actorCombatantId: requiredId(body.actorCombatantId), targetCombatantId: requiredId(body.targetCombatantId), actionId: requiredId(body.actionId), mode };
}

function authorizedRoom(deps: DndAttackDependencies, roomId: string, memberId: string, viewer: CurrentViewerContext) {
  const room = deps.rooms.get(roomId);
  if (!room) fail('roomNotFound', 404);
  const permission = resolveRoomRuntimePermission({ room, viewer, memberId, action: 'combat.action.declare' });
  if (!permission.allowed) fail(permission.code, permission.code === 'unauthenticated' ? 401 : permission.code === 'room_closed' ? 409 : 403);
  if (room.identity.systemId !== 'dnd5e-2024' || room.campaignRef?.systemId !== room.identity.systemId) fail('system_mismatch');
  if (!room.identity.sessionId || !room.campaignRef?.campaignId || !room.campaignRef.worldServerId) fail('invalid_runtime', 409);
  return room;
}

async function validRuntime(deps: DndAttackDependencies, roomId: string, memberId: string, viewer: CurrentViewerContext) {
  const room = authorizedRoom(deps, roomId, memberId, viewer);
  const result = await deps.sessions.getRuntimeSessionById(room.identity.sessionId!);
  if (!result.ok) fail('runtime_unavailable', 503);
  const session = result.value;
  if (!session || session.archivedAt || session.endedAt || session.status !== 'active'
    || session.runtimeSessionId !== room.identity.sessionId || session.roomId !== roomId || session.campaignId !== room.campaignRef!.campaignId) fail('invalid_runtime', 409);
  return authorizedRoom(deps, roomId, memberId, viewer);
}

/** Client-authored combatant/controller fields are links, never permission grants. */
async function actingSource(deps: DndAttackDependencies, roomId: string, memberId: string, viewer: CurrentViewerContext, actorCombatantId: string) {
  const room = authorizedRoom(deps, roomId, memberId, viewer);
  const actor = readAuthoritativeCombat(deps.log, roomId).combatants.find((c) => c.id === actorCombatantId && c.status === 'active' && !c.isDefeated);
  if (!actor) fail('invalid_actor_combatant');
  const mapEvents = deps.maps.list(roomId).events;
  const tokens = [...new Set(mapEvents.map((e) => e.mapId))].flatMap((mapId) => replayMapRuntimeEvents(mapEvents.filter((e) => e.mapId === mapId), mapId).tokens);
  const token = actor.mapTokenId ? tokens.find((t) => t.id === actor.mapTokenId) : undefined;
  if (actor.mapTokenId && !token) fail('invalid_actor_link', 403);
  const tokenSource = token?.sourceActorInstanceId ?? token?.campaignActorId;
  const sourceId = actor.sourceActorInstanceId ?? tokenSource;
  if (!sourceId || (tokenSource && sourceId !== tokenSource)) fail('invalid_actor_link', 403);
  const result = await deps.repository.getCampaignActorInstanceById(sourceId);
  if (!result.ok) fail('actor_unavailable', 503);
  const current = authorizedRoom(deps, roomId, memberId, viewer);
  const record = result.value;
  if (!record || record.archivedAt || record.campaignActorInstanceId !== sourceId || record.campaignId !== current.campaignRef!.campaignId) fail('invalid_actor_source', 403);
  const fullControl = resolveRoomRuntimePermission({ room: current, viewer, memberId, action: 'combat.edit' }).allowed;
  if (fullControl) return { record, bindingId: undefined };
  const member = current.members.find((m) => m.memberId === memberId)!;
  const binding = current.lobby?.actorBindings.find((b) => b.memberId === memberId && b.status === 'approved'
    && (!b.clearance || b.clearance.status === 'approved') && b.campaignActorInstanceId === sourceId
    && b.actorRef.systemId === current.identity.systemId
    && (!token?.actorBindingId || token.actorBindingId === b.bindingId));
  if (!binding || !member.userId || record.ownerId !== member.userId) fail('actor_not_controlled', 403);
  return { record, bindingId: binding.bindingId };
}

export async function listDndAttackActions(deps: DndAttackDependencies, input: { roomId: string; memberId: string; viewer: CurrentViewerContext; actorCombatantId: string }) {
  await validRuntime(deps, input.roomId, input.memberId, input.viewer);
  const { record } = await actingSource(deps, input.roomId, input.memberId, input.viewer, requiredId(input.actorCombatantId));
  const sheet = record.overridePayload.dndLiteActorSheetV1 as { actions?: Array<{ id?: unknown }> } | undefined;
  return (Array.isArray(sheet?.actions) ? sheet.actions : []).flatMap((action) => {
    if (!action || typeof action.id !== 'string') return [];
    try { const resolved = readAuthoredDndAttack(record.overridePayload, action.id); return [{ id: resolved.id, name: resolved.name, kind: resolved.kind }]; }
    catch { return []; }
  });
}

export async function declareDndAttack(deps: DndAttackDependencies, input: {
  roomId: string; memberId: string; viewer: CurrentViewerContext; body: Record<string, unknown>;
}) {
  const intent = readDndAttackIntent(input.body);
  const room = authorizedRoom(deps, input.roomId, input.memberId, input.viewer);
  const fingerprint = JSON.stringify([intent.actorCombatantId, intent.targetCombatantId, intent.actionId, intent.mode]);
  // The reservation precedes repository reads and RNG. A retry still validates
  // membership/runtime, but never re-reads action definitions or reruns rules.
  const result = await deps.intents.run({ roomId: input.roomId, sessionId: room.identity.sessionId!, memberId: input.memberId,
    intentId: intent.intentId, fingerprint, history: () => deps.log.list(input.roomId).events,
    execute: async () => {
      await validRuntime(deps, input.roomId, input.memberId, input.viewer);
      const expectedSeq = deps.log.list(input.roomId).latestSeq;
      const mapSeq = deps.maps.list(input.roomId).latestSeq;
      const source = await actingSource(deps, input.roomId, input.memberId, input.viewer, intent.actorCombatantId);
      if (deps.log.list(input.roomId).latestSeq !== expectedSeq || deps.maps.list(input.roomId).latestSeq !== mapSeq) fail('stale_resolution', 409);
      const state = readAuthoritativeCombat(deps.log, input.roomId);
      const target = state.combatants.find((c) => c.id === intent.targetCombatantId && c.status === 'active' && !c.isDefeated);
      if (!target) fail('invalid_target_combatant');
      let proposal;
      try { proposal = resolveDndAttackAction({ target, actionPayload: source.record.overridePayload, intent, resolutionId: randomUUID(), random: deps.random ?? cryptoDndUnitInterval }); }
      catch (error) { fail(error instanceof Error ? error.message : 'invalid_action'); }
      return applyRuntimeResolution({ rooms: deps.rooms, log: deps.log, proposal, confirm: deps.confirm, context: {
        roomId: input.roomId, sessionId: room.identity.sessionId!, memberId: input.memberId, actorBindingId: source.bindingId,
        actorCombatantId: intent.actorCombatantId, targetCombatantId: intent.targetCombatantId, intentId: intent.intentId, fingerprint, expectedSeq,
      } });
    } });
  // No replay to inactive/archived runtimes, including completed cache hits.
  if (result.replayed) await validRuntime(deps, input.roomId, input.memberId, input.viewer);
  return result;
}
