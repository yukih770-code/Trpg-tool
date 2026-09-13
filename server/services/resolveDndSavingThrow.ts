import { randomUUID } from 'node:crypto';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { authorizedRoom, validRuntime, cryptoDndUnitInterval, type DndAttackDependencies } from './declareDndAttack.js';
import { controlledDndRuntimeActor } from './dndRuntimeActorAuthority.js';
import { applyRuntimeResolution, RuntimeResolutionError } from './applyRuntimeResolution.js';
import { DND_ABILITY_KEYS, type DndLiteActorSheet } from '../../src/lib/dnd/dndLiteActorTypes.js';
import { getDndSaveModifier } from '../../src/lib/dnd/dndLiteActorSheet.js';
import { deriveDndLiteActorSheetFromSnapshot } from '../../src/lib/dnd/dndCharacterToLiteActorSheet.js';
import { rollDndCheck } from '../../src/lib/dnd/dndDiceRoller.js';
import type { DndSavingThrowIntent, DndSavingThrowFacts } from '../../src/lib/dnd/dndSavingThrows.js';

function readIntent(body: Record<string, unknown>): DndSavingThrowIntent {
  if (typeof body.intentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.intentId)
    || typeof body.actorInstanceId !== 'string' || !body.actorInstanceId || (body.operation !== 'request' && body.operation !== 'roll')) throw new RuntimeResolutionError('invalid_saving_throw');
  const challenge = typeof body.challengeEventId === 'string' && body.challengeEventId ? body.challengeEventId : undefined;
  if (!challenge && !(DND_ABILITY_KEYS as readonly unknown[]).includes(body.ability)) throw new RuntimeResolutionError('invalid_save_ability');
  if (body.mode !== undefined && !['normal', 'advantage', 'disadvantage'].includes(body.mode as string)) throw new RuntimeResolutionError('invalid_mode');
  if (body.dc !== undefined && (!Number.isSafeInteger(body.dc) || (body.dc as number) < 0 || (body.dc as number) > 100)) throw new RuntimeResolutionError('invalid_dc');
  if (challenge && (body.operation !== 'roll' || body.dc !== undefined || body.ability !== undefined || body.mode !== undefined)) throw new RuntimeResolutionError('challenge_defines_save');
  if (body.operation === 'request' && body.dc === undefined) throw new RuntimeResolutionError('dc_required');
  return { intentId: body.intentId, actorInstanceId: body.actorInstanceId, operation: body.operation,
    challengeEventId: challenge, ability: challenge ? undefined : body.ability as DndSavingThrowIntent['ability'],
    mode: challenge ? undefined : (body.mode ?? 'normal') as DndSavingThrowIntent['mode'], dc: body.dc as number | undefined };
}

/** Approved local D20检定.htm + existing T9 save derivation and T1 dice engine.
 * Conditions/circumstantial modifiers are explicitly GM-adjudicated in V1. */
export async function resolveDndSavingThrow(deps: DndAttackDependencies, input: {
  roomId: string; memberId: string; viewer: CurrentViewerContext; body: Record<string, unknown>;
}) {
  const intent = readIntent(input.body), room = authorizedRoom(deps, input.roomId, input.memberId, input.viewer);
  const fingerprint = JSON.stringify(['dnd.save', intent.actorInstanceId, intent.operation, intent.ability ?? null, intent.mode ?? null, intent.dc ?? null, intent.challengeEventId ?? null]);
  const result = await deps.intents.run({ roomId: input.roomId, memberId: input.memberId, sessionId: room.identity.sessionId!, intentId: intent.intentId, fingerprint,
    history: () => deps.log.list(input.roomId).events,
    execute: async () => {
      await validRuntime(deps, input.roomId, input.memberId, input.viewer);
      const expectedSeq = deps.log.list(input.roomId).latestSeq;
      const { actor, host, bindingId } = await controlledDndRuntimeActor(deps, { ...input, actorInstanceId: intent.actorInstanceId });
      if (!host && (intent.operation === 'request' || intent.dc !== undefined)) throw new RuntimeResolutionError('host_defines_dc', 403);
      if (deps.log.list(input.roomId).latestSeq !== expectedSeq) throw new RuntimeResolutionError('stale_resolution', 409);
      let ability = intent.ability!, mode = intent.mode ?? 'normal', dc = intent.dc;
      if (intent.challengeEventId) {
        const events = deps.log.list(input.roomId).events;
        const challenge = events.find(e => e.eventId === intent.challengeEventId && e.kind === 'runtime.saving_throw_requested');
        const p = challenge?.payload as Record<string, unknown> | undefined;
        const facts = p?.resolution as DndSavingThrowFacts | undefined;
        if (!p || p.actorInstanceId !== intent.actorInstanceId || p.sessionId !== room.identity.sessionId || !facts) throw new RuntimeResolutionError('invalid_save_request');
        if (events.some(e => e.kind === 'runtime.saving_throw_resolved' && (e.payload as any)?.resolution?.challengeEventId === intent.challengeEventId)) throw new RuntimeResolutionError('save_request_already_resolved', 409);
        ability = facts.ability; mode = facts.mode; dc = facts.dc;
      }
      const facts: DndSavingThrowFacts = { actorInstanceId: actor.campaignActorInstanceId, ability, mode, ...(dc !== undefined ? { dc } : {}), ...(intent.challengeEventId ? { challengeEventId: intent.challengeEventId } : {}) };
      if (intent.operation === 'roll') {
        const authored = actor.overridePayload.dndLiteActorSheetV1;
        const sheet = (authored ?? deriveDndLiteActorSheetFromSnapshot(actor.snapshotPayload)?.sheet) as DndLiteActorSheet | undefined;
        const score = sheet?.abilities?.[ability], override = sheet?.savingThrows?.[ability];
        if (!sheet || sheet.schemaVersion !== 1 || !Number.isSafeInteger(score) || score! < 1 || score! > 30
          || (override !== undefined && (!Number.isSafeInteger(override) || override < -100 || override > 100))) throw new RuntimeResolutionError('save_modifier_unavailable');
        const modifier = getDndSaveModifier(sheet, ability);
        const roll = rollDndCheck({ kind: 'save', modifier, mode, dc }, deps.random ?? cryptoDndUnitInterval);
        Object.assign(facts, { rawRolls: roll.rawRolls, keptRoll: roll.keptRoll, modifier, total: roll.total, ...(roll.outcome ? { outcome: roll.outcome } : {}) });
      }
      return applyRuntimeResolution({ rooms: deps.rooms, log: deps.log, confirm: deps.confirm,
        kind: intent.operation === 'request' ? 'runtime.saving_throw_requested' : 'runtime.saving_throw_resolved', context: {
          roomId: input.roomId, memberId: input.memberId, actorBindingId: bindingId, sessionId: room.identity.sessionId!, actorInstanceId: actor.campaignActorInstanceId,
          intentId: intent.intentId, fingerprint, expectedSeq,
        }, proposal: { systemId: 'dnd5e-2024', resolutionId: randomUUID(), publicSummaryText: intent.operation === 'request' ? 'Saving throw requested.' : `Saving throw: ${facts.total}.`, publicFacts: { ...facts }, privilegedFacts: {}, mutations: [] } });
    } });
  if (result.replayed) {
    await validRuntime(deps, input.roomId, input.memberId, input.viewer);
    await controlledDndRuntimeActor(deps, { ...input, actorInstanceId: intent.actorInstanceId });
  }
  return result;
}
