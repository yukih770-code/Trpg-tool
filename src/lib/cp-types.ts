// ============================================================
// CYBERPUNK RED — Core Type Definitions & Data Constants
// ============================================================

// ─── Schema versioning ────────────────────────────────────────────────────────
// Bump this constant whenever a breaking field change is made to CpCharacter.
// migrateCpCharacter() in cpMigration.ts contains the corresponding upgrade
// logic for each version step.
//
// Changelog:
//   v1  Initial versioning (schemaVersion field added).
//   v2  Runtime state foundation for HP, Humanity, EMP, armor SP shell,
//       wound flags, and critical injury tracking.
export const CURRENT_CP_CHARACTER_SCHEMA_VERSION = 2;

export type CpStat =
  | 'INT' | 'REF' | 'DEX' | 'TECH' | 'COOL'
  | 'WILL' | 'MOVE' | 'BODY' | 'EMP' | 'LUCK';

export const CP_STAT_LABELS: Record<CpStat, string> = {
  INT: '智力 INT', REF: '反应 REF', DEX: '灵巧 DEX',
  TECH: '技术 TECH', COOL: '冷静 COOL', WILL: '意志 WILL',
  MOVE: '移动 MOVE', BODY: '体格 BODY', EMP: '共情 EMP', LUCK: '运气 LUCK',
};

export const CP_STAT_ORDER: CpStat[] = [
  'INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'MOVE', 'BODY', 'EMP', 'LUCK'
];

// ── Roles ─────────────────────────────────────────────────
export type CpRole =
  | 'Rockerboy' | 'Solo' | 'Netrunner' | 'Tech' | 'Medtech'
  | 'Media' | 'Exec' | 'Lawman' | 'Fixer' | 'Nomad';

export const CP_ROLES: CpRole[] = [
  'Rockerboy', 'Solo', 'Netrunner', 'Tech', 'Medtech',
  'Media', 'Exec', 'Lawman', 'Fixer', 'Nomad'
];

export const CP_ROLE_LABELS: Record<CpRole, string> = {
  Rockerboy: '摇滚小子', Solo: '佣兵', Netrunner: '网行者',
  Tech: '技工', Medtech: '技医', Media: '媒体人',
  Exec: '主管', Lawman: '执法者', Fixer: '中间人', Nomad: '游民',
};

// Exec is a "corporate" role — free apartment, not container
export const CP_EXEC_ROLES: CpRole[] = ['Exec'];

// ── Role Abilities ────────────────────────────────────────
export interface CpRoleAbility {
  name: string;
  stat: CpStat;
  description: string;
  levelEffects: Record<number, string>; // level 1-10 → effect description
}

export const CP_ROLE_ABILITIES: Record<CpRole, CpRoleAbility> = {
  Rockerboy: {
    name: '超凡魅力 Charismatic Impact',
    stat: 'COOL',
    description: '凭借音乐与魅力影响、煽动人群或个人，高等级可让目标忽视危险甚至转换立场。',
    levelEffects: {
      1: '可使 2 人暂时无视轻微危险',  2: '影响 4 人，持续效果翻倍',
      3: '可煽动最多 6 人',            4: '可令目标逃跑或暴动',
      5: '影响 10 人，DV降至 13',      6: '目标立场改变持续 1 小时',
      7: '影响整个小型人群',           8: '目标甚至会为你战斗',
      9: '可影响敌对武装组织',         10: '传奇级超凡魅力，全场皆为你所用',
    },
  },
  Solo: {
    name: '战斗意识 Combat Awareness',
    stat: 'INT',
    description: '将你的战斗经验转化为先天本能，提升先攻、闪避和伤害判定。',
    levelEffects: {
      1: '先攻 +1',                    2: '先攻 +2，闪避 +1',
      3: '先攻 +3，闪避 +2',           4: '先攻 +4，闪避 +3，可感知埋伏',
      5: '先攻 +5，闪避 +3，伤害 +1', 6: '先攻 +6，感知范围扩大至 30m',
      7: '先攻 +7，反击时可额外攻击',  8: '先攻 +8，任何武器伤害 +2',
      9: '先攻 +9，可预判敌方行动',    10: '传奇战士，先攻无限制，闪避 DV 降至 9',
    },
  },
  Netrunner: {
    name: '接口 Interface',
    stat: 'INT',
    description: '通过神经链接远程侵入、破坏或控制电子设备与 NET 架构节点。',
    levelEffects: {
      1: '可侵入简单设备（DV9）',       2: '可执行基础 NET 行动',
      3: '可侵入标准防火墙',            4: '可控制 2 个设备',
      5: '可遭遇 Black ICE 并存活',    6: '可安装持久后门',
      7: '可操控摄像头/炮台系统',      8: '可入侵企业内网',
      9: '可触碰深层 NET 架构',        10: '传奇黑客，任何加密对你无效',
    },
  },
  Tech: {
    name: '制造者 Maker',
    stat: 'TECH',
    description: '制造、维修、改装武器、装甲和义体——甚至可以临时搭建复杂装置。',
    levelEffects: {
      1: '可修理损坏的义体（DV13）',    2: '可升级武器 +1 伤害',
      3: '可制造简单炸弹或陷阱',        4: '可修改护甲 SP +2',
      5: '可从废料中制造武器/装甲',     6: '可永久改装义体',
      7: '可制造制式级武器',            8: '可制造重型武器或装甲',
      9: '可从零件拼装载具',            10: '传奇工匠，任何技术装置皆可制造',
    },
  },
  Medtech: {
    name: '医疗技术 Medicine',
    stat: 'TECH',
    description: '治疗伤亡、稳定濒死角色、安装/移除义体，并处理赛博精神病症状。',
    levelEffects: {
      1: '战场急救，恢复 1d6 HP',       2: '稳定濒死者（DV13）',
      3: '处理重伤状态',                 4: '可移除简单义体',
      5: '可安装标准义体',               6: '可治疗轻度赛博精神病',
      7: '可在战斗中为盟友治疗',         8: '可移植复杂义体',
      9: '可治疗中度赛博精神病',         10: '传奇医师，可逆转绝大多数伤亡',
    },
  },
  Media: {
    name: '公信力 Credibility',
    stat: 'COOL',
    description: '凭借媒体影响力获取信息、揭露真相，或让角色受到舆论保护。',
    levelEffects: {
      1: '小型独立媒体影响力',           2: '可在地方刊物发表稿件',
      3: '可向中型媒体出售报道',         4: '可向大型企业频道提交内容',
      5: '可保护信息来源免遭追查',       6: '可让一名目标成为舆论焦点',
      7: '企业需认真对待你的曝光威胁',   8: '可让整个组织声誉崩溃',
      9: '可在全球范围内传播信息',       10: '传奇媒体人，任何信息都逃不过你',
    },
  },
  Exec: {
    name: '团队作战 Teamwork',
    stat: 'COOL',
    description: '调用企业资源、指挥下属、获得物资支援或情报，体现管理层级优势。',
    levelEffects: {
      1: '可调用1名下属完成轻任务',      2: '可获得额外装备补贴',
      3: '可请求企业情报支援',           4: '可指挥小队行动',
      5: '可获得军用级装备支援',         6: '可申请无人机或载具支援',
      7: '可触发企业级保护协议',         8: '可调用10人以上特遣队',
      9: '可申请企业军事力量干预',       10: '传奇主管，整个企业听你调遣',
    },
  },
  Lawman: {
    name: '支援 Backup',
    stat: 'COOL',
    description: '请求执法机构增援：巡逻队、SWAT、情报查询，体现执法体系内的资源。',
    levelEffects: {
      1: '可通过无线电呼叫1名巡逻警察',  2: '可查询犯罪档案（DV13）',
      3: '可请求2名武装警察支援',        4: '可设立路障封锁区域',
      5: '可召唤 SWAT 小队',            6: '可获得军用装备临时授权',
      7: '可动用侦察无人机网络',         8: '可发动城市范围通缉',
      9: '可申请军事力量配合行动',       10: '传奇执法者，整个执法体系为你服务',
    },
  },
  Fixer: {
    name: '人脉网络 Operator',
    stat: 'COOL',
    description: '联系买家卖家、获取稀有物资、招募专家，或在黑市流通信息和货物。',
    levelEffects: {
      1: '可联系1名街头联系人',          2: '可以市价 -10% 购买装备',
      3: '可追踪稀有物资来源',           4: '可以市价 -20% 购买',
      5: '可联系专业雇佣兵',             6: '可获得机密情报',
      7: '可联系黑市军火商',             8: '可管理 5 个以上商业网络',
      9: '可渗透企业供应链',             10: '传奇掮客，任何物资都能找到',
    },
  },
  Nomad: {
    name: '摩托群落 Moto',
    stat: 'INT',
    description: '利用部落关系和驾驶技艺穿越荒野，为队伍提供载具支援和庇护所。',
    levelEffects: {
      1: '可呼叫1名部落成员帮忙',        2: '驾驶检定 +1',
      3: '可提供临时营地庇护',            4: '可安排部落载具运输',
      5: '驾驶检定 +2，可追踪目标',      6: '可获得部落军火和补给',
      7: '可动用 5 辆以上载具队伍',      8: '可在荒野中追踪任何目标',
      9: '可调动整个部落参战',            10: '传奇游牧者，整片荒野都是你的领地',
    },
  },
};

// ── Fashion / Clothing ────────────────────────────────────
export interface CpClothing {
  name: string;
  style: string;   // 风格标签
  cost: number;
  description: string;
}

export const CP_CLOTHING_LIST: CpClothing[] = [
  { name: '街头休闲装 Leisurewear',     style: '街头',  cost: 20,  description: '普通日常服装，融入大众毫无压力' },
  { name: '企业套装 Corporatewear',     style: '企业',  cost: 100, description: '令人信服的职业形象，企业区通行无阻' },
  { name: '都市闪光装 Urbanflash',      style: '霓虹',  cost: 50,  description: 'Night City 街头时尚，社交场合 +1 魅力印象' },
  { name: '摇滚装 Rockerwear',          style: '摇滚',  cost: 50,  description: '皮革与金属链，音乐圈自己人' },
  { name: '游牧服 Nomadwear',           style: '游牧',  cost: 30,  description: '耐磨耐候，荒野穿越首选' },
  { name: '军事迷彩 Militech',          style: '军事',  cost: 200, description: '仿军用涂装，威慑效果显著' },
  { name: '霓虹赛博装 Neon Cyberware Fashion', style: '赛博', cost: 150, description: '发光线条与义体饰板，黑暗中你就是广告牌' },
  { name: '高定礼服 High Fashion',      style: '高端',  cost: 500, description: '顶级时装，上流社会通行证' },
  { name: '隐形面料 Stealth Weave',     style: '战术',  cost: 300, description: '低反射涂层，潜行检定 +1' },
  { name: '医疗制服 Medtech Uniform',   style: '医疗',  cost: 80,  description: '急救人员通行证，战区中双方会暂时放行' },
];

// ── Skill Definitions ────────────────────────────────────
export interface CpSkillDef {
  name: string;
  linkedStat: CpStat;
  isDoubled: boolean; // (x2) costs 2 pts per level
  baseLevel: number;  // minimum starting level (base skills = 2)
  category: string;
}

export const CP_SKILLS: CpSkillDef[] = [
  // ── 感官类 ───────────────────────────────────────────────
  { name: '专注',           linkedStat: 'WILL', isDoubled: false, baseLevel: 2, category: '感官' },
  { name: '藏匿/搜寻物品', linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '感官' },
  { name: '唇语',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '感官' },
  { name: '察觉',           linkedStat: 'INT',  isDoubled: false, baseLevel: 2, category: '感官' },
  { name: '追踪',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '感官' },
  // ── 体魄类 ───────────────────────────────────────────────
  { name: '运动',           linkedStat: 'DEX',  isDoubled: false, baseLevel: 2, category: '体魄' },
  { name: '柔术',           linkedStat: 'DEX',  isDoubled: false, baseLevel: 0, category: '体魄' },
  { name: '舞蹈',           linkedStat: 'DEX',  isDoubled: false, baseLevel: 0, category: '体魄' },
  { name: '忍耐',           linkedStat: 'WILL', isDoubled: false, baseLevel: 0, category: '体魄' },
  { name: '抵抗拷问/药物', linkedStat: 'WILL', isDoubled: false, baseLevel: 0, category: '体魄' },
  { name: '潜行',           linkedStat: 'DEX',  isDoubled: false, baseLevel: 2, category: '体魄' },
  // ── 操控类 ───────────────────────────────────────────────
  { name: '驾驶地面载具',   linkedStat: 'REF',  isDoubled: false, baseLevel: 0, category: '操控' },
  { name: '驾驶飞行载具',   linkedStat: 'REF',  isDoubled: true,  baseLevel: 0, category: '操控' },
  { name: '驾驶水上载具',   linkedStat: 'REF',  isDoubled: false, baseLevel: 0, category: '操控' },
  { name: '骑乘',           linkedStat: 'REF',  isDoubled: false, baseLevel: 0, category: '操控' },
  // ── 教育类 ───────────────────────────────────────────────
  { name: '会计',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '驯兽',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '官僚世故',       linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '商业',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '创作',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '犯罪学',         linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '密码学',         linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '推理',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '通识',           linkedStat: 'INT',  isDoubled: false, baseLevel: 2, category: '教育' },
  { name: '赌博',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '图书馆搜索',     linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '科学',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '战术',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '野外生存',       linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '教育' },
  { name: '街头俚语',       linkedStat: 'INT',  isDoubled: false, baseLevel: 2, category: '教育' },
  { name: '口语表达',       linkedStat: 'INT',  isDoubled: false, baseLevel: 4, category: '教育' }, // 文化母语
  { name: '你的家',         linkedStat: 'INT',  isDoubled: false, baseLevel: 2, category: '教育' },
  { name: '地方专家',       linkedStat: 'INT',  isDoubled: false, baseLevel: 2, category: '教育' },
  // ── 战斗类 ───────────────────────────────────────────────
  { name: '徒手搏斗',       linkedStat: 'DEX',  isDoubled: false, baseLevel: 2, category: '战斗' },
  { name: '闪避',           linkedStat: 'DEX',  isDoubled: false, baseLevel: 2, category: '战斗' },
  { name: '武术',           linkedStat: 'DEX',  isDoubled: true,  baseLevel: 0, category: '战斗' },
  { name: '近战武器',       linkedStat: 'DEX',  isDoubled: false, baseLevel: 0, category: '战斗' },
  // ── 表演类 ───────────────────────────────────────────────
  { name: '扮演',           linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '表演' },
  { name: '乐器演奏',       linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '表演' },
  // ── 远程武器类 ──────────────────────────────────────────
  { name: '弓术',           linkedStat: 'REF',  isDoubled: false, baseLevel: 0, category: '远程武器' },
  { name: '自动射击',       linkedStat: 'REF',  isDoubled: true,  baseLevel: 0, category: '远程武器' },
  { name: '手枪',           linkedStat: 'REF',  isDoubled: false, baseLevel: 0, category: '远程武器' },
  { name: '重武器',         linkedStat: 'REF',  isDoubled: true,  baseLevel: 0, category: '远程武器' },
  { name: '抵肩枪械',       linkedStat: 'REF',  isDoubled: false, baseLevel: 0, category: '远程武器' },
  // ── 社交类 ───────────────────────────────────────────────
  { name: '贿赂',           linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '社交' },
  { name: '交谈',           linkedStat: 'EMP',  isDoubled: false, baseLevel: 2, category: '社交' },
  { name: '察言观色',       linkedStat: 'EMP',  isDoubled: false, baseLevel: 2, category: '社交' },
  { name: '审讯',           linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '社交' },
  { name: '说服',           linkedStat: 'COOL', isDoubled: false, baseLevel: 2, category: '社交' },
  { name: '个人仪容',       linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '社交' },
  { name: '街头智慧',       linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '社交' },
  { name: '交易',           linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '社交' },
  { name: '服饰与风格',     linkedStat: 'COOL', isDoubled: false, baseLevel: 0, category: '社交' },
  // ── 技术类 ───────────────────────────────────────────────
  { name: '空中载具技术',   linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '基础技术',       linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '赛博技术',       linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '爆破学',         linkedStat: 'TECH', isDoubled: true,  baseLevel: 0, category: '技术' },
  { name: '电子/安全技术',  linkedStat: 'TECH', isDoubled: true,  baseLevel: 0, category: '技术' },
  { name: '急救',           linkedStat: 'TECH', isDoubled: false, baseLevel: 2, category: '技术' },
  { name: '医疗',           linkedStat: 'TECH', isDoubled: true,  baseLevel: 0, category: '技术' },
  { name: '伪造',           linkedStat: 'INT',  isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '地面载具技术',   linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '绘画/雕刻/速写', linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '摄影/摄像',      linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '开锁',           linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '扒窃',           linkedStat: 'DEX',  isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '海洋载具技术',   linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
  { name: '武器技术',       linkedStat: 'TECH', isDoubled: false, baseLevel: 0, category: '技术' },
];

// Skills that are part of the immutable base floor (always ≥ 2 unless unlocked)
export const CP_BASE_SKILL_NAMES = new Set<string>(
  CP_SKILLS.filter(s => s.baseLevel >= 2).map(s => s.name)
);

// ── Armor ─────────────────────────────────────────────────
export interface CpArmor {
  name: string;
  sp: number;
  location: 'body' | 'head';
  refPenalty: number; // also applies to DEX and MOVE
  cost: number;
}

export const CP_ARMOR_LIST: CpArmor[] = [
  { name: '皮衣 Leather Jacket',          sp: 4,  location: 'body', refPenalty: 0, cost: 100 },
  { name: '凯夫拉 Kevlar',                sp: 7,  location: 'body', refPenalty: 0, cost: 500 },
  { name: '轻型护甲夹克 Light Armorjack', sp: 11, location: 'body', refPenalty: 0, cost: 1000 },
  { name: '中型护甲夹克 Medium Armorjack',sp: 12, location: 'body', refPenalty: 2, cost: 1500 },
  { name: '重型护甲夹克 Heavy Armorjack', sp: 13, location: 'body', refPenalty: 2, cost: 2000 },
  { name: '防弹衣 Flak',                  sp: 15, location: 'body', refPenalty: 4, cost: 5000 },
  { name: '合金装备 MetalGear',           sp: 18, location: 'body', refPenalty: 4, cost: 10000 },
  { name: '轻型头盔 Light Helmet',        sp: 11, location: 'head', refPenalty: 0, cost: 100 },
  { name: '重型头盔 Heavy Helmet',        sp: 13, location: 'head', refPenalty: 2, cost: 1000 },
];

// ── Cyberware ─────────────────────────────────────────────
export interface CpCyberware {
  name: string;
  humanityCost: number;
  cost: number;
  description: string;
}

export const CP_CYBERWARE_LIST: CpCyberware[] = [
  { name: '神经链接 Neuralware',       humanityCost: 7,  cost: 500,  description: '基础神经接口，赛博组件的必要前提' },
  { name: '克伦齐科夫 Kerenzikov',    humanityCost: 14, cost: 500,  description: '反应加速义体，允许在初始化前行动' },
  { name: '骨骼网格 Skin/Bone Weave', humanityCost: 14, cost: 1000, description: '皮下合金纤维，+2 SP 护甲（全身）' },
  { name: '肌肉/骨骼增强 Muscle Booster', humanityCost: 14, cost: 1000, description: '+2 BODY（已纳入属性扣减）' },
  { name: '赛博眼 Cyberoptic',        humanityCost: 7,  cost: 500,  description: '含1项选配（低光/热成像/放大）' },
  { name: '赛博耳 Cyberaudio',        humanityCost: 7,  cost: 500,  description: '含1项选配（雷达/通讯）' },
  { name: '赛博手臂 Cyberarm',        humanityCost: 21, cost: 500,  description: '义肢手臂，内含秘密武器槽' },
  { name: '赛博腿 Cyberleg',          humanityCost: 14, cost: 500,  description: '义肢腿，+6 MOVE或跳跃能力' },
  { name: '纳米机器 Nanotech',        humanityCost: 7,  cost: 1000, description: '血液净化/加速愈合' },
  { name: '微波数据链路 MicroWave Link', humanityCost: 7, cost: 500, description: '无线传输数据接口' },
];

// ── Weapons ───────────────────────────────────────────────
export interface CpWeapon {
  name: string;
  damage: string; // e.g. "2d6"
  skill: string;
  rof: number;    // rate of fire
  cost: number;
}

export const CP_WEAPON_LIST: CpWeapon[] = [
  { name: '轻型手枪 Light Pistol',      damage: '2d6',  skill: '手枪 Handgun',      rof: 2, cost: 100 },
  { name: '中型手枪 Medium Pistol',     damage: '2d6',  skill: '手枪 Handgun',      rof: 2, cost: 500 },
  { name: '重型手枪 Heavy Pistol',      damage: '3d6',  skill: '手枪 Handgun',      rof: 2, cost: 100 },
  { name: '霰弹枪 Shotgun',             damage: '5d6',  skill: '抵肩枪械 Shoulder Arms', rof: 1, cost: 500 },
  { name: '突击步枪 Assault Rifle',     damage: '5d6',  skill: '抵肩枪械 Shoulder Arms', rof: 1, cost: 1000 },
  { name: '狙击步枪 Sniper Rifle',      damage: '5d6',  skill: '抵肩枪械 Shoulder Arms', rof: 1, cost: 1000 },
  { name: 'SMG 冲锋枪',                 damage: '2d6',  skill: '自动射击 Autofire', rof: 1, cost: 500 },
  { name: '重型机枪 Heavy Machinegun',  damage: '5d6',  skill: '重型武器 Heavy Weapons', rof: 1, cost: 2000 },
  { name: '单刃 Monoknife',             damage: '1d6',  skill: '近战武器 Melee Weapons', rof: 2, cost: 50 },
  { name: '重型刀 Heavy Melee',         damage: '3d6',  skill: '近战武器 Melee Weapons', rof: 2, cost: 100 },
];

// ── Life Path ─────────────────────────────────────────────
export interface CpLifePath {
  handle: string;             // 外号 / 江湖名
  hometown: string;           // 故乡
  livingStandard: string;     // 居住水平
  monthlySpending: number;    // 月花销 (eb)
  clothingStyle: string;      // 穿着风格
  hairstyle: string;          // 发型
  affectation: string;        // 特有装饰/特征
  motivation: string;         // 你对世界最重视的是什么（生存动机）
  personality: string;        // 个性来源
  originsFamily: string;      // 家庭出身
  childhoodEnv: string;       // 童年环境
  childhoodHero: string;      // 少年时的英雄
  lifeEvent1: string;         // 生命事件 1
  lifeEvent2: string;         // 生命事件 2
  careerPath: string;         // 近年事业经历/自述
}

// ── Relationships ─────────────────────────────────────────
export interface CpRelation {
  name: string;           // 联系人姓名
  description: string;    // 关系背景描述
  myFeeling: string;      // 你对他/她的感情
  theirFeeling: string;   // 他/她对你的感情
}

export interface CpEnemy {
  name: string;
  cause: string;          // 结仇原因
  myFeelings: string;     // 你对他的感情
  theirFeelings: string;  // 他对你的感情
  resource: string;       // 他拥有的资源
  plan: string;           // 他对你的打算
}

// ── Inventory (owned but not equipped/installed) ──────────
export interface CpInventory {
  cyberware: CpCyberware[];
  weapons:   CpWeapon[];
  armor:     CpArmor[];
  fashion:   CpClothing[];
  gear:      string[];   // misc item names
}

export function makeEmptyInventory(): CpInventory {
  return { cyberware: [], weapons: [], armor: [], fashion: [], gear: [] };
}

// ── Runtime State ──────────────────────────────────────────
export interface CpRuntimeState {
  hp: {
    current: number;
    max: number;
  };
  humanity: {
    current: number;
    max: number;
  };
  emp: {
    current: number;
    max: number;
  };
  armor?: {
    head?: {
      currentSp: number;
      maxSp: number;
    };
    body?: {
      currentSp: number;
      maxSp: number;
    };
  };
  flags: {
    isSeriouslyWounded: boolean;
    isMortallyWounded: boolean;
  };
  criticalInjuries: string[];
}

// ── CP Character ──────────────────────────────────────────
export interface CpCharacter {
  /** Schema version — absent on pre-v1 saves (treated as version 0 by migration). */
  schemaVersion: number;
  id: string;
  name: string;
  player: string;
  role: CpRole;
  age: number;
  gender: string;

  // 10 stats, each 2-8
  stats: Record<CpStat, number>;

  // Derived (computed, stored for save/display)
  maxHp: number;
  seriouslyWounded: number; // ceil(maxHp/2)
  deathSave: number;        // = BODY
  maxHumanity: number;      // = EMP × 10

  // Current tracked values
  hp: { current: number; max: number };
  humanity: { current: number; max: number };

  // Runtime state foundation. Optional for old saves; migration fills it.
  runtime?: CpRuntimeState;

  // Skills: name → level
  skills: Record<string, number>;

  // Armor equipped (null = none)
  armorBody: CpArmor | null;
  armorHead: CpArmor | null;

  // Cyberware installed
  cyberware: CpCyberware[];

  // Weapons
  weapons: CpWeapon[];

  // Resources
  eb: number;           // eurobucks
  fashionEb: number;    // fashion allowance (auto-void unused)

  // Role ability level (forced 4 at creation)
  roleLevel: number;

  // Housing state
  housing: string;

  // Notes
  notes: string;

  // Clothing equipped (can have multiple)
  clothing: CpClothing[];

  // Tracked injuries (name of injury)
  injuries: string[];

  // Cyberpsycho flag (computed, locked when humanity ≤ 0)
  cyberPsycho?: boolean;

  // Inventory: all items owned but not currently equipped/installed
  inventory: CpInventory;

  // Life path (optional, filled during creation or later)
  lifePath?: CpLifePath;

  // Relationship network
  friends: CpRelation[];
  romances: CpRelation[];
  enemies: CpEnemy[];
}

// ── DV Table ──────────────────────────────────────────────
export const CP_DV_TABLE = [
  { label: '简单 (Simple)',        dv: 9 },
  { label: '日常 (Everyday)',      dv: 13 },
  { label: '困难 (Difficult)',     dv: 15 },
  { label: '专业 (Professional)',  dv: 17 },
  { label: '英勇 (Heroic)',        dv: 21 },
  { label: '难以置信 (Incredible)', dv: 24 },
  { label: '传奇 (Legendary)',     dv: 29 },
] as const;

// ── Critical Injury Tables (2d6) ─────────────────────────
// 触发条件：攻击骰中2颗或以上骰子掷出最大值（如2d6中两颗都掷出6）
// 额外效果：+5 直接 HP 伤害（无视护甲）
// 头部表仅在攻击方宣告瞄准头部（-8命中惩罚）时使用

export interface CpCritInjury {
  roll: number;  // 2d6 result (2–12)
  name: string;
  effect: string;
  quickFix?: string;     // 战场处理（若有）
  treatmentDV?: number;  // 正式治疗 DV
}

export const CP_CRIT_INJURIES_BODY: CpCritInjury[] = [
  {
    roll: 2,
    name: '骨骼粉碎 Dismembered Arm',
    effect: '失去一条手臂。该臂所有行动无法进行，每轮出血 2 HP。',
    quickFix: '止血带：止血但手臂仍废',
    treatmentDV: 17,
  },
  {
    roll: 3,
    name: '失去一只眼 Lost Eye',
    effect: '失去一只眼。知觉/察觉检定 -4，射程武器攻击 -4。',
    quickFix: '无',
    treatmentDV: 17,
  },
  {
    roll: 4,
    name: '肋骨骨折 Cracked Ribs',
    effect: '每次移动行动额外承受 1 点伤害（无视护甲）。',
    quickFix: '急救 DV13 可暂止出血',
    treatmentDV: 13,
  },
  {
    roll: 5,
    name: '外来异物 Foreign Object',
    effect: '有异物卡在体内，每轮轮末承受 1 点伤害（无视护甲）。',
    quickFix: '急救 DV13 可取出',
    treatmentDV: 13,
  },
  {
    roll: 6,
    name: '断腿 Broken Leg',
    effect: 'MOVE 减半（向下取整），跳跃/跑步检定 -4。',
    quickFix: '夹板固定 DV13',
    treatmentDV: 13,
  },
  {
    roll: 7,
    name: '脊椎受损 Spinal Injury',
    effect: 'MOVE -4，无法奔跑。若再次受到严重伤害则瘫痪（GM裁定）。',
    quickFix: '无',
    treatmentDV: 17,
  },
  {
    roll: 8,
    name: '肺部刺穿 Punctured Lung',
    effect: '每次行动（非待机）额外 1 HP 伤害；无法奔跑。',
    quickFix: '急救 DV15 稳定',
    treatmentDV: 15,
  },
  {
    roll: 9,
    name: '断臂 Dismembered Hand',
    effect: '失去一只手。无法双持，无法用该手做任何事，每轮出血 1 HP。',
    quickFix: '止血带止血',
    treatmentDV: 17,
  },
  {
    roll: 10,
    name: '内伤 Torn Muscle',
    effect: '该部位所有力量/灵巧检定 -2，持续至治疗。',
    quickFix: '急救 DV13 减轻',
    treatmentDV: 13,
  },
  {
    roll: 11,
    name: '多处骨折 Collapsed Lung',
    effect: '每轮轮末承受 2 HP 伤害（无视护甲），无法奔跑或大声说话。',
    quickFix: '急救 DV17 稳定',
    treatmentDV: 17,
  },
  {
    roll: 12,
    name: '心脏损伤 Heart Damage',
    effect: '立即进行死亡豁免检定（BODY + 1d10 对抗 DV15）。失败则立死。',
    quickFix: '急救 DV17 稳定（仍需豁免）',
    treatmentDV: 17,
  },
];

export const CP_CRIT_INJURIES_HEAD: CpCritInjury[] = [
  {
    roll: 2,
    name: '毁容 Ugly Scar',
    effect: '面部永久性伤疤，所有社交检定 -2（除恐吓外）。',
    quickFix: '无（需整容）',
    treatmentDV: 15,
  },
  {
    roll: 3,
    name: '失去耳朵 Lost Ear',
    effect: '失去一只耳朵，听觉检定 -4，侦测偷袭 -4。',
    quickFix: '无',
    treatmentDV: 15,
  },
  {
    roll: 4,
    name: '颈部伤 Cracked Skull',
    effect: '无法使用语音命令/语言行动。所有INT检定 -2，持续至治疗。',
    quickFix: '急救 DV13 缓解',
    treatmentDV: 13,
  },
  {
    roll: 5,
    name: '脑震荡 Concussion',
    effect: '所有检定 -2，持续1完整场景（或治疗后）。',
    quickFix: '急救 DV13 缩短至1轮',
    treatmentDV: 13,
  },
  {
    roll: 6,
    name: '眼部受伤 Damaged Eye',
    effect: '知觉/察觉检定 -4，射程武器攻击 -2。',
    quickFix: '急救 DV13 止血',
    treatmentDV: 15,
  },
  {
    roll: 7,
    name: '碎颅 Foreign Object (Head)',
    effect: '有异物卡在头部，每轮承受 1 HP 伤害，INT检定 -2。',
    quickFix: '急救 DV15 取出',
    treatmentDV: 15,
  },
  {
    roll: 8,
    name: '颚骨骨折 Broken Jaw',
    effect: '无法说话，所有交谈/说服/审讯检定自动失败。',
    quickFix: '急救 DV13 暂时处理',
    treatmentDV: 13,
  },
  {
    roll: 9,
    name: '失去一只眼 Lost Eye',
    effect: '永久失去一只眼。知觉 -4，所有远程攻击 -4。',
    quickFix: '无（需赛博眼替换）',
    treatmentDV: 17,
  },
  {
    roll: 10,
    name: '耳鸣 Damaged Ear',
    effect: '所有基于听觉的检定 -4，先攻 -2，持续至治疗。',
    quickFix: '急救 DV13',
    treatmentDV: 13,
  },
  {
    roll: 11,
    name: '脑部损伤 Brain Injury',
    effect: 'INT 和 COOL 各 -2，持续至医疗治疗（DV17）。',
    quickFix: '无',
    treatmentDV: 17,
  },
  {
    roll: 12,
    name: '颅脑重创 Massive Head Trauma',
    effect: '立即进行死亡豁免（BODY + 1d10 对抗 DV17）。失败则立死；成功则昏迷直至治疗。',
    quickFix: '急救 DV17 维持生命',
    treatmentDV: 17,
  },
];
