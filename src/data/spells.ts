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
const DND_LOCAL_CHM_SPELL_DETAIL_REF =
  'dnd-local-chm-primary:玩家手册2024/法术详述';

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

const spellLocalChmMeta = (nameEn: string, fileName: string, sectionId: string): RuleDataMetadata => ({
  source: 'dnd-local-chm-primary',
  trustLevel: 'owner-source-matched',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${DND_LOCAL_CHM_SPELL_DETAIL_REF}/${fileName}#${sectionId}`,
  sourceNote:
    'Chinese name, spell metadata, description, and upcast/cantrip scaling were extracted from the user-local DND 2024 CHM spell detail source. Class labels keep existing app terminology where the source uses 魔契师 for the app label 邪术师.',
});

const SPELL_METADATA_BY_EN: Record<string, RuleDataMetadata> = {
  'Fire Bolt': spellLocalChmMeta('Fire Bolt', '0环.htm', 'Fire_Bolt'),
  Guidance: spellLocalChmMeta('Guidance', '0环.htm', 'Guidance'),
  'Mage Hand': spellLocalChmMeta('Mage Hand', '0环.htm', 'Mage_Hand'),
  Thaumaturgy: spellLocalChmMeta('Thaumaturgy', '0环.htm', 'Thaumaturgy'),
  'True Strike': spellLocalChmMeta('True Strike', '0环.htm', 'True_Strike'),
  'Vicious Mockery': spellLocalChmMeta('Vicious Mockery', '0环.htm', 'Vicious_Mockery'),
  Bane: spellLocalChmMeta('Bane', '1环.htm', 'Bane'),
  Bless: spellLocalChmMeta('Bless', '1环.htm', 'Bless'),
  'Healing Word': spellLocalChmMeta('Healing Word', '1环.htm', 'Healing_Word'),
  'Magic Missile': spellLocalChmMeta('Magic Missile', '1环.htm', 'Magic_Missile'),
  Shield: spellLocalChmMeta('Shield', '1环.htm', 'Shield'),
  "Tasha's Hideous Laughter": spellLocalChmMeta(
    "Tasha's Hideous Laughter",
    '1环.htm',
    "Tasha's_Hideous_Laughter",
  ),
  'Hold Person': spellLocalChmMeta('Hold Person', '2环.htm', 'Hold_Person'),
  Invisibility: spellLocalChmMeta('Invisibility', '2环.htm', 'Invisibility'),
  'Misty Step': spellLocalChmMeta('Misty Step', '2环.htm', 'Misty_Step'),
  Shatter: spellLocalChmMeta('Shatter', '2环.htm', 'Shatter'),
  Counterspell: spellLocalChmMeta('Counterspell', '3环.htm', 'Counterspell'),
  'Dispel Magic': spellLocalChmMeta('Dispel Magic', '3环.htm', 'Dispel_Magic'),
  Fireball: spellLocalChmMeta('Fireball', '3环.htm', 'Fireball'),
  Revivify: spellLocalChmMeta('Revivify', '3环.htm', 'Revivify'),
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
  resolvedBy:
    'True Strike and Hold Person were resolved from the user-local DND 2024 CHM source in Batch 1. Revivify was resolved from the same source in Batch 2.',
  note:
    'Owner manifest confirms spell identity and level. Entries with dnd-local-chm-primary metadata have checked Chinese names and per-entry source references.',
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
    desc: '你对施法距离内一名生物或物件掷出一把火焰，对目标进行一次远程法术攻击。命中时，目标将受到1d10点火焰伤害。未被着装或携带的可燃物件被该法术命中时将开始燃烧。',
    upcast: '戏法强化。到达特定等级后，此戏法的伤害将增加1d10：5级（2d10）、11级（3d10）、17级（4d10）。'
  },
  {
    name_cn: '克敌先击', name_en: 'True Strike', level: 0, school: '预言', is_ritual: false, classes: ['吟游诗人', '术士', '邪术师', '法师'],
    cast_time: '动作', range: '自身', component: { v: false, s: true, m: true, comp_m: '一把价值1+CP的你熟练的武器' }, duration: '立即',
    desc: '你受到一瞬魔法洞见的指引，使用施展此法术时使用的那把武器发动一次攻击。此次攻击使用你的施法属性（而非力量属性或敏捷属性）进行攻击检定与伤害掷骰。此次攻击造成伤害时，你可以选择将其伤害类型改为光耀伤害，或是维持武器原本的伤害类型。',
    upcast: '戏法强化。到达特定等级后，无论你选择造成光耀伤害还是原本类型的伤害，本次攻击都会额外造成光耀伤害：5级（1d6）、11级（2d6）、17级（3d6）。'
  },
  {
    name_cn: '法师之手', name_en: 'Mage Hand', level: 0, school: '咒法', is_ritual: false, classes: ['吟游诗人', '术士', '邪术师', '法师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: false }, duration: '1分钟',
    desc: '一只漂浮的幽灵手出现在施法距离内你指定的一点。幽灵手持续存在至法术终止。如果幽灵手与你之间的距离超过30尺，则幽灵手将消失不见。若你再次施展了此法术，现存的幽灵手也将提前消失。你可以在施展该法术时使用幽灵手实施一个行为：你可以操控一个物件、打开一扇未上锁的门或容器、将一件物品放入或取出一个打开的容器、或是将小瓶中的内容物倾倒出来。在后续的回合中，你可以用魔法动作控制幽灵手再次实施上述行为之一。而作为那次动作的一部分，你还可以令幽灵手移动至多30尺。该幽灵手不能攻击，也不能激活魔法物品或承载超过10磅重的物质。'
  },
  {
    name_cn: '恶言相加', name_en: 'Vicious Mockery', level: 0, school: '惑控', is_ritual: false, classes: ['吟游诗人'],
    cast_time: '动作', range: '60尺', component: { v: true, s: false, m: false }, duration: '立即',
    desc: '你对施法距离内一名你可见或可听的生物连珠炮式地释出一串蕴涵微妙惑控的侮辱。目标必须通过一次感知豁免，否则受到1d6点心灵伤害，且在其下一回合结束前，其进行的下一次攻击检定具有劣势。',
    upcast: '戏法强化。到达特定等级后，此戏法的伤害将增加1d6：5级（2d6）、11级（3d6）、17级（4d6）。'
  },
  {
    name_cn: '神导术', name_en: 'Guidance', level: 0, school: '预言', is_ritual: false, classes: ['牧师', '德鲁伊'],
    cast_time: '动作', range: '触碰', component: { v: true, s: true, m: false }, duration: '专注，至多1分钟',
    desc: '你触碰一名自愿生物并选择一项技能。直到法术结束为止，受术生物在进行使用到所选技能的任何属性检定时，该次检定具有1d4加值。'
  },
  {
    name_cn: '奇术', name_en: 'Thaumaturgy', level: 0, school: '变化', is_ritual: false, classes: ['牧师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: false, m: false }, duration: '1分钟',
    desc: '你在施法距离内显现一道次级奇迹。你在施法距离内创造下述效应之一。如果你多次施展该法术，则可以同时维持至多三个不同的1分钟效应：改变自己眼睛的外观；让语音音量变为通常情况下的三倍大，并在魅力（威吓）检定上具有优势；使一团火焰闪烁、变亮、变暗或变色；使一扇没有上锁的门或窗立即打开或关上；在指定一点发出短暂声音；或在地面上引发无害震动。'
  },
  // L1
  {
    name_cn: '魔法飞弹', name_en: 'Magic Missile', level: 1, school: '塑能', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '动作', range: '120尺', component: { v: true, s: true, m: false }, duration: '立即',
    desc: '你创造三枚由魔法力场形成的闪光飞镖，并让每发飞镖袭向施法距离内你能看见的指定生物。每发飞镖对目标造成1d4+1点力场伤害。所有飞镖将同时袭向目标，而你还可以指定它们击中同一个目标或是分别击中几个目标。',
    upcast: '升环施法。使用的法术位每比一环高一环，该法术就会多制造出一支飞镖。'
  },
  {
    name_cn: '治愈真言', name_en: 'Healing Word', level: 1, school: '防护', is_ritual: false, classes: ['吟游诗人', '牧师', '德鲁伊'],
    cast_time: '附赠动作', range: '60尺', component: { v: true, s: false, m: false }, duration: '立即',
    desc: '你指定施法距离内一个你能看见的生物并恢复其生命值，恢复量等于2d4+你的施法属性调整值。',
    upcast: '升环施法。使用的法术位每比一环高一环，此法术的治疗量就增加2d4点。'
  },
  {
    name_cn: '护盾术', name_en: 'Shield', level: 1, school: '防护', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '反应，当你被攻击命中或被作为魔法飞弹法术的目标时执行', range: '自身', component: { v: true, s: true, m: false }, duration: '1轮',
    desc: '一道看不见的力场制护盾浮现在你身旁，保护着你。在你的下一回合开始前，你的AC具有+5加值（在触发该法术的攻击之前生效），并且不会受到魔法飞弹的伤害。'
  },
  {
    name_cn: '灾祸术', name_en: 'Bane', level: 1, school: '惑控', is_ritual: false, classes: ['吟游诗人', '牧师', '邪术师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: true, comp_m: '一滴血' }, duration: '专注，至多1分钟',
    desc: '你选择施法距离内至多三个你可见的生物，迫使其分别进行一次魅力豁免。在法术终止前，豁免失败于此次魅力豁免的目标进行的每次攻击检定与豁免检定都必须承受1d4的减值。',
    upcast: '升环施法。你使用的法术位每比一环高一环，就能多选择一个生物作为目标。'
  },
  {
    name_cn: '祝福术', name_en: 'Bless', level: 1, school: '惑控', is_ritual: false, classes: ['牧师', '圣武士'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: true, comp_m: '一枚价值5+GP的圣徽' }, duration: '专注，至多1分钟',
    desc: '你祝福施法范围内至多三个生物。在法术终止前，受术目标进行的每次攻击检定与豁免检定都将获得1d4的加值。',
    upcast: '升环施法。你使用的法术位每比一环高一环，就能多选择一个生物作为目标。'
  },
  {
    name_cn: '塔莎狂笑术', name_en: 'Tasha\'s Hideous Laughter', level: 1, school: '惑控', is_ritual: false, classes: ['吟游诗人', '邪术师', '法师'],
    cast_time: '动作', range: '30尺', component: { v: true, s: true, m: true, comp_m: '一块甜馅饼和一根羽毛' }, duration: '专注，至多1分钟',
    desc: '施法距离内你可见的一名生物进行一次感知豁免。豁免失败，目标在持续时间内陷入失能和倒地状态。在此期间，目标会不受控制地狂笑（只要它能够发笑），且无法结束自身的倒地状态。目标在其每回合结束或受到伤害时，可以再进行一次感知豁免。如果豁免是因受到伤害所致，则该次豁免具有优势。豁免成功时，法术终止。',
    upcast: '升环施法。使用的法术位每比一环高一环，就可以额外指定一个目标。'
  },
  // L2
  {
    name_cn: '隐形术', name_en: 'Invisibility', level: 2, school: '幻术', is_ritual: false, classes: ['法师', '吟游诗人', '术士', '邪术师'],
    cast_time: '动作', range: '触碰', component: { v: true, s: true, m: true, comp_m: '睫毛+阿拉伯胶' }, duration: '专注，至多1小时',
    desc: '你触碰的一个生物进入隐形状态并维持至法术终止。如果目标进行攻击检定、造成伤害或施展法术，则此法术提前终止。',
    upcast: '升环施法。使用三环或更高法术位施展该法术时，你使用的法术位每比二环高一环，就可以额外指定一个生物作为目标。'
  },
  {
    name_cn: '迷踪步', name_en: 'Misty Step', level: 2, school: '咒法', is_ritual: false, classes: ['术士', '邪术师', '法师'],
    cast_time: '附赠动作', range: '自身', component: { v: true, s: false, m: false }, duration: '立即',
    desc: '你短暂地被银白的雾气所笼罩，传送到至多30尺内一个你能看见且未被占据的空间。'
  },
  {
    name_cn: '粉碎音波', name_en: 'Shatter', level: 2, school: '塑能', is_ritual: false, classes: ['吟游诗人', '术士', '法师'],
    cast_time: '动作', range: '60尺', component: { v: true, s: true, m: true, comp_m: '云母' }, duration: '立即',
    desc: '一阵震耳欲聋的噪音在你指定的施法距离内一点上爆发出来。以该点为中心半径10尺球状区域内的所有生物必须要进行一次体质豁免。豁免失败将受到3d8点雷鸣伤害；豁免成功受到半数伤害。构装生物进行该豁免时具有劣势。如果法术的范围内存在不被任何生物着装携带的非魔法物件，则它也要受到该伤害。',
    upcast: '升环施法。使用的法术位每比二环高一环，此法术的伤害就增加1d8。'
  },
  {
    name_cn: '定身类人', name_en: 'Hold Person', level: 2, school: '惑控', is_ritual: false, classes: ['吟游诗人', '牧师', '德鲁伊', '术士', '邪术师', '法师'],
    cast_time: '动作', range: '60尺', component: { v: true, s: true, m: true, comp_m: '一片直的小铁片' }, duration: '专注，至多1分钟',
    desc: '指定施法距离内一个你能看见的类人生物。该目标必须进行一次感知豁免，豁免失败则其在法术持续时间内陷入麻痹状态。目标在其每回合结束时可以重新进行这次豁免，豁免成功则终止其身上该法术的效应。',
    upcast: '升环施法。使用三环或更高法术位施展该法术时，你使用的法术位每比二环高一环，就可以额外指定一个类人作为目标。'
  },
  // L3
  {
    name_cn: '火球术', name_en: 'Fireball', level: 3, school: '塑能', is_ritual: false, classes: ['法师', '术士'],
    cast_time: '动作', range: '150尺', component: { v: true, s: true, m: true, comp_m: '一颗蝙蝠粪和硫磺搓成的小球' }, duration: '立即',
    desc: '明亮的闪光从你的指间飞驰向施法距离内你指定的一点，并随着一声低吼迸成一片烈焰。目标点周围半径20尺球状区域内的每个生物必须进行一次敏捷豁免。豁免失败者将受到8d6点火焰伤害，豁免成功则伤害减半。区域内所有未被着装或携带的可燃物件会开始燃烧。',
    upcast: '升环施法。使用的法术位每比三环高一环，此伤害就增加1d6。'
  },
  {
    name_cn: '反制法术', name_en: 'Counterspell', level: 3, school: '防护', is_ritual: false, classes: ['法师', '术士', '邪术师'],
    cast_time: '反应，当你看见60尺内一名生物施展一道具有言语、姿势或材料成分的法术时可用', range: '60尺', component: { v: false, s: true, m: false }, duration: '立即',
    desc: '你试图打断一名正在施法的生物。该生物进行一次体质豁免。豁免失败则法术消散且毫无效果，并且用于施展法术的动作、附赠动作或反应随之浪费。如果那道法术是使用法术位施展的，则法术位并不会被消耗。'
  },
  {
    name_cn: '解除魔法', name_en: 'Dispel Magic', level: 3, school: '防护', is_ritual: false, classes: ['吟游诗人', '牧师', '德鲁伊', '圣武士', '游侠', '术士', '邪术师', '法师'],
    cast_time: '动作', range: '120尺', component: { v: true, s: true, m: false }, duration: '立即',
    desc: '在施法距离内指定一名生物、一个物件或一处魔法效应。所有影响该目标的三环或更低环阶法术即告终止。每个影响目标的四环或更高环阶法术都需要以你的施法属性进行一次属性检定（DC 10+目标法术环阶），检定成功时目标法术终止。',
    upcast: '升环施法。你直接终止影响目标的小于等于该施法环阶的法术效应。'
  },
  {
    name_cn: '回生术', name_en: 'Revivify', level: 3, school: '死灵', is_ritual: false, classes: ['牧师', '德鲁伊', '圣武士', '游侠'],
    cast_time: '动作', range: '触碰', component: { v: true, s: true, m: true, comp_m: '一颗价值300+GP的钻石，作为法术耗材' }, duration: '立即',
    desc: '你接触在前一分钟内刚刚死亡的一名生物。该生物以1点生命值回生。该法术不能复活老死的生物，也不能恢复失去的身体部位。'
  }
]);
