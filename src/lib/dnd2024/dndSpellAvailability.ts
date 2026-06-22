/**
 * DND character spell availability foundation.
 *
 * This helper separates three surfaces:
 * - global spell index for future Rule Library browsing,
 * - class-scoped spell index when existing runtime SpellInfo metadata can map it,
 * - character-scoped spell index for the current sheet.
 *
 * It is display-only. It does not change known/prepared spells, spell slots,
 * runtime casting, RuntimeLog, rule data, or store schema. The full 500+ spell
 * index currently has no class-list metadata, so this helper only uses existing
 * SPELL_DATA class metadata when it can safely map a spell by English name.
 */
import { SPELL_DATA } from '../../data/spells';
import type { DndSpellIndexEntry } from '../../data/dnd2024/spellIndex';
import { listDndSpellIndexEntries } from './dndSpellIndexRepository';

export interface DndSpellAvailabilityClassContext {
  className: string;
  level: number;
  subclassName?: string;
}

export interface DndSpellAvailabilityExtraSource {
  sourceType: 'species' | 'feat' | 'subclass' | 'background' | 'item' | 'custom';
  sourceId: string;
  spellIds?: string[];
}

export interface DndSpellAvailabilityContext {
  className?: string;
  classLevel?: number;
  classes?: DndSpellAvailabilityClassContext[];
  subclassName?: string;
  spellcastingAbility?: string;
  knownSpellIds?: string[];
  preparedSpellIds?: string[];
  /**
   * Current character-visible spell levels inferred from sheet state, such as
   * existing spell slots. This avoids inventing full class progression rules.
   */
  availableSpellLevels?: number[];
  extraSpellSources?: DndSpellAvailabilityExtraSource[];
}

export interface DndSpellAvailabilityResult {
  characterSpellIndex: DndSpellIndexEntry[];
  reason: string;
  limitations: string[];
}

const CLASS_ALIASES: Record<string, string> = {
  bard: '吟游诗人',
  cleric: '牧师',
  druid: '德鲁伊',
  paladin: '圣武士',
  ranger: '游侠',
  sorcerer: '术士',
  warlock: '邪术师',
  wizard: '法师',
  artificer: '奇械师',
  barbarian: '野蛮人',
  fighter: '战士',
  monk: '武僧',
  rogue: '游荡者',
  吟游诗人: '吟游诗人',
  牧师: '牧师',
  德鲁伊: '德鲁伊',
  圣武士: '圣武士',
  游侠: '游侠',
  术士: '术士',
  邪术师: '邪术师',
  法师: '法师',
  奇械师: '奇械师',
  野蛮人: '野蛮人',
  战士: '战士',
  武僧: '武僧',
  游荡者: '游荡者',
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/[\s'’\-]+/g, '');
}

function normalizeClassName(className?: string): string | undefined {
  if (!className) return undefined;
  const trimmed = className.trim();
  return CLASS_ALIASES[trimmed] ?? CLASS_ALIASES[trimmed.toLowerCase()];
}

function spellNameKey(name: string): string {
  return normalizeText(name);
}

function makeIndexByName(entries: readonly DndSpellIndexEntry[]): Map<string, DndSpellIndexEntry[]> {
  const map = new Map<string, DndSpellIndexEntry[]>();
  for (const entry of entries) {
    const key = spellNameKey(entry.nameEn);
    map.set(key, [...(map.get(key) ?? []), entry]);
  }
  return map;
}

function normalizedLevels(levels?: number[]): Set<number> | undefined {
  if (!levels || levels.length === 0) return undefined;
  return new Set(levels.filter((level) => Number.isFinite(level) && level >= 0));
}

function dedupeEntries(entries: DndSpellIndexEntry[]): DndSpellIndexEntry[] {
  const seen = new Set<string>();
  const deduped: DndSpellIndexEntry[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    deduped.push(entry);
  }
  return deduped.sort((a, b) => a.level - b.level || a.nameEn.localeCompare(b.nameEn));
}

export function listDndGlobalSpellIndex(): DndSpellIndexEntry[] {
  return [...listDndSpellIndexEntries()];
}

export function listDndClassSpellIndex(className: string): DndSpellIndexEntry[] {
  const normalizedClass = normalizeClassName(className);
  if (!normalizedClass) return [];

  const indexByName = makeIndexByName(listDndSpellIndexEntries());
  const matched: DndSpellIndexEntry[] = [];

  for (const spell of SPELL_DATA) {
    if (!spell.classes.includes(normalizedClass)) continue;
    matched.push(...(indexByName.get(spellNameKey(spell.name_en)) ?? []));
  }

  return dedupeEntries(matched);
}

export function getDndCharacterSpellIndex(
  context: DndSpellAvailabilityContext,
): DndSpellAvailabilityResult {
  const limitations: string[] = [
    '当前仅使用既有 runtime SpellInfo 的有限职业 metadata 映射到 spellIndex；完整职业法术表需要后续 Rule Library / class spell list 数据。',
    '此列表仅用于角色卡浏览，不代表已知法术、已准备法术或可施放动作。',
  ];

  const classContexts =
    context.classes && context.classes.length > 0
      ? context.classes
      : context.className
        ? [{ className: context.className, level: context.classLevel ?? 1, subclassName: context.subclassName }]
        : [];

  if (classContexts.length === 0) {
    return {
      characterSpellIndex: listDndGlobalSpellIndex(),
      reason: '未识别角色职业，暂显示全局法术索引作为只读 fallback。',
      limitations: [
        '缺少角色职业上下文，无法限定到角色法术范围。',
        ...limitations,
      ],
    };
  }

  const recognizedClasses = classContexts
    .map((entry) => ({ ...entry, normalizedClassName: normalizeClassName(entry.className) }))
    .filter((entry): entry is DndSpellAvailabilityClassContext & { normalizedClassName: string } =>
      Boolean(entry.normalizedClassName),
    );

  if (recognizedClasses.length === 0) {
    return {
      characterSpellIndex: listDndGlobalSpellIndex(),
      reason: `无法识别职业：${classContexts.map((entry) => entry.className).join(' / ')}，暂显示全局法术索引作为只读 fallback。`,
      limitations: [
        '当前职业名称无法映射到既有 DND class metadata。',
        ...limitations,
      ],
    };
  }

  const allowedLevels = normalizedLevels(context.availableSpellLevels);
  const entries = recognizedClasses.flatMap((entry) => listDndClassSpellIndex(entry.normalizedClassName));
  const levelFiltered = allowedLevels
    ? entries.filter((entry) => entry.level === 0 || allowedLevels.has(entry.level))
    : entries;
  const result = dedupeEntries(levelFiltered);

  if (result.length === 0) {
    return {
      characterSpellIndex: [],
      reason: `${recognizedClasses.map((entry) => `${entry.normalizedClassName} ${entry.level}级`).join(' / ')} 当前没有可安全映射的角色上下文法术索引。`,
      limitations: [
        '未找到可安全映射的职业法术索引条目；这可能表示该职业当前无基础施法、依赖子职业/特性，或职业法术表数据尚未接入。',
        ...limitations,
      ],
    };
  }

  return {
    characterSpellIndex: result,
    reason: `${recognizedClasses.map((entry) => `${entry.normalizedClassName} ${entry.level}级`).join(' / ')}：已按角色职业上下文限定到现有可映射法术索引。`,
    limitations: allowedLevels
      ? [
          `法术环阶按当前角色法术位上下文限制为：${[...allowedLevels].sort((a, b) => a - b).map((level) => (level === 0 ? '戏法' : `${level}环`)).join(' / ')}。`,
          ...limitations,
        ]
      : limitations,
  };
}
