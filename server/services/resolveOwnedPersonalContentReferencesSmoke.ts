import { resolveOwnedPersonalContentReferences } from './resolveOwnedPersonalContentReferences.js';

const packs = new Map([
  ['pack_owned', { packId: 'pack_owned', ownerId: 'user_owner', displayName: '海岸种族补充', packKind: 'private', visibilityScope: 'user_private', lifecycleStatus: 'published', metadata: {} }],
  ['pack_other', { packId: 'pack_other', ownerId: 'user_other', displayName: '别人的资料', packKind: 'private', visibilityScope: 'user_private', lifecycleStatus: 'published', metadata: {} }],
  ['pack_server', { packId: 'pack_server', ownerId: 'user_owner', worldServerId: 'world_1', displayName: '服务器资料', packKind: 'private', visibilityScope: 'server_private', lifecycleStatus: 'published', metadata: {} }],
]);
const versions = new Map([
  ['version_owned', { packVersionId: 'version_owned', packId: 'pack_owned', versionLabel: '1.0.0', manifest: {}, source: {}, rights: {}, schemaVersion: 1 }],
  ['version_other', { packVersionId: 'version_other', packId: 'pack_other', versionLabel: '1.0.0', manifest: {}, source: {}, rights: {}, schemaVersion: 1 }],
  ['version_server', { packVersionId: 'version_server', packId: 'pack_server', versionLabel: '1.0.0', manifest: {}, source: {}, rights: {}, schemaVersion: 1 }],
]);
const repository = {
  getCompendiumPackById: async (packId: string) => ({ ok: true as const, value: packs.get(packId) ?? null }),
  getCompendiumPackVersionById: async (versionId: string) => ({ ok: true as const, value: versions.get(versionId) ?? null }),
};

const owned = await resolveOwnedPersonalContentReferences(repository, { viewerUserId: 'user_owner', references: [{ packId: 'pack_owned', packVersionId: 'version_owned' }] });
const foreign = await resolveOwnedPersonalContentReferences(repository, { viewerUserId: 'user_owner', references: [{ packId: 'pack_other', packVersionId: 'version_other' }] });
const serverBound = await resolveOwnedPersonalContentReferences(repository, { viewerUserId: 'user_owner', references: [{ packId: 'pack_server', packVersionId: 'version_server' }] });
const mismatch = await resolveOwnedPersonalContentReferences(repository, { viewerUserId: 'user_owner', references: [{ packId: 'pack_owned', packVersionId: 'version_other' }] });
const malformed = await resolveOwnedPersonalContentReferences(repository, { viewerUserId: 'user_owner', references: [{ packId: 'pack_owned' }] });

const passed = owned.ok && owned.references[0]?.displayName === '海岸种族补充' && owned.references[0]?.versionLabel === '1.0.0'
  && foreign.ok === false && foreign.code === 'not_found'
  && serverBound.ok === false && serverBound.code === 'not_found'
  && mismatch.ok === false && mismatch.code === 'not_found'
  && malformed.ok === false && malformed.code === 'invalid';

console.log(JSON.stringify({ total: 5, passed: passed ? 5 : 0, failed: passed ? 0 : 5, cases: ['owned reference', 'hide foreign pack', 'reject server-bound pack', 'reject mismatched version', 'reject malformed reference'] }, null, 2));
if (!passed) process.exitCode = 1;
