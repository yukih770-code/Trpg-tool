/**
 * DND gameplay roll contracts (v1, types only).
 *
 * AI-LANDMARK: DND_GAMEPLAY_ROLL_TYPES_V1
 *
 * A single roll primitive shared by attack rolls, saving throws, ability checks,
 * damage and healing. No dice are rolled here — this module declares request /
 * profile / result SHAPES only; a future resolver produces the results. Source
 * grounding: attack-vs-AC and save-vs-DC are two modes of one roll primitive
 * (owner-source: 进行游戏 / 法术 — confirmed conceptually, not numerically).
 */

export type DndRollMode =
  | 'attack'
  | 'savingThrow'
  | 'abilityCheck'
  | 'damage'
  | 'healing'
  | 'custom';

export type DndAbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type DndAdvantageMode = 'normal' | 'advantage' | 'disadvantage';

/** A dice expression, e.g. { count: 2, faces: 6, modifier: 3 } == 2d6+3. */
export interface DndDiceFormula {
  count: number;
  faces: number;
  modifier?: number;
  label?: string;
}

/** A named additive bonus contributing to a roll (proficiency, magic, buff, …). */
export interface DndRollBonus {
  id: string;
  label: string;
  value: number;
  sourceRef?: string;
}

/** Declarative description of how a roll should be made (not the result). */
export interface DndRollProfile {
  mode: DndRollMode;
  ability?: DndAbilityKey;
  proficient?: boolean;
  advantageMode?: DndAdvantageMode;
  targetDefense?: 'ac' | 'savingThrowDc' | 'manualDc' | 'none';
  dice?: DndDiceFormula[];
  bonuses?: DndRollBonus[];
  note?: string;
}

/** A request to perform a roll (input to a future resolver). */
export interface DndRollRequest {
  actorId: string;
  actionId?: string;
  mode: DndRollMode;
  profile: DndRollProfile;
  targetId?: string;
  manualDc?: number;
}

/** The outcome of a roll (output of a future resolver). */
export interface DndRollResult {
  request: DndRollRequest;
  d20?: number;
  diceResults?: number[];
  total: number;
  success?: boolean;
  critical?: 'none' | 'criticalHit' | 'criticalMiss';
  breakdown?: string[];
}
