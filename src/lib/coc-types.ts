// ─── Schema versioning ────────────────────────────────────────────────────────
// Bump this constant whenever a breaking field change is made to CocCharacter.
// migrateCocCharacter() in cocMigration.ts contains the corresponding upgrade
// logic for each version step.
//
// Changelog:
//   v1  Initial versioning (schemaVersion field added).
//   v2  Added optional runtime state for player-side HP/MP/SAN/Luck flags,
//       skill growth marks, and pushed roll context.
export const CURRENT_COC_CHARACTER_SCHEMA_VERSION = 2;

export type CocCharacteristic = 'STR' | 'CON' | 'SIZ' | 'DEX' | 'APP' | 'INT' | 'POW' | 'EDU' | 'LUK';

export interface CocSkill {
  name: string;
  baseValue: number;
  value: number; // Current value (base + allocated)
  isOccupational: boolean;
  isPersonal: boolean;
  canImprove: boolean; // Checked for improvement
}

export interface CocWeapon {
  name: string;
  skill: string;
  damage: string; // e.g. "1D4+DB"
  range: string;
  attacks: number;
  ammo: number;
  malfunction: number;
}

export interface CocRuntimeState {
  hp: {
    current: number;
    max: number;
  };
  mp: {
    current: number;
    max: number;
  };
  san: {
    current: number;
    max: number;
    initial: number;
  };
  luck: {
    current: number;
  };
  flags: {
    isMajorWound: boolean;
    isDying: boolean;
    isUnconscious: boolean;
    isTemporarilyInsane: boolean;
    isIndefinitelyInsane: boolean;
  };
  skillGrowthMarks: Record<string, boolean>;
  pushedRollContext?: {
    skillKey: string;
    skillName: string;
    previousRoll: number;
  };
}

export interface CocCharacter {
  /** Schema version — absent on pre-v1 saves (treated as version 0 by migration). */
  schemaVersion: number;
  id: string;
  name: string;
  player: string;
  occupation: string;
  age: number;
  sex: string;
  residence: string;
  birthplace: string;
  
  characteristics: Record<CocCharacteristic, number>;
  
  hp: {
    current: number;
    max: number;
  };
  mp: {
    current: number;
    max: number;
  };
  sanity: {
    current: number;
    start: number;
    max: number; // 99 - Cthulhu Mythos
  };
  luck: {
    current: number;
    start: number;
  };

  runtime?: CocRuntimeState;
  
  skills: CocSkill[];
  weapons: CocWeapon[];
  
  inventory: string[];
  backstory: {
    personalDescription: string;
    ideologyBeliefs: string;
    significantPeople: string;
    meaningfulLocations: string;
    treasuredPossessions: string;
    traits: string;
    injuriesScars: string;
    phobiasManias: string;
    arcaneTomesSpells: string;
    encounters: string;
  };

  finances: {
    spendingLevel: string;
    cash: string;
    assets: string;
  };
}

export const COC_BASE_SKILLS: { name: string, base: number }[] = [
  { name: '会计 (Accounting)', base: 5 },
  { name: '人类学 (Anthropology)', base: 1 },
  { name: '估价 (Appraise)', base: 5 },
  { name: '考古学 (Archaeology)', base: 1 },
  { name: '魅惑 (Charm)', base: 15 },
  { name: '攀爬 (Climb)', base: 20 },
  { name: '计算机使用 (Computer Use)', base: 5 },
  { name: '信用评级 (Credit Rating)', base: 0 },
  { name: '克苏鲁神话 (Cthulhu Mythos)', base: 0 },
  { name: '乔装 (Disguise)', base: 5 },
  { name: '闪避 (Dodge)', base: 0 }, // Half DEX
  { name: '汽车驾驶 (Drive Auto)', base: 20 },
  { name: '电气维修 (Electrical Repair)', base: 10 },
  { name: '电子学 (Electronics)', base: 1 },
  { name: '话术 (Fast Talk)', base: 5 },
  { name: '格斗(斗殴) (Fighting (Brawl))', base: 25 },
  { name: '火器(手枪) (Firearms (Handgun))', base: 20 },
  { name: '火器(步枪/霰弹枪) (Firearms (Rifle/Shotgun))', base: 25 },
  { name: '急救 (First Aid)', base: 30 },
  { name: '历史 (History)', base: 5 },
  { name: '恐吓 (Intimidate)', base: 15 },
  { name: '跳跃 (Jump)', base: 20 },
  { name: '语言(母语) (Language (Own))', base: 0 }, // EDU
  { name: '法律 (Law)', base: 5 },
  { name: '图书馆使用 (Library Use)', base: 20 },
  { name: '聆听 (Listen)', base: 20 },
  { name: '锁匠 (Locksmith)', base: 1 },
  { name: '机械维修 (Mechanical Repair)', base: 10 },
  { name: '医学 (Medicine)', base: 1 },
  { name: '博物学 (Natural World)', base: 10 },
  { name: '领航 (Navigate)', base: 10 },
  { name: '神秘学 (Occult)', base: 5 },
  { name: '操作重型机械 (Operate Heavy Machinery)', base: 1 },
  { name: '说服 (Persuade)', base: 10 },
  { name: '精神分析 (Psychoanalysis)', base: 1 },
  { name: '心理学 (Psychology)', base: 10 },
  { name: '骑术 (Ride)', base: 5 },
  { name: '科学 (Science)', base: 1 },
  { name: '妙手 (Sleight of Hand)', base: 10 },
  { name: '侦查 (Spot Hidden)', base: 25 },
  { name: '潜行 (Stealth)', base: 20 },
  { name: '生存 (Survival)', base: 10 },
  { name: '游泳 (Swim)', base: 20 },
  { name: '投掷 (Throw)', base: 20 },
  { name: '追踪 (Track)', base: 10 },
];
