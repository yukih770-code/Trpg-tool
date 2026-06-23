/**
 * DND 2024 background starter casual outfits (世界内常服).
 *
 * AI-LANDMARK: DND_CASUAL_OUTFITS_V1
 *
 * Per-background "casual outfit" templates: in-world clothing that expresses a
 * character's identity, social class, occasion-fit and visibility in NON-combat
 * settings. v1 has NO rule bonuses — descriptive / social labels only, for later
 * use by GM / story / social scenes. Content transcribed from the design spec
 * (user-provided), not invented rules. No "RP" wording, no fourth-wall breaks;
 * outfits never expose a hidden identity (e.g. the Criminal outfit reads as a
 * plain low-profile city look).
 */

export interface CasualOutfitSlots {
  head?: string;
  outer?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  accessory?: string;
  undergarment?: string;
  special?: string;
}

export interface DndCasualOutfit {
  /** Background Chinese name used for lookup (matches character.background). */
  backgroundCn: string;
  name: string;
  identity: string;
  occasions: string;
  visibility: string;
  credibility: string;
  concealment: string;
  environment: string;
  ruleImpact: string;
  slots: CasualOutfitSlots;
  description: string;
}

export const DND_CASUAL_OUTFITS: DndCasualOutfit[] = [
  {
    backgroundCn: '侍僧',
    name: '朴素祭礼长袍',
    identity: '神殿侍从、修行者、宗教随行人员',
    occasions: '神殿、修道院、仪式场合、城镇街道',
    visibility: '普通',
    credibility: '庄重、朴素',
    concealment: '不适合隐藏宗教身份',
    environment: '城市、神殿',
    ruleImpact: '无',
    slots: { head: '朴素头巾（可选）', outer: '祭礼外袍', top: '素色长衣', bottom: '长袍下摆', shoes: '简单软鞋', accessory: '圣徽或祈祷绳', undergarment: '普通贴身衣物', special: '小型经文袋（可选）' },
    description: '一套剪裁朴素的长袍，颜色接近某个神殿或宗教传统的常用仪式色。衣料不算昂贵，但保持整洁，袖口和领边带有简单的宗教纹样。旁人容易将穿着者视为与神殿、教团或宗教事务有关的人。',
  },
  {
    backgroundCn: '警卫',
    name: '城镇守卫便装',
    identity: '守卫、巡逻人员、受过训练的执勤者',
    occasions: '城门、军营、街道、治安岗哨、酒馆',
    visibility: '普通',
    credibility: '专业、可靠',
    concealment: '普通，不刻意隐藏身份',
    environment: '城市、军营',
    ruleImpact: '无',
    slots: { head: '无或简单帽兜', outer: '短外套', top: '耐磨衬衣', bottom: '实用长裤', shoes: '硬底靴', accessory: '守卫徽记或腰牌（可选）', undergarment: '普通贴身衣物', special: '宽皮带、钥匙环或哨子（可选）' },
    description: '一套结实耐磨的便装，带有守卫常用的皮带、护腕和硬底靴。它不像正式制服那样醒目，却仍能从站姿、腰带和靴子的磨损中看出穿着者熟悉巡逻、看守和维持秩序的生活。',
  },
  {
    backgroundCn: '水手',
    name: '海风旧水手服',
    identity: '水手、码头熟人、船员',
    occasions: '港口、船只、酒馆、码头市场',
    visibility: '普通',
    credibility: '朴素、实用',
    concealment: '适合混入港口人群',
    environment: '海上、港口、雨天',
    ruleImpact: '无',
    slots: { head: '水手帽或头巾', outer: '防风短外套', top: '宽松水手衫', bottom: '便于活动的长裤', shoes: '防滑旧靴', accessory: '绳结护符或小型海图筒（可选）', undergarment: '普通贴身衣物', special: '防水布袋（可选）' },
    description: '一套被海风和盐分磨旧的水手衣，布料结实，袖口便于卷起，靴子适合湿滑甲板。它不会显得体面，却很容易让码头、船只和海边酒馆里的人觉得你属于这一带的生活。',
  },
  {
    backgroundCn: '工匠',
    name: '工坊围裙便服',
    identity: '工匠、手艺人、学徒、修理者',
    occasions: '工坊、集市、商铺、城镇街道',
    visibility: '普通',
    credibility: '专业、实用',
    concealment: '普通',
    environment: '城市、工坊',
    ruleImpact: '无',
    slots: { head: '头巾或无', outer: '工作围裙', top: '耐磨工作衫', bottom: '结实长裤', shoes: '厚底工作鞋', accessory: '无或行会徽记', undergarment: '普通贴身衣物', special: '工具挂带' },
    description: '一套耐磨的工作便服，外搭有工具痕迹的围裙。袖口、腰带和口袋都为实际劳作而设计，衣料上可能留有木屑、金属粉、染料或皮革油的痕迹。旁人容易认为穿着者懂得某种手艺，而不是单纯的闲人。',
  },
  {
    backgroundCn: '向导',
    name: '荒野引路装',
    identity: '旅人、向导、猎径熟手、野外随行者',
    occasions: '荒野、村镇、驿站、山路、林地',
    visibility: '低调',
    credibility: '实用、可靠',
    concealment: '便于融入旅人和猎人群体',
    environment: '荒野、寒冷、雨天',
    ruleImpact: '无',
    slots: { head: '兜帽或宽檐帽', outer: '旅行斗篷', top: '耐磨旅衣', bottom: '结实长裤', shoes: '长途靴', accessory: '无', undergarment: '普通贴身衣物', special: '路标绳、地图筒或小型指南袋' },
    description: '一套适合长途跋涉的旅行服，外层披风能挡风，靴子适合泥路和碎石。衣物上有多处修补痕迹，却都处理得结实可靠。它让人觉得穿着者熟悉道路、天气和荒野中的危险。',
  },
  {
    backgroundCn: '抄写员',
    name: '墨迹书记长衣',
    identity: '书记员、文书、学徒、档案馆工作人员',
    occasions: '学院、书房、官署、神殿、商会',
    visibility: '普通',
    credibility: '专业、体面',
    concealment: '普通',
    environment: '城市、学院',
    ruleImpact: '无',
    slots: { head: '无或简洁软帽', outer: '书记长衣', top: '整洁内衬', bottom: '普通长裤或长袍下摆', shoes: '室内软鞋', accessory: '墨水瓶吊坠或文书徽记（可选）', undergarment: '普通贴身衣物', special: '文具袋、卷轴筒' },
    description: '一套整洁但不奢华的长衣，袖口常有洗不净的墨迹，腰间可挂小型文具袋或卷轴筒。它让旁人容易把穿着者与书写、账册、档案、契约或学术事务联系起来。',
  },
  {
    backgroundCn: '骗子',
    name: '体面旅行外衣',
    identity: '商旅、游说者、体面过客、江湖人物',
    occasions: '酒馆、集市、街巷、旅店、宴会边缘场合',
    visibility: '略醒目',
    credibility: '体面但未必可靠',
    concealment: '便于变换身份印象',
    environment: '城市、旅行',
    ruleImpact: '无',
    slots: { head: '礼帽或旅行帽', outer: '体面外衣', top: '修饰得当的衬衣', bottom: '整洁长裤', shoes: '保养过的皮鞋', accessory: '假徽记、戒指或小型挂饰（可选）', undergarment: '普通贴身衣物', special: '暗袋、纸牌袋或小瓶袋' },
    description: '一套看起来体面的旅行外衣，颜色和剪裁恰到好处，不至于过分昂贵，却足以让人愿意多听几句话。衣袋、袖口和腰带处有些巧妙的小设计，方便携带信物、纸牌、小瓶或其他不适合摆在明面上的东西。',
  },
  {
    backgroundCn: '隐士',
    name: '修补粗布隐居服',
    identity: '隐居者、苦修者、山林住民、远离城市的人',
    occasions: '荒野、修道院、偏僻村庄、山地道路',
    visibility: '低调',
    credibility: '朴素、古怪',
    concealment: '适合远离人群，不适合上流场合',
    environment: '荒野、寒冷',
    ruleImpact: '无',
    slots: { head: '粗布兜帽', outer: '修补披布', top: '粗布长衣', bottom: '宽松旧裤或长袍下摆', shoes: '旧草鞋或简易皮鞋', accessory: '无或小型护符', undergarment: '普通贴身衣物', special: '草药袋或木珠串（可选）' },
    description: '一套多次修补过的粗布服装，材料简单，颜色接近泥土、树皮或灰石。它不追求体面，却足够耐穿。旁人可能觉得穿着者长久生活在荒野、山林、修道院或某个远离尘世的地方。',
  },
  {
    backgroundCn: '士兵',
    name: '旧军旅便装',
    identity: '退伍士兵、佣兵、军营出身者、受过纪律训练的人',
    occasions: '军营、城镇、酒馆、边境哨所、佣兵营地',
    visibility: '普通',
    credibility: '专业、可靠',
    concealment: '普通，不刻意隐藏军旅痕迹',
    environment: '军营、旅行、荒野',
    ruleImpact: '无',
    slots: { head: '无或旧军帽', outer: '军用披风', top: '旧制服上衣', bottom: '军裤', shoes: '军靴', accessory: '军牌、徽章或旧绶带（可选）', undergarment: '普通贴身衣物', special: '宽皮带或行军扣带' },
    description: '一套磨旧但保养良好的军旅便装，靴子、腰带和外套都有长期行军的痕迹。它不像正式军服那样表明所属，但穿着者的衣着习惯仍会让旁人觉得其曾受过训练，或至少熟悉纪律和危险。',
  },
  {
    backgroundCn: '罪犯',
    name: '低调街巷便服',
    identity: '普通市民、街头熟客、码头过客',
    occasions: '街巷、酒馆、港口、夜间市场',
    visibility: '低调',
    credibility: '普通，略可疑',
    concealment: '便于混入人群、便于隐藏身份',
    environment: '城市',
    ruleImpact: '无',
    slots: { head: '兜帽（可选）', outer: '深色外套', top: '旧衬衣', bottom: '耐磨长裤', shoes: '软底靴', accessory: '无', undergarment: '普通贴身衣物', special: '隐蔽腰带或暗袋' },
    description: '一套不起眼的深色便服，布料耐磨，便于活动。它不会主动透露穿着者的来历，也不容易让旁人留下深刻印象。袖口、腰带和衣摆的设计适合快速行动，却不会在明面上显得异常。',
  },
  {
    backgroundCn: '商人',
    name: '体面商旅装',
    identity: '商人、账房、行会成员、旅行买卖人',
    occasions: '集市、商会、港口、酒馆、城镇街道',
    visibility: '普通',
    credibility: '体面、务实',
    concealment: '普通',
    environment: '城市、港口、旅行',
    ruleImpact: '无',
    slots: { head: '商旅帽（可选）', outer: '体面外套', top: '整洁衬衣', bottom: '实用长裤', shoes: '旅行皮鞋', accessory: '行会徽记、戒指或账册扣（可选）', undergarment: '普通贴身衣物', special: '钱袋、账册袋或样品袋' },
    description: '一套体面但不浮夸的商旅装，衣料质量良好，腰间可挂账册袋、小钱袋或行会标识。它让人觉得穿着者熟悉交易、货物、价码和城镇规矩，也不至于像贵族礼服那样招摇。',
  },
  {
    backgroundCn: '流浪者',
    name: '尘路旅行装',
    identity: '旅人、流浪者、远行者、无固定居所的人',
    occasions: '道路、驿站、村镇、荒野边缘、酒馆',
    visibility: '低调',
    credibility: '朴素、破旧',
    concealment: '便于混入旅人和贫民人群',
    environment: '旅行、荒野、雨天',
    ruleImpact: '无',
    slots: { head: '旧兜帽或布帽', outer: '尘土披风', top: '旧旅衣', bottom: '磨旧长裤', shoes: '破旧旅行靴', accessory: '无', undergarment: '普通贴身衣物', special: '小包袱或缝补袋' },
    description: '一套沾着尘土的旅行服，披风和靴子都经历过长路。衣物并不体面，却实用、耐穿，适合在道路、村镇和城门之间辗转。旁人可能觉得穿着者见过许多地方，却未必知道其真正来历。',
  },
  {
    backgroundCn: '艺人',
    name: '巡演舞台服',
    identity: '艺人、乐师、演员、讲故事的人',
    occasions: '剧场、酒馆、宴会、街头表演、节庆',
    visibility: '醒目',
    credibility: '体面但活跃',
    concealment: '不适合隐藏身份',
    environment: '城市、剧场、宴会',
    ruleImpact: '无',
    slots: { head: '装饰帽或发饰', outer: '鲜艳披肩', top: '演出上衣', bottom: '演出裤或长裙', shoes: '软底鞋', accessory: '舞台饰品', undergarment: '普通贴身衣物', special: '表演用小饰件（可选）' },
    description: '一套带有舞台感的巡演服，颜色比普通衣物更鲜明，饰边和披肩便于在灯火下显眼。它并不一定昂贵，但足以让旁人将穿着者看作乐师、演员、舞者、说书人或其他靠表演谋生的人。',
  },
  {
    backgroundCn: '贵族',
    name: '精致礼仪常服',
    identity: '贵族、上流人士、受过礼仪教育的人',
    occasions: '宴会、贵族宅邸、官署、神殿仪式、上流社交',
    visibility: '华丽',
    credibility: '体面、庄重',
    concealment: '不适合隐藏身份',
    environment: '城市、宴会',
    ruleImpact: '无',
    slots: { head: '礼帽、发饰或精致头饰', outer: '高质量外套', top: '礼服上衣', bottom: '礼裤或长裙', shoes: '精致皮鞋', accessory: '戒指、项链或家族饰物', undergarment: '高质量贴身衣物', special: '家徽饰件（可选）' },
    description: '一套剪裁讲究的精致常服，布料、饰边和配件都暗示着良好的出身与社会地位。它容易让人觉得穿着者熟悉礼仪和上流场合，但也更容易在人群中被注意到。',
  },
  {
    backgroundCn: '农民',
    name: '田野粗布便服',
    identity: '农民、乡民、劳作者、村庄居民',
    occasions: '村庄、农田、集市、乡间道路',
    visibility: '低调',
    credibility: '朴素、可靠',
    concealment: '适合融入乡村和劳工人群',
    environment: '荒野、乡村、雨天',
    ruleImpact: '无',
    slots: { head: '草帽或布帽', outer: '粗布外衣', top: '耐磨布衣', bottom: '宽松长裤', shoes: '泥地鞋或旧靴', accessory: '无', undergarment: '普通贴身衣物', special: '布腰带或小型种子袋（可选）' },
    description: '一套结实的粗布衣，颜色朴素，方便弯腰、搬运和长时间劳作。衣料上可能有泥土、草屑或修补痕迹。它让旁人觉得穿着者熟悉土地、牲畜、季节和村庄生活。',
  },
  {
    backgroundCn: '智者',
    name: '朴素学者袍',
    identity: '学者、教师、法师学徒、学院成员',
    occasions: '学院、书房、图书馆、神殿、贵族顾问场合',
    visibility: '普通',
    credibility: '专业、体面',
    concealment: '普通',
    environment: '城市、学院',
    ruleImpact: '无',
    slots: { head: '无或简洁软帽', outer: '学者长袍', top: '朴素内衬', bottom: '普通长裤或长袍下摆', shoes: '旧皮鞋', accessory: '学院徽记、书签链或小型护符（可选）', undergarment: '普通贴身衣物', special: '书袋、卷轴筒或墨水袋' },
    description: '一套朴素而整洁的学者袍，袖口和衣摆便于伏案书写，腰间可挂书袋或卷轴筒。它不会显得富贵，却会让旁人觉得穿着者受过教育，熟悉书本、学问、法术理论或古老记载。',
  },
];

const byBackground = new Map<string, DndCasualOutfit>(
  DND_CASUAL_OUTFITS.map((o) => [o.backgroundCn, o] as const),
);

/** Look up a background's starter casual outfit (by Chinese background name). */
export function getDndCasualOutfit(backgroundCn: string | undefined): DndCasualOutfit | undefined {
  if (!backgroundCn) return undefined;
  const key = backgroundCn.trim();
  return byBackground.get(key) ?? DND_CASUAL_OUTFITS.find((o) => key.includes(o.backgroundCn));
}

export const CASUAL_OUTFIT_SLOT_LABELS: Record<keyof CasualOutfitSlots, string> = {
  head: '头部',
  outer: '外层',
  top: '上衣',
  bottom: '下装',
  shoes: '鞋履',
  accessory: '饰品',
  undergarment: '贴身',
  special: '特殊',
};
export const CASUAL_OUTFIT_SLOT_ORDER: (keyof CasualOutfitSlots)[] = [
  'head', 'outer', 'top', 'bottom', 'shoes', 'accessory', 'undergarment', 'special',
];

// ── Outfit system boundary types (v1, read-only) ────────────────────────────
// An OutfitTemplate / OutfitSnapshot is world-flavor appearance data. It is NOT
// an ItemDefinition and NOT an InventoryItem, and it never enters the backpack.
// v1 is a read-only snapshot derived from the background template.

export type OutfitSlotKey = keyof CasualOutfitSlots;

/** A single descriptive outfit slot (read-only). */
export interface OutfitSlot {
  key: OutfitSlotKey;
  label: string;
  value?: string;
}

/** The per-background starter outfit template (alias of the casual outfit data). */
export type OutfitTemplate = DndCasualOutfit;

/** A character's current outfit, derived from a template (no item instances). */
export interface OutfitSnapshot {
  templateBackground: string;
  name: string;
  identity: string;
  ruleImpact: string;
  slots: OutfitSlot[];
}

/** Build a read-only snapshot from a template. Does NOT create inventory items. */
export function buildOutfitSnapshot(template: OutfitTemplate): OutfitSnapshot {
  return {
    templateBackground: template.backgroundCn,
    name: template.name,
    identity: template.identity,
    ruleImpact: template.ruleImpact,
    slots: CASUAL_OUTFIT_SLOT_ORDER.filter((k) => template.slots[k]).map((k) => ({
      key: k,
      label: CASUAL_OUTFIT_SLOT_LABELS[k],
      value: template.slots[k],
    })),
  };
}
