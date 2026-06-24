/**
 * DND gameplay action contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_ACTION_TYPES_V1
 *
 * A `DndActionDefinition` describes WHAT an actor can do (a weapon attack, a
 * cast spell, a class feature, an item use). It carries an action-economy cost,
 * targeting, an optional shared roll profile, optional resource costs, and
 * references to the effects it produces — but NO roll/damage logic and NO
 * resolver. Actions are generated from items / spells / class features; this
 * module only declares the shape.
 *
 * Source grounding (owner-source 术语汇编/动作, 法术/施法时间): the 2024 action
 * economy is Action / Bonus Action / Reaction / Movement plus a free Object
 * Interaction; spells are cast via the Magic action with casting times of
 * Action / Bonus Action / Reaction / longer.
 */

import type { DndRollProfile } from './rollTypes';
import type { DndResourceCost } from './resourceTypes';

export type DndActionSourceType =
  | 'item'
  | 'spell'
  | 'classFeature'
  | 'feat'
  | 'condition'
  | 'custom';

export type DndActionKind =
  | 'attack'
  | 'castSpell'
  | 'useItem'
  | 'classFeature'
  | 'movement'
  | 'utility'
  | 'reaction'
  | 'custom';

export type DndActionCostType =
  | 'action'
  | 'bonusAction'
  | 'reaction'
  | 'movement'
  | 'free'
  | 'objectInteraction'
  | 'longer';

export interface DndActionCost {
  type: DndActionCostType;
  amount?: number;
  note?: string;
}

/** Range characteristics for an action's targeting (feet by default). */
export interface DndRangeProfile {
  /** Normal range (or thrown/ranged short range). */
  normal?: number;
  /** Long range, where rolls are at disadvantage (ranged/thrown). */
  long?: number;
  /** Melee reach, when applicable. */
  reach?: number;
  unit?: 'ft' | 'm' | 'self' | 'touch';
  note?: string;
}

export type DndAreaShape =
  | 'sphere'
  | 'cube'
  | 'cone'
  | 'line'
  | 'cylinder'
  | 'emanation'
  | 'custom';

export interface DndAreaProfile {
  shape: DndAreaShape;
  size?: number;
  unit?: 'ft' | 'm';
  note?: string;
}

export interface DndTargetingProfile {
  targetType:
    | 'self'
    | 'creature'
    | 'object'
    | 'point'
    | 'area'
    | 'ally'
    | 'enemy'
    | 'none';
  range?: DndRangeProfile;
  area?: DndAreaProfile;
  requiresLineOfSight?: boolean;
  maxTargets?: number;
}

export interface DndActionDefinition {
  id: string;
  name: string;
  sourceType: DndActionSourceType;
  /** Reference to the originating item / spell / feature definition. */
  sourceRef: string;
  kind: DndActionKind;
  actionCost: DndActionCost;
  targeting: DndTargetingProfile;
  rollProfile?: DndRollProfile;
  resourceCost?: DndResourceCost[];
  /** Ids of the effects this action produces (see effectTypes). */
  effectRefs: string[];
  tags?: string[];
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
  note?: string;
}
