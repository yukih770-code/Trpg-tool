export type DndRollMode = 'normal' | 'advantage' | 'disadvantage';

export type DndCheckKind = 'ability' | 'skill' | 'save' | 'generic';

export type DndDiceGroup = {
  count: number;
  sides: number;
  sign: 1 | -1;
};

export type ParsedDndDiceFormula = {
  formula: string;
  diceGroups: DndDiceGroup[];
  modifier: number;
};

export type DndDiceRoll = {
  group: DndDiceGroup;
  rolls: number[];
  subtotal: number;
};

export type DndFormulaRollResult = {
  formula: string;
  parsed: ParsedDndDiceFormula;
  dice: DndDiceRoll[];
  modifier: number;
  total: number;
};

export type DndCheckResult = {
  kind: DndCheckKind;
  actorName?: string;
  label?: string;
  mode: DndRollMode;
  rawRolls: number[];
  keptRoll: number;
  modifier: number;
  total: number;
  dc?: number;
  outcome?: 'success' | 'failure';
  isNatural20: boolean;
  isNatural1: boolean;
};

export type DndAttackResult = {
  attackerName?: string;
  targetName?: string;
  mode: DndRollMode;
  rawRolls: number[];
  keptRoll: number;
  attackBonus: number;
  total: number;
  targetAc?: number;
  outcome: 'hit' | 'miss' | 'unknown';
  isCritical: boolean;
  isNatural1: boolean;
};

export type DndDamageResult = DndFormulaRollResult & {
  isCritical: boolean;
};

export type DndRuntimeEventKind =
  | 'dnd.check_rolled'
  | 'dnd.save_rolled'
  | 'dnd.skill_rolled'
  | 'dnd.attack_rolled'
  | 'dnd.damage_rolled'
  | 'dnd.roll_note';

export type DndRuntimeEventDraft = {
  eventKind: DndRuntimeEventKind;
  payload: Record<string, unknown>;
};

export type DndRollRandom = () => number;
