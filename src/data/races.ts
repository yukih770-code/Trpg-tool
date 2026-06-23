import { RaceDef } from '../lib/dnd-types';
import type { RuleDataMetadata } from '../lib/rules/rule-data-metadata';

// AI-LANDMARK: DND_BACKGROUND_SPECIES_CORRECTION
// DND Background / Species Correction v1:
// - Default species list now follows the owner source manifest (DND 2024 species
//   model: no racial ASI, no subraces). Mechanics/size/speed are NOT fabricated;
//   they remain pending human extraction from the owner source.
// - Legacy 2014 race/subrace/racial-ASI data is retained below as
//   LEGACY_RACE_DATA and is quarantined, not deleted.

const SPECIES_MANIFEST_REF =
  'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md';
const LOCAL_CHM_SPECIES_REF =
  'dnd-local-chm-primary:玩家手册2024/角色起源/种族';

export const DND_SPECIES_2024_DATA_ACCURACY: RuleDataMetadata = {
  source: 'dnd-local-chm-primary',
  trustLevel: 'owner-source-matched',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${LOCAL_CHM_SPECIES_REF}#item-entries`,
  sourceNote:
    `Species entry names and source paths are matched to the local CHM owner source (${LOCAL_CHM_SPECIES_REF}); secondary manifest reference: ${SPECIES_MANIFEST_REF}. Shallow desc, fixed size/speed, and trait prose are extracted where the current schema can safely carry them. Variable size, languages, trait choices, spellcasting, resistances, movement modes, and runtime effects remain needs-human-check. Entries carry zero ability bonuses by the DND 2024 species model.`,
};

function makeSpecies2024(
  id: string,
  name: string,
  sourceFile: string,
  desc: string,
  size: string,
  speed: number,
  features: string[],
): RaceDef {
  return {
    id,
    name,
    desc,
    strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
    size,
    speed,
    baseLanguages: [],
    features,
    subraces: [],
    ruleMeta: {
      source: 'dnd-local-chm-primary',
      trustLevel: 'owner-source-matched',
      usagePolicy: 'needs-human-verification',
      sourceRef: `${LOCAL_CHM_SPECIES_REF}/${sourceFile}`,
      sourceNote: `Local CHM source entry ${name}; secondary manifest reference: ${SPECIES_MANIFEST_REF}#item-${name}.`,
    },
  };
}

export const DND_2024_SPECIES_DATA: RaceDef[] = [
  makeSpecies2024('species.aasimar', '阿斯莫', '阿斯莫.htm', '灵魂承载上层位面火花的凡命者，可以引来光明、治疗或天怒。', '', 30, [
    '体型：中型或小型，需创建时选择（当前 schema 暂不承载该选择）。',
    '天界抗性：光耀与暗蚀相关抗性，效果待自动化。',
    '黑暗视觉：60尺。',
    '治愈之手、光辉掌者、天启：来源已定位，治疗、戏法与变身选择待专用 schema。',
  ]),
  makeSpecies2024('species.human', '人类', '人类.htm', '数量庞大且各具特色，常以雄心与足智多谋在有限岁月中追求成就。', '', 30, [
    '体型：中型或小型，需创建时选择（当前 schema 暂不承载该选择）。',
    '适应力：长休后获得英雄激励，效果待自动化。',
    '技能：获得一项自选技能熟练，选择流程待 schema。',
    '多才多艺：获得一项自选起源专长，选择流程待 schema。',
  ]),
  makeSpecies2024('species.dwarf', '矮人', '矮人.htm', '由锻造之神从大地中唤醒，对石头、金属和地下生活有亲和力。', '中型', 30, [
    '黑暗视觉：120尺。',
    '矮人体魄：毒素相关抗性/豁免优势，效果待自动化。',
    '矮人刚毅：生命值上限提升，效果待自动化。',
    '石中精妙：震颤感知相关能力，使用次数与动作流程待 schema。',
  ]),
  makeSpecies2024('species.elf', '精灵', '精灵.htm', '源自科瑞隆与妖精荒野的长寿族裔，常受环境影响形成不同血系。', '中型', 30, [
    '黑暗视觉：60尺。',
    '精灵血系：卓尔、高等精灵或木精灵选择待专用 schema。',
    '妖精血统：避免或结束魅惑相关豁免优势，效果待自动化。',
    '敏锐感官与出神：技能选择和长休特殊规则待 schema。',
  ]),
  makeSpecies2024('species.halfling', '半身人', '半身人.htm', '受生命、家园与壁炉之神引导的小型族裔，重视家庭、社区与好运。', '小型', 30, [
    '勇气：避免或结束恐慌相关豁免优势，效果待自动化。',
    '半身人灵巧：穿越较大生物空间相关规则待移动/场景层。',
    '幸运：d20 掷出 1 时重掷，效果待自动化。',
    '天生善匿：躲藏动作条件待场景层。',
  ]),
  makeSpecies2024('species.gnome', '侏儒', '侏儒.htm', '由发明、幻影与地下生命之神创造的魔法族裔，机敏而好奇。', '小型', 30, [
    '黑暗视觉：60尺。',
    '侏儒狡黠：智力、感知、魅力豁免相关优势，效果待自动化。',
    '侏儒血系：森林侏儒或岩石侏儒选择待专用 schema。',
    '血系法术/装置能力为 prose-only，暂不接入施法或物品自动化。',
  ]),
  makeSpecies2024('species.dragonborn', '龙裔', '龙裔.htm', '承载金属龙或色彩龙血统的族裔，外貌彰显其龙类先祖。', '中型', 30, [
    '龙族血统：龙种与伤害类型选择待专用 schema。',
    '吐息武器：范围、伤害与使用次数待动作/资源自动化。',
    '伤害抗性：由龙族血统决定，效果待自动化。',
    '黑暗视觉与龙族飞翼：飞行/持续时间规则待运行时效果层。',
  ]),
  makeSpecies2024('species.tiefling', '提夫林', '提夫林.htm', '承继下层位面邪魔遗赠的族裔，可选择深渊、幽冥或炼狱遗赠。', '', 30, [
    '体型：中型或小型，需创建时选择（当前 schema 暂不承载该选择）。',
    '黑暗视觉：60尺。',
    '邪魔遗赠：深渊、幽冥或炼狱选择待专用 schema。',
    '异界存在与遗赠法术为 prose-only，暂不接入施法自动化。',
  ]),
  makeSpecies2024('species.orc', '兽人', '兽人.htm', '追溯至独眼之神格乌什的族裔，强壮坚韧并能在黑暗中视物。', '中型', 30, [
    '激昂冲锋：附赠动作疾走与临时生命值，动作/资源流程待 schema。',
    '黑暗视觉：120尺。',
    '坚韧不屈：生命值降至 0 时的特殊处理待运行时自动化。',
  ]),
  makeSpecies2024('species.goliath', '歌利亚', '歌利亚.htm', '承载巨人先祖祝福的高大族裔，拥有来自不同巨人血系的超自然恩惠。', '中型', 35, [
    '巨人先祖：云、火、霜、山、石、岚等恩惠选择待专用 schema。',
    '大型形态：5级后体型与速度变化，效果待自动化。',
    '身强力壮：受擒检定与载重相关规则待运行时支持。',
  ]),
];

// TCoE 定制血统 (Custom Lineage) exists in the owner source
// (塔莎的万事坩埚/玩家选项/定制血统.htm) but is an optional rule, not a species
// entry; it is intentionally not added to the default list (needs-human-check).

export const DND_RACE_DATA_ACCURACY: RuleDataMetadata = {
  source: 'ai-assisted',
  trustLevel: 'ai-assisted-unverified',
  usagePolicy: 'quarantine',
  sourceNote:
    'Legacy 2014-model race/subrace/racial-ASI data retained for app continuity and old character display only. Quarantined by DND Background / Species Correction v1: no longer the default Creator list. Contains out-of-source entries (半精灵 / 半兽人 / 吉斯洋基人) and 2014 subraces; do not treat as verified owner-source data.',
};

export const LEGACY_RACE_DATA: RaceDef[] = [
  {
    name: "人类",
    desc: "作为最具适应性且最常见的种族，人类在长久的时间里塑造了丰富的历史和文明。",
    strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
    size: "中型", speed: 30, baseLanguages: ["通用语", "任选一种额外语言"],
    features: [
      "- 人类灵活（全属性+1 或 自选属性分配）",
      "- 获得一项额外技能熟练项"
    ],
    subraces: []
  },
  {
    name: "矮人",
    desc: "如同脚下的群山，矮人是一群非常坚定的、坚韧的种族。他们尊重传统并且拥有出色的手艺。",
    strBonus: 0, dexBonus: 0, conBonus: 2, intBonus: 0, wisBonus: 0, chaBonus: 0,
    size: "中型", speed: 25, baseLanguages: ["通用语", "矮人语"],
    features: [
      "- 黑暗视觉：昏暗光线下的视觉能力（60尺）",
      "- 矮人韧性：对毒素伤害有抗性，并且在对抗毒素的豁免检定中具有优势",
      "- 矮人战斗训练：擅长使用战斧、手斧、轻锤和战锤"
    ],
    subraces: [
      {
        name: "山丘矮人",
        desc: "山丘矮人有着沉稳的性格和更高的生命值上限，是优秀的战士与生存者。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 1, chaBonus: 0,
        features: ["- 矮人坚韧：你的生命值上限增加1，且每升一级都会额外增加1"]
      },
      {
        name: "盾矮人 (山地矮人)",
        desc: "盾矮人是顽强的战士体系，他们适应了困难地形及战斗，身强力壮。",
        strBonus: 2, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 护甲熟练：擅长轻甲和中甲"]
      },
      {
        name: "灰矮人",
        desc: "灰矮人是长期生活在幽暗地域的矮人，经过了灵吸怪的奴役和环境的异化。",
        strBonus: 1, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: [
          "- 高级黑暗视觉：可达120尺",
          "- 灰矮人魔法：天生施展变巨术和隐形术",
          "- 灰矮人韧性：对魅惑、震慑法术拥有抗性"
        ]
      }
    ]
  },
  {
    name: "精灵",
    desc: "精灵们置身于尘世以外且寿命极长，他们与魔法有着非同凡响的亲和力。",
    strBonus: 0, dexBonus: 2, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
    size: "中型", speed: 30, baseLanguages: ["通用语", "精灵语"],
    features: [
      "- 黑暗视觉：昏暗光线下的视觉能力（60尺）",
      "- 妖精血统：对抗魅惑时具有优势，且魔法无法让你陷入睡眠"
    ],
    subraces: [
      {
        name: "高等精灵",
        desc: "高等精灵天生拥有敏锐的头脑和对于魔法的精研。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 1, wisBonus: 0, chaBonus: 0,
        features: [
          "- 精灵武器训练：擅长长剑、短剑、短弓和长弓",
          "- 额外戏法：从法师法术列表中习得一个自选戏法"
        ]
      },
      {
        name: "木精灵",
        desc: "木精灵如同森林的阴影般的来去无踪，并学会了如何利用大自然来掩护自己。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 1, chaBonus: 0,
        speed: 35,
        features: [
          "- 精灵武器训练：擅长长剑、短剑、短弓和长弓",
          "- 迅捷步伐：基础移动速度增加5尺",
          "- 荒野面具：你可以利用轻微遮蔽物进行伪装"
        ]
      },
      {
        name: "卓尔",
        desc: "幽暗地域的精灵，卓尔精通各种潜行和诡术。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 1,
        features: [
          "- 卓尔武器训练：擅长细剑、短剑和手弩",
          "- 高级黑暗视觉：可达120尺",
          "- 卓尔魔法：天生学会舞光术"
        ]
      }
    ]
  },
  {
    name: "半身人",
    desc: "这群矮小的生物极注重家庭、和睦和安全，他们的内心充满着温暖与勇气。",
    strBonus: 0, dexBonus: 2, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
    size: "小型", speed: 25, baseLanguages: ["通用语", "半身人语"],
    features: [
      "- 幸运：当攻击、属性检定和豁免中掷出1时，可以重投",
      "- 勇敢：在对抗恐惧的豁免检定中具有优势",
      "- 半身人灵巧：可以穿过体型大于你生物所在的空间"
    ],
    subraces: [
      {
        name: "轻足半身人",
        desc: "生性极其隐秘而灵巧。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 1,
        features: ["- 天生水手/隐蔽：你在隐身中不易被察觉"]
      },
      {
        name: "壮心半身人",
        desc: "壮心半身人传说有矮人的血脉，具有抗压及抗毒能力。",
        strBonus: 0, dexBonus: 0, conBonus: 1, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 壮心韧性：对毒素伤害具有抗性"]
      }
    ]
  },
  {
    name: "龙裔",
    desc: "龙裔高大傲慢，流淌着远古龙族的血液，可以喷吐毁灭性的龙息。",
    strBonus: 2, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 1,
    size: "中型", speed: 30, baseLanguages: ["通用语", "龙语"],
    features: [
      "- 龙族先祖：选择不同血统决定龙息和伤害抗性类型",
      "- 龙息武器：可以吐出元素能量，对范围内的生物造成伤害",
      "- 伤害抗性：获得所选血统的能量伤害抗性"
    ],
    subraces: []
  },
  {
    name: "提夫林",
    desc: "由于他们祖先与九层地狱领主定下的契约，提夫林的血脉与地狱的联系始终纠缠不休。",
    strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 1, wisBonus: 0, chaBonus: 2,
    size: "中型", speed: 30, baseLanguages: ["通用语", "炼狱语"],
    features: [
      "- 黑暗视觉：昏暗光线下的视觉能力（60尺）",
      "- 地狱抗性：对火焰伤害有抗性",
      "- 炼狱魔法：习得奇术戏法；随后可学会炼狱叱喝或黑暗术等"
    ],
    subraces: [
      {
        name: "阿斯蒙蒂斯提夫林",
        desc: "奈瑟瑞尔大公的血脉。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 1, wisBonus: 0, chaBonus: 2,
        features: ["- 习得：奇术、地狱叱喝、黑暗术"]
      },
      {
        name: "梅菲斯特提夫林",
        desc: "地狱之主梅菲斯特的血脉。具备火焰与法师之手天赋。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 1, wisBonus: 0, chaBonus: 2,
        features: ["- 习得：法师之手、燃烧之手、炽热斩"]
      },
      {
        name: "扎瑞尔提夫林",
        desc: "堕落天使扎瑞尔的血统，具备着超强的武力破坏直觉。",
        strBonus: 1, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 2,
        features: ["- 习得：奇术、激愤斩、烙印斩"]
      }
    ]
  },
  {
    name: "半精灵",
    ruleMeta: {
      source: 'ai-assisted',
      trustLevel: 'out-of-source',
      usagePolicy: 'quarantine',
      sourceNote: '半精灵不在 DND 2024 玩家手册物种列表中（owner source 玩家手册2024/角色起源/种族 无此条目）；属 2014 模型遗留，隔离保留。',
    },
    desc: "融合了人类和精灵特点的生物，比精灵更坚韧并且比人类长寿。",
    strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 2,
    size: "中型", speed: 30, baseLanguages: ["通用语", "精灵语"],
    features: [
      "- 黑暗视觉：(60尺)",
      "- 妖精血统：对魅惑有优势，且魔法无法让你入睡"
    ],
    subraces: [
      {
        name: "高等半精灵",
        desc: "拥有高等精灵的魔法天赋。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 额外戏法：从法师法术中挑选一个"]
      },
      {
        name: "木半精灵",
        desc: "具备轻盈的移动速度和潜伏能力。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        speed: 35,
        features: ["- 荒野遮蔽能力", "- 更高的移动速度 (35尺)"]
      },
      {
        name: "卓尔半精灵",
        desc: "幽暗地域血脉。具有黑暗视觉天赋和魔法。",
        strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 卓尔魔法：舞光术"]
      }
    ]
  },
  {
    name: "半兽人",
    ruleMeta: {
      source: 'ai-assisted',
      trustLevel: 'out-of-source',
      usagePolicy: 'quarantine',
      sourceNote: '半兽人不在 DND 2024 玩家手册物种列表中（owner source 含独立的 兽人 物种条目）；属 2014 模型遗留，隔离保留。',
    },
    desc: "半兽人是兽人和人类的后代，体内澎湃的狂怒使得他们往往能够打出极为惊人的致命一击。",
    strBonus: 2, dexBonus: 0, conBonus: 1, intBonus: 0, wisBonus: 0, chaBonus: 0,
    size: "中型", speed: 30, baseLanguages: ["通用语", "兽人语"],
    features: [
      "- 黑暗视觉：(60尺)",
      "- 坚毅不屈：生命值降为0时可恢复至1(每长休1次)",
      "- 凶暴重击：一旦你的近战武器攻击产生重击，可额外增加一个伤害骰"
    ],
    subraces: []
  },
  {
    name: "侏儒",
    desc: "充满活力的探索者，身材矮小但对炼金术、工程学和各种新发明充满了无穷的兴趣。",
    strBonus: 0, dexBonus: 0, conBonus: 0, intBonus: 2, wisBonus: 0, chaBonus: 0,
    size: "小型", speed: 25, baseLanguages: ["通用语", "侏儒语"],
    features: [
      "- 侏儒狡黠：对基于智力、感知、魅力的魔法豁免具有优势"
    ],
    subraces: [
      {
        name: "岩儒人 (岩侏儒)",
        desc: "工匠的先驱者，常能打造出精密奇妙的机械装置。",
        strBonus: 0, dexBonus: 0, conBonus: 1, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 黑暗视觉 (60尺)", "- 奇妙发明家与工匠知识"]
      },
      {
        name: "森林侏儒",
        desc: "在隐秘森林中自由穿梭，善于幻术。",
        strBonus: 0, dexBonus: 1, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 黑暗视觉 (60尺)", "- 天生施展次级幻影", "- 可以与小型野兽交流"]
      },
      {
        name: "深侏儒",
        desc: "生活在幽暗地域的偏远角落。极其隐秘而善于躲避侵扰。",
        strBonus: 0, dexBonus: 1, conBonus: 0, intBonus: 0, wisBonus: 0, chaBonus: 0,
        features: ["- 高级黑暗视觉 (120尺)", "- 岩石伪装：在岩石地形中隐匿具优势"]
      }
    ]
  },
  {
    name: "吉斯洋基人",
    ruleMeta: {
      source: 'ai-assisted',
      trustLevel: 'out-of-source',
      usagePolicy: 'quarantine',
      sourceNote: '吉斯洋基人不在项目声明范围（DND 2024 + XGtE + TCoE）的 owner source 物种列表中；needs-human-check，隔离保留。',
    },
    desc: "自星界远道而来的虚空突击者。吉斯洋基人从小被训练成夺心魔猎手且毫不留情。",
    strBonus: 2, dexBonus: 0, conBonus: 0, intBonus: 1, wisBonus: 0, chaBonus: 0,
    size: "中型", speed: 30, baseLanguages: ["通用语", "吉斯语"],
    features: [
      "- 星界学识：长休后可选择熟练一种特定技能直到下次长休",
      "- 军事奇才：擅长轻甲、中甲及多种剑术",
      "- 吉斯洋基灵能：天生习得 法师之手、浮空术、迷踪步等幻术"
    ],
    subraces: []
  }
];

// Default species list consumed by Creator / Sheet via mod-utils.
// DND Background / Species Correction v1: defaults to the owner-source 2024
// species model; legacy 2014 data stays available via LEGACY_RACE_DATA.
export const RACE_DATA: RaceDef[] = DND_2024_SPECIES_DATA;
