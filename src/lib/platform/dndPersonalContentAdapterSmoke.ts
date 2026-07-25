import {
  personalBackgroundEntriesToBackgroundDefs,
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
console.log('dnd-personal-content-adapter smoke: ok');
