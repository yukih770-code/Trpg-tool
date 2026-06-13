/**
 * DND 2024 Character Options Source Index (display-only)
 *
 * AI-LANDMARK: DND_CHARACTER_OPTIONS_SOURCE_COMPLETION
 *
 * Source-labeled indexes for backgrounds / feats / equipment transcribed from
 * `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`.
 *
 * Index contract:
 * - Entries record EXISTENCE and source location only. Rule effects, tables,
 *   and unconfirmed fields are NOT filled (needs-human-check).
 * - These indexes are SEPARATE from runtime data (BACKGROUND_DATA,
 *   FEATS_DATA, DND_EQUIPMENT_CATALOG) and are not wired into Creator /
 *   Sheet / Gameplay runtime.
 * - The owner manifest records feat and equipment sources at CATEGORY-FILE
 *   level only; individual feat/equipment rows are intentionally not
 *   fabricated here.
 * - Artificer is source-indexed here only. It is intentionally NOT promoted
 *   into CLASS_DATA until progression, spellcasting, infusions, and subclass
 *   runtime support are verified.
 */

import type { RuleDataMetadata } from '../../lib/rules/rule-data-metadata';

const MANIFEST_REF = 'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md';
const PENDING_DESC = '该条目已定位来源，具体规则效果待核对。';

export interface DndOptionIndexEntry {
  id: string;
  nameCn: string;
  nameEn?: string;
  scope: 'dnd2024' | 'xgte' | 'tcoe';
  sourceFile: string;
  extractionStatus: 'found' | 'partial';
  desc: string;
  notes?: string;
}

// ── Classes (source-indexed only; not runtime CLASS_DATA) ────────────────────

export const DND_CLASS_INDEX_ACCURACY: RuleDataMetadata = {
  source: 'dnd5echm-tcoe',
  trustLevel: 'source-labeled',
  usagePolicy: 'display-only',
  sourceRef: `${MANIFEST_REF}#item-奇械师`,
  sourceNote:
    'Artificer / 奇械师 is source-indexed from TCoE. Runtime support is deferred because classProgression, spellcasting, infusions, and subclass features require follow-up verification.',
};

// AI-LANDMARK: DND_ARTIFICER_SOURCE_COMPLETION
export const DND_2024_CLASS_INDEX_DATA: DndOptionIndexEntry[] = [
  {
    id: 'class-index.artificer',
    nameCn: '奇械师',
    nameEn: 'Artificer',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师.html',
    extractionStatus: 'found',
    desc: PENDING_DESC,
    notes:
      'TCoE class source located. Runtime support deferred: classProgression / spellcasting / infusions / subclass features require follow-up verification.',
  },
];

export const DND_2024_ARTIFICER_SUPPORT_INDEX_DATA: DndOptionIndexEntry[] = [
  {
    id: 'class-index.artificer-spell-list',
    nameCn: '奇械师法术列表',
    nameEn: 'Artificer Spell List',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师/奇械师法术列表.html',
    extractionStatus: 'partial',
    desc: PENDING_DESC,
    notes: 'Class support source path recorded; spell list contents are not extracted or wired into runtime.',
  },
  {
    id: 'class-index.artificer-infusions',
    nameCn: '奇械师注法',
    nameEn: 'Artificer Infusions',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师/奇械师注法.html',
    extractionStatus: 'partial',
    desc: PENDING_DESC,
    notes: 'Class support source path recorded; infusion mechanics are not extracted or automated.',
  },
  {
    id: 'class-index.artificer-alchemist',
    nameCn: '炼金师',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师/炼金师.html',
    extractionStatus: 'found',
    desc: PENDING_DESC,
    notes: 'Artificer subclass source located; subclass features are not extracted or automated.',
  },
  {
    id: 'class-index.artificer-artillerist',
    nameCn: '魔炮师',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师/魔炮师.html',
    extractionStatus: 'found',
    desc: PENDING_DESC,
    notes: 'Artificer subclass source located; subclass features are not extracted or automated.',
  },
  {
    id: 'class-index.artificer-battle-smith',
    nameCn: '战地匠师',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师/战地匠师.html',
    extractionStatus: 'found',
    desc: PENDING_DESC,
    notes: 'Artificer subclass source located; subclass features are not extracted or automated.',
  },
  {
    id: 'class-index.artificer-armorer',
    nameCn: '装甲师',
    scope: 'tcoe',
    sourceFile: '塔莎的万事坩埚/玩家选项/职业/奇械师/装甲师.html',
    extractionStatus: 'found',
    desc: PENDING_DESC,
    notes: 'Artificer subclass source located; subclass features are not extracted or automated.',
  },
];

// ── Backgrounds (角色起源/背景) ───────────────────────────────────────────────

export const DND_BACKGROUND_INDEX_ACCURACY: RuleDataMetadata = {
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'display-only',
  sourceRef: `${MANIFEST_REF}#item-entries`,
  sourceNote:
    'Owner source confirms exactly 4 SRD5.2 background pages plus one XGtE life-building overview. The runtime BACKGROUND_DATA already covers all 4 confirmed entries; ability options / origin feats / proficiencies remain needs-human-check.',
};

export const DND_2024_BACKGROUND_INDEX_DATA: DndOptionIndexEntry[] = [
  { id: 'bg-index.acolyte', nameCn: '侍僧', scope: 'dnd2024', sourceFile: '玩家手册2024/角色起源/背景/侍僧.htm', extractionStatus: 'found', desc: PENDING_DESC },
  { id: 'bg-index.soldier', nameCn: '士兵', scope: 'dnd2024', sourceFile: '玩家手册2024/角色起源/背景/士兵.htm', extractionStatus: 'found', desc: PENDING_DESC },
  { id: 'bg-index.sage', nameCn: '智者', scope: 'dnd2024', sourceFile: '玩家手册2024/角色起源/背景/智者.htm', extractionStatus: 'found', desc: PENDING_DESC },
  { id: 'bg-index.criminal', nameCn: '罪犯', scope: 'dnd2024', sourceFile: '玩家手册2024/角色起源/背景/罪犯.htm', extractionStatus: 'found', desc: PENDING_DESC },
  { id: 'bg-index.xgte-this-is-your-life', nameCn: '构建角色生平', scope: 'xgte', sourceFile: '珊娜萨的万事指南/角色选项/构建角色生平.html', extractionStatus: 'partial', desc: PENDING_DESC, notes: 'XGtE 角色生平构建工具页，非标准背景条目；needs-human-check。' },
];

// ── Feats (专长来源文件级索引) ────────────────────────────────────────────────

export const DND_FEAT_INDEX_ACCURACY: RuleDataMetadata = {
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'display-only',
  sourceRef: `${MANIFEST_REF}#ambiguous--needs-human-check`,
  sourceNote:
    'The owner manifest records feat sources at category-file level (extractionStatus: partial). Individual feat rows require a later table/heading extraction pass and are NOT fabricated here. Runtime FEATS_DATA (16 entries) remains ai-assisted pending that pass.',
};

export const DND_2024_FEAT_INDEX_DATA: DndOptionIndexEntry[] = [
  { id: 'feat-index.origin', nameCn: '起源专长', scope: 'dnd2024', sourceFile: '玩家手册2024/专长/起源专长.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '类别文件；单条专长待提取。' },
  { id: 'feat-index.general', nameCn: '通用专长', scope: 'dnd2024', sourceFile: '玩家手册2024/专长/通用专长.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '类别文件；单条专长待提取。' },
  { id: 'feat-index.fighting-style', nameCn: '战斗风格专长', scope: 'dnd2024', sourceFile: '玩家手册2024/专长/战斗风格专长.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '类别文件；单条专长待提取。' },
  { id: 'feat-index.epic-boon', nameCn: '传奇恩惠专长', scope: 'dnd2024', sourceFile: '玩家手册2024/专长/传奇恩惠专长.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '类别文件；单条专长待提取。' },
  { id: 'feat-index.overview', nameCn: '专长概述', scope: 'dnd2024', sourceFile: '玩家手册2024/专长/专长概述.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '概述文件；非条目。' },
  { id: 'feat-index.tcoe-feats', nameCn: '专长（TCoE）', scope: 'tcoe', sourceFile: '塔莎的万事坩埚/玩家选项/专长.html', extractionStatus: 'partial', desc: PENDING_DESC, notes: 'TCoE 专长文件；单条专长待提取。' },
  { id: 'feat-index.xgte-racial-feats', nameCn: '种族专长（XGtE）', scope: 'xgte', sourceFile: '珊娜萨的万事指南/角色选项/种族专长.html', extractionStatus: 'partial', desc: PENDING_DESC, notes: 'XGtE 种族专长文件；2024 范围适用性 needs-human-check。' },
];

// ── Equipment (装备类别级索引) ────────────────────────────────────────────────

export const DND_EQUIPMENT_INDEX_ACCURACY: RuleDataMetadata = {
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'display-only',
  sourceRef: `${MANIFEST_REF}#ambiguous--needs-human-check`,
  sourceNote:
    'The owner manifest records 13 equipment CATEGORY files (extractionStatus: partial). Individual equipment rows require a later table extraction pass; the runtime DND_EQUIPMENT_CATALOG sample (14 items) remains a separate display-only sample.',
};

export const DND_2024_EQUIPMENT_INDEX_DATA: DndOptionIndexEntry[] = [
  { id: 'equip-index.weapons', nameCn: '武器', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/武器.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.armor', nameCn: '护甲', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/护甲.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.adventuring-gear', nameCn: '冒险装备', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/冒险装备.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.tools', nameCn: '工具', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/工具.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.artisan-tools', nameCn: '工匠工具', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/工匠工具.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.other-tools', nameCn: '其他工具', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/其他工具.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.coins', nameCn: '钱币', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/钱币.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.mounts-vehicles', nameCn: '坐骑与载具', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/坐骑与载具.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.services', nameCn: '服务', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/服务.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.crafting', nameCn: '制作装备', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/制作装备.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.magic-items', nameCn: '魔法物品', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/魔法物品.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '魔法物品超出当前装备 runtime 范围；仅索引。' },
  { id: 'equip-index.properties', nameCn: '词条', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/词条.htm', extractionStatus: 'partial', desc: PENDING_DESC },
  { id: 'equip-index.mastery-properties', nameCn: '精通词条', scope: 'dnd2024', sourceFile: '玩家手册2024/装备/精通词条.htm', extractionStatus: 'partial', desc: PENDING_DESC, notes: '武器精通词条；runtime 精通规则仍 deferred。' },
];

// ── Completion gap report ────────────────────────────────────────────────────

export const DND_CHARACTER_OPTIONS_COMPLETION_REPORT = {
  species: { runtime: 9, manifest: 10, note: '9/9 SRD 物种已入默认列表；TCoE 定制血统为可选规则，needs-human-check，不计入默认。物种特性提取仍待人工核对。' },
  backgrounds: { runtime: 4, manifest: 5, note: '4/4 来源确认背景已是 runtime 默认；第 5 条为 XGtE 生平构建工具页（partial），非标准背景。' },
  originFeats: { runtime: 7, manifest: 'category-file', note: 'runtime 7 条为 ai-assisted；来源仅到 起源专长.htm 文件级，单条提取待后续轮。' },
  generalFeats: { runtime: 9, manifest: 'category-file', note: 'runtime 9 条为 ai-assisted；来源仅到 通用专长.htm 文件级。' },
  classes: { runtime: 12, manifest: 13, indexed: 13, runtimeDeferred: ['奇械师'], note: '奇械师（TCoE）已 source-indexed；CLASS_DATA / Creator runtime 暂不启用，等待 progression / spellcasting / infusions / subclass 验证。' },
  subclasses: { runtime: 46, manifest: 73, note: '差额与命名/范围差异由 Class/Subclass Correction 系列处理；本轮不动职业数据。' },
  spells: { runtime: 20, manifest: 507, indexed: 507, note: '507 条全部进入 display-only spellIndex（SRD 391 / TCoE 21 / XGtE 95）；runtime SPELL_DATA 保持 20 条不变。' },
  equipment: { runtimeSample: 14, manifestCategories: 13, indexed: 13, note: '类别级索引完成；单件装备行待表格提取轮。' },
} as const;
