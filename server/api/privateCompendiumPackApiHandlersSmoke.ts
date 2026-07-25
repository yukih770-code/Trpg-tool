/**
 * Private compendium pack API smoke — fake repositories only.
 *
 * This protects the ownership and immutable-publication boundary without requiring
 * a database, HTTP server, or frontend authoring screen.
 */

import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { CompendiumPackRecord, PublishPrivateCompendiumPackInput } from '../adapters/postgresPlatformFoundationRepository.js';
import type { WorldServerMembershipRecord, WorldServerRecord } from '../adapters/postgresWorldServerRepository.js';
import { createPrivateCompendiumPackApiHandlers } from './privateCompendiumPackApiHandlers.js';
import type { ServerApiResponse } from './apiResponse.js';

const owner: CurrentViewerContext = {
  viewerUserId: 'user_owner', isAuthenticated: true, authTrustLevel: 'dev_header',
  isDevOnly: true, isServiceInternal: false, notes: [],
};
const member: CurrentViewerContext = { ...owner, viewerUserId: 'user_member' };
const anonymous: CurrentViewerContext = {
  viewerUserId: null, isAuthenticated: false, authTrustLevel: 'anonymous',
  isDevOnly: false, isServiceInternal: false, notes: [],
};

const world: WorldServerRecord = {
  worldServerId: 'ws_main', ownerId: 'user_owner', serverHandle: 'main', displayName: 'Main',
  serverVisibility: 'private', joinPolicy: 'invite_only', lifecycleStatus: 'active',
  publicProfilePayload: {}, serverSettingsPayload: {}, softUpdatePolicyPayload: {}, schemaVersion: 1,
};
const membership: WorldServerMembershipRecord = {
  membershipId: 'member_1', worldServerId: 'ws_main', userId: 'user_member', roleKey: 'member',
  membershipStatus: 'active', payload: {}, schemaVersion: 1,
};
const existingPack: CompendiumPackRecord = {
  packId: 'pack_existing', ownerId: 'user_owner', worldServerId: 'ws_main', displayName: 'Existing',
  packKind: 'private', visibilityScope: 'server', lifecycleStatus: 'published', metadata: {},
};

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function hasStatus(response: ServerApiResponse<unknown>, statusCode: number): boolean {
  return response.ok === false && response.statusCode === statusCode;
}

export async function runPrivateCompendiumPackApiHandlersSmoke(): Promise<{
  total: number;
  passed: number;
  failed: number;
  cases: Array<{ name: string; passed: boolean; details?: string }>;
}> {
  let captured: PublishPrivateCompendiumPackInput | undefined;
  const handlers = createPrivateCompendiumPackApiHandlers({
    compendiumRepository: {
      async listCompendiumPacksByWorldServer(worldServerId) {
        return { ok: true, value: worldServerId === 'ws_main' ? [existingPack] : [] };
      },
    },
    worldRepository: {
      async getWorldServerById(worldServerId) {
        return { ok: true, value: worldServerId === 'ws_main' ? world : null };
      },
      async getWorldServerMembershipByUser(worldServerId, userId) {
        return { ok: true, value: worldServerId === 'ws_main' && userId === 'user_member' ? membership : null };
      },
    },
    async publish(input) {
      captured = input;
      return {
        ok: true,
        value: {
          pack: { ...existingPack, packId: input.packId, displayName: input.displayName },
          version: {
            packVersionId: input.packVersionId, packId: input.packId, versionLabel: input.versionLabel,
            manifest: input.manifest ?? {}, source: input.source ?? {}, rights: input.rights ?? {}, schemaVersion: 1,
          },
          entries: input.entries.map((entry) => ({
            compendiumEntryId: entry.compendiumEntryId, packVersionId: input.packVersionId,
            entryKind: entry.entryKind, displayName: entry.displayName, sourceRef: entry.sourceRef ?? {},
            contentRef: entry.contentRef ?? {}, metadata: entry.metadata ?? {}, schemaVersion: entry.schemaVersion ?? 1,
          })),
          binding: {
            packBindingId: input.packBindingId, worldServerId: input.worldServerId,
            packVersionId: input.packVersionId, bindingStatus: 'enabled', createdByUserId: input.ownerId,
            schemaVersion: 1,
          },
        },
      };
    },
  });
  const cases: Array<{ name: string; passed: boolean; details?: string }> = [];
  const request = (viewer: CurrentViewerContext, body?: Record<string, unknown>) => ({ viewer, params: { worldServerId: 'ws_main' }, body });
  async function check(name: string, run: () => Promise<void>): Promise<void> {
    try {
      await run();
      cases.push({ name, passed: true });
    } catch (error) {
      cases.push({ name, passed: false, details: error instanceof Error ? error.message : 'failed' });
    }
  }

  await check('01_anonymous_list_is_rejected', async () => {
    assert(hasStatus(await handlers.listPacks(request(anonymous)), 401), 'expected 401');
  });
  await check('02_member_can_list_server_packs', async () => {
    const result = await handlers.listPacks(request(member));
    assert(result.ok === true && Array.isArray(result.value) && result.value.length === 1, 'expected visible server pack');
  });
  await check('03_member_cannot_publish_pack', async () => {
    const result = await handlers.publishPack(request(member, { displayName: 'Denied', entries: [{ entryKind: 'species', displayName: 'No' }] }));
    assert(hasStatus(result, 403), 'expected 403');
  });
  await check('04_owner_publishes_private_pack_atomically', async () => {
    const result = await handlers.publishPack(request(owner, {
      displayName: 'Harbor Options', versionLabel: '1.0.0', metadata: { locale: 'zh-CN' },
      entries: [
        { entryKind: 'species', displayName: 'Harbor Folk', content: { speed: 30 }, metadata: { gameSystemId: 'dnd5e-2024' } },
        { entryKind: 'subclass', displayName: 'Tide Adept', content: { parentClassId: 'wizard' } },
      ],
    }));
    assert(result.ok === true && result.statusCode === 201, 'expected 201');
    assert(captured?.worldServerId === 'ws_main' && captured.ownerId === 'user_owner', 'expected server-owned publication');
    assert(captured?.entries.length === 2, 'expected all entries in one published version');
    assert(captured?.entries.every((entry) => entry.sourceRef?.sourceKind === 'private' && entry.sourceRef?.authorUserId === 'user_owner'), 'expected server-assigned private source references');
  });
  await check('05_unsupported_entry_kind_is_rejected', async () => {
    const before = captured;
    const result = await handlers.publishPack(request(owner, { displayName: 'Invalid', entries: [{ entryKind: 'official_override', displayName: 'No' }] }));
    assert(hasStatus(result, 400), 'expected 400');
    assert(captured === before, 'invalid entry must not reach publish seam');
  });
  await check('06_scope_conflict_is_rejected', async () => {
    const result = await handlers.listPacks({ ...request(owner), query: { worldServerId: 'ws_other' } });
    assert(hasStatus(result, 400), 'expected 400');
  });

  const passed = cases.filter((item) => item.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
