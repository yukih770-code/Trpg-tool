import type { PersonalCompendiumPackVersionContent } from '../api/personalCompendiumPackApiClient';
import type { AttributeName, BackgroundDef, ClassDef, ClassFeature, FeatDef, HitDiceType, RaceDef, SkillName, SpellInfo, SubclassDef } from '../dnd-types';

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

function spellLevel(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 9 ? parsed : 0;
}

function components(value: unknown): SpellInfo['component'] {
  const source = typeof value === 'string' ? value.toUpperCase() : '';
  return {
    v: source.includes('V'),
    s: source.includes('S'),
    m: source.includes('M'),
  };
}

const ATTRIBUTE_NAMES: readonly AttributeName[] = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const HIT_DICE: readonly HitDiceType[] = ['D4', 'D6', 'D8', 'D10', 'D12'];

function attribute(value: unknown, fallback: AttributeName): AttributeName {
  return typeof value === 'string' && ATTRIBUTE_NAMES.includes(value as AttributeName)
    ? value as AttributeName
    : fallback;
}

function attributeList(value: unknown): AttributeName[] {
  return textList(value, 2).filter((item): item is AttributeName => ATTRIBUTE_NAMES.includes(item as AttributeName));
}

function hitDie(value: unknown): HitDiceType {
  return typeof value === 'string' && HIT_DICE.includes(value as HitDiceType)
    ? value as HitDiceType
    : 'D8';
}

function featureList(value: unknown, fallbackName: string, fallbackDescription: string, unlockLevel: number): ClassFeature[] {
  if (!Array.isArray(value)) return fallbackDescription ? [{ name: fallbackName, desc: fallbackDescription, unlockLevel }] : [];
  return value.flatMap((rawFeature) => {
    const feature = record(rawFeature);
    const name = text(feature.name);
    const desc = text(feature.desc);
    if (!name || !desc) return [];
    const parsedLevel = Number(feature.unlockLevel);
    return [{ name, desc, unlockLevel: Number.isInteger(parsedLevel) && parsedLevel >= 1 && parsedLevel <= 20 ? parsedLevel : unlockLevel }];
  }).slice(0, 12);
}

/**
 * Projects the bounded personal class/subclass content shape into the existing
 * builder contract. These fields give the builder enough declarative class
 * facts for first-level HP and proficiencies, but never execute homebrew rules.
 */
export function personalClassEntriesToClassDefs(entries: Entry[]): ClassDef[] {
  const subclassEntries = entries.filter((entry) => entry.entryKind === 'subclass');
  const seenClassNames = new Set<string>();
  return entries.flatMap((entry) => {
    if (entry.entryKind !== 'class') return [];
    const content = record(entry.content);
    const name = text(content.name, text(entry.displayName));
    if (!name || seenClassNames.has(name)) return [];
    seenClassNames.add(name);
    const primaryAbility = attribute(content.primaryAbility, 'Str');
    const subclasses: SubclassDef[] = [];
    const seenSubclassNames = new Set<string>();
    for (const subclassEntry of subclassEntries) {
      const subclassContent = record(subclassEntry.content);
      if (text(subclassContent.className) !== name) continue;
      const subclassName = text(subclassContent.name, text(subclassEntry.displayName));
      if (!subclassName || seenSubclassNames.has(subclassName)) continue;
      seenSubclassNames.add(subclassName);
      const unlockLevel = Math.max(1, Math.min(20, Number(subclassContent.unlockLevel) || 1));
      const description = text(subclassContent.summary, '个人资料包中的自定义子职业。');
      subclasses.push({
        id: `personal.${subclassEntry.compendiumEntryId}`,
        name: subclassName,
        desc: description,
        unlockLevel,
        features: featureList(subclassContent.features, '子职业特性说明', description, unlockLevel),
      });
    }
    const description = text(content.summary, '个人资料包中的自定义职业。');
    return [{
      id: `personal.${entry.compendiumEntryId}`,
      name,
      desc: description,
      primaryAbility,
      savingThrows: attributeList(content.savingThrows),
      hitDice: hitDie(content.hitDice),
      weaponProficiencies: textList(content.weaponProficiencies, 12),
      armorProficiencies: textList(content.armorProficiencies, 12),
      startingEquipment: text(content.startingEquipment, '具体起始装备以房间审核结果为准。'),
      features: featureList(content.features, '职业特性说明', description, 1),
      subclasses,
    }];
  });
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

/**
 * Projects a personal spell's declared display facts into the existing
 * spellbook shape. Class legality, range resolution, damage, and casting are
 * intentionally not derived from personal content here.
 */
export function personalSpellEntriesToSpellInfo(entries: Entry[]): SpellInfo[] {
  const seen = new Set<string>();
  return entries.flatMap((entry) => {
    if (entry.entryKind !== 'spell') return [];
    const content = record(entry.content);
    const name = text(content.name, text(entry.displayName));
    if (!name || seen.has(name)) return [];
    seen.add(name);
    return [{
      id: `personal.${entry.compendiumEntryId}`,
      nameCn: name,
      name_cn: name,
      name_en: text(content.nameEn, `Personal ${name}`),
      level: spellLevel(content.level),
      school: text(content.school, '自定义'),
      is_ritual: false,
      classes: [],
      cast_time: text(content.castTime, '1 动作'),
      range: text(content.range, '自身'),
      component: components(content.components),
      duration: text(content.duration, '立即'),
      desc: text(content.summary, '个人资料包中的自定义法术。具体可用性以房间审核结果为准。'),
    }];
  });
}
