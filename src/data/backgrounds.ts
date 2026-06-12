import { BackgroundDef, SkillName } from '../lib/dnd-types';
import type { RuleDataMetadata } from '../lib/rules/rule-data-metadata';

// AI-LANDMARK: DND_BACKGROUND_SPECIES_CORRECTION
// DND Background / Species Correction v1:
// - Default background list now follows the owner source manifest
//   (SRD5.2 玩家手册2024/角色起源/背景: 侍僧 / 士兵 / 智者 / 罪犯).
// - 贤者 is renamed 智者 to match the owner source file name (智者.htm).
// - The Musician / Tough (音乐家 / 健壮) mix-up in the legacy 艺人 entry is fixed.
// - Other legacy 2014-style backgrounds are retained below as
//   LEGACY_BACKGROUND_DATA and quarantined, not deleted.
// - skill / origin-feat mappings are pre-existing app values pending human
//   verification against the owner source; they are NOT source-confirmed yet.

const BACKGROUND_MANIFEST_REF =
  'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md';

export const DND_BACKGROUND_2024_DATA_ACCURACY: RuleDataMetadata = {
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'owner-source-matched',
  usagePolicy: 'needs-human-verification',
  sourceRef: `${BACKGROUND_MANIFEST_REF}#item-entries`,
  sourceNote:
    'Background entry names and source paths are matched to the owner source manifest (玩家手册2024/角色起源/背景). Skill proficiencies, origin feats, ability options, and feature text are retained pre-existing app values and still require human verification against the owner source.',
};

function background2024Meta(name: string, sourceFile: string): RuleDataMetadata {
  return {
    source: 'dnd5echm-srd52-primary',
    trustLevel: 'owner-source-matched',
    usagePolicy: 'needs-human-verification',
    sourceRef: `${BACKGROUND_MANIFEST_REF}#item-${name}`,
    sourceNote: `玩家手册2024/角色起源/背景/${sourceFile}；技能/出身专长/属性选项映射待人工核对（needs-human-check）。`,
  };
}

export const DND_2024_BACKGROUND_DATA: BackgroundDef[] = [
  {
    id: 'background.acolyte',
    name: "侍僧 (Acolyte)",
    ruleMeta: background2024Meta('侍僧', '侍僧.htm'),
    desc: "你奉献于神明或哲学，获得神圣的洞察力。",
    skillProficiencies: ["洞察", "宗教"] as SkillName[],
    originFeat: "魔法学徒 (Magic Initiate)",
    feature: {
      name: "出身专长",
      desc: "你获得 魔法学徒 (牧师) 专长。（2024 背景模型；具体属性选项待人工核对）"
    }
  },
  {
    id: 'background.soldier',
    name: "士兵 (Soldier)",
    ruleMeta: background2024Meta('士兵', '士兵.htm'),
    desc: "你在军队中服役并接受过严苛的战斗训练。",
    skillProficiencies: ["运动", "威吓"] as SkillName[],
    originFeat: "野蛮打击者 (Savage Attacker)",
    feature: {
      name: "出身专长",
      desc: "你获得 野蛮打击者 专长。（2024 背景模型；具体属性选项待人工核对）"
    }
  },
  {
    id: 'background.sage',
    name: "智者 (Sage)",
    ruleMeta: background2024Meta('智者', '智者.htm'),
    desc: "你将生命花费在研究古籍与奥秘知识上。",
    skillProficiencies: ["奥秘", "历史"] as SkillName[],
    originFeat: "魔法学徒 (Magic Initiate)",
    feature: {
      name: "出身专长",
      desc: "你获得 魔法学徒 (法师) 专长。（2024 背景模型；具体属性选项待人工核对）"
    }
  },
  {
    id: 'background.criminal',
    name: "罪犯 (Criminal)",
    ruleMeta: background2024Meta('罪犯', '罪犯.htm'),
    desc: "你在法律之外谋生，习得了各种街头生存技巧。",
    skillProficiencies: ["欺瞒", "隐匿"] as SkillName[],
    originFeat: "警觉 (Alert)",
    feature: {
      name: "出身专长",
      desc: "你获得 警觉 专长。（2024 背景模型；具体属性选项待人工核对）"
    }
  }
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
// DND Background / Species Correction v1: defaults to the owner-source-confirmed
// SRD5.2 background subset; legacy entries stay available via LEGACY_BACKGROUND_DATA.
export const BACKGROUND_DATA: BackgroundDef[] = DND_2024_BACKGROUND_DATA;
