import type { RoomActorRefSummary, RoomSystemId } from './roomTypes.js';

/**
 * Compact, display-safe material submitted with a room actor binding.
 *
 * This is review metadata, not a character sheet, legality engine, or runtime
 * actor state. Every field is optional so older lobby bindings remain valid.
 */
export interface CharacterClearanceDetails {
  identity: {
    name: string;
    sourceType: string;
    systemId?: string;
    speciesOrRace?: string;
    classSummary?: string;
    subclassSummary?: string;
    level?: number;
    background?: string;
    alignment?: string;
    playerNotes?: string;
    roleplayProfile?: string;
  };
  combat: {
    hpCurrent?: number;
    hpMax?: number;
    tempHp?: number;
    ac?: number;
    speed?: number;
    proficiencyBonus?: number;
    initiativeBonus?: number;
    passivePerception?: number;
    abilityScores?: Record<string, number>;
    saves?: string[];
    skills?: string[];
  };
  equipment: {
    equippedWeapons?: string[];
    equippedArmor?: string[];
    shield?: string;
    tools?: string[];
    notableItems?: string[];
    consumables?: string[];
    currencySummary?: string;
  };
  traits: {
    racialTraits?: string[];
    classFeatures?: string[];
    feats?: string[];
    proficiencies?: string[];
    languages?: string[];
    senses?: string[];
  };
  effects: {
    permanentBuffs?: string[];
    longTermConditions?: string[];
    curses?: string[];
    customEffects?: string[];
  };
  review: {
    warnings?: string[];
    missingFields?: string[];
    summary?: string;
  };
}

export interface CharacterClearanceDetailsInput {
  name: string;
  sourceType: string;
  systemId?: RoomSystemId | string;
  summary?: string;
  hpCurrent?: number;
  hpMax?: number;
  armorClass?: number;
  snapshot?: unknown;
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function text(value: unknown, max = 180): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function textList(value: unknown, maxItems = 12): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result = value.flatMap((item) => {
    const label = typeof item === 'string' ? text(item) : text(record(item)?.name) ?? text(record(item)?.displayName);
    return label ? [label] : [];
  }).slice(0, maxItems);
  return result.length ? result : undefined;
}

function textFromKeys(source: UnknownRecord | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = text(source?.[key]);
    if (value) return value;
  }
  return undefined;
}

function numberFromKeys(source: UnknownRecord | undefined, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = number(source?.[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function listFromKeys(source: UnknownRecord | undefined, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = textList(source?.[key]);
    if (value?.length) return value;
  }
  return undefined;
}

function abilityScores(value: unknown): Record<string, number> | undefined {
  const source = record(value);
  if (!source) return undefined;
  const scores = Object.entries(source).flatMap(([key, item]) => {
    const raw = number(item) ?? number(record(item)?.base);
    return raw === undefined ? [] : [[key, raw] as const];
  }).slice(0, 12);
  return scores.length ? Object.fromEntries(scores) : undefined;
}

function valueLabels(value: unknown): string[] | undefined {
  const source = record(value);
  if (!source) return undefined;
  const values = Object.entries(source).flatMap(([key, item]) => number(item) === undefined ? [] : [`${key} ${number(item)}`]).slice(0, 18);
  return values.length ? values : undefined;
}

function normalizeReview(value: unknown, fallbackSummary?: string): CharacterClearanceDetails['review'] {
  const source = record(value);
  return {
    warnings: textList(source?.warnings),
    missingFields: textList(source?.missingFields),
    summary: text(source?.summary, 360) ?? fallbackSummary,
  };
}

/** Makes an incoming (possibly old or malformed) details payload safe to display. */
export function normalizeCharacterClearanceDetails(value: unknown): CharacterClearanceDetails | undefined {
  const source = record(value);
  const identity = record(source?.identity);
  const name = text(identity?.name);
  const sourceType = text(identity?.sourceType);
  if (!name || !sourceType) return undefined;

  const combat = record(source?.combat);
  const equipment = record(source?.equipment);
  const traits = record(source?.traits);
  const effects = record(source?.effects);
  return {
    identity: {
      name,
      sourceType,
      systemId: text(identity?.systemId),
      speciesOrRace: text(identity?.speciesOrRace),
      classSummary: text(identity?.classSummary),
      subclassSummary: text(identity?.subclassSummary),
      level: number(identity?.level),
      background: text(identity?.background),
      alignment: text(identity?.alignment),
      playerNotes: text(identity?.playerNotes, 360),
      roleplayProfile: text(identity?.roleplayProfile, 360),
    },
    combat: {
      hpCurrent: number(combat?.hpCurrent), hpMax: number(combat?.hpMax), tempHp: number(combat?.tempHp), ac: number(combat?.ac),
      speed: number(combat?.speed), proficiencyBonus: number(combat?.proficiencyBonus), initiativeBonus: number(combat?.initiativeBonus),
      passivePerception: number(combat?.passivePerception), abilityScores: abilityScores(combat?.abilityScores), saves: textList(combat?.saves), skills: textList(combat?.skills),
    },
    equipment: {
      equippedWeapons: textList(equipment?.equippedWeapons), equippedArmor: textList(equipment?.equippedArmor), shield: text(equipment?.shield),
      tools: textList(equipment?.tools), notableItems: textList(equipment?.notableItems), consumables: textList(equipment?.consumables), currencySummary: text(equipment?.currencySummary),
    },
    traits: {
      racialTraits: textList(traits?.racialTraits), classFeatures: textList(traits?.classFeatures), feats: textList(traits?.feats),
      proficiencies: textList(traits?.proficiencies), languages: textList(traits?.languages), senses: textList(traits?.senses),
    },
    effects: {
      permanentBuffs: textList(effects?.permanentBuffs), longTermConditions: textList(effects?.longTermConditions),
      curses: textList(effects?.curses), customEffects: textList(effects?.customEffects),
    },
    review: normalizeReview(source?.review),
  };
}

/**
 * Builds a best-effort review summary from a locally available character.
 * It intentionally reads only short labels / numbers and ignores unknown data.
 */
export function buildCharacterClearanceDetails(input: CharacterClearanceDetailsInput): CharacterClearanceDetails {
  const snapshot = record(input.snapshot);
  const defenses = record(snapshot?.defenses);
  const classSummary = textFromKeys(snapshot, ['jobClass', 'className', 'class']);
  const missingFields = [
    !snapshot ? '完整角色快照' : undefined,
    !listFromKeys(snapshot, ['inventory', 'equipment', 'gear', 'items']) ? '装备' : undefined,
    !listFromKeys(snapshot, ['features', 'classFeatures', 'feats']) ? '特性 / 专长' : undefined,
  ].flatMap((item) => item ? [item] : []);
  const details: CharacterClearanceDetails = {
    identity: {
      name: text(input.name) ?? '未命名角色', sourceType: text(input.sourceType) ?? 'unknown', systemId: text(input.systemId),
      speciesOrRace: textFromKeys(snapshot, ['race', 'species']), classSummary,
      subclassSummary: textFromKeys(snapshot, ['subclass']), level: numberFromKeys(snapshot, ['level']),
      background: textFromKeys(snapshot, ['background']), alignment: textFromKeys(snapshot, ['alignment']),
      playerNotes: textFromKeys(snapshot, ['notes']), roleplayProfile: textFromKeys(snapshot, ['description', 'appearanceDescription']),
    },
    combat: {
      hpCurrent: input.hpCurrent ?? numberFromKeys(defenses, ['currentHp']) ?? numberFromKeys(snapshot, ['hpCurrent', 'currentHp']),
      hpMax: input.hpMax ?? numberFromKeys(defenses, ['maxHp']) ?? numberFromKeys(snapshot, ['hpMax', 'maxHp']),
      tempHp: numberFromKeys(defenses, ['temporaryHp']) ?? numberFromKeys(snapshot, ['tempHp', 'temporaryHp']),
      ac: input.armorClass ?? numberFromKeys(defenses, ['armorClass']) ?? numberFromKeys(snapshot, ['ac', 'armorClass', 'acMod']),
      speed: numberFromKeys(defenses, ['speedFt']) ?? numberFromKeys(snapshot, ['speed']),
      proficiencyBonus: numberFromKeys(snapshot, ['proficiencyBonus']), initiativeBonus: numberFromKeys(snapshot, ['initiativeBonus']),
      passivePerception: numberFromKeys(snapshot, ['passivePerception']), abilityScores: abilityScores(snapshot?.attrs ?? snapshot?.abilities),
      saves: valueLabels(snapshot?.savingThrows) ?? listFromKeys(snapshot, ['savingThrowProficiencies', 'saves']),
      skills: valueLabels(snapshot?.skills) ?? listFromKeys(snapshot, ['skillProficiencies', 'skills']),
    },
    equipment: {
      equippedWeapons: listFromKeys(snapshot, ['equippedWeapons', 'weapons']), equippedArmor: listFromKeys(snapshot, ['equippedArmor', 'armorTraining']),
      shield: textFromKeys(snapshot, ['shield']), tools: listFromKeys(snapshot, ['tools', 'toolProficiencies']),
      notableItems: listFromKeys(snapshot, ['inventory', 'equipment', 'gear', 'items']), consumables: listFromKeys(snapshot, ['consumables']),
      currencySummary: number(snapshot?.coin) === undefined ? undefined : `${number(snapshot?.coin)} gp`,
    },
    traits: {
      racialTraits: listFromKeys(snapshot, ['racialTraits', 'speciesTraits']), classFeatures: listFromKeys(snapshot, ['classFeatures', 'features']),
      feats: listFromKeys(snapshot, ['feats']), proficiencies: listFromKeys(snapshot, ['weaponProficiencies', 'proficiencies']),
      languages: listFromKeys(snapshot, ['languages', 'customLanguages']), senses: listFromKeys(snapshot, ['senses']),
    },
    effects: {
      permanentBuffs: listFromKeys(snapshot, ['permanentBuffs', 'activeMods']), longTermConditions: listFromKeys(snapshot, ['longTermConditions', 'conditions']),
      curses: listFromKeys(snapshot, ['curses']), customEffects: listFromKeys(snapshot, ['customEffects']),
    },
    review: { summary: text(input.summary, 360) ?? textFromKeys(snapshot, ['summary']), missingFields: missingFields.length ? missingFields : undefined },
  };
  return normalizeCharacterClearanceDetails(details) ?? details;
}

/** Back-compat fallback for old shallow room bindings that predate `details`. */
export function clearanceDetailsFromRoomActorRef(actorRef: RoomActorRefSummary): CharacterClearanceDetails {
  return buildCharacterClearanceDetails({
    name: actorRef.displayName,
    sourceType: actorRef.source,
    systemId: actorRef.systemId,
    summary: actorRef.summary,
    hpCurrent: actorRef.hpCurrent,
    hpMax: actorRef.hpMax,
    armorClass: actorRef.armorClass,
  });
}
