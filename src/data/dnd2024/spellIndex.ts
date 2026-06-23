/**
 * DND 2024 / XGtE / TCoE Spell Source Index (display-only)
 *
 * AI-LANDMARK: DND_CHARACTER_OPTIONS_SOURCE_COMPLETION
 *
 * Source-labeled spell INDEX transcribed 1:1 from
 * `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md`
 * (owner sources: DND5eChm/SRD5.2Chm primary; DND5eChm/DND5e_chm XGtE/TCoE).
 *
 * Index contract:
 * - This file lists entry EXISTENCE only: English name (from source HTML
 *   anchors), spell level (环), and scope. Chinese names, schools, class
 *   lists, and ALL rule effects remain needs-human-check unless a row carries
 *   owner-source-matched index metadata.
 * - This index is SEPARATE from runtime `SPELL_DATA` (src/data/spells.ts)
 *   and must not be wired into Gameplay/spellbook runtime until entries
 *   are individually verified and promoted.
 * - No long rules text is copied. No model-memory completion.
 */

import type { RuleDataMetadata } from '../../lib/rules/rule-data-metadata';

export type DndSpellIndexScope = 'dnd2024' | 'xgte' | 'tcoe';

export interface DndSpellIndexEntry {
  id: string;
  nameEn: string;
  nameCn: string;
  level: number;
  school: string;
  scope: DndSpellIndexScope;
  desc: string;
  classes?: string[];
  ruleMeta?: RuleDataMetadata;
}

export const DND_SPELL_INDEX_ACCURACY: RuleDataMetadata = {
  source: 'dnd5echm-srd52-primary',
  trustLevel: 'source-labeled',
  usagePolicy: 'display-only',
  sourceRef: 'docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md#item-entries',
  sourceNote:
    'Spell index entries (name/level/scope) transcribed from the owner source entry manifest. XGtE/TCoE rows use sourceId dnd5echm-xgte / dnd5echm-tcoe respectively. Chinese names, schools, class lists, and effects are needs-human-check; not runtime data.',
};

const INDEX_DESC = '该法术条目已定位来源，具体规则效果待核对。';
const VERIFIED_INDEX_DESC = '该法术索引 metadata 已按本地资料核对，具体规则效果仍以 runtime SPELL_DATA 或后续详情抽取为准。';
const DND_LOCAL_CHM_SPELL_DETAIL_REF =
  'dnd-local-chm-primary:玩家手册2024/法术详述';

function slugify(nameEn: string): string {
  return nameEn
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface DndSpellIndexVerifiedMetadata {
  nameCn: string;
  school: string;
  classes: string[];
  sourceRef: string;
}

function verifiedSpellIndex(
  nameCn: string,
  school: string,
  classes: string[],
  fileName: string,
  sectionId: string,
): DndSpellIndexVerifiedMetadata {
  return {
    nameCn,
    school,
    classes,
    sourceRef: `${DND_LOCAL_CHM_SPELL_DETAIL_REF}/${fileName}#${sectionId}`,
  };
}

function spellRow(
  nameEn: string,
  level: number,
  scope: DndSpellIndexScope,
  verified?: DndSpellIndexVerifiedMetadata,
): DndSpellIndexEntry {
  return {
    id: `spell-index.${scope}.${slugify(nameEn)}`,
    nameEn,
    nameCn: verified?.nameCn ?? 'needs-human-check',
    level,
    school: verified?.school ?? 'needs-human-check',
    scope,
    desc: verified ? VERIFIED_INDEX_DESC : INDEX_DESC,
    ...(verified
      ? {
          classes: verified.classes,
          ruleMeta: {
            source: 'dnd-local-chm-primary',
            trustLevel: 'owner-source-matched',
            usagePolicy: 'display-only',
            sourceRef: verified.sourceRef,
            sourceNote:
              'Spell index Chinese name, school, and class availability were extracted from the user-local DND 2024 CHM spell detail source. Class labels keep existing app terminology where the source uses 魔契师 for the app label 邪术师.',
          } satisfies RuleDataMetadata,
        }
      : {}),
  };
}

type Row = [nameEn: string, level: number, verified?: DndSpellIndexVerifiedMetadata];

// ── SRD5.2 玩家手册2024/法术详述 (sourceId: dnd5echm-srd52-primary) ──────────
const SRD52_SPELL_ROWS: Row[] = [
  ['Acid Splash', 0, verifiedSpellIndex('酸液飞溅', '塑能', ['术士', '法师'], '0环.htm', 'Acid_Splash')], ['Aid', 2], ['Alarm', 1, verifiedSpellIndex('警报术', '防护', ['游侠', '法师'], '1环.htm', 'Alarm')], ['Alter Self', 2], ['Animal Friendship', 1, verifiedSpellIndex('化兽为友', '惑控', ['吟游诗人', '德鲁伊', '游侠'], '1环.htm', 'Animal_Friendship')],
  ['Animal Messenger', 2], ['Animal Shapes', 8], ['Animate Dead', 3], ['Animate Objects', 5], ['Antilife Shell', 5],
  ['Antimagic Field', 8], ['AntipathySympathy', 8], ['Arcane Eye', 4], ['Arcane Gate', 6], ['Arcane Lock', 2],
  ['Arcane Vigor', 2], ['Armor of Agathys', 1, verifiedSpellIndex('黯冰狱铠', '防护', ['邪术师'], '1环.htm', 'Armor_of_Agathys')], ['Arms of Hadar', 1, verifiedSpellIndex('哈达之臂', '咒法', ['邪术师'], '1环.htm', 'Arms_of_Hadar')], ['Astral Projection', 9], ['Augury', 2],
  ['Aura of Life', 4], ['Aura of Purity', 4], ['Aura of Vitality', 3], ['Awaken', 5], ['Bane', 1, verifiedSpellIndex('灾祸术', '惑控', ['吟游诗人', '牧师', '邪术师'], '1环.htm', 'Bane')],
  ['Banishing Smite', 5], ['Banishment', 4], ['Barkskin', 2], ['Beacon of Hope', 3], ['Beast Sense', 2],
  ['Befuddlement', 8], ['Bestow Curse', 3], ["Bigby's Hand", 5], ['Blade Barrier', 6], ['Blade Ward', 0, verifiedSpellIndex('剑刃防护', '防护', ['吟游诗人', '术士', '邪术师', '法师'], '0环.htm', 'Blade_Ward')],
  ['Bless', 1, verifiedSpellIndex('祝福术', '惑控', ['牧师', '圣武士'], '1环.htm', 'Bless')], ['Blight', 4], ['Blinding Smite', 3], ['BlindnessDeafness', 2], ['Blink', 3],
  ['Blur', 2], ['Burning Hands', 1, verifiedSpellIndex('燃烧之手', '塑能', ['术士', '法师'], '1环.htm', 'Burning_Hands')], ['Call Lightning', 3], ['Calm Emotions', 2], ['Chain Lightning', 6],
  ['Charm Monster', 4], ['Charm Person', 1, verifiedSpellIndex('魅惑类人', '惑控', ['吟游诗人', '德鲁伊', '术士', '邪术师', '法师'], '1环.htm', 'Charm_Person')], ['Chill Touch', 0, verifiedSpellIndex('颤栗之触', '死灵', ['术士', '邪术师', '法师'], '0环.htm', 'Chill_Touch')], ['Chromatic Orb', 1, verifiedSpellIndex('繁彩球', '塑能', ['术士', '法师'], '1环.htm', 'Chromatic_Orb')], ['Circle of Death', 6],
  ['Circle of Power', 5], ['Clairvoyance', 3], ['Clone', 8], ['Cloud of Daggers', 2], ['Cloudkill', 5],
  ['Color Spray', 1, verifiedSpellIndex('七彩喷射', '幻术', ['吟游诗人', '术士', '法师'], '1环.htm', 'Color_Spray')], ['Command', 1, verifiedSpellIndex('命令术', '惑控', ['吟游诗人', '牧师', '圣武士'], '1环.htm', 'Command')], ['Commune', 5], ['Commune with Nature', 5], ['Compelled Duel', 1, verifiedSpellIndex('强令对决', '惑控', ['圣武士'], '1环.htm', 'Compelled_Duel')],
  ['Comprehend Languages', 1, verifiedSpellIndex('通晓语言', '预言', ['吟游诗人', '术士', '邪术师', '法师'], '1环.htm', 'Comprehend_Languages')], ['Compulsion', 4], ['Cone of Cold', 5], ['Confusion', 4], ['Conjure Animals', 3],
  ['Conjure Barrage', 3], ['Conjure Celestial', 7], ['Conjure Elemental', 5], ['Conjure Fey', 6], ['Conjure Minor Elementals', 4],
  ['Conjure Volley', 5], ['Conjure Woodland Beings', 4], ['Contact Other Plane', 5], ['Contagion', 5], ['Contingency', 6],
  ['Continual Flame', 2], ['Control Water', 4], ['Control Weather', 8], ['Cordon of Arrows', 2], ['Counterspell', 3, verifiedSpellIndex('法术反制', '防护', ['术士', '邪术师', '法师'], '3环.htm', 'Counterspell')],
  ['Create Food and Water', 3], ['Create or Destroy Water', 1, verifiedSpellIndex('造水术/枯水术', '变化', ['牧师', '德鲁伊'], '1环.htm', 'Create_or_Destroy_Water')], ['Create Undead', 6], ['Creation', 5], ['Crown of Madness', 2],
  ["Crusader's Mantle", 3], ['Cure Wounds', 1, verifiedSpellIndex('疗伤术', '防护', ['吟游诗人', '牧师', '德鲁伊', '圣武士', '游侠'], '1环.htm', 'Cure_Wounds')], ['Dancing Lights', 0, verifiedSpellIndex('舞光术', '幻术', ['吟游诗人', '术士', '法师'], '0环.htm', 'Dancing_Lights')], ['Darkness', 2], ['Darkvision', 2],
  ['Daylight', 3], ['Death Ward', 4], ['Delayed Blast Fireball', 7], ['Demiplane', 8], ['Destructive Wave', 5],
  ['Detect Evil and Good', 1, verifiedSpellIndex('侦测善恶', '预言', ['牧师', '圣武士'], '1环.htm', 'Detect_Evil_and_Good')], ['Detect Magic', 1, verifiedSpellIndex('侦测魔法', '预言', ['吟游诗人', '牧师', '德鲁伊', '圣武士', '游侠', '术士', '邪术师', '法师'], '1环.htm', 'Detect_Magic')], ['Detect Poison and Disease', 1, verifiedSpellIndex('侦测毒性和疾病', '预言', ['牧师', '德鲁伊', '圣武士', '游侠'], '1环.htm', 'Detect_Poison_and_Disease')], ['Detect Thoughts', 2], ['Dimension Door', 4],
  ['Disguise Self', 1, verifiedSpellIndex('易容术', '幻术', ['吟游诗人', '术士', '法师'], '1环.htm', 'Disguise_Self')], ['Disintegrate', 6], ['Dispel Evil and Good', 5], ['Dispel Magic', 3, verifiedSpellIndex('解除魔法', '防护', ['吟游诗人', '牧师', '德鲁伊', '圣武士', '游侠', '术士', '邪术师', '法师'], '3环.htm', 'Dispel_Magic')], ['Dissonant Whispers', 1, verifiedSpellIndex('不谐低语', '惑控', ['吟游诗人'], '1环.htm', 'Dissonant_Whispers')],
  ['Divination', 4], ['Divine Favor', 1, verifiedSpellIndex('神恩', '变化', ['圣武士'], '1环.htm', 'Divine_Favor')], ['Divine Smite', 1, verifiedSpellIndex('至圣斩', '塑能', ['圣武士'], '1环.htm', 'Divine_Smite')], ['Divine Word', 7], ['Dominate Beast', 4],
  ['Dominate Monster', 8], ['Dominate Person', 5], ["Dragon's Breath", 2], ["Drawmij's Instant Summons", 6], ['Dream', 5],
  ['Druidcraft', 0, verifiedSpellIndex('德鲁伊伎俩', '变化', ['德鲁伊'], '0环.htm', 'Druidcraft')], ['Earthquake', 8], ['Eldritch Blast', 0, verifiedSpellIndex('魔能爆', '塑能', ['邪术师'], '0环.htm', 'Eldritch_Blast')], ['Elemental Weapon', 3], ['Elementalism', 0, verifiedSpellIndex('四象法门', '变化', ['德鲁伊', '术士', '法师'], '0环.htm', 'Elementalism')],
  ['Enhance Ability', 2], ['Enlarge Reduce', 2], ['Ensnaring Strike', 1, verifiedSpellIndex('捕获打击', '咒法', ['游侠'], '1环.htm', 'Ensnaring_Strike')], ['Entangle', 1, verifiedSpellIndex('纠缠术', '咒法', ['德鲁伊', '游侠'], '1环.htm', 'Entangle')], ['Enthrall', 2],
  ['Etherealness', 7], ["Evard's Black Tentacles", 4], ['Expeditious Retreat', 1, verifiedSpellIndex('脚底抹油', '变化', ['术士', '邪术师', '法师'], '1环.htm', 'Expeditious_Retreat')], ['Eyebite', 6], ['Fabricate', 4],
  ['Faerie Fire', 1, verifiedSpellIndex('妖火', '塑能', ['吟游诗人', '德鲁伊'], '1环.htm', 'Faerie_Fire')], ['False Life', 1, verifiedSpellIndex('虚假生命', '死灵', ['术士', '法师'], '1环.htm', 'False_Life')], ['Fear', 3], ['Feather Fall', 1, verifiedSpellIndex('羽落术', '变化', ['吟游诗人', '术士', '法师'], '1环.htm', 'Feather_Fall')], ['Feign Death', 3],
  ['Find Familiar', 1, verifiedSpellIndex('寻获魔宠', '咒法', ['法师'], '1环.htm', 'Find_Familiar')], ['Find Steed', 2], ['Find the Path', 6], ['Find Traps', 2], ['Finger of Death', 7],
  ['Fire Bolt', 0, verifiedSpellIndex('火焰箭', '塑能', ['术士', '法师'], '0环.htm', 'Fire_Bolt')], ['Fire Shield', 4], ['Fire Storm', 7], ['Fireball', 3, verifiedSpellIndex('火球术', '塑能', ['术士', '法师'], '3环.htm', 'Fireball')], ['Flame Blade', 2],
  ['Flame Strike', 5], ['Flaming Sphere', 2], ['Flesh to Stone', 6], ['Fly', 3], ['Fog Cloud', 1, verifiedSpellIndex('云雾术', '咒法', ['德鲁伊', '游侠', '术士', '法师'], '1环.htm', 'Fog_Cloud')],
  ['Forbiddance', 6], ['Forcecage', 7], ['Foresight', 9], ['Fount of Moonlight', 4], ['Freedom of Movement', 4],
  ['Friends', 0, verifiedSpellIndex('交友术', '惑控', ['吟游诗人', '术士', '邪术师', '法师'], '0环.htm', 'Friends')], ['Gaseous Form', 3], ['Gate', 9], ['Geas', 5], ['Gentle Repose', 2],
  ['Giant Insect', 4], ['Glibness', 8], ['Globe of Invulnerability', 6], ['Glyph of Warding', 3], ['Goodberry', 1, verifiedSpellIndex('神莓术', '咒法', ['德鲁伊', '游侠'], '1环.htm', 'Goodberry')],
  ['Grasping Vine', 4], ['Grease', 1, verifiedSpellIndex('油腻术', '咒法', ['术士', '法师'], '1环.htm', 'Grease')], ['Greater Invisibility', 4], ['Greater Restoration', 5], ['Guardian of Faith', 4],
  ['Guards and Wards', 6], ['Guidance', 0, verifiedSpellIndex('神导术', '预言', ['牧师', '德鲁伊'], '0环.htm', 'Guidance')], ['Guiding Bolt', 1, verifiedSpellIndex('光导箭', '塑能', ['牧师'], '1环.htm', 'Guiding_Bolt')], ['Gust of Wind', 2], ['Hail of Thorns', 1, verifiedSpellIndex('荆棘之雨', '咒法', ['游侠'], '1环.htm', 'Hail_of_Thorns')],
  ['Hallow', 5], ['Hallucinatory Terrain', 4], ['Harm', 6], ['Haste', 3], ['Heal', 6],
  ['Healing Word', 1, verifiedSpellIndex('治愈真言', '防护', ['吟游诗人', '牧师', '德鲁伊'], '1环.htm', 'Healing_Word')], ['Heat Metal', 2], ['Hellish Rebuke', 1, verifiedSpellIndex('炼狱叱喝', '塑能', ['邪术师'], '1环.htm', 'Hellish_Rebuke')], ["Heroes' Feast", 6], ['Heroism', 1, verifiedSpellIndex('英雄气概', '惑控', ['吟游诗人', '圣武士'], '1环.htm', 'Heroism')],
  ['Hex', 1, verifiedSpellIndex('脆弱诅咒', '惑控', ['邪术师'], '1环.htm', 'Hex')], ['Hold Monster', 5], ['Hold Person', 2, verifiedSpellIndex('定身类人', '惑控', ['吟游诗人', '牧师', '德鲁伊', '术士', '邪术师', '法师'], '2环.htm', 'Hold_Person')], ['Holy Aura', 8], ['Hunger of Hadar', 3],
  ["Hunter's Mark", 1, verifiedSpellIndex('猎人印记', '预言', ['游侠'], '1环.htm', "Hunter's_Mark")], ['Hypnotic Pattern', 3], ['Ice Knife', 1, verifiedSpellIndex('冰刃', '咒法', ['德鲁伊', '术士', '法师'], '1环.htm', 'Ice_Knife')], ['Ice Storm', 4], ['Identify', 1, verifiedSpellIndex('鉴定术', '预言', ['吟游诗人', '法师'], '1环.htm', 'Identify')],
  ['Illusory Script', 1, verifiedSpellIndex('迷幻手稿', '幻术', ['吟游诗人', '法师'], '1环.htm', 'Illusory_Script')], ['Imprisonment', 9], ['Incendiary Cloud', 8], ['Inflict Wounds', 1, verifiedSpellIndex('致伤术', '死灵', ['牧师'], '1环.htm', 'Inflict_Wounds')], ['Insect Plague', 5],
  ['Invisibility', 2, verifiedSpellIndex('隐形术', '幻术', ['吟游诗人', '术士', '邪术师', '法师'], '2环.htm', 'Invisibility')], ["Jailarzi's Storm of Radiance", 5], ['Jump', 1, verifiedSpellIndex('跳跃术', '变化', ['德鲁伊', '游侠', '术士', '法师'], '1环.htm', 'Jump')], ['Knock', 2], ['Legend Lore', 5],
  ["Leomund's Secret Chest", 4], ["Leomund's Tiny Hut", 3], ['Lesser Restoration', 2], ['Levitate', 2], ['Light', 0, verifiedSpellIndex('光亮术', '塑能', ['吟游诗人', '牧师', '术士', '法师'], '0环.htm', 'Light')],
  ['Lightning Arrows', 3], ['Lightning Bolt', 3], ['Locate Animals or Plants', 2], ['Locate Creature', 4], ['Locate Object', 2],
  ['Longstrider', 1, verifiedSpellIndex('大步奔行', '变化', ['吟游诗人', '德鲁伊', '游侠', '法师'], '1环.htm', 'Longstrider')], ['Mage Armor', 1, verifiedSpellIndex('法师护甲', '防护', ['术士', '法师'], '1环.htm', 'Mage_Armor')], ['Mage Hand', 0, verifiedSpellIndex('法师之手', '咒法', ['吟游诗人', '术士', '邪术师', '法师'], '0环.htm', 'Mage_Hand')], ['Magic Circle', 3], ['Magic Jar', 6],
  ['Magic Missile', 1, verifiedSpellIndex('魔法飞弹', '塑能', ['术士', '法师'], '1环.htm', 'Magic_Missile')], ['Magic Mouth', 2], ['Magic Weapon', 2], ['Major Image', 3], ['Mass Cure Wounds', 5],
  ['Mass Heal', 9], ['Mass Healing Word', 3], ['Mass Suggestion', 6], ['Maze', 8], ['Meld Into Stone', 3],
  ["Melf's Acid Arrow", 2], ['Mending', 0, verifiedSpellIndex('修复术', '变化', ['吟游诗人', '牧师', '德鲁伊', '术士', '法师'], '0环.htm', 'Mending')], ['Message', 0, verifiedSpellIndex('传讯术', '变化', ['吟游诗人', '德鲁伊', '术士', '法师'], '0环.htm', 'Message')], ['Meteor Swarm', 9], ['Mind Blank', 8],
  ['Mind Sliver', 0, verifiedSpellIndex('心灵之楔', '惑控', ['术士', '邪术师', '法师'], '0环.htm', 'Mind_Sliver')], ['Mind Spike', 2], ['Minor Illusion', 0, verifiedSpellIndex('次级幻象', '幻术', ['吟游诗人', '术士', '邪术师', '法师'], '0环.htm', 'Minor_Illusion')], ['Mirage Arcane', 7], ['Mirror Image', 2],
  ['Mislead', 5], ['Misty Step', 2, verifiedSpellIndex('迷踪步', '咒法', ['术士', '邪术师', '法师'], '2环.htm', 'Misty_Step')], ['Modify Memory', 5], ['Moonbeam', 2], ["Mordenkainen's Faithful Hound", 4],
  ["Mordenkainen's Magnificent Mansion", 7], ["Mordenkainen's Private Sanctum", 4], ["Mordenkainen's Sword", 7], ['Move Earth', 6], ['Nondetection', 3],
  ["Nystul's Magic Aura", 2], ["Otiluke's Freezing Sphere", 6], ["Otiluke's Resilient Sphere", 4], ["Otto's Irresistible Dance", 6], ['Pass without Trace', 2],
  ['Passwall', 5], ['Phantasmal Force', 2], ['Phantasmal Killer', 4], ['Phantom Steed', 3], ['Planar Ally', 6],
  ['Planar Binding', 5], ['Plane Shift', 7], ['Plant Growth', 3], ['Poison Spray', 0, verifiedSpellIndex('毒气喷涌', '死灵', ['德鲁伊', '术士', '邪术师', '法师'], '0环.htm', 'Poison_Spray')], ['Polymorph', 4],
  ['Power Word Fortify', 7], ['Power Word Heal', 9], ['Power Word Kill', 9], ['Power Word Stun', 8], ['Prayer of Healing', 2],
  ['Prestidigitation', 0, verifiedSpellIndex('魔法伎俩', '变化', ['吟游诗人', '术士', '邪术师', '法师'], '0环.htm', 'Prestidigitation')], ['Prismatic Spray', 7], ['Prismatic Wall', 9], ['Produce Flame', 0, verifiedSpellIndex('燃火术', '咒法', ['德鲁伊'], '0环.htm', 'Produce_Flame')], ['Programmed Illusion', 6],
  ['Project Image', 7], ['Protection from Energy', 3], ['Protection from Evil and Good', 1, verifiedSpellIndex('防护善恶', '防护', ['牧师', '德鲁伊', '圣武士', '邪术师', '法师'], '1环.htm', 'Protection_from_Evil_and_Good')], ['Protection from Poison', 2], ['Purify Food and Drink', 1, verifiedSpellIndex('净化饮食', '变化', ['牧师', '德鲁伊', '圣武士'], '1环.htm', 'Purify_Food_and_Drink')],
  ['Raise Dead', 5], ["Rary's Telepathic Bond", 5], ['Ray of Enfeeblement', 2], ['Ray of Frost', 0, verifiedSpellIndex('冷冻射线', '塑能', ['术士', '法师'], '0环.htm', 'Ray_of_Frost')], ['Ray of Sickness', 1, verifiedSpellIndex('致病射线', '死灵', ['术士', '法师'], '1环.htm', 'Ray_of_Sickness')],
  ['Regenerate', 7], ['Reincarnate', 5], ['Remove Curse', 3], ['Resistance', 0, verifiedSpellIndex('抵抗术', '防护', ['牧师', '德鲁伊'], '0环.htm', 'Resistance')], ['Resurrection', 7],
  ['Reverse Gravity', 7], ['Revivify', 3, verifiedSpellIndex('回生术', '死灵', ['牧师', '德鲁伊', '圣武士', '游侠'], '3环.htm', 'Revivify')], ['Rope Trick', 2], ['Sacred Flame', 0, verifiedSpellIndex('圣火术', '塑能', ['牧师'], '0环.htm', 'Sacred_Flame')], ['Sanctuary', 1, verifiedSpellIndex('庇护术', '防护', ['牧师'], '1环.htm', 'Sanctuary')],
  ['Scorching Ray', 2], ['Scrying', 5], ['Searing Smite', 1, verifiedSpellIndex('炽焰斩', '塑能', ['圣武士'], '1环.htm', 'Searing_Smite')], ['See Invisibility', 2], ['Seeming', 5],
  ['Sending', 3], ['Sequester', 7], ['Shapechange', 9], ['Shatter', 2, verifiedSpellIndex('粉碎音波', '塑能', ['吟游诗人', '术士', '法师'], '2环.htm', 'Shatter')], ['Shield', 1, verifiedSpellIndex('护盾术', '防护', ['术士', '法师'], '1环.htm', 'Shield')],
  ['Shield of Faith', 1, verifiedSpellIndex('虔诚护盾', '防护', ['牧师', '圣武士'], '1环.htm', 'Shield_of_Faith')], ['Shillelagh', 0, verifiedSpellIndex('橡棍术', '变化', ['德鲁伊'], '0环.htm', 'Shillelagh')], ['Shining Smite', 2], ['Shocking Grasp', 0, verifiedSpellIndex('电爪', '塑能', ['术士', '法师'], '0环.htm', 'Shocking_Grasp')], ['Silence', 2],
  ['Silent Image', 1, verifiedSpellIndex('无声幻影', '幻术', ['吟游诗人', '术士', '法师'], '1环.htm', 'Silent_Image')], ['Simulacrum', 7], ['Sleep', 1], ['Sleet Storm', 3], ['Slow', 3],
  ['Sorcerous Burst', 0, verifiedSpellIndex('术法爆发', '塑能', ['术士'], '0环.htm', 'Sorcerous_Burst')], ['Spare the Dying', 0, verifiedSpellIndex('维生术', '死灵', ['牧师', '德鲁伊'], '0环.htm', 'Spare_the_Dying')], ['Speak with Animals', 1], ['Speak with Dead', 3], ['Speak with Plants', 3],
  ['Spider Climb', 2], ['Spike Growth', 2], ['Spirit Guardians', 3], ['Spiritual Weapon', 2], ['Staggering Smite', 4],
  ['Starry Wisp', 0, verifiedSpellIndex('点点星芒', '塑能', ['吟游诗人', '德鲁伊'], '0环.htm', 'Starry_Wisp')], ['Steel Wind Strike', 5], ['Stinking Cloud', 3], ['Stone Shape', 4], ['Stoneskin', 4],
  ['Storm of Vengeance', 9], ['Suggestion', 2], ['Summon Aberration', 4], ['Summon Beast', 2], ['Summon Celestial', 5],
  ['Summon Construct', 4], ['Summon Dragon', 5], ['Summon Elemental', 4], ['Summon Fey', 3], ['Summon Fiend', 6],
  ['Summon Undead', 3], ['Sunbeam', 6], ['Sunburst', 8], ['Swift Quiver', 5], ['Symbol', 7],
  ['Synaptic Static', 5], ["Tasha's Bubbling Cauldron", 6], ["Tasha's Hideous Laughter", 1, verifiedSpellIndex('塔莎狂笑术', '惑控', ['吟游诗人', '邪术师', '法师'], '1环.htm', "Tasha's_Hideous_Laughter")], ['Telekinesis', 5], ['Telepathy', 8],
  ['Teleport', 7], ['Teleportation Circle', 5], ["Tenser's Floating Disk", 1], ['Thaumaturgy', 0, verifiedSpellIndex('奇术', '变化', ['牧师'], '0环.htm', 'Thaumaturgy')], ['Thorn Whip', 0, verifiedSpellIndex('荆棘之鞭', '变化', ['德鲁伊'], '0环.htm', 'Thorn_Whip')],
  ['Thunderclap', 0, verifiedSpellIndex('鸣雷破', '塑能', ['吟游诗人', '德鲁伊', '术士', '邪术师', '法师'], '0环.htm', 'Thunderclap')], ['Thunderous Smite', 1], ['Thunderwave', 1], ['Time Stop', 9], ['Toll the Dead', 0, verifiedSpellIndex('亡者丧钟', '死灵', ['牧师', '邪术师', '法师'], '0环.htm', 'Toll_the_Dead')],
  ['Tongues', 3], ['Transport via Plants', 6], ['Tree Stride', 5], ['True Polymorph', 9], ['True Resurrection', 9],
  ['True Seeing', 6], ['True Strike', 0, verifiedSpellIndex('克敌先击', '预言', ['吟游诗人', '术士', '邪术师', '法师'], '0环.htm', 'True_Strike')], ['Tsunami', 8], ['Unseen Servant', 1], ['Vampiric Touch', 3],
  ['Vicious Mockery', 0, verifiedSpellIndex('恶言相加', '惑控', ['吟游诗人'], '0环.htm', 'Vicious_Mockery')], ['Vitriolic Sphere', 4], ['Wall of Fire', 4], ['Wall of Force', 5], ['Wall of Ice', 6],
  ['Wall of Stone', 5], ['Wall of Thorns', 6], ['Warding Bond', 2], ['Water Breathing', 3], ['Water Walk', 3],
  ['Web', 2], ['Weird', 9], ['Wind Walk', 6], ['Wind Wall', 3], ['Wish', 9],
  ['Witch Bolt', 1], ['Word of Radiance', 0, verifiedSpellIndex('光耀祷词', '塑能', ['牧师'], '0环.htm', 'Word_of_Radiance')], ['Word of Recall', 6], ['Wrathful Smite', 1], ["Yolande's Regal Presence", 5],
  ['Zone of Truth', 2],
];

// ── TCoE 塔莎的万事坩埚/法术 (sourceId: dnd5echm-tcoe) ───────────────────────
const TCOE_SPELL_ROWS: Row[] = [
  ['Blade of Disaster', 9], ['Booming Blade', 0], ['Dream of the Blue Veil', 7], ['Green-Flame Blade', 0], ['Intellect Fortress', 3],
  ['Lightning Lure', 0], ['Mind Sliver', 0], ['Spirit Shroud', 3], ['Summon Aberration', 4], ['Summon Beast', 2],
  ['Summon Celestial', 5], ['Summon Construct', 4], ['Summon Elemental', 4], ['Summon Fey', 3], ['Summon Fiend', 6],
  ['Summon Shadowspawn', 3], ['Summon Undead', 3], ['Sword Burst', 0], ["Tasha's Caustic Brew", 1], ["Tasha's Mind Whip", 2],
  ["Tasha's Otherworldly Guise", 6],
];

// ── XGtE 珊娜萨的万事指南/法术 (sourceId: dnd5echm-xgte) ─────────────────────
const XGTE_SPELL_ROWS: Row[] = [
  ["Abi-Dalzim's Horrid Wilting", 8], ['Absorb Elements', 1], ["Aganazzar's Scorcher", 2], ['Beast Bond', 1], ['Bones of the Earth', 6],
  ['Catapult', 1], ['Catnap', 3], ['Cause Fear', 1], ['Ceremony', 1], ['Chaos Bolt', 1],
  ['Charm Monster', 4], ['Control Flames', 0], ['Control Wind', 5], ['Create Bonfire', 0], ['Create Homunculus', 6],
  ['Crown of Stars', 7], ['Danse Macabre', 5], ['Dawn', 5], ["Dragon's Breath", 2], ['Druid Grove', 6],
  ['Dust Devil', 2], ['Earth Tremor', 1], ['Earthbind', 2], ['Elemental Bane', 4], ['Enemies Abound', 3],
  ['Enervation', 5], ['Erupting Earth', 3], ['Far Step', 5], ['Find Greater Steed', 4], ['Flame Arrows', 3],
  ['Frostbite', 0], ['Guardian of Nature', 4], ['Gust', 0], ['Healing Spirit', 2], ['Holy Weapon', 5],
  ['Ice Knife', 1], ['Illusory Dragon', 8], ['Immolation', 5], ['Infernal Calling', 5], ['Infestation', 0],
  ['Investiture of Flame', 6], ['Investiture of Ice', 6], ['Investiture of Stone', 6], ['Investiture of Wind', 6], ['Invulnerability', 9],
  ['Life Transference', 3], ['Maddening Darkness', 8], ['Maelstrom', 5], ['Magic Stone', 0], ['Mass Polymorph', 9],
  ["Maximilian's Earthen Grasp", 2], ["Melf's Minute Meteors", 3], ['Mental Prison', 6], ['Mighty Fortress', 8], ['Mind Spike', 2],
  ['Mold Earth', 0], ['Negative Energy Flood', 5], ['Power Word Pain', 7], ['Primal Savagery', 0], ['Primordial Ward', 6],
  ['Psychic Scream', 9], ['Pyrotechnics', 2], ['Scatter', 6], ['Shadow Blade', 2], ['Shadow of Moil', 4],
  ['Shape Water', 0], ['Sickening Radiance', 4], ['Skill Empowerment', 5], ['Skywrite', 2], ['Snare', 1],
  ["Snilloc's Snowball Swarm", 2], ['Soul Cage', 6], ['Steel Wind Strike', 5], ['Storm Sphere', 4], ['Summon Greater Demon', 4],
  ['Summon Lesser Demon', 3], ['Synaptic Static', 5], ['Temple of the Gods', 7], ["Tenser's Transformation", 6], ['Thunder Step', 3],
  ['Thunderclap', 0], ['Tidal Wave', 3], ['Tiny Servant', 3], ['Toll the Dead', 0], ['Transmute Rock', 5],
  ['Vitriolic Sphere', 4], ['Wall of Light', 5], ['Wall of Sand', 3], ['Wall of Water', 3], ['Warding Wind', 2],
  ['Watery Sphere', 4], ['Whirlwind', 7], ['Word of Radiance', 0], ['Wrath of Nature', 5], ['Zephyr Strike', 1],
];

export const DND_2024_SPELL_INDEX_DATA: DndSpellIndexEntry[] = [
  ...SRD52_SPELL_ROWS.map(([name, level, verified]) => spellRow(name, level, 'dnd2024', verified)),
  ...TCOE_SPELL_ROWS.map(([name, level, verified]) => spellRow(name, level, 'tcoe', verified)),
  ...XGTE_SPELL_ROWS.map(([name, level, verified]) => spellRow(name, level, 'xgte', verified)),
];

export const DND_SPELL_INDEX_COUNTS = {
  srd52: SRD52_SPELL_ROWS.length,
  tcoe: TCOE_SPELL_ROWS.length,
  xgte: XGTE_SPELL_ROWS.length,
  total: 0, // recomputed below
};
DND_SPELL_INDEX_COUNTS.total =
  DND_SPELL_INDEX_COUNTS.srd52 + DND_SPELL_INDEX_COUNTS.tcoe + DND_SPELL_INDEX_COUNTS.xgte;
