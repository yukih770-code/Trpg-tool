import { SpellInfo } from '../lib/dnd-types';
import type { RuleDataMetadata } from '../lib/rules/rule-data-metadata';

export const DND_SPELL_DATA_ACCURACY: RuleDataMetadata = {
  source: 'ai-assisted',
  trustLevel: 'ai-assisted-unverified',
  usagePolicy: 'needs-human-verification',
  sourceNote:
    'Legacy DND spell data retained for app continuity. Manifest audit found mixed 2014/2024 data, missing entries, translation issues, and out-of-source entries. Do not treat as verified owner-source data until corrected.',
};

const DND_SPELL_MANIFEST_REF =
  'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md';

const toSpellId = (nameEn: string) =>
  `spell.srd52.${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

const spellManifestMeta = (nameEn: string, note?: string): RuleDataMetadata => ({
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${DND_SPELL_MANIFEST_REF}#item-${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  sourceNote:
    note ??
    'Spell identity and level are present in the owner source manifest. Existing Chinese name, school, class list, and effect summary remain pending checked extraction.',
});

const spellTranslationNeedsCheckMeta = (nameEn: string, note: string): RuleDataMetadata => ({
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'needs-human-check',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${DND_SPELL_MANIFEST_REF}#item-${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  sourceNote: note,
});

const SPELL_METADATA_BY_EN: Record<string, RuleDataMetadata> = {
  'True Strike': spellTranslationNeedsCheckMeta(
    'True Strike',
    'Owner manifest confirms True Strike as a DND 2024 cantrip, but Chinese name is recorded as needs-human-check. Existing app name_cn is retained only for saved-character compatibility and is not verified.',
  ),
  'Hold Person': spellTranslationNeedsCheckMeta(
    'Hold Person',
    'Owner manifest confirms Hold Person as a level 2 DND 2024 spell, but Chinese name is recorded as needs-human-check. Existing app name_cn is retained only for saved-character compatibility and is not verified.',
  ),
  Revivify: spellTranslationNeedsCheckMeta(
    'Revivify',
    'Owner manifest confirms Revivify as a level 3 DND 2024 spell, but Chinese name is recorded as needs-human-check. Existing app name_cn 苍白复原感 is treated as an unverified translation anomaly and retained only for saved-character compatibility.',
  ),
};

export const DND_SPELL_MANIFEST_GAP_REPORT = {
  ownerManifestSpellEntries: 507,
  currentRuntimeSpellEntries: 20,
  strategy: 'route-b-current-runtime-list-only',
  missingRuntimeEntries: 487,
  note:
    'This correction pass keeps the current runtime spell list stable and adds source/trust metadata. A full 507-entry spell index is deferred until level/school/class-list extraction can be automated from owner sources without guessing.',
};

export const DND_SPELL_TRANSLATION_ANOMALY_REPORT = {
  checked: ['Revivify', 'True Strike', 'Hold Person'],
  resolvedBy: 'needs-human-check metadata; no memory-based renaming',
  note:
    'Owner manifest confirms spell identity and level but leaves Chinese names as needs-human-check. Existing UI names remain compatibility labels, not verified translations.',
};

// AI-LANDMARK: DND_SPELL_MANIFEST_CORRECTION
const applyDndSpellMetadata = (spells: SpellInfo[]): SpellInfo[] =>
  spells.map((spell) => ({
    ...spell,
    id: spell.id ?? toSpellId(spell.name_en),
    ruleMeta:
      SPELL_METADATA_BY_EN[spell.name_en] ??
      spellManifestMeta(
        spell.name_en,
        'Spell identity and level are present in the owner source manifest or retained from the current runtime list. Existing Chinese name, school, class list, and effect summary remain pending checked extraction.',
      ),
  }));

export const SPELL_DATA: SpellInfo[] = applyDndSpellMetadata([
  // L0 - Cantrips
  {
    name_cn: '火焰箭', name_en: 'Fire Bolt', level: 0, school: '塑能', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '动作', range: '120尺', component: { v: true, s: true, m: false }, duration: '立即',
    desc: '远程法术攻击，命中造成 1d10 火焰伤害。5级 2d10，11级 3d10，17级 4d10。'
  },
  {
    name_cn: '正义之手', name_en: 'True Strike', level: 0, school: '预言', is_ritual: false, classes: ['法师', '术士', '吟游诗人', '邪术师'],
    cast_time: '动作', range: '自身', component: { v: false, s: true, m: true, comp_m: '一件武器' }, duration: '立即',
    desc: '2024版：使用施法属性进行一次武器攻击，命中造成额外光耀伤害。'
  },
  {
    name_cn: '法师之手', name_en: 'Mage Hand', level: 0, school: '咒法', is_ritual: false, classes: ['法师', '邪术师', '术士', '吟游诗人'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: false }, duration: '1分钟',
    desc: '召唤隐形魔法手，执行简单远程操作，无法攻击。'
  },
  {
    name_cn: '恶言相加', name_en: 'Vicious Mockery', level: 0, school: '惑控', is_ritual: false, classes: ['吟游诗人'],
    cast_time: '动作', range: '60尺', component: { v: true, s: false, m: false }, duration: '立即',
    desc: '目标感知豁免，失败 1d6 心灵伤害，下一次攻击劣势。'
  },
  {
    name_cn: '指引术', name_en: 'Guidance', level: 0, school: '预言', is_ritual: false, classes: ['牧师', '德鲁伊'],
    cast_time: '动作', range: '触碰', component: { v: true, s: true, m: false }, duration: '专注，至多1分钟',
    desc: '目标下一次属性检定增加 1d4。'
  },
  {
    name_cn: '奇术', name_en: 'Thaumaturgy', level: 0, school: '变化', is_ritual: false, classes: ['牧师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: false, m: false }, duration: '1分钟',
    desc: '扩音、操控火焰、开关门窗、制造幻音、地面震动。'
  },
  // L1
  {
    name_cn: '魔法飞弹', name_en: 'Magic Missile', level: 1, school: '塑能', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '动作', range: '120尺', component: { v: true, s: true, m: false }, duration: '立即',
    desc: '3发自动命中飞弹，每发 1d4+1 力场伤害。'
  },
  {
    name_cn: '治愈真言', name_en: 'Healing Word', level: 1, school: '防护', is_ritual: false, classes: ['吟游诗人', '牧师', '德鲁伊'],
    cast_time: '附赠动作', range: '60尺', component: { v: true, s: false, m: false }, duration: '立即',
    desc: '60尺内生物恢复 2d4+施法修正 生命值。'
  },
  {
    name_cn: '护盾术', name_en: 'Shield', level: 1, school: '防护', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '反应(被攻击时)', range: '自身', component: { v: true, s: true, m: false }, duration: '1轮',
    desc: 'AC+5，免疫魔法飞弹。'
  },
  {
    name_cn: '灾祸术', name_en: 'Bane', level: 1, school: '惑控', is_ritual: false, classes: ['吟游诗人', '牧师', '邪术师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: true, comp_m: '一滴血' }, duration: '专注，至多1分钟',
    desc: '至多3目标魅力豁免，失败攻击/豁免 -1d4。'
  },
  {
    name_cn: '祝福术', name_en: 'Bless', level: 1, school: '惑控', is_ritual: false, classes: ['牧师', '圣武士'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: true, comp_m: '一滴圣水' }, duration: '专注，至多1分钟',
    desc: '至多3目标攻击/豁免 +1d4。'
  },
  {
    name_cn: '狂笑术', name_en: 'Tasha\'s Hideous Laughter', level: 1, school: '惑控', is_ritual: false, classes: ['吟游诗人', '法师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: true, comp_m: '小塔饼' }, duration: '专注，至多1分钟',
    desc: '目标智力豁免，失败则伏地瘫痪并大笑。'
  },
  // L2
  {
    name_cn: '隐形术', name_en: 'Invisibility', level: 2, school: '幻术', is_ritual: false, classes: ['法师', '吟游诗人', '术士', '邪术师'],
    cast_time: '动作', range: '触碰', component: { v: true, s: true, m: true, comp_m: '睫毛+阿拉伯胶' }, duration: '专注，至多1小时',
    desc: '目标隐形，攻击/施法/造成伤害则解除。'
  },
  {
    name_cn: '迷踪步', name_en: 'Misty Step', level: 2, school: '咒法', is_ritual: false, classes: ['法师', '术士', '邪术师', '圣武士'],
    cast_time: '附赠动作', range: '自身', component: { v: true, s: false, m: false }, duration: '立即',
    desc: '传送至 30 尺内可见坐标。'
  },
  {
    name_cn: '粉碎音波', name_en: 'Shatter', level: 2, school: '塑能', is_ritual: false, classes: ['法师', '吟游诗人', '术士', '邪术师'],
    cast_time: '动作', range: '60尺', component: { v: true, s: true, m: true, comp_m: '云母' }, duration: '立即',
    desc: '10尺区域巨响，生物体质豁免 3d8 雷鸣伤害。'
  },
  {
    name_cn: '人类定身术', name_en: 'Hold Person', level: 2, school: '惑控', is_ritual: false, classes: ['牧师', '法师', '吟游诗人', '邪术师', '术士'],
    cast_time: '动作', range: '60尺', component: { v: true, s: true, m: true, comp_m: '小铁条' }, duration: '专注，至多1分钟',
    desc: '类人生物智慧豁免，失败则麻痹。'
  },
  // L3
  {
    name_cn: '火球术', name_en: 'Fireball', level: 3, school: '塑能', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '动作', range: '150尺', component: { v: true, s: true, m: true, comp_m: '蝙蝠粪+硫磺' }, duration: '立即',
    desc: '20尺半径爆炸，8d6 火焰伤害，敏捷豁免减半。'
  },
  {
    name_cn: '反制法术', name_en: 'Counterspell', level: 3, school: '防护', is_ritual: false, classes: ['法师', '术士', '邪术师'],
    cast_time: '反应', range: '60尺', component: { v: false, s: true, m: false }, duration: '立即',
    desc: '2024版：目标进行属性豁免，失败则法术失效。'
  },
  {
    name_cn: '解除魔法', name_en: 'Dispel Magic', level: 3, school: '防护', is_ritual: false, classes: ['法师', '吟游诗人', '牧师', '德鲁伊', '术士', '邪术师'],
    cast_time: '动作', range: '120尺', component: { v: true, s: true, m: false }, duration: '立即',
    desc: '终止目标上的法术效应。'
  },
  {
    name_cn: '苍白复原感', name_en: 'Revivify', level: 3, school: '咒法', is_ritual: false, classes: ['牧师', '圣武士'],
    cast_time: '动作', range: '触碰', component: { v: true, s: true, m: true, comp_m: '300gp钻石' }, duration: '立即',
    desc: '复活死于 1 分钟内的生物。'
  }
]);
