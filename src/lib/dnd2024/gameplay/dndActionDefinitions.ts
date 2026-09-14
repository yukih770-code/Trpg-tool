/**
 * DND 2024 action definitions (v1, data only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_ACTION_DEFINITIONS_V1
 *
 * Source-backed action data for the dagger Weapon Attack MVP bridge: a melee and
 * a thrown attack, both referencing the SAME shared piercing-damage effect. This
 * is data only — no snapshot selection, rolling, or state mutation. The
 * accepted-Character adapter selects STR/DEX and proficiency from authoritative
 * Character data. Reach, range disadvantage, ammunition/retrieval, and
 * inventory mutation remain outside the current T12 contract.
 */

import type { DndActionDefinition } from './actionTypes.js';

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
      note: 'The accepted-Character adapter chooses STR or DEX from the dagger Finesse options.',
    },
    effectRefs: ['effect.item.dagger.piercing-damage'],
    tags: ['weapon', 'melee', 'dagger'],
    sourceStatus: 'sourced',
    note: 'Melee weapon attack definition. Ability and proficiency are derived from the accepted Character snapshot.',
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
      note: 'Thrown attack uses the same STR/DEX Finesse options as the melee attack.',
    },
    effectRefs: ['effect.item.dagger.piercing-damage'],
    tags: ['weapon', 'thrown', 'dagger'],
    sourceStatus: 'sourced',
    note: 'Thrown weapon attack data only. It is not materialized by the current Character adapter because range and ammunition are not enforced.',
  },
};

/** Look up an action definition by id (data only; no generator). */
export function getDndActionDefinition(id: string): DndActionDefinition | undefined {
  return DND_2024_ACTION_DEFINITIONS[id];
}
