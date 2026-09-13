import type { DndAbilityKey } from './dndLiteActorTypes.js';
import type { DndRollMode } from './dndDiceTypes.js';
export type DndSavingThrowIntent = {
  intentId: string; actorInstanceId: string; operation: 'request' | 'roll';
  ability?: DndAbilityKey; mode?: DndRollMode; dc?: number; challengeEventId?: string;
};
export type DndSavingThrowFacts = {
  actorInstanceId: string; ability: DndAbilityKey; mode: DndRollMode;
  dc?: number; challengeEventId?: string;
  rawRolls?: number[]; keptRoll?: number; modifier?: number; total?: number; outcome?: 'success' | 'failure';
};
