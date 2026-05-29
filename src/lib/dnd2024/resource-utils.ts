import type { CharacterData, PactMagicState, ResourceState } from '../dnd-types';
import type { DndClassKey } from './progression-types';
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

function resolveRuntimeResourceMax(
  resource: Parameters<typeof resolveResourceMax>[0],
  level: number,
): number {
  const resolved = resolveResourceMax(resource, level);
  if (typeof resolved === 'number') return resolved;
  if (resolved === 'proficiencyBonus') return getProficiencyBonus(level);
  if (resolved === 'level') return level;
  if (resolved === 'unlimited') return Number.MAX_SAFE_INTEGER;
  return 0;
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

  const classResources = getClassResourcesAtLevel(classKey, character.level).map((resource) => {
    const max = resolveRuntimeResourceMax(resource, character.level);
    const dice = getResourceDieAtLevel(classKey, resource.id, character.level);

    return {
      id: resource.id,
      current: max,
      max,
      sourceFeature: resource.sourceFeature,
      recoveryType: resource.recoveryType,
      dice: dice ?? undefined,
      notes: resource.notes,
    };
  });

  const pactMagic = getPactMagicAtLevel(classKey, character.level);
  const progression = getClassProgression(classKey);
  const pactMagicState = pactMagic
    ? {
        current: pactMagic.slots,
        max: pactMagic.slots,
        slotLevel: pactMagic.slotLevel,
        recoveryType: pactMagic.recoveryType,
        notes: progression?.spellcasting?.notes,
      }
    : undefined;

  return {
    classResources,
    pactMagicState,
  };
}
