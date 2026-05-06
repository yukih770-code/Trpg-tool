import { CharacterData, SpellInfo, FeatDef, RaceDef, ClassDef } from './dnd-types';
import { SPELL_DATA } from '../data/spells';
import { FEATS_DATA } from '../data/feats';
import { RACE_DATA } from '../data/races';
import { CLASS_DATA } from '../data/classes';

export function getAvailableSpells(character: CharacterData): SpellInfo[] {
  const customSpells = character.customModsData?.flatMap(m => m.spells || []) || [];
  return [...SPELL_DATA, ...customSpells];
}

export function getAvailableFeats(character: CharacterData): FeatDef[] {
  const customFeats = character.customModsData?.flatMap(m => m.feats || []) || [];
  return [...FEATS_DATA, ...customFeats];
}

export function getAvailableRaces(character: CharacterData): RaceDef[] {
  const customRaces = character.customModsData?.flatMap(m => m.races || []) || [];
  return [...RACE_DATA, ...customRaces];
}

export function getAvailableClasses(character: CharacterData): ClassDef[] {
  // Add class support if needed
  return CLASS_DATA;
}
