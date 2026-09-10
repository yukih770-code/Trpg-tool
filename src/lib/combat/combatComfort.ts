import type { Combatant, CombatRuntimeEventDraft } from './combatRuntimeTypes.js';

export type CombatChangeContext = {
  sourceName?: string;
  note?: string;
  rollRef?: string;
};

export type CombatDamagePreset = {
  amount: number;
  sourceName?: string;
  targetName?: string;
  rollRef?: string;
  nonce: number;
};

export type CombatantVitalChange = {
  combatant: Combatant;
  beforeHp?: number;
  afterHp?: number;
  beforeTemporaryHp?: number;
  afterTemporaryHp?: number;
  absorbedByTemporaryHp?: number;
};

function amount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function payloadFor(change: CombatantVitalChange, context: CombatChangeContext, value: number): Record<string, unknown> {
  return {
    sourceName: context.sourceName,
    targetCombatantId: change.combatant.id,
    targetName: change.combatant.displayName,
    amount: value,
    beforeHp: change.beforeHp,
    afterHp: change.afterHp,
    beforeTemporaryHp: change.beforeTemporaryHp,
    afterTemporaryHp: change.afterTemporaryHp,
    note: context.note,
    rollRef: context.rollRef,
  };
}

export function applyDamage(combatant: Combatant, rawAmount: number): CombatantVitalChange {
  const value = amount(rawAmount);
  const beforeHp = combatant.hpCurrent;
  const beforeTemporaryHp = combatant.temporaryHp ?? 0;
  const absorbedByTemporaryHp = Math.min(beforeTemporaryHp, value);
  const remaining = value - absorbedByTemporaryHp;
  const afterTemporaryHp = beforeTemporaryHp - absorbedByTemporaryHp;
  const afterHp = beforeHp === undefined ? undefined : Math.max(0, beforeHp - remaining);
  return {
    combatant: { ...combatant, hpCurrent: afterHp, hitPoints: afterHp, temporaryHp: afterTemporaryHp || undefined },
    beforeHp,
    afterHp,
    beforeTemporaryHp,
    afterTemporaryHp,
    absorbedByTemporaryHp,
  };
}

export function applyHealing(combatant: Combatant, rawAmount: number): CombatantVitalChange {
  const value = amount(rawAmount);
  const beforeHp = combatant.hpCurrent;
  const afterHp = beforeHp === undefined ? undefined : combatant.hpMax === undefined ? beforeHp + value : Math.min(combatant.hpMax, beforeHp + value);
  return { combatant: { ...combatant, hpCurrent: afterHp, hitPoints: afterHp }, beforeHp, afterHp, beforeTemporaryHp: combatant.temporaryHp, afterTemporaryHp: combatant.temporaryHp };
}

export function applyTemporaryHp(combatant: Combatant, rawAmount: number, replace = false): CombatantVitalChange {
  const value = amount(rawAmount);
  const beforeTemporaryHp = combatant.temporaryHp ?? 0;
  const afterTemporaryHp = replace ? value : Math.max(beforeTemporaryHp, value);
  return { combatant: { ...combatant, temporaryHp: afterTemporaryHp || undefined }, beforeHp: combatant.hpCurrent, afterHp: combatant.hpCurrent, beforeTemporaryHp, afterTemporaryHp };
}

export function overrideHitPoints(combatant: Combatant, rawValue: number): CombatantVitalChange {
  const beforeHp = combatant.hpCurrent;
  const next = amount(rawValue);
  const afterHp = combatant.hpMax === undefined ? next : Math.min(combatant.hpMax, next);
  return { combatant: { ...combatant, hpCurrent: afterHp, hitPoints: afterHp }, beforeHp, afterHp, beforeTemporaryHp: combatant.temporaryHp, afterTemporaryHp: combatant.temporaryHp };
}

export function addCondition(combatant: Combatant, condition: string): Combatant {
  const value = condition.trim();
  if (!value || combatant.conditions.includes(value)) return combatant;
  return { ...combatant, conditions: [...combatant.conditions, value] };
}

export function removeCondition(combatant: Combatant, condition: string): Combatant {
  return { ...combatant, conditions: combatant.conditions.filter((item) => item !== condition.trim()) };
}

export function toggleCondition(combatant: Combatant, condition: string): { combatant: Combatant; added: boolean } {
  const value = condition.trim();
  const added = Boolean(value) && !combatant.conditions.includes(value);
  return { combatant: added ? addCondition(combatant, value) : removeCondition(combatant, value), added };
}

export function createDamageEvent(change: CombatantVitalChange, rawAmount: number, context: CombatChangeContext = {}): CombatRuntimeEventDraft {
  return { eventKind: 'combat.damage_applied', payload: { ...payloadFor(change, context, amount(rawAmount)), absorbedByTemporaryHp: change.absorbedByTemporaryHp } };
}

export function createHealingEvent(change: CombatantVitalChange, rawAmount: number, context: CombatChangeContext = {}): CombatRuntimeEventDraft {
  return { eventKind: 'combat.healing_applied', payload: payloadFor(change, context, amount(rawAmount)) };
}

export function createTemporaryHpEvent(change: CombatantVitalChange, rawAmount: number, context: CombatChangeContext = {}, replace = false): CombatRuntimeEventDraft {
  return { eventKind: 'combat.temporary_hp_applied', payload: { ...payloadFor(change, context, amount(rawAmount)), replace } };
}

export function createHitPointOverrideEvent(change: CombatantVitalChange, context: CombatChangeContext = {}): CombatRuntimeEventDraft {
  return { eventKind: 'combat.hp_overridden', payload: payloadFor(change, context, change.afterHp ?? 0) };
}

export function createConditionEvent(combatant: Combatant, condition: string, added: boolean, context: CombatChangeContext = {}, toggled = false): CombatRuntimeEventDraft {
  return { eventKind: toggled ? 'combat.condition_toggled' : added ? 'combat.condition_added' : 'combat.condition_removed', payload: { sourceName: context.sourceName, targetCombatantId: combatant.id, targetName: combatant.displayName, condition: condition.trim(), added, note: context.note } };
}
