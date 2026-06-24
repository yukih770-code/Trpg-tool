/**
 * DND condition contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_CONDITION_TYPES_V1
 *
 * `DndConditionDefinition` is a RULE DEFINITION (an entry in the fixed 2024
 * condition glossary — owner-source: 术语汇编/状态). `DndAppliedCondition` is
 * RUNTIME STATE (a condition currently on an actor). Per-condition mechanics are
 * intentionally NOT encoded here (pending-source); a definition only references
 * the effects it imposes via `effectRefs`.
 */

import type { DndDurationProfile } from './effectTypes';

/** A glossary entry for a condition (rule definition). */
export interface DndConditionDefinition {
  id: string;
  name: string;
  sourceRef?: string;
  description?: string;
  /** Effects this condition imposes while active (resolved later). */
  effectRefs?: string[];
  sourceStatus?: 'sourced' | 'pending-source' | 'platform';
}

/** A condition currently applied to an actor (Runtime State). */
export interface DndAppliedCondition {
  conditionId: string;
  sourceActionId?: string;
  sourceEffectId?: string;
  appliedByActorId?: string;
  appliedToActorId: string;
  duration?: DndDurationProfile;
  /** Links to the concentration that sustains this condition, if any. */
  concentrationId?: string;
  startedAtRound?: number;
  note?: string;
}
