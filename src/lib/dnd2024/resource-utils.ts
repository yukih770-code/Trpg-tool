import type { CharacterData, PactMagicState, ResourceState } from '../dnd-types';
import type { ClassResourceDefinition, DndClassKey } from './progression-types';
import {
  getClassProgression,
  getClassResourcesAtLevel,
  getPactMagicAtLevel,
  getProficiencyBonus,
  getResourceDieAtLevel,
  resolveResourceMax,
} from './progression-utils';

const CLASS_NAME_TO_KEY: Record<string, DndClassKey> = {
  野蛮人: 'barbarian',
  吟游诗人: 'bard',
  牧师: 'cleric',
  德鲁伊: 'druid',
  战士: 'fighter',
  武僧: 'monk',
  圣武士: 'paladin',
  游侠: 'ranger',
  游荡者: 'rogue',
  术士: 'sorcerer',
  邪术师: 'warlock',
  法师: 'wizard',
  barbarian: 'barbarian',
  bard: 'bard',
  cleric: 'cleric',
  druid: 'druid',
  fighter: 'fighter',
  monk: 'monk',
  paladin: 'paladin',
  ranger: 'ranger',
  rogue: 'rogue',
  sorcerer: 'sorcerer',
  warlock: 'warlock',
  wizard: 'wizard',
};

function getClassKeyForCharacter(character: Pick<CharacterData, 'jobClass'>): DndClassKey | null {
  return CLASS_NAME_TO_KEY[character.jobClass] ?? null;
}

function getAttributeScore(character: CharacterData, attr: keyof CharacterData['attrs']): number {
  const data = character.attrs[attr];
  return data.base + data.pointbuy + data.racebonus + data.extrabonus;
}

function resolveRuntimeResourceMax(
  resource: Parameters<typeof resolveResourceMax>[0],
  character: CharacterData,
  classLevel: number,
): number {
  if (resource.maxFormula === 'charismaModifierMin1') {
    return Math.max(1, Math.floor((getAttributeScore(character, 'Cha') - 10) / 2));
  }
  if (resource.maxFormula === 'classLevel') {
    return classLevel;
  }
  if (resource.maxFormula === 'classLevelTimes5') {
    return classLevel * 5;
  }

  const resolved = resolveResourceMax(resource, classLevel);
  if (typeof resolved === 'number') return resolved;
  if (resolved === 'proficiencyBonus') return getProficiencyBonus(character.level);
  if (resolved === 'level') return classLevel;
  if (resolved === 'unlimited') return Number.MAX_SAFE_INTEGER;
  return 0;
}

function buildResourceState(
  classKey: DndClassKey,
  character: CharacterData,
  resource: ClassResourceDefinition,
  classLevel: number,
  current?: number,
): ResourceState {
  const max = resolveRuntimeResourceMax(resource, character, classLevel);
  const dice = getResourceDieAtLevel(classKey, resource.id, classLevel);

  return {
    id: resource.id,
    current: current === undefined ? max : Math.max(0, Math.min(max, current)),
    max,
    sourceFeature: resource.sourceFeature,
    recoveryType: resource.recoveryType,
    dice: dice ?? undefined,
    notes: resource.notes,
  };
}

function buildPactMagicState(
  classKey: DndClassKey,
  character: CharacterData,
  classLevel: number,
  current?: number,
): PactMagicState | undefined {
  const pactMagic = getPactMagicAtLevel(classKey, classLevel);
  if (!pactMagic) return undefined;
  const progression = getClassProgression(classKey);
  const max = pactMagic.slots;

  return {
    current: current === undefined ? max : Math.max(0, Math.min(max, current)),
    max,
    slotLevel: pactMagic.slotLevel,
    recoveryType: pactMagic.recoveryType,
    notes: progression?.spellcasting?.notes,
  };
}

export function initializeClassResourcesForCharacter(character: CharacterData): {
  classResources: ResourceState[];
  pactMagicState?: PactMagicState;
} {
  const classKey = getClassKeyForCharacter(character);
  if (!classKey) {
    return {
      classResources: [],
      pactMagicState: undefined,
    };
  }

  const classResources = getClassResourcesAtLevel(classKey, character.level)
    .map((resource) => buildResourceState(classKey, character, resource, character.level));
  const pactMagicState = buildPactMagicState(classKey, character, character.level);

  return {
    classResources,
    pactMagicState,
  };
}

export function refreshClassResourcesForCharacter(character: CharacterData): {
  classResources: ResourceState[];
  pactMagicState?: PactMagicState;
} {
  const classKey = getClassKeyForCharacter(character);
  if (!classKey) {
    return {
      classResources: character.classResources,
      pactMagicState: character.pactMagicState,
    };
  }

  const resourceDefinitions = getClassResourcesAtLevel(classKey, character.level);
  const definitionById = new Map(resourceDefinitions.map((resource) => [resource.id, resource]));
  const existingIds = new Set(character.classResources.map((resource) => resource.id));

  const refreshedResources = character.classResources.map((existingResource) => {
    const definition = definitionById.get(existingResource.id);
    if (!definition) return existingResource;
    return buildResourceState(classKey, character, definition, character.level, existingResource.current);
  });

  for (const definition of resourceDefinitions) {
    if (!existingIds.has(definition.id)) {
      refreshedResources.push(buildResourceState(classKey, character, definition, character.level));
    }
  }

  const refreshedPactMagicState = buildPactMagicState(
    classKey,
    character,
    character.level,
    character.pactMagicState?.current,
  );

  return {
    classResources: refreshedResources,
    pactMagicState: refreshedPactMagicState ??
      (classKey === 'warlock' ? character.pactMagicState : undefined),
  };
}

/** Refreshes one class allocation while retaining unrelated multiclass state. */
export function refreshClassResourcesForClass(
  character: CharacterData,
  className: string,
  classLevel: number,
): { classResources: ResourceState[]; pactMagicState?: PactMagicState } {
  const classKey = getClassKeyForCharacter({ jobClass: className });
  if (!classKey) return { classResources: character.classResources, pactMagicState: character.pactMagicState };

  const definitions = getClassResourcesAtLevel(classKey, classLevel);
  const definitionById = new Map(definitions.map((resource) => [resource.id, resource]));
  const existingIds = new Set(character.classResources.map((resource) => resource.id));
  const classResources = character.classResources.map((existing) => {
    const definition = definitionById.get(existing.id);
    return definition
      ? buildResourceState(classKey, character, definition, classLevel, existing.current)
      : existing;
  });
  for (const definition of definitions) {
    // Old saves and newly added multiclass allocations may not have passed the
    // exact unlock-level checkpoint. Materialize every currently unlocked,
    // missing resource so the resulting actor is complete and deterministic.
    if (!existingIds.has(definition.id)) {
      classResources.push(buildResourceState(classKey, character, definition, classLevel));
    }
  }

  if (classKey !== 'warlock') {
    return { classResources, pactMagicState: character.pactMagicState };
  }
  return {
    classResources,
    pactMagicState: buildPactMagicState(classKey, character, classLevel, character.pactMagicState?.current)
      ?? character.pactMagicState,
  };
}
