import type { PersonalCompendiumPackVersionContent } from '../api/personalCompendiumPackApiClient';
import type { RaceDef } from '../dnd-types';

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
