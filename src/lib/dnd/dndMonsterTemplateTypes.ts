import type { DndAbilityKey, DndLiteActorAction, DndLiteActorSheet, DndSkillKey } from './dndLiteActorTypes.js';
import { readDndCreatureSize, type DndCreatureSize } from '../dnd2024/gameplay/dndCreatureSize.js';

export type DndMonsterTextEntry = { name: string; description?: string };

export type DndMonsterAction = DndLiteActorAction & { description?: string };

export type DndPrivateMonsterTemplate = {
  monsterTemplateId: string;
  worldServerId: string;
  createdByUserId?: string;
  importBatchId?: string;
  name: string;
  slug: string;
  size?: string;
  /** Trusted typed inputs only; legacy SQL size remains display text. */
  creatureSize?: DndCreatureSize;
  creatureType?: string;
  alignment?: string;
  armorClass?: number;
  hitPointsAverage?: number;
  hitPointsFormula?: string;
  speed: Record<string, unknown>;
  abilities: Partial<Record<DndAbilityKey, number>>;
  savingThrows: Partial<Record<DndAbilityKey, number>>;
  skills: Partial<Record<DndSkillKey, number>>;
  senses: Record<string, unknown>;
  languages?: string;
  challengeRating?: string;
  proficiencyBonus?: number;
  traits: DndMonsterTextEntry[];
  actions: DndMonsterAction[];
  reactions: DndMonsterTextEntry[];
  legendaryActions: DndMonsterTextEntry[];
  spellcasting?: Record<string, unknown>;
  tags: string[];
  sourceFormat?: string;
  sourceHash?: string;
  visibility: 'private';
  schemaVersion: 1;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

export type DndMonsterImportBatch = {
  importBatchId: string;
  worldServerId: string;
  createdByUserId?: string;
  sourceFormat?: string;
  sourceHash?: string;
  importStatus: 'running' | 'completed' | 'failed';
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
  errorCount: number;
  createdAt?: string;
  completedAt?: string;
};

export function dndMonsterToLiteActorSheet(monster: DndPrivateMonsterTemplate): DndLiteActorSheet {
  const abilities = {
    strength: monster.abilities.strength ?? 10,
    dexterity: monster.abilities.dexterity ?? 10,
    constitution: monster.abilities.constitution ?? 10,
    intelligence: monster.abilities.intelligence ?? 10,
    wisdom: monster.abilities.wisdom ?? 10,
    charisma: monster.abilities.charisma ?? 10,
  };
  return {
    schemaVersion: 1,
    actorKind: 'monster',
    creatureSize: readDndCreatureSize(monster.creatureSize),
    displayName: monster.name,
    abilities,
    proficiencyBonus: monster.proficiencyBonus ?? 2,
    defenses: {
      armorClass: monster.armorClass,
      maxHp: monster.hitPointsAverage,
      currentHp: monster.hitPointsAverage,
      speedFt: readDndNumericSpeed(monster.speed),
    },
    savingThrows: monster.savingThrows,
    skills: monster.skills,
    actions: monster.actions.map(({ description: _description, ...action }) => action),
    notes: [monster.size, monster.creatureType, monster.alignment, monster.hitPointsFormula ? `HP: ${monster.hitPointsFormula}` : ''].filter(Boolean).join(' · ') || undefined,
    tags: monster.tags,
  };
}

/**
 * Reads a walking speed in feet out of a loosely typed speed value.
 * Exported so the character derivation reuses this parser instead of adding a
 * second one; a `CharacterData.speed` string is passed as `{ walk: speed }`.
 */
export function readDndNumericSpeed(speed: Record<string, unknown>): number | undefined {
  const walk = speed.walk ?? speed.speed;
  if (typeof walk === 'number' && Number.isFinite(walk)) return Math.trunc(walk);
  if (typeof walk === 'string') {
    const match = walk.match(/\d+/);
    return match ? Number(match[0]) : undefined;
  }
  return undefined;
}
