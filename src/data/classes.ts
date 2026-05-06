import { ClassDef } from '../lib/dnd-types';

export const CLASS_DATA: ClassDef[] = [
  {
    name: "野蛮人",
    desc: "绝强的战士，他们与多元宇宙原初之力联结，凭借狂暴之力撕裂敌人",
    primaryAbility: "Str",
    savingThrows: ["Str", "Con"],
    hitDice: "D12",
    weaponProficiencies: ["简易武器", "军用武器"],
    armorProficiencies: ["轻甲", "中甲", "盾牌"],
    startingEquipment: "巨斧 或 任意军用近战武器, 两把手斧 或 任意简易武器, 探索者套件, 4根标枪",
    features: [
      { name: "狂暴", desc: "附赠动作激活，未穿重甲可用，获得钝击/穿刺/挥砍抗性，力量攻击附加伤害", unlockLevel: 1 },
      { name: "无甲防御", desc: "未穿护甲时AC=10+敏捷调整值+体质调整值，可持盾", unlockLevel: 1 }
    ],
    subclasses: [
      { name: "狂战士", desc: "以心头强烈的愤怒进入狂暴，于混乱战斗中兴奋忘我。可使用狂乱打击和愤怒投掷。", unlockLevel: 3, features: [{ name: "狂怒", desc: "狂暴期间可使用附赠动作进行近战或投掷攻击。", unlockLevel: 3 }] },
      { name: "荒蛮之心", desc: "与动物之灵缔结羁绊。可选择动物之心来增强能力。", unlockLevel: 3, features: [{ name: "兽心特质", desc: "可选择熊、鹰、麋鹿、虎或狼之蛮力面貌。", unlockLevel: 3 }] },
      { name: "狂野魔法", desc: "你体内的狂暴沸腾着古老的魔法，引发不可控的爆发。", unlockLevel: 3, features: [{ name: "狂野魔法狂暴", desc: "每次进入狂暴都会随机触发奇特的魔法效果。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "吟游诗人",
    desc: "以音乐、舞蹈和魔法激励人心的表演家，用歌谣与圣言残响唤起魔法。",
    primaryAbility: "Cha",
    savingThrows: ["Dex", "Cha"],
    hitDice: "D8",
    weaponProficiencies: ["简易武器", "手弩", "长剑", "细剑", "短剑"],
    armorProficiencies: ["轻甲"],
    startingEquipment: "细剑 或 长剑 或 任意简易武器, 外交官套件 或 艺人套件, 乐器, 皮甲, 匕首",
    features: [
      { name: "施法", desc: "你学会戏法和一环法术，魅力为你的施法属性，可使用乐器作为法器。", unlockLevel: 1 },
      { name: "诗人激励", desc: "附赠动作授予60尺内生物诗人骰（d6），其检定失败可附加", unlockLevel: 1 }
    ],
    subclasses: [
      { name: "逸闻学院", desc: "收集轶闻传说获取魔法技能。", unlockLevel: 3, features: [{ name: "语出惊人", desc: "消耗诗人激励降低敌人的攻击或技能检定。", unlockLevel: 3 }] },
      { name: "勇气学院", desc: "传承英雄故事并化身战场激励者。", unlockLevel: 3, features: [{ name: "战斗激励", desc: "诗人激励可用于增加目标的伤害或防御(AC)。", unlockLevel: 3 }, { name: "中甲与军用武器熟练", desc: "掌握中甲、盾牌与全部军武。", unlockLevel: 3 }] },
      { name: "剑刃学院", desc: "将华丽的剑术融入表演的致命舞者。", unlockLevel: 3, features: [{ name: "剑刃华尔兹", desc: "通过消耗诗人激励即可发动华丽的近战攻击与移动。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "法师",
    desc: "极致钻研魔法结构奥秘的学者，能够翻动多元宇宙的面纱。",
    primaryAbility: "Int",
    savingThrows: ["Int", "Wis"],
    hitDice: "D6",
    weaponProficiencies: ["匕首", "飞镖", "投石索", "长棍", "轻弩"],
    armorProficiencies: [],
    startingEquipment: "长棍 或 匕首, 材料包 或 奥术法器, 学者套件 或 探索者套件, 法术书",
    features: [
      { name: "施法", desc: "准备法术书里的法术，智力为施法属性", unlockLevel: 1 },
      { name: "奥术回能", desc: "短休恢复一定法术位（不超过法师等级的一半）", unlockLevel: 1 }
    ],
    subclasses: [
      { name: "防护学派", desc: "精于护盾与防卫的法师。", unlockLevel: 2, features: [{ name: "奥术守御", desc: "施法时能编织一层护盾保护自己。", unlockLevel: 2 }] },
      { name: "咒法学派", desc: "精巧塑造物质与召唤生物。", unlockLevel: 2, features: [{ name: "次级咒法", desc: "可以凭空召唤无生命物品或水。", unlockLevel: 2 }] },
      { name: "预言学派", desc: "占卜未来以干预现实的先知。", unlockLevel: 2, features: [{ name: "预兆", desc: "长休后记录2个D20骰子数值，用以替代任意攻击/豁免结果。", unlockLevel: 2 }] },
      { name: "附魔学派", desc: "操控心智与魅惑法术的大师。", unlockLevel: 2, features: [{ name: "催眠凝视", desc: "消耗动作迷住身边距离内的生物。", unlockLevel: 2 }] },
      { name: "塑能学派", desc: "用火焰寒冰闪电轰炸的破坏者。", unlockLevel: 2, features: [{ name: "法术塑形", desc: "施展范围伤害法术时友军能免于受难。", unlockLevel: 2 }] },
      { name: "死灵学派", desc: "掌控生与死的边缘边界。", unlockLevel: 2, features: [{ name: "死神收割", desc: "用死灵法术杀死敌人时获得生命恢复。", unlockLevel: 2 }] },
      { name: "幻术学派", desc: "玩弄虚假视听掩人耳目。", unlockLevel: 2, features: [{ name: "进阶幻象", desc: "幻象魔法变得极为生动自如。", unlockLevel: 2 }] },
      { name: "变化学派", desc: "将事物本源性质强行捏改。", unlockLevel: 2, features: [{ name: "炼金石", desc: "利用魔法转化药水和临时材质状态。", unlockLevel: 2 }] }
    ]
  },
  {
    name: "牧师",
    desc: "神明的代理人，在凡间展现神力。",
    primaryAbility: "Wis",
    savingThrows: ["Wis", "Cha"],
    hitDice: "D8",
    weaponProficiencies: ["简易武器"],
    armorProficiencies: ["轻甲", "中甲", "盾牌"],
    startingEquipment: "硬头锤, 鳞甲/皮甲/链甲衣, 轻弩与20支弩矢, 牧师套件, 盾牌, 圣徽",
    features: [
      { name: "施法", desc: "感知为施法属性，准备领域法术与牧师法术表。", unlockLevel: 1 },
      { name: "引导神力", desc: "消耗引导神力次数，使用驱散亡灵或你的领域特有能力。", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "生命领域", desc: "专注恢复，保护盟友。", unlockLevel: 1, features: [{ name: "生命门徒", desc: "你的治疗法术获得显着加强，精通重甲。", unlockLevel: 1 }] },
      { name: "光明领域", desc: "施展火与光的严惩惩戒。", unlockLevel: 1, features: [{ name: "守御闪光", desc: "在被攻击时致盲敌人，使其极难击中你。", unlockLevel: 1 }] },
      { name: "自然领域", desc: "受荒野保护的代行牧师。", unlockLevel: 1, features: [{ name: "自然神术", desc: "掌握德鲁伊法术，精通重甲及多种自然生存技能。", unlockLevel: 1 }] },
      { name: "风暴领域", desc: "掌握暴风与闪电。", unlockLevel: 1, features: [{ name: "风暴之怒", desc: "被近战击中时利用雷电元素反击，精通军用武器与重甲。", unlockLevel: 1 }] },
      { name: "诡术领域", desc: "信仰欺诈或暗影的神明。", unlockLevel: 1, features: [{ name: "神圣祝福", desc: "为盟友带来潜行优势，获得强大的伪装与欺瞒法术。", unlockLevel: 1 }] },
      { name: "战争领域", desc: "信仰战争与荣誉。", unlockLevel: 1, features: [{ name: "战争祭司", desc: "利用附赠动作可发动额外的武器攻击，精通军武与重甲。", unlockLevel: 1 }] },
      { name: "知识领域", desc: "尊崇求知与学识之神。", unlockLevel: 1, features: [{ name: "知识的赐福", desc: "掌握多国语言并且加倍对应两项学识技能熟练加值。", unlockLevel: 1 }] }
    ]
  },
  {
    name: "战士",
    desc: "各类护甲武器的大师，战场上的无畏精英。",
    primaryAbility: "Str",
    savingThrows: ["Str", "Con"],
    hitDice: "D10",
    weaponProficiencies: ["简易武器", "军用武器"],
    armorProficiencies: ["轻甲", "中甲", "重甲", "盾牌"],
    startingEquipment: "锁子甲 或 皮革甲(中甲), 任意军用武器并配小盾 或 两把军用武器, 轻弩与20支弩矢 或两把手斧",
    features: [
      { name: "战斗风格", desc: "如箭术、防御、对决、巨武等，带来特定的战斗加值。", unlockLevel: 1 },
      { name: "回气", desc: "附赠动作恢复 1d10+战士等级 的生命值，短休充能。", unlockLevel: 1 },
      { name: "动作如风", desc: "在回合中获得一次额外动作，短休充能。", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "冠军武士", desc: "极简的终极战士。", unlockLevel: 3, features: [{ name: "精进重击", desc: "武器攻击只要掷出19就算重大暴击。", unlockLevel: 3 }] },
      { name: "战斗大师", desc: "掌握极具战术素养的卓越战技。", unlockLevel: 3, features: [{ name: "卓越体势", desc: "学会使用卓越骰来增伤并附加推离、击倒、反击等特效。", unlockLevel: 3 }] },
      { name: "奥法骑士", desc: "融合了奥术施法基础的重甲法师。", unlockLevel: 3, features: [{ name: "初级奥术", desc: "学会防护及塑能学派的部分法师法术。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "游荡者",
    desc: "使用隐匿技巧与各种技巧克服障碍、制敌机先的战术家。",
    primaryAbility: "Dex",
    savingThrows: ["Dex", "Int"],
    hitDice: "D8",
    weaponProficiencies: ["简易武器", "手弩", "长剑", "细剑", "短剑"],
    armorProficiencies: ["轻甲"],
    startingEquipment: "细剑 或 短剑, 短弓及20支箭 或 短剑, 盗贼套件, 盗贼工具, 皮甲, 两把匕首",
    features: [
      { name: "近身偷袭", desc: "用灵巧或远战武器攻击处于劣势防御或有盟友包夹的敌人时，附带巨大偷袭伤害。", unlockLevel: 1 },
      { name: "灵巧动作", desc: "使用附赠动作进行隐蔽、冲刺和撤离", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "盗贼", desc: "灵巧爬高下低的潜伏者。", unlockLevel: 3, features: [{ name: "快手", desc: "你可以用附赠动作利用物件，例如喝药和布置陷阱。", unlockLevel: 3 }] },
      { name: "刺客", desc: "冷血制导杀手。", unlockLevel: 3, features: [{ name: "刺杀术", desc: "你对于还没开始回合或者受惊吓的敌人具有决定性的重击优势。", unlockLevel: 3 }] },
      { name: "奥法诡术师", desc: "具备幻术魔力的阴影潜伏流氓。", unlockLevel: 3, features: [{ name: "高阶法师之手", desc: "在原本的偷摸技巧里添加隐形的法师之手法术配合实施偷窃与开锁。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "圣武士",
    desc: "立下神圣誓言的神圣斗士，持坚盾斩邪魔。",
    primaryAbility: "Str",
    savingThrows: ["Wis", "Cha"],
    hitDice: "D10",
    weaponProficiencies: ["简易武器", "军用武器"],
    armorProficiencies: ["轻甲", "中甲", "重甲", "盾牌"],
    startingEquipment: "任意军用近战武器与盾牌 或 两把军用近战武器, 5根标枪 或 任意简单近战武器, 祭司/探索者套件, 链甲, 圣徽",
    features: [
      { name: "神圣感知", desc: "侦测周围神圣或邪恶存在。", unlockLevel: 1 },
      { name: "圣疗", desc: "可使用圣疗给友军赋予相当庞大的恢复治疗量。", unlockLevel: 1 },
      { name: "至圣斩", desc: "近战命中后灌注法术力对敌方摧毁光发伤害。", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "奉献之誓", desc: "坚守光与正义的白骑士。", unlockLevel: 3, features: [{ name: "神圣武器", desc: "为武具附上神圣威力极大幅度增强命中并照明。", unlockLevel: 3 }] },
      { name: "古贤之誓", desc: "崇尚自然生命循环的骑士保护者。", unlockLevel: 3, features: [{ name: "被守护之愿", desc: "用以神力禁锢锁死敌人。", unlockLevel: 3 }] },
      { name: "复仇之誓", desc: "对极罪之人施加怒火审判。", unlockLevel: 3, features: [{ name: "憎恶宣扬", desc: "对单独一名重罪之人施加极强的命中锁定优势。", unlockLevel: 3 }] },
      { name: "破誓者", desc: "违反大义而坠入黑暗禁地的幽冥之刃。", unlockLevel: 3, features: [{ name: "引导神力：苦痛", desc: "施加让敌人退怯并极具威吓折磨的能力。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "游侠",
    desc: "荒野中的猎手，自然和位面边缘前线的守卫者。",
    primaryAbility: "Dex",
    savingThrows: ["Str", "Dex"],
    hitDice: "D10",
    weaponProficiencies: ["简易武器", "军用武器"],
    armorProficiencies: ["轻甲", "中甲", "盾牌"],
    startingEquipment: "鳞甲 或 皮甲, 两把短剑 或 两把简易近战武器, 探险者套件, 长弓及20支箭",
    features: [
      { name: "宿敌与地势探索", desc: "掌握特定针对的怪族克星语言或者具备对应环境绝佳优势。", unlockLevel: 1 },
      { name: "游侠法术与战斗", desc: "可以掌握多项战斗体系（箭术防御）及初级的低级法术。", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "猎人", desc: "针对怪兽群进行特制狩猎技术。", unlockLevel: 3, features: [{ name: "猎人猎物", desc: "对巨大怪物或者大规模群体目标能发挥极强力清杀优势。", unlockLevel: 3 }] },
      { name: "驯兽师", desc: "荒野伴侣随从者。", unlockLevel: 3, features: [{ name: "动物伙伴", desc: "拥有狼熊野猪等常伴身边共同击败强敌，且随等级增强同步成长。", unlockLevel: 3 }] },
      { name: "幽域追踪者", desc: "暗影首个回合夺命死神者。", unlockLevel: 3, features: [{ name: "幽域伏击", desc: "掌握高级黑视并且在进入战斗的头一个回合获得极大力度的额外一击和爆发速度与伤害。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "邪术师",
    desc: "与超自然灵体签署契约，从而换取力量者。",
    primaryAbility: "Cha",
    savingThrows: ["Wis", "Cha"],
    hitDice: "D8",
    weaponProficiencies: ["简易武器"],
    armorProficiencies: ["轻甲"],
    startingEquipment: "轻弩和20支附箭 或 任意单简兵器, 构件包/法器, 学者/探索者包, 皮革甲与简单兵器, 两把手斧",
    features: [
      { name: "契约魔力法", desc: "短休即可一次性恢复全部法术（一直处于高品阶段）且掌控魔能祈唤被动。", unlockLevel: 1 },
      { name: "魔能祈唤", desc: "解锁可强化攻击（如强力魔能爆）或无消耗特法。", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "邪魔", desc: "地狱杀戮魔神契约。", unlockLevel: 1, features: [{ name: "黑暗恩主", desc: "将对手杀亡的血气回聚为额外血盾附加至己方生命护身符里。", unlockLevel: 1 }] },
      { name: "旧日支配者", desc: "不可直视扭曲的触手克总魔使。", unlockLevel: 1, features: [{ name: "深坑心智掌控", desc: "免疫被窥视同时让看到你的对手产生极具恐怖的发颠阻吓作用", unlockLevel: 1 }] },
      { name: "妖精", desc: "沉睡幻游梦境精灵代行者。", unlockLevel: 1, features: [{ name: "精魂迷幻", desc: "受袭自走潜隐虚空逃离并将周围一切幻惑控制。", unlockLevel: 1 }] }
    ]
  },
  {
    name: "武僧",
    desc: "徒手与身体磨练结合的武术战法，擅长借力与移动限制。",
    primaryAbility: "Dex",
    savingThrows: ["Str", "Dex"],
    hitDice: "D8",
    weaponProficiencies: ["简易武器", "短剑"],
    armorProficiencies: [],
    startingEquipment: "短剑 或 任意简单兵器, 探索者套件 或 地下城套件, 10支飞镖",
    features: [
      { name: "无甲高疾", desc: "不穿衣甲即可得惊人高超防御兼高挪移极速身法", unlockLevel: 1 },
      { name: "武术气力", desc: "用以极大量短休补充气池接连出拳或是接放暗箭连避攻击", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "散打宗", desc: "徒手肉推拳控制流。", unlockLevel: 3, features: [{ name: "散打开背", desc: "可以在施展疾风三连时额外带上强制剥夺反应或者推移数尺摔倒。", unlockLevel: 3 }] },
      { name: "暗影宗", desc: "忍冬刺客形隐秘大师。", unlockLevel: 3, features: [{ name: "影踪迷步", desc: "消耗气能散布大范围阴影并在暗影处顺身跳转如履平地。", unlockLevel: 3 }] },
      { name: "四象宗", desc: "控火流水御风神功者。", unlockLevel: 3, features: [{ name: "四大元素之式", desc: "直接运用真气放出犹如火焰拳或是引力推波的大宗秘招。", unlockLevel: 3 }] }
    ]
  },
  {
    name: "德鲁伊",
    desc: "以古老荒野意志掌控自然、变身野兽的施法者。",
    primaryAbility: "Wis",
    savingThrows: ["Int", "Wis"],
    hitDice: "D8",
    weaponProficiencies: ["棍棒", "匕首", "飞镖", "标枪", "锤子", "弯刀", "镰刀", "投石索", "长矛"],
    armorProficiencies: ["轻甲", "中甲", "盾牌（不能是金属）"],
    startingEquipment: "木盾 或 任意简单武器, 弯刀 或 任意简易近战武器, 皮甲, 探索者套件 和 德鲁伊法器",
    features: [
      { name: "荒野施法", desc: "用自身共鸣来指引导发力法。", unlockLevel: 1 },
      { name: "荒野变化", desc: "把自己从普通人形随心化作各色野外动物。", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "大地结社", desc: "专精自然界元素和地脉恢复者。", unlockLevel: 2, features: [{ name: "额外魔法池修养", desc: "短休恢复极数法术，且掌握更多专有荒野地脉大范围魔法。", unlockLevel: 2 }] },
      { name: "月亮结社", desc: "极致狂暴变形肉搏巨怪德师。", unlockLevel: 2, features: [{ name: "高级月之德鲁伊化", desc: "化身强大极巨的猛兽且可以直接变成近战机器大魔熊打斗。", unlockLevel: 2 }] },
      { name: "孢子结社", desc: "操纵致命毒雾生杀活死的真菌神派。", unlockLevel: 2, features: [{ name: "共生孢子", desc: "释放强力防御真菌加附武器之并拉起僵尸兵队。", unlockLevel: 2 }] }
    ]
  },
  {
    name: "术士",
    desc: "拥有罕见魔法天赋的血脉觉醒者，力量发自内心无需研习书卷。",
    primaryAbility: "Cha",
    savingThrows: ["Con", "Cha"],
    hitDice: "D6",
    weaponProficiencies: ["匕首", "飞镖", "投石索", "长棍", "轻弩"],
    armorProficiencies: [],
    startingEquipment: "轻弩和二十个或简单武器手弩， 奥法聚焦器 或 一套材料,地下城套/者包, 两支刃",
    features: [
      { name: "魔法泉涌与超魔", desc: "自身转换魔力源强行重改施法的目标与法位极速瞬发.", unlockLevel: 2 }
    ],
    subclasses: [
      { name: "龙族血脉", desc: "龙神之血提供高厚的身版及高等防御抵抗。", unlockLevel: 1, features: [{ name: "龙族亲和", desc: "高抗高甲加上极对应属性元素的加重打击增伤。", unlockLevel: 1 }] },
      { name: "狂野魔法", desc: "波动不可控施法时会附带极端突发狂野大爆现特效者。", unlockLevel: 1, features: [{ name: "狂野扭转控制", desc: "每次都有高超突发或者有利重转的奇迹可能。", unlockLevel: 1 }] },
      { name: "风暴术士", desc: "于天顶惊雷狂风降下落雷神灵。", unlockLevel: 1, features: [{ name: "气旋神速", desc: "释放神力引发风暴时无伤瞬速后退脱出控制领域。", unlockLevel: 1 }] }
    ]
  }
];
