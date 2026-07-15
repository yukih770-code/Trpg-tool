import { createApiClient, type ApiClientOptions } from './apiClient';

export type WorldServerRecord = {
  worldServerId: string;
  ownerId: string;
  serverHandle: string;
  displayName: string;
  description?: string;
  serverVisibility: string;
  joinPolicy: string;
  lifecycleStatus: string;
  defaultGameSystemId?: string;
  publicProfilePayload: Record<string, unknown>;
  serverSettingsPayload: Record<string, unknown>;
  softUpdatePolicyPayload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

export type WorldServerMembership = {
  membershipId: string;
  worldServerId: string;
  userId: string;
  roleId?: string;
  roleKey: string;
  membershipStatus: string;
  displayAlias?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WorldServerRole = {
  roleId: string;
  worldServerId: string;
  roleKey: string;
  displayName: string;
  roleKind: string;
  permissionsPayload: Record<string, unknown>;
  isSystemRole: boolean;
  sortOrder: number;
  schemaVersion: number;
};

export type WorldServerInvite = {
  inviteId: string;
  worldServerId: string;
  inviteCode: string;
  defaultRoleKey: string;
  inviteStatus: string;
  useCount: number;
  maxUses?: number;
  expiresAt?: string;
};

export type WorldServerJoinRequest = {
  joinRequestId: string;
  worldServerId: string;
  requesterUserId: string;
  requestStatus: string;
  requestedRoleKey: string;
  requestMessage?: string;
  requestedAt?: string;
};

export type WorldServerGameSystemBinding = {
  bindingId: string;
  worldServerId: string;
  gameSystemId: string;
  displayName: string;
  systemKind: string;
  bindingStatus: string;
  isDefault: boolean;
  rulesetTemplateId?: string;
  currentRulesetVersionId?: string;
  enabledPackVersionIds: string[];
};

export type WorldServerSettings = {
  worldServerId: string;
  defaultGameSystemId?: string;
  settings: Record<string, unknown>;
  softUpdatePolicy: Record<string, unknown>;
};

export type WorldServerSettingsVersion = {
  settingsVersionId: string;
  worldServerId: string;
  versionNumber: number;
  settingsPayload: Record<string, unknown>;
  createdAt?: string;
};

export type WorldServerRulesetVersion = {
  rulesetVersionId: string;
  worldServerId: string;
  gameSystemId: string;
  versionLabel: string;
  status: string;
  createdAt?: string;
};

export type CreateWorldServerInput = {
  displayName: string;
  description?: string;
  serverVisibility?: string;
  joinPolicy?: string;
  defaultGameSystemId?: string;
  publicProfilePayload?: Record<string, unknown>;
  serverSettingsPayload?: Record<string, unknown>;
  softUpdatePolicyPayload?: Record<string, unknown>;
};

export type UpdateWorldServerInput = Partial<Pick<CreateWorldServerInput, 'displayName' | 'description' | 'serverVisibility' | 'joinPolicy' | 'publicProfilePayload'>>;

export type UpdateServerSettingsInput = {
  defaultGameSystemId?: string;
  settings?: Record<string, unknown>;
  softUpdatePolicy?: Record<string, unknown>;
};

export type CreateSettingsVersionInput = {
  versionLabel: string;
  settingsPayload: Record<string, unknown>;
  createdByUserId?: string;
};

export type CreateRulesetVersionInput = {
  gameSystemId: string;
  versionLabel: string;
  rulesetPayload?: Record<string, unknown>;
  createdByUserId?: string;
};

export type CreateRoleInput = {
  roleKey: string;
  displayName: string;
  roleKind?: string;
  permissionsPayload?: Record<string, unknown>;
  sortOrder?: number;
};

export type CreateInviteInput = {
  defaultRoleKey?: string;
  targetUserId?: string;
  targetEmail?: string;
  maxUses?: number;
  expiresAt?: string;
};

export type CreateGameSystemInput = {
  gameSystemId: string;
  displayName: string;
  systemKind?: string;
  isDefault?: boolean;
  rulesetTemplateId?: string;
  enabledPackVersionIds?: string[];
};

export type WorldServerApiClient = {
  listWorldServers(limit?: number): Promise<WorldServerRecord[]>;
  getWorldServer(worldServerId: string): Promise<WorldServerRecord>;
  createWorldServer(input: CreateWorldServerInput): Promise<WorldServerRecord>;
  updateWorldServer(worldServerId: string, input: UpdateWorldServerInput): Promise<WorldServerRecord>;
  archiveWorldServer(worldServerId: string): Promise<WorldServerRecord | null>;
  restoreWorldServer(worldServerId: string): Promise<WorldServerRecord | null>;
  listMembers(worldServerId: string, limit?: number): Promise<WorldServerMembership[]>;
  updateMember(worldServerId: string, membershipId: string, input: Record<string, unknown>): Promise<WorldServerMembership>;
  listRoles(worldServerId: string, limit?: number): Promise<WorldServerRole[]>;
  createRole(worldServerId: string, input: CreateRoleInput): Promise<WorldServerRole>;
  updateRole(worldServerId: string, roleId: string, input: Record<string, unknown>): Promise<WorldServerRole>;
  listInvites(worldServerId: string, limit?: number): Promise<WorldServerInvite[]>;
  createInvite(worldServerId: string, input: CreateInviteInput): Promise<WorldServerInvite>;
  createJoinRequest(worldServerId: string, input: { requestedRoleKey?: string; requestMessage?: string }): Promise<WorldServerJoinRequest>;
  listJoinRequests(worldServerId: string, limit?: number): Promise<WorldServerJoinRequest[]>;
  reviewJoinRequest(worldServerId: string, joinRequestId: string, input: { requestStatus: string; responseMessage?: string }): Promise<WorldServerJoinRequest>;
  getServerSettings(worldServerId: string): Promise<WorldServerSettings>;
  updateServerSettings(worldServerId: string, input: UpdateServerSettingsInput): Promise<{ worldServer: WorldServerRecord; versioned: boolean }>;
  listSettingsVersions(worldServerId: string, limit?: number): Promise<WorldServerSettingsVersion[]>;
  createSettingsVersion(worldServerId: string, input: CreateSettingsVersionInput): Promise<WorldServerSettingsVersion>;
  listRulesetVersions(worldServerId: string, gameSystemId?: string, limit?: number): Promise<WorldServerRulesetVersion[]>;
  createRulesetVersion(worldServerId: string, input: CreateRulesetVersionInput): Promise<WorldServerRulesetVersion>;
  listGameSystems(worldServerId: string, limit?: number): Promise<WorldServerGameSystemBinding[]>;
  bindGameSystem(worldServerId: string, input: CreateGameSystemInput): Promise<WorldServerGameSystemBinding>;
  updateGameSystemBinding(worldServerId: string, bindingId: string, input: Record<string, unknown>): Promise<WorldServerGameSystemBinding>;
  archiveGameSystemBinding(worldServerId: string, bindingId: string): Promise<WorldServerGameSystemBinding | null>;
  restoreGameSystemBinding(worldServerId: string, bindingId: string): Promise<WorldServerGameSystemBinding | null>;
};

export function createWorldServerApiClient(options: ApiClientOptions = {}): WorldServerApiClient {
  const client = createApiClient(options);
  const request = client.request;
  const json = (method: string, path: string, body?: unknown) =>
    request<any>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

  return {
    listWorldServers: (limit = 100) => request(`/api/world-servers?limit=${limit}`),
    getWorldServer: (id) => request(`/api/world-servers/${encodeURIComponent(id)}`),
    createWorldServer: (input) => json('POST', '/api/world-servers', input),
    updateWorldServer: (id, input) => json('PATCH', `/api/world-servers/${encodeURIComponent(id)}`, input),
    archiveWorldServer: (id) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/archive`),
    restoreWorldServer: (id) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/restore`),
    listMembers: (id, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/members?limit=${limit}`),
    updateMember: (id, membershipId, input) => json('PATCH', `/api/world-servers/${encodeURIComponent(id)}/members/${encodeURIComponent(membershipId)}`, input),
    listRoles: (id, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/roles?limit=${limit}`),
    createRole: (id, input) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/roles`, input),
    updateRole: (id, roleId, input) => json('PATCH', `/api/world-servers/${encodeURIComponent(id)}/roles/${encodeURIComponent(roleId)}`, input),
    listInvites: (id, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/invites?limit=${limit}`),
    createInvite: (id, input) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/invites`, input),
    createJoinRequest: (id, input) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/join-requests`, input),
    listJoinRequests: (id, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/join-requests?limit=${limit}`),
    reviewJoinRequest: (id, requestId, input) => json('PATCH', `/api/world-servers/${encodeURIComponent(id)}/join-requests/${encodeURIComponent(requestId)}`, input),
    getServerSettings: (id) => request(`/api/world-servers/${encodeURIComponent(id)}/settings`),
    updateServerSettings: async (id, input) => request(`/api/world-servers/${encodeURIComponent(id)}/settings`, { method: 'PATCH', body: JSON.stringify(input) }),
    listSettingsVersions: (id, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/settings/versions?limit=${limit}`),
    createSettingsVersion: (id, input) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/settings/versions`, input),
    listRulesetVersions: (id, gameSystemId, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/ruleset-versions?limit=${limit}${gameSystemId ? `&gameSystemId=${encodeURIComponent(gameSystemId)}` : ''}`),
    createRulesetVersion: (id, input) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/ruleset-versions`, input),
    listGameSystems: (id, limit = 100) => request(`/api/world-servers/${encodeURIComponent(id)}/game-systems?limit=${limit}`),
    bindGameSystem: (id, input) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/game-systems`, input),
    updateGameSystemBinding: (id, bindingId, input) => json('PATCH', `/api/world-servers/${encodeURIComponent(id)}/game-systems/${encodeURIComponent(bindingId)}`, input),
    archiveGameSystemBinding: (id, bindingId) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/game-systems/${encodeURIComponent(bindingId)}/archive`),
    restoreGameSystemBinding: (id, bindingId) => json('POST', `/api/world-servers/${encodeURIComponent(id)}/game-systems/${encodeURIComponent(bindingId)}/restore`),
  };
}

export const worldServerApiClient = createWorldServerApiClient();
