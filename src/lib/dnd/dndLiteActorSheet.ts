import { parseDndDiceFormula } from './dndDiceRoller.js';
import type {
  DndAbilityKey,
  DndLiteActorAction,
  DndLiteActorSheet,
  DndLiteActorSummary,
  DndLiteActorValidation,
  DndLiteCombatantPrefill,
  DndSkillKey,
} from './dndLiteActorTypes.js';

const SKILL_ABILITY: Record<DndSkillKey, DndAbilityKey> = {
  acrobatics: 'dexterity', animalHandling: 'wisdom', arcana: 'intelligence', athletics: 'strength',
  deception: 'charisma', history: 'intelligence', insight: 'wisdom', intimidation: 'charisma',
  investigation: 'intelligence', medicine: 'wisdom', nature: 'intelligence', perception: 'wisdom',
  performance: 'charisma', persuasion: 'charisma', religion: 'intelligence', sleightOfHand: 'dexterity',
  stealth: 'dexterity', survival: 'wisdom',
};

const DEFAULT_ABILITIES: DndLiteActorSheet['abilities'] = {
  strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
};

function finiteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

export function calculateDndAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function createDefaultDndLiteActorSheet(input: { displayName?: string; actorKind?: DndLiteActorSheet['actorKind'] } = {}): DndLiteActorSheet {
  return {
    schemaVersion: 1,
    actorKind: input.actorKind ?? 'pc',
    displayName: input.displayName?.trim() || 'Unnamed actor',
    abilities: { ...DEFAULT_ABILITIES },
    proficiencyBonus: 2,
    defenses: {},
    savingThrows: {},
    skills: {},
    actions: [],
    tags: [],
  };
}

export function validateDndLiteActorSheet(sheet: DndLiteActorSheet): DndLiteActorValidation {
  const errors: string[] = [];
  if (sheet.schemaVersion !== 1) errors.push('Unsupported schema version.');
  if (!sheet.displayName.trim()) errors.push('Display name is required.');
  for (const [key, value] of Object.entries(sheet.abilities)) {
    if (!finiteInteger(value) || value < 1 || value > 30) errors.push(`Invalid ${key} score.`);
  }
  if (!finiteInteger(sheet.proficiencyBonus) || sheet.proficiencyBonus < 0 || sheet.proficiencyBonus > 10) errors.push('Invalid proficiency bonus.');
  const defenses = sheet.defenses;
  for (const [key, value] of Object.entries(defenses)) {
    if (value !== undefined && (!finiteInteger(value) || value < 0 || value > 100000)) errors.push(`Invalid ${key}.`);
  }
  if (defenses.currentHp !== undefined && defenses.maxHp !== undefined && defenses.currentHp > defenses.maxHp) errors.push('Current HP cannot exceed max HP.');
  for (const [key, value] of Object.entries(sheet.savingThrows ?? {})) {
    if (!finiteInteger(value) || value < -100 || value > 100) errors.push(`Invalid ${key} save.`);
  }
  for (const [key, value] of Object.entries(sheet.skills ?? {})) {
    if (!finiteInteger(value) || value < -100 || value > 100) errors.push(`Invalid ${key} skill.`);
  }
  const actionIds = new Set<string>();
  const resourceIds = new Set<string>();
  for (const resource of sheet.resources ?? []) {
    if (!resource.id?.trim() || resourceIds.has(resource.id) || !resource.name?.trim()) errors.push('Resource names and unique IDs are required.');
    resourceIds.add(resource.id);
    if (!finiteInteger(resource.max) || resource.max < 0 || resource.max > 100000) errors.push('Invalid resource capacity.');
    if (!['spellSlot', 'classResource', 'custom'].includes(resource.kind)) errors.push('Invalid resource kind.');
    if (resource.kind === 'spellSlot' && (!finiteInteger(resource.level) || resource.level < 1 || resource.level > 9)) errors.push('Invalid spell slot level.');
  }
  for (const action of sheet.actions) {
    if (!action.id.trim() || actionIds.has(action.id)) errors.push('Action ids must be unique.');
    actionIds.add(action.id);
    if (!action.name.trim()) errors.push('Action name is required.');
    if (action.attackBonus !== undefined && (!finiteInteger(action.attackBonus) || action.attackBonus < -100 || action.attackBonus > 100)) errors.push(`Invalid attack bonus for ${action.name || 'action'}.`);
    if (action.saveDc !== undefined && (!finiteInteger(action.saveDc) || action.saveDc < 0 || action.saveDc > 100)) errors.push(`Invalid save DC for ${action.name || 'action'}.`);
    if (action.damageFormula) {
      try { parseDndDiceFormula(action.damageFormula); } catch { errors.push(`Invalid damage formula for ${action.name || 'action'}.`); }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function getDndSkillModifier(sheet: DndLiteActorSheet, skill: DndSkillKey): number {
  const override = sheet.skills?.[skill];
  return finiteInteger(override) ? override : calculateDndAbilityModifier(sheet.abilities[SKILL_ABILITY[skill]]);
}

export function getDndSaveModifier(sheet: DndLiteActorSheet, ability: DndAbilityKey): number {
  const override = sheet.savingThrows?.[ability];
  return finiteInteger(override) ? override : calculateDndAbilityModifier(sheet.abilities[ability]);
}

export function getDndActionRollInput(action: DndLiteActorAction): Pick<DndLiteActorAction, 'attackBonus' | 'damageFormula' | 'damageType' | 'saveAbility' | 'saveDc'> {
  return { attackBonus: action.attackBonus, damageFormula: action.damageFormula, damageType: action.damageType, saveAbility: action.saveAbility, saveDc: action.saveDc };
}

export function summarizeDndLiteActorSheet(sheet: DndLiteActorSheet): DndLiteActorSummary {
  const hp = sheet.defenses.currentHp;
  const maxHp = sheet.defenses.maxHp;
  return {
    displayName: sheet.displayName,
    actorKind: sheet.actorKind,
    armorClass: sheet.defenses.armorClass,
    hpText: hp === undefined ? undefined : `${hp}${maxHp === undefined ? '' : `/${maxHp}`}`,
    speedFt: sheet.defenses.speedFt,
    actionCount: sheet.actions.length,
    tags: sheet.tags ?? [],
  };
}

export function getDndLiteCombatantPrefill(sheet: DndLiteActorSheet, sourceActorInstanceId?: string): DndLiteCombatantPrefill {
  return {
    displayName: sheet.displayName,
    kind: sheet.actorKind === 'pc' ? 'character' : sheet.actorKind === 'npc' || sheet.actorKind === 'monster' ? 'npc' : 'other',
    sourceActorInstanceId,
    armorClass: sheet.defenses.armorClass,
    hpCurrent: sheet.defenses.currentHp,
    hpMax: sheet.defenses.maxHp,
    temporaryHp: sheet.defenses.temporaryHp,
    notes: [sheet.notes, sheet.tags?.length ? `Tags: ${sheet.tags.join(', ')}` : ''].filter(Boolean).join(' · ') || undefined,
  };
}

export function getDndLiteCheckInput(sheet: DndLiteActorSheet, input: { type: 'ability' | 'skill' | 'save'; ability?: DndAbilityKey; skill?: DndSkillKey }): { modifier: number; label: string } {
  if (input.type === 'skill' && input.skill) return { modifier: getDndSkillModifier(sheet, input.skill), label: input.skill };
  if (input.type === 'save' && input.ability) return { modifier: getDndSaveModifier(sheet, input.ability), label: input.ability };
  const ability = input.ability ?? 'strength';
  return { modifier: calculateDndAbilityModifier(sheet.abilities[ability]), label: ability };
}
