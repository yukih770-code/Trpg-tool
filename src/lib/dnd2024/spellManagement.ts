import type { CharacterData, SpellInfo } from '../dnd-types';
import { getDndCharacterSpellIndex } from './dndSpellAvailability';
import { getDndSpellPreparationModel } from './spell-preparation-model';

/** Shared Creator/Gameplay contract. Existing source-index filtering remains authoritative. */
export function getDndSpellManagement(character: CharacterData, baseSpells: SpellInfo[], personalSpells: SpellInfo[] = []) {
  const preparation = getDndSpellPreparationModel(character);
  const levels = [0, ...Object.entries(preparation.spellSlots ?? {}).filter(([, count]) => typeof count === 'number' && count > 0).map(([level]) => Number(level.replace('level', '')))];
  if (preparation.pactMagic) levels.push(preparation.pactMagic.slotLevel);
  const availability = getDndCharacterSpellIndex({ className: character.jobClass, classLevel: character.level, subclassName: character.subclass, availableSpellLevels: levels });
  const names = new Set(availability.characterSpellIndex.map(s => s.nameEn));
  const selectable = [...baseSpells.filter(s => names.has(s.name_en)), ...personalSpells];
  const unique = [...new Map(selectable.map(s => [s.name_cn, s])).values()];
  const known = character.spellbook.known;
  const active = preparation.isPreparedCaster
    ? [...new Map([...unique, ...known].filter(s => (s.level === 0 && known.some(k => k.name_cn === s.name_cn)) || character.spellbook.prepared.includes(s.name_cn)).map(s => [s.name_cn, s])).values()]
    : known;
  return { preparation, availability, selectable: unique, active };
}

export function changeDndSpellbook(character: CharacterData, selectable: SpellInfo[], action: 'learn' | 'prepare', spell: SpellInfo): CharacterData['spellbook'] {
  const book = character.spellbook;
  const known = book.known.some(s => s.name_cn === spell.name_cn);
  const prepared = book.prepared.includes(spell.name_cn);
  // Removing old choices must remain possible even if sources/class changed.
  if (action === 'learn' && known) return { ...book, known: book.known.filter(s => s.name_cn !== spell.name_cn), prepared: book.prepared.filter(n => n !== spell.name_cn) };
  if (action === 'prepare' && prepared) return { ...book, prepared: book.prepared.filter(n => n !== spell.name_cn) };
  const available = selectable.find(s => s.name_cn === spell.name_cn);
  if (!available) throw new Error('此法术不在当前职业、等级或已选资料中。');
  if (action === 'learn') return { ...book, known: [...book.known, available] };
  if (!known || available.level === 0) throw new Error('请先加入已知法术；戏法无需准备。');
  const model = getDndSpellPreparationModel(character);
  const preparedCount = book.prepared.filter(n => book.known.find(s => s.name_cn === n)?.level !== 0).length;
  if (model.preparedSpellLimit !== null && preparedCount >= model.preparedSpellLimit) throw new Error(`当前最多准备 ${model.preparedSpellLimit} 个法术。`);
  return { ...book, prepared: [...book.prepared, available.name_cn] };
}
