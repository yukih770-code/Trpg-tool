import type { BackgroundDef, CharacterData, ClassDef } from '../dnd-types';
import { initializeClassResourcesForCharacter } from './resource-utils';

export type DndLevelOneBuilderSection =
  | 'identity'
  | 'species'
  | 'background'
  | 'class'
  | 'abilities'
  | 'feats'
  | 'spells'
  | 'equipment'
  | 'review';

export type DndLevelOneReadinessCode =
  | 'missing-name'
  | 'missing-species'
  | 'missing-subspecies'
  | 'missing-background'
  | 'missing-class'
  | 'missing-subclass'
  | 'missing-origin-feat'
  | 'invalid-point-buy'
  | 'not-level-one'
  | 'spell-selection-empty'
  | 'spell-data-incomplete'
  | 'starter-equipment-not-materialized';

export type DndLevelOneReadinessIssue = {
  code: DndLevelOneReadinessCode;
  section: DndLevelOneBuilderSection;
  severity: 'blocker' | 'warning';
};

export type DndLevelOneReadinessContext = {
  requiresSubspecies?: boolean;
  requiresSubclass?: boolean;
  isCaster?: boolean;
  spellDataIncomplete?: boolean;
  starterEquipmentNeedsMaterialization?: boolean;
};

export type DndLevelOneReadiness = {
  ready: boolean;
  blockers: DndLevelOneReadinessIssue[];
  warnings: DndLevelOneReadinessIssue[];
};

function pointBuyCost(pointBuyIncrease: number): number {
  let cost = 0;
  for (let value = 1; value <= pointBuyIncrease; value += 1) {
    cost += value + 8 <= 13 ? 1 : 2;
  }
  return cost;
}

function hasValidPointBuy(character: CharacterData): boolean {
  const increases = Object.values(character.attrs).map((attribute) => attribute.pointbuy);
  if (increases.some((value) => !Number.isInteger(value) || value < 0 || value > 7)) return false;
  const spent = increases.reduce((total, value) => total + pointBuyCost(value), 0);
  return spent === 27 && character.remainingPoints === 0;
}

/**
 * Pure Builder/Audit contract for the data currently represented by the DND
 * character schema. Warnings deliberately do not pretend that the incomplete
 * spell catalog or starter-equipment plan is a finished rules implementation.
 */
export function evaluateDndLevelOneReadiness(
  character: CharacterData,
  context: DndLevelOneReadinessContext = {},
): DndLevelOneReadiness {
  const issues: DndLevelOneReadinessIssue[] = [];
  const blocker = (code: DndLevelOneReadinessCode, section: DndLevelOneBuilderSection) => {
    issues.push({ code, section, severity: 'blocker' });
  };
  const warning = (code: DndLevelOneReadinessCode, section: DndLevelOneBuilderSection) => {
    issues.push({ code, section, severity: 'warning' });
  };

  if (!character.name.trim()) blocker('missing-name', 'identity');
  if (!character.race.trim()) blocker('missing-species', 'species');
  if (context.requiresSubspecies && !character.subrace.trim()) blocker('missing-subspecies', 'species');
  if (!character.background.trim()) blocker('missing-background', 'background');
  if (!character.jobClass.trim()) blocker('missing-class', 'class');
  if (context.requiresSubclass && !character.subclass.trim()) blocker('missing-subclass', 'class');
  if (!character.feats?.length) blocker('missing-origin-feat', 'feats');
  if (!hasValidPointBuy(character)) blocker('invalid-point-buy', 'abilities');
  if (character.level !== 1) blocker('not-level-one', 'review');

  if (context.isCaster && character.spellbook.known.length === 0) {
    warning('spell-selection-empty', 'spells');
  }
  if (context.spellDataIncomplete) warning('spell-data-incomplete', 'spells');
  if (context.starterEquipmentNeedsMaterialization) {
    warning('starter-equipment-not-materialized', 'equipment');
  }

  const blockers = issues.filter((issue) => issue.severity === 'blocker');
  return {
    ready: blockers.length === 0,
    blockers,
    warnings: issues.filter((issue) => issue.severity === 'warning'),
  };
}

export type FinalizeDndLevelOneContext = DndLevelOneReadinessContext & {
  classDefinition?: ClassDef;
  backgroundDefinition?: BackgroundDef;
  spellSlots: CharacterData['spellbook']['slots'];
};

export type FinalizeDndLevelOneResult =
  | { ok: true; character: CharacterData; readiness: DndLevelOneReadiness }
  | { ok: false; readiness: DndLevelOneReadiness };

/** Builds the one authoritative Owned Actor snapshot committed by the store. */
export function finalizeDndLevelOneCharacter(
  character: CharacterData,
  context: FinalizeDndLevelOneContext,
): FinalizeDndLevelOneResult {
  const readiness = evaluateDndLevelOneReadiness(character, context);
  if (!readiness.ready) return { ok: false, readiness };

  const con = character.attrs.Con;
  const constitution = con.base + con.pointbuy + con.racebonus + (con.extrabonus || 0);
  const constitutionModifier = Math.floor((constitution - 10) / 2);
  const hitDie = context.classDefinition
    ? Number(context.classDefinition.hitDice.slice(1))
    : 0;
  const initialHp = Math.max(1, (hitDie || 8) + constitutionModifier);

  const finalizedBase: CharacterData = {
    ...character,
    name: character.name.trim(),
    level: 1,
    classLevels: [{
      className: character.jobClass,
      classId: context.classDefinition?.id,
      level: 1,
      subclass: character.subclass || undefined,
    }],
    hpMax: initialHp,
    hpCurrent: initialHp,
    hitDiceCurrent: 1,
    weaponProficiencies: context.classDefinition?.weaponProficiencies ?? character.weaponProficiencies,
    armorTraining: context.classDefinition?.armorProficiencies ?? character.armorTraining,
    savingThrowProficiencies: context.classDefinition
      ? context.classDefinition.savingThrows as CharacterData['savingThrowProficiencies']
      : character.savingThrowProficiencies,
    skillProficiencies: context.backgroundDefinition?.skillProficiencies ?? character.skillProficiencies,
    spellbook: {
      ...character.spellbook,
      slots: context.spellSlots,
    },
    isCompleted: true,
  };
  const resources = initializeClassResourcesForCharacter(finalizedBase);

  return {
    ok: true,
    readiness,
    character: {
      ...finalizedBase,
      classResources: resources.classResources,
      pactMagicState: resources.pactMagicState,
    },
  };
}

/** Vault completion is an explicit committed lifecycle state, not a UI guess. */
export function isDndCharacterFinalized(character: CharacterData): boolean {
  return Boolean(
    character.isCompleted &&
    character.name.trim() &&
    character.race.trim() &&
    character.background.trim() &&
    character.jobClass.trim(),
  );
}

/** Empty auto-created drafts are flow state and should not appear as Owned Actors. */
export function isPristineDndCharacterDraft(character: CharacterData): boolean {
  return Boolean(
    !character.isCompleted &&
    !character.name.trim() &&
    !character.race.trim() &&
    !character.background.trim() &&
    !character.jobClass.trim() &&
    !character.feats.length &&
    character.remainingPoints === 27,
  );
}
