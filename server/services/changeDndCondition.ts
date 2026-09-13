import { randomUUID } from 'node:crypto';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { authorizedRoom, validRuntime, type DndAttackDependencies } from './declareDndAttack.js';
import { applyRuntimeResolution, readAuthoritativeCombat, RuntimeResolutionError } from './applyRuntimeResolution.js';
import { resolveRoomRuntimePermission } from '../room/roomRuntimePermissionGuard.js';
import { isDndConditionId, type DndConditionState } from '../../src/lib/dnd/dndConditions.js';

/** GM adjudication, with typed identities and set semantics (safe to retry). */
export async function changeDndCondition(deps: DndAttackDependencies, input: {
  roomId: string; memberId: string; viewer: CurrentViewerContext; body: Record<string, unknown>;
}) {
  const { intentId, targetCombatantId, conditionId, level } = input.body;
  if (typeof intentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intentId)
    || typeof targetCombatantId !== 'string' || !targetCombatantId || !isDndConditionId(conditionId)
    || !Number.isSafeInteger(level) || (level as number) < 0 || (level as number) > (conditionId === 'exhaustion' ? 6 : 1)) throw new RuntimeResolutionError('invalid_condition');
  const authorize = () => {
    const room = authorizedRoom(deps, input.roomId, input.memberId, input.viewer);
    if (!resolveRoomRuntimePermission({ room, memberId: input.memberId, viewer: input.viewer, action: 'combat.edit' }).allowed) throw new RuntimeResolutionError('forbidden', 403);
    return room;
  };
  const room = authorize();
  const fingerprint = JSON.stringify(['dnd.condition', targetCombatantId, conditionId, level]);
  const result = await deps.intents.run({ roomId: input.roomId, memberId: input.memberId, sessionId: room.identity.sessionId!, intentId, fingerprint,
    history: () => deps.log.list(input.roomId).events,
    execute: async () => {
      await validRuntime(deps, input.roomId, input.memberId, input.viewer); authorize();
      const target = readAuthoritativeCombat(deps.log, input.roomId).combatants.find(c => c.id === targetCombatantId && c.status !== 'removed');
      if (!target) throw new RuntimeResolutionError('invalid_target_combatant');
      const before = target.conditionStates ?? [];
      const after = before.filter(c => !(c.systemId === 'dnd5e-2024' && c.conditionId === conditionId));
      if (level !== 0) after.push({ systemId: 'dnd5e-2024', conditionId, ...(conditionId === 'exhaustion' ? { level: level as number } : {}) } satisfies DndConditionState);
      return applyRuntimeResolution({ rooms: deps.rooms, log: deps.log, confirm: deps.confirm, kind: 'combat.conditions_updated', context: {
        roomId: input.roomId, memberId: input.memberId, sessionId: room.identity.sessionId!, intentId, fingerprint,
        actorCombatantId: targetCombatantId, targetCombatantId, expectedSeq: deps.log.list(input.roomId).latestSeq,
      }, proposal: { systemId: 'dnd5e-2024', resolutionId: randomUUID(), publicSummaryText: 'Condition updated.',
        publicFacts: { conditionId, level }, privilegedFacts: {},
        mutations: [{ type: 'combatantConditions', combatantId: targetCombatantId, beforeConditions: before, afterConditions: after }],
      } });
    } });
  if (result.replayed) { await validRuntime(deps, input.roomId, input.memberId, input.viewer); authorize(); }
  return result;
}
