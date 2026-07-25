import type { PersonalCompendiumPackVersionContent } from '../api/personalCompendiumPackApiClient';
import type { BackgroundDef, FeatDef, RaceDef, SkillName } from '../dnd-types';

type Entry = PersonalCompendiumPackVersionContent['entries'][number];
type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function textList(value: unknown, limit = 12): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()).slice(0, limit)
    : [];
}

function speedFeet(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 120 ? Math.floor(parsed) : 30;
}

const SKILL_NAMES: readonly SkillName[] = [
  '运动', '特技', '巧手', '隐匿', '奥秘', '历史', '调查', '自然', '宗教',
  '驯兽', '洞察', '医药', '察觉', '生存', '欺瞒', '威吓', '表演', '游说',
];

function skillList(value: unknown): SkillName[] {
  return textList(value, 4).filter((skill): skill is SkillName => SKILL_NAMES.includes(skill as SkillName));
}

/**
 * Translates the deliberately small personal-species v0 content shape into the
 * existing character-builder read model. This adapter never evaluates effects
 * or imports arbitrary JSON keys as rules.
 */
export function personalSpeciesEntriesToRaceDefs(entries: Entry[]): RaceDef[] {
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    if (entry.entryKind !== 'species') return [];
    const content = record(entry.content);
    const name = text(content.name, text(entry.displayName));
    if (!name || seen.has(name)) return [];
    seen.add(name);
    const summary = text(content.summary, '个人资料包中的自定义种族。');
    const traits = textList(content.traits);
    const heritageOptions = textList(content.heritageOptions);
    return [{
      id: `personal.${entry.compendiumEntryId}`,
      name,
      desc: summary,
      strBonus: 0,
      dexBonus: 0,
      conBonus: 0,
      intBonus: 0,
      wisBonus: 0,
      chaBonus: 0,
      size: text(content.size, '中型'),
      speed: speedFeet(content.speedFeet),
      baseLanguages: [],
      features: traits,
      subraces: heritageOptions.map((heritage) => ({
        name: heritage,
        desc: '来自个人资料包的传承选项；具体规则以房间审核结果为准。',
        strBonus: 0,
        dexBonus: 0,
        conBonus: 0,
        intBonus: 0,
        wisBonus: 0,
        chaBonus: 0,
        features: [],
      })),
    }];
  });
}

/**
 * Maps only display, proficiency, and feature text into the existing
 * background selector. Personal background content cannot install an origin
 * feat or otherwise grant executable effects through this adapter.
 */
export function personalBackgroundEntriesToBackgroundDefs(entries: Entry[]): BackgroundDef[] {
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    if (entry.entryKind !== 'background') return [];
    const content = record(entry.content);
    const name = text(content.name, text(entry.displayName));
    if (!name || seen.has(name)) return [];
    seen.add(name);
    const feature = record(content.feature);
    return [{
      id: `personal.${entry.compendiumEntryId}`,
      name,
      nameCn: name,
      desc: text(content.summary, '个人资料包中的自定义背景。'),
      skillProficiencies: skillList(content.skillProficiencies),
      toolProficiencies: textList(content.toolProficiencies, 4),
      feature: {
        name: text(feature.name, '自定义背景特性'),
        desc: text(feature.desc, '来自个人资料包；具体可用性以房间审核结果为准。'),
      },
    }];
  });
}

/**
 * Personal feats are informational choices. The builder may display an Origin
 * feat, but its description is never evaluated as a rule or automation.
 */
export function personalFeatEntriesToFeatDefs(entries: Entry[]): FeatDef[] {
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    if (entry.entryKind !== 'feat') return [];
    const content = record(entry.content);
    const name = text(content.name, text(entry.displayName));
    if (!name || seen.has(name)) return [];
    seen.add(name);
    return [{
      id: `personal.${entry.compendiumEntryId}`,
      name,
      nameCn: name,
      desc: text(content.summary, '个人资料包中的自定义专长。'),
      prerequisiteDesc: text(content.prerequisiteDesc, '房间审核时确认前置条件。'),
      category: text(content.category) === 'Origin' ? 'Origin' : 'General',
      checkPrereq: () => true,
    }];
  });
}
