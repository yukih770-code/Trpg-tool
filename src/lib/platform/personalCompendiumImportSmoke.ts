import { parsePersonalCompendiumImport } from './personalCompendiumImport';

function expect(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const valid = parsePersonalCompendiumImport(JSON.stringify({
  displayName: '海港自定义资料',
  versionLabel: '1.2.0',
  metadata: { gameSystemId: 'dnd5e-2024' },
  entries: [
    { entryKind: 'species', displayName: '海岸民', content: { size: '中型' } },
    { entryKind: 'feat', displayName: '潮汐步伐' },
  ],
}));
expect(valid.ok && valid.draft.entries.length === 2 && valid.draft.versionLabel === '1.2.0', 'valid import should create a preview draft');
expect(parsePersonalCompendiumImport('{').ok === false, 'malformed JSON should be rejected');
expect(parsePersonalCompendiumImport(JSON.stringify({ displayName: 'x', entries: [{ entryKind: 'unknown', displayName: 'x' }] })).ok === false, 'unknown entry kinds should be rejected');
console.log('personal-compendium-import smoke: ok');
