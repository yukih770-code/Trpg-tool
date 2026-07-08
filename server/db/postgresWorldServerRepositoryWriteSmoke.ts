import type { QueryResultRow } from 'pg';

import { createPostgresUserRepository } from '../adapters/postgresUserRepository.js';
import { createPostgresCampaignRepository } from '../adapters/postgresCampaignRepository.js';
import {
  createPostgresWorldServerRepository,
  type PostgresWorldServerRepositoryExecutor,
} from '../adapters/postgresWorldServerRepository.js';
import { checkPostgresHealth, withPostgresClient } from './postgresClient.js';
import {
  checkPostgresWorldServerSchemaReadiness,
  type PostgresWorldServerSchemaReadinessResult,
} from './postgresWorldServerSchemaReadiness.js';

/**
 * Rollback-only World Server write smoke (P5.16-P5.17C). Inside a single transaction
 * it creates smoke owner/member/requester users + a campaign, then exercises the full
 * world-server surface (server, profile/settings updates, discovery, roles,
 * memberships, invites, join requests, campaign binding, archive/restore), and ALWAYS
 * rolls back. No permanent rows, no commit path, no email, no permission enforcement,
 * no raw DB error/connection string. Uses `useInternalTransactions:false`.
 */

export type PostgresWorldServerWriteSmokeStatus =
  | 'not_configured'
  | 'unreachable'
  | 'user_schema_missing'
  | 'campaign_schema_missing'
  | 'schema_missing'
  | 'rolled_back'
  | 'repository_failed'
  | 'transaction_failed'
  | 'error';

export interface PostgresWorldServerWriteSmokeStep {
  name: string;
  ok: boolean;
  errorKind?: string;
}

export interface PostgresWorldServerWriteSmokeResult {
  status: PostgresWorldServerWriteSmokeStatus;
  database: Awaited<ReturnType<typeof checkPostgresHealth>>;
  schema: PostgresWorldServerSchemaReadinessResult;
  transaction?: { attempted: boolean; rolledBack: boolean };
  steps: PostgresWorldServerWriteSmokeStep[];
  errorKind?: string;
}

const OWNER_USER_ID = 'user_world_write_smoke_owner';
const MEMBER_USER_ID = 'user_world_write_smoke_member';
const REQUESTER_USER_ID = 'user_world_write_smoke_requester';
const CAMPAIGN_ID = 'campaign_world_write_smoke';
const SERVER_ID = 'worldServer_write_smoke';
const SERVER_HANDLE = 'world-write-smoke';
const ROLE_OWNER_ID = 'role_world_write_smoke_owner';
const ROLE_ADMIN_ID = 'role_world_write_smoke_admin';
const ROLE_MEMBER_ID = 'role_world_write_smoke_member';
const MEMBERSHIP_OWNER_ID = 'membership_world_write_smoke_owner';
const MEMBERSHIP_MEMBER_ID = 'membership_world_write_smoke_member';
const INVITE_ID = 'invite_world_write_smoke';
const INVITE_CODE = 'invite_code_world_write_smoke';
const JOIN_REQUEST_ID = 'joinRequest_world_write_smoke';
const BINDING_ID = 'binding_world_write_smoke';
const GSB_FANTASY_ID = 'gsb_world_write_smoke_fantasy';
const GSB_INVESTIGATION_ID = 'gsb_world_write_smoke_investigation';
const GSB_CUSTOM_ID = 'gsb_world_write_smoke_custom';
const GAME_SYSTEM_FANTASY = 'dnd5e-2024';
const GAME_SYSTEM_INVESTIGATION = 'coc7e';
const GAME_SYSTEM_CUSTOM = 'custom-blank';

function makeClientExecutor(
  clientQuery: PostgresWorldServerRepositoryExecutor['query'],
): PostgresWorldServerRepositoryExecutor {
  return {
    query: <T extends QueryResultRow>(text: string, values?: readonly unknown[]) => clientQuery<T>(text, values),
  };
}

function failedStep(name: string, errorKind: string): PostgresWorldServerWriteSmokeStep {
  return { name, ok: false, errorKind };
}

async function createSmokeUser(executor: PostgresWorldServerRepositoryExecutor, userId: string, subject: string) {
  const userRepository = createPostgresUserRepository(executor, { useInternalTransactions: false });
  return userRepository.createUserWithIdentity({
    identity: { userId, providerKind: 'localAnonymous', providerUserId: subject, displayName: subject },
    profile: { handle: subject, displayName: subject, tags: [], visibility: 'private', pinned: [], sectionVisibility: {} },
  });
}

async function runWritePath(
  executor: PostgresWorldServerRepositoryExecutor,
): Promise<PostgresWorldServerWriteSmokeStep[]> {
  const steps: PostgresWorldServerWriteSmokeStep[] = [];
  const ok = (name: string) => steps.push({ name, ok: true });

  // Users + campaign (FK targets).
  for (const [id, subject] of [[OWNER_USER_ID, 'world-owner'], [MEMBER_USER_ID, 'world-member'], [REQUESTER_USER_ID, 'world-requester']] as const) {
    const res = await createSmokeUser(executor, id, subject);
    if (res.ok === false) return [...steps, failedStep(`createUser:${subject}`, res.error.kind)];
    ok(`createUser:${subject}`);
  }

  const campaignRepository = createPostgresCampaignRepository(executor, { useInternalTransactions: false });
  const campaign = await campaignRepository.createCampaign({ campaignId: CAMPAIGN_ID, ownerId: OWNER_USER_ID, title: 'World Write Smoke Campaign', systemId: 'dnd5e-2024' });
  if (campaign.ok === false) return [...steps, failedStep('createCampaign', campaign.error.kind)];
  ok('createCampaign');

  const repo = createPostgresWorldServerRepository(executor, { useInternalTransactions: false });

  // ── World server ────────────────────────────────────────────────────────────
  const created = await repo.createWorldServer({ worldServerId: SERVER_ID, ownerId: OWNER_USER_ID, serverHandle: SERVER_HANDLE, displayName: 'World Write Smoke', description: 'rollback-only', serverVisibility: 'private', joinPolicy: 'invite_only' });
  if (created.ok === false) return [...steps, failedStep('createWorldServer', created.error.kind)];
  ok('createWorldServer');

  const byId = await repo.getWorldServerById(SERVER_ID);
  if (byId.ok === false || !byId.value || byId.value.worldServerId !== SERVER_ID) return [...steps, failedStep('getWorldServerById', byId.ok === false ? byId.error.kind : 'not_found')];
  ok('getWorldServerById');

  const byHandle = await repo.getWorldServerByHandle(SERVER_HANDLE);
  if (byHandle.ok === false || !byHandle.value || byHandle.value.worldServerId !== SERVER_ID) return [...steps, failedStep('getWorldServerByHandle', byHandle.ok === false ? byHandle.error.kind : 'not_found')];
  ok('getWorldServerByHandle');

  const byOwner = await repo.listWorldServersByOwner(OWNER_USER_ID);
  if (byOwner.ok === false || !byOwner.value.some((s) => s.worldServerId === SERVER_ID)) return [...steps, failedStep('listWorldServersByOwner', byOwner.ok === false ? byOwner.error.kind : 'not_found')];
  ok('listWorldServersByOwner');

  const profile = await repo.updateWorldServerProfile({ worldServerId: SERVER_ID, displayName: 'World Write Smoke Updated', description: 'updated', serverVisibility: 'public_recruiting', joinPolicy: 'application', lifecycleStatus: 'active', publicProfilePayload: { tagline: 'come play' } });
  if (profile.ok === false || !profile.value || profile.value.serverVisibility !== 'public_recruiting') return [...steps, failedStep('updateWorldServerProfile', profile.ok === false ? profile.error.kind : 'stale_read')];
  ok('updateWorldServerProfile');

  // ── Game system bindings (a server can enable MULTIPLE systems) ───────────────
  const gsbSpecs: [string, string, string, string, boolean][] = [
    [GSB_FANTASY_ID, GAME_SYSTEM_FANTASY, 'Fantasy (DND-like)', 'template', true],
    [GSB_INVESTIGATION_ID, GAME_SYSTEM_INVESTIGATION, 'Investigation (COC-like)', 'template', false],
    [GSB_CUSTOM_ID, GAME_SYSTEM_CUSTOM, 'Custom Blank System', 'custom', false],
  ];
  for (const [id, systemId, name, kind, isDefault] of gsbSpecs) {
    const r = await repo.bindGameSystemToWorldServer({ bindingId: id, worldServerId: SERVER_ID, gameSystemId: systemId, displayName: name, systemKind: kind, isDefault, createdByUserId: OWNER_USER_ID, enabledPackVersionIds: [] });
    if (r.ok === false) return [...steps, failedStep(`bindGameSystem:${systemId}`, r.error.kind)];
    ok(`bindGameSystem:${systemId}`);
  }

  const allSystems = await repo.listGameSystemBindingsByWorldServer(SERVER_ID);
  if (allSystems.ok === false || allSystems.value.length < 3) return [...steps, failedStep('listGameSystemBindingsByWorldServer', allSystems.ok === false ? allSystems.error.kind : 'multi_system_expected')];
  ok('listGameSystemBindingsByWorldServer');

  const gsbById = await repo.getWorldServerGameSystemBinding(GSB_INVESTIGATION_ID);
  if (gsbById.ok === false || !gsbById.value) return [...steps, failedStep('getWorldServerGameSystemBinding', gsbById.ok === false ? gsbById.error.kind : 'not_found')];
  ok('getWorldServerGameSystemBinding');

  const gsbBySystem = await repo.getWorldServerGameSystemBindingBySystem(SERVER_ID, GAME_SYSTEM_CUSTOM);
  if (gsbBySystem.ok === false || !gsbBySystem.value || gsbBySystem.value.bindingId !== GSB_CUSTOM_ID) return [...steps, failedStep('getWorldServerGameSystemBindingBySystem', gsbBySystem.ok === false ? gsbBySystem.error.kind : 'not_found')];
  ok('getWorldServerGameSystemBindingBySystem');

  const defaults = await repo.listDefaultGameSystemBindingsByWorldServer(SERVER_ID);
  if (defaults.ok === false || !defaults.value.some((b) => b.bindingId === GSB_FANTASY_ID) || defaults.value.some((b) => !b.isDefault)) return [...steps, failedStep('listDefaultGameSystemBindingsByWorldServer', defaults.ok === false ? defaults.error.kind : 'default_mismatch')];
  ok('listDefaultGameSystemBindingsByWorldServer');

  const gsbUpd = await repo.updateWorldServerGameSystemBinding({ bindingId: GSB_INVESTIGATION_ID, displayName: 'Investigation (COC 7e)', systemKind: 'imported', isDefault: false, rulesetTemplateId: 'template_coc7e', currentRulesetVersionId: 'coc_ver_1', config: { sanity: true }, enabledPackVersionIds: ['pack_coc_core@1'] });
  if (gsbUpd.ok === false || !gsbUpd.value || gsbUpd.value.currentRulesetVersionId !== 'coc_ver_1' || gsbUpd.value.enabledPackVersionIds.length !== 1) return [...steps, failedStep('updateWorldServerGameSystemBinding', gsbUpd.ok === false ? gsbUpd.error.kind : 'stale_read')];
  ok('updateWorldServerGameSystemBinding');

  const gsbStatus = await repo.updateWorldServerGameSystemBindingStatus({ bindingId: GSB_CUSTOM_ID, bindingStatus: 'disabled' });
  if (gsbStatus.ok === false || !gsbStatus.value || gsbStatus.value.bindingStatus !== 'disabled') return [...steps, failedStep('updateWorldServerGameSystemBindingStatus', gsbStatus.ok === false ? gsbStatus.error.kind : 'stale_read')];
  ok('updateWorldServerGameSystemBindingStatus');

  const settings = await repo.updateWorldServerSettings({ worldServerId: SERVER_ID, defaultGameSystemId: GAME_SYSTEM_FANTASY, serverSettingsPayload: { knobs: {} }, softUpdatePolicyPayload: { banner: 'soft' } });
  if (settings.ok === false || !settings.value || settings.value.defaultGameSystemId !== GAME_SYSTEM_FANTASY) return [...steps, failedStep('updateWorldServerSettings', settings.ok === false ? settings.error.kind : 'stale_read')];
  ok('updateWorldServerSettings');

  const discoverable = await repo.listDiscoverableWorldServers({ limit: 20 });
  if (discoverable.ok === false || !discoverable.value.some((s) => s.worldServerId === SERVER_ID)) return [...steps, failedStep('listDiscoverableWorldServers', discoverable.ok === false ? discoverable.error.kind : 'not_found')];
  ok('listDiscoverableWorldServers');

  // ── Roles ─────────────────────────────────────────────────────────────────────
  for (const [id, key, kind, sys] of [[ROLE_OWNER_ID, 'owner', 'owner', true], [ROLE_ADMIN_ID, 'admin', 'admin', true], [ROLE_MEMBER_ID, 'member', 'member', true]] as const) {
    const r = await repo.createWorldServerRole({ roleId: id, worldServerId: SERVER_ID, roleKey: key, displayName: key, roleKind: kind, isSystemRole: sys, permissionsPayload: { note: 'metadata only' } });
    if (r.ok === false) return [...steps, failedStep(`createRole:${key}`, r.error.kind)];
    ok(`createRole:${key}`);
  }

  const roleById = await repo.getWorldServerRoleById(ROLE_MEMBER_ID);
  if (roleById.ok === false || !roleById.value) return [...steps, failedStep('getWorldServerRoleById', roleById.ok === false ? roleById.error.kind : 'not_found')];
  ok('getWorldServerRoleById');

  const roleByKey = await repo.getWorldServerRoleByKey(SERVER_ID, 'admin');
  if (roleByKey.ok === false || !roleByKey.value || roleByKey.value.roleId !== ROLE_ADMIN_ID) return [...steps, failedStep('getWorldServerRoleByKey', roleByKey.ok === false ? roleByKey.error.kind : 'not_found')];
  ok('getWorldServerRoleByKey');

  const roles = await repo.listWorldServerRoles(SERVER_ID);
  if (roles.ok === false || roles.value.length < 3) return [...steps, failedStep('listWorldServerRoles', roles.ok === false ? roles.error.kind : 'count')];
  ok('listWorldServerRoles');

  const roleUpd = await repo.updateWorldServerRole({ roleId: ROLE_ADMIN_ID, displayName: 'Administrator', sortOrder: 10, permissionsPayload: { canInvite: true } });
  if (roleUpd.ok === false || !roleUpd.value || roleUpd.value.displayName !== 'Administrator') return [...steps, failedStep('updateWorldServerRole', roleUpd.ok === false ? roleUpd.error.kind : 'stale_read')];
  ok('updateWorldServerRole');

  // ── Memberships ─────────────────────────────────────────────────────────────
  const ownerMembership = await repo.createWorldServerMembership({ membershipId: MEMBERSHIP_OWNER_ID, worldServerId: SERVER_ID, userId: OWNER_USER_ID, roleId: ROLE_OWNER_ID, roleKey: 'owner', membershipStatus: 'active', joinedAt: new Date().toISOString() });
  if (ownerMembership.ok === false) return [...steps, failedStep('createOwnerMembership', ownerMembership.error.kind)];
  ok('createOwnerMembership');

  const memberMembership = await repo.createWorldServerMembership({ membershipId: MEMBERSHIP_MEMBER_ID, worldServerId: SERVER_ID, userId: MEMBER_USER_ID, roleId: ROLE_MEMBER_ID, roleKey: 'member', membershipStatus: 'pending', invitedByUserId: OWNER_USER_ID });
  if (memberMembership.ok === false) return [...steps, failedStep('createMemberMembership', memberMembership.error.kind)];
  ok('createMemberMembership');

  const memById = await repo.getWorldServerMembershipById(MEMBERSHIP_MEMBER_ID);
  if (memById.ok === false || !memById.value) return [...steps, failedStep('getWorldServerMembershipById', memById.ok === false ? memById.error.kind : 'not_found')];
  ok('getWorldServerMembershipById');

  const memByUser = await repo.getWorldServerMembershipByUser(SERVER_ID, MEMBER_USER_ID);
  if (memByUser.ok === false || !memByUser.value || memByUser.value.membershipId !== MEMBERSHIP_MEMBER_ID) return [...steps, failedStep('getWorldServerMembershipByUser', memByUser.ok === false ? memByUser.error.kind : 'not_found')];
  ok('getWorldServerMembershipByUser');

  const memList = await repo.listWorldServerMemberships(SERVER_ID);
  if (memList.ok === false || memList.value.length < 2) return [...steps, failedStep('listWorldServerMemberships', memList.ok === false ? memList.error.kind : 'count')];
  ok('listWorldServerMemberships');

  const memForUser = await repo.listWorldServerMembershipsForUser(MEMBER_USER_ID);
  if (memForUser.ok === false || !memForUser.value.some((m) => m.membershipId === MEMBERSHIP_MEMBER_ID)) return [...steps, failedStep('listWorldServerMembershipsForUser', memForUser.ok === false ? memForUser.error.kind : 'not_found')];
  ok('listWorldServerMembershipsForUser');

  const memUpd = await repo.updateWorldServerMembership({ membershipId: MEMBERSHIP_MEMBER_ID, displayAlias: 'The Member', payload: { note: 'x' } });
  if (memUpd.ok === false || !memUpd.value || memUpd.value.displayAlias !== 'The Member') return [...steps, failedStep('updateWorldServerMembership', memUpd.ok === false ? memUpd.error.kind : 'stale_read')];
  ok('updateWorldServerMembership');

  const memStatus = await repo.updateWorldServerMembershipStatus({ membershipId: MEMBERSHIP_MEMBER_ID, membershipStatus: 'active', approvedByUserId: OWNER_USER_ID, joinedAt: new Date().toISOString() });
  if (memStatus.ok === false || !memStatus.value || memStatus.value.membershipStatus !== 'active') return [...steps, failedStep('updateWorldServerMembershipStatus', memStatus.ok === false ? memStatus.error.kind : 'stale_read')];
  ok('updateWorldServerMembershipStatus');

  // ── Invites ───────────────────────────────────────────────────────────────────
  const invite = await repo.createWorldServerInvite({ inviteId: INVITE_ID, worldServerId: SERVER_ID, inviteCode: INVITE_CODE, createdByUserId: OWNER_USER_ID, targetUserId: REQUESTER_USER_ID, defaultRoleKey: 'member', maxUses: 5 });
  if (invite.ok === false) return [...steps, failedStep('createWorldServerInvite', invite.error.kind)];
  ok('createWorldServerInvite');

  const inviteById = await repo.getWorldServerInviteById(INVITE_ID);
  if (inviteById.ok === false || !inviteById.value) return [...steps, failedStep('getWorldServerInviteById', inviteById.ok === false ? inviteById.error.kind : 'not_found')];
  ok('getWorldServerInviteById');

  const inviteByCode = await repo.getWorldServerInviteByCode(INVITE_CODE);
  if (inviteByCode.ok === false || !inviteByCode.value || inviteByCode.value.inviteId !== INVITE_ID) return [...steps, failedStep('getWorldServerInviteByCode', inviteByCode.ok === false ? inviteByCode.error.kind : 'not_found')];
  ok('getWorldServerInviteByCode');

  const inviteList = await repo.listWorldServerInvites(SERVER_ID);
  if (inviteList.ok === false || !inviteList.value.some((i) => i.inviteId === INVITE_ID)) return [...steps, failedStep('listWorldServerInvites', inviteList.ok === false ? inviteList.error.kind : 'not_found')];
  ok('listWorldServerInvites');

  const inviteUpd = await repo.updateWorldServerInvite({ inviteId: INVITE_ID, useCount: 1, payload: { note: 'used once' } });
  if (inviteUpd.ok === false || !inviteUpd.value || inviteUpd.value.useCount !== 1) return [...steps, failedStep('updateWorldServerInvite', inviteUpd.ok === false ? inviteUpd.error.kind : 'stale_read')];
  ok('updateWorldServerInvite');

  const inviteStatus = await repo.updateWorldServerInviteStatus({ inviteId: INVITE_ID, inviteStatus: 'revoked' });
  if (inviteStatus.ok === false || !inviteStatus.value || inviteStatus.value.inviteStatus !== 'revoked') return [...steps, failedStep('updateWorldServerInviteStatus', inviteStatus.ok === false ? inviteStatus.error.kind : 'stale_read')];
  ok('updateWorldServerInviteStatus');

  // ── Join requests ───────────────────────────────────────────────────────────
  const joinReq = await repo.createWorldServerJoinRequest({ joinRequestId: JOIN_REQUEST_ID, worldServerId: SERVER_ID, requesterUserId: REQUESTER_USER_ID, requestMessage: 'may I join?', requestedRoleKey: 'member' });
  if (joinReq.ok === false) return [...steps, failedStep('createWorldServerJoinRequest', joinReq.error.kind)];
  ok('createWorldServerJoinRequest');

  const joinById = await repo.getWorldServerJoinRequestById(JOIN_REQUEST_ID);
  if (joinById.ok === false || !joinById.value) return [...steps, failedStep('getWorldServerJoinRequestById', joinById.ok === false ? joinById.error.kind : 'not_found')];
  ok('getWorldServerJoinRequestById');

  const joinByServer = await repo.listWorldServerJoinRequests(SERVER_ID);
  if (joinByServer.ok === false || !joinByServer.value.some((j) => j.joinRequestId === JOIN_REQUEST_ID)) return [...steps, failedStep('listWorldServerJoinRequests', joinByServer.ok === false ? joinByServer.error.kind : 'not_found')];
  ok('listWorldServerJoinRequests');

  const joinForUser = await repo.listWorldServerJoinRequestsForUser(REQUESTER_USER_ID);
  if (joinForUser.ok === false || !joinForUser.value.some((j) => j.joinRequestId === JOIN_REQUEST_ID)) return [...steps, failedStep('listWorldServerJoinRequestsForUser', joinForUser.ok === false ? joinForUser.error.kind : 'not_found')];
  ok('listWorldServerJoinRequestsForUser');

  const joinStatus = await repo.updateWorldServerJoinRequestStatus({ joinRequestId: JOIN_REQUEST_ID, requestStatus: 'approved', reviewedByUserId: OWNER_USER_ID, responseMessage: 'welcome' });
  if (joinStatus.ok === false || !joinStatus.value || joinStatus.value.requestStatus !== 'approved') return [...steps, failedStep('updateWorldServerJoinRequestStatus', joinStatus.ok === false ? joinStatus.error.kind : 'stale_read')];
  ok('updateWorldServerJoinRequestStatus');

  // ── Campaign binding ────────────────────────────────────────────────────────
  const bind = await repo.bindCampaignToWorldServer({ bindingId: BINDING_ID, worldServerId: SERVER_ID, campaignId: CAMPAIGN_ID, createdByUserId: OWNER_USER_ID, bindingKind: 'owned', visibilityScope: 'server' });
  if (bind.ok === false) return [...steps, failedStep('bindCampaignToWorldServer', bind.error.kind)];
  ok('bindCampaignToWorldServer');

  const bindById = await repo.getWorldServerCampaignBinding(BINDING_ID);
  if (bindById.ok === false || !bindById.value) return [...steps, failedStep('getWorldServerCampaignBinding', bindById.ok === false ? bindById.error.kind : 'not_found')];
  ok('getWorldServerCampaignBinding');

  const bindByPair = await repo.getWorldServerCampaignBindingByPair(SERVER_ID, CAMPAIGN_ID);
  if (bindByPair.ok === false || !bindByPair.value || bindByPair.value.bindingId !== BINDING_ID) return [...steps, failedStep('getWorldServerCampaignBindingByPair', bindByPair.ok === false ? bindByPair.error.kind : 'not_found')];
  ok('getWorldServerCampaignBindingByPair');

  const bindByServer = await repo.listCampaignBindingsByWorldServer(SERVER_ID);
  if (bindByServer.ok === false || !bindByServer.value.some((b) => b.bindingId === BINDING_ID)) return [...steps, failedStep('listCampaignBindingsByWorldServer', bindByServer.ok === false ? bindByServer.error.kind : 'not_found')];
  ok('listCampaignBindingsByWorldServer');

  const bindForCampaign = await repo.listWorldServerBindingsForCampaign(CAMPAIGN_ID);
  if (bindForCampaign.ok === false || !bindForCampaign.value.some((b) => b.bindingId === BINDING_ID)) return [...steps, failedStep('listWorldServerBindingsForCampaign', bindForCampaign.ok === false ? bindForCampaign.error.kind : 'not_found')];
  ok('listWorldServerBindingsForCampaign');

  const bindUpd = await repo.updateWorldServerCampaignBinding({ bindingId: BINDING_ID, bindingKind: 'featured', visibilityScope: 'public', payload: { note: 'x' } });
  if (bindUpd.ok === false || !bindUpd.value || bindUpd.value.bindingKind !== 'featured') return [...steps, failedStep('updateWorldServerCampaignBinding', bindUpd.ok === false ? bindUpd.error.kind : 'stale_read')];
  ok('updateWorldServerCampaignBinding');

  // ── Archive / restore across entities ─────────────────────────────────────────
  const archiveChecks: [string, () => Promise<{ ok: boolean }>][] = [
    ['archiveBinding', async () => { const r = await repo.archiveWorldServerCampaignBinding(BINDING_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreBinding', async () => { const r = await repo.restoreWorldServerCampaignBinding(BINDING_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveGameSystemBinding', async () => { const r = await repo.archiveWorldServerGameSystemBinding(GSB_CUSTOM_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreGameSystemBinding', async () => { const r = await repo.restoreWorldServerGameSystemBinding(GSB_CUSTOM_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveInvite', async () => { const r = await repo.archiveWorldServerInvite(INVITE_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreInvite', async () => { const r = await repo.restoreWorldServerInvite(INVITE_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveJoinRequest', async () => { const r = await repo.archiveWorldServerJoinRequest(JOIN_REQUEST_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreJoinRequest', async () => { const r = await repo.restoreWorldServerJoinRequest(JOIN_REQUEST_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveMembership', async () => { const r = await repo.archiveWorldServerMembership(MEMBERSHIP_MEMBER_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreMembership', async () => { const r = await repo.restoreWorldServerMembership(MEMBERSHIP_MEMBER_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveRole', async () => { const r = await repo.archiveWorldServerRole(ROLE_MEMBER_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreRole', async () => { const r = await repo.restoreWorldServerRole(ROLE_MEMBER_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
    ['archiveServer', async () => { const r = await repo.archiveWorldServer(SERVER_ID); return { ok: r.ok && !!r.value?.archivedAt }; }],
    ['restoreServer', async () => { const r = await repo.restoreWorldServer(SERVER_ID); return { ok: r.ok && !r.value?.archivedAt }; }],
  ];
  for (const [name, run] of archiveChecks) {
    const res = await run();
    if (!res.ok) return [...steps, failedStep(name, 'archive_restore_failed')];
    ok(name);
  }

  return steps;
}

export async function runPostgresWorldServerRepositoryRollbackWriteSmoke(): Promise<PostgresWorldServerWriteSmokeResult> {
  const database = await checkPostgresHealth();
  if (database.configured === false) {
    return { status: 'not_configured', database, schema: { status: 'not_configured' }, transaction: { attempted: false, rolledBack: false }, steps: [] };
  }
  if (database.status !== 'ok') {
    return {
      status: 'unreachable',
      database,
      schema: { status: 'unreachable', errorKind: database.errorKind, latencyMs: database.latencyMs },
      transaction: { attempted: false, rolledBack: false },
      steps: [],
      errorKind: database.errorKind,
    };
  }

  const schema = await checkPostgresWorldServerSchemaReadiness();
  if (schema.status !== 'ready') {
    // All non-ready schema statuses are members of the write-smoke status union.
    return { status: schema.status, database, schema, transaction: { attempted: false, rolledBack: false }, steps: [], errorKind: schema.errorKind };
  }

  const steps: PostgresWorldServerWriteSmokeStep[] = [];
  let rolledBack = false;
  try {
    const transactionSteps = await withPostgresClient(async (client) => {
      await client.query('BEGIN');
      try {
        return await runWritePath(
          makeClientExecutor((text, values) => client.query(text, values ? [...values] : undefined)),
        );
      } finally {
        await client.query('ROLLBACK');
        rolledBack = true;
      }
    });
    steps.push(...transactionSteps);
    const failed = steps.find((step) => !step.ok);
    return {
      status: failed ? 'repository_failed' : 'rolled_back',
      database,
      schema,
      transaction: { attempted: true, rolledBack },
      steps,
      errorKind: failed?.errorKind,
    };
  } catch (_error) {
    return {
      status: 'transaction_failed',
      database,
      schema,
      transaction: { attempted: true, rolledBack },
      steps,
      errorKind: 'transaction_failed',
    };
  }
}
