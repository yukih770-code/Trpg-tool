/**
 * D&D quick actor presets (v1).
 *
 * AI-LANDMARK: DND_ACTOR_PRESETS_V1
 *
 * A preset is a STARTING STATE for the canonical `DndLiteActorSheet`, nothing
 * more. It is not an actor type, not a parallel domain object, not a second
 * sheet, and there is no runtime inheritance: `materializeDndActorPreset` copies
 * values ONCE at creation time and the actor owns them from that moment.
 * Editing the preset definition in a later build can never reach an actor that
 * was already created.
 *
 * CONTENT PROVENANCE — read before adding a preset.
 * These archetypes are PROJECT-DEFINED generic starting values. They are not
 * transcribed from any official stat block, and none of them claims to be one.
 * The repository ships no NPC/creature stat-block data: `src/data/dnd2024/`
 * holds character options and equipment (the equipment table is explicitly
 * `usagePolicy: 'display-only'`), and monster templates are per-world-server
 * content a user imported themselves. So there was nothing approved to derive
 * from, and inventing "official" numbers was not an option — see
 * DND_ACTOR_PRESET_PROVENANCE below, which labels these `homebrew`.
 *
 * Internal coherence rule, so the numbers are authored rather than arbitrary:
 * every attack's `attackBonus` equals the governing ability modifier plus the
 * preset's proficiency bonus, computed here with the project's own
 * `calculateDndAbilityModifier`. Armour class, hit points and speed are flat
 * authored values a GM is expected to change.
 *
 * NOT a player class. `martial`, `adept` and friends are NPC archetypes. They
 * do not model class levels, spell slots, features or resources, and the UI
 * must never present them as a legal player character. Player characters keep
 * using the canonical Character Creator.
 */

import { calculateDndAbilityModifier, createDefaultDndLiteActorSheet } from './dndLiteActorSheet';
import type {
  DndAbilityKey,
  DndLiteActorAction,
  DndLiteActorKind,
  DndLiteActorSheet,
  DndSkillKey,
} from './dndLiteActorTypes';
import type { RuleDataMetadata } from '../rules/rule-data-metadata';

/**
 * Bumped ONLY when a preset's materialized values change.
 *
 * Stored alongside a created actor's preset id. A stored version that no longer
 * matches makes the preset/custom comparison report `unknown` instead of
 * falsely claiming the actor diverged — the actor's own values are never
 * touched either way.
 */
export const DND_ACTOR_PRESET_DEFINITION_VERSION = 1;

/** Provenance for every preset in this module, using the project's own contract. */
export const DND_ACTOR_PRESET_PROVENANCE: RuleDataMetadata = {
  source: 'homebrew',
  trustLevel: 'homebrew',
  publicScope: 'homebrew',
  contentPolicy: 'safe-to-embed',
  usagePolicy: 'core-runtime-ok',
  sourceRef: 'project-defined:dnd-quick-actor-presets-v1',
  sourceNote:
    'Project-defined generic archetype starting values. Not transcribed from any official stat block, '
    + 'and not a player class. The repository ships no approved NPC/creature stat-block data to derive from.',
};

export const DND_ACTOR_PRESET_IDS = [
  'blank',
  'commoner',
  'martial',
  'scout',
  'ranged',
  'adept',
  'expert',
  'brute',
  'critter',
] as const;

export type DndActorPresetId = typeof DND_ACTOR_PRESET_IDS[number];

/** Which creation entrance offers a preset. `both` appears in either. */
export type DndActorPresetAudience = 'npc' | 'monster' | 'both';

/**
 * The mechanical values a preset owns.
 *
 * Deliberately a partial of the canonical sheet rather than a parallel schema:
 * adding a field here means the canonical sheet already has it.
 */
interface DndActorPresetValues {
  abilities?: Partial<Record<DndAbilityKey, number>>;
  proficiencyBonus?: number;
  armorClass?: number;
  maxHp?: number;
  speedFt?: number;
  savingThrows?: Partial<Record<DndAbilityKey, 'proficient'>>;
  skills?: Partial<Record<DndSkillKey, 'proficient'>>;
  /** `attackBonus` is computed from `ability` + the preset's proficiency bonus. */
  attacks?: Array<{
    id: string;
    nameCn: string;
    nameEn: string;
    kind: 'weapon_attack' | 'spell_attack';
    ability: DndAbilityKey;
    damageFormulaDice: string;
    /** Whether the ability modifier is added to damage as well. */
    addAbilityToDamage: boolean;
    damageTypeCn?: string;
    damageTypeEn?: string;
  }>;
}

export interface DndActorPreset {
  id: DndActorPresetId;
  nameCn: string;
  nameEn: string;
  /** One short line. The picker must stay scannable — no paragraphs. */
  blurbCn: string;
  blurbEn: string;
  audience: DndActorPresetAudience;
  /** Surfaced first in the picker. Keep this to two per entrance. */
  recommended?: boolean;
  values: DndActorPresetValues;
}

const PRESETS: Record<DndActorPresetId, DndActorPreset> = {
  blank: {
    id: 'blank',
    nameCn: '空白',
    nameEn: 'Blank',
    blurbCn: '从零开始，所有数值自己填。',
    blurbEn: 'Start from scratch and fill in every value yourself.',
    audience: 'both',
    values: {},
  },
  commoner: {
    id: 'commoner',
    nameCn: '普通人',
    nameEn: 'Ordinary person',
    blurbCn: '没有受过战斗训练的居民、商人或路人。',
    blurbEn: 'An untrained resident, trader or passer-by.',
    audience: 'npc',
    recommended: true,
    values: {
      abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      proficiencyBonus: 2,
      armorClass: 10,
      maxHp: 4,
      speedFt: 30,
      attacks: [{
        id: 'improvised-strike', nameCn: '即兴攻击', nameEn: 'Improvised strike',
        kind: 'weapon_attack', ability: 'strength',
        damageFormulaDice: '1d4', addAbilityToDamage: false,
        damageTypeCn: '钝击', damageTypeEn: 'bludgeoning',
      }],
    },
  },
  martial: {
    id: 'martial',
    nameCn: '武装人员',
    nameEn: 'Armed / martial',
    blurbCn: '受过基本战斗训练，穿护甲、用近战武器。',
    blurbEn: 'Basic combat training, wears armour, fights in melee.',
    audience: 'both',
    recommended: true,
    values: {
      abilities: { strength: 14, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 11, charisma: 10 },
      proficiencyBonus: 2,
      armorClass: 16,
      maxHp: 16,
      speedFt: 30,
      savingThrows: { strength: 'proficient' },
      skills: { athletics: 'proficient', perception: 'proficient' },
      attacks: [{
        id: 'melee-weapon', nameCn: '近战武器', nameEn: 'Melee weapon',
        kind: 'weapon_attack', ability: 'strength',
        damageFormulaDice: '1d8', addAbilityToDamage: true,
        damageTypeCn: '挥砍', damageTypeEn: 'slashing',
      }],
    },
  },
  scout: {
    id: 'scout',
    nameCn: '斥候',
    nameEn: 'Scout / agile',
    blurbCn: '灵活、擅长潜行与观察，护甲较轻。',
    blurbEn: 'Nimble, good at sneaking and spotting, lightly armoured.',
    audience: 'both',
    values: {
      abilities: { strength: 11, dexterity: 16, constitution: 12, intelligence: 11, wisdom: 13, charisma: 10 },
      proficiencyBonus: 2,
      armorClass: 14,
      maxHp: 13,
      speedFt: 30,
      savingThrows: { dexterity: 'proficient' },
      skills: { stealth: 'proficient', perception: 'proficient', survival: 'proficient' },
      attacks: [{
        id: 'light-melee', nameCn: '轻型近战', nameEn: 'Light melee',
        kind: 'weapon_attack', ability: 'dexterity',
        damageFormulaDice: '1d6', addAbilityToDamage: true,
        damageTypeCn: '穿刺', damageTypeEn: 'piercing',
      }],
    },
  },
  ranged: {
    id: 'ranged',
    nameCn: '远程射手',
    nameEn: 'Ranged',
    blurbCn: '站在后排用远程武器输出。',
    blurbEn: 'Stays back and attacks at range.',
    audience: 'both',
    values: {
      abilities: { strength: 10, dexterity: 16, constitution: 12, intelligence: 11, wisdom: 12, charisma: 10 },
      proficiencyBonus: 2,
      armorClass: 13,
      maxHp: 11,
      speedFt: 30,
      savingThrows: { dexterity: 'proficient' },
      skills: { perception: 'proficient', stealth: 'proficient' },
      attacks: [{
        id: 'ranged-weapon', nameCn: '远程武器', nameEn: 'Ranged weapon',
        kind: 'weapon_attack', ability: 'dexterity',
        damageFormulaDice: '1d8', addAbilityToDamage: true,
        damageTypeCn: '穿刺', damageTypeEn: 'piercing',
      }],
    },
  },
  adept: {
    id: 'adept',
    nameCn: '施法者型',
    nameEn: 'Spellcaster-like',
    blurbCn: '会用法术攻击的人物。不含法术位或职业能力。',
    blurbEn: 'Attacks with magic. No spell slots or class features.',
    audience: 'both',
    values: {
      abilities: { strength: 9, dexterity: 12, constitution: 12, intelligence: 15, wisdom: 13, charisma: 12 },
      proficiencyBonus: 2,
      armorClass: 12,
      maxHp: 12,
      speedFt: 30,
      savingThrows: { intelligence: 'proficient', wisdom: 'proficient' },
      skills: { arcana: 'proficient', investigation: 'proficient' },
      attacks: [{
        id: 'spell-attack', nameCn: '法术攻击', nameEn: 'Spell attack',
        kind: 'spell_attack', ability: 'intelligence',
        damageFormulaDice: '1d10', addAbilityToDamage: false,
        damageTypeCn: '力场', damageTypeEn: 'force',
      }],
    },
  },
  expert: {
    id: 'expert',
    nameCn: '专家',
    nameEn: 'Skilled expert',
    blurbCn: '靠社交与专业知识解决问题，战斗力一般。',
    blurbEn: 'Solves problems with social skill and know-how, not force.',
    audience: 'npc',
    values: {
      abilities: { strength: 10, dexterity: 14, constitution: 11, intelligence: 14, wisdom: 12, charisma: 14 },
      proficiencyBonus: 2,
      armorClass: 12,
      maxHp: 10,
      speedFt: 30,
      savingThrows: { dexterity: 'proficient' },
      skills: { insight: 'proficient', persuasion: 'proficient', investigation: 'proficient', deception: 'proficient' },
      attacks: [{
        id: 'light-melee', nameCn: '轻型近战', nameEn: 'Light melee',
        kind: 'weapon_attack', ability: 'dexterity',
        damageFormulaDice: '1d6', addAbilityToDamage: true,
        damageTypeCn: '穿刺', damageTypeEn: 'piercing',
      }],
    },
  },
  brute: {
    id: 'brute',
    nameCn: '蛮力生物',
    nameEn: 'Brute creature',
    blurbCn: '体型大、血厚、近身重击。',
    blurbEn: 'Large, tough, hits hard up close.',
    audience: 'monster',
    recommended: true,
    values: {
      abilities: { strength: 17, dexterity: 10, constitution: 16, intelligence: 6, wisdom: 10, charisma: 7 },
      proficiencyBonus: 2,
      armorClass: 13,
      maxHp: 30,
      speedFt: 30,
      savingThrows: { strength: 'proficient', constitution: 'proficient' },
      skills: { athletics: 'proficient' },
      attacks: [{
        id: 'heavy-slam', nameCn: '重击', nameEn: 'Heavy slam',
        kind: 'weapon_attack', ability: 'strength',
        damageFormulaDice: '2d6', addAbilityToDamage: true,
        damageTypeCn: '钝击', damageTypeEn: 'bludgeoning',
      }],
    },
  },
  critter: {
    id: 'critter',
    nameCn: '小型生物',
    nameEn: 'Small creature',
    blurbCn: '弱小但灵活，适合成群出现。',
    blurbEn: 'Weak but quick — good in numbers.',
    audience: 'monster',
    recommended: true,
    values: {
      abilities: { strength: 8, dexterity: 14, constitution: 10, intelligence: 3, wisdom: 11, charisma: 5 },
      proficiencyBonus: 2,
      armorClass: 12,
      maxHp: 7,
      speedFt: 30,
      skills: { stealth: 'proficient' },
      attacks: [{
        id: 'bite', nameCn: '撕咬', nameEn: 'Bite',
        kind: 'weapon_attack', ability: 'dexterity',
        damageFormulaDice: '1d4', addAbilityToDamage: true,
        damageTypeCn: '穿刺', damageTypeEn: 'piercing',
      }],
    },
  },
};

export function listDndActorPresets(audience: 'npc' | 'monster'): DndActorPreset[] {
  const matching = DND_ACTOR_PRESET_IDS
    .map((id) => PRESETS[id])
    .filter((preset) => preset.audience === 'both' || preset.audience === audience);
  // Recommended first, blank last, definition order otherwise.
  return [
    ...matching.filter((preset) => preset.recommended),
    ...matching.filter((preset) => !preset.recommended && preset.id !== 'blank'),
    ...matching.filter((preset) => preset.id === 'blank'),
  ];
}

export function getDndActorPreset(id: string | undefined): DndActorPreset | undefined {
  return id !== undefined && (DND_ACTOR_PRESET_IDS as readonly string[]).includes(id)
    ? PRESETS[id as DndActorPresetId]
    : undefined;
}

export function dndActorPresetName(preset: DndActorPreset, locale: 'zh-CN' | 'en'): string {
  return locale === 'en' ? preset.nameEn : preset.nameCn;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function buildActions(preset: DndActorPreset, abilities: DndLiteActorSheet['abilities'], proficiencyBonus: number, locale: 'zh-CN' | 'en'): DndLiteActorAction[] {
  return (preset.values.attacks ?? []).map((attack) => {
    const modifier = calculateDndAbilityModifier(abilities[attack.ability]);
    const damageFormula = attack.addAbilityToDamage && modifier !== 0
      ? `${attack.damageFormulaDice}${signed(modifier)}`
      : attack.damageFormulaDice;
    const action: DndLiteActorAction = {
      id: attack.id,
      name: locale === 'en' ? attack.nameEn : attack.nameCn,
      kind: attack.kind,
      // T12 requires an integer attack bonus on every resolvable action.
      attackBonus: modifier + proficiencyBonus,
      damageFormula,
    };
    const damageType = locale === 'en' ? attack.damageTypeEn : attack.damageTypeCn;
    return damageType ? { ...action, damageType } : action;
  });
}

export interface MaterializeDndActorPresetInput {
  displayName: string;
  actorKind: DndLiteActorKind;
  locale?: 'zh-CN' | 'en';
}

/**
 * Produces the canonical sheet a preset starts from.
 *
 * Creation-time copy, deliberately: the returned sheet is plain owned data with
 * no reference back to the definition. `displayName` and `actorKind` come from
 * the caller and are NOT preset-controlled — naming an NPC is not customising
 * the archetype.
 */
export function materializeDndActorPreset(
  presetId: string | undefined,
  input: MaterializeDndActorPresetInput,
): DndLiteActorSheet {
  const preset = getDndActorPreset(presetId);
  const base = createDefaultDndLiteActorSheet({ displayName: input.displayName, actorKind: input.actorKind });
  if (!preset || preset.id === 'blank') return base;

  const locale = input.locale ?? 'zh-CN';
  const values = preset.values;
  const abilities = { ...base.abilities, ...values.abilities };
  const proficiencyBonus = values.proficiencyBonus ?? base.proficiencyBonus;

  const savingThrows: DndLiteActorSheet['savingThrows'] = {};
  for (const ability of Object.keys(values.savingThrows ?? {}) as DndAbilityKey[]) {
    savingThrows[ability] = calculateDndAbilityModifier(abilities[ability]) + proficiencyBonus;
  }
  const skills: DndLiteActorSheet['skills'] = {};
  for (const skill of Object.keys(values.skills ?? {}) as DndSkillKey[]) {
    skills[skill] = calculateDndAbilityModifier(abilities[SKILL_ABILITY[skill]]) + proficiencyBonus;
  }

  return {
    ...base,
    abilities,
    proficiencyBonus,
    defenses: {
      ...(values.armorClass !== undefined ? { armorClass: values.armorClass } : {}),
      ...(values.maxHp !== undefined ? { maxHp: values.maxHp, currentHp: values.maxHp } : {}),
      ...(values.speedFt !== undefined ? { speedFt: values.speedFt } : {}),
    },
    savingThrows,
    skills,
    actions: buildActions(preset, abilities, proficiencyBonus, locale),
  };
}

/**
 * Local copy of the skill→ability mapping.
 *
 * `dndLiteActorSheet` keeps its own private copy and does not export one;
 * duplicating eight lines beat exporting a new symbol from a module the T9/T12
 * paths depend on. Kept adjacent to the only consumer so the two stay visible.
 */
const SKILL_ABILITY: Record<DndSkillKey, DndAbilityKey> = {
  acrobatics: 'dexterity', animalHandling: 'wisdom', arcana: 'intelligence', athletics: 'strength',
  deception: 'charisma', history: 'intelligence', insight: 'wisdom', intimidation: 'charisma',
  investigation: 'intelligence', medicine: 'wisdom', nature: 'intelligence', perception: 'wisdom',
  performance: 'charisma', persuasion: 'charisma', religion: 'intelligence', sleightOfHand: 'dexterity',
  stealth: 'dexterity', survival: 'wisdom',
};

// ── Preset vs Custom ────────────────────────────────────────────────────────

/**
 * The fields a preset decides, and therefore the ONLY fields that can move an
 * actor from Preset to Custom.
 *
 * Deliberately excluded: `displayName` (the GM always names the actor),
 * `actorKind` (chosen by the entrance), `notes` and `tags` (narrative, not
 * mechanics), and `defenses.temporaryHp` (play state, never authored here).
 */
export const DND_ACTOR_PRESET_CONTROLLED_FIELDS = [
  'abilities',
  'proficiencyBonus',
  'defenses.armorClass',
  'defenses.maxHp',
  'defenses.currentHp',
  'defenses.speedFt',
  'savingThrows',
  'skills',
  'actions',
] as const;

export type DndActorPresetStatus = 'preset' | 'custom' | 'unknown';

export interface DndActorPresetComparison {
  status: DndActorPresetStatus;
  /** Controlled fields that differ. Empty when `status` is not `custom`. */
  changedFields: string[];
  /** Set when the stored definition version is not the one running now. */
  definitionVersionMismatch?: boolean;
}

function normalizedNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Order-independent, undefined-insensitive comparison of a numeric map. */
function sameNumberMap(left: Record<string, unknown> = {}, right: Record<string, unknown> = {}): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (normalizedNumber(left[key]) !== normalizedNumber(right[key])) return false;
  }
  return true;
}

/**
 * Actions compare by the fields that decide behaviour, in order.
 *
 * `name` is included: renaming "Melee weapon" to "Rusty axe" is a real edit the
 * GM made to this actor, and claiming it still matches the archetype would be
 * wrong. `notes` is not.
 */
function sameActions(left: DndLiteActorAction[] = [], right: DndLiteActorAction[] = []): boolean {
  if (left.length !== right.length) return false;
  return left.every((action, index) => {
    const other = right[index];
    return action.id === other.id
      && action.name === other.name
      && action.kind === other.kind
      && normalizedNumber(action.attackBonus) === normalizedNumber(other.attackBonus)
      && (action.damageFormula ?? '') === (other.damageFormula ?? '')
      && (action.damageType ?? '') === (other.damageType ?? '')
      && (action.saveAbility ?? '') === (other.saveAbility ?? '')
      && normalizedNumber(action.saveDc) === normalizedNumber(other.saveDc);
  });
}

/**
 * Compares a live sheet against a freshly materialized preset.
 *
 * The preset is re-materialized rather than stored, so the actor's own values
 * remain the only saved truth — there is no overlay that could go stale behind
 * the sheet.
 */
export function compareDndActorPresetState(input: {
  presetId: string | undefined;
  presetVersion?: number;
  sheet: DndLiteActorSheet;
  locale?: 'zh-CN' | 'en';
}): DndActorPresetComparison {
  const preset = getDndActorPreset(input.presetId);
  if (!preset) return { status: 'unknown', changedFields: [] };
  if (input.presetVersion !== undefined && input.presetVersion !== DND_ACTOR_PRESET_DEFINITION_VERSION) {
    // The actor was built from an earlier definition. Reporting `custom` would
    // blame the GM for a change this build made, so report neither.
    return { status: 'unknown', changedFields: [], definitionVersionMismatch: true };
  }

  const baseline = materializeDndActorPreset(preset.id, {
    displayName: input.sheet.displayName,
    actorKind: input.sheet.actorKind,
    locale: input.locale,
  });

  const changedFields: string[] = [];
  if (!sameNumberMap(input.sheet.abilities, baseline.abilities)) changedFields.push('abilities');
  if (normalizedNumber(input.sheet.proficiencyBonus) !== normalizedNumber(baseline.proficiencyBonus)) changedFields.push('proficiencyBonus');
  for (const key of ['armorClass', 'maxHp', 'currentHp', 'speedFt'] as const) {
    if (normalizedNumber(input.sheet.defenses?.[key]) !== normalizedNumber(baseline.defenses?.[key])) changedFields.push(`defenses.${key}`);
  }
  if (!sameNumberMap(input.sheet.savingThrows, baseline.savingThrows)) changedFields.push('savingThrows');
  if (!sameNumberMap(input.sheet.skills, baseline.skills)) changedFields.push('skills');
  if (!sameActions(input.sheet.actions, baseline.actions)) changedFields.push('actions');

  return { status: changedFields.length === 0 ? 'preset' : 'custom', changedFields };
}

/**
 * Restores the preset-controlled fields onto an existing sheet.
 *
 * Everything the preset does not control is carried over untouched: the actor's
 * name, kind, notes, tags and temporary HP survive a reset. This produces a
 * DRAFT — it writes nothing, and the caller still saves through the normal
 * campaign-actor path, so ownership, bindings, admission, tokens and live
 * combat state are all unaffected.
 */
export function resetSheetToDndActorPreset(input: {
  presetId: string | undefined;
  sheet: DndLiteActorSheet;
  locale?: 'zh-CN' | 'en';
}): DndLiteActorSheet | undefined {
  const preset = getDndActorPreset(input.presetId);
  if (!preset) return undefined;
  const baseline = materializeDndActorPreset(preset.id, {
    displayName: input.sheet.displayName,
    actorKind: input.sheet.actorKind,
    locale: input.locale,
  });
  return {
    ...input.sheet,
    abilities: baseline.abilities,
    proficiencyBonus: baseline.proficiencyBonus,
    defenses: {
      ...baseline.defenses,
      ...(input.sheet.defenses?.temporaryHp !== undefined ? { temporaryHp: input.sheet.defenses.temporaryHp } : {}),
    },
    savingThrows: baseline.savingThrows,
    skills: baseline.skills,
    actions: baseline.actions,
  };
}

/**
 * The subset a room-scoped temporary character can actually carry.
 *
 * The temporary-character admission contract holds a short summary plus current
 * HP, max HP and armour class — and nothing else. Abilities, saves, skills and
 * actions have nowhere to go, so they are deliberately not returned here rather
 * than being smuggled into a free-text field.
 */
export function dndActorPresetQuickDraftValues(presetId: string | undefined, locale: 'zh-CN' | 'en' = 'zh-CN'): {
  summary: string;
  hpCurrent?: number;
  hpMax?: number;
  armorClass?: number;
} | undefined {
  const preset = getDndActorPreset(presetId);
  if (!preset || preset.id === 'blank') return undefined;
  return {
    summary: locale === 'en' ? preset.nameEn : preset.nameCn,
    hpCurrent: preset.values.maxHp,
    hpMax: preset.values.maxHp,
    armorClass: preset.values.armorClass,
  };
}
