/** Dependency-free checks for the server content-set resolution contract. */

import {
  contentEntryRefKey,
  isContentEntryResolved,
  resolveServerContentSet,
  type ContentEntryRecord,
} from './serverContentSet';

export interface ServerContentSetSmokeCase {
  name: string;
  pass: boolean;
}

export interface ServerContentSetSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: ServerContentSetSmokeCase[];
}

const SOURCE_SPECIES = { packVersionId: 'dnd2024-core@1', entryId: 'species-elf' };
const CUSTOM_SPECIES = { packVersionId: 'server-private@1', entryId: 'species-moon-elf' };

const catalog: ContentEntryRecord[] = [
  { ...SOURCE_SPECIES, kind: 'species', displayName: 'Elf', sourceKind: 'ownerSource', revisionId: 'rev-core-elf-1' },
  { ...CUSTOM_SPECIES, kind: 'species', displayName: 'Moon Elf', sourceKind: 'private', revisionId: 'rev-private-moon-elf-1', replaces: SOURCE_SPECIES },
  { packVersionId: 'disabled-pack@1', entryId: 'species-orc', kind: 'species', displayName: 'Orc', sourceKind: 'ownerSource', revisionId: 'rev-core-orc-1' },
];

export function runServerContentSetSmoke(): ServerContentSetSmokeReport {
  const sourceOnly = resolveServerContentSet(catalog, {
    enabledPackVersionIds: ['dnd2024-core@1'],
    entryPolicies: [],
  });
  const disabled = resolveServerContentSet(catalog, {
    enabledPackVersionIds: ['dnd2024-core@1'],
    entryPolicies: [{ status: 'disabled', target: SOURCE_SPECIES, note: 'Server theme' }],
  });
  const replacement = resolveServerContentSet(catalog, {
    enabledPackVersionIds: ['dnd2024-core@1', 'server-private@1'],
    entryPolicies: [{ status: 'replacement', target: SOURCE_SPECIES, replacement: CUSTOM_SPECIES }],
  });
  const invalidReplacement = resolveServerContentSet(catalog, {
    enabledPackVersionIds: ['dnd2024-core@1'],
    entryPolicies: [{ status: 'replacement', target: SOURCE_SPECIES, replacement: CUSTOM_SPECIES }],
  });

  const cases: ServerContentSetSmokeCase[] = [
    { name: 'source.enabled', pass: sourceOnly.entries.length === 1 && sourceOnly.entries[0].entry.entryId === 'species-elf' },
    { name: 'unboundPack.hidden', pass: sourceOnly.entries.every((entry) => entry.entry.packVersionId !== 'disabled-pack@1') },
    { name: 'disabled.omitsNewCatalogEntry', pass: disabled.entries.length === 0 },
    { name: 'replacement.usesSeparatePrivateRevision', pass: replacement.entries.length === 1 && replacement.entries[0].entry.entryId === 'species-moon-elf' && replacement.entries[0].provenance === 'serverReplacement' },
    { name: 'replacement.retainsSourceReference', pass: replacement.entries[0].replaces !== undefined && contentEntryRefKey(replacement.entries[0].replaces!) === contentEntryRefKey(SOURCE_SPECIES) },
    { name: 'missingReplacement.neverGuessed', pass: invalidReplacement.entries.length === 1 && invalidReplacement.unresolvedPolicies.length === 1 },
    { name: 'resolvedReference.isExact', pass: isContentEntryResolved(replacement, CUSTOM_SPECIES) && !isContentEntryResolved(replacement, SOURCE_SPECIES) },
  ];
  const passed = cases.filter((item) => item.pass).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}

const report = runServerContentSetSmoke();
if (report.failed > 0) {
  throw new Error(`Server content-set smoke failed: ${report.cases.filter((item) => !item.pass).map((item) => item.name).join(', ')}`);
}
console.log(JSON.stringify(report, null, 2));
