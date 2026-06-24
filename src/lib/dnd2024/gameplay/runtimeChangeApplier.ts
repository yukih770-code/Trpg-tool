/**
 * DND RuntimeChange applier (v0) — pure function, hpChange only.
 *
 * AI-LANDMARK: DND_RUNTIME_CHANGE_APPLIER_V0
 *
 * This is a v0 PURE RuntimeChange applier.
 *   - It only applies `hpChange` to a RuntimeEncounterState.
 *   - It does NOT implement temp HP settlement, death saves, defeat, healing
 *     caps, clamping, resistance/vulnerability, conditions, resources,
 *     concentration, stores, or logs.
 *   - Resolvers PRODUCE RuntimeChange; this applier RETURNS a new
 *     RuntimeEncounterState (the input is never mutated).
 *   - Store and RuntimeLog integration are future tasks.
 *
 * No Date.now, no Math.random, no uuid, no localStorage, no store, no log.
 */

import type { DndHpChange, DndRuntimeChange } from './runtimeChangeTypes';
import type { DndRuntimeActorState, DndRuntimeEncounterState } from './runtimeStateTypes';

export interface DndRuntimeChangeApplyResult {
  encounter: DndRuntimeEncounterState;
  appliedChangeIds: string[];
  skippedChangeIds: string[];
  notes: string[];
}

/**
 * Apply a list of RuntimeChanges to an encounter. v0 supports ONLY `hpChange`,
 * adjusting `actor.hp.current` by `payload.delta` with no clamping. Any other
 * change type, malformed payload, unknown actor, or actor with temp HP is
 * skipped with a note (temp HP settlement is deliberately deferred).
 */
export function applyRuntimeChangesV0(
  encounter: DndRuntimeEncounterState,
  changes: DndRuntimeChange[],
): DndRuntimeChangeApplyResult {
  const appliedChangeIds: string[] = [];
  const skippedChangeIds: string[] = [];
  const notes: string[] = [];

  // Shallow copy of the actors map; individual actors are cloned only when changed.
  const nextActors: Record<string, DndRuntimeActorState> = { ...encounter.actors };
  let changedAny = false;

  for (const change of changes) {
    if (change.type !== 'hpChange') {
      skippedChangeIds.push(change.id);
      notes.push(`${change.id}: skipped — change type "${change.type}" is not supported in v0 (hpChange only).`);
      continue;
    }

    const payload = change.payload as Partial<DndHpChange> | undefined;
    const actorId = payload?.actorId;
    const delta = payload?.delta;

    if (typeof actorId !== 'string' || typeof delta !== 'number') {
      skippedChangeIds.push(change.id);
      notes.push(`${change.id}: skipped — hpChange payload missing a string actorId or numeric delta.`);
      continue;
    }

    const actor = nextActors[actorId];
    if (!actor) {
      skippedChangeIds.push(change.id);
      notes.push(`${change.id}: skipped — actor "${actorId}" is not in the encounter.`);
      continue;
    }

    if (typeof actor.hp.temp === 'number' && actor.hp.temp > 0) {
      skippedChangeIds.push(change.id);
      notes.push(`${change.id}: skipped — actor "${actorId}" has temp HP; temp HP settlement is deferred.`);
      continue;
    }

    nextActors[actorId] = {
      ...actor,
      hp: { ...actor.hp, current: actor.hp.current + delta },
    };
    appliedChangeIds.push(change.id);
    changedAny = true;
  }

  // Return the original encounter object when nothing changed (no needless clone).
  const nextEncounter: DndRuntimeEncounterState = changedAny
    ? { ...encounter, actors: nextActors }
    : encounter;

  return { encounter: nextEncounter, appliedChangeIds, skippedChangeIds, notes };
}
