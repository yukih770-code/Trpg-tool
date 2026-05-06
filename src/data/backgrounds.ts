import { BackgroundDef, SkillName } from '../lib/dnd-types';

export const BACKGROUND_DATA: BackgroundDef[] = [
  {
    name: "侍僧 (Acolyte)",
    desc: "你奉献于神明或哲学，获得神圣的洞察力。",
    skillProficiencies: ["洞察", "宗教"] as SkillName[],
    originFeat: "魔法学徒 (Magic Initiate)",
    feature: {
      name: "信仰之光",
      desc: "你获得 魔法学徒 (牧师) 专长。你总是能从同信仰的神庙获得免费的疗伤和看护。"
    }
  },
  {
    name: "士兵 (Soldier)",
    desc: "你在军队中服役并接受过严苛的战斗训练。",
    skillProficiencies: ["运动", "威吓"] as SkillName[],
    originFeat: "野蛮打击者 (Savage Attacker)",
    feature: {
      name: "老兵",
      desc: "你获得 野蛮打击者 专长。你在服役过的军队中保有军阶，可获得一定便利。"
    }
  },
  {
    name: "贤者 (Sage)",
    desc: "你将生命花费在研究古籍与奥秘知识上。",
    skillProficiencies: ["奥秘", "历史"] as SkillName[],
    originFeat: "魔法学徒 (Magic Initiate)",
    feature: {
      name: "学者",
      desc: "你获得 魔法学徒 (法师) 专长。当你想了解知识时，你通常知道从何处获取信息。"
    }
  },
  {
    name: "罪犯 (Criminal)",
    desc: "你在法律之外谋生，习得了各种街头生存技巧。",
    skillProficiencies: ["欺瞒", "隐匿"] as SkillName[],
    originFeat: "警觉 (Alert)",
    feature: {
      name: "街头智慧",
      desc: "你获得 警觉 专长。你拥有黑暗世界的地下联络方式。"
    }
  },
  {
    name: "艺人 (Entertainer)",
    desc: "你通过表演赢得观众的欢心，无论是在舞台还是街头。",
    skillProficiencies: ["特技", "表演"] as SkillName[],
    originFeat: "健壮 (Musician)",
    feature: {
      name: "众人的关注",
      desc: "你获得 健壮 专长。人们通常乐于为你提供免费食宿以听你表演。"
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
