import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import type { DndMonsterAction, DndPrivateMonsterTemplate } from '../../src/lib/dnd/dndMonsterTemplateTypes.js';

export type PrivateMonsterImportIssue = { file: string; reason: string };
export type ParsedPrivateMonster = Omit<DndPrivateMonsterTemplate, 'monsterTemplateId' | 'worldServerId' | 'createdByUserId' | 'importBatchId' | 'visibility' | 'schemaVersion' | 'createdAt' | 'updatedAt' | 'archivedAt'>;
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : typeof value === 'string' && value.trim() && Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : undefined;
const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : typeof value === 'string' ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `monster-${randomUUID().slice(0, 8)}`;

function entries(value: unknown): Array<{ name: string; description?: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === 'string' ? { name: item } : { name: text(object(item).name) ?? '', description: text(object(item).description ?? object(item).desc) }).filter((item) => item.name);
}
function actions(value: unknown): DndMonsterAction[] {
  if (!Array.isArray(value)) return [];
  const parsed: DndMonsterAction[] = [];
  for (const [index, item] of value.entries()) { const source = object(item); const name = text(source.name); if (!name) continue; const inputKind = source.kind; const kind: DndMonsterAction['kind'] = inputKind === 'spell_attack' || inputKind === 'save_dc' || inputKind === 'damage_only' || inputKind === 'utility' ? inputKind : 'weapon_attack'; parsed.push({ id: text(source.id) ?? `${slugify(name)}-${index + 1}`, name, kind, attackBonus: number(source.attackBonus ?? source.toHit ?? source.attack_bonus), damageFormula: text(source.damageFormula ?? source.damage ?? source.damage_formula), damageType: text(source.damageType ?? source.damage_type), saveAbility: text(source.saveAbility ?? source.save_ability) as DndMonsterAction['saveAbility'], saveDc: number(source.saveDc ?? source.save_dc), description: text(source.description ?? source.desc) }); }
  return parsed;
}
function abilities(source: Record<string, unknown>) { return { strength: number(source.str ?? source.strength), dexterity: number(source.dex ?? source.dexterity), constitution: number(source.con ?? source.constitution), intelligence: number(source.int ?? source.intelligence), wisdom: number(source.wis ?? source.wisdom), charisma: number(source.cha ?? source.charisma) }; }

export function parsePrivateMonsterRecord(value: unknown, sourceFormat: string, sourceHash: string): ParsedPrivateMonster | { error: string } {
  const source = object(value); const name = text(source.name);
  if (!name) return { error: 'missing name' };
  const hp = source.hp ?? source.hitPoints ?? source.hit_points;
  const hpRecord = object(hp);
  return {
    name, slug: slugify(text(source.slug) ?? name), size: text(source.size), creatureType: text(source.type ?? source.creatureType ?? source.creature_type), alignment: text(source.alignment), armorClass: number(source.ac ?? source.armorClass ?? source.armor_class), hitPointsAverage: number(hpRecord.average ?? hpRecord.value ?? hp), hitPointsFormula: text(hpRecord.formula ?? source.hitPointsFormula ?? source.hit_points_formula), speed: object(source.speed), abilities: abilities(source), savingThrows: object(source.saves ?? source.savingThrows) as ParsedPrivateMonster['savingThrows'], skills: object(source.skills) as ParsedPrivateMonster['skills'], senses: object(source.senses), languages: text(source.languages), challengeRating: text(source.cr ?? source.challenge ?? source.challengeRating), proficiencyBonus: number(source.proficiencyBonus ?? source.proficiency_bonus), traits: entries(source.traits), actions: actions(source.actions), reactions: entries(source.reactions), legendaryActions: entries(source.legendaryActions ?? source.legendary_actions), spellcasting: Object.keys(object(source.spellcasting)).length ? object(source.spellcasting) : undefined, tags: stringArray(source.tags), sourceFormat, sourceHash,
  };
}

function csvRows(content: string): Record<string, string>[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = split(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [headers[index] ?? '', value])));
}
export function parsePrivateMonsterFile(filename: string, content: string): { records: ParsedPrivateMonster[]; issues: PrivateMonsterImportIssue[] } {
  const extension = extname(filename).toLowerCase(); const hash = `sha256:${createHash('sha256').update(content).digest('hex').slice(0, 24)}`; const values: unknown[] = [];
  try {
    if (extension === '.json') { const parsed = JSON.parse(content); values.push(...(Array.isArray(parsed) ? parsed : Array.isArray(object(parsed).monsters) ? object(parsed).monsters as unknown[] : [parsed])); }
    else if (extension === '.jsonl') values.push(...content.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line)));
    else if (extension === '.csv') values.push(...csvRows(content));
    else return { records: [], issues: [{ file: filename, reason: extension === '.md' ? 'structured Markdown is not supported in this slice' : 'unsupported file format' }] };
  } catch { return { records: [], issues: [{ file: filename, reason: 'could not parse machine-readable content' }] }; }
  const records: ParsedPrivateMonster[] = []; const issues: PrivateMonsterImportIssue[] = [];
  for (const value of values) { const parsed = parsePrivateMonsterRecord(value, extension.slice(1), hash); if ('error' in parsed) issues.push({ file: filename, reason: parsed.error }); else records.push(parsed); }
  return { records, issues };
}
