import { BackgroundDef, SkillName } from '../lib/dnd-types';
import type { RuleDataMetadata } from '../lib/rules/rule-data-metadata';

// AI-LANDMARK: DND_BACKGROUND_SPECIES_CORRECTION
// AI-LANDMARK: DND_BACKGROUND_RUNTIME_COMPLETION
// DND Background / Species Correction v1:
// - Default background list now follows the local CHM primary source baseline
//   (玩家手册2024/角色起源/背景: 16 standard DND 2024 backgrounds).
// - 贤者 is renamed 智者 to match the owner source file name (智者.htm).
// - The Musician / Tough (音乐家 / 健壮) mix-up in the legacy 艺人 entry is fixed.
// - Other legacy 2014-style backgrounds are retained below as
//   LEGACY_BACKGROUND_DATA and quarantined, not deleted.
// - skill / origin-feat mappings are pre-existing app values pending human
//   verification against the owner source; they are NOT source-confirmed yet.

const LOCAL_CHM_BACKGROUND_ROOT =
  'C:\\TRPG_CHM_WORK\\extracted\\玩家手册2024\\角色起源\\背景';

const LOCAL_CHM_BACKGROUND_NOTE =
  'Local CHM confirmed standard DND 2024 background. Detailed skills, origin feat, ability options, equipment, and feature mechanics remain needs-human-check.';

export const DND_BACKGROUND_2024_DATA_ACCURACY: RuleDataMetadata = {
  source: 'dnd-local-chm-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'needs-human-verification',
  sourceRef: LOCAL_CHM_BACKGROUND_ROOT,
  sourceNote:
    'Runtime background list follows the local CHM primary source baseline: 16 standard DND 2024 backgrounds under 玩家手册2024/角色起源/背景. Detailed mechanics remain needs-human-check.',
};

function background2024Meta(name: string, sourceFile: string): RuleDataMetadata {
  return {
    source: 'dnd-local-chm-primary',
    trustLevel: 'source-labeled',
    usagePolicy: 'needs-human-verification',
    sourceRef: `${LOCAL_CHM_BACKGROUND_ROOT}\\${sourceFile}`,
    sourceNote: `${LOCAL_CHM_BACKGROUND_NOTE} Source entry: ${name}.`,
  };
}

const PENDING_BACKGROUND_FEATURE = {
  name: "背景特性待核对",
  desc: "该背景已由本地 CHM 主源确认为 DND 2024 标准背景，具体规则字段待进一步核对。"
};

function makeChmBackground(
  id: string,
  nameCn: string,
  nameEn: string,
  sourceFile: string,
  desc: string,
  skillProficiencies: SkillName[] = [],
  originFeat?: string,
): BackgroundDef {
  return {
    id,
    name: `${nameCn} (${nameEn})`,
    nameCn,
    ruleMeta: background2024Meta(nameCn, sourceFile),
    desc,
    skillProficiencies,
    originFeat,
    feature: PENDING_BACKGROUND_FEATURE,
  };
}

export const DND_2024_BACKGROUND_DATA: BackgroundDef[] = [
  makeChmBackground('background.acolyte', '侍僧', 'Acolyte', '侍僧.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。', ["洞察", "宗教"] as SkillName[], "魔法学徒 (Magic Initiate)"),
  makeChmBackground('background.artisan', '工匠', 'Artisan', '工匠.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.charlatan', '骗子', 'Charlatan', '骗子.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.criminal', '罪犯', 'Criminal', '罪犯.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。', ["欺瞒", "隐匿"] as SkillName[], "警觉 (Alert)"),
  makeChmBackground('background.entertainer', '艺人', 'Entertainer', '艺人.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.farmer', '农民', 'Farmer', '农民.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.guard', '警卫', 'Guard', '警卫.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.guide', '向导', 'Guide', '向导.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.hermit', '隐士', 'Hermit', '隐士.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.merchant', '商人', 'Merchant', '商人.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.noble', '贵族', 'Noble', '贵族.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.sage', '智者', 'Sage', '智者.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。', ["奥秘", "历史"] as SkillName[], "魔法学徒 (Magic Initiate)"),
  makeChmBackground('background.sailor', '水手', 'Sailor', '水手.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.scribe', '抄写员', 'Scribe', '抄写员.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
  makeChmBackground('background.soldier', '士兵', 'Soldier', '士兵.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。', ["运动", "威吓"] as SkillName[], "野蛮打击者 (Savage Attacker)"),
  makeChmBackground('background.wayfarer', '流浪者', 'Wayfarer', '流浪者.htm', '本地 CHM 确认的 DND 2024 标准背景；详细说明待核对。'),
];

export const DND_BACKGROUND_DATA_ACCURACY: RuleDataMetadata = {
  source: 'ai-assisted',
  trustLevel: 'needs-human-check',
  usagePolicy: 'quarantine',
  sourceNote:
    'Legacy 2014-style background data retained for app continuity and old character display only. Quarantined by DND Background / Species Correction v1: no longer the default Creator list. These entries use DND 2024 PHB background names but are absent from the SRD5.2 owner source subset (only 侍僧/士兵/智者/罪犯 are source-confirmed); verify before promotion.',
};

export const LEGACY_BACKGROUND_DATA: BackgroundDef[] = [
  {
    name: "艺人 (Entertainer)",
    desc: "你通过表演赢得观众的欢心，无论是在舞台还是街头。",
    skillProficiencies: ["特技", "表演"] as SkillName[],
    originFeat: "音乐家 (Musician)",
    feature: {
      name: "众人的关注",
      desc: "你获得 音乐家 (Musician) 专长。人们通常乐于为你提供免费食宿以听你表演。"
    }
  },
  {
    name: "工匠 (Artisan)",
    desc: "你在特定的手艺或公会中有着卓越的技艺。",
    skillProficiencies: ["洞察", "游说"] as SkillName[],
    originFeat: "熟练 (Skilled)",
    feature: {
      name: "公会特权",
      desc: "你获得 熟练 专长。作为公会一员，你在商业往来中享有优势。"
    }
  },
  {
    name: "流浪儿 (Urchin)",
    desc: "你在贫民窟长大，学会了如何在最艰难的环境中生存。",
    skillProficiencies: ["巧手", "隐匿"] as SkillName[],
    originFeat: "幸运 (Lucky)",
    feature: {
      name: "城市之子",
      desc: "你获得 幸运 专长。你熟悉城市的秘密小道，寻找补给更容易。"
    }
  },
  {
    name: "贵族 (Noble)",
    desc: "你生来便伴随财富和权势，习惯了发号施令。",
    skillProficiencies: ["历史", "游说"] as SkillName[],
    originFeat: "熟练 (Skilled)",
    feature: {
      name: "特权地位",
      desc: "你获得 熟练 专长。你的名望使你更容易结识权贵。"
    }
  }
];

// Default background list consumed by Creator / Sheet.
// DND Background Runtime Completion v1: defaults to the local-CHM-confirmed
// 16 DND 2024 standard backgrounds; legacy entries stay available via LEGACY_BACKGROUND_DATA.
export const BACKGROUND_DATA: BackgroundDef[] = DND_2024_BACKGROUND_DATA;
