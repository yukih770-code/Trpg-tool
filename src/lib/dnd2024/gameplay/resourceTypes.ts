/**
 * DND gameplay resource contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_RESOURCE_TYPES_V1
 *
 * Declares resource references / costs / state shapes. No rules are applied here.
 * Layer boundaries (from the Core Gameplay Boundary Audit):
 *   - action / bonusAction / reaction / movement → Runtime resource (per turn),
 *   - spellSlot / classResource → Campaign Actor resource, spent during Runtime,
 *   - itemCharge → ItemInstance state,
 *   - consumableQuantity → Campaign Authority inventory change.
 * These types do NOT decide where state lives; they only name the resource.
 */

export type DndResourceKind =
  | 'action'
  | 'bonusAction'
  | 'reaction'
  | 'movement'
  | 'spellSlot'
  | 'classResource'
  | 'itemCharge'
  | 'consumableQuantity'
  | 'hitDice'
  | 'custom';

/** Identifies a specific resource (e.g. a level-2 spell slot, or a class pool). */
export interface DndResourceRef {
  kind: DndResourceKind;
  resourceId?: string;
  /** Spell slot level / hit-die size, when relevant. */
  level?: number;
  /** For itemCharge / consumableQuantity, the owning instance. */
  itemInstanceId?: string;
}

/** A cost an action pays from a resource. */
export interface DndResourceCost {
  resource: DndResourceRef;
  amount: number;
  note?: string;
}

/** Current/maximum state of a resource and how it refreshes. */
export interface DndResourceState {
  resource: DndResourceRef;
  current: number;
  max?: number;
  refresh?: 'turn' | 'shortRest' | 'longRest' | 'manual' | 'never';
}
