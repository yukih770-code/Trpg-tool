/**
 * DND 2024 effect definitions (v1, data only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_EFFECT_DEFINITIONS_V1
 *
 * Source-backed effect data for the Weapon Attack bridge. Each effect carries
 * only damage dice and type from the owner-source weapon table. The accepted-
 * Character adapter adds the selected
 * ability modifier to the materialized Action, while T12 applies critical-hit
 * rolling. Resistance and vulnerability remain outside the current contract.
 * This module performs no derivation, rolling, or state mutation.
 */

import type { DndEffectDefinition } from './effectTypes.js';
import { DND_STANDARD_MELEE_EFFECT_DEFINITIONS } from './dndStandardMeleeWeaponProfiles.js';

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
      'Damage dice and type are source-backed. Character derivation adds the selected ability modifier; T12 handles critical rolling.',
  },
  ...DND_STANDARD_MELEE_EFFECT_DEFINITIONS,
};

/** Look up an effect definition by id (data only; no application logic). */
export function getDndEffectDefinition(id: string): DndEffectDefinition | undefined {
  return DND_2024_EFFECT_DEFINITIONS[id];
}
