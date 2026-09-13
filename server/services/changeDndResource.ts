import { randomUUID } from 'node:crypto';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import { authorizedRoom, validRuntime, type DndAttackDependencies } from './declareDndAttack.js';
import { controlledDndRuntimeActor } from './dndRuntimeActorAuthority.js';
import { readDndActorPlayData } from './readDndActorPlayData.js';
import { replayDndRuntimeResources, type DndResourceIntent } from '../../src/lib/dnd/dndRuntimeResources.js';
import { applyRuntimeResolution, RuntimeResolutionError } from './applyRuntimeResolution.js';
import type { RuntimeMutation } from '../../src/lib/platform/systemResolutionTypes.js';

type Request = { roomId: string; memberId: string; viewer: CurrentViewerContext; actorInstanceId: string };
export async function listDndRuntimeResources(deps: DndAttackDependencies, input: Request) {
  await validRuntime(deps, input.roomId, input.memberId, input.viewer);
  const { actor, host } = await controlledDndRuntimeActor(deps, input);
  const data = readDndActorPlayData(actor);
  const recorded = replayDndRuntimeResources(deps.log.list(input.roomId).events, actor.campaignActorInstanceId);
  const resources = [...new Map([...data.resources, ...Object.values(recorded)].map(r => [r.id, r])).values()];
  return { actorInstanceId: actor.campaignActorInstanceId, resources, spells: data.spells, canAdjust: host };
}

function readIntent(body: Record<string, unknown>): DndResourceIntent {
  if (typeof body.intentId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.intentId)
    || typeof body.actorInstanceId !== 'string' || !body.actorInstanceId || !['spend', 'set', 'cast'].includes(body.operation as string)) throw new RuntimeResolutionError('invalid_resource_intent');
  const operation = body.operation as DndResourceIntent['operation'];
  if (operation !== 'cast' && (!Number.isSafeInteger(body.amount) || (body.amount as number) < (operation === 'set' ? 0 : 1) || (body.amount as number) > 100000)) throw new RuntimeResolutionError('invalid_resource_amount');
  if (operation === 'cast' && (typeof body.spellId !== 'string' || !body.spellId)) throw new RuntimeResolutionError('invalid_spell');
  return { intentId: body.intentId, actorInstanceId: body.actorInstanceId, operation,
    resourceId: typeof body.resourceId === 'string' ? body.resourceId : undefined,
    spellId: operation === 'cast' ? body.spellId as string : undefined,
    amount: operation === 'cast' ? 1 : body.amount as number };
}

export async function changeDndResource(deps: DndAttackDependencies, input: Omit<Request, 'actorInstanceId'> & { body: Record<string, unknown> }) {
  const intent = readIntent(input.body), room = authorizedRoom(deps, input.roomId, input.memberId, input.viewer);
  const fingerprint = JSON.stringify(['dnd.resource', intent.actorInstanceId, intent.operation, intent.resourceId ?? null, intent.amount, intent.spellId ?? null]);
  const result = await deps.intents.run({ roomId: input.roomId, memberId: input.memberId, sessionId: room.identity.sessionId!, intentId: intent.intentId, fingerprint,
    history: () => deps.log.list(input.roomId).events,
    execute: async () => {
      await validRuntime(deps, input.roomId, input.memberId, input.viewer);
      const expectedSeq = deps.log.list(input.roomId).latestSeq;
      const { actor, host, bindingId } = await controlledDndRuntimeActor(deps, { ...input, actorInstanceId: intent.actorInstanceId });
      if (intent.operation === 'set' && !host) throw new RuntimeResolutionError('forbidden', 403);
      if (deps.log.list(input.roomId).latestSeq !== expectedSeq) throw new RuntimeResolutionError('stale_resolution', 409);
      const data = readDndActorPlayData(actor);
      const recorded = replayDndRuntimeResources(deps.log.list(input.roomId).events, intent.actorInstanceId);
      const resource = intent.resourceId ? recorded[intent.resourceId] ?? data.resources.find(r => r.id === intent.resourceId) : undefined;
      const spell = intent.operation === 'cast' ? data.spells.find(s => s.id === intent.spellId) : undefined;
      if (intent.operation === 'cast' && !spell) throw new RuntimeResolutionError('spell_not_available');
      const cantrip = spell?.level === 0;
      if (!cantrip && !resource) throw new RuntimeResolutionError('resource_not_available');
      if (cantrip && intent.resourceId) throw new RuntimeResolutionError('cantrip_uses_no_slot');
      if (spell && !cantrip && (resource!.resource.kind !== 'spellSlot' || (resource!.resource.level ?? 0) < spell.level)) throw new RuntimeResolutionError('invalid_spell_slot');
      const after = resource ? intent.operation === 'set' ? intent.amount! : resource.current - intent.amount! : undefined;
      if (resource && (after! < 0 || after! > resource.max)) throw new RuntimeResolutionError('insufficient_or_invalid_resource');
      const mutations: RuntimeMutation[] = resource ? [{ type: 'systemResource', actorInstanceId: actor.campaignActorInstanceId,
        resourceId: resource.id, before: resource.current, after: after!, max: resource.max, metadata: { label: resource.label, resource: resource.resource } }] : [];
      return applyRuntimeResolution({ rooms: deps.rooms, log: deps.log, confirm: deps.confirm, kind: 'runtime.resource_changed', context: {
        roomId: input.roomId, memberId: input.memberId, actorBindingId: bindingId, sessionId: room.identity.sessionId!, intentId: intent.intentId, fingerprint,
        actorInstanceId: actor.campaignActorInstanceId, expectedSeq,
      }, proposal: { systemId: 'dnd5e-2024', resolutionId: randomUUID(), publicSummaryText: spell ? 'Spell cast; effects require adjudication.' : 'Resource updated.',
        publicFacts: { operation: intent.operation, ...(spell ? { spellId: spell.id, spellName: spell.name, spellLevel: spell.level } : {}) }, privilegedFacts: {}, mutations,
      } });
    } });
  if (result.replayed) {
    await validRuntime(deps, input.roomId, input.memberId, input.viewer);
    await controlledDndRuntimeActor(deps, { ...input, actorInstanceId: intent.actorInstanceId });
  }
  return result;
}
