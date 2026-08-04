import {
  personalBackgroundEntriesToBackgroundDefs,
  personalClassEntriesToClassDefs,
  personalEntriesToCharacterRuleProjections,
  personalFeatEntriesToFeatDefs,
  personalSpeciesEntriesToRaceDefs,
  personalSpellEntriesToSpellInfo,
} from './dndPersonalContentAdapter';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const species = personalSpeciesEntriesToRaceDefs([
  { compendiumEntryId: 'species_1', entryKind: 'species', displayName: 'Harbor Folk', content: { name: 'Harbor Folk', size: '中型', speedFeet: 35, summary: '海港来客', traits: ['潮汐适应'], heritageOptions: ['礁石血统'] }, metadata: {}, schemaVersion: 1 },
  { compendiumEntryId: 'feat_1', entryKind: 'feat', displayName: 'Ignored feat', content: {}, metadata: {}, schemaVersion: 1 },
  { compendiumEntryId: 'species_2', entryKind: 'species', displayName: 'Harbor Folk', content: {}, metadata: {}, schemaVersion: 1 },
]);

assert(species.length === 1, 'only one unique supported personal species should map');
assert(species[0]?.speed === 35 && species[0]?.features[0] === '潮汐适应', 'declared basic species fields should map');
assert(species[0]?.subraces[0]?.name === '礁石血统', 'heritage options should remain selectable');

const classes = personalClassEntriesToClassDefs([
  { compendiumEntryId: 'class_1', entryKind: 'class', displayName: '港湾守卫', content: { name: '港湾守卫', summary: '守卫海港与船员。', primaryAbility: 'Str', hitDice: 'D10', savingThrows: ['Str', 'Con'], weaponProficiencies: ['简单武器'], armorProficiencies: ['轻甲', '盾牌'], startingEquipment: '短剑与盾牌', features: [{ name: '港口巡防', desc: '熟悉码头上的危险。', unlockLevel: 1 }] }, metadata: {}, schemaVersion: 1 },
  { compendiumEntryId: 'subclass_1', entryKind: 'subclass', displayName: '潮汐卫士', content: { name: '潮汐卫士', className: '港湾守卫', summary: '以潮汐守护航道。', unlockLevel: 1, features: [{ name: '潮汐呼应', desc: '与港湾潮声保持同步。', unlockLevel: 1 }] }, metadata: {}, schemaVersion: 1 },
  { compendiumEntryId: 'subclass_2', entryKind: 'subclass', displayName: '无主子职业', content: { name: '无主子职业', className: '不存在的职业', unlockLevel: 1 }, metadata: {}, schemaVersion: 1 },
]);
assert(classes.length === 1 && classes[0]?.hitDice === 'D10', 'personal class should retain its declared hit die');
assert(classes[0]?.savingThrows.join(',') === 'Str,Con', 'personal class should retain valid save abilities only');
assert(classes[0]?.subclasses[0]?.name === '潮汐卫士', 'subclasses should attach only to the matching personal class');
assert(classes[0]?.features[0]?.name === '港口巡防', 'personal class features should remain reference text');

const backgrounds = personalBackgroundEntriesToBackgroundDefs([
  { compendiumEntryId: 'background_1', entryKind: 'background', displayName: '港口信使', content: { name: '港口信使', summary: '往返于港口之间。', skillProficiencies: ['察觉', '调查', '不存在的技能'], toolProficiencies: ['水手工具'], feature: { name: '港口人脉', desc: '可向熟悉的港口居民打听消息。' } }, metadata: {}, schemaVersion: 1 },
]);
assert(backgrounds.length === 1 && backgrounds[0]?.skillProficiencies.join(',') === '察觉,调查', 'background mapping should keep only known skill names');
assert(backgrounds[0]?.feature.name === '港口人脉', 'background feature text should map without effects');

const feats = personalFeatEntriesToFeatDefs([
  { compendiumEntryId: 'feat_2', entryKind: 'feat', displayName: '巷战直觉', content: { name: '巷战直觉', summary: '在狭窄地形中保持冷静。', category: 'Origin', prerequisiteDesc: '无' }, metadata: {}, schemaVersion: 1 },
]);
assert(feats.length === 1 && feats[0]?.category === 'Origin', 'origin feat should remain selectable');
assert(feats[0]?.checkPrereq({} as never) === true, 'personal feat must not evaluate custom rule code');

const spells = personalSpellEntriesToSpellInfo([
  { compendiumEntryId: 'spell_1', entryKind: 'spell', displayName: '海雾讯号', content: { name: '海雾讯号', level: 1, school: '惑控', castTime: '1 动作', range: '60 尺', duration: '1 分钟', components: 'V, S', summary: '在雾中传递一段短讯。' }, metadata: {}, schemaVersion: 1 },
]);
assert(spells.length === 1 && spells[0]?.level === 1 && spells[0]?.component.v && spells[0]?.component.s, 'basic personal spell facts should map to the spellbook shape');

const characterRules = personalEntriesToCharacterRuleProjections([
  {
    compendiumEntryId: 'class_rules_1',
    entryKind: 'class',
    displayName: '灵魂铸师',
    content: {
      name: '灵魂铸师',
      summary: '以灵魂线编织造物。',
      features: [
        { name: '灵魂容器', desc: '召唤一个灵魂容器。', unlockLevel: 1 },
        { name: '高阶编织', desc: '更高等级的特性。', unlockLevel: 5 },
      ],
      ruleComponents: {
        resources: [{ name: '灵魂线', maximum: '熟练加值', recovery: '长休', desc: '编织灵魂造物的资源。' }],
        actions: [{ name: '编织容器', activation: '1 动作', range: '30 尺', cost: '1 灵魂线', desc: '放置一个容器。' }],
        choices: [{ name: '灵魂技艺', requirement: '1 级', selection: '选择一项', options: ['守护', '侦察'] }],
        triggers: [{ name: '容器受击', desc: '可按描述触发反应。' }],
      },
    },
    metadata: {},
    schemaVersion: 1,
  },
  {
    compendiumEntryId: 'subclass_rules_1',
    entryKind: 'subclass',
    displayName: '守护织匠',
    content: {
      name: '守护织匠',
      className: '灵魂铸师',
      summary: '以守护为先。',
      features: [{ name: '守护编织', desc: '强化守护容器。', unlockLevel: 1 }],
      ruleComponents: { resources: [], actions: [], choices: [], triggers: [] },
    },
    metadata: {},
    schemaVersion: 1,
  },
  {
    compendiumEntryId: 'other_class_rules',
    entryKind: 'class',
    displayName: '不应出现的职业',
    content: { name: '不应出现的职业', ruleComponents: { resources: [{ name: '错误', maximum: '1', recovery: '长休' }] } },
    metadata: {},
    schemaVersion: 1,
  },
], { className: '灵魂铸师', subclassName: '守护织匠', characterLevel: 1 });
assert(characterRules.length === 2, 'only the selected personal class and subclass should project');
assert(characterRules[0]?.resources[0]?.name === '灵魂线', 'declared class resources should remain readable');
assert(characterRules[0]?.actions[0]?.cost === '1 灵魂线', 'declared action facts should remain readable');
assert(characterRules[0]?.features.length === 1, 'future-level features should stay hidden at the current character level');
assert(characterRules[1]?.features[0]?.name === '守护编织', 'selected subclass features should remain readable');
console.log('dnd-personal-content-adapter smoke: ok');
