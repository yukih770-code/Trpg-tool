import {
  createPersonalCompendiumExport,
  parsePersonalCompendiumImport,
  suggestNextPersonalCompendiumVersionLabel,
} from './personalCompendiumImport';

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
const exported = createPersonalCompendiumExport({
  pack: { packId: 'private-pack-id', displayName: '海港资料', packKind: 'private', visibilityScope: 'user_private', lifecycleStatus: 'published', metadata: { gameSystemId: 'dnd5e-2024' } },
  version: { packVersionId: 'private-version-id', packId: 'private-pack-id', versionLabel: '1.2.0', manifest: {}, schemaVersion: 1 },
  entries: [{ compendiumEntryId: 'private-entry-id', entryKind: 'spell', displayName: '潮汐灯', content: { level: 1 }, metadata: {}, schemaVersion: 1 }],
}, '2026-08-15T00:00:00.000Z');
expect(exported.ok, 'owner version should export');
if (exported.ok) {
  expect(!exported.json.includes('private-pack-id') && !exported.json.includes('private-version-id') && !exported.json.includes('private-entry-id'), 'export must strip persistence identities');
  const roundTrip = parsePersonalCompendiumImport(exported.json);
  expect(roundTrip.ok && roundTrip.draft.entries[0]?.displayName === '潮汐灯', 'export should round-trip through import preview');
}
expect(parsePersonalCompendiumImport(JSON.stringify({ format: 'trpg-personal-compendium-pack', formatVersion: 2, displayName: 'x', entries: [{ entryKind: 'feat', displayName: 'x' }] })).ok === false, 'unsupported transfer versions should be rejected');
expect(suggestNextPersonalCompendiumVersionLabel('1.2.0', ['1.2.1', '1.2.2']) === '1.2.3', 'next semver label should skip existing versions');
expect(suggestNextPersonalCompendiumVersionLabel('draft', ['draft-next']) === 'draft-next-2', 'non-semver labels should remain conflict free');
console.log('personal-compendium-import smoke: ok');
