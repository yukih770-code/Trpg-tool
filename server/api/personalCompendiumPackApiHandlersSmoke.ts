import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { AppendUserPrivateCompendiumPackVersionInput, CompendiumEntryRecord, CompendiumPackRecord, PublishUserPrivateCompendiumPackInput } from '../adapters/postgresPlatformFoundationRepository.js';
import { createPersonalCompendiumPackApiHandlers } from './personalCompendiumPackApiHandlers.js';
import type { ServerApiResponse } from './apiResponse.js';

const owner: CurrentViewerContext = { viewerUserId: 'user_a', isAuthenticated: true, authTrustLevel: 'dev_header', isDevOnly: true, isServiceInternal: false, notes: [] };
const anotherUser: CurrentViewerContext = { ...owner, viewerUserId: 'user_b' };
const anonymous: CurrentViewerContext = { viewerUserId: null, isAuthenticated: false, authTrustLevel: 'anonymous', isDevOnly: false, isServiceInternal: false, notes: [] };
const userPack: CompendiumPackRecord = { packId: 'pack_a', ownerId: 'user_a', displayName: 'My Harbor Notes', packKind: 'private', visibilityScope: 'user_private', lifecycleStatus: 'published', metadata: {} };
const userEntry: CompendiumEntryRecord = { compendiumEntryId: 'entry_a', packVersionId: 'version_pack_a', entryKind: 'species', displayName: 'Harbor Folk', sourceRef: { authorUserId: 'user_a' }, contentRef: { speedFeet: 30 }, metadata: {}, schemaVersion: 1 };

function assert(condition: unknown, message: string): void { if (!condition) throw new Error(message); }
function hasStatus(response: ServerApiResponse<unknown>, statusCode: number): boolean { return response.ok === false && response.statusCode === statusCode; }

export async function runPersonalCompendiumPackApiHandlersSmoke(): Promise<{ total: number; passed: number; failed: number; cases: Array<{ name: string; passed: boolean; details?: string }> }> {
  let captured: PublishUserPrivateCompendiumPackInput | undefined;
  let appended: AppendUserPrivateCompendiumPackVersionInput | undefined;
  const handlers = createPersonalCompendiumPackApiHandlers({
    compendiumRepository: {
      async listUserPrivateCompendiumPacksByOwner(ownerId) {
        return { ok: true, value: ownerId === 'user_a' ? [userPack] : [] };
      },
      async listCompendiumPackVersions(packId) {
        return { ok: true, value: [
          { packVersionId: `version_${packId}_2`, packId, versionLabel: '1.1.0', manifest: { private: true }, source: { authorUserId: 'user_a' }, rights: { visibilityScope: 'user_private' }, schemaVersion: 1, createdAt: '2026-08-15T00:00:00.000Z' },
          { packVersionId: `version_${packId}`, packId, versionLabel: '1.0.0', manifest: {}, source: {}, rights: {}, schemaVersion: 1, createdAt: '2026-08-14T00:00:00.000Z' },
        ] };
      },
      async listCompendiumEntries(packVersionId) {
        return { ok: true, value: packVersionId === 'version_pack_a' ? [userEntry] : [] };
      },
    },
    async publish(input) {
      captured = input;
      return {
        ok: true,
        value: {
          pack: { ...userPack, packId: input.packId, displayName: input.displayName, ownerId: input.ownerId, worldServerId: undefined },
          version: { packVersionId: input.packVersionId, packId: input.packId, versionLabel: input.versionLabel, manifest: input.manifest ?? {}, source: input.source ?? {}, rights: input.rights ?? {}, schemaVersion: 1 },
          entries: input.entries.map((entry) => ({ compendiumEntryId: entry.compendiumEntryId, packVersionId: input.packVersionId, entryKind: entry.entryKind, displayName: entry.displayName, sourceRef: entry.sourceRef ?? {}, contentRef: entry.contentRef ?? {}, metadata: entry.metadata ?? {}, schemaVersion: entry.schemaVersion ?? 1 })),
        },
      };
    },
    async appendVersion(input) {
      appended = input;
      return {
        ok: true,
        value: {
          pack: userPack,
          version: { packVersionId: input.packVersionId, packId: input.packId, versionLabel: input.versionLabel, manifest: input.manifest ?? {}, source: input.source ?? {}, rights: input.rights ?? {}, schemaVersion: 1 },
          entries: input.entries.map((entry) => ({ compendiumEntryId: entry.compendiumEntryId, packVersionId: input.packVersionId, entryKind: entry.entryKind, displayName: entry.displayName, sourceRef: entry.sourceRef ?? {}, contentRef: entry.contentRef ?? {}, metadata: entry.metadata ?? {}, schemaVersion: entry.schemaVersion ?? 1 })),
        },
      };
    },
  });
  const cases: Array<{ name: string; passed: boolean; details?: string }> = [];
  async function check(name: string, run: () => Promise<void>): Promise<void> {
    try { await run(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, details: error instanceof Error ? error.message : 'failed' }); }
  }
  await check('01_anonymous_personal_library_is_rejected', async () => {
    assert(hasStatus(await handlers.listPacks({ viewer: anonymous }), 401), 'expected 401');
  });
  await check('02_user_lists_only_own_private_packs', async () => {
    const result = await handlers.listPacks({ viewer: owner });
    assert(result.ok === true && Array.isArray(result.value) && result.value[0]?.ownerId === 'user_a', 'expected own pack');
    const other = await handlers.listPacks({ viewer: anotherUser });
    assert(other.ok === true && Array.isArray(other.value) && other.value.length === 0, 'must not receive another user pack');
  });
  await check('03_authenticated_user_publishes_owner_scoped_pack_without_server_binding', async () => {
    const result = await handlers.publishPack({ viewer: owner, body: { displayName: 'My Species', entries: [{ entryKind: 'species', displayName: 'Harbor Folk', content: { speed: 30 } }], worldServerId: 'ignored', ownerId: 'ignored', visibilityScope: 'server' } });
    assert(result.ok === true && result.statusCode === 201, 'expected 201');
    assert(captured?.ownerId === 'user_a', 'owner must be derived from authenticated viewer');
    assert(captured && !('worldServerId' in captured), 'personal publication must not create a server binding');
    assert(captured?.rights?.visibilityScope === 'user_private', 'visibility must be assigned by server');
    assert(captured?.entries[0]?.sourceRef?.authorUserId === 'user_a', 'source author must be server-assigned');
  });
  await check('03a_owner_lists_bounded_version_summaries_without_private_manifest', async () => {
    const result = await handlers.listPackVersions('pack_a', { viewer: owner });
    assert(result.ok === true && Array.isArray(result.value) && result.value.length === 2, 'owner should receive version history');
    const first = result.ok === true ? (result.value as Array<Record<string, unknown>>)[0] : undefined;
    assert(first?.versionLabel === '1.1.0' && !('manifest' in first) && !('source' in first) && !('rights' in first), 'history must be a compact safe projection');
  });
  await check('03b_non_owner_cannot_discover_version_history', async () => {
    assert(hasStatus(await handlers.listPackVersions('pack_a', { viewer: anotherUser }), 404), 'expected not found for another user');
  });
  await check('04_unsupported_entry_kind_is_rejected', async () => {
    const before = captured;
    const result = await handlers.publishPack({ viewer: owner, body: { displayName: 'Invalid', entries: [{ entryKind: 'official_override', displayName: 'No' }] } });
    assert(hasStatus(result, 400), 'expected 400');
    assert(captured === before, 'invalid entry must not reach publish seam');
  });
  await check('05_owner_can_append_an_immutable_personal_pack_version', async () => {
    const result = await handlers.publishVersion('pack_a', { viewer: owner, body: { versionLabel: '1.1.0', entries: [{ entryKind: 'species', displayName: 'Updated Harbor Folk', content: { speed: 35 } }] } });
    assert(result.ok === true && result.statusCode === 201, 'expected 201');
    assert(appended?.packId === 'pack_a' && appended.ownerId === 'user_a', 'append must be owner-scoped');
    assert(appended?.versionLabel === '1.1.0', 'version label should be preserved');
    assert(appended?.rights?.visibilityScope === 'user_private', 'append must remain private');
  });
  await check('06_owner_can_read_a_compact_personal_pack_version_projection', async () => {
    const result = await handlers.getPackVersion('pack_a', 'version_pack_a', { viewer: owner });
    assert(result.ok === true && !('ownerId' in (result.value as { pack?: Record<string, unknown> }).pack!), 'owner id must not enter the version projection');
    assert(result.ok === true && (result.value as { entries?: Array<{ content?: { speedFeet?: number } }> }).entries?.[0]?.content?.speedFeet === 30, 'owner should receive declared entry content');
  });
  await check('07_other_user_cannot_discover_or_read_personal_pack_version', async () => {
    assert(hasStatus(await handlers.getPackVersion('pack_a', 'version_pack_a', { viewer: anotherUser }), 404), 'expected not found for another user');
  });
  const passed = cases.filter((item) => item.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
