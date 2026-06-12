import { CharacterData, AttributeName, FeatDef } from '../lib/dnd-types';
import type { RuleDataMetadata } from '../lib/rules/rule-data-metadata';

export const DND_FEAT_DATA_ACCURACY: RuleDataMetadata = {
  source: 'ai-assisted',
  trustLevel: 'ai-assisted-unverified',
  usagePolicy: 'needs-human-verification',
  sourceNote:
    'Legacy DND feat data retained for app continuity. Manifest audit found mixed 2014/2024 data, missing entries, translation issues, and out-of-source entries. Do not treat as verified owner-source data until corrected.',
};

const DND_FEAT_MANIFEST_REF =
  'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md';

const originFeatMeta = (note?: string): RuleDataMetadata => ({
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${DND_FEAT_MANIFEST_REF}#item-起源专长`,
  sourceNote:
    note ??
    'DND 2024 origin feat category source is located. Individual feat effects remain pending heading/table extraction and human verification.',
});

const generalFeatMeta = (note?: string): RuleDataMetadata => ({
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'needs-human-check',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${DND_FEAT_MANIFEST_REF}#item-通用专长`,
  sourceNote:
    note ??
    'DND 2024 general feat category source is located, but this existing app entry needs individual source-row verification before being treated as owner-source matched.',
});

const tcoeFeatMeta = (note?: string): RuleDataMetadata => ({
  source: 'dnd5echm-tcoe',
  trustLevel: 'needs-human-check',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${DND_FEAT_MANIFEST_REF}#item-专长`,
  sourceNote:
    note ??
    'TCoE feat source file is located, but this existing app entry needs individual source-row verification before being treated as owner-source matched.',
});

const FEAT_METADATA_BY_NAME: Record<string, RuleDataMetadata> = {
  '警觉 (Alert)': originFeatMeta(),
  '音乐家 (Musician)': originFeatMeta('Origin feat source-linked. Confirmed separate from 健壮 (Tough); existing app effect text remains pending verification.'),
  '魔法学徒 (Magic Initiate)': originFeatMeta('Minimal placeholder added to repair DND 2024 background originFeat links. Effect details and spell-selection workflow remain deferred.'),
  '酒馆斗士 (Tavern Brawler)': originFeatMeta(),
  '幸运 (Lucky)': originFeatMeta(),
  '熟练 (Skilled)': originFeatMeta(),
  '健壮 (Tough)': originFeatMeta('Origin feat source-linked. Confirmed separate from 音乐家 (Musician); existing app effect text remains pending verification.'),
  '野蛮打击者 (Savage Attacker)': originFeatMeta(),
  '运动员 (Athlete)': generalFeatMeta(),
  '防御式决斗者 (Defensive Duelist)': generalFeatMeta(),
  '战地施法者 (War Caster)': generalFeatMeta(),
  '重甲大师 (Heavy Armor Master)': generalFeatMeta(),
  '神射手 (Sharpshooter)': generalFeatMeta(),
  '巨武器大师 (Great Weapon Master)': generalFeatMeta(),
  '长柄武器大师 (Polearm Master)': generalFeatMeta(),
  '观察者 (Observant)': generalFeatMeta(),
  '心力觉醒 (Telepathic)': tcoeFeatMeta(),
};

export const DND_BACKGROUND_ORIGIN_FEAT_LINK_REPORT = {
  originFeatReferences: [
    '魔法学徒 (Magic Initiate)',
    '野蛮打击者 (Savage Attacker)',
    '警觉 (Alert)',
    '音乐家 (Musician)',
    '熟练 (Skilled)',
    '幸运 (Lucky)',
  ],
  missingBeforeCorrection: ['魔法学徒 (Magic Initiate)'],
  linkStatus: 'resolved-by-minimal-placeholder',
  note:
    'Background originFeat strings are expected to match FEATS_DATA.name. This report records the v1 link correction without adding feat effects automation.',
};

// AI-LANDMARK: DND_FEAT_BACKGROUND_LINK_CORRECTION
const applyDndFeatMetadata = (feats: FeatDef[]): FeatDef[] =>
  feats.map((feat) => ({
    ...feat,
    ruleMeta: FEAT_METADATA_BY_NAME[feat.name] ?? DND_FEAT_DATA_ACCURACY,
  }));

const getAttrTotal = (char: CharacterData, attr: AttributeName) => {
  const a = char.attrs[attr];
  return a.base + a.pointbuy + a.racebonus + a.extrabonus;
};

export const FEATS_DATA: FeatDef[] = applyDndFeatMetadata([
  // --- 出身专长 (Origin Feats) ---
  {
    name: '警觉 (Alert)',
    desc: '你的先攻检定获得等同于你熟练加值的加值。在长休结束前，你可以选择一名自愿的盟友交换先攻值。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    name: '音乐家 (Musician)',
    desc: '你在乐器上极具才华。完成休息后，你可以给至多等同于你熟练加值的自愿盟友分发英雄灵感 (Heroic Inspiration)。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    id: 'feat.origin.magic-initiate',
    name: '魔法学徒 (Magic Initiate)',
    nameCn: '魔法学徒',
    desc: '该专长条目已定位来源，具体规则效果待核对。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    name: '酒馆斗士 (Tavern Brawler)',
    desc: '你擅长即兴武器和徒手攻击。你的徒手攻击可以用 1d4 + 力量调整值计算伤害，且命中后可尝试将目标推开 5 尺。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    name: '幸运 (Lucky)',
    desc: '你拥有不可思议的运气。你获得等同于熟练加值的幸运点，可消耗用于在掷骰中获得优势或强行让敌人获得劣势。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    name: '熟练 (Skilled)',
    desc: '你在任意三个你选择的技能或工具上获得熟练。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    name: '健壮 (Tough)',
    desc: '你的生命值上限增加，数值等同于你的等级的两倍。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },
  {
    name: '野蛮打击者 (Savage Attacker)',
    desc: '在每一回合你可以重掷一次近战武器伤害。',
    prerequisiteDesc: '无 (出身专长)',
    category: 'Origin',
    checkPrereq: () => true
  },

  // --- 通用专长 (General Feats - Level 4+) ---
  {
    name: '运动员 (Athlete)',
    desc: '获得：力量或敏捷+1（上限20），伏地起身的消耗减少至5尺，攀登移动不再有额外惩罚。',
    prerequisiteDesc: '等级 4+, 力量 13+ 或 敏捷 13+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4 && (getAttrTotal(char, 'Str') >= 13 || getAttrTotal(char, 'Dex') >= 13)
  },
  {
    name: '防御式决斗者 (Defensive Duelist)',
    desc: '当你手持巧劲武器被命中时，你可以用反应增加等同于熟练加值的AC。',
    prerequisiteDesc: '等级 4+, 敏捷 13+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4 && getAttrTotal(char, 'Dex') >= 13
  },
  {
    name: '战地施法者 (War Caster)',
    desc: '专注豁免优势，双手持盾也能施法，反应施法取代借机攻击。',
    prerequisiteDesc: '等级 4+, 具有施法能力',
    category: 'General',
    checkPrereq: (char) => char.level >= 4 && (char.spellbook && char.spellbook.known.length > 0)
  },
  {
    name: '重甲大师 (Heavy Armor Master)',
    desc: '力量+1，穿重甲时物理伤害减免等同于你的熟练加值。',
    prerequisiteDesc: '等级 4+, 重甲熟练',
    category: 'General',
    checkPrereq: (char) => char.level >= 4 && char.armorTraining.includes('重甲')
  },
  {
    name: '神射手 (Sharpshooter)',
    desc: '远程攻击忽略部分掩护，远距离不具有劣势，且命中后可以选择提升伤害。',
    prerequisiteDesc: '等级 4+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4
  },
  {
    name: '巨武器大师 (Great Weapon Master)',
    desc: '杀死敌人或暴击后可以发动额外攻击；近战伤害增加。',
    prerequisiteDesc: '等级 4+, 力量 13+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4 && getAttrTotal(char, 'Str') >= 13
  },
  {
    name: '长柄武器大师 (Polearm Master)',
    desc: '可以用长柄武器后端进行攻击；进入你的威胁范围时触发借机攻击。',
    prerequisiteDesc: '等级 4+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4
  },
  {
    name: '观察者 (Observant)',
    desc: '智力或感知+1；被动察觉和调查+5；可以读唇语。',
    prerequisiteDesc: '等级 4+, 智力 13+ 或 感知 13+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4 && (getAttrTotal(char, 'Int') >= 13 || getAttrTotal(char, 'Wis') >= 13)
  },
  {
    name: '心力觉醒 (Telepathic)',
    desc: '智力、感知或魅力+1；你可以进行心灵感应。',
    prerequisiteDesc: '等级 4+',
    category: 'General',
    checkPrereq: (char) => char.level >= 4
  }
]);
