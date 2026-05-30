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

function getClassKeyForCharacter(character: CharacterData): DndClassKey | null {
  return CLASS_NAME_TO_KEY[character.jobClass] ?? null;
}

function getAttributeScore(character: CharacterData, attr: keyof CharacterData['attrs']): number {
  const data = character.attrs[attr];
  return data.base + data.pointbuy + data.racebonus + data.extrabonus;
}

function resolveRuntimeResourceMax(
  resource: Parameters<typeof resolveResourceMax>[0],
  character: CharacterData,
): number {
  if (resource.maxFormula === 'charismaModifierMin1') {
    return Math.max(1, Math.floor((getAttributeScore(character, 'Cha') - 10) / 2));
  }
  if (resource.maxFormula === 'classLevel') {
    return character.level;
  }
  if (resource.maxFormula === 'classLevelTimes5') {
    return character.level * 5;
  }

  const level = character.level;
  const resolved = resolveResourceMax(resource, level);
  if (typeof resolved === 'number') return resolved;
  if (resolved === 'proficiencyBonus') return getProficiencyBonus(level);
  if (resolved === 'level') return level;
  if (resolved === 'unlimited') return Number.MAX_SAFE_INTEGER;
  return 0;
}

function buildResourceState(
  classKey: DndClassKey,
  character: CharacterData,
  resource: ClassResourceDefinition,
  current?: number,
): ResourceState {
  const max = resolveRuntimeResourceMax(resource, character);
  const dice = getResourceDieAtLevel(classKey, resource.id, character.level);

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
  current?: number,
): PactMagicState | undefined {
  const pactMagic = getPactMagicAtLevel(classKey, character.level);
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
    .map((resource) => buildResourceState(classKey, character, resource));
  const pactMagicState = buildPactMagicState(classKey, character);

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
    return buildResourceState(classKey, character, definition, existingResource.current);
  });

  for (const definition of resourceDefinitions) {
    if (!existingIds.has(definition.id) && definition.unlockLevel === character.level) {
      refreshedResources.push(buildResourceState(classKey, character, definition));
    }
  }

  const refreshedPactMagicState = buildPactMagicState(
    classKey,
    character,
    character.pactMagicState?.current,
  );

  return {
    classResources: refreshedResources,
    pactMagicState: refreshedPactMagicState ??
      (classKey === 'warlock' ? character.pactMagicState : undefined),
  };
}
