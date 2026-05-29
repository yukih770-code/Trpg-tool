export type AttributeName = 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha';

export interface Attribute {
  base: number;
  pointbuy: number;
  racebonus: number;
  extrabonus: number;
}

export interface CharacterAttributes {
  Str: Attribute;
  Dex: Attribute;
  Con: Attribute;
  Int: Attribute;
  Wis: Attribute;
  Cha: Attribute;
}

export type SkillName = '运动' | '特技' | '巧手' | '隐匿' | '奥秘' | '历史' | '调查' | '自然' | '宗教' | '驯兽' | '洞察' | '医药' | '察觉' | '生存' | '欺瞒' | '威吓' | '表演' | '游说';

export type HitDiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12';

export interface SpellInfo {
  name_cn: string;
  name_en: string;
  level: number;
  school: string;
  is_ritual: boolean;
  classes: string[];
  cast_time: string;
  range: string;
  component: { v: boolean; s: boolean; m: boolean; comp_m?: string };
  duration: string;
  desc: string;
  upcast?: string;
  prepared?: boolean;
}

export interface ClassFeature {
  name: string;
  desc: string;
  unlockLevel: number;
}

export interface SubclassDef {
  name: string;
  desc: string;
  unlockLevel: number;
  features: ClassFeature[];
}

export interface ClassDef {
  name: string;
  desc: string;
  primaryAbility: AttributeName;
  savingThrows: string[];
  hitDice: HitDiceType;
  weaponProficiencies: string[];
  armorProficiencies: string[];
  startingEquipment: string;
  features: ClassFeature[];
  subclasses: SubclassDef[];
}

export interface RaceDef {
  name: string;
  desc: string;
  strBonus: number;
  dexBonus: number;
  conBonus: number;
  intBonus: number;
  wisBonus: number;
  chaBonus: number;
  size: string;
  speed: number;
  baseLanguages: string[];
  features: string[];
  subraces: SubraceDef[];
}

export interface SubraceDef {
  name: string;
  desc: string;
  strBonus: number;
  dexBonus: number;
  conBonus: number;
  intBonus: number;
  wisBonus: number;
  chaBonus: number;
  size?: string;
  speed?: number;
  baseLanguages?: string[];
  features: string[];
}

export interface BackgroundDef {
  name: string;
  desc: string;
  skillProficiencies: SkillName[];
  toolProficiencies?: string[];
  languagesCount?: number;
  feature: {
    name: string;
    desc: string;
  };
  originFeat?: string;
}

// ─── Schema versioning ────────────────────────────────────────────────────────
// Bump this constant whenever a breaking field change is made to CharacterData.
// migrateCharacter() in characterMigration.ts contains the corresponding
// upgrade logic for each version step.
//
// Changelog:
//   v1  Initial versioning (schemaVersion field added).
//   v2  Added classResources: ResourceState[] and pactMagicState?: PactMagicState.
export const CURRENT_DND_CHARACTER_SCHEMA_VERSION = 2;

// ─── Runtime resource state ───────────────────────────────────────────────────
// These interfaces describe the CHARACTER'S CURRENT STATE, not the rule
// definitions (those live in src/lib/dnd2024/progression-types.ts).

/**
 * Runtime state for a single quantifiable class resource (e.g. Rage uses,
 * Bardic Inspiration dice, Channel Divinity uses, Ki Points, …).
 *
 * The rule definition (max formula, recovery type, etc.) lives in
 * ClassResourceDefinition (progression-types.ts). This interface only stores
 * the mutable current value alongside a small cache of display metadata so the
 * UI does not have to re-derive it from the progression data every render.
 */
export interface ResourceState {
  /** Matches ClassResourceDefinition.id (e.g. "barbarian_rage"). */
  id: string;
  /** Current remaining uses / points. */
  current: number;
  /** Maximum uses / points at the character's current level (cached). */
  max: number;
  /** Human-readable source feature name (cached for UI display). */
  sourceFeature?: string;
  /** Recovery type key (cached — e.g. "longRest", "shortRest"). */
  recoveryType?: string;
  /** Associated die face (cached — e.g. "d6", "d8"); null if resource has no die. */
  dice?: string;
  /** Free-form notes for edge cases or manual overrides. */
  notes?: string;
}

/**
 * Runtime state for Warlock Pact Magic slots.
 *
 * Pact slots are structurally separate from the standard spellbook.slots pool
 * because they recover on a short rest and all share the same slot level
 * (which rises with Warlock level). Storing them here keeps the spellbook
 * untouched and avoids conflating the two systems.
 */
export interface PactMagicState {
  /** Current available pact slots. */
  current: number;
  /** Maximum pact slots at the character's current Warlock level (cached). */
  max: number;
  /** The spell level of every pact slot (all slots share one level). */
  slotLevel: number;
  /** Always "shortRest" per DND 2024; stored for display purposes. */
  recoveryType: string;
  /** Optional notes for edge cases. */
  notes?: string;
}

export interface CharacterData {
  // Schema version — absent on pre-v1 saves (treated as version 0 by migration)
  schemaVersion: number;
  id: string; // Unique ID for save/load
  name: string;
  age: string;
  gender: string;
  race: string;
  subrace: string;
  jobClass: string;
  subclass: string;
  background: string;
  description: string;
  level: number;
  hpMax: number;
  hpCurrent: number;
  tempHp: number;
  deathSaves: { successes: number; failures: number };
  hitDiceCurrent: number;
  acMod: number; // For manual adjustments
  speed: string;
  size: string;
  attrs: CharacterAttributes;
  skillProficiencies: SkillName[];
  savingThrowProficiencies: AttributeName[];
  weaponProficiencies: string[];
  armorTraining: string[];
  bardPerformance?: string;
  spellbook: {
    known: SpellInfo[];
    prepared: string[]; // spell names
    slots: { [level: number]: { max: number; current: number } };
  };
  customLanguages: string;
  inventory: string[];
  activeMods?: string[];
  customModsData?: CustomMod[];
  feats: string[];
  coin: number; // in gp
  // Creation state
  remainingPoints: number;
  isCompleted: boolean;
  // ── v2: Class resource runtime state ────────────────────────────────────
  // Mutable current-value containers. Rule definitions (max formulas, recovery
  // types, die sizes) live in src/lib/dnd2024/progression-types.ts.
  // Initialised to [] / undefined; populated by the resource initialisation
  // helper (not yet implemented as of v2).
  classResources: ResourceState[];
  pactMagicState?: PactMagicState;
}

export interface FeatDef {
  name: string;
  desc: string;
  prerequisiteDesc: string;
  category: 'Origin' | 'General';
  checkPrereq: (char: CharacterData) => boolean;
}

export interface CustomMod {
  id: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  baseSystem?: string; // e.g., 'D&D', 'CoC'
  conflictsWith?: string[];
  spells?: SpellInfo[];
  feats?: FeatDef[];
  races?: RaceDef[];
}
