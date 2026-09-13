import { createApiClient, type ApiClientOptions } from './apiClient';

export type CampaignRecord = {
  campaignId: string;
  ownerId: string;
  title: string;
  description?: string;
  systemId: string;
  status: string;
  lifecycleStatus: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

export type CampaignBinding = {
  bindingId: string;
  worldServerId: string;
  campaignId: string;
  bindingKind: string;
  visibilityScope: string;
  payload: Record<string, unknown>;
  createdAt?: string;
  archivedAt?: string;
};

export type CampaignListItem = { campaign: CampaignRecord; binding: CampaignBinding };
export type CampaignDetail = CampaignListItem;

export type CampaignActorInstance = {
  campaignActorInstanceId: string;
  campaignId: string;
  sourceActorId?: string;
  ownerId?: string;
  actorKind: string;
  displayName: string;
  instanceStatus: string;
  snapshotHash?: string;
  snapshotPayload: Record<string, unknown>;
  overridePayload: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

/**
 * T11b: the host-facing review of a linked character source.
 *
 * Deliberately NOT the character. The server derives these values from the
 * player's Vault actor at an already-authorized boundary and returns only the
 * combat-relevant field diff; no raw `CharacterData` crosses this wire.
 */
export type CampaignActorSourceReviewField = {
  key: string;
  label: string;
  group: 'identity' | 'defenses' | 'abilities' | 'proficiencies';
  before?: string;
  after?: string;
  changed: boolean;
};

export type CampaignActorSourceReview = {
  status: 'unchanged' | 'changed' | 'unknown';
  changedFields: CampaignActorSourceReviewField[];
  comparedFieldCount: number;
  unreadable?: 'accepted' | 'current' | 'both';
  currentDisplayName?: string;
  /** Field names the derivation approximated or did not cover at all. */
  approximations: string[];
  omissions: string[];
};

export type CampaignActorSourceReviewResponse = {
  campaignActorInstanceId: string;
  status: 'unchanged' | 'changed' | 'unknown';
  sourceChangedSinceApproval: boolean;
  review?: CampaignActorSourceReview;
  acceptedSourceHash?: string;
  /** The hash the host must echo back to accept exactly this version. */
  currentSourceHash?: string;
};

export type CampaignActorSourceAcceptResponse = {
  campaignActorInstanceId: string;
  acceptedSourceHash?: string;
  previousSourceHash?: string;
  updatedAt?: string;
};

export type RoomRecord = {
  roomRecordId: string;
  roomId: string;
  worldServerId?: string;
  campaignId?: string;
  hostUserId?: string;
  roomCode?: string;
  roomStatus: string;
  multiplayerMode: string;
  accessPolicy: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
};

export type RoomParticipant = {
  participantId?: string;
  roomParticipantId?: string;
  roomRecordId: string;
  userId?: string;
  displayName?: string;
  participantRole?: string;
  participantStatus?: string;
  readyStatus?: string;
  actorBindingId?: string;
  membershipStatus?: string;
  roleKey?: string;
  metadata: Record<string, unknown>;
};

export type RoomLobbySlot = {
  lobbySlotId: string;
  roomRecordId: string;
  roomParticipantId?: string;
  campaignActorInstanceId?: string;
  slotLabel?: string;
  slotIndex?: number;
  slotStatus: string;
  participantId?: string;
  metadata: Record<string, unknown>;
};

export type RuntimeSession = {
  runtimeSessionId: string;
  campaignId: string;
  hostUserId?: string;
  roomId?: string;
  title?: string;
  status: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

export type RuntimeSessionBinding = {
  runtimeSessionBindingId: string;
  runtimeSessionId: string;
  roomRecordId?: string;
  campaignId: string;
  bindingStatus: string;
  metadata: Record<string, unknown>;
};

export type RuntimeSessionDetail = { session: RuntimeSession; binding: RuntimeSessionBinding | null };

export type RuntimeEvent = {
  runtimeEventId: string;
  runtimeSessionId: string;
  campaignId: string;
  seq: number;
  eventKind: string;
  visibility: string;
  actorId?: string;
  causedByEventId?: string;
  idempotencyKey?: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdByUserId?: string;
  createdAt?: string;
};

export type SceneStateDocument = {
  sceneStateId: string;
  worldServerId: string;
  campaignId: string;
  roomId: string;
  runtimeSessionId?: string;
  title: string;
  description?: string;
  schemaVersion: number;
  stateJson: Record<string, unknown>;
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  sourceSceneStateId?: string;
};

export type CampaignRoomApiClient = {
  listCampaigns(worldServerId: string, options?: { includeArchived?: boolean; includeTrashed?: boolean }): Promise<CampaignListItem[]>;
  getCampaign(worldServerId: string, campaignId: string): Promise<CampaignDetail>;
  createCampaign(worldServerId: string, input: { title: string; description?: string; systemId: string; status?: 'draft' | 'active' }): Promise<CampaignDetail>;
  updateCampaign(worldServerId: string, campaignId: string, input: { title?: string; description?: string; status?: 'draft' | 'active' }): Promise<CampaignDetail>;
  archiveCampaign(worldServerId: string, campaignId: string): Promise<{ campaign: CampaignRecord; binding: CampaignBinding }>;
  restoreCampaign(worldServerId: string, campaignId: string): Promise<{ campaign: CampaignRecord; binding: CampaignBinding }>;
  listCampaignActors(worldServerId: string, campaignId: string): Promise<CampaignActorInstance[]>;
  getCampaignActor(worldServerId: string, campaignId: string, actorInstanceId: string): Promise<CampaignActorInstance>;
  createCampaignActor(worldServerId: string, campaignId: string, input: { displayName: string; actorKind?: string; sourceActorId?: string; snapshotPayload?: Record<string, unknown>; overridePayload?: Record<string, unknown> }): Promise<CampaignActorInstance>;
  updateCampaignActor(worldServerId: string, campaignId: string, actorInstanceId: string, input: { displayName?: string; instanceStatus?: string; overridePayload?: Record<string, unknown> }): Promise<CampaignActorInstance>;
  archiveCampaignActor(worldServerId: string, campaignId: string, actorInstanceId: string): Promise<CampaignActorInstance | null>;
  /** T11b: read-only. Never mutates the campaign actor or any runtime state. */
  reviewCampaignActorSource(worldServerId: string, campaignId: string, actorInstanceId: string): Promise<CampaignActorSourceReviewResponse>;
  /**
   * T11b: accepts exactly the version the host reviewed. `expectedSourceHash`
   * is an equality guard only — the server re-reads and re-derives the source
   * and refuses (409) if it moved since the review.
   */
  acceptCampaignActorSource(worldServerId: string, campaignId: string, actorInstanceId: string, input: { expectedSourceHash: string }): Promise<CampaignActorSourceAcceptResponse>;
  listRooms(worldServerId: string, campaignId: string): Promise<RoomRecord[]>;
  getRoom(worldServerId: string, campaignId: string, roomId: string): Promise<RoomRecord>;
  createRoom(worldServerId: string, campaignId: string, input?: { roomId?: string; roomCode?: string; roomStatus?: string; multiplayerMode?: string; metadata?: Record<string, unknown> }): Promise<RoomRecord>;
  updateRoom(worldServerId: string, campaignId: string, roomId: string, input: { roomCode?: string; roomStatus?: string; multiplayerMode?: string; metadata?: Record<string, unknown>; closedAt?: string }): Promise<RoomRecord | null>;
  listRoomParticipants(worldServerId: string, campaignId: string, roomId: string): Promise<RoomParticipant[]>;
  listLobbySlots(worldServerId: string, campaignId: string, roomId: string): Promise<RoomLobbySlot[]>;
  getRuntimeSession(worldServerId: string, campaignId: string, roomId: string, runtimeSessionId?: string): Promise<RuntimeSessionDetail>;
  createRuntimeSession(worldServerId: string, campaignId: string, roomId: string, input?: { runtimeSessionId?: string; title?: string; status?: string; payload?: Record<string, unknown> }): Promise<RuntimeSessionDetail>;
  updateRuntimeSession(worldServerId: string, campaignId: string, roomId: string, input: { runtimeSessionId?: string; title?: string; status?: string; payload?: Record<string, unknown>; endedAt?: string }): Promise<RuntimeSessionDetail>;
  listRuntimeEvents(worldServerId: string, campaignId: string, roomId: string, options?: { runtimeSessionId?: string; afterSeq?: number; limit?: number }): Promise<RuntimeEvent[]>;
  appendRuntimeEvent(worldServerId: string, campaignId: string, roomId: string, input: { runtimeSessionId: string; eventKind: string; visibility?: string; payload?: Record<string, unknown>; idempotencyKey?: string }): Promise<RuntimeEvent>;
  listSceneStates(worldServerId: string, campaignId: string, roomId: string, options?: { includeArchived?: boolean }): Promise<SceneStateDocument[]>;
  getSceneState(worldServerId: string, campaignId: string, roomId: string, sceneStateId: string): Promise<SceneStateDocument>;
  createSceneState(worldServerId: string, campaignId: string, roomId: string, input: { title: string; description?: string; runtimeSessionId?: string; stateJson: Record<string, unknown> }): Promise<SceneStateDocument>;
  updateSceneState(worldServerId: string, campaignId: string, roomId: string, sceneStateId: string, input: { title?: string; description?: string | null }): Promise<SceneStateDocument>;
  archiveSceneState(worldServerId: string, campaignId: string, roomId: string, sceneStateId: string): Promise<SceneStateDocument>;
  duplicateSceneState(worldServerId: string, campaignId: string, roomId: string, sceneStateId: string, input?: { title?: string }): Promise<SceneStateDocument>;
};

function segment(value: string): string {
  return encodeURIComponent(value);
}

function query(values: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
}

export function createCampaignRoomApiClient(options: ApiClientOptions = {}): CampaignRoomApiClient {
  const client = createApiClient(options);
  const request = client.request;
  const root = (worldServerId: string) => `/api/world-servers/${segment(worldServerId)}`;
  const campaignRoot = (worldServerId: string, campaignId: string) => `${root(worldServerId)}/campaigns/${segment(campaignId)}`;
  const roomRoot = (worldServerId: string, campaignId: string, roomId: string) => `${campaignRoot(worldServerId, campaignId)}/rooms/${segment(roomId)}`;
  const json = (method: string, path: string, body?: unknown) => request<any>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

  return {
    listCampaigns: (id, options = {}) => request(`${root(id)}/campaigns${query(options)}`),
    getCampaign: async (id, campaignId) => request(`${campaignRoot(id, campaignId)}`),
    createCampaign: (id, input) => json('POST', `${root(id)}/campaigns`, input),
    updateCampaign: (id, campaignId, input) => json('PATCH', campaignRoot(id, campaignId), input),
    archiveCampaign: (id, campaignId) => json('POST', `${campaignRoot(id, campaignId)}/archive`),
    restoreCampaign: (id, campaignId) => json('POST', `${campaignRoot(id, campaignId)}/restore`),
    listCampaignActors: (id, campaignId) => request(`${campaignRoot(id, campaignId)}/actors`),
    getCampaignActor: (id, campaignId, actorId) => request(`${campaignRoot(id, campaignId)}/actors/${segment(actorId)}`),
    createCampaignActor: (id, campaignId, input) => json('POST', `${campaignRoot(id, campaignId)}/actors`, input),
    updateCampaignActor: (id, campaignId, actorId, input) => json('PATCH', `${campaignRoot(id, campaignId)}/actors/${segment(actorId)}`, input),
    archiveCampaignActor: (id, campaignId, actorId) => json('POST', `${campaignRoot(id, campaignId)}/actors/${segment(actorId)}/archive`),
    reviewCampaignActorSource: (id, campaignId, actorId) => request(`${campaignRoot(id, campaignId)}/actors/${segment(actorId)}/source-review`),
    acceptCampaignActorSource: (id, campaignId, actorId, input) => json('POST', `${campaignRoot(id, campaignId)}/actors/${segment(actorId)}/source-review/accept`, input),
    listRooms: (id, campaignId) => request(`${campaignRoot(id, campaignId)}/rooms`),
    getRoom: (id, campaignId, roomId) => request(roomRoot(id, campaignId, roomId)),
    createRoom: (id, campaignId, input) => json('POST', `${campaignRoot(id, campaignId)}/rooms`, input),
    updateRoom: (id, campaignId, roomId, input) => json('PATCH', roomRoot(id, campaignId, roomId), input),
    listRoomParticipants: (id, campaignId, roomId) => request(`${roomRoot(id, campaignId, roomId)}/participants`),
    listLobbySlots: (id, campaignId, roomId) => request(`${roomRoot(id, campaignId, roomId)}/lobby-slots`),
    getRuntimeSession: (id, campaignId, roomId, runtimeSessionId) => request(`${roomRoot(id, campaignId, roomId)}/runtime-session${query({ runtimeSessionId })}`),
    createRuntimeSession: (id, campaignId, roomId, input) => json('POST', `${roomRoot(id, campaignId, roomId)}/runtime-session`, input),
    updateRuntimeSession: (id, campaignId, roomId, input) => json('PATCH', `${roomRoot(id, campaignId, roomId)}/runtime-session`, input),
    listRuntimeEvents: (id, campaignId, roomId, options = {}) => request(`${roomRoot(id, campaignId, roomId)}/runtime-events${query(options)}`),
    appendRuntimeEvent: (id, campaignId, roomId, input) => json('POST', `${roomRoot(id, campaignId, roomId)}/runtime-events`, input),
    listSceneStates: (id, campaignId, roomId, options = {}) => request(`${roomRoot(id, campaignId, roomId)}/scene-states${query(options)}`),
    getSceneState: (id, campaignId, roomId, sceneStateId) => request(`${roomRoot(id, campaignId, roomId)}/scene-states/${segment(sceneStateId)}`),
    createSceneState: (id, campaignId, roomId, input) => json('POST', `${roomRoot(id, campaignId, roomId)}/scene-states`, input),
    updateSceneState: (id, campaignId, roomId, sceneStateId, input) => json('PATCH', `${roomRoot(id, campaignId, roomId)}/scene-states/${segment(sceneStateId)}`, input),
    archiveSceneState: (id, campaignId, roomId, sceneStateId) => json('POST', `${roomRoot(id, campaignId, roomId)}/scene-states/${segment(sceneStateId)}/archive`),
    duplicateSceneState: (id, campaignId, roomId, sceneStateId, input) => json('POST', `${roomRoot(id, campaignId, roomId)}/scene-states/${segment(sceneStateId)}/duplicate`, input),
  };
}

export const campaignRoomApiClient = createCampaignRoomApiClient();
