/**
 * P5.API-CORE handler smoke — fake repositories only, no Postgres and no HTTP.
 * The cases intentionally exercise auth, scope, access, management, workflow,
 * versioning, multiple game systems, and safe error mapping.
 */

import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type {
  WorldServerApiRepository,
  WorldServerFoundationRepository,
  WorldServerApiHandlers,
} from './worldServerApiHandlers.js';
import { createWorldServerApiHandlers } from './worldServerApiHandlers.js';
import type {
  WorldServerGameSystemBindingRecord,
  WorldServerInviteRecord,
  WorldServerJoinRequestRecord,
  WorldServerMembershipRecord,
  WorldServerRecord,
  WorldServerRoleRecord,
} from '../adapters/postgresWorldServerRepository.js';
import type {
  WorldServerRulesetVersionRecord,
  WorldServerSettingsVersionRecord,
} from '../adapters/postgresPlatformFoundationRepository.js';
import type { ServerApiResponse } from './apiResponse.js';

type Plain = Record<string, unknown>;

const owner: CurrentViewerContext = {
  viewerUserId: 'user_owner', isAuthenticated: true, authTrustLevel: 'dev_header',
  isDevOnly: true, isServiceInternal: false, notes: [],
};
const admin: CurrentViewerContext = { ...owner, viewerUserId: 'user_admin' };
const member: CurrentViewerContext = { ...owner, viewerUserId: 'user_member' };
const inactive: CurrentViewerContext = { ...owner, viewerUserId: 'user_inactive' };
const outsider: CurrentViewerContext = { ...owner, viewerUserId: 'user_outsider' };
const anonymous: CurrentViewerContext = {
  viewerUserId: null, isAuthenticated: false, authTrustLevel: 'anonymous',
  isDevOnly: false, isServiceInternal: false, notes: [],
};

function server(id: string, ownerId = 'user_owner'): WorldServerRecord {
  return {
    worldServerId: id, ownerId, serverHandle: id, displayName: `Server ${id}`,
    description: 'fake', serverVisibility: 'private', joinPolicy: 'invite_only',
    lifecycleStatus: 'active', defaultGameSystemId: undefined,
    publicProfilePayload: {}, serverSettingsPayload: {}, softUpdatePolicyPayload: {}, schemaVersion: 1,
  };
}

function membership(id: string, userId: string, status: string, roleKey: string): WorldServerMembershipRecord {
  return {
    membershipId: id, worldServerId: 'ws_main', userId, roleKey, membershipStatus: status,
    payload: {}, schemaVersion: 1,
  };
}

function gameBinding(id: string, systemId: string, isDefault = false): WorldServerGameSystemBindingRecord {
  return {
    bindingId: id, worldServerId: 'ws_main', gameSystemId: systemId, displayName: systemId,
    systemKind: 'ruleset', bindingStatus: 'active', isDefault, config: {}, enabledPackVersionIds: [], schemaVersion: 1,
  };
}

function createFakeRepositories(): { world: WorldServerApiRepository; foundation: WorldServerFoundationRepository } {
  const servers = new Map<string, WorldServerRecord>([['ws_main', server('ws_main')], ['ws_other', server('ws_other', 'user_other')]]);
  const memberships = new Map<string, WorldServerMembershipRecord>([
    ['m_admin', membership('m_admin', 'user_admin', 'active', 'admin')],
    ['m_member', membership('m_member', 'user_member', 'active', 'member')],
    ['m_inactive', membership('m_inactive', 'user_inactive', 'suspended', 'member')],
  ]);
  const roles = new Map<string, WorldServerRoleRecord>();
  const invites = new Map<string, WorldServerInviteRecord>();
  const joinRequests = new Map<string, WorldServerJoinRequestRecord>();
  const gameSystems = new Map<string, WorldServerGameSystemBindingRecord>([['gs_dnd', gameBinding('gs_dnd', 'dnd5e-2024', true)]]);
  const settingsVersions: WorldServerSettingsVersionRecord[] = [];
  const rulesetVersions: WorldServerRulesetVersionRecord[] = [];

  const world: WorldServerApiRepository = {
    async getWorldServerById(id) { return { ok: true, value: servers.get(id) ?? null }; },
    async listWorldServersByOwner(ownerId) { return { ok: true, value: [...servers.values()].filter((item) => item.ownerId === ownerId) }; },
    async listWorldServerMembershipsForUser(userId) { return { ok: true, value: [...memberships.values()].filter((item) => item.userId === userId) }; },
    async getWorldServerMembershipByUser(worldServerId, userId) { return { ok: true, value: [...memberships.values()].find((item) => item.worldServerId === worldServerId && item.userId === userId) ?? null }; },
    async createWorldServer(input) { const value = server(input.worldServerId, input.ownerId); value.serverHandle = input.serverHandle; value.displayName = input.displayName; servers.set(value.worldServerId, value); return { ok: true, value }; },
    async updateWorldServerProfile(input) { const value = servers.get(input.worldServerId); if (!value) return { ok: true, value: null }; Object.assign(value, { displayName: input.displayName ?? value.displayName, description: input.description ?? value.description, serverVisibility: input.serverVisibility ?? value.serverVisibility, joinPolicy: input.joinPolicy ?? value.joinPolicy }); return { ok: true, value }; },
    async updateWorldServerSettings(input) { const value = servers.get(input.worldServerId); if (!value) return { ok: true, value: null }; if (input.defaultGameSystemId !== undefined) value.defaultGameSystemId = input.defaultGameSystemId; if (input.serverSettingsPayload) value.serverSettingsPayload = input.serverSettingsPayload; if (input.softUpdatePolicyPayload) value.softUpdatePolicyPayload = input.softUpdatePolicyPayload; return { ok: true, value }; },
    async archiveWorldServer(id) { const value = servers.get(id); if (!value) return { ok: true, value: null }; value.archivedAt = new Date().toISOString(); value.lifecycleStatus = 'archived'; return { ok: true, value }; },
    async restoreWorldServer(id) { const value = servers.get(id); if (!value) return { ok: true, value: null }; value.archivedAt = undefined; value.lifecycleStatus = 'active'; return { ok: true, value }; },
    async listWorldServerMemberships(id) { return { ok: true, value: [...memberships.values()].filter((item) => item.worldServerId === id) }; },
    async getWorldServerMembershipById(id) { return { ok: true, value: memberships.get(id) ?? null }; },
    async updateWorldServerMembership(input) { const value = memberships.get(input.membershipId); if (!value) return { ok: true, value: null }; Object.assign(value, { roleId: input.roleId ?? value.roleId, roleKey: input.roleKey ?? value.roleKey, displayAlias: input.displayAlias ?? value.displayAlias }); return { ok: true, value }; },
    async updateWorldServerMembershipStatus(input) { const value = memberships.get(input.membershipId); if (!value) return { ok: true, value: null }; value.membershipStatus = input.membershipStatus; return { ok: true, value }; },
    async listWorldServerRoles(id) { return { ok: true, value: [...roles.values()].filter((item) => item.worldServerId === id) }; },
    async getWorldServerRoleById(id) { return { ok: true, value: roles.get(id) ?? null }; },
    async createWorldServerRole(input) { const value: WorldServerRoleRecord = { roleId: input.roleId, worldServerId: input.worldServerId, roleKey: input.roleKey, displayName: input.displayName, roleKind: input.roleKind ?? 'custom', permissionsPayload: input.permissionsPayload ?? {}, isSystemRole: input.isSystemRole ?? false, sortOrder: input.sortOrder ?? 0, schemaVersion: 1 }; roles.set(value.roleId, value); return { ok: true, value }; },
    async updateWorldServerRole(input) { const value = roles.get(input.roleId); if (!value) return { ok: true, value: null }; Object.assign(value, { displayName: input.displayName ?? value.displayName, roleKind: input.roleKind ?? value.roleKind }); return { ok: true, value }; },
    async listWorldServerInvites(id) { return { ok: true, value: [...invites.values()].filter((item) => item.worldServerId === id) }; },
    async createWorldServerInvite(input) { const value: WorldServerInviteRecord = { inviteId: input.inviteId, worldServerId: input.worldServerId, inviteCode: input.inviteCode, createdByUserId: input.createdByUserId, targetUserId: input.targetUserId, targetEmail: input.targetEmail, defaultRoleKey: input.defaultRoleKey ?? 'member', inviteStatus: 'active', maxUses: input.maxUses, useCount: 0, expiresAt: input.expiresAt, payload: input.payload ?? {}, schemaVersion: 1 }; invites.set(input.inviteId, value); return { ok: true, value }; },
    async getWorldServerInviteById(id) { return { ok: true, value: invites.get(id) ?? null }; },
    async updateWorldServerInviteStatus(input) { const value = invites.get(input.inviteId); if (!value) return { ok: true, value: null }; value.inviteStatus = input.inviteStatus; return { ok: true, value }; },
    async listWorldServerJoinRequests(id) { return { ok: true, value: [...joinRequests.values()].filter((item) => item.worldServerId === id) }; },
    async listWorldServerJoinRequestsForUser(userId) { return { ok: true, value: [...joinRequests.values()].filter((item) => item.requesterUserId === userId) }; },
    async getWorldServerJoinRequestById(id) { return { ok: true, value: joinRequests.get(id) ?? null }; },
    async createWorldServerJoinRequest(input) { const value: WorldServerJoinRequestRecord = { joinRequestId: input.joinRequestId, worldServerId: input.worldServerId, requesterUserId: input.requesterUserId, requestStatus: input.requestStatus ?? 'pending', requestMessage: input.requestMessage, requestedRoleKey: input.requestedRoleKey ?? 'member', payload: input.payload ?? {}, schemaVersion: 1 }; joinRequests.set(value.joinRequestId, value); return { ok: true, value }; },
    async updateWorldServerJoinRequestStatus(input) { const value = joinRequests.get(input.joinRequestId); if (!value) return { ok: true, value: null }; value.requestStatus = input.requestStatus; value.reviewedByUserId = input.reviewedByUserId; value.responseMessage = input.responseMessage; return { ok: true, value }; },
    async listGameSystemBindingsByWorldServer(id) { return { ok: true, value: [...gameSystems.values()].filter((item) => item.worldServerId === id) }; },
    async getWorldServerGameSystemBinding(id) { return { ok: true, value: gameSystems.get(id) ?? null }; },
    async bindGameSystemToWorldServer(input) { const value = gameBinding(input.bindingId, input.gameSystemId, input.isDefault); value.worldServerId = input.worldServerId; value.displayName = input.displayName; gameSystems.set(value.bindingId, value); return { ok: true, value }; },
    async updateWorldServerGameSystemBinding(input) { const value = gameSystems.get(input.bindingId); if (!value) return { ok: true, value: null }; Object.assign(value, { displayName: input.displayName ?? value.displayName, isDefault: input.isDefault ?? value.isDefault }); return { ok: true, value }; },
    async archiveWorldServerGameSystemBinding(id) { const value = gameSystems.get(id); if (!value) return { ok: true, value: null }; value.archivedAt = new Date().toISOString(); value.bindingStatus = 'archived'; return { ok: true, value }; },
    async restoreWorldServerGameSystemBinding(id) { const value = gameSystems.get(id); if (!value) return { ok: true, value: null }; value.archivedAt = undefined; value.bindingStatus = 'active'; return { ok: true, value }; },
  };

  const foundation: WorldServerFoundationRepository = {
    async listWorldServerSettingsVersions() { return { ok: true, value: settingsVersions }; },
    async createWorldServerSettingsVersion(input) { const value: WorldServerSettingsVersionRecord = { ...input, settingsPayload: input.settingsPayload ?? {}, softUpdatePolicyPayload: input.softUpdatePolicyPayload ?? {}, createdAt: new Date().toISOString() }; settingsVersions.push(value); return { ok: true, value }; },
    async listWorldServerRulesetVersions(_id, gameSystemId) { return { ok: true, value: rulesetVersions.filter((item) => !gameSystemId || item.gameSystemId === gameSystemId) }; },
    async createWorldServerRulesetVersion(input) { const value: WorldServerRulesetVersionRecord = { ...input, lifecycleStatus: input.lifecycleStatus ?? 'draft', rulesetPayload: input.rulesetPayload ?? {}, compatibilityPayload: input.compatibilityPayload ?? {}, schemaVersion: 1, createdAt: new Date().toISOString() }; rulesetVersions.push(value); return { ok: true, value }; },
  };
  return { world, foundation };
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function isSuccess<T>(response: ServerApiResponse<T>): response is { ok: true; statusCode: number; value: T; requestId?: string } {
  return response.ok === true;
}

function isStatus(response: ServerApiResponse<unknown>, status: number): boolean {
  return response.ok === false && response.statusCode === status;
}

export async function runWorldServerApiHandlersSmoke(): Promise<{ total: number; passed: number; failed: number; cases: Array<{ name: string; passed: boolean; details?: string }> }> {
  const { world, foundation } = createFakeRepositories();
  const handlers: WorldServerApiHandlers = createWorldServerApiHandlers({ worldServerRepository: world, foundationRepository: foundation, allowDevAuthHeaders: true, nodeEnv: 'development' });
  const cases: Array<{ name: string; passed: boolean; details?: string }> = [];
  async function check(name: string, run: () => Promise<unknown>): Promise<void> {
    try { await run(); cases.push({ name, passed: true }); } catch (error) { cases.push({ name, passed: false, details: error instanceof Error ? error.message : 'failed' }); }
  }
  const req = (viewer: CurrentViewerContext, params: Plain, body?: Plain, query?: Plain) => ({ viewer, params, body, query });
  const ws = { worldServerId: 'ws_main' };

  const expectSuccess = async (run: () => Promise<ServerApiResponse<unknown>>, label: string): Promise<unknown> => {
    const result = await run();
    if (!isSuccess(result)) throw new Error(label);
    return result.value;
  };
  const expectStatus = async (run: () => Promise<ServerApiResponse<unknown>>, status: number): Promise<void> => {
    assert(isStatus(await run(), status), `expected status ${status}`);
  };

  await check('01_anonymous_list_401', async () => expectStatus(() => handlers.listWorldServers(req(anonymous, {})), 401));
  await check('02_anonymous_create_401', async () => expectStatus(() => handlers.createWorldServer(req(anonymous, {}, { displayName: 'x', serverHandle: 'x' })), 401));
  await check('03_dev_header_auth_boundary', async () => expectSuccess(() => handlers.listWorldServers({ headers: { 'x-dev-user-id': 'user_owner' } }), 'expected dev header list'));
  await check('04_authenticated_create_success', async () => expectSuccess(() => handlers.createWorldServer(req(owner, {}, { displayName: 'New', serverHandle: 'new' })), 'expected create'));
  await check('05_owner_detail_success', async () => expectSuccess(() => handlers.getWorldServer(req(owner, ws)), 'expected owner detail'));
  await check('06_non_member_detail_hidden', async () => expectStatus(() => handlers.getWorldServer(req(outsider, ws)), 404));
  await check('07_active_member_detail_success', async () => expectSuccess(() => handlers.getWorldServer(req(member, ws)), 'expected member detail'));
  await check('08_owner_update_success', async () => expectSuccess(() => handlers.updateWorldServer(req(owner, ws, { displayName: 'Updated' })), 'expected update'));
  await check('09_member_update_denied', async () => expectStatus(() => handlers.updateWorldServer(req(member, ws, { displayName: 'no' })), 403));
  await check('10_owner_list_members', async () => expectSuccess(() => handlers.listMembers(req(owner, ws)), 'expected members'));
  await check('11_member_list_members', async () => expectSuccess(() => handlers.listMembers(req(member, ws)), 'expected member read'));
  await check('12_anonymous_members_denied', async () => expectStatus(() => handlers.listMembers(req(anonymous, ws)), 401));
  await check('13_admin_create_role', async () => expectSuccess(() => handlers.createRole(req(admin, ws, { roleKey: 'helper', displayName: 'Helper' })), 'expected role'));
  await check('14_member_create_role_denied', async () => expectStatus(() => handlers.createRole(req(member, ws, { roleKey: 'no', displayName: 'No' })), 403));
  await check('15_owner_update_role', async () => {
    const value = await expectSuccess(() => handlers.createRole(req(owner, ws, { roleKey: 'editor', displayName: 'Editor' })), 'create role');
    const roleId = (value as WorldServerRoleRecord).roleId;
    await expectSuccess(() => handlers.updateRole(req(owner, { ...ws, roleId }, { displayName: 'Editor 2' })), 'update role');
  });
  await check('16_inactive_member_denied', async () => expectStatus(() => handlers.listMembers(req(inactive, ws)), 404));
  await check('17_owner_create_personal_invite', async () => {
    const value = await expectSuccess(() => handlers.createInvite(req(owner, ws, {})), 'expected invite') as WorldServerInviteRecord;
    assert(value.maxUses === 1, 'personal invite must default to one use');
  });
  await check('18_member_create_invite_denied', async () => expectStatus(() => handlers.createInvite(req(member, ws, {})), 403));
  await check('19_member_list_invites_denied', async () => expectStatus(() => handlers.listInvites(req(member, ws)), 403));
  await check('20_owner_revoke_invite', async () => {
    const value = await expectSuccess(() => handlers.listInvites(req(owner, ws)), 'expected invite list') as WorldServerInviteRecord[];
    await expectSuccess(() => handlers.revokeInvite(req(owner, { ...ws, inviteId: value[0].inviteId })), 'expected revoke');
  });
  await check('21_authenticated_join_request', async () => expectSuccess(() => handlers.createJoinRequest(req(outsider, ws, { requestMessage: 'hello' })), 'expected join request'));
  await check('22_anonymous_join_request_401', async () => expectStatus(() => handlers.createJoinRequest(req(anonymous, ws, {})), 401));
  await check('23_admin_review_join_request', async () => {
    const value = await expectSuccess(() => handlers.listJoinRequests(req(owner, ws)), 'list');
    const id = (value as WorldServerJoinRequestRecord[])[0].joinRequestId;
    await expectSuccess(() => handlers.reviewJoinRequest(req(admin, { joinRequestId: id }, { requestStatus: 'approved' })), 'expected review');
  });
  await check('24_member_review_join_request_denied', async () => {
    const value = await expectSuccess(() => handlers.listJoinRequests(req(owner, ws)), 'list');
    const id = (value as WorldServerJoinRequestRecord[])[0].joinRequestId;
    await expectStatus(() => handlers.reviewJoinRequest(req(member, { joinRequestId: id }, { requestStatus: 'rejected' })), 403);
  });
  await check('23_owner_read_settings', async () => expectSuccess(() => handlers.getSettings(req(owner, ws)), 'expected settings'));
  await check('24_member_read_settings', async () => expectSuccess(() => handlers.getSettings(req(member, ws)), 'expected settings'));
  await check('25_outsider_settings_hidden', async () => expectStatus(() => handlers.getSettings(req(outsider, ws)), 404));
  await check('26_owner_patch_settings', async () => expectSuccess(() => handlers.patchSettings(req(owner, ws, { settings: { chat: 'restricted' } })), 'expected patch'));
  await check('27_admin_patch_settings', async () => expectSuccess(() => handlers.patchSettings(req(admin, ws, { settings: { chat: 'members' } })), 'expected patch'));
  await check('28_member_patch_settings_denied', async () => expectStatus(() => handlers.patchSettings(req(member, ws, { settings: {} })), 403));
  await check('29_settings_version_success', async () => expectSuccess(() => handlers.createSettingsVersion(req(owner, ws, { settingsPayload: { version: 1 } })), 'expected version'));
  await check('30_ruleset_version_success', async () => expectSuccess(() => handlers.createRulesetVersion(req(owner, ws, { gameSystemId: 'dnd5e-2024', versionLabel: '2024' })), 'expected ruleset'));
  await check('31_member_ruleset_version_denied', async () => expectStatus(() => handlers.createRulesetVersion(req(member, ws, { gameSystemId: 'dnd5e-2024', versionLabel: 'no' })), 403));
  await check('32_owner_list_game_systems', async () => expectSuccess(() => handlers.listGameSystems(req(owner, ws)), 'expected systems'));
  await check('33_owner_bind_game_system', async () => expectSuccess(() => handlers.createGameSystem(req(owner, ws, { gameSystemId: 'coc7e', displayName: 'COC 7e' })), 'expected bind'));
  await check('34_member_bind_game_system_denied', async () => expectStatus(() => handlers.createGameSystem(req(member, ws, { gameSystemId: 'cp-red', displayName: 'CP RED' })), 403));
  await check('35_multiple_systems_allowed', async () => { const value = await expectSuccess(() => handlers.listGameSystems(req(owner, ws)), 'expected systems'); assert((value as WorldServerGameSystemBindingRecord[]).length >= 2, 'expected multiple systems'); });
  await check('36_default_does_not_remove_other_systems', async () => { await expectSuccess(() => handlers.createGameSystem(req(owner, ws, { gameSystemId: 'cp-red', displayName: 'CP RED', isDefault: true })), 'bind'); const value = await expectSuccess(() => handlers.listGameSystems(req(owner, ws)), 'list'); assert((value as WorldServerGameSystemBindingRecord[]).length >= 3, 'expected systems retained'); });
  await check('37_archive_game_system_requires_management', async () => { const value = await expectSuccess(() => handlers.createGameSystem(req(owner, ws, { gameSystemId: 'generic-d20', displayName: 'Generic d20' })), 'bind'); const id = (value as WorldServerGameSystemBindingRecord).bindingId; await expectSuccess(() => handlers.archiveGameSystem(req(owner, { ...ws, bindingId: id })), 'archive'); });
  await check('38_restore_game_system_requires_management', async () => { const value = await expectSuccess(() => handlers.createGameSystem(req(owner, ws, { gameSystemId: 'generic-percentile', displayName: 'Percentile' })), 'bind'); const id = (value as WorldServerGameSystemBindingRecord).bindingId; await expectSuccess(() => handlers.archiveGameSystem(req(owner, { ...ws, bindingId: id })), 'archive'); await expectSuccess(() => handlers.restoreGameSystem(req(owner, { ...ws, bindingId: id })), 'restore'); });
  await check('39_malformed_create_400', async () => expectStatus(() => handlers.createWorldServer(req(owner, {}, { displayName: 'missing handle' })), 400));
  await check('40_same_scope_values_are_safe', async () => expectSuccess(() => handlers.getWorldServer({ ...req(owner, ws), query: { worldServerId: 'ws_main' } }), 'same scope should pass'));
  await check('41_scope_conflict_is_rejected', async () => expectStatus(() => handlers.getWorldServer({ ...req(owner, ws), body: { worldServerId: 'ws_other' } }), 400));
  await check('42_repository_error_is_safe', async () => { const failing: WorldServerApiRepository = { ...world, async getWorldServerById() { return { ok: false, error: { kind: 'database_error', message: 'internal SQL reason' } }; } }; const result = await createWorldServerApiHandlers({ worldServerRepository: failing, foundationRepository: foundation }).getWorldServer(req(owner, ws)); assert(result.ok === false && result.statusCode === 503 && !JSON.stringify(result).includes('internal SQL'), 'expected safe 503'); });
  await check('43_no_database_required', async () => expectSuccess(() => handlers.getSettings(req(owner, ws)), 'fake repository should run without DB'));
  await check('44_archive_restore_world_server', async () => { await expectSuccess(() => handlers.archiveWorldServer(req(owner, ws)), 'archive'); await expectSuccess(() => handlers.restoreWorldServer(req(owner, ws)), 'restore'); });
  await check('45_member_join_request_listing_is_protected', async () => expectStatus(() => handlers.listJoinRequests(req(member, ws)), 403));
  await check('46_missing_foundation_dependency_is_safe', async () => { const withoutFoundation = createWorldServerApiHandlers({ worldServerRepository: world, foundationRepository: null }); await expectStatus(() => withoutFoundation.listSettingsVersions(req(owner, ws)), 503); });

  const passed = cases.filter((item) => item.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
