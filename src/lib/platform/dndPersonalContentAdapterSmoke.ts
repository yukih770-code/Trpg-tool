import { personalSpeciesEntriesToRaceDefs } from './dndPersonalContentAdapter';

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
console.log('dnd-personal-content-adapter smoke: ok');
