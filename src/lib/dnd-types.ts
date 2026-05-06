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

export interface CharacterData {
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
