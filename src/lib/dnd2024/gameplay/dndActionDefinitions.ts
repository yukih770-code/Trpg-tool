/**
 * DND 2024 action definitions (v1, data only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_ACTION_DEFINITIONS_V1
 *
 * Source-backed action data for the dagger Weapon Attack MVP bridge: a melee and
 * a thrown attack, both referencing the SAME shared piercing-damage effect. This
 * is data only — no action generator, no resolver, no rolling. Ability modifier
 * (STR/DEX via Finesse), proficiency, reach, range disadvantage, ammunition /
 * retrieval, and inventory changes are future resolver responsibilities.
 */

import type { DndActionDefinition } from './actionTypes';

export const DND_2024_ACTION_DEFINITIONS: Record<string, DndActionDefinition> = {
  'action.item.dagger.melee-weapon-attack': {
    id: 'action.item.dagger.melee-weapon-attack',
    name: '匕首近战攻击',
    sourceType: 'item',
    sourceRef: 'weapon.dagger',
    kind: 'attack',
    actionCost: { type: 'action' },
    targeting: {
      targetType: 'creature',
    },
    rollProfile: {
      mode: 'attack',
      targetDefense: 'ac',
      note: 'Ability modifier is chosen by the future resolver from dagger Finesse options: STR or DEX.',
    },
    effectRefs: ['effect.item.dagger.piercing-damage'],
    tags: ['weapon', 'melee', 'dagger'],
    sourceStatus: 'sourced',
    note: 'Melee weapon attack action data only. Range/reach and proficiency are future resolver responsibilities.',
  },

  'action.item.dagger.thrown-weapon-attack': {
    id: 'action.item.dagger.thrown-weapon-attack',
    name: '匕首投掷攻击',
    sourceType: 'item',
    sourceRef: 'weapon.dagger',
    kind: 'attack',
    actionCost: { type: 'action' },
    targeting: {
      targetType: 'creature',
      range: {
        normal: 20,
        long: 60,
        unit: 'ft',
      },
    },
    rollProfile: {
      mode: 'attack',
      targetDefense: 'ac',
      note: 'Thrown attack uses the same ability as the melee attack; future resolver chooses STR or DEX from Finesse.',
    },
    effectRefs: ['effect.item.dagger.piercing-damage'],
    tags: ['weapon', 'thrown', 'dagger'],
    sourceStatus: 'sourced',
    note: 'Thrown weapon attack action data only. Ammunition, retrieval, inventory changes, and range disadvantage are deferred.',
  },
};

/** Look up an action definition by id (data only; no generator). */
export function getDndActionDefinition(id: string): DndActionDefinition | undefined {
  return DND_2024_ACTION_DEFINITIONS[id];
}
