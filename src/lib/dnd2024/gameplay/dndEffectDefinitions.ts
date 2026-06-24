/**
 * DND 2024 effect definitions (v1, data only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_EFFECT_DEFINITIONS_V1
 *
 * Source-backed effect data for the Weapon Attack MVP bridge. The dagger's
 * piercing-damage effect carries only the damage DICE and TYPE (from the owner-
 * source weapon table). Ability modifier (STR/DEX via Finesse), critical hit,
 * resistance, and vulnerability are deliberately NOT encoded here — they are
 * future resolver responsibilities. No resolver / no rolling in this module.
 */

import type { DndEffectDefinition } from './effectTypes';

export const DND_2024_EFFECT_DEFINITIONS: Record<string, DndEffectDefinition> = {
  'effect.item.dagger.piercing-damage': {
    id: 'effect.item.dagger.piercing-damage',
    name: '匕首穿刺伤害',
    type: 'damage',
    payload: {
      dice: [{ count: 1, faces: 4 }],
      damageType: 'piercing',
    },
    sourceRef: 'weapon.dagger',
    sourceStatus: 'sourced',
    note:
      'Damage dice and damage type are source-backed. Ability modifier, critical hit, resistance, and vulnerability are future resolver responsibilities.',
  },
};

/** Look up an effect definition by id (data only; no application logic). */
export function getDndEffectDefinition(id: string): DndEffectDefinition | undefined {
  return DND_2024_EFFECT_DEFINITIONS[id];
}
